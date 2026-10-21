# 荣誉订单后台 V2｜独立测试版本

本目录是原版荣誉订单后台的 **独立复制版本**，用于验证新的产品优化思路。所有资源存放于 `/v2/`，请勿引用或修改仓库根目录下的 V1 业务文件。

## 访问入口（GitHub Pages）

- [V2 荣誉订单后台](https://beaver123-sketch.github.io/honor-order-admin/v2/)
- [V2 荣誉服务订单·英文版](https://beaver123-sketch.github.io/honor-order-admin/v2/honor-service-orders.html)
- [V2 荣誉服务订单·中文版](https://beaver123-sketch.github.io/honor-order-admin/v2/honor-service-orders-zh.html)
- [V2 中英文对照](https://beaver123-sketch.github.io/honor-order-admin/v2/honor-service-orders-compare.html)
- [V2 操作日志](https://beaver123-sketch.github.io/honor-order-admin/v2/honor-operation-logs.html)

## 隔离规则

- V2 具备独立的 HTML、CSS、JavaScript 和演示数据，不直接加载根目录的代码。
- 浏览器 localStorage Key 统一采用 `honor-v2-` 前缀；IndexDB 附件数据库采用独立名称，避免误覆盖原版数据。
- V1 和 V2 **共用 GitHub Pages 的同一个域名与仓库**。数据在应用层做名称隔离，并非浏览器安全边界；两套页面同源，不能用来隔离敏感或真实业务信息。
- 页面为静态前端演示：新建、编辑、通知及附件配置无法代替真实后端数据库、消息接口和操作人身份认证。
- 禁止提交真实订单隐私数据、Webhook 密钥、令牌或生产环境配置。
- 后续产品迭代只改动 `v2/`。发布前通过独立分支和 Pull Request 检查，合并到 main 一次发布，降低 Pages 构建次数。

## 发布容量注意事项

参考 GitHub 官方文档（以官方最新政策为准）：Pages 发布站点 <= 1GB、仓库建议 <= 1GB、每月约 100GB 软带宽限制、分支发布每小时最多 10 次构建（软限制）。静态 HTML/CSS/JS 复制版很小，但将来不应将大批用户上传图片或视频提交到 Git 仓库。

## 自动部署的额外提醒

旧 Vercel 项目如继续监听 GitHub 仓库，提交分支与合并 main 可能触发 Vercel 自动构建。此 V2 任务没有调用 Vercel 发布接口。如需完全禁止 Vercel 自动发布，请到该 Vercel 项目的 Git 集成设置中关闭对应自动部署。
