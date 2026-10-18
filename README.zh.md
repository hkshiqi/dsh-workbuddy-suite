# dsh-workbuddy-suite

把 **WorkBuddy 桌面端**的「专家 / 技能 / 连接器」三个页面搬进 DSH，作为一个设置面板插件。

- **专家**：WorkBuddy 官方专家市场目录（448 条，含真实头像、15 个分类、中英文名称与简介）+ 内置精选 + DSH 用户/项目专家目录；搜索、分类筛选、排序、详情、一键安装/卸载。
- **技能**：上半屏是 WorkBuddy 云端技能市场（api.skillhub.cn，198194 个技能：精选三张卡 + 分类筛选 + 搜索 + 排序 + 分页 + 详情），点「+」直接把技能装进 `~/.dsh/skills`；下半屏是本地技能（项目 `.dsh/skills`、项目 `.agents/skills`、`~/.dsh/skills`、`~/.agents/skills` 与 WorkBuddy 技能目录），可看正文、切换「模型可调用 / 用户可调用」、从 WorkBuddy 导入、删除、新建。
- **连接器**：WorkBuddy 官方连接器目录（409 个，中文名 + 中文简介 + 官方图标）可直接安装；已安装的 MCP 服务可运行期增删改、探测工具清单、直接调用工具，也可一键从 WorkBuddy 的 `mcp.json` 导入。

零构建、零运行时依赖：宿主半边是纯 ESM，客户端半边是手写的 `ModuleLoader` bundle。

## 安装

```bash
# 1) 拷进 profile 的依赖（或直接 git 地址安装）
cd "$DSH_HOME/profiles/<profile>"
```

在 profile 的 `package.json` 里加一行依赖和一行 bundle：

```json
{
  "dependencies": {
    "dsh-workbuddy-suite": "file:E:/path/to/dsh-workbuddy-suite"
  },
  "dsh": {
    "profile": {
      "bundles": ["...", "dsh-workbuddy-suite"]
    }
  }
}
```

然后在该目录执行 pnpm 安装并重启 DSH 宿主：

```bash
pnpm install
```

命令行里可用 `/workbuddy experts|skills|connectors` 列清单。

### 本地开发：让改动立刻生效（junction）

pnpm 对 `file:` 依赖是**硬拷贝**，改源码不会进 profile。开发时把 profile 里的那份换成目录联接，之后改源码刷新页面即生效：

```powershell
$dst = "$env:USERPROFILE\.dsh\profiles\<profile>\node_modules\dsh-workbuddy-suite"
Remove-Item -Recurse -Force $dst
cmd /c mklink /J "$dst" "E:\path\to\dsh-workbuddy-suite"
```

宿主半边的改动在插件市场里用停用/启用触发 bundle patch 热挂载（`POST /dsh-market/toggle`），不必重启宿主；客户端半边刷新浏览器即可。

### 面板位置

侧栏主导航（与「插件 / 插件市场 / 自动化任务 / 上下文洞察 / 记忆系统」同一列）里有一行 **WorkBuddy 专家·技能·连接器**，位置在「记忆系统」下面（`sidebar.panellist` 的 `order: 35`，记忆系统是 30）。点它切到本插件的整屏页面（`main` 面板 key = `workbuddy-suite`），标题栏用与其它页面相同的方式切走即可离开。设置页里也注册了同一份内容，位置是 **设置 → WorkBuddy 生态**。

## 数据从哪来、写到哪去

| | 读取（只读） | 写入 |
| --- | --- | --- |
| 专家 | `<workbuddyHome>/app/cache/experts/manifest.json`（官方目录 448 条 + 15 个分类）、`<workbuddyHome>/plugins/marketplaces/experts/plugins`、`<workbuddyHome>/plugins/cache/experts`、`<dshHome>/experts`、`<projectRoot>/.agents/experts`，以及内置 `data/curated-experts.json` | `<dshHome>/experts/<id>` |
| 技能 | `<projectRoot>/.dsh/skills`、`<projectRoot>/.agents/skills`、`<dshHome>/skills`、`<agentsHome>/skills`、`<workbuddyHome>/skills` | 同上前四个根目录 |
| 连接器 | `<workbuddyHome>/plugins/marketplaces/workbuddy-connector-plugins-official/connectors/<id>`（`plugin.json` + `mcp.json` + `icon.*`）、`<dshHome>/workbuddy-suite/connectors.json`、`<workbuddyHome>/mcp.json` | `connectors.json` |

**只删自己装的东西**：本插件写入的每个目录都带 `.dsh-workbuddy-suite.json` 标记文件，卸载时只删带标记的目录，从不碰用户手写的专家或技能。

## 头像与图标：按需代理 + 本地缓存

专家市场目录只缓存了 manifest，头像在 CDN 上（`https://acc-1258344699.cos.accelerate.myqcloud.com/workbuddy/expert-marketplace/avatars/<id>.png`）。面板不会让浏览器直连 CDN：

- 前端只请求 `/api/expert-avatar?id=<key>`，宿主侧先查本地专家目录里的 `avatar.*` 文件，再查 `<dshHome>/workbuddy-suite/avatar-cache/`，最后才拉 CDN 并落盘缓存（4 MB 上限、20 秒超时，非图片或失败一律 404 让前端退回首字母）。
- 连接器图标完全来自本地 marketplace 目录，`/api/connector-icon?id=<id>` 直接读盘，不联网。
- 头像/图标是**唯一允许缓存**的响应（`cache-control: private, max-age=600/3600`），其余接口都是 `no-store`。

