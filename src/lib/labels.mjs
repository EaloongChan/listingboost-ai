/**
 * 界面标签表
 *
 * 中英文两个版本的卡片 / 页面共用同一批组件，靠这个表切换文案。
 * 内容型翻译（工具简介、编辑点评、模型对比）在各自的数据文件里，字段带 En 后缀。
 */

export const ZH = {
  lang: 'zh-CN',
  visit: '访问',
  view: '查看',
  details: '详情',
  official: '官方',
  hot: '热门',
  new: 'NEW',
  directAccess: '国内直连',
  proxyAccess: '需境外访问',
  editorNote: '编辑点评',
  whenNotToUse: '什么时候别选它',
  pricing: { free: '免费', freemium: '免费+付费', paid: '付费', open: '开源自部署' },
  pricingCls: { free: 'badge-free', freemium: 'badge-paid', paid: 'badge-paid', open: 'badge-open' },
  toolsTitle: 'AI 工具库',
  modelsTitle: '模型选型库',
  officialDoc: '官方文档',
  modelList: '模型列表',
  versionAsOf: '时效',
  goThere: '前往',
  useFor: '适合',
  mainNav: '主导航',
  switchLang: 'Switch to English',
};

export const EN = {
  lang: 'en',
  visit: 'Visit',
  view: 'View',
  details: 'Details',
  official: 'Official',
  hot: 'Popular',
  new: 'NEW',
  directAccess: 'Direct from China',
  proxyAccess: 'VPN needed',
  editorNote: "Editor's note",
  whenNotToUse: 'When not to use it',
  pricing: { free: 'Free', freemium: 'Freemium', paid: 'Paid', open: 'Open source' },
  pricingCls: { free: 'badge-free', freemium: 'badge-paid', paid: 'badge-paid', open: 'badge-open' },
  toolsTitle: 'AI Tools',
  modelsTitle: 'Model Library',
  officialDoc: 'Official docs',
  modelList: 'Model list',
  versionAsOf: 'As of',
  goThere: 'Open',
  useFor: 'Best for',
  mainNav: 'Main navigation',
  switchLang: '切换到中文',
};

/** 取工具/模型的本地化字段，缺英文时回退到中文 */
export const pick = (obj, field, L) =>
  (L === EN ? obj[field + 'En'] : null) || obj[field];

/** 标签是受控词表，用字典翻译（245 个唯一标签，比逐条翻译工具划算得多）。
    字典由 build.mjs 在运行时挂到 EN.tagDict 上。 */
export const tagName = (g, L) => (L === EN && L.tagDict ? L.tagDict[g] || g : g);

/** 一批标签的本地化 */
export const tagList = (arr, L) => (arr || []).map((g) => tagName(g, L));
