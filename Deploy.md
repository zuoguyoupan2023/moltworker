# Moltworker 中文部署指南

本指南基于实际部署中最常见的困惑点整理：必须付费、变量去哪里拿、在哪里填、后台找不到入口等。

## 一、部署前的必要条件

- 需要开通 Workers 付费计划，否则 Containers/Sandbox 无法使用
- 需要至少一种模型入口：
  - Anthropic 直连：`ANTHROPIC_API_KEY`
  - 或 Cloudflare AI Gateway：`AI_GATEWAY_API_KEY` + `AI_GATEWAY_BASE_URL`

## 二、在哪里填 Secrets（不会写进代码）

路径：Cloudflare Dashboard → Workers & Pages → 你的 Worker → Settings → Variables → Secrets  
这里添加的变量不会进入仓库，也不会泄露到代码。

需要填写的必需项：

- `MOLTBOT_GATEWAY_TOKEN`
- `CF_ACCESS_TEAM_DOMAIN`
- `CF_ACCESS_AUD`
- `ANTHROPIC_API_KEY` 或 `AI_GATEWAY_API_KEY` + `AI_GATEWAY_BASE_URL`

## 三、MOLTBOT_GATEWAY_TOKEN 怎么获取

本地生成即可：

```bash
openssl rand -hex 32
```

把生成的值粘贴到 Workers 的 Secrets 中：

- Key: `MOLTBOT_GATEWAY_TOKEN`
- Value: 刚生成的 64 位十六进制字符串

## 四、AI Gateway 的 Key 和 Base URL 怎么获取

路径：Cloudflare Dashboard → AI → AI Gateway  
创建一个 Gateway 后，在 Overview 页面底部找到 **Native API/SDK Examples**。

选择你的 Provider（一般是 Anthropic），会看到：

- `AI_GATEWAY_API_KEY`  
- `AI_GATEWAY_BASE_URL`  
  形如：`https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic`

把这两个值填入 Workers 的 Secrets。

## 四点五、AI Gateway 统一计费与充值说明

- 统一计费需要先在 AI Gateway 里充值 Credits，否则会出现余额不足导致模型无回复
- 你可以设置每日/每周/每月的消费上限，或开启自动充值
- 计费金额以所选模型提供商的标价为准，使用前建议先在 AI Gateway Dashboard 查看 Credits 与用量

## 五、R2 凭据怎么获取（用于持久化）

R2 用来保存配对设备和会话数据，避免容器重启后丢失。

获取路径：

- Cloudflare Dashboard → R2 → Overview
- API Token 不在桶里，需要点击 **API Tokens**（在 R2 概述页的 Account Details 区块里）
- 如果页面没有入口，用账号全局入口创建： https://dash.cloudflare.com/profile/api-tokens
- 注意：全局 API Token 只有一个值，不会生成 Access Key ID/Secret，不能用于 R2 持久化
- 在 R2 页里创建 **Account API Token**（不是 User API Token），创建后会给出：
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
- 创建新 Token，权限选择 **Object Read & Write**
- 选择你的 bucket（首次部署会自动创建 `moltbot-data`）

`CF_ACCOUNT_ID` 获取方式：

- Cloudflare Dashboard 右上角账号菜单 → Copy Account ID

填写位置：

- Workers & Pages → 你的 Worker → Settings → Variables → Secrets
- 特别说明：R2 的三个变量在部分界面里直接点 “添加” 不会生效，需要点击右侧 “编辑”，在侧边栏里向下滚动添加变量，再保存
- 添加：
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `CF_ACCOUNT_ID`

## 六、Cloudflare Access 的域名和 AUD 在哪里找

如果在 Zero Trust 里找不到 Access，先看第六节的“找不到入口怎么办”。

正常路径：

- Team Domain（用于 `CF_ACCESS_TEAM_DOMAIN`）  
  Zero Trust Dashboard → Settings → Custom Pages  
  看到 `xxx.cloudflareaccess.com`，取 `xxx.cloudflareaccess.com`

- Application AUD（用于 `CF_ACCESS_AUD`）  
  Zero Trust Dashboard → Access → Applications  
  进入你给 Worker 建的应用，找到 **Application Audience (AUD)**

  

