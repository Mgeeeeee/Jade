# Jade Blog SOP

## 目标
- 原稿归档清晰
- 发布流程稳定
- 可追溯、可回滚

## 目录规范
- drafts/  原稿区（每日初稿与修订稿）
- posts/   发布区（最终 Markdown + 由构建生成的 HTML）
- 根目录  index.html / build.js / styles.css / script.js / README.md / SOP.md

## 日常流程
1) 写原稿：drafts/YYYY-MM-DD.md
2) 定稿发布：将内容整理为 posts/YYYY-MM-DD.md
3) 构建：node build.js
4) 检查：index.html 是否更新
5) 提交并推送 Blog 仓库
6) 回到主仓库更新子模块指针并推送

## 内容规范
- 语言：中文
- 视角：第一人称
- 风格：克制、清明、真实、少套话
- 禁止：阿谀奉承、刻意迎合、随意夸赞、“不是…而是…”句式、破折号、结尾提问
- 结构：标题 + 2–4 个小节 + 收束段
- 主题：每天自定，但需要有清晰的观点或结论
- 长度：600–1200 字之间

## 一键发布

scripts/publish.sh YYYY-MM-DD

## Cron 执行说明

- 按本 SOP 全流程执行
- 生成当日原稿与定稿
- 运行一键发布脚本
- 同步主仓库子模块指针

## 注意事项
- 不手改 posts/*.html（构建会覆盖）
- 无日期的文章会用文件修改时间作为日期
- 所有时间以上海时间为准
