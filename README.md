# dsh-workbuddy-suite

A DSH settings plugin that ports the three WorkBuddy desktop surfaces - **Experts**, **Skills** and **Connectors** - into DeepSeek Harness.

- **Experts**: one catalog merged from the WorkBuddy marketplace, the 60 bundled curated experts and the DSH user/project expert roots. Search, filter, sort, preview, install and uninstall.
- **Skills**: every DSH and Agents skill root (`<project>/.dsh/skills`, `<project>/.agents/skills`, `~/.dsh/skills`, `~/.agents/skills`) plus the WorkBuddy skill folder as an import source. Read the body, flip the model/user invocation switches, import, delete, create.
- **Connectors**: MCP servers managed as connectors - add/edit/remove at runtime, probe the tool list, call a tool, and import everything from WorkBuddy's `mcp.json`.

No build step, no runtime dependencies: the host half is plain ESM, the client half is a hand-written `ModuleLoader` bundle.

## Install

Add the package and the bundle to your DSH profile:

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

```bash
cd "$DSH_HOME/profiles/<profile>" && pnpm install
```

Then restart the DSH host. The panel appears under **Settings -> WorkBuddy ecosystem**, with a matching button in the sidebar footer. `/workbuddy experts|skills|connectors` lists the catalogs from the command line.

## Where data comes from and where it goes

| | Read (read-only) | Written |
| --- | --- | --- |
| Experts | `<workbuddyHome>/plugins/marketplaces/experts/plugins`, `<workbuddyHome>/plugins/cache/experts`, `<dshHome>/experts`, `<projectRoot>/.agents/experts`, bundled `data/curated-experts.json` | `<dshHome>/experts/<id>` |
| Skills | `<projectRoot>/.dsh/skills`, `<projectRoot>/.agents/skills`, `<dshHome>/skills`, `<agentsHome>/skills`, `<workbuddyHome>/skills` | the first four |
| Connectors | `<dshHome>/workbuddy-suite/connectors.json`, `<workbuddyHome>/mcp.json`, `<workbuddyHome>/mcp-tool-list.json` | `connectors.json` |

Every folder this plugin creates carries a `.dsh-workbuddy-suite.json` marker; uninstall only removes marked folders and never touches a hand-written expert or skill.

## Why connectors are not a cordis patch entry

DSH's official `@deepseek-ai/dsh-mcp-client` registers MCP servers at **composition time** from the patch file, so a server added from a settings panel would need a host restart. This plugin ships a ~12KB MCP client instead (newline-delimited JSON-RPC over stdio, plus streamable HTTP with SSE) and connects at **runtime**, so panel edits take effect immediately.

## API

All routes live under the `/dsh-workbuddy-suite` prefix; the client addresses them relative to the document base (`dsh-workbuddy-suite/api/...`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/state` | Full snapshot of the three catalogs |
| GET | `/api/expert-avatar?id=` | Expert avatar (the only cacheable response) |
| GET | `/api/skill-detail?key=` | One skill's frontmatter and body |
| POST | `/api/experts/install` / `uninstall` / `refresh` | Expert changes |
| POST | `/api/skills/flags` / `import` / `remove` / `create` | Skill changes |
| POST | `/api/connectors/upsert` / `remove` / `enable` / `import` | Connector changes |
| POST | `/api/connectors/tools` / `call` | Probe tools / call one |

Mutating routes accept **same-origin POST only**: the Host must name loopback, `sec-fetch-site: cross-site` is refused, JSON bodies are capped at 64 KiB, responses are `no-store`, and only one mutation runs at a time (a concurrent one gets 409).

## Layout

```
src/index.js       host entry: service injection, command, route mount
src/state.js       TTL cache + the three-catalog snapshot
src/experts.js     expert scan / install / uninstall / avatar
src/skills.js      skill scan / frontmatter read-write / import / create
src/mcp.js         dependency-free MCP client (stdio + streamable HTTP)
src/connectors.js  connector registry and runtime connection pool
src/routes.js      HTTP surface and security layer
client/client.js   the settings panel (ModuleLoader bundle, no build)
data/curated-experts.json  the 60 bundled WorkBuddy experts
test/smoke.mjs     smoke test (includes a fixture MCP server)
```

## Development

```bash
node test/smoke.mjs    # scans real roots and runs a full MCP round-trip
```

The test writes only to a temp directory; it never touches your experts, skills or connectors.

## License

MIT
