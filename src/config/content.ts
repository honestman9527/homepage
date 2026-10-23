import type { SiteConfig } from "./types.ts";

// Only confirmed public content belongs here. Add real links explicitly when ready.
export const siteConfig: SiteConfig = {
  site: {
    title: "HonestOS — honestman 的个人桌面",
    description:
      "保持好奇，持续折腾。认识 honestman，探索项目，找到随笔与想法。",
    url: "https://honestman.me",
  },
  profile: {
    name: "honestman",
    alias: "爱睡觉的老实人",
    headline: "保持好奇，持续折腾。",
    introduction: "我是 honestman，也叫爱睡觉的老实人。",
    description:
      "一个学生，喜欢把脑海里的「要不试试」变成互联网上真实存在的小东西。",
    interests: ["Web 开发", "AI 探索", "NAS / OpenWrt"],
    status: "学习中，也创造中",
    links: ["mailto:hello@honestman.me"],
  },
  projects: [
    {
      id: "honestos",
      name: "HonestOS",
      summary: "把个人主页，变成一张可以探索的桌面。",
      description:
        "以可探索的桌面呈现个人介绍、项目与独立博客入口。你正在体验的就是这件作品。",
      status: "building",
      currentSite: true,
      tags: ["Web", "个人主站"],
    },
    {
      id: "universe",
      name: "小小宇宙",
      summary: "让好奇心，漫游到屏幕以外的星系。",
      description:
        "一个关于星系与探索的交互构想。目前只保留想法，还没有可访问的演示。",
      status: "idea",
      tags: ["3D", "交互实验"],
    },
    {
      id: "lab",
      name: "实验室",
      summary: "给那些暂时没有名字的点子，留一个位置。",
      description:
        "为 AI、小工具与更多尚未命名的想法预留的空间，目前处于构想阶段。",
      status: "idea",
      tags: ["AI", "小工具", "更多可能"],
    },
  ],
  blog: {
    title: "随便写写",
    description:
      "代码之外，也想留下生活和思考的痕迹。主站负责相遇，博客负责慢慢聊。",
    url: "https://blog.honestman.me",
    posts: [],
  },
};