## 技能市场（云端）

技能页的「推荐 / 精选 / 分类」全部来自 WorkBuddy 技能市场 `https://api.skillhub.cn`，宿主侧只做转发与归一化，不在本地维护技能清单：

- `GET /api/skill-market`：一页技能卡（`page`、`pageSize`、`sortBy=installs|downloads|stars|updated_at`、`category`、`keyword`、`seed`），一次返回总页数、13 个分类、精选三张卡与安装状态。
- `GET /api/skill-market-detail?slug=&ns=`：单个技能的完整详情（中英文简介、版本、安全等级、更新说明、示例问法）。
- `POST /api/skills/install-market {slug, namespace}`：下载技能包并解包到 `<dshHome>/skills/<slug>`。
- `GET /api/skill-icon?slug=&ns=`：技能图标（带磁盘缓存）。

安装后「已安装」标记的判定在**客户端**完成：宿主只按技能目录名打标，而市场里的 slug 与 SKILL.md 里的 `name` 常常不同（例如 slug `self-improving-agent` 的技能名字是 `self-improvement`），所以前端会拿 `/api/state` 里本地技能的 key 末段与 name 再做一次归一化匹配，安装完立刻显示「已安装」，不必等宿主重新加载模块。

## 中文优先

专家简介、连接器简介都取中文优先的字段：`description.zh` → `description_zh` → 顶层 `description`（仅当含中日韩字符）。详情面板同时展示英文原文（更小更淡、虚线分隔），方便对照，但列表从不出现「只有英文」的卡片。

## 为什么连接器不写在 cordis patch 里

DSH 官方的 `@deepseek-ai/dsh-mcp-client` 在**组合期**从 patch 文件注册 MCP 服务——从面板加一个连接器就得重启宿主。本插件自带一个约 12KB 的 MCP 客户端（stdio 按行 JSON-RPC + streamable HTTP / SSE），在**运行期**连接、列工具、调用工具，因此面板里的增删改立即生效。

连接器目录里 409 个条目中 345 个带可用的 MCP 地址，其余 64 个（只有技能包或旧格式）标记为「无直连地址」且安装按钮置灰。

## API

全部接口挂在 `/dsh-workbuddy-suite` 前缀下，客户端用文档相对路径 `dsh-workbuddy-suite/api/...` 访问。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/state` | 三个目录的完整快照（含 `expertCategories`） |
| GET | `/api/connector-catalog` | WorkBuddy 官方连接器目录（409 条，标 `installed`） |
| GET | `/api/expert-avatar?id=` | 专家头像（磁盘缓存 → CDN） |
| GET | `/api/connector-icon?id=` | 连接器图标（本地目录） |
| GET | `/api/skill-detail?key=` | 一个技能的 frontmatter 与正文 |
| GET | `/api/skill-market` | 云端技能市场一页（卡片 + 分类 + 精选 + 安装态） |
| GET | `/api/skill-market-detail?slug=&ns=` | 云端技能详情 |
| GET | `/api/skill-icon?slug=&ns=` | 云端技能图标（磁盘缓存） |
| POST | `/api/experts/install` · `/uninstall` · `/refresh` | 专家变更 |
| POST | `/api/skills/flags` · `/import` · `/remove` · `/create` · `/install-market` | 技能变更（含从市场安装） |
| POST | `/api/connectors/upsert` · `/remove` · `/enable` · `/import` · `/install-catalog` | 连接器变更 |
| POST | `/api/connectors/tools` · `/call` | 探测工具 / 调用工具 |

变更类请求只接受**同源 POST**：Host 必须是 loopback，`sec-fetch-site: cross-site` 直接拒绝，JSON body 上限 64 KiB，响应一律 `no-store`，同一时刻只允许一个变更（并发返回 409）。

## 目录结构

```
src/index.js            宿主入口：服务注入、命令、路由挂载
src/state.js            TTL 缓存 + 三目录快照
src/experts.js          专家扫描 / 安装 / 卸载 / 头像
src/expert-catalog.js   WorkBuddy 专家市场 manifest + CDN 头像缓存
src/skills.js           技能扫描 / frontmatter 读写 / 导入 / 新建
src/skill-market.js     云端技能市场客户端（列表/详情/图标/安装/缓存）
src/connector-catalog.js WorkBuddy 官方连接器目录 + 图标 + 安装规格
src/mcp.js              零依赖 MCP 客户端（stdio + streamable HTTP）
src/connectors.js       连接器注册表与运行期连接池
src/routes.js           HTTP 接口与安全层
client/client.js        设置面板（ModuleLoader bundle，无构建）
data/curated-experts.json  WorkBuddy 内置 60 条精选专家
test/smoke.mjs          冒烟测试（含一个 fixture MCP 服务）
```

## 开发

```bash
node test/smoke.mjs    # 扫描真实目录 + 起一个 fixture MCP 服务跑完整往返
node test/routes.mjs   # HTTP 接口与同源防护（不发真实请求）
node test/client.mjs   # 客户端 bundle 按 ModuleLoader 协议加载并渲染
node test/entry.mjs    # 宿主入口注册路由与 /workbuddy 命令
```

测试只写临时目录，不会改动你的专家、技能或连接器。

## 许可

MIT
