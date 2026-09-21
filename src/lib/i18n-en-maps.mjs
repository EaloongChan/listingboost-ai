/**
 * 中文厂商名与模型名的英文对照。
 *
 * 英文站上直接显示「腾讯」「通义万相」对英文读者没有意义；
 * 但也不能机械翻译（「面壁智能」不是 "Wall-facing AI"），所以用查表。
 * 表里没有的按规则处理：把「系列」变成 family、「模型线」变成 line。
 */
export const VENDOR_EN = {
  "阿里巴巴": "Alibaba",
  "深度求索": "DeepSeek",
  "智谱 AI": "Zhipu AI",
  "月之暗面": "Moonshot AI",
  "字节跳动": "ByteDance",
  "腾讯": "Tencent",
  "百度": "Baidu",
  "科大讯飞": "iFlytek",
  "阶跃星辰": "StepFun",
  "快手": "Kuaishou",
  "爱诗科技": "PixVerse",
  "社区": "Community",
  "智源研究院": "BAAI",
  "零一万物": "01.AI",
  "面壁智能": "ModelBest",
  "上海人工智能实验室": "Shanghai AI Lab",
  "昆仑万维": "Kunlun",
  "商汤": "SenseTime",
  "生数": "Shengshu",
  "生数科技": "Shengshu",
  "上海 AI Lab": "Shanghai AI Lab",
  "小红书": "RedNote",
  "开源研究": "Open research",
  "开源社区": "Open community"
};

export const NAME_EN = {
  "豆包": "Doubao",
  "即梦": "Jimeng",
  "通义万相": "Tongyi Wanxiang",
  "混元视频": "Hunyuan Video",
  "文心系列": "ERNIE",
  "星火系列": "Spark",
  "海螺视频": "Hailuo Video",
  "书生系列": "InternLM",
  "天工系列": "Skywork",
  "日日新系列": "SenseNova",
  "混元系列": "Hunyuan",
  "o 系列（推理）": "o family (reasoning)",
  "可灵 Kling": "Kling",
  "Grok 推理线": "Grok reasoning line"
};

export function vendorEn(v) {
  if (!v) return '';
  // 有些条目是「VAST / 生数」这样的复合名，要逐段映射再拼回去
  return String(v).split('/').map((part) => {
    const k = part.trim();
    return VENDOR_EN[k] || k;
  }).join(' / ');
}

export function modelNameEn(name) {
  if (!name) return '';
  if (NAME_EN[name]) return NAME_EN[name];
  let s = name;
  for (const [zh, en] of Object.entries(NAME_EN)) s = s.split(zh).join(en);
  s = s.replace(/系列$/g, 'family')
       .replace(/系列/g, ' family')
       .replace(/模型线$/g, 'line')
       .replace(/向量线$/g, 'line')
       .replace(/\s+/g, ' ')
       .trim();
  return s;
}

/** 中文工具名的英文写法。官方有英文名的用官方的，没有的用通行叫法。 */
export const TOOL_NAME_EN = {
  "豆包": "Doubao",
  "通义千问": "Qwen Chat",
  "智谱清言": "ChatGLM",
  "海螺 AI": "Hailuo AI",
  "即梦 AI": "Jimeng AI",
  "可灵 Kling": "Kling",
  "海螺视频": "Hailuo Video",
  "MiniMax 语音": "MiniMax Speech",
  "秘塔写作猫": "Metaso Write",
  "腾讯文档 AI": "Tencent Docs AI",
  "秘塔 AI 搜索": "Metaso Search",
  "天工 AI": "Tiangong AI",
  "扣子 Coze": "Coze",
  "稿定 AI": "Gaoding AI",
  "腾讯元宝": "Tencent Yuanbao",
  "文心一言": "ERNIE Bot",
  "讯飞星火": "iFlytek Spark",
  "百小应": "Baixiaoying",
  "跃问": "Yuewen",
  "商量 SenseChat": "SenseChat",
  "360 智脑": "360 Zhinao",
  "通义灵码": "Lingma",
  "文心快码": "Comate",
  "通义万相": "Tongyi Wanxiang",
  "文心一格": "ERNIE ViLG",
  "无界 AI": "Wujie AI",
  "Bing 图像创建器": "Bing Image Creator",
  "腾讯混元视频": "Hunyuan Video",
  "剪映": "CapCut",
  "海绵音乐": "Haimian Music",
  "飞书智能伙伴": "Feishu AI",
  "沉浸式翻译": "Immersive Translate",
  "讯飞智文": "iFlytek SmartDoc",
  "有道 AI 翻译": "Youdao Translate",
  "Motiff 妙多": "Motiff",
  "即时设计": "JsDesign",
  "腾讯混元 3D": "Hunyuan3D",
  "Tripo 3D 生成工作流": "Tripo 3D workflow",
  "巨量创意": "Ocean Engine Creative",
  "蝉妈妈": "Chanmama",
  "新榜": "Newrank",
  "飞书妙记": "Feishu Minutes",
  "腾讯会议 AI 小助手": "Tencent Meeting AI",
  "通义听悟": "Tingwu",
  "讯飞听见": "iFlytek Hearing",
  "钉钉 AI 助理": "DingTalk AI",
  "学而思九章": "Jiuzhang",
  "豆包爱学": "Doubao Learn"
};

export function toolNameEn(name) {
  return TOOL_NAME_EN[name] || name;
}
