# dsh-workbuddy-suite

A DSH settings plugin that ports the three WorkBuddy desktop surfaces - **Experts**, **Skills** and **Connectors** - into DeepSeek Harness.

- **Experts**: the official WorkBuddy expert marketplace (448 entries with real avatars, 15 categories, bilingual names and descriptions) merged with the bundled curated list and the DSH user/project expert roots. Search, category filter, sort, detail view, install and uninstall.
- **Skills**: the top half is the WorkBuddy cloud skill marketplace (`api.skillhub.cn`, 198,194 skills: a featured trio, 13 categories, search, sort, paging, detail) where "+" installs straight into `~/.dsh/skills`; the bottom half lists the skills on disk (project `.dsh/skills`, project `.agents/skills`, `~/.dsh/skills`, `~/.agents/skills` and the WorkBuddy folder) with body view, model/user invocation switches, WorkBuddy import, delete and create.
- **Connectors**: the official WorkBuddy connector catalog (409 entries with Chinese names, Chinese descriptions and official icons) is installable in one click; installed MCP servers can be added/edited/removed at runtime, probed for their tool list, called directly, and imported wholesale from WorkBuddy's `mcp.json`.

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

Then restart the DSH host. `/workbuddy experts|skills|connectors` lists the catalogs from the command line.


### Local development: make edits take effect immediately (junction)

pnpm installs `file:` dependencies as a **hard copy**, so source edits never reach the profile. While developing, replace that copy with a directory junction - edits then apply on refresh:

```powershell
$dst = "$env:USERPROFILE\.dsh\profiles\<profile>\node_modules\dsh-workbuddy-suite"
Remove-Item -Recurse -Force $dst
cmd /c mklink /J "$dst" "E:\path\to\dsh-workbuddy-suite"
```

Host-half edits take effect through a disable/enable round in the plugin market (`POST /dsh-market/toggle`), which hot-mounts the pure-insert bundle patch, so no host restart is needed; client-half edits apply on a browser refresh.

### Where the panel lives

The sidebar's global navigation (the same column as *Plugins / Plugin market / Scheduled tasks / Context insights / Memory*) carries a **WorkBuddy experts, skills, connectors** row, placed right below *Memory* (`sidebar.panellist` with `order: 35`; Memory is 30). It selects this package's full-page `main` panel (`workbuddy-suite`); navigate away with any other sidebar row. The same content is also registered as a `settings.section` under **Settings -> WorkBuddy ecosystem**.

## Where data comes from and where it goes

| | Read (read-only) | Written |
| --- | --- | --- |
| Experts | `<workbuddyHome>/app/cache/experts/manifest.json` (the official 448-entry catalog with its 15 categories), `<workbuddyHome>/plugins/marketplaces/experts/plugins`, `<workbuddyHome>/plugins/cache/experts`, `<dshHome>/experts`, `<projectRoot>/.agents/experts`, bundled `data/curated-experts.json` | `<dshHome>/experts/<id>` |
| Skills | `<projectRoot>/.dsh/skills`, `<projectRoot>/.agents/skills`, `<dshHome>/skills`, `<agentsHome>/skills`, `<workbuddyHome>/skills` | the first four |
| Connectors | `<workbuddyHome>/plugins/marketplaces/workbuddy-connector-plugins-official/connectors/<id>` (`plugin.json` + `mcp.json` + `icon.*`), `<dshHome>/workbuddy-suite/connectors.json`, `<workbuddyHome>/mcp.json` | `connectors.json` |

Every folder this plugin creates carries a `.dsh-workbuddy-suite.json` marker; uninstall only removes marked folders and never touches a hand-written expert or skill.

## Avatars and icons: proxied on demand, cached locally

The expert catalog caches only the manifest; avatars live on a CDN (`https://acc-1258344699.cos.accelerate.myqcloud.com/workbuddy/expert-marketplace/avatars/<id>.png`). The browser never talks to that CDN:

- The client only asks `/api/expert-avatar?id=<key>`; the host looks for an `avatar.*` file in an installed expert folder, then in `<dshHome>/workbuddy-suite/avatar-cache/`, and only then fetches the CDN and writes the cache (4 MB cap, 20 s timeout; anything that is not an image - or any failure - becomes a 404 so the client falls back to initials).
- Connector icons come entirely from the local marketplace folder; `/api/connector-icon?id=<id>` reads from disk and never opens a socket.
- Avatars and icons are the **only** cacheable responses (`cache-control: private, max-age=600/3600`); every other route is `no-store`.

