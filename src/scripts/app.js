/* AI 万象 — 前端交互（无依赖）
   职责：主题切换 / 移动菜单 / 滚动进场 / 列表筛选与排序 /
        提示词变量填充与复制 / 全站搜索 / 快捷键 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------- 主题 ---------------- */
  function initTheme() {
    var btn = $('#themeBtn');
    if (!btn) return;
    var sun = $('.ic-sun', btn), moon = $('.ic-moon', btn);
    function sync() {
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      if (sun) sun.style.display = dark ? 'none' : '';
      if (moon) moon.style.display = dark ? '' : 'none';
    }
    sync();
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('aiwx-theme', next); } catch (e) {}
      sync();
    });
  }

  /* ---------------- 移动端菜单 ---------------- */
  function initMenu() {
    var btn = $('#menuBtn'), nav = $('#nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (nav.contains(e.target) || btn.contains(e.target)) return;
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- 滚动进场 ---------------- */
  var io = null;
  function initReveal(root) {
    var els = $$('.reveal:not(.in)', root || document);
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.01 });
    }
    els.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 10, 5) * 25 + 'ms';
      io.observe(el);
    });
  }

  /* ---------------- 提示词：变量填充 / 展开 / 复制 ----------------
     原始模板不再由服务端复制一份（data-raw），而是首次展开时从 <pre> 的
     textContent 取一次并缓存——未填变量时 textContent 就是原始模板。 */
  var RAW_CACHE = new WeakMap();

  function getRaw(card) {
    var hit = RAW_CACHE.get(card);
    if (hit !== undefined) return hit;
    var pre = $('.prompt-code pre', card);
    if (!pre) return '';
    var raw = pre.textContent; // entities 已由浏览器还原，等同于原始模板
    RAW_CACHE.set(card, raw);
    return raw;
  }

  /** 变量填充面板按需生成：填充本身是纯 JS 功能，没必要服务端渲染 */
  function ensureFillPanel(card) {
    if ($('.prompt-fill', card)) return;
    var raw = card.getAttribute('data-vars') || '';
    var vars = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!vars.length) return;
    var code = $('.prompt-code', card);
    if (!code) return;
    var panel = document.createElement('div');
    panel.className = 'prompt-fill';
    panel.setAttribute('data-fill', '');
    panel.innerHTML =
      '<div class="prompt-fill-head">' +
      '<span class="label"><span class="label-accent">变量填充</span> · 填完自动生成完整提示词</span>' +
      '<button class="btn btn-sm btn-ghost" data-fill-clear type="button">清空</button>' +
      '</div><div class="prompt-fill-grid">' +
      vars.map(function (v) {
        return '<label><span class="label">' + escapeHtml(v) + '</span>' +
          '<input type="text" data-var="' + escapeHtml(v) + '" placeholder="填入你的' + escapeHtml(v) + '" autocomplete="off"></label>';
      }).join('') +
      '</div>';
    code.parentNode.insertBefore(panel, code);
  }

  function fillTemplate(raw, values) {
    return raw.replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_m, k) {
      var key = k.trim();
      var v = values[key];
      if (v === undefined || v === null || String(v).trim() === '') {
        return '<span class="var-hl">{{' + escapeHtml(key) + '}}</span>';
      }
      return '<span class="filled">' + escapeHtml(String(v).trim()) + '</span>';
    });
  }

  function collectValues(card) {
    var out = {};
    $$('[data-var]', card).forEach(function (i) { out[i.getAttribute('data-var')] = i.value; });
    return out;
  }

  function refreshFilled(card) {
    var pre = $('.prompt-code pre', card);
    if (!pre) return;
    pre.innerHTML = fillTemplate(getRaw(card), collectValues(card));
  }

  function initPrompts() {
    document.addEventListener('click', function (e) {
      // 卡片右上角的操作按钮在 .prompt-head[data-accordion] 内部，
      // 必须优先放行，否则点收藏会连带展开/收起卡片
      if (e.target.closest('[data-save]') || e.target.closest('[data-cmp]') || e.target.closest('.card-actions')) return;
      var head = e.target.closest('[data-accordion]');
      if (head) {
        var card = head.closest('.prompt-card');
        if (card) {
          var opened = card.classList.toggle('open');
          if (opened) ensureFillPanel(card);
        }
        return;
      }
      var clr = e.target.closest('[data-fill-clear]');
      if (clr) {
        var c2 = clr.closest('.prompt-card');
        $$('[data-var]', c2).forEach(function (i) { i.value = ''; });
        refreshFilled(c2);
        return;
      }
      var btn = e.target.closest('[data-copy]');
      if (btn) {
        var wrap = btn.closest('.prompt-code');
        var pre = wrap && $('pre', wrap);
        if (!pre) return;
        // 复制的是“当前可见内容”，也就是填过变量的版本
        copyText(pre.textContent, btn);
      }
    });

    document.addEventListener('input', function (e) {
      var inp = e.target.closest('[data-var]');
      if (!inp) return;
      var card = inp.closest('.prompt-card');
      if (card) refreshFilled(card);
    });

    var all = $('[data-all-open]');
    if (all) {
      all.addEventListener('click', function () {
        var cards = $$('.prompt-card');
        var anyClosed = cards.some(function (c) { return !c.classList.contains('open'); });
        cards.forEach(function (c) {
          c.classList.toggle('open', anyClosed);
          if (anyClosed) ensureFillPanel(c);
        });
        all.textContent = anyClosed ? '全部收起' : '全部展开';
      });
    }
  }

  function copyText(text, btn) {
    var restore = btn.innerHTML;
    var done = function () {
      btn.classList.add('copied');
      btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg> 已复制';
      setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = restore; }, 1700);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
    } else {
      fallback(text, done);
    }
  }

  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    try { if (document.execCommand('copy')) done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------------- 列表：筛选 + 排序 ---------------- */
  function initFilter() {
    $$('[data-filter-root]').forEach(function (root) {
      var list = $('[data-list]', root);
      var countEl = $('[data-count]', root);
      var emptyEl = $('[data-empty]', root);
      var queryEl = $('[data-query]', root);
      var sortEl = $('[data-sort]', root);
      if (!list) return;

      var items = $$(':scope > *', list);
      var facetBtns = $$('[data-facet]', root);
      var facets = {};
      facetBtns.forEach(function (b) {
        var f = b.getAttribute('data-facet');
        (facets[f] = facets[f] || []).push(b);
      });
      var state = { q: '', facets: {}, toggles: {}, sort: 'default' };

      var sp = new URLSearchParams(location.search);
      if (sp.get('q') && queryEl) { state.q = sp.get('q').toLowerCase(); queryEl.value = sp.get('q'); }
      Object.keys(facets).forEach(function (f) {
        var v = sp.get(f);
        if (v && facets[f].some(function (b) { return b.getAttribute('data-value') === v; })) {
          state.facets[f] = v;
          return;
        }
        // 没有 URL 参数时，采用服务端已经标好的那个。
        // 踩过的坑：类型页 /models/3d/ 与分类页 /tools/coding/ 是用路径区分的，不带 ?kind= 参数，
        // 所以这里原本会把激活状态重置成「全部」—— 服务端渲染的 class="on" 被抹掉，
        // 用户看不出自己正在看哪个分类。以服务端渲染结果为准即可。
        var pre = facets[f].filter(function (b) { return b.classList.contains('on'); })[0];
        if (pre) state.facets[f] = pre.getAttribute('data-value');
      });
      if (sp.get('hot')) state.toggles.hot = true;
      if (sp.get('sort')) state.sort = sp.get('sort');

      function syncUI() {
        Object.keys(facets).forEach(function (f) {
          var active = state.facets[f] || 'all';
          facets[f].forEach(function (b) {
            var on = b.getAttribute('data-value') === active;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
        $$('[data-toggle]', root).forEach(function (b) {
          var k = b.getAttribute('data-toggle');
          var on = !!state.toggles[k];
          b.classList.toggle('btn-primary', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (sortEl) sortEl.value = state.sort;
      }

      function applySort() {
        if (state.sort === 'default') {
          items.forEach(function (it) { list.appendChild(it); });
          return;
        }
        var sorted = items.slice().sort(function (a, b) {
          if (state.sort === 'name') {
            return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '', 'zh');
          }
          return String(b.getAttribute('data-added') || '').localeCompare(String(a.getAttribute('data-added') || ''));
        });
        sorted.forEach(function (it) { list.appendChild(it); });
      }

      function apply() {
        applySort();
        var shown = 0;
        var q = state.q;
        items.forEach(function (it) {
          var ok = true;
          if (q && (it.getAttribute('data-name') || '').indexOf(q) === -1) ok = false;
          Object.keys(state.facets).forEach(function (f) {
            var v = state.facets[f];
            if (v && v !== 'all' && it.getAttribute('data-' + f) !== v) ok = false;
          });
          Object.keys(state.toggles).forEach(function (k) {
            if (state.toggles[k] && it.getAttribute('data-' + k) !== '1') ok = false;
          });
          it.classList.toggle('hidden', !ok);
          if (ok) { shown++; it.classList.add('in'); }
        });
        if (countEl) {
          countEl.textContent = '共 ' + shown + ' 条结果' + (q ? ' · 关键词「' + state.q + '」' : '');
        }
        if (emptyEl) emptyEl.classList.toggle('hidden', shown !== 0);
        list.classList.toggle('hidden', shown === 0);
      }

      if (queryEl) queryEl.addEventListener('input', function () {
        state.q = queryEl.value.trim().toLowerCase();
        apply();
      });
      facetBtns.forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-facet');
          state.facets[f] = b.getAttribute('data-value');
          syncUI();
          apply();
        });
      });
      $$('[data-toggle]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-toggle');
          state.toggles[k] = !state.toggles[k];
          syncUI();
          apply();
        });
      });
      if (sortEl) sortEl.addEventListener('change', function () {
        state.sort = sortEl.value;
        apply();
      });
      var reset = $('[data-reset]', root);
      if (reset) {
        reset.addEventListener('click', function () {
          state.q = ''; state.facets = {}; state.toggles = {}; state.sort = 'default';
          if (queryEl) queryEl.value = '';
          syncUI();
          apply();
        });
      }
      syncUI();
      apply();
    });
  }

  /* ---------------- 全站搜索 ---------------- */
  var TYPE_LABEL = { playbook: '场景', tool: '工具', prompt: '提示词', model: '模型', learn: '学习', glossary: '术语', news: '资讯' };
  var TYPE_ICON = {
    playbook: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18h5.5a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h5.5"/>',
    model: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
    tool: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
    prompt: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="2.4"/>',
    learn: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16.5H5.5A1.5 1.5 0 0 1 4 18z"/><path d="M4 18a1.5 1.5 0 0 1 1.5-1.5H19"/>',
    glossary: '<path d="M11 3.5H5.5A2 2 0 0 0 3.5 5.5V11a2 2 0 0 0 .6 1.4l7.5 7.5a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 0-2.8L13 3.9a2 2 0 0 0-1.4-.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    news: '<path d="M4 5h11a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1z"/><path d="M16 9h4v9a1 1 0 0 1-1 1h-3z"/>',
  };
  var ARROW = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg>';

  /* 结果的固定展示顺序：场景 → 工具 → 提示词 → 模型 → 学习 → 术语 → 资讯 */
  var TYPE_ORDER = ['playbook', 'tool', 'prompt', 'model', 'learn', 'glossary', 'news'];
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
      // 二元模糊：查询和字段的汉字二元组重合度够高就算弱命中
      if (t.length >= 2) {
        var bg = bigrams(t);
        if (bg.length) {
          var hit = 0;
          for (var k = 0; k < bg.length; k++) if (hay.indexOf(bg[k]) !== -1) hit++;
          var ratio = hit / bg.length;
          if (ratio >= 0.6) best = Math.max(best, w * 0.4 * ratio);
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
   */
  function scoreItem(it, terms, phraseSynonyms, queryMap) {
    // 路径 A
    var a = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var s = termScore(it, t);
      if (s === 0 && queryMap[t]) {
        var syns = queryMap[t];
        for (var j = 0; j < syns.length; j++) {
          s = Math.max(s, termScore(it, normalize(syns[j])) * 0.7);
          if (s > 0) break;
        }
      }
      if (s === 0) { a = 0; break; }  // 有一个词没着落就整条淘汰
      a += s;
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
        '<a class="btn btn-sm" href="' + escapeHtml(it.url) + '"' + ext + '>' + (it.ext ? '访问' : '查看') + ' ' + ARROW + '</a>' +
        (it.tags || []).slice(0, 2).map(function (t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('') +
        '</div></article>';
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

      // 归一化后按空格切词
      var q = normalize(raw);
      var terms = q.split(' ').filter(Boolean);

      // 整句意图映射：找出出现在查询里的词典键（「怎么本地跑模型」里含「本地跑模型」），
      // 把它们的等价说法收集起来，作为 OR 路径参与打分
      var phraseSynonyms = [];
      var phraseHit = '';
      for (var mi = 0; mi < mapKeys.length; mi++) {
        var key = normalize(mapKeys[mi]);
        if (key && q.indexOf(key) !== -1) {
          phraseSynonyms = phraseSynonyms.concat(queryMap[mapKeys[mi]]);
          if (!phraseHit) phraseHit = mapKeys[mi];
        }
      }

      var scored = [];
      for (var i = 0; i < idx.length; i++) {
        var it = idx[i];
        if (type !== 'all' && it.t !== type) continue;
        var sc = scoreItem(it, terms, phraseSynonyms, queryMap);
        if (sc > 0) {
          // 同样命中时，热门的、标题短的排前面
          if (it.hot) sc += 2;
          scored.push({ it: it, sc: sc });
        }
      }
      scored.sort(function (a, b) { return b.sc - a.sc; });
      var hits = scored.map(function (x) { return x.it; });

      if (countEl) countEl.textContent = '共 ' + hits.length + ' 条结果' + (phraseHit ? '（已按「' + phraseHit + '」扩展了等价说法）' : '');
      if (noneEl) noneEl.classList.toggle('hidden', hits.length !== 0);

      if (type !== 'all') {
        // 指定类型：直接平铺，最多 100 条
        list.classList.remove('search-grouped');
        list.innerHTML = hits.slice(0, 100).map(card).join('');
        return;
      }

      // 全部：按类型分组，保证每类都能被看到，不被高数量类型淹没
      list.classList.add('search-grouped');
      var present = TYPE_ORDER.filter(function (t) {
        return hits.some(function (h) { return h.t === t; });
      });
      list.innerHTML = present.map(function (t) {
        var g = hits.filter(function (h) { return h.t === t; });
        var head = '<div class="search-group-head">' +
          '<span class="label label-accent">' + escapeHtml(TYPE_LABEL[t]) + '</span>' +
          '<span class="tag num">' + g.length + '</span>' +
          '</div>';
        var more = g.length > GROUP_CAP
          ? '<div class="search-more">还有 ' + (g.length - GROUP_CAP) + ' 条，点上方「' + escapeHtml(TYPE_LABEL[t]) + '」看全部</div>'
          : '';
        return '<section class="search-group">' + head +
          '<div class="grid">' + g.slice(0, GROUP_CAP).map(card).join('') + '</div>' + more + '</section>';
      }).join('');
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

  /* ---------------- 快捷键 ---------------- */
  function initShortcut() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      e.preventDefault();
      var i = $('#globalSearch') || $('[data-query]');
      if (i) i.focus(); else location.href = '/search/';
    });
  }

  /* ---------------- 深链定位提示词 ---------------- */
  function initHashOpen() {
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (el && el.classList.contains('prompt-card')) {
      el.classList.add('open');
      el.classList.add('in');
      ensureFillPanel(el);
      setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
    }
  }

  /* ---------------- 实时动态：绝对时间 → 相对时间 ----------------
     静态站构建时算出来的「今天/昨天」一旦页面变旧就会说谎，
     所以服务端只输出绝对时间（MM-DD HH:mm），由浏览器按当前时间换算。 */
  function initRelTime() {
    var els = $$('time[datetime][data-abs]');
    if (!els.length) return;
    var now = Date.now();
    els.forEach(function (el) {
      var t = Date.parse(el.getAttribute('datetime'));
      if (Number.isNaN(t)) return;
      var mins = Math.round((now - t) / 60000);
      var label;
      if (mins < 0) label = el.getAttribute('data-abs');
      else if (mins < 1) label = '刚刚';
      else if (mins < 60) label = mins + ' 分钟前';
      else if (mins < 60 * 24) label = Math.floor(mins / 60) + ' 小时前';
      else if (mins < 60 * 24 * 7) label = Math.floor(mins / 1440) + ' 天前';
      else label = el.getAttribute('data-abs');
      el.textContent = label;
      el.title = new Date(t).toLocaleString('zh-CN', { hour12: false });
    });
  }

  /* ---------------- 工具对比 ----------------
     选择存在 localStorage，不上传任何数据。最多同时对比 4 个。 */
  var CMP_KEY = 'aiwx-compare';
  var CMP_MAX = 4;
  var PRICING_LABEL = { free: '免费', freemium: '免费+付费', paid: '付费', open: '开源自部署' };

  function readCmp() {
    try {
      var raw = JSON.parse(localStorage.getItem(CMP_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(function (x) { return typeof x === 'string'; }).slice(0, CMP_MAX) : [];
    } catch (e) { return []; }
  }

  function writeCmp(ids) {
    try { localStorage.setItem(CMP_KEY, JSON.stringify(ids.slice(0, CMP_MAX))); } catch (e) {}
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'cmp-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 260);
    }, 1900);
  }

  function toggleCmp(id) {
    var ids = readCmp();
    var i = ids.indexOf(id);
    if (i !== -1) {
      ids.splice(i, 1);
    } else {
      if (ids.length >= CMP_MAX) { toast('最多同时对比 ' + CMP_MAX + ' 个，先去掉一个吧'); return; }
      ids.push(id);
    }
    writeCmp(ids);
    syncCmp(ids);
  }

  /** 同步全站所有对比按钮、浮动条，以及对比页的表格 */
  function syncCmp(ids) {
    ids = ids || readCmp();
    $$('[data-cmp]').forEach(function (b) {
      var on = ids.indexOf(b.getAttribute('data-cmp')) !== -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (b.hasAttribute('data-cmp-label')) {
        b.innerHTML = on
          ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg> 已加入对比'
          : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> 加入对比';
      }
      b.setAttribute('aria-label', on ? '从对比中移除' : '加入对比');
    });
    $$('[data-cmp-add]').forEach(function (b) {
      b.setAttribute('aria-pressed', ids.indexOf(b.getAttribute('data-cmp-add')) !== -1 ? 'true' : 'false');
    });
    renderCmpBar(ids);
    renderCmpTable(ids);
  }

  function ensureCmpBar() {
    var bar = $('#cmpBar');
    if (bar) return bar;
    if (!$('[data-cmp]') && !$('[data-cmp-add]')) return null;
    if ($('#cmpRoot')) return null; // 对比页本身不需要浮动条
    bar = document.createElement('div');
    bar.className = 'cmp-bar';
    bar.id = 'cmpBar';
    bar.innerHTML = '<span class="label">已选 <b id="cmpBarN">0</b> / ' + CMP_MAX + '</span>' +
      '<button class="btn btn-sm" type="button" id="cmpBarClear">清空</button>' +
      '<a class="btn btn-sm btn-primary" href="/compare/">去对比</a>';
    document.body.appendChild(bar);
    bar.addEventListener('click', function (e) {
      if (e.target.closest('#cmpBarClear')) { writeCmp([]); syncCmp([]); }
    });
    return bar;
  }

  /** 两条浮动条同时出现时上下错开（收藏在对比之上） */
  function positionBars() {
    var cmp = $('#cmpBar'), save = $('#saveBar');
    var cmpOn = cmp && cmp.classList.contains('show');
    if (cmp) cmp.style.bottom = '20px';
    if (save) save.style.bottom = cmpOn ? '78px' : '20px';
  }

  function renderCmpBar(ids) {
    var bar = ensureCmpBar();
    if (!bar) return;
    var n = $('#cmpBarN', bar);
    if (n) n.textContent = ids.length;
    bar.classList.toggle('show', ids.length > 0);
    positionBars();
  }

  var CMP_DIMS = [
    { label: '分类', get: function (t) { return t.catName; } },
    { label: '价格模式', get: function (t) { return PRICING_LABEL[t.pricing] || t.pricing; } },
    { label: '国内直连', get: function (t) { return t.cn ? '可以直连' : '需要自备访问方式'; } },
    { label: '是否官方', get: function (t) { return t.official ? '官方产品' : '第三方 / 社区'; } },
    { label: '精选热门', get: function (t) { return t.hot ? '是' : '—'; } },
    { label: '收录日期', get: function (t) { return t.added || '未记录'; } },
    { label: '标签', wide: true, get: function (t) { return (t.tags || []).join(' · ') || '—'; } },
    { label: '一句话说明', wide: true, get: function (t) { return t.desc; } },
    { label: '什么时候别选它', wide: true, get: function (t) { return t.caveat || '—'; } },
  ];

  function renderCmpTable(ids) {
    var root = $('#cmpRoot');
    if (!root) return;
    var idx = window.__AIWX_TOOLS__ || [];
    var byId = {};
    idx.forEach(function (t) { byId[t.id] = t; });

    var picked = ids.map(function (id) { return byId[id]; }).filter(Boolean);
    var emptyEl = $('#cmpEmpty');
    var resEl = $('#cmpResult');
    if (!picked.length) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (resEl) resEl.classList.add('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    if (resEl) resEl.classList.remove('hidden');

    var cnt = $('#cmpCount');
    if (cnt) cnt.textContent = '正在对比 ' + picked.length + ' 个工具';

    var head = '<thead><tr><th>维度</th>' + picked.map(function (t) {
      return '<th><div class="cmp-head-in">' +
        '<span class="avatar" style="--c:' + t.accent + ';--c-fg:#fff">' + escapeHtml(t.name.slice(0, 2)) + '</span>' +
        '<span><b>' + escapeHtml(t.name) + '</b><span class="label">' + escapeHtml(t.catName) + '</span></span>' +
        '<button class="cmp-remove" type="button" data-cmp-remove="' + escapeHtml(t.id) + '" aria-label="移除 ' + escapeHtml(t.name) + '">' +
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button></div></th>';
    }).join('') + '</tr></thead>';

    var body = '<tbody>' + CMP_DIMS.map(function (d) {
      var vals = picked.map(function (t) { return String(d.get(t) == null ? '' : d.get(t)); });
      var same = vals.every(function (v) { return v === vals[0]; });
      return '<tr class="' + (same ? 'is-same' : 'is-diff') + '">' +
        '<th>' + (same ? '' : '<span class="cmp-mark" aria-hidden="true"></span>') + escapeHtml(d.label) + '</th>' +
        vals.map(function (v) { return '<td' + (d.wide ? ' class="wide"' : '') + '>' + escapeHtml(v || '—') + '</td>'; }).join('') +
        '</tr>';
    }).join('') +
      '<tr class="is-diff"><th><span class="cmp-mark" aria-hidden="true"></span>官网</th>' +
      picked.map(function (t) {
        return '<td><a class="btn btn-sm" href="' + escapeHtml(t.url) + '" target="_blank" rel="noopener nofollow">访问 ' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg></a>' +
          '<a class="btn btn-sm btn-ghost" style="margin-left:6px" href="/tools/' + escapeHtml(t.cat) + '/' + escapeHtml(t.id) + '/">详情</a></td>';
      }).join('') + '</tr>' +
      '</tbody>';

    var tbl = $('#cmpTable');
    if (tbl) tbl.innerHTML = '<table class="cmp-table">' + head + body + '</table>';
  }

  /** 生成可粘贴到文档里的纯文本对比结果 */
  function cmpToText() {
    var idx = window.__AIWX_TOOLS__ || [];
    var byId = {};
    idx.forEach(function (t) { byId[t.id] = t; });
    var picked = readCmp().map(function (id) { return byId[id]; }).filter(Boolean);
    if (!picked.length) return '';
    var lines = [['维度'].concat(picked.map(function (t) { return t.name; })).join('\t')];
    CMP_DIMS.forEach(function (d) {
      lines.push([d.label].concat(picked.map(function (t) { return String(d.get(t) || '—').replace(/\t/g, ' '); })).join('\t'));
    });
    lines.push(['官网'].concat(picked.map(function (t) { return t.url; })).join('\t'));
    return lines.join('\n');
  }

  function initCompare() {
    // 分享链接：/compare/?t=chatgpt,claude,deepseek
    // 打开带参数的链接时并入当前选择，别人发来的对比能直接看到
    var sp = new URLSearchParams(location.search);
    if (sp.get('t') && $('#cmpRoot')) {
      var idx = window.__AIWX_TOOLS__ || [];
      var valid = {};
      idx.forEach(function (t) { valid[t.id] = 1; });
      var merged = readCmp();
      sp.get('t').split(',').forEach(function (id) {
        id = id.trim();
        if (valid[id] && merged.indexOf(id) === -1 && merged.length < CMP_MAX) merged.push(id);
      });
      writeCmp(merged);
    }

    syncCmp();
    // 事件委托：兼容动态插入的按钮
    document.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-cmp-remove]');
      if (rm) {
        var ids = readCmp().filter(function (x) { return x !== rm.getAttribute('data-cmp-remove'); });
        writeCmp(ids); syncCmp(ids);
        return;
      }
      var add = e.target.closest('[data-cmp-add]');
      if (add) { toggleCmp(add.getAttribute('data-cmp-add')); return; }
      if (e.target.closest('[data-cmp]')) {
        var b = e.target.closest('[data-cmp]');
        toggleCmp(b.getAttribute('data-cmp'));
        return;
      }
      if (e.target.closest('#cmpClear')) { writeCmp([]); syncCmp([]); return; }
      if (e.target.closest('#cmpFillHot')) {
        writeCmp(['chatgpt', 'claude', 'deepseek']);
        syncCmp();
        toast('已放入 3 个热门工具，可按需调整');
        return;
      }
      if (e.target.closest('#savedClear')) { writeSaved([]); syncSave([]); return; }
      if (e.target.closest('#cmpShare')) {
        var ids2 = readCmp();
        if (!ids2.length) return;
        copyText(location.origin + '/compare/?t=' + ids2.join(','), e.target.closest('#cmpShare'));
        return;
      }
      if (e.target.closest('#cmpCopy')) {
        var txt = cmpToText();
        if (!txt) return;
        copyText(txt, e.target.closest('#cmpCopy'));
        return;
      }
    });
    // 其他标签页改了选择时同步
    window.addEventListener('storage', function (e) {
      if (e.key === CMP_KEY) syncCmp(readCmp());
    });
  }

  /* ---------------- 收藏 ----------------
     统一用 "type:id" 作为 key，跨内容类型共用一个清单。 */
  var SAVE_KEY = 'aiwx-saved';

  function readSaved() {
    try {
      var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(function (x) { return typeof x === 'string' && x.indexOf(':') > 0; }) : [];
    } catch (e) { return []; }
  }

  function writeSaved(list) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function toggleSave(key) {
    var list = readSaved();
    var i = list.indexOf(key);
    var adding = i === -1;
    if (adding) list.unshift(key); else list.splice(i, 1);
    writeSaved(list);
    syncSave(list);
    if (adding) toast('已收藏，可在「我的收藏」里查看');
  }

  function syncSave(list) {
    list = list || readSaved();
    var set = {};
    list.forEach(function (k) { set[k] = 1; });
    $$('[data-save]').forEach(function (b) {
      var on = !!set[b.getAttribute('data-save')];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? '取消收藏' : '收藏');
      var use = b.querySelector('use');
      if (use) use.setAttribute('href', on ? '#i-star-fill' : '#i-star');
      b.classList.toggle('is-on', on);
      b.setAttribute('title', on ? '取消收藏' : '收藏');
    });
    renderSaveBar(list);
    renderSavedPage(list);
  }

  function ensureSaveBar() {
    var bar = $('#saveBar');
    if (bar) return bar;
    if (!$('[data-save]')) return null;
    if ($('#savedRoot')) return null;
    bar = document.createElement('a');
    bar.className = 'cmp-bar save-bar';
    bar.id = 'saveBar';
    bar.href = '/saved/';
    bar.innerHTML = '<span class="label">已收藏 <b id="saveBarN">0</b> 项</span>' +
      '<span class="btn btn-sm btn-primary">查看收藏</span>';
    document.body.appendChild(bar);
    return bar;
  }

  function renderSaveBar(list) {
    var bar = ensureSaveBar();
    if (!bar) return;
    var n = $('#saveBarN', bar);
    if (n) n.textContent = list.length;
    bar.classList.toggle('show', list.length > 0);
    positionBars();
  }

  var TYPE_LABEL2 = { playbook: '场景', tool: '工具', prompt: '提示词', model: '模型', learn: '学习', glossary: '术语', news: '资讯' };
  var SAVE_ORDER = ['tool', 'prompt', 'playbook', 'model', 'learn', 'news', 'glossary'];
  var SAVE_SCHEMA_KEY = 'aiwx-saved-v1';

  function renderSavedPage(list) {
    var root = $('#savedRoot');
    if (!root) return;
    var idx = window.__AIWX_INDEX__ || [];
    var byKey = {};
    idx.forEach(function (it) { byKey[it.t + ':' + it.id] = it; });

    var items = list.map(function (k) { return byKey[k]; }).filter(Boolean);
    var missing = list.length - items.length; // 数据里已不存在的收藏（下架/改名）

    var emptyEl = $('#savedEmpty');
    var bodyEl = $('#savedBody');
    var toolbar = $('#savedToolbar');
    if (!items.length) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (bodyEl) bodyEl.innerHTML = '';
      if (toolbar) toolbar.classList.add('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    if (toolbar) toolbar.classList.remove('hidden');

    var cnt = $('#savedCount');
    if (cnt) cnt.textContent = '共收藏 ' + items.length + ' 项' + (missing ? '（另有 ' + missing + ' 项已下架，已自动忽略）' : '');

    // 按内容类型分组，顺序固定，保证每次进来位置一致
    var groups = SAVE_ORDER.map(function (t) {
      var g = items.filter(function (it) { return it.t === t; });
      if (!g.length) return '';
      return '<section class="section" style="padding:0 0 34px">' +
        '<div class="search-group-head"><span class="label label-accent">' + TYPE_LABEL2[t] + '</span>' +
        '<span class="tag num">' + g.length + '</span></div>' +
        '<div class="grid">' + g.slice(0, 40).map(savedCard).join('') + '</div></section>';
    }).join('');

    if (bodyEl) bodyEl.innerHTML = groups;
  }

  function savedCard(it) {
    var ext = it.ext ? ' target="_blank" rel="noopener nofollow"' : '';
    var href = it.detail || it.url;
    var iconPath = TYPE_ICON[it.t] || TYPE_ICON.tool;
    return '<article class="card reveal in">' +
      '<div class="card-top">' +
      '<span class="avatar" style="--c:var(--accent-btn);--c-fg:var(--accent-fg)">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + iconPath + '</svg></span>' +
      '<div style="min-width:0;flex:1">' +
      '<h3 class="card-title"><a class="name" href="' + escapeHtml(href) + '">' + escapeHtml(it.title) + '</a></h3>' +
      '<div class="card-cat">' + escapeHtml(TYPE_LABEL2[it.t]) + (it.sub ? ' / ' + escapeHtml(it.sub) : '') + '</div>' +
      '</div></div>' +
      '<p class="card-desc">' + escapeHtml(it.desc) + '</p>' +
      '<div class="card-foot spread">' +
      '<a class="btn btn-sm" href="' + escapeHtml(it.url) + '"' + ext + '>' + (it.ext ? '访问' : '查看') + ' ' + ARROW + '</a>' +
      (it.detail ? '<a class="btn btn-sm btn-ghost" href="' + escapeHtml(it.detail) + '">详情</a>' : '') +
      '</div>' +
      '<div class="card-actions"><button class="act-btn act-save" type="button" data-save="' +
      escapeHtml(it.t + ':' + it.id) + '" aria-pressed="true" aria-label="取消收藏">' +
      '<svg class="ic ic-star" width="14" height="14" aria-hidden="true"><use href="#i-star-fill"/></svg>' +
      '</button></div>' +
      '</article>';
  }

  function initSaved() {
    syncSave();
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-save]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      toggleSave(b.getAttribute('data-save'));
    }, true); // 捕获阶段，避免被卡片内的其他处理器抢走
    window.addEventListener('storage', function (e) {
      if (e.key === SAVE_KEY) syncSave(readSaved());
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    initTheme();
    initMenu();
    initReveal();
    initPrompts();
    initFilter();
    initSearch();
    initShortcut();
    initHashOpen();
    initRelTime();
    initCompare();
    initSaved();
    renderSaveBar(readSaved());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
