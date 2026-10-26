---
status: superseded by ADR-0004
---

# 手动维护精选文章

取代 [ADR-0002](0002-blog-feed-metadata.md)。主站只展示作者手动选入的精选文章，按配置顺序排列；文章正文继续由独立博客承载，延续 ADR-0001。移除 RSS 同步、快照和解析依赖，以减少加载链路和维护入口；代价是新增精选文章后需要重新构建发布。

后续决定：[客户端直接读取 RSS 文章](0004-client-side-blog-rss.md)。
