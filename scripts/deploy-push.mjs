/**
 * 推送本地站点到 GitHub（会触发 Vercel 自动部署）
 *
 *   node scripts/deploy-push.mjs            推送 main 分支
 *   node scripts/deploy-push.mjs --dry      只检查和备份，不覆盖 main
 *
 * 安全设计：**先备份后覆盖**
 *   1. 先把远端当前的 main 取下来，存成一个归档分支
 *   2. 归档分支确认推到远端成功之后，才强制覆盖 main
 *   3. 任何一步失败就停下，不会出现「旧的没了、新的也没上去」的局面
 *
 * 需要 GitHub 凭据。本机已装 Git Credential Manager，首次运行会弹浏览器授权。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = 'archive/listingboost-ai-v1';
const DRY = process.argv.includes('--dry');

const line = (s = '') => console.log(s);
const rule = () => line('  ' + '─'.repeat(60));

/** 跑 git，返回 stdout；失败抛错（把 stderr 带出来） */
function git(args, opts = {}) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: opts.inherit ? '1' : '0' },
    });
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
    const err = new Error(msg.split('\n').slice(0, 4).join('\n'));
    err.raw = msg;
    throw err;
  }
}

const has = (args) => {
  try { git(args); return true; } catch { return false; }
};

function main() {
  line('');
  line('  推送到线上');
  rule();

  /* ---------- 0. 前置检查 ---------- */
  if (!fs.existsSync(path.join(ROOT, '.git'))) {
    line('  ✗ 当前目录不是 git 仓库');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(ROOT, 'dist'))) {
    line('  ! dist/ 不存在，先在本地跑一次 node scripts/build.mjs 确认能构建成功');
    line('    （线上是让 Vercel 自己构建的，本地只是为了提前发现问题）');
  }

  let remote = '';
  try { remote = git(['remote', 'get-url', 'origin']).trim(); } catch { /* 下面统一报错 */ }
  if (!remote) {
    line('  ✗ 没有配置 origin 远端');
    process.exit(1);
  }
  line(`  远端        ${remote}`);

  // 代理状态：国内直连 GitHub 常常不通，先把当前状态打出来，省得排查
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || '';
  const gitProxy = (() => { try { return git(['config', '--get', 'http.proxy']).trim(); } catch { return ''; } })();
  line(`  代理        ${gitProxy ? `git 配置 ${gitProxy}` : proxy ? `环境变量 ${proxy}` : '未配置（直连）'}`);

  // 未提交的改动
  const dirty = git(['status', '--porcelain']).trim();
  if (dirty) {
    line(`  ! 有 ${dirty.split('\n').length} 个文件还没提交，本次推送不会包含它们：`);
    dirty.split('\n').slice(0, 6).forEach((l) => line(`      ${l}`));
    line('    先执行 git add -A && git commit -m "..." 再跑本脚本');
  }

  const branch = (() => { try { return git(['rev-parse', '--abbrev-ref', 'HEAD']).trim(); } catch { return 'main'; } })();
  const localSha = (() => { try { return git(['rev-parse', '--short', 'HEAD']).trim(); } catch { return ''; } })();
  line(`  本地分支    ${branch} @ ${localSha}`);

  /* ---------- 1. 探测远端 main 是否存在 ---------- */
  line('');
  line('  [1/3] 读取远端状态');
  let remoteMain = '';
  try {
    const out = git(['ls-remote', '--heads', 'origin', 'main']);
    remoteMain = (out.trim().split(/\s+/)[0] || '');
  } catch (e) {
    line('  ✗ 连不上 GitHub。');
    if (!proxy && !gitProxy) {
      line('     当前没有配置代理。国内直连 GitHub 经常不通，如果确实需要代理，');
      line('     先设置一次（把端口换成你自己代理的）：');
      line('       git config --global http.proxy  http://127.0.0.1:端口');
      line('       git config --global https.proxy http://127.0.0.1:端口');
    } else {
      line('     已经配了代理但还是不通，确认代理软件在运行、端口没变。');
      line('     临时绕过代理试试： set HTTPS_PROXY= && node scripts/deploy-push.mjs');
    }
    line(`     原始错误：${e.message.split('\n')[0]}`);
    process.exit(1);
  }
  line(remoteMain ? `  远端 main   ${remoteMain.slice(0, 7)}` : '  远端 main   不存在（首次推送）');

  /* ---------- 2. 备份远端 main ---------- */
  line('');
  line('  [2/3] 备份远端现有的 main');
  if (!remoteMain) {
    line('  远端还没有 main，跳过备份');
  } else {
    const already = has(['ls-remote', '--exit-code', '--heads', 'origin', ARCHIVE]);
    if (already) {
      line(`  归档分支 ${ARCHIVE} 已存在，跳过（旧内容已经保全）`);
    } else {
      line('  正在下载远端 main 的完整历史……');
      try {
        git(['fetch', 'origin', 'main', '--tags'], { inherit: true });
      } catch {
        line('  ✗ 下载远端历史失败，为避免旧内容丢失，已中止。');
        line('     网络恢复后重试即可，或者改用 --dry 只做检查。');
        process.exit(1);
      }
      try {
        git(['branch', '-f', 'archive-local-listingboost', 'FETCH_HEAD']);
        line(`  已存入本地分支 archive-local-listingboost`);
      } catch {
        line('  ! 本地归档分支创建失败（不致命，继续尝试推到远端）');
      }
      line('  正在把旧内容推成远端归档分支……');
      try {
        git(['push', 'origin', `FETCH_HEAD:refs/heads/${ARCHIVE}`], { inherit: true });
        line(`  ✓ 旧内容已保存到远端分支 ${ARCHIVE}`);
      } catch {
        line('  ✗ 归档分支推送失败。为避免旧内容彻底丢失，没有覆盖 main。');
        line('     先解决推送权限问题（会弹浏览器授权），再重跑本脚本。');
        process.exit(1);
      }
    }
  }

  /* ---------- 3. 覆盖 main ---------- */
  line('');
  if (DRY) {
    line('  [3/3] --dry：跳过了覆盖 main 的步骤');
    rule();
    line('  检查完成。（没有改动远端 main）');
    line('');
    return;
  }
  line('  [3/3] 推送到 main');
  try {
    git(['push', 'origin', `${branch}:main`, '--force'], { inherit: true });
  } catch {
    line('  ✗ 推送失败。常见原因：');
    line('     · 授权窗口被关掉了 → 重跑本脚本，会再弹一次');
    line('     · 账号没有该仓库的写权限');
    process.exit(1);
  }

  rule();
  line('  推送完成 ✓');
  line('');
  line('  接下来：');
  line('    · Vercel 会自动拉取这次提交并重新构建（约 1 分钟）');
  line('    · 在 Vercel 项目的 Deployments 页可以看到构建日志');
  line('    · 首次部署时留意构建是否用了 vercel.json 里的配置：');
  line('      framework=null / buildCommand=node scripts/build.mjs / outputDirectory=dist');
  line(`    · 旧版网站的内容保留在分支 ${ARCHIVE}，随时可以切回去`);
  line('');
}

main();