## The cloud skill marketplace

The skills tab's featured trio, categories and cards all come from `https://api.skillhub.cn`; the host only proxies and normalises and keeps no local copy of the catalogue.

- `GET /api/skill-market` takes `page`, `pageSize`, `sortBy=installs|downloads|stars|updated_at`, `category`, `keyword` and `seed` and returns one page of cards plus the page count, the 13 categories, the featured trio and install flags in a single round trip.
- `POST /api/skills/install-market {slug, namespace}` downloads and unpacks a skill into `<dshHome>/skills/<slug>`.

The "installed" badge is resolved **on the client**: the host flags a card by skill folder name, but a marketplace slug often differs from the `name` inside SKILL.md (`self-improving-agent` is named `self-improvement`), and a freshly installed skill only appears once the host re-reads its modules. The client therefore also matches the last segment of each local skill key and its name from `/api/state`, so the badge is right immediately after an install.

## Chinese first

Expert and connector descriptions resolve to the Chinese field first: `description.zh` -> `description_zh` -> top-level `description` (only when it contains CJK characters). The detail view also shows the English original in a smaller, dimmer, dashed-off block for comparison, but the list never shows an English-only card.

## Why connectors are not a cordis patch entry

DSH's official `@deepseek-ai/dsh-mcp-client` registers MCP servers at **composition time** from the patch file, so a server added from a settings panel would need a host restart. This plugin ships a ~12KB MCP client instead (newline-delimited JSON-RPC over stdio, plus streamable HTTP with SSE) and connects at **runtime**, so panel edits take effect immediately.

345 of the 409 catalog entries carry a usable MCP address; the other 64 (skill-only or legacy packages) are marked "no direct address" and their install button is disabled.

## API

All routes live under the `/dsh-workbuddy-suite` prefix; the client addresses them relative to the document base (`dsh-workbuddy-suite/api/...`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/state` | Full snapshot of the three catalogs (including `expertCategories`) |
| GET | `/api/connector-catalog` | The official WorkBuddy connector catalog (409 entries, each flagged `installed`) |
| GET | `/api/expert-avatar?id=` | Expert avatar (disk cache, then CDN) |
| GET | `/api/connector-icon?id=` | Connector icon (local catalog) |
| GET | `/api/skill-detail?key=` | One skill's frontmatter and body |
| GET | `/api/skill-market` | One page of the cloud marketplace (cards + categories + featured + install state) |
| GET | `/api/skill-market-detail?slug=&ns=` | Cloud skill detail |
| GET | `/api/skill-icon?slug=&ns=` | Cloud skill icon (disk cached) |
| POST | `/api/experts/install` / `uninstall` / `refresh` | Expert changes |
| POST | `/api/skills/flags` / `import` / `remove` / `create` / `install-market` | Skill changes (including marketplace installs) |
| POST | `/api/connectors/upsert` / `remove` / `enable` / `import` / `install-catalog` | Connector changes |
| POST | `/api/connectors/tools` / `call` | Probe tools / call one |

Mutating routes accept **same-origin POST only**: the Host must name loopback, `sec-fetch-site: cross-site` is refused, JSON bodies are capped at 64 KiB, responses are `no-store`, and only one mutation runs at a time (a concurrent one gets 409).

## Layout

```
src/index.js             host entry: service injection, command, route mount
src/state.js             TTL cache + the three-catalog snapshot
src/experts.js           expert scan / install / uninstall / avatar
src/expert-catalog.js    WorkBuddy expert marketplace manifest + CDN avatar cache
src/skills.js            skill scan / frontmatter read-write / import / create
src/skill-market.js      cloud marketplace client (list / detail / icon / install / cache)
src/connector-catalog.js WorkBuddy connector catalog + icons + install specs
src/mcp.js               dependency-free MCP client (stdio + streamable HTTP)
src/connectors.js        connector registry and runtime connection pool
src/routes.js            HTTP surface and security layer
client/client.js         the settings panel (ModuleLoader bundle, no build)
data/curated-experts.json  the 60 bundled WorkBuddy experts
test/smoke.mjs           smoke test (includes a fixture MCP server)
```

## Development

```bash
node test/smoke.mjs    # scans real roots and runs a full MCP round-trip
node test/routes.mjs   # HTTP surface and same-origin fence
node test/client.mjs   # the client bundle loaded and rendered per the ModuleLoader protocol
node test/entry.mjs    # host entry: route mount and the /workbuddy command
```

The test writes only to a temp directory; it never touches your experts, skills or connectors.

## License

MIT
