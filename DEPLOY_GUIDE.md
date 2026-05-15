# ListingBoost AI — 部署指南（GitHub + Vercel + 自定义域名）

> 本指南面向零基础非程序员，请按步骤逐一操作。

---

## 前提条件

1. **安装 Git**：如果你还没安装，前往 https://git-scm.com/downloads 下载并安装（一路 Next 即可）。
2. **注册 GitHub 账号**：前往 https://github.com/signup 注册一个免费账号。
3. **注册 Vercel 账号**：前往 https://vercel.com/signup 用你的 GitHub 账号直接登录（推荐）。

---

## 第一步：将本地代码推送到 GitHub

### 1.1 打开终端（命令行）

- **Windows**：按 `Win + R`，输入 `cmd`，按回车。或者右键项目文件夹 → "Open in Terminal"。
- **Mac**：打开 "终端" (Terminal) 应用。

### 1.2 进入项目文件夹

```bash
cd "D:\02文件\06开发\跨境网站\listingboost-ai"
```

### 1.3 初始化 Git 仓库

```bash
git init
```

### 1.4 添加所有文件到 Git

```bash
git add .
```

### 1.5 创建第一次提交

```bash
git commit -m "feat: initial ListingBoost AI project with homepage, workspace, and SEO"
```

> 如果这是你第一次使用 Git，可能会提示你设置用户名和邮箱。按提示执行：
> ```bash
> git config --global user.name "你的名字"
> git config --global user.email "你的邮箱@example.com"
> ```

### 1.6 在 GitHub 上创建新仓库

1. 打开浏览器，登录 https://github.com
2. 点击右上角 **"+"** 号 → 选择 **"New repository"**
3. 填写仓库信息：
   - **Repository name**（仓库名）：`listingboost-ai`
   - **Description**（描述）：`AI-powered e-commerce product listing generator`
   - **Public** 或 **Private**：选择 **Public**（公开，Vercel 免费版需要）
   - **不要** 勾选 "Add a README file"、"Add .gitignore"、"Choose a license"
4. 点击 **"Create repository"** 按钮

### 1.7 将本地代码推送到 GitHub

在终端中依次执行以下命令（将 `你的GitHub用户名` 替换为你的实际 GitHub 用户名）：

```bash
git remote add origin https://github.com/你的GitHub用户名/listingboost-ai.git
git branch -M main
git push -u origin main
```

> ⚠️ 如果弹出登录窗口，请使用你的 GitHub 账号登录。
> 如果提示认证失败，你可能需要使用 **Personal Access Token** 代替密码：
> 1. GitHub → Settings → Developer settings → Personal access tokens → Generate new token
> 2. 勾选 `repo` 权限，生成 token
> 3. 在推送时用 token 作为密码

推送成功后，刷新你的 GitHub 仓库页面，应该能看到所有代码文件。

---

## 第二步：在 Vercel 中导入 GitHub 项目

### 2.1 登录 Vercel

1. 打开 https://vercel.com 并用 GitHub 账号登录
2. 首次登录时，Vercel 会请求访问你的 GitHub 仓库权限，点击 **"Authorize"** 授权

### 2.2 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在 "Import Git Repository" 页面，找到你的 `listingboost-ai` 仓库
3. 点击仓库右侧的 **"Import"** 按钮

### 2.3 配置项目设置

Vercel 会自动检测到这是一个 Next.js 项目。确认以下设置：

| 设置项 | 值 |
|--------|-----|
| Framework Preset | Next.js（自动检测） |
| Root Directory | `.`（默认） |
| Build Command | `next build`（默认） |
| Output Directory | 留空（默认） |
| Install Command | `npm install`（默认） |

4. 点击 **"Deploy"** 按钮

### 2.4 等待部署完成

- 部署通常需要 1-2 分钟
- 部署成功后，Vercel 会显示一个庆祝动画 🎉
- 你会获得一个 Vercel 提供的临时域名，例如 `https://listingboost-ai-xxx.vercel.app`
- 点击这个链接即可在线访问你的网站！

---

## 第三步：绑定自定义域名 ealoongchan.top

### 3.1 添加域名到 Vercel

1. 在 Vercel 面板中，进入你的 `listingboost-ai` 项目
2. 点击顶部导航栏的 **"Settings"**（设置）
3. 在左侧菜单中点击 **"Domains"**
4. 在输入框中输入你的域名：`ealoongchan.top`
5. 点击 **"Add"** 按钮

### 3.2 配置 DNS 记录

Vercel 会显示需要你配置的 DNS 记录。通常有两种方式，**任选其一**：

#### 方式 A：添加 A 记录（推荐）

在你的域名注册商（阿里云、腾讯云、Cloudflare 等）的 DNS 管理页面，添加以下记录：

| 类型 | 名称 | 值 |
|------|------|-----|
| A | `@` | `76.76.21.21` |

#### 方式 B：添加 CNAME 记录

| 类型 | 名称 | 值 |
|------|------|-----|
| CNAME | `www` | `cname.vercel-dns.com` |

> 💡 **建议同时配置 A 记录和 CNAME 记录**，这样 `ealoongchan.top` 和 `www.ealoongchan.top` 都能访问。

### 3.3 DNS 配置生效

- DNS 更改通常需要 **几分钟到 48 小时**才能全球生效（大多数情况下 10 分钟内即可）
- 回到 Vercel 的 Domains 页面，点击你添加的域名旁边的 **"..."** → **"Check Propagation Status"** 查看状态
- 当状态显示 **"Valid Configuration"** 时，说明域名已成功解析

### 3.4 HTTPS 证书

- **Vercel 会自动为你的自定义域名配置 HTTPS 证书**，无需额外操作
- 证书由 Let's Encrypt 签发，自动续期
- 当域名 DNS 解析生效后，Vercel 会自动启用 HTTPS
- 你的网站现在可以通过 `https://ealoongchan.top` 安全访问了！

---

## 后续：自动部署

完成以上步骤后，你的 GitHub 仓库和 Vercel 项目已经关联。**以后每次你将代码推送到 GitHub 的 `main` 分支，Vercel 都会自动重新部署**。

更新代码的流程：

```bash
# 1. 修改代码后，查看变更
git status

# 2. 添加所有变更文件
git add .

# 3. 提交变更
git commit -m "feat: 你的修改说明"

# 4. 推送到 GitHub（Vercel 会自动部署）
git push
```

---

## 常见问题

### Q: 推送代码时提示 "Authentication failed"
A: 你需要使用 GitHub Personal Access Token 代替密码。前往 GitHub Settings → Developer settings → Personal access tokens 生成一个。

### Q: Vercel 部署失败
A: 检查 Vercel 的 Build Logs，通常是因为代码有 TypeScript 类型错误或依赖安装失败。确保本地 `npm run build` 能成功通过。

### Q: 域名无法访问
A: 等待 DNS 生效（最多 48 小时）。可以用 https://www.whatsmydns.net/ 查看全球 DNS 解析状态。

### Q: HTTPS 不生效
A: 确保 DNS 已正确解析到 Vercel（状态显示 Valid Configuration），Vercel 会在 DNS 生效后自动签发证书。

---

祝你部署顺利！🚀