## 七、Zero Trust 里找不到 Access 或 Custom Pages 怎么办

常见原因是：

- 没有进入 **Zero Trust 控制台**，而是在普通 Cloudflare 控制台
- 账号未启用 Zero Trust 服务

解决方法：

1. 直接打开 Zero Trust 控制台  
   https://one.dash.cloudflare.com/
2. 选择你的账号后，在左侧菜单找 **Access**
3. 如果仍然没有 Access，先启用 Zero Trust（首次进入会提示开通）

另外一种更简单的方式：

Workers & Pages → 你的 Worker → Settings → Domains & Routes  
在 `workers.dev` 这一行启用 **Cloudflare Access**，系统会帮你自动创建 Access 应用。  
然后回到 Zero Trust → Access → Applications 查找 AUD。

如果访问时被跳转到 `*.cloudflareaccess.com/#/NoAuth`：

- 不要从 Access App Launcher 入口进入
- 直接访问你的 Worker 域名（如 `https://你的域名/?token=...`）
- 确认 Access 应用的 Domain/Path 覆盖了你的自定义域和 `/_admin/*`

## 八、Containers 显示 “You have no Containers” 怎么办

只要部署成功一个带容器配置的 Worker，就会出现。  
moltworker 已经在 `wrangler.jsonc` 里声明了容器配置，不需要手动创建单独的 Container 项目。

你只需要完成部署，Containers 页面会自动出现该 Worker。

## 九、部署完成后如何访问

1. 访问控制台 UI（带 token）  
   `https://你的-worker.workers.dev/?token=YOUR_TOKEN`
2. 打开后台管理  
   `https://你的-worker.workers.dev/_admin/`
3. 在后台里批准设备配对

## 十、自定义域名绑定

前提：域名必须托管到 Cloudflare（改 NS），否则无法绑定到 Worker。

步骤：

1. Cloudflare Dashboard → 添加站点 → 填入你的域名（如 `openclawbot.online`）
2. 在域名注册商处把 NS 改为 Cloudflare 提供的两条 NS
3. 等待 DNS 生效后回到 Cloudflare
4. Workers & Pages → 你的 Worker → Settings → Domains & Routes → 添加自定义域名
5. 按提示创建/确认 DNS 记录

如果提示无法添加，优先检查：

- 域名是否已经在 Cloudflare 托管
- NS 是否已生效
- 绑定的 Worker 是否在同一账号下

## 十点五、使用 Kimi 或 Minimax 的接入说明

如果你要用 Kimi 或 Minimax（通常是 OpenAI 兼容接口），需要做两件事：

1. 在 Workers Secrets 中新增：
   - `OPENAI_API_KEY`（你的 Kimi/Minimax key）
   - `OPENAI_BASE_URL`（Kimi/Minimax 的兼容 API 基址）

2. 代码修改（必须，否则仍会提示缺少 Anthropic 或 AI Gateway）：
   - 在 `src/index.ts` 的 `validateRequiredEnv` 里，允许 `OPENAI_API_KEY` 作为有效入口
   - 在 `src/gateway/env.ts` 中已支持 `OPENAI_API_KEY` 透传，无需改动
   - `start-moltbot.sh` 会根据 `OPENAI_BASE_URL` 自动配置 OpenAI provider

完成后重新部署即可。

## 十一、Key 轮换与泄露处理

- 任何关键密钥（AI Gateway、R2、Gateway Token）一旦疑似泄露，立即在 Cloudflare 控制台重置并更新到 Secrets
- 建议定期轮换关键密钥，降低长期暴露风险

AI Gateway Key 刷新方式：

- Cloudflare Dashboard → AI → AI Gateway → 选择你的 Gateway
- 在 Provider 配置里重置/更换 API Key
- 同步更新 Workers 的 `AI_GATEWAY_API_KEY`

R2 Key 刷新方式：

- Cloudflare Dashboard → R2 → Manage R2 API Tokens
- 重新生成 Token（新 Key）
- 同步更新 Workers 的 `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`

## 十二、常见卡点总结

- 没开通付费计划：Containers 永远是空的
- 没设置 Secrets：会出现 “Configuration Required”
- 没配置 Access：后台会报未授权
- 没配 R2：重启后配对和历史会丢失
