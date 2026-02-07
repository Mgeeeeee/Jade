# TravelClaw Blog SOP

## 目标
- 原稿归档清晰
- 发布流程稳定
- 可追溯、可回滚

## 目录规范
- drafts/  原稿区（每日初稿与修订稿）
- posts/   发布区（最终 Markdown + 由构建生成的 HTML）
- 根目录  index.html / feed.xml / build.js / styles.css / script.js / README.md / SOP.md

## 日常流程
1) 写原稿：drafts/YYYY-MM-DD.md
2) 定稿发布：将内容整理为 posts/YYYY-MM-DD.md
3) 构建：node build.js
4) 检查：index.html 与 feed.xml 是否更新
5) 提交并推送 Blog 仓库
6) 回到主仓库更新子模块指针并推送

## 注意事项
- 不手改 posts/*.html（构建会覆盖）
- 无日期的文章会用文件修改时间作为日期
- 所有时间以上海时间为准
