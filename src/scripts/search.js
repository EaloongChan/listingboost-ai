/* AI 万象 — 全站搜索（无依赖，只在搜索页加载）
   为什么和 app.js 分开：这套打分/分组逻辑只在 /search/ 生效，其余页面一律在
   initSearch 第一行就 return。曾经它被塞进每个页面都要下的 app.js，
   等于给 691 个用不上搜索的页面平摊了 ~370 行。
   搜索页本来就要下一个 200KB+ 的内嵌索引，多一个文件在网络上没有额外代价。

   界面文案从 window.__AIWX_UI__ 读，搜索页负责注入自己语言的那一份。
   为什么不让英文站另写一套渲染：搜索的难点全在打分与分组（中文还多一层二元切分），
   那些逻辑与语言无关。复制一份出来意味着以后每次改打分都要改两处，迟早会分叉。
   这里只把「要显示什么字」参数化，逻辑保持唯一。 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------- 全站搜索 ----------------
     界面文案从 window.__AIWX_UI__ 读，搜索页负责注入自己语言的那一份。
     为什么不让英文站另写一套渲染：搜索的难点全在打分与分组（中文还多一层二元切分），
     那些逻辑与语言无关。复制一份出来意味着以后每次改打分都要改两处，
     迟早会分叉。这里只把「要显示什么字」参数化，逻辑保持唯一。 */
  var UI = window.__AIWX_UI__ || {};
  var TYPE_LABEL = UI.types || { playbook: '场景', tool: '工具', prompt: '提示词', model: '模型', learn: '学习', glossary: '术语', news: '资讯' };
  var T = {
    visit: UI.visit || '访问',
    view: UI.view || '查看',
    countPrefix: UI.countPrefix !== undefined ? UI.countPrefix : '共 ',
    countSuffix: UI.countSuffix !== undefined ? UI.countSuffix : ' 条结果',
    expandedPrefix: UI.expandedPrefix !== undefined ? UI.expandedPrefix : '（已按「',
    expandedSuffix: UI.expandedSuffix !== undefined ? UI.expandedSuffix : '」扩展了等价说法）',
    morePrefix: UI.morePrefix !== undefined ? UI.morePrefix : '还有 ',
    moreMiddle: UI.moreMiddle !== undefined ? UI.moreMiddle : ' 条，点上方「',
    moreSuffix: UI.moreSuffix !== undefined ? UI.moreSuffix : '」看全部',
    // 答案卡（问「什么叫 X」时把术语定义单独提到最前）
    answerRelated: UI.answerRelated || '相关术语',
    answerMore: UI.answerMore || '在术语表里查看',
    /* 术语详情页的链接前缀必须按语言走：写死 /glossary/ 的话，
       英文搜索页的答案卡会把英文读者送回中文术语表 —— 和 toolCard 那次 2574 条
       错链是同一类错误，只是规模小一点。默认给中文站，英文页自己传。 */
    glossPath: UI.glossPath || '/glossary/?q=',
  };
  /* 类型图标 / 箭头由 card-svg.js 统一提供：同一份也被「我的收藏」页使用，
     在这里再写一份就会变成两处图标悄悄不一致。 */
  var SVG = window.__AIWX_SVG__ || {};
  var TYPE_ICON = SVG.types || {};
  var ARROW = SVG.arrow || '';

  /* 结果的固定展示顺序：场景 → 工具 → 提示词 → 模型 → 学习 → 术语 → 资讯
     英文站没有 learn / news（这两块刻意不翻），它的页面会通过 __AIWX_UI__.order 传自己的顺序。 */
  var TYPE_ORDER = UI.order || ['playbook', 'tool', 'prompt', 'model', 'learn', 'glossary', 'news'];
  var GROUP_CAP = 12;

  /* ---------------- 检索的文本处理 ----------------
     中文没有空格，简单 indexOf 对中文召回很差：
     搜「怎么本地跑模型」匹配不到「本地部署」。
     这里做三件事：归一化、二元切分、字段加权。仍是零依赖。 */

  /** 归一化：全角转半角、标点转空格、统一小写 */
  function normalize(s) {
    return String(s || '')
      .replace(/[\uFF01-\uFF5E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xfee0); })
      .replace(/[\u3000-\u303F\u2018\u2019\u201C\u201D\u2014\u2026]/g, ' ')
      .toLowerCase()
      .replace(/[\s\-_/]+/g, ' ')
      .trim();
  }

  /** 中文二元切分：把连续汉字切成相邻两字组合，用于模糊召回 */
  function bigrams(s) {
    var cjk = String(s || '').replace(/[^\u4e00-\u9fa5]/g, '');
    var out = [];
    for (var i = 0; i < cjk.length - 1; i++) out.push(cjk.slice(i, i + 2));
    return out;
  }

  /* 字段权重：标题 ≫ 别名 > 标签 > 分类 > 描述 > 编辑点评
     编辑点评权重最低，因为它论述性的文字容易造成误命中。 */
  var FIELDS = [
    ['title', 10],
    ['alias', 8],
    ['tags', 5],
    ['sub', 4],
    ['desc', 3],
    ['caveat', 2],
  ];

  function fieldValue(it, key) {
    if (key === 'tags') return normalize((it.tags || []).join(' ') + ' ' + (it.extras || []));
    if (key === 'alias') return normalize((it.alias || []).join(' '));
    return normalize(it[key]);
  }

  /** 单个词对一个条目的得分；0 表示没命中 */
  function termScore(it, t) {
    var best = 0;
    for (var i = 0; i < FIELDS.length; i++) {
      var hay = fieldValue(it, FIELDS[i][0]);
      if (!hay) continue;
      var w = FIELDS[i][1];
      if (hay.indexOf(t) !== -1) {
        best = Math.max(best, w);
        continue;
      }
      /* 二元模糊：查询和字段的汉字二元组重合度够高就算弱命中。
         踩过一次：原来是纯比例阈值（≥0.6），短查询没问题，长查询必挂——
         「AI 帮我刷题备考」的二元组是 帮我/我刷/刷题/题备/备考，
         命中「备考」只有 1/5=0.2，被一刀切掉，用户搜不到明明存在的备考手册。
         改成「命中绝对个数」和「比例」双轨：只要命中的二元组够多（≥2 且 ≥0.3），
         或者比例足够高，都算命中。长句往往只命中它真正想搜的那两三个字，
         绝对个数才是能反映这个信号的指标。 */
      if (t.length >= 2) {
        var bg = bigrams(t);
        if (bg.length) {
          var hit = 0;
          for (var k = 0; k < bg.length; k++) if (hay.indexOf(bg[k]) !== -1) hit++;
          var ratio = hit / bg.length;
          var enough = (hit >= 2 && ratio >= 0.3) || ratio >= 0.6;
          if (enough) best = Math.max(best, w * 0.4 * Math.max(ratio, Math.min(1, hit / 4)));
        }
      }
    }
    return best;
  }

  /**
   * 整条命中的总分。两条路径取较大值：
   *   路径 A —— 按词 AND 匹配（查询被拆成多个词时，每个词都要有下落）
   *   路径 B —— 整句同义词 OR 匹配（「画图」这类说法本身不在站内词汇里）
   *
   * 踩过的坑：一开始把同义词直接拼进 terms，等于要求结果同时匹配「画图」和「文生图」，
   * 而查询本身就命中不了，于是永远 0 结果。同义词必须是 OR 而不是 AND。
   *
   * covered 记录被意图短语「认领」掉的词位置。为什么必须有它：
   * 「turn long article into social posts」里 social posts 已经进词表了，
   * 可 turn / into 在站内任何字段都不存在——继续要求它们命中，结果就是 0 条。
   * 被已知短语覆盖过的词，不该再参与 AND。
   */
  function scoreItem(it, terms, phraseSynonyms, queryMap, covered) {
    // 路径 A
    var a = 0;
    var alive = 0;      // 参与 AND 判断的词数（没被意图短语认领走的）
    var missing = 0;    // 其中没命中的
    for (var i = 0; i < terms.length; i++) {
      if (covered && covered[i]) continue;
      alive++;
      var t = terms[i];
      var s = termScore(it, t);
      if (s === 0 && queryMap[t]) {
        var syns = queryMap[t];
        for (var j = 0; j < syns.length; j++) {
          s = Math.max(s, termScore(it, normalize(syns[j])) * 0.7);
          if (s > 0) break;
        }
      }
      if (s === 0) missing++;
      else a += s;
    }

    /* 长难句放宽：全部命中最好；部分命中不直接判死，而是按覆盖率平方打折。
       为什么改成这样：口语化的长查询（「turn long article into social posts」）
       总有几个词在站内客观上不存在，严格 AND 会把唯一对的结果也筛掉。
       平方惩罚让「全命中」依然明显排在前面，同时保证用户还能看到东西。
       下限 0.5 覆盖率 + 至少一个强命中（标题/别名/标签层），防止收音式乱来。 */
    if (missing > 0) {
      var ratio = alive ? (alive - missing) / alive : 0;
      var strongHit = false;
      for (var si = 0; si < terms.length; si++) {
        if (covered && covered[si]) continue;
        if (termScore(it, terms[si]) >= 5) { strongHit = true; break; }
      }
      a = ratio >= 0.5 && strongHit ? a * ratio * ratio : 0;
    }

    // 路径 B
    var b = 0;
    for (var k = 0; k < phraseSynonyms.length; k++) {
      b = Math.max(b, termScore(it, normalize(phraseSynonyms[k])) * 0.7);
      if (b >= 7) break;
    }

    return Math.max(a, b);
  }

  function initSearch() {
    var input = $('#globalSearch');
    var list = $('#searchResults');
    var countEl = $('#searchCount');
    var emptyEl = $('#searchEmpty');
    var noneEl = $('#searchNone');
    if (!input || !list) return;

    var idx = window.__AIWX_INDEX__ || [];
    var queryMap = window.__AIWX_QUERY_MAP__ || {};
    var type = 'all';
    var sp = new URLSearchParams(location.search);
    if (sp.get('q')) input.value = sp.get('q');

    // 词汇表也参与键匹配：用户输的是「本地跑模型」，键里有就映射
    var mapKeys = Object.keys(queryMap);

    function card(it) {
      var ext = it.ext ? ' target="_blank" rel="noopener nofollow"' : '';
      var iconPath = TYPE_ICON[it.t] || TYPE_ICON.tool;
      // 有站内详情页时，标题指向详情页；「访问」按钮仍然直达外部官网
      var title = it.detail
        ? '<a class="name" href="' + escapeHtml(it.detail) + '">' + escapeHtml(it.title) + '</a>'
        : '<span class="name">' + escapeHtml(it.title) + '</span>';
      return '<article class="card reveal in">' +
        '<div class="card-top">' +
        '<span class="avatar" style="--c:var(--accent-btn);--c-fg:var(--accent-fg)">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + iconPath + '</svg>' +
        '</span>' +
        '<div style="min-width:0;flex:1">' +
        '<h3 class="card-title">' + title + '</h3>' +
        '<div class="card-cat">' + escapeHtml(TYPE_LABEL[it.t]) + (it.sub ? ' / ' + escapeHtml(it.sub) : '') + '</div>' +
        '</div></div>' +
        '<p class="card-desc">' + escapeHtml(it.desc) + '</p>' +
        '<div class="card-foot">' +
        '<a class="btn btn-sm" href="' + escapeHtml(it.url) + '"' + ext + '>' + (it.ext ? T.visit : T.view) + ' ' + ARROW + '</a>' +
        (it.tags || []).slice(0, 2).map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('') +
        '</div></article>';
    }

    /* ---------- 答案卡：问「什么叫 X」时直接给定义 ----------
       普通卡片只给一行描述，而用户在问定义时想要的是：这个词到底是什么意思、
       英文叫什么、还能顺手看哪些相邻概念。这些条目里都有（en / abbr / related），
       只是卡片没地方放，所以单独提一张卡到结果最前面。 */
    function answerCard(it) {
      var rel = (it.rel || []).filter(Boolean);
      var meta = [];
      if (it.sub) meta.push(escapeHtml(it.sub));
      if (it.en && it.en !== it.title) meta.push('英文 <span class="mono">' + escapeHtml(it.en) + '</span>');
      if (it.abbr) meta.push('缩写 <span class="mono">' + escapeHtml(it.abbr) + '</span>');
      return '<div class="answer-card">' +
        '<div class="answer-head">' +
        '<span class="label label-accent">' + escapeHtml(TYPE_LABEL.glossary || '术语') + '</span>' +
        '<h2 class="answer-term">' + escapeHtml(it.title) + '</h2>' +
        '</div>' +
        '<p class="answer-def">' + escapeHtml(it.desc) + '</p>' +
        (meta.length ? '<p class="answer-meta">' + meta.join(' · ') + '</p>' : '') +
        (rel.length ? '<p class="answer-rel">' + escapeHtml(T.answerRelated) + '：' +
          rel.map(function (t) {
            return '<a href="' + escapeHtml(T.glossPath + encodeURIComponent(t)) + '">' + escapeHtml(t) + '</a>';
          }).join('<span class="dot-sep">/</span>') + '</p>' : '') +
        (it.detail ? '<a class="btn btn-sm" href="' + escapeHtml(it.detail) + '">' +
          escapeHtml(T.answerMore) + ' ' + ARROW + '</a>' : '') +
        '</div>';
    }

    function render() {
      var raw = input.value.trim();
      if (!raw) {
        list.innerHTML = '';
        if (countEl) countEl.textContent = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (noneEl) noneEl.classList.add('hidden');
        return;
      }
      if (emptyEl) emptyEl.classList.add('hidden');

      /* 停用词：中文口语里的虚词、英文里的功能词。
         删掉它们是因为打分是 AND 的——有一个词没着落整条就被淘汰，
         「notes app with ai」里的 with 会让 Notion AI 永远搜不到。 */
      var STOPWORDS = {
        '的': 1, '了': 1, '吗': 1, '啊': 1, '呢': 1, '把': 1, '被': 1, '给': 1, '我想': 1, '帮我': 1,
        '怎么': 1, '如何': 1, '什么': 1, '哪些': 1, '可以': 1, '有没有': 1, '有没有推荐': 1,
        // 带疑问尾巴的组合也要删：用户搜「什么叫 prompt」，剩下那个「什么叫」在站内
        // 任何字段里都不存在，要求它命中就等于把真正的答案整条淘汰。
        '什么叫': 1, '叫什么': 1, '是什么': 1, '是什么意思': 1, '啥是': 1, '怎么用': 1, '该不该': 1,
        'the': 1, 'a': 1, 'an': 1, 'and': 1, 'or': 1, 'with': 1, 'for': 1, 'to': 1, 'of': 1,
        'in': 1, 'on': 1, 'is': 1, 'are': 1, 'do': 1, 'does': 1, 'i': 1, 'my': 1, 'me': 1,
        'need': 1, 'want': 1, 'best': 1, 'good': 1, 'app': 1, 'tool': 1, 'tools': 1, 'using': 1,
      };

      // 归一化后按空格切词
      var q = normalize(raw);
      var terms = q.split(' ').filter(Boolean).filter(function (t) { return !STOPWORDS[t]; });
      if (!terms.length) terms = [q];   // 全是停用词时退回整句，至少别崩出来空结果

      // 整句意图映射：找出出现在查询里的词典键（「怎么本地跑模型」里含「本地跑模型」），
      // 把它们的等价说法收集起来，作为 OR 路径参与打分
      var phraseSynonyms = [];
      var phraseHit = '';
      var covered = [];
      for (var mi = 0; mi < mapKeys.length; mi++) {
        var rawKey = mapKeys[mi];
        var key = normalize(rawKey);
        if (key && q.indexOf(key) !== -1) {
          phraseSynonyms = phraseSynonyms.concat(queryMap[rawKey]);
          if (!phraseHit) phraseHit = rawKey;
          // 这个词表里命中了，就把 key 里的词标记为「已认领」，它们不再参与 AND
          var keyTerms = key.split(' ');
          for (var ti = 0; ti < terms.length; ti++) {
            if (keyTerms.indexOf(terms[ti]) !== -1) covered[ti] = 1;
          }
          // 中文整块输入时（terms 只有一块），key 是这块的子串也算整块被认领
          if (terms.length === 1 && key.length >= 2) covered[0] = 1;
        }
      }

      /* 定义意图识别：搜「什么叫 X」「X 是什么」「what is X」时，
         用户要的是术语解释，不是一堆用到这个词的工具。
         站点确实有术语表（92 条），但默认排序下会被「描述里提到过它」的工具压住，
         所以识别到这类问法就给术语条目加权。 */
      /* 「什么是 X」和「X 是什么」是两种写法，两种都要认。
         踩过：只写了「是什么」，于是「什么是 rag」完全没触发送答案卡的逻辑。 */
      var defIntent = /什么叫|叫什么|是什么|什么是|什么意思|啥是|啥意思|的定义|definition of|what is|what's|meaning of/i.test(raw);

      var scored = [];
      for (var i = 0; i < idx.length; i++) {
        var it = idx[i];
        if (type !== 'all' && it.t !== type) continue;
        var sc = scoreItem(it, terms, phraseSynonyms, queryMap, covered);
        if (defIntent && it.t === 'glossary') sc *= 1.8;
        if (sc > 0) {
          // 同样命中时，热门的、标题短的排前面
          if (it.hot) sc += 2;
          scored.push({ it: it, sc: sc });
        }
      }
      scored.sort(function (a, b) { return b.sc - a.sc; });
      var hits = scored.map(function (x) { return x.it; });

      if (countEl) countEl.textContent = T.countPrefix + hits.length + T.countSuffix + (phraseHit ? T.expandedPrefix + phraseHit + T.expandedSuffix : '');
      if (noneEl) noneEl.classList.toggle('hidden', hits.length !== 0);

      // 定义类提问：把排在最前的术语词条提一张答案卡出来（可能没有，那就只出列表）
      var answer = '';
      if (defIntent) {
        for (var ai = 0; ai < hits.length; ai++) {
          if (hits[ai].t === 'glossary') { answer = answerCard(hits[ai]); break; }
        }
      }

      if (type !== 'all') {
        // 指定类型：直接平铺，最多 100 条
        list.classList.remove('search-grouped');
        list.innerHTML = answer + hits.slice(0, 100).map(card).join('');
        return;
      }

      // 全部：按类型分组，保证每类都能被看到，不被高数量类型淹没
      list.classList.add('search-grouped');
      /* 定义类提问时把术语组提到最前：TYPE_ORDER 里 glossary 排第 6，
         而搜「什么叫 X」的人要的就是那一条术语解释——放在最后等于让他划五屏。 */
      var order = defIntent ? ['glossary'].concat(TYPE_ORDER.filter(function (t) { return t !== 'glossary'; })) : TYPE_ORDER;
      var present = order.filter(function (t) {
        return hits.some(function (h) { return h.t === t; });
      });
      var groups = present.map(function (t) {
        var g = hits.filter(function (h) { return h.t === t; });
        var head = '<div class="search-group-head">' +
          '<span class="label label-accent">' + escapeHtml(TYPE_LABEL[t]) + '</span>' +
          '<span class="tag num">' + g.length + '</span>' +
          '</div>';
        var more = g.length > GROUP_CAP
          ? '<div class="search-more">' + T.morePrefix + (g.length - GROUP_CAP) + T.moreMiddle + escapeHtml(TYPE_LABEL[t]) + T.moreSuffix + '</div>'
          : '';
        return '<section class="search-group">' + head +
          '<div class="grid">' + g.slice(0, GROUP_CAP).map(card).join('') + '</div>' + more + '</section>';
      }).join('');
      // 答案卡永远在最前面：分组视图里术语组的 section 位置由 TYPE_ORDER 决定，
      // 而问定义的人不该先划过四五个分组才看到答案
      list.innerHTML = answer + groups;
    }

    input.addEventListener('input', render);
    $$('[data-type]').forEach(function (b) {
      b.addEventListener('click', function () {
        type = b.getAttribute('data-type');
        $$('[data-type]').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('btn-primary', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        render();
      });
    });
    render();
    input.focus();
  }

  initSearch();
})();
