/**
 * 内联 SVG 图标库（stroke 风格，跟随 currentColor）
 *
 * 用 SVG sprite 输出：每个图标在页面里只定义一次（<symbol>），
 * 用到的地方只写 <svg><use href="#i-xxx"/></svg>。
 * 实测：提示词页 233 个图标从 59KB 降到约 12KB。
 *
 * 用法：icon('search', 18)
 */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="2.4"/>',
  news: '<path d="M4 5h11a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1z"/><path d="M16 9h4v9a1 1 0 0 1-1 1h-3z"/><path d="M7 9h6M7 12.5h6M7 16h4"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16.5H5.5A1.5 1.5 0 0 1 4 18z"/><path d="M4 18a1.5 1.5 0 0 1 1.5-1.5H19"/>',
  'book-open': '<path d="M12 6.5C10.5 5 8.5 4.3 5 4.3v13c3.5 0 5.5.7 7 2.2 1.5-1.5 3.5-2.2 7-2.2v-13c-3.5 0-5.5.7-7 2.2z"/><path d="M12 6.5v13"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.4"/>',
  chat: '<path d="M20 12.5a7.5 7.5 0 0 1-10.9 6.7L4 20.5l1.4-4.9A7.5 7.5 0 1 1 20 12.5z"/>',
  code: '<path d="M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4M13.2 5.5l-2.4 13"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M3.5 17.5 9 12.5l3.5 3 3-2.5 4.5 4"/>',
  video: '<rect x="3" y="5.5" width="13" height="13" rx="2"/><path d="M16 10.5 21 8v8l-5-2.5z"/>',
  audio: '<path d="M4 10v4M8 7v10M12 4.5v15M16 7.5v9M20 10v4"/>',
  pen: '<path d="M16.5 3.9 20 7.4 9.2 18.2l-4.6 1.1 1.1-4.6z"/><path d="M14.3 6.1l3.5 3.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  bot: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4.5V8M8.5 13v1.5M15.5 13v1.5M2.5 12.5v3M21.5 12.5v3"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.9-.8 1.9-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-4-4-7-9-7z"/><circle cx="7.8" cy="11.5" r="1.2"/><circle cx="11" cy="7.8" r="1.2"/><circle cx="15.5" cy="9.2" r="1.2"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="14" width="3" height="3" rx="1"/>',
  cube: '<path d="M12 3 20.5 7.5v9L12 21 3.5 16.5v-9z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  server: '<rect x="3" y="4" width="18" height="6.5" rx="2"/><rect x="3" y="13.5" width="18" height="6.5" rx="2"/><path d="M7 7.2h.01M7 16.7h.01"/>',
  bolt: '<path d="M13.5 3 5 13.5h5.5L10 21l8.5-10.5H13z"/>',
  megaphone: '<path d="M3.5 10.5v3l3 .5 1 5 2-.5-.8-4.3 8.8 2.8V5L7 9z"/><path d="M19 10.2v3.6a2.5 2.5 0 0 0 0-3.6z"/>',
  heart: '<path d="M12 20.3 4.9 13.2a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6a4.6 4.6 0 0 1 6.5 6.5z"/>',
  mask: '<path d="M3.5 5.5h17v6.5a7 7 0 0 1-3.5 6l-3.2 1.7a3.5 3.5 0 0 1-3.6 0L7 18A7 7 0 0 1 3.5 12z"/><path d="M8.5 11h1.5M14 11h1.5M9 15.2c1.8.9 4.2.9 6 0"/>',
  seed: '<path d="M12 21c0-5 3-8 8-9-1 5-4 8-8 9z"/><path d="M12 21c0-5-3-8-8-9 1 5 4 8 8 9z"/><path d="M12 21V11"/>',
  briefcase: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M3 12.5h18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  'arrow-right': '<path d="M4 12h15M13 6l6 6-6 6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
  'chevron-down': '<path d="M6 9.5 12 15.5l6-6"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  external: '<path d="M14 4.5h5.5V10"/><path d="M19 5 10.5 13.5"/><path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4"/>',
  filter: '<path d="M3.5 5.5h17l-6.5 7.6V20l-4-2.4v-4.5z"/>',
  layers: '<path d="M12 3 3.5 7.5 12 12l8.5-4.5z"/><path d="M3.5 12.5 12 17l8.5-4.5M3.5 17 12 21.5l8.5-4.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.7 13.7 8.5 15.5l1.8-5.2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>',
  tag: '<path d="M11 3.5H5.5A2 2 0 0 0 3.5 5.5V11a2 2 0 0 0 .6 1.4l7.5 7.5a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 0-2.8L13 3.9a2 2 0 0 0-1.4-.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7 12 12.8 20.5 7"/>',
  send: '<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5-7.5-4z"/>',
  zap: '<path d="M13.5 3 5 13.5h5.5L10 21l8.5-10.5H13z"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"/>',
  star: '<path d="M12 3.5 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6M3.2 14.5h17.6"/><path d="M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3z"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  file: '<path d="M13 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V9z"/><path d="M13 3.5V9h5.5"/>',
  inbox: '<path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4"/><path d="M5.8 4.5h12.4l1.8 9v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-5z"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5V10H9"/><path d="M12 8v4.5l3 1.8"/>',
  rocket: '<path d="M12.5 3.5c3.5 0 8 4.5 8 8l-4 4-4-4 4-4c-3.5 0-8 4.5-8 8l-4 4c0-3.5 0-12 8-12z"/><path d="M6 18c-1.5 1.5-2 3-2 3s1.5-.5 3-2"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
  alert: '<path d="M12 3.8 21 19.5H3z"/><path d="M12 9.5v4.5M12 16.6v.4"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18h5.5a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h5.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  flow: '<rect x="3" y="3.5" width="7" height="5.5" rx="1.2"/><rect x="3" y="15" width="7" height="5.5" rx="1.2"/><rect x="14" y="9.2" width="7" height="5.5" rx="1.2"/><path d="M10 6.2h2a2 2 0 0 1 2 2v1M10 17.8h2a2 2 0 0 0 2-2v-1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  star: '<path d="M12 3.5 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9z"/>',
  'star-fill': '<path d="M12 3.5 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9z" fill="currentColor"/>',
};

/** 本页已用到的图标名，layout() 收尾时据此生成 sprite */
const used = new Set();

/** 无论是否出现都要进 sprite 的图标（运行时会被换 href 的成对变体） */
const ALWAYS = ['star', 'star-fill'];

export function icon(name, size = 18, cls = '') {
  const key = Object.prototype.hasOwnProperty.call(P, name) ? name : 'grid';
  used.add(key);
  return `<svg class="ic ${cls}" width="${size}" height="${size}" aria-hidden="true"><use href="#i-${key}"/></svg>`;
}

/** 每个页面渲染前调用，避免上一页的图标泄漏到这一页的 sprite 里 */
export function resetIcons() {
  used.clear();
}

/** 输出本页用到的全部 <symbol>，必须放在页面里任何 <use> 之前 */
export function iconSprite() {
  const names = [...new Set([...used, ...ALWAYS])].filter((n) => P[n]).sort();
  if (!names.length) return '';
  const body = names.map(
    (n) => `<symbol id="i-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[n]}</symbol>`,
  ).join('');
  return `<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(P, name);
}
