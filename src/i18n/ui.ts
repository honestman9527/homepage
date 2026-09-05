export const languages = {
  zh: "中文",
  en: "English",
};

export type Language = keyof typeof languages;

export const defaultLanguage: Language = "zh";

/**
 * English lives under the `/en/` prefix; Chinese (the default) has no prefix.
 */
export const languagePrefixes: Record<Language, string> = {
  zh: "",
  en: "/en",
};

export const ui = {
  zh: {
    "site.title": "Dream — 主页",
    "site.description": "Dream 的个人主页。项目、写作与实验。",
    "nav.home": "首页",
    "nav.projects": "项目",
    "nav.blog": "博客",
    "nav.about": "关于",
    "sidebar.elsewhere": "其他地方",
    "home.available": "接受新项目委托",
    "home.bio": "开发者，构建界面、工具与偶尔的实验。",
    "home.location": "互联网 · 远程",
    "contact.email": "hello@example.com",
    "blog.title": "博客",
    "blog.subtitle": "笔记与文章",
    "blog.viewAll": "查看全部",
    "blog.readPost": "阅读全文",
    "projects.title": "项目",
    "projects.subtitle": "我做过的东西",
    "projects.liveDemo": "在线演示",
    "about.title": "关于",
    "about.subtitle": "简单介绍",
    "about.toolbox": "工具箱",
    "about.bio1":
      "这里写介绍——一两句话说明你是谁、在意什么、喜欢解决什么样的问题。",
    "about.bio2": "第二段可以写你现在的关注点、坐标，或正在学的东西。",
  },
  en: {
    "site.title": "Dream — Homepage",
    "site.description": "Personal homepage of Dream. Projects, writing, and experiments.",
    "nav.home": "Home",
    "nav.projects": "Projects",
    "nav.blog": "Blog",
    "nav.about": "About",
    "sidebar.elsewhere": "Elsewhere",
    "home.available": "Available for new projects",
    "home.bio": "A developer crafting interfaces, tools, and the occasional experiment.",
    "home.location": "The internet · Remote",
    "contact.email": "hello@example.com",
    "blog.title": "Blog",
    "blog.subtitle": "Notes & posts",
    "blog.viewAll": "View all",
    "blog.readPost": "Read post",
    "projects.title": "Projects",
    "projects.subtitle": "Things I've built",
    "projects.liveDemo": "Live demo",
    "about.title": "About",
    "about.subtitle": "A short introduction",
    "about.toolbox": "Toolbox",
    "about.bio1": "Introduce yourself here — who you are, what you care about, and the kind of problems you enjoy solving.",
    "about.bio2": "A second paragraph works well for your current focus, location, or what you're learning right now.",
  },
} satisfies Record<Language, Record<string, string>>;

export type TranslationKey = keyof (typeof ui)[typeof defaultLanguage];
