/**
 * 推送本地站点到 GitHub（触发 Vercel 自动部署）
 *
 *   node scripts/deploy-push.mjs              直接覆盖远端 main
 *   node scripts/deploy-push.mjs --dry        只检查，不动远端
 *   node scripts/deploy-push.mjs --backup     覆盖前先把远端 main 存成归档分支
 *
 * 走 SSH 而不是 HTTPS：实测国内 SSH 22 端口直连可用，HTTPS 必须走代理且经常 502。
 *
 * 关于备份：默认**不做**归档，直接覆盖。真正的安全网是 Vercel 自己——
 * 它保留每一次部署记录，随时能在面板上回滚到上一个版本，比 git 分支更好用。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = 'archive/listingboost-ai-v1';
const KEY_PATH = '~/.ssh/id_ed25519_github.pub';
const DRY = process.argv.includes('--dry');
const BACKUP = process.argv.includes('--backup');

const line = (s = '') => console.log(s);
const rule = () => line('  ' + '─'.repeat(62));

function git(args, opts = {}) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
    const err = new Error(msg.split('\n').slice(0, 3).join('\n'));
    err.raw = msg;
    throw err;
  }
}

async function main() {
  line('');
  line('  推送到线上');
  rule();

  /* ---------- 0. 前置检查 ---------- */
  if (!fs.existsSync(path.join(ROOT, '.git'))) {
    line('  ✗ 当前目录不是 git 仓库');
    process.exit(1);
  }

  const remote = (() => { try { return git(['remote', 'get-url', 'origin']).trim(); } catch { return ''; } })();
  if (!remote) {
    line('  ✗ 没有配置 origin 远端');
    process.exit(1);
  }
  line(`  远端        ${remote}`);
  if (!/^git@/.test(remote)) {
    line('  ! 远端不是 SSH 地址。HTTPS 在国内必须走代理且不稳定，建议改成 SSH：');
    line('    git remote set-url origin git@github.com:EaloongChan/listingboost-ai.git');
  }

  const dirty = git(['status', '--porcelain']).trim();
  if (dirty) {
    const n = dirty.split('\n').length;
    line(`  ! 有 ${n} 个文件没提交，本次推送不包含它们：`);
    dirty.split('\n').slice(0, 6).forEach((l) => line(`      ${l}`));
    if (n > 6) line(`      … 还有 ${n - 6} 个`);
    line('    要一起推的话先：git add -A && git commit -m "..."');
  }

  const branch = (() => { try { return git(['rev-parse', '--abbrev-ref', 'HEAD']).trim(); } catch { return 'main'; } })();
  const sha = (() => { try { return git(['rev-parse', '--short', 'HEAD']).trim(); } catch { return ''; } })();
  line(`  本地        ${branch} @ ${sha}`);

  /* ---------- 1. 验证 SSH 密钥可用 ---------- */
  line('');
  line('  [1/3] 检查 SSH 授权');
  /* 重试几次再下结论。
     踩过一次：网络抖动导致 ssh -T 超时，脚本立刻判定「没配公钥」，
     让用户去 GitHub 加 key —— 但 key 本来就是好的，再推一次就成功了。
     **把瞬时故障说成配置问题，是比直接报错更糟的失败方式。** */
  let sshOk = false;
  let sshOut = '';
  let attempts = 0;
  for (; attempts < 3 && !sshOk; attempts++) {
    if (attempts) { line(`      · 第 ${attempts} 次没通，重试…`); await new Promise((r) => setTimeout(r, 2000)); }
    try {
      const out = execFileSync('ssh', ['-T', 'git@github.com'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 25000 });
      sshOut = out;
      sshOk = /successfully authenticated/i.test(out);
    } catch (e) {
      sshOut = ((e.stdout || '') + (e.stderr || '')).toString();
      // ssh -T 认证成功时也返回非 0，所以靠输出判断
      sshOk = /successfully authenticated/i.test(sshOut);
      // 明确的鉴权拒绝才是真的缺公钥
      if (/permission denied \(publickey\)/i.test(sshOut)) break;
    }
  }

  if (!sshOk) {
    // 分清「网络不通」和「真的没配公钥」—— 两者的处理方式完全不同
    const looksNetwork = !/permission denied \(publickey\)/i.test(sshOut);
    if (looksNetwork) {
      line('  ✗ 连不上 GitHub，但**看不出来是公钥的问题**（更像是网络/代理不通）。');
      line('');
      line('    你的公钥很可能本来就是好的，先直接试一次推送：');
      line('      git push origin main');
      line('');
      line('    如果上面这条报 Permission denied (publickey)，再回来跑本脚本按提示加公钥。');
      line('');
      line('    原始输出：' + (sshOut.trim().split('\n').slice(-2).join(' | ') || '(空)'));
      process.exit(1);
    }
    line('  ✗ GitHub 说没认出这台机器（公钥认证被拒）。需要用一次公钥，之后永久免密。');
    line('');
    line('    要加的公钥（这一整行，复制到 GitHub）:');
    line('');
    try {
      const pub = fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519_github.pub'), 'utf8').trim();
      line('    ' + pub);
    } catch {
      line('    ✗ 读不到 ~/.ssh/id_ed25519_github.pub，密钥可能没生成成功');
    }
    line('');
    line('    加到哪里：');
    line('      https://github.com/settings/ssh/new');
    line('      Title 随便填（比如 workbuddy），Key type 选 Authentication Key，粘贴上面的整行，Save');
    line('');
    line('    加完再跑一次本脚本即可。这是一次性的，以后所有推送（包括每日自动化）都不用再操作。');
    process.exit(1);
  }
  line('  ✓ SSH 授权正常');

  /* ---------- 2. 可选：归档 ---------- */
  line('');
  if (BACKUP) {
    line('  [2/3] 归档远端现有的 main');
    let remoteMain = '';
    try {
      remoteMain = (git(['ls-remote', '--heads', 'origin', 'main']).trim().split(/\s+/)[0] || '');
    } catch (e) {
      line(`  ✗ 读不到远端 main：${e.message.split('\n')[0]}`);
      process.exit(1);
    }
    if (!remoteMain) {
      line('  远端还没有 main，跳过');
    } else {
      const exists = (() => { try { git(['ls-remote', '--exit-code', '--heads', 'origin', ARCHIVE]); return true; } catch { return false; } })();
      if (exists) {
        line(`  ${ARCHIVE} 已存在，跳过`);
      } else {
        git(['fetch', 'origin', 'main'], { inherit: true });
        git(['push', 'origin', `FETCH_HEAD:refs/heads/${ARCHIVE}`], { inherit: true });
        line(`  ✓ 旧内容已存到远端分支 ${ARCHIVE}`);
      }
    }
  } else {
    line('  [2/3] 跳过归档（默认直接覆盖）');
    line('  真正的回滚安全网是 Vercel：它保留每次部署，面板上可一键回滚到旧版本');
    line('  想保留 git 归档就加 --backup');
  }

  /* ---------- 3. 推送 ---------- */
  line('');
  if (DRY) {
    line('  [3/3] --dry：不推送');
    rule();
    line('  检查完成，远端未改动。');
    line('');
    return;
  }
  line('  [3/3] 覆盖远端 main');
  try {
    git(['push', 'origin', `${branch}:main`, '--force'], { inherit: true });
  } catch {
    line('  ✗ 推送失败，看上面的 git 报错。');
    process.exit(1);
  }

  rule();
  line('  推送完成 ✓');
  line('');

  /* ---------- 4. 确认 Vercel 真的部署成功了 ----------
     踩过一次：vercel.json 里有个 Vercel 不认识的字段，部署静默失败，
     但线上继续服务上一次成功的版本 —— 页面看着完全正常，
     verify-live 也全绿，我白推了两轮才发现。所以推完必须查部署状态。 */
  line('  等待 Vercel 构建……');
  const repoPath = (() => {
    const m = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    return m ? `${m[1]}/${m[2]}` : '';
  })();
  const headSha = (() => { try { return git(['rev-parse', 'HEAD']).trim(); } catch { return ''; } })();

  if (!repoPath || !headSha) {
    line('  ! 拿不到仓库信息，跳过部署状态检查');
    line('');
    return;
  }

  const API = `https://api.github.com/repos/${repoPath}/commits/${headSha}/status`;
  let final = 'pending';
  for (let i = 1; i <= 24; i++) {            // 最多等约 4 分钟
    await new Promise((r) => setTimeout(r, 10000));
    try {
      const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'AIWanxiangDeploy' } });
      const j = await res.json();
      const vercel = (j.statuses || []).find((s) => /vercel/i.test(s.context || ''));
      if (!vercel) { process.stdout.write(`\r    第 ${i} 次：还没有状态记录…   `); continue; }
      final = vercel.state;
      process.stdout.write(`\r    第 ${i} 次：${vercel.state}                        `);
      if (vercel.state !== 'pending') break;
    } catch {
      process.stdout.write(`\r    第 ${i} 次：查询失败，重试…   `);
    }
  }
  line('');
  line('');

  if (final === 'success') {
    line('  ✓ Vercel 部署成功，线上已是最新版本');
    line('');
  } else if (final === 'pending') {
    line('  ! 4 分钟内没等到结果，去 Vercel 面板确认一下');
    line('');
  } else {
    line('  ✗ **Vercel 部署失败**。线上现在还是上一个版本的页面，看着正常但其实没更新。');
    line('');
    line('  排查顺序：');
    line('    1. 打开 https://vercel.com/dashboard 看这次构建的日志');
    line('    2. 最常见原因是 vercel.json 里有 Vercel 不认识的字段（本地 node scripts/check.mjs 能查出来）');
    line('    3. 改完重新跑本脚本');
    line('');
    process.exitCode = 1;
  }
}

await main();
