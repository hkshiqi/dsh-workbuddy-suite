# dsh-workbuddy-suite

把 **WorkBuddy 桌面端**的「专家 / 技能 / 连接器」三个页面搬进 DSH，作为一个设置面板插件。

- **专家**：合并 WorkBuddy 市场目录、内置精选 60 条、DSH 用户/项目专家目录；搜索、筛选、排序、预览、一键安装/卸载。
- **技能**：扫描 DSH 与 Agents 的全部技能根目录（项目 `.dsh/skills`、项目 `.agents/skills`、`~/.dsh/skills`、`~/.agents/skills`），外加 WorkBuddy 技能目录作为导入源；查看正文、切换「模型可调用 / 用户可调用」、导入、删除、新建。
- **连接器**：把 MCP 服务当成连接器管理——运行期增删改、连接探测工具清单、直接调用工具，并可一键从 WorkBuddy 的 `mcp.json` 导入。

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

面板位置：**设置 → WorkBuddy 生态**；侧栏底部也有一个入口按钮。命令行里可用 `/workbuddy experts|skills|connectors` 列清单。

## 数据从哪来、写到哪去

| | 读取（只读） | 写入 |
| --- | --- | --- |
| 专家 | `<workbuddyHome>/plugins/marketplaces/experts/plugins`、`<workbuddyHome>/plugins/cache/experts`、`<dshHome>/experts`、`<projectRoot>/.agents/experts`，以及内置 `data/curated-experts.json` | `<dshHome>/experts/<id>` |
| 技能 | `<projectRoot>/.dsh/skills`、`<projectRoot>/.agents/skills`、`<dshHome>/skills`、`<agentsHome>/skills`、`<workbuddyHome>/skills` | 同上前四个根目录 |
| 连接器 | `<dshHome>/workbuddy-suite/connectors.json`、`<workbuddyHome>/mcp.json`、`<workbuddyHome>/mcp-tool-list.json` | `connectors.json` |

**只删自己装的东西**：本插件写入的每个目录都带 `.dsh-workbuddy-suite.json` 标记文件，卸载时只删带标记的目录，从不碰用户手写的专家或技能。

## 为什么连接器不写在 cordis patch 里

DSH 官方的 `@deepseek-ai/dsh-mcp-client` 在**组合期**从 patch 文件注册 MCP 服务——从面板加一个连接器就得重启宿主。本插件自带一个约 12KB 的 MCP 客户端（stdio 按行 JSON-RPC + streamable HTTP / SSE），在**运行期**连接、列工具、调用工具，因此面板里的增删改立即生效。

## API

全部接口挂在 `/dsh-workbuddy-suite` 前缀下，客户端用文档相对路径 `dsh-workbuddy-suite/api/...` 访问。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/state` | 三个目录的完整快照 |
| GET | `/api/expert-avatar?id=` | 专家头像（唯一允许缓存的响应） |
| GET | `/api/skill-detail?key=` | 一个技能的 frontmatter 与正文 |
| POST | `/api/experts/install` · `/uninstall` · `/refresh` | 专家变更 |
| POST | `/api/skills/flags` · `/import` · `/remove` · `/create` | 技能变更 |
| POST | `/api/connectors/upsert` · `/remove` · `/enable` · `/import` | 连接器变更 |
| POST | `/api/connectors/tools` · `/call` | 探测工具 / 调用工具 |

变更类请求只接受**同源 POST**：Host 必须是 loopback，`sec-fetch-site: cross-site` 直接拒绝，JSON body 上限 64 KiB，响应一律 `no-store`，同一时刻只允许一个变更（并发返回 409）。

## 目录结构

```
src/index.js       宿主入口：服务注入、命令、路由挂载
src/state.js       TTL 缓存 + 三目录快照
src/experts.js     专家扫描 / 安装 / 卸载 / 头像
src/skills.js      技能扫描 / frontmatter 读写 / 导入 / 新建
src/mcp.js         零依赖 MCP 客户端（stdio + streamable HTTP）
src/connectors.js  连接器注册表与运行期连接池
src/routes.js      HTTP 接口与安全层
client/client.js   设置面板（ModuleLoader bundle，无构建）
data/curated-experts.json  WorkBuddy 内置 60 条精选专家
test/smoke.mjs     冒烟测试（含一个 fixture MCP 服务）
```

## 开发

```bash
node test/smoke.mjs    # 扫描真实目录 + 起一个 fixture MCP 服务跑完整往返
```

测试只写临时目录，不会改动你的专家、技能或连接器。

## 许可

MIT
