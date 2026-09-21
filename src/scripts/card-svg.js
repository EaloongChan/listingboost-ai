/* AI 万象 — 卡片用到的 SVG 片段（类型图标 + 箭头）
   抽出来自一个简单的原因：这些东西同时被「搜索结果卡」和「我的收藏页」使用，
   而这两套渲染分别住在 search.js 和 app.js 里。各存一份的话，将来改一处就会
   变成两个页面图标不一致却不报错的静默漂移 —— 和 toolCard 写死站内路径那次同类。

   加载方式：普通 <script>（不带 defer），保证在 defer 的 app.js / search.js 之前执行。
   凡是要渲染卡片的页面都必须引入它。缺了并不会报错（会退化成空图标），
   所以 scripts/check.mjs 里有守卫盯着这些页面有没有带上它。 */
(function () {
  'use strict';
  window.__AIWX_SVG__ = {
    types: {
      playbook: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18h5.5a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h5.5"/>',
      model: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
      tool: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
      prompt: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="2.4"/>',
      learn: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16.5H5.5A1.5 1.5 0 0 1 4 18z"/><path d="M4 18a1.5 1.5 0 0 1 1.5-1.5H19"/>',
      glossary: '<path d="M11 3.5H5.5A2 2 0 0 0 3.5 5.5V11a2 2 0 0 0 .6 1.4l7.5 7.5a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 0-2.8L13 3.9a2 2 0 0 0-1.4-.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
      news: '<path d="M4 5h11a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1z"/><path d="M16 9h4v9a1 1 0 0 1-1 1h-3z"/>',
    },
    arrow: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg>',
  };
})();
