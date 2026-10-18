/* dsh-workbuddy-suite - client half.
 *
 * Plain ModuleLoader bundle: no build step. Three panes (experts / skills /
 * connectors) live under one settings section, plus a sidebar entry that
 * opens the same page.
 *
 * Data comes from the host route base, addressed RELATIVELY (the web shell
 * pins <base href="./">, so an absolute origin path breaks behind the
 * prefix-stripping proxy). Writing follows the same rule.
 */
window.__ModuleLoader__.load({
  id: 'dsh-workbuddy-suite',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports
    var react = require('react')
    var h = react.createElement
    var useState = react.useState
    var useEffect = react.useEffect
    var useMemo = react.useMemo
    var useCallback = react.useCallback
    var useRef = react.useRef

    var NAME = 'dsh-workbuddy-suite'
    var NS = 'workbuddy-suite'
    var API = 'dsh-workbuddy-suite/api'

    var DICTS = {
      zh: {
        nav: 'WorkBuddy 专家·技能·连接器',
        title: 'WorkBuddy 生态',
        subtitle: '把 WorkBuddy 的专家、技能与连接器接进 DSH：专家与技能直接可用，连接器即 MCP 服务。',
        tabExperts: '专家',
        tabSkills: '技能',
        tabConnectors: '连接器',
        searchExperts: '搜索专家',
        searchSkills: '搜索技能',
        searchConnectors: '搜索连接器',
        sort: '排序',
        sortDefault: '综合',
        sortName: '名称',
        sortOrigin: '来源',
        all: '全部',
        installed: '已安装',
        available: '可安装',
        teams: '专家团',
        single: '专家',
        install: '安装',
        uninstall: '卸载',
        installing: '安装中…',
        installedTag: '已安装',
        teamTag: '专家团',
        preview: '预览',
        close: '关闭',
        refresh: '刷新',
        loading: '读取中…',
        emptyExperts: '没有匹配的专家。',
        emptySkills: '没有匹配的技能。',
        emptyConnectors: '还没有连接器。可以从 WorkBuddy 导入，或手动添加一个 MCP 服务。',
        importWorkbuddy: '从 WorkBuddy 导入',
        imported: '已导入',
        addConnector: '添加连接器',
        editConnector: '编辑连接器',
        connectorName: '名称',
        connectorId: 'ID',
        connectorTransport: '传输方式',
        connectorCommand: '命令',
        connectorArgs: '参数（每行一个）',
        connectorUrl: '服务地址',
        save: '保存',
        cancel: '取消',
        delete: '删除',
        confirmDelete: '确定删除这个连接器？',
        tools: '工具',
        probe: '探测工具',
        probing: '探测中…',
        enabled: '已启用',
        disabled: '已停用',
        noTools: '尚未探测，点「探测工具」连接服务并读取工具清单。',
        callTool: '调用',
        result: '返回',
        skillsHint: '技能来自 DSH 与 Agents 的技能目录；WorkBuddy 技能可作为导入来源。',
        modelInvocable: '模型可调用',
        userInvocable: '用户可调用',
        createSkill: '新建技能',
        skillName: '技能名（kebab-case）',
        skillDescription: '一句话描述',
        skillScope: '位置',
        scopeUser: '用户级 ~/.dsh/skills',
        scopeProject: '项目级 .dsh/skills',
        openFolder: '打开目录',
        removeSkill: '删除',
        origins: { project: '项目', user: '用户', workbuddy: 'WorkBuddy' },
        confirmRemove: '确定删除这个技能？',
        rootsTitle: '扫描目录',
        expertsHint: '专家来自 WorkBuddy 市场目录、内置精选与 DSH 专家目录；安装后写进 ~/.dsh/experts。',
        warnings: '提示',
        failed: '操作失败',
        detail: '详情',
        fullText: '展开完整介绍',
        profession: '专长',
        category: '分类',
        quickPrompts: '常用提问',
        descriptionEn: 'English',
        catalog: 'WorkBuddy 连接器目录',
        installedConnectors: '已安装连接器',
        customConnector: '自定义连接器',
        installConnector: '安装',
        installingConnector: '安装中…',
        unavailable: '无直连地址',
        noServerHint: '这个连接器没有可直接使用的 MCP 服务地址，只提供说明与技能，不能直接接入。',
        examples: '示例问法',
        catalogEmpty: '没有匹配的连接器。',
        catalogMissing: '没有找到 WorkBuddy 连接器目录（打开一次 WorkBuddy 的「连接器」页即可下载）。',
        catalogCount: '个连接器',
        marketCount: '个技能',
        connectFailed: '连接失败',
        searchCatalog: '搜索连接器',
        tutorialServer: '服务名',
        allCategories: '分类',
        featured: '精选技能',
        refreshBatch: '换一批',
        recommended: '推荐',
        recommendedHint: '以下技能来自 WorkBuddy 技能市场（api.skillhub.cn），点「+」直接装进 ~/.dsh/skills。',
        skillsMarket: '技能市场',
        localSkills: '本地技能',
        addSkill: '添加技能',
        installsLabel: '使用',
        downloadsLabel: '下载',
        marketTotal: '共 %s 个技能',
        pagePrev: '上一页',
        pageNext: '下一页',
        pageLabel: '第 %s / %s 页',
        marketFailed: '技能市场读取失败',
        marketTimeout: '技能市场连接超时，稍后重试',
        alreadyInstalled: '已安装',
        installingSkill: '安装中…',
        installSkill: '安装到 DSH',
        sortInstalls: '最热',
        sortDownloads: '下载最多',
        sortStars: '收藏最多',
        sortUpdated: '最近更新',
        security: '安全',
        versionsLabel: '版本',
        ownerLabel: '作者',
        requiresApiKey: '需要 API Key',
        changelogLabel: '更新说明',
        installedLocalTitle: '已经可用的技能',
        importToDsh: '导入到 DSH',
      },
      en: {
        nav: 'WorkBuddy Experts · Skills · Connectors',
        title: 'WorkBuddy ecosystem',
        subtitle: 'Bring the WorkBuddy expert, skill and connector catalogs into DSH.',
        tabExperts: 'Experts',
        tabSkills: 'Skills',
        tabConnectors: 'Connectors',
        searchExperts: 'Search experts',
        searchSkills: 'Search skills',
        searchConnectors: 'Search connectors',
        sort: 'Sort',
        sortDefault: 'Default',
        sortName: 'Name',
        sortOrigin: 'Source',
        all: 'All',
        installed: 'Installed',
        available: 'Available',
        teams: 'Teams',
        single: 'Solo',
        install: 'Install',
        uninstall: 'Uninstall',
        installing: 'Installing…',
        installedTag: 'installed',
        teamTag: 'team',
        preview: 'Preview',
        close: 'Close',
        refresh: 'Refresh',
        loading: 'Loading…',
        emptyExperts: 'No matching expert.',
        emptySkills: 'No matching skill.',
        emptyConnectors: 'No connectors yet. Import from WorkBuddy or add an MCP server.',
        importWorkbuddy: 'Import from WorkBuddy',
        imported: 'Imported',
        addConnector: 'Add connector',
        editConnector: 'Edit connector',
        connectorName: 'Name',
        connectorId: 'ID',
        connectorTransport: 'Transport',
        connectorCommand: 'Command',
        connectorArgs: 'Arguments (one per line)',
        connectorUrl: 'Endpoint URL',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        confirmDelete: 'Delete this connector?',
        tools: 'Tools',
        probe: 'Probe tools',
        probing: 'Probing…',
        enabled: 'Enabled',
        disabled: 'Disabled',
        noTools: 'Not probed yet. Probe to connect and list the tools.',
        callTool: 'Call',
        result: 'Result',
        skillsHint: 'Skills come from the DSH and Agents skill roots; WorkBuddy skills can be imported.',
        modelInvocable: 'Model invocable',
        userInvocable: 'User invocable',
        createSkill: 'New skill',
        skillName: 'Skill name (kebab-case)',
        skillDescription: 'One-line description',
        skillScope: 'Location',
        scopeUser: 'User ~/.dsh/skills',
        scopeProject: 'Project .dsh/skills',
        openFolder: 'Show folder',
        removeSkill: 'Delete',
        origins: { project: 'project', user: 'user', workbuddy: 'WorkBuddy' },
        confirmRemove: 'Delete this skill?',
        rootsTitle: 'Scanned roots',
        expertsHint: 'Experts come from the WorkBuddy marketplace, the bundled curated set and the DSH expert roots.',
        warnings: 'Notes',
        failed: 'Failed',
        detail: 'Details',
        fullText: 'Show full description',
        profession: 'Profession',
        category: 'Category',
        quickPrompts: 'Typical tasks',
        descriptionEn: 'English',
        catalog: 'WorkBuddy connector catalog',
        installedConnectors: 'Installed connectors',
        customConnector: 'Custom connector',
        installConnector: 'Install',
        installingConnector: 'Installing…',
        unavailable: 'No endpoint',
        noServerHint: 'This connector ships no usable MCP endpoint - only its description and skills.',
        examples: 'Example prompts',
        catalogEmpty: 'No matching connector.',
        catalogMissing: 'The WorkBuddy connector catalog was not found on this machine.',
        catalogCount: 'connectors',
        marketCount: 'skills',
        connectFailed: 'Connection failed',
        searchCatalog: 'Search connectors',
        tutorialServer: 'Server',
        allCategories: 'Category',
        featured: 'Featured',
        refreshBatch: 'Shuffle',
        recommended: 'Recommended',
        recommendedHint: 'Skills below come from the WorkBuddy skill marketplace (api.skillhub.cn); "+" installs one into ~/.dsh/skills.',
        skillsMarket: 'Skill marketplace',
        localSkills: 'Local skills',
        addSkill: 'Add skill',
        installsLabel: 'uses',
        downloadsLabel: 'downloads',
        marketTotal: '%s skills',
        pagePrev: 'Prev',
        pageNext: 'Next',
        pageLabel: 'Page %s / %s',
        marketFailed: 'Skill marketplace unavailable',
        marketTimeout: 'Skill marketplace timed out - retry later',
        alreadyInstalled: 'installed',
        installingSkill: 'Installing…',
        installSkill: 'Install into DSH',
        sortInstalls: 'Most used',
        sortDownloads: 'Most downloaded',
        sortStars: 'Most starred',
        sortUpdated: 'Recently updated',
        security: 'Security',
        versionsLabel: 'Versions',
        ownerLabel: 'Owner',
        requiresApiKey: 'Needs API key',
        changelogLabel: 'Changelog',
        installedLocalTitle: 'Skills already available',
        importToDsh: 'Import into DSH',
      },
    }

    var locale = { active: 'zh' }
    function t(key) {
      var dict = DICTS[locale.active] || DICTS.zh
      var value = dict[key]
      if (value === undefined) value = DICTS.zh[key]
      return value === undefined ? key : value
    }

    /* ---------- HTTP ---------- */

    function api(path, options) {
      var target = API + path
      return fetch(target, Object.assign({ credentials: 'same-origin' }, options)).then(function (response) {
        return response.json().catch(function () { return {} }).then(function (body) {
          if (!response.ok || body.ok === false) {
            var error = new Error((body && body.error && body.error.message) || ('HTTP ' + response.status))
            error.code = body && body.error ? body.error.code : 'http'
            throw error
          }
          return body.value
        })
      })
    }

    function post(path, body) {
      return api(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body || {}),
      })
    }

    /* ---------- styles ---------- */

    var STYLE_ID = 'dsh-workbuddy-suite-styles'

    var CSS = [
      '.wbs-root{display:flex;flex-direction:column;gap:14px;padding:2px;font-size:13px;color:var(--dsw-alias-label-primary,#1f2329)}',
      '.wbs-head{display:flex;flex-direction:column;gap:6px}',
      '.wbs-title{font-size:16px;font-weight:600;letter-spacing:.01em}',
      '.wbs-sub{font-size:12.5px;line-height:1.6;opacity:.66;max-width:62ch}',
      '.wbs-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.wbs-tabs{display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.09))}',
      '.wbs-tab{appearance:none;border:0;background:transparent;color:inherit;font:inherit;font-size:12.5px;padding:5px 14px;border-radius:8px;cursor:pointer;opacity:.68;transition:background .16s cubic-bezier(.2,.7,.2,1),opacity .16s}',
      '.wbs-tab:hover{opacity:.9}',
      '.wbs-tab[data-on="1"]{background:var(--dsw-alias-bg-layer-1,#fff);opacity:1;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}',
      '.wbs-grow{flex:1}',
      '.wbs-input{height:30px;padding:0 10px;min-width:180px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.28));background:transparent;color:inherit;font:inherit;outline:none}',
      '.wbs-input:focus{border-color:var(--dsw-alias-border-l1,rgba(128,128,128,.5))}',
      '.wbs-btn{height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.28));background:transparent;color:inherit;font:inherit;font-size:12.5px;cursor:pointer;transition:background .16s cubic-bezier(.2,.7,.2,1)}',
      '.wbs-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}',
      '.wbs-btn:disabled{opacity:.45;cursor:default}',
      '.wbs-btn[data-kind="primary"]{background:var(--dsw-alias-label-primary,#1f2329);color:var(--dsw-alias-bg-layer-1,#fff);border-color:transparent;font-weight:600}',
      '.wbs-btn[data-kind="danger"]{color:#e5534b;border-color:rgba(229,83,75,.4)}',
      '.wbs-btn[data-size="sm"]{height:26px;padding:0 9px;font-size:12px}',
      '.wbs-chips{display:flex;gap:6px;flex-wrap:wrap}',
      '.wbs-chip{font-size:11.5px;padding:3px 9px;border-radius:999px;border:1px solid transparent;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.1));opacity:.8;cursor:pointer}',
      '.wbs-chip[data-on="1"]{border-color:var(--dsw-alias-label-primary,#1f2329);opacity:1;font-weight:600}',
      '.wbs-chip[data-static="1"]{cursor:default}',
      '.wbs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:10px}',
      '.wbs-card{position:relative;display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.22));background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.05));transition:border-color .16s cubic-bezier(.2,.7,.2,1),transform .16s}',
      '.wbs-card:hover{border-color:var(--dsw-alias-border-l1,rgba(128,128,128,.45))}',
      '.wbs-card-top{display:flex;gap:9px;align-items:flex-start}',
      '.wbs-avatar{width:32px;height:32px;flex:0 0 32px;border-radius:9px;object-fit:cover;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.16));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;opacity:.8}',
      '.wbs-card-name{font-size:13px;font-weight:600;line-height:1.35}',
      '.wbs-card-desc{font-size:12px;line-height:1.55;opacity:.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.wbs-card-tags{display:flex;gap:5px;flex-wrap:wrap}',
      '.wbs-tag{font-size:11px;padding:2px 7px;border-radius:6px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.13));opacity:.75}',
      '.wbs-card-foot{display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:2px}',
      '.wbs-muted{opacity:.55;font-size:11.5px}',
      '.wbs-row{display:flex;align-items:center;gap:8px}',
      '.wbs-col{display:flex;flex-direction:column;gap:8px}',
      '.wbs-empty{padding:34px 16px;text-align:center;font-size:12.5px;opacity:.6;border:1px dashed var(--dsw-alias-border-l2,rgba(128,128,128,.28));border-radius:12px}',
      '.wbs-err{color:#e5534b;font-size:12px}',
      '.wbs-note{font-size:11.5px;line-height:1.5;opacity:.6}',
      '.wbs-mask{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.44);display:flex;align-items:center;justify-content:center;padding:24px}',
      '.wbs-modal{width:min(720px,100%);max-height:84vh;display:flex;flex-direction:column;border-radius:16px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.24));box-shadow:0 24px 64px -16px rgba(0,0,0,.42);overflow:hidden}',
      '.wbs-modal-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.18))}',
      '.wbs-modal-body{padding:14px 16px;overflow:auto;display:flex;flex-direction:column;gap:10px}',
      '.wbs-modal-foot{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.18))}',
      '.wbs-pre{margin:0;padding:10px;border-radius:9px;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.07));font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;max-height:280px;overflow:auto}',
      '.wbs-field{display:flex;flex-direction:column;gap:5px}',
      '.wbs-label{font-size:11.5px;opacity:.62}',
      '.wbs-switch{display:inline-flex;align-items:center;gap:6px;font-size:12px;opacity:.8;white-space:nowrap;flex:0 0 auto}',
      '.wbs-toollist{display:flex;flex-direction:column;min-width:0}',
      '.wbs-tool{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.14))}',
      '.wbs-tool:last-child{border-bottom:0}',
      '.wbs-tool-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}',
      '.wbs-dd{position:relative}',
      '.wbs-dd-btn{display:inline-flex;align-items:center;gap:6px}',
      '.wbs-dd-list{position:absolute;z-index:70;top:calc(100% + 4px);right:0;min-width:132px;padding:4px;border-radius:9px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));box-shadow:0 14px 32px -12px rgba(0,0,0,.35);display:flex;flex-direction:column}',
      '.wbs-dd-opt{appearance:none;border:0;background:transparent;color:inherit;font:inherit;font-size:12.5px;text-align:left;padding:6px 9px;border-radius:6px;cursor:pointer}',
      '.wbs-dd-opt:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.14))}',
      '.wbs-dd-opt[data-on="1"]{font-weight:600}',
      '.wbs-shell-mask{position:fixed;inset:0;z-index:58;display:flex;align-items:stretch;justify-content:center;background:rgba(0,0,0,.34);backdrop-filter:blur(2px);padding:min(6vh,56px) min(6vw,72px)}',
      '.wbs-shell{width:min(1120px,100%);display:flex;flex-direction:column;border-radius:18px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.24));box-shadow:0 32px 80px -24px rgba(0,0,0,.5);overflow:hidden}',
      '.wbs-shell-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.18))}',
      '.wbs-shell-body{padding:16px;overflow:auto}',
      // --- catalog redesign -------------------------------------------------
      '.wbs-avatar{width:44px;height:44px;flex:0 0 44px;border-radius:12px;object-fit:cover;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.16));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;opacity:.9;box-shadow:0 1px 2px rgba(0,0,0,.08)}',
      '.wbs-avatar-lg{width:56px;height:56px;flex:0 0 56px;border-radius:14px;font-size:20px}',
      '.wbs-icon{width:40px;height:40px;flex:0 0 40px;border-radius:11px;object-fit:contain;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.13));padding:5px}',
      '.wbs-card{cursor:pointer}',
      '.wbs-card[data-flat="1"]{cursor:default}',
      '.wbs-card-desc{font-size:12px;line-height:1.6;opacity:.72;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.wbs-card-desc[data-clamp="3"]{-webkit-line-clamp:3}',
      '.wbs-desc-full{font-size:13px;line-height:1.75;white-space:pre-wrap;word-break:break-word}',
      '.wbs-desc-full[data-lang="1"]{opacity:.62;font-size:12.5px;border-top:1px dashed var(--dsw-alias-border-l2,rgba(128,128,128,.24));padding-top:10px}',
      '.wbs-sec{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:12px;font-weight:600;opacity:.75}',
      '.wbs-sec-line{flex:1;height:1px;background:var(--dsw-alias-border-l2,rgba(128,128,128,.2))}',
      '.wbs-plus{appearance:none;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:transparent;color:inherit;width:26px;height:26px;border-radius:8px;font-size:15px;line-height:1;cursor:pointer;flex:0 0 auto;transition:background .16s cubic-bezier(.2,.7,.2,1),transform .16s}',
      '.wbs-plus:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.14));transform:scale(1.06)}',
      '.wbs-plus[data-done="1"]{opacity:.4;cursor:default;transform:none}',
      '.wbs-badge{font-size:10.5px;padding:2px 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.14));opacity:.7;white-space:nowrap}',
      '.wbs-id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;opacity:.55}',
      '.wbs-kv{display:grid;grid-template-columns:88px 1fr;gap:6px 10px;font-size:12.5px;line-height:1.6}',
      '.wbs-kv-k{opacity:.55}',
      // --- skill marketplace -------------------------------------------------
      '.wbs-stats{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;padding-top:2px}',
      '.wbs-stat{font-size:11px;opacity:.55;white-space:nowrap}',
      '.wbs-featured{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}',
      '.wbs-featured-card{background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.08));border-color:var(--dsw-alias-border-l1,rgba(128,128,128,.34))}',
      '.wbs-icon-lg{width:48px;height:48px;flex:0 0 48px;border-radius:13px;padding:6px}',
      '.wbs-pagebar{display:flex;align-items:center;justify-content:center;gap:12px;padding:2px 0}',
      '.wbs-sec .wbs-chip{margin-left:0}',
    ].join('')

    function ensureStyle() {
      if (typeof document === 'undefined') return function () {}
      var existing = document.getElementById(STYLE_ID)
      if (existing !== null) return function () {}
      var node = document.createElement('style')
      node.id = STYLE_ID
      node.setAttribute('data-plugin', NAME)
      node.textContent = CSS
      document.head.appendChild(node)
      return function () {
        if (node.parentNode !== null) node.parentNode.removeChild(node)
      }
    }

    /* ---------- small components ---------- */

    function Btn(props) {
      return h('button', {
        type: 'button',
        className: 'wbs-btn' + (props.className ? ' ' + props.className : ''),
        'data-kind': props.kind,
        'data-size': props.size,
        disabled: props.disabled === true,
        title: props.title,
        onClick: props.onClick,
      }, props.children)
    }

    function Chip(props) {
      return h('button', {
        type: 'button',
        className: 'wbs-chip',
        'data-on': props.on ? '1' : '0',
        'data-static': props.static ? '1' : '0',
        onClick: props.onClick,
      }, props.children)
    }

    function Tags(props) {
      var items = props.items || []
      if (items.length === 0) return null
      return h('div', { className: 'wbs-card-tags' }, items.map(function (item, index) {
        return h('span', { className: 'wbs-tag', key: index }, item)
      }))
    }

    function Dropdown(props) {
      var open = useState(false)
      var isOpen = open[0]
      var setOpen = open[1]
      var box = useRef(null)
      useEffect(function () {
        if (!isOpen) return undefined
        function onDown(event) {
          if (box.current !== null && !box.current.contains(event.target)) setOpen(false)
        }
        function onKey(event) {
          if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        document.addEventListener('keydown', onKey)
        return function () {
          document.removeEventListener('mousedown', onDown)
          document.removeEventListener('keydown', onKey)
        }
      }, [isOpen])
      var current = null
      for (var i = 0; i < props.options.length; i += 1) {
        if (props.options[i].value === props.value) current = props.options[i]
      }
      return h('div', { className: 'wbs-dd', ref: box },
        h(Btn, { size: 'sm', onClick: function () { setOpen(!isOpen) } },
          (props.label ? props.label + ' · ' : '') + (current === null ? '—' : current.label) + ' ▾'),
        isOpen ? h('div', { className: 'wbs-dd-list' }, props.options.map(function (option) {
          return h('button', {
            key: option.value,
            type: 'button',
            className: 'wbs-dd-opt',
            'data-on': option.value === props.value ? '1' : '0',
            onClick: function () {
              setOpen(false)
              props.onChange(option.value)
            },
          }, option.label)
        })) : null)
    }

    function Modal(props) {
      useEffect(function () {
        function onKey(event) {
          if (event.key === 'Escape') props.onClose()
        }
        document.addEventListener('keydown', onKey)
        return function () { document.removeEventListener('keydown', onKey) }
      }, [])
      return h('div', { className: 'wbs-mask', onMouseDown: function (event) {
        if (event.target === event.currentTarget) props.onClose()
      } },
        h('div', { className: 'wbs-modal' },
          h('div', { className: 'wbs-modal-head' },
            h('div', { className: 'wbs-card-name' }, props.title),
            h('div', { className: 'wbs-grow' }),
            props.headRight,
            h(Btn, { size: 'sm', onClick: props.onClose }, t('close'))),
          h('div', { className: 'wbs-modal-body' }, props.children),
          props.footer ? h('div', { className: 'wbs-modal-foot' }, props.footer) : null))
    }

    function useLoad(load) {
      var st = useState({ data: null, error: '', busy: true })
      var value = st[0]
      var set = st[1]
      var run = useCallback(function () {
        set(function (previous) { return Object.assign({}, previous, { busy: true, error: '' }) })
        return load().then(function (data) {
          set({ data: data, error: '', busy: false })
        }).catch(function (error) {
          set(function (previous) { return { data: previous.data, error: String(error.message || error), busy: false } })
        })
      }, [])
      useEffect(function () { run() }, [])
      return { value: value, reload: run }
    }


    /* ---------- shared bits ---------- */

    function initialsOf(name) {
      var text = String(name === undefined || name === null ? '' : name).trim()
      return text === '' ? '?' : text.slice(0, 1).toUpperCase()
    }

    function Avatar(props) {
      var cls = 'wbs-avatar' + (props.size === 'lg' ? ' wbs-avatar-lg' : '')
      var src = props.src
      if (src !== undefined && src !== null && src !== '') {
        return h('img', { className: cls, src: src, alt: '', loading: 'lazy' })
      }
      return h('div', { className: cls }, initialsOf(props.name))
    }

    function Icon(props) {
      var src = props.src
      if (src !== undefined && src !== null && src !== '') {
        return h('img', { className: 'wbs-icon', src: src, alt: '', loading: 'lazy' })
      }
      return h('div', { className: 'wbs-icon', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600 } }, initialsOf(props.name))
    }

    function Section(props) {
      return h('div', { className: 'wbs-sec' },
        h('span', null, props.label),
        h('span', { className: 'wbs-sec-line' }),
        props.extra ? h('span', { className: 'wbs-muted' }, props.extra) : null)
    }

    function Desc(props) {
      var text = props.text === undefined || props.text === null || props.text === '' ? '—' : String(props.text)
      return h('div', {
        className: 'wbs-card-desc',
        'data-clamp': props.clamp === 3 ? '3' : undefined,
        title: text,
      }, text)
    }

    /** Card-level click that ignores clicks which landed on a button inside. */
    function cardClick(onOpen) {
      return function (event) {
        var target = event.target
        if (target !== null && target !== undefined && typeof target.closest === 'function' && target.closest('button') !== null) return
        onOpen()
      }
    }

    /* ---------- experts pane ---------- */

    function avatarOf(expert) {
      return h(Avatar, { src: expert.avatarUrl, name: expert.name })
    }

    function ExpertCard(props) {
      var expert = props.expert
      return h('div', { className: 'wbs-card', onClick: cardClick(function () { props.onDetail(expert) }) },
        h('div', { className: 'wbs-card-top' },
          avatarOf(expert),
          h('div', { className: 'wbs-col', style: { gap: '2px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name' },
              expert.name,
              expert.kind === 'team' ? h('span', { className: 'wbs-tag', style: { marginLeft: '6px' } }, t('teamTag')) : null),
            expert.profession !== undefined && expert.profession !== ''
              ? h('div', { className: 'wbs-muted' }, expert.profession)
              : null)),
        h(Desc, { text: expert.description, clamp: 3 }),
        h(Tags, { items: expert.tags }),
        h('div', { className: 'wbs-card-foot' },
          expert.installed
            ? h(Btn, { size: 'sm', kind: 'danger', disabled: props.busy, onClick: function () { props.onUninstall(expert) } }, t('uninstall'))
            : h(Btn, { size: 'sm', kind: 'primary', disabled: props.busy, onClick: function () { props.onInstall(expert) } },
              props.busy ? t('installing') : t('install')),
          h('div', { className: 'wbs-grow' }),
          h(Btn, { size: 'sm', onClick: function () { props.onDetail(expert) } }, t('detail'))))
    }

    function ExpertDetail(props) {
      var expert = props.expert
      var en = expert.descriptionEn !== undefined && expert.descriptionEn !== '' && expert.descriptionEn !== expert.description ? expert.descriptionEn : ''
      var prompts = expert.quickPrompts || []
      var skills = expert.skills || []
      return h(Modal, {
        title: expert.name,
        onClose: props.onClose,
        footer: h('div', { className: 'wbs-row' },
          h(Btn, { onClick: props.onClose }, t('close')),
          expert.installed
            ? h(Btn, { kind: 'danger', disabled: props.busy, onClick: function () { props.onUninstall(expert) } }, t('uninstall'))
            : h(Btn, { kind: 'primary', disabled: props.busy, onClick: function () { props.onInstall(expert) } },
              props.busy ? t('installing') : t('install'))),
      },
        h('div', { className: 'wbs-row', style: { gap: '12px', alignItems: 'flex-start' } },
          h(Avatar, { src: expert.avatarUrl, name: expert.name, size: 'lg' }),
          h('div', { className: 'wbs-col', style: { gap: '3px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name', style: { fontSize: '15px' } },
              expert.name,
              expert.kind === 'team' ? h('span', { className: 'wbs-tag', style: { marginLeft: '6px' } }, t('teamTag')) : null),
            expert.nameEn !== undefined && expert.nameEn !== '' && expert.nameEn !== expert.name
              ? h('div', { className: 'wbs-muted' }, expert.nameEn)
              : null,
            expert.profession !== undefined && expert.profession !== ''
              ? h('div', { className: 'wbs-muted' }, expert.profession)
              : null)),
        h('div', { className: 'wbs-kv' },
          h('div', { className: 'wbs-kv-k' }, 'ID'),
          h('div', { className: 'wbs-id' }, expert.id),
          expert.categoryName !== undefined && expert.categoryName !== ''
            ? h('div', { className: 'wbs-kv-k' }, t('category'))
            : null,
          expert.categoryName !== undefined && expert.categoryName !== ''
            ? h('div', null, expert.categoryName)
            : null),
        h('div', { className: 'wbs-desc-full' }, expert.description || '—'),
        en === '' ? null : h('div', { className: 'wbs-desc-full', 'data-lang': '1' }, en),
        expert.allTags !== undefined && expert.allTags.length > 0 ? h(Tags, { items: expert.allTags }) : null,
        prompts.length === 0 ? null : h('div', { className: 'wbs-col', style: { gap: '6px' } },
          h('div', { className: 'wbs-label' }, t('quickPrompts')),
          h('div', { className: 'wbs-chips' }, prompts.map(function (item, index) {
            return h('span', { className: 'wbs-tag', key: index }, item)
          }))),
        skills.length === 0 ? null : h('div', { className: 'wbs-col', style: { gap: '6px' } },
          h('div', { className: 'wbs-label' }, 'Skills'),
          h('div', { className: 'wbs-chips' }, skills.map(function (name, index) {
            return h('span', { className: 'wbs-tag', key: index }, name)
          }))))
    }

    function ExpertsPane(props) {
      var query = useState('')
      var filter = useState('all')
      var category = useState('')
      var sort = useState('default')
      var busyId = useState('')
      var detail = useState(null)
      var experts = props.data.experts || []
      var categories = props.data.expertCategories || []
      var q = query[0].trim().toLowerCase()
      var filtered = useMemo(function () {
        var list = experts.filter(function (expert) {
          if (filter[0] === 'installed' && !expert.installed) return false
          if (filter[0] === 'available' && expert.installed) return false
          if (filter[0] === 'team' && expert.kind !== 'team') return false
          if (category[0] !== '' && expert.categoryId !== category[0]) return false
          if (q === '') return true
          var hay = [expert.id, expert.name, expert.profession, expert.description].concat(expert.tags || []).join(' ').toLowerCase()
          return hay.indexOf(q) >= 0
        })
        if (sort[0] === 'name') list = list.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN') })
        if (sort[0] === 'origin') list = list.slice().sort(function (a, b) { return String(a.origin).localeCompare(String(b.origin)) })
        return list
      }, [experts, q, filter[0], sort[0], category[0]])
      var counts = useMemo(function () {
        return {
          all: experts.length,
          installed: experts.filter(function (e) { return e.installed }).length,
          team: experts.filter(function (e) { return e.kind === 'team' }).length,
        }
      }, [experts])

      function act(promise, id) {
        busyId[1](id)
        promise.then(function () {
          busyId[1]('')
          props.onReload()
        }).catch(function (error) {
          busyId[1]('')
          props.onError(t('failed') + ': ' + String(error.message || error))
        })
      }

      var showCategories = categories.filter(function (item) { return item.count > 0 })

      return h('div', { className: 'wbs-col' },
        h('div', { className: 'wbs-bar' },
          h('input', {
            className: 'wbs-input',
            placeholder: t('searchExperts'),
            value: query[0],
            onChange: function (event) { query[1](event.target.value) },
          }),
          h('div', { className: 'wbs-grow' }),
          h(Dropdown, {
            label: t('sort'),
            value: sort[0],
            options: [
              { value: 'default', label: t('sortDefault') },
              { value: 'name', label: t('sortName') },
              { value: 'origin', label: t('sortOrigin') },
            ],
            onChange: function (value) { sort[1](value) },
          })),
        h('div', { className: 'wbs-chips' },
          h(Chip, { on: filter[0] === 'all', onClick: function () { filter[1]('all') } }, t('all') + ' ' + counts.all),
          h(Chip, { on: filter[0] === 'installed', onClick: function () { filter[1]('installed') } }, t('installed') + ' ' + counts.installed),
          h(Chip, { on: filter[0] === 'available', onClick: function () { filter[1]('available') } }, t('available')),
          h(Chip, { on: filter[0] === 'team', onClick: function () { filter[1]('team') } }, t('teams') + ' ' + counts.team)),
        showCategories.length === 0 ? null : h('div', { className: 'wbs-chips' },
          h(Chip, { on: category[0] === '', onClick: function () { category[1]('') } }, t('category') + ': ' + t('all')),
          showCategories.map(function (item) {
            return h(Chip, {
              key: item.id,
              on: category[0] === item.id,
              onClick: function () { category[1](category[0] === item.id ? '' : item.id) },
            }, item.name + ' ' + item.count)
          })),
        h('div', { className: 'wbs-note' }, t('expertsHint')),
        filtered.length === 0
          ? h('div', { className: 'wbs-empty' }, t('emptyExperts'))
          : h('div', { className: 'wbs-grid' }, filtered.map(function (expert) {
              return h(ExpertCard, {
                key: expert.key,
                expert: expert,
                busy: busyId[0] === expert.id,
                onInstall: function (item) { act(post('/experts/install', { id: item.id, locale: locale.active }), item.id) },
                onUninstall: function (item) { act(post('/experts/uninstall', { id: item.id }), item.id) },
                onDetail: function (item) { detail[1](item) },
              })
            })),
        detail[0] === null ? null : h(ExpertDetail, {
          expert: detail[0],
          busy: busyId[0] === detail[0].id,
          onClose: function () { detail[1](null) },
          onInstall: function (item) { act(post('/experts/install', { id: item.id, locale: locale.active }), item.id) },
          onUninstall: function (item) { act(post('/experts/uninstall', { id: item.id }), item.id) },
        }))
    }

    /* ---------- skills pane ---------- */

    var SKILL_TEMPLATE = { name: '', description: '', scope: 'user' }

    function CreateSkillModal(props) {
      var form = useState(SKILL_TEMPLATE)
      var value = form[0]
      function patch(next) { form[1](Object.assign({}, value, next)) }
      return h(Modal, {
        title: t('createSkill'),
        onClose: props.onClose,
        footer: h('div', { className: 'wbs-row' },
          h(Btn, { onClick: props.onClose }, t('cancel')),
          h(Btn, { kind: 'primary', disabled: value.name.trim() === '' || value.description.trim() === '', onClick: function () {
            props.onCreate({ name: value.name.trim(), description: value.description.trim(), scope: value.scope })
          } }, t('save'))),
      },
        h('div', { className: 'wbs-field' },
          h('div', { className: 'wbs-label' }, t('skillName')),
          h('input', { className: 'wbs-input', value: value.name, placeholder: 'my-skill', onChange: function (event) { patch({ name: event.target.value }) } })),
        h('div', { className: 'wbs-field' },
          h('div', { className: 'wbs-label' }, t('skillDescription')),
          h('input', { className: 'wbs-input', value: value.description, onChange: function (event) { patch({ description: event.target.value }) } })),
        h('div', { className: 'wbs-field' },
          h('div', { className: 'wbs-label' }, t('skillScope')),
          h('div', { className: 'wbs-chips' },
            ['user', 'project'].map(function (scope) {
              return h('Chip', { key: scope, on: value.scope === scope, onClick: function () { patch({ scope }) } },
                t(scope === 'user' ? 'scopeUser' : 'scopeProject'))
            }))))
    }

    /** 12345 -> 1.2w so counters read like the marketplace's own numbers. */
    function compactCount(value) {
      var n = Number(value)
      if (!isFinite(n) || n <= 0) return '0'
      if (n >= 100000000) return (Math.round(n / 1000000) / 100) + '亿'
      if (n >= 10000) return (Math.round(n / 1000) / 10) + 'w'
      return String(Math.round(n))
    }

    function Stats(props) {
      var item = props.item
      return h('div', { className: 'wbs-stats' },
        h('span', { className: 'wbs-stat', title: t('installsLabel') }, '⚡ ' + compactCount(item.installs)),
        h('span', { className: 'wbs-stat', title: t('downloadsLabel') }, '⬇ ' + compactCount(item.downloads)),
        item.requiresApiKey ? h('span', { className: 'wbs-badge' }, t('requiresApiKey')) : null)
    }

    function marketInstallButton(item, busy, onInstall) {
      if (item.installed) return h('span', { className: 'wbs-badge' }, t('installedTag'))
      return h('button', {
        type: 'button',
        className: 'wbs-plus',
        'data-done': busy ? '1' : '0',
        title: t('installSkill'),
        disabled: busy,
        onClick: function (event) { event.stopPropagation(); onInstall(item) },
      }, busy ? '…' : '+')
    }

    /** One card of the remote skill marketplace. */
    function MarketCard(props) {
      var item = props.item
      return h('div', { className: 'wbs-card', onClick: cardClick(function () { props.onDetail(item) }) },
        h('div', { className: 'wbs-card-top' },
          h(Icon, { src: item.iconUrl, name: item.name }),
          h('div', { className: 'wbs-col', style: { gap: '2px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name' }, item.name),
            item.owner !== '' ? h('div', { className: 'wbs-muted' }, item.owner) : null),
          marketInstallButton(item, props.busy, props.onInstall)),
        h(Desc, { text: item.description, clamp: 3 }),
        h(Stats, { item: item }))
    }

    /** The featured trio: same card, slightly stronger presence. */
    function FeaturedCard(props) {
      var item = props.item
      return h('div', { className: 'wbs-card wbs-featured-card', onClick: cardClick(function () { props.onDetail(item) }) },
        h('div', { className: 'wbs-card-top' },
          h(Icon, { src: item.iconUrl, name: item.name }),
          h('div', { className: 'wbs-col', style: { gap: '2px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name' }, item.name),
            item.owner !== '' ? h('div', { className: 'wbs-muted' }, item.owner) : null),
          marketInstallButton(item, props.busy, props.onInstall)),
        h(Desc, { text: item.description, clamp: 3 }),
        h(Stats, { item: item }))
    }

    function MarketDetail(props) {
      var item = props.detail !== null && props.detail !== undefined ? props.detail : props.item
      var examples = item.examples || []
      var en = ''
      if (item.descriptionEn !== undefined && item.descriptionEn !== null && item.descriptionEn !== '' && item.descriptionEn !== item.description) {
        // Only worth a second paragraph when the marketplace actually has a
        // different-language original; some entries repeat the Chinese text.
        var latin = (String(item.descriptionEn).match(/[A-Za-z]/g) || []).length
        var cjk = (String(item.descriptionEn).match(/[\u4e00-\u9fff]/g) || []).length
        if (latin > cjk) en = item.descriptionEn
      }
      return h(Modal, {
        title: item.name,
        onClose: props.onClose,
        footer: h('div', { className: 'wbs-row' },
          h(Btn, { onClick: props.onClose }, t('close')),
          item.installed
            ? h('span', { className: 'wbs-muted' }, t('installedTag'))
            : h(Btn, { kind: 'primary', disabled: props.busy, onClick: function () { props.onInstall(item) } },
              props.busy ? t('installingSkill') : t('installSkill'))),
      },
        h('div', { className: 'wbs-row', style: { gap: '12px', alignItems: 'flex-start' } },
          h('img', { className: 'wbs-icon wbs-icon-lg', src: item.iconUrl, alt: '', loading: 'lazy' }),
          h('div', { className: 'wbs-col', style: { gap: '3px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name', style: { fontSize: '15px' } }, item.name),
            item.owner !== '' ? h('div', { className: 'wbs-muted' }, t('ownerLabel') + ' · ' + item.owner) : null,
            h(Stats, { item: item }))),
        h('div', { className: 'wbs-kv' },
          h('div', { className: 'wbs-kv-k' }, 'ID'),
          h('div', { className: 'wbs-id' }, item.id),
          item.version !== undefined && item.version !== '' ? h('div', { className: 'wbs-kv-k' }, t('versionsLabel')) : null,
          item.version !== undefined && item.version !== '' ? h('div', null, 'v' + item.version) : null,
          item.security !== undefined && item.security !== '' ? h('div', { className: 'wbs-kv-k' }, t('security')) : null,
          item.security !== undefined && item.security !== '' ? h('div', null, item.security) : null),
        h('div', { className: 'wbs-desc-full' }, item.description || '—'),
        en === '' ? null : h('div', { className: 'wbs-desc-full', 'data-lang': '1' }, en),
        item.changelog !== undefined && item.changelog !== '' ? h('div', { className: 'wbs-col', style: { gap: '5px' } },
          h('div', { className: 'wbs-label' }, t('changelogLabel')),
          h('div', { className: 'wbs-note' }, item.changelog)) : null,
        examples.length === 0 ? null : h('div', { className: 'wbs-col', style: { gap: '6px' } },
          h('div', { className: 'wbs-label' }, t('examples')),
          h('div', { className: 'wbs-chips' }, examples.map(function (text, index) {
            return h('span', { className: 'wbs-tag', key: index }, text)
          }))),
        props.loading ? h('div', { className: 'wbs-note' }, t('loading')) : null)
    }

    /** A skill that already lives on disk (DSH roots + WorkBuddy import source). */
    function LocalSkillCard(props) {
      var skill = props.skill
      var meta = (t('origins')[skill.origin] || skill.origin)
        + (skill.version ? ' · v' + skill.version : '')
        + (skill.files ? ' · ' + skill.files + ' files' : '')
      return h('div', { className: 'wbs-card', onClick: cardClick(function () { props.onDetail(skill) }) },
        h('div', { className: 'wbs-card-top' },
          h(Icon, { name: skill.name }),
          h('div', { className: 'wbs-col', style: { gap: '3px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name' }, skill.name),
            h('div', { className: 'wbs-muted' }, meta))),
        h(Desc, { text: skill.description, clamp: 3 }),
        skill.valid === false ? h('div', { className: 'wbs-err' }, skill.problem) : null,
        h('div', { className: 'wbs-row', style: { gap: '12px', flexWrap: 'wrap' } },
          h('label', { className: 'wbs-switch' },
            h('input', {
              type: 'checkbox',
              checked: skill.modelInvocable !== false,
              disabled: props.busy,
              onChange: function (event) { props.onFlag(skill, { modelInvocable: event.target.checked }) },
            }),
            t('modelInvocable')),
          h('label', { className: 'wbs-switch' },
            h('input', {
              type: 'checkbox',
              checked: skill.userInvocable !== false,
              disabled: props.busy,
              onChange: function (event) { props.onFlag(skill, { userInvocable: event.target.checked }) },
            }),
            t('userInvocable'))),
        h('div', { className: 'wbs-card-foot' },
          h(Btn, { size: 'sm', onClick: function () { props.onDetail(skill) } }, t('detail')),
          skill.origin === 'workbuddy'
            ? h(Btn, { size: 'sm', kind: 'primary', disabled: props.busy, onClick: function () { props.onImport(skill) } }, t('importWorkbuddy'))
            : null,
          h('div', { className: 'wbs-grow' }),
          skill.managed
            ? h(Btn, { size: 'sm', kind: 'danger', disabled: props.busy, onClick: function () { props.onRemove(skill) } }, t('removeSkill'))
            : null))
    }

    function LocalSkillDetail(props) {
      var skill = props.skill
      var detail = props.detail
      var files = detail !== null && detail !== undefined && detail.files !== undefined ? detail.files : []
      var body = detail !== null && detail !== undefined && detail.body !== undefined ? detail.body : ''
      return h(Modal, {
        title: skill.name,
        onClose: props.onClose,
      },
        h('div', { className: 'wbs-kv' },
          h('div', { className: 'wbs-kv-k' }, t('category')),
          h('div', null, (t('origins')[skill.origin] || skill.origin) + (skill.version ? ' · v' + skill.version : '')),
          h('div', { className: 'wbs-kv-k' }, 'ID'),
          h('div', { className: 'wbs-id' }, skill.key)),
        h('div', { className: 'wbs-desc-full' }, skill.description || '—'),
        files.length === 0 ? null : h('div', { className: 'wbs-row', style: { flexWrap: 'wrap', gap: '6px' } }, files.map(function (item, index) {
          return h('span', { className: 'wbs-tag', key: index }, (item.dir ? '▸ ' : '') + item.name)
        })),
        body === '' ? null : h('pre', { className: 'wbs-pre' }, body))
    }

    function SkillsPane(props) {
      var query = useState('')
      var keyword = useState('')
      var category = useState('')
      var sortBy = useState('installs')
      var page = useState(1)
      var seed = useState(0)
      var tick = useState(0)
      var creating = useState(false)
      var busy = useState('')
      var market = useState({ data: null, error: '', busy: true })
      var shown = useState(null)
      var shownDetail = useState(null)
      var detailLoading = useState(false)
      var skills = props.data.skills || []
      var q = query[0].trim()

      // Debounce the search box so typing does not hammer the marketplace.
      useEffect(function () {
        if (q === '') {
          if (keyword[0] !== '') { keyword[1](''); page[1](1) }
          return undefined
        }
        var timer = setTimeout(function () {
          keyword[1](q)
          page[1](1)
        }, 350)
        return function () { clearTimeout(timer) }
      }, [q])

      var params = [
        'page=' + page[0],
        'pageSize=24',
        'sortBy=' + encodeURIComponent(sortBy[0]),
        'seed=' + seed[0],
        'tick=' + tick[0],
      ]
      if (category[0] !== '') params.push('category=' + encodeURIComponent(category[0]))
      if (keyword[0] !== '') params.push('keyword=' + encodeURIComponent(keyword[0]))
      var marketKey = params.join('&')

      useEffect(function () {
        var cancelled = false
        market[1](function (previous) { return Object.assign({}, previous, { busy: true, error: '' }) })
        api('/skill-market?' + marketKey).then(function (value) {
          if (!cancelled) market[1]({ data: value, error: '', busy: false })
        }).catch(function (error) {
          if (!cancelled) market[1](function (previous) {
            return { data: previous.data, error: String(error.message || error), busy: false }
          })
        })
        return function () { cancelled = true }
      }, [marketKey])

      var value = market[0]
      var data = value.data
      var cards = (data !== null && data !== undefined && data.cards !== undefined) ? data.cards : []
      var featured = (data !== null && data !== undefined && data.featured !== undefined) ? data.featured : []

      // The host flags a card from the skill folder name, but a marketplace
      // install keeps its folder while SKILL.md may rename the skill, and a
      // fresh install only shows up once the host re-reads its module. Match
      // the local skills we already have in state so the badge is right now.
      var localIds = {}
      skills.forEach(function (skill) {
        var key = String(skill.key || '')
        var cut = key.lastIndexOf(':')
        var folder = cut >= 0 ? key.slice(cut + 1) : key
        folder.split(/[\\/]/).forEach(function (part) {
          if (part !== '') localIds[part.toLowerCase()] = true
        })
        if (skill.name) localIds[String(skill.name).toLowerCase()] = true
      })
      function withInstalled(item) {
        if (item.installed === true) return item
        var slug = String(item.slug || '').toLowerCase()
        var id = String(item.id || '').toLowerCase()
        var tail = id.slice(id.lastIndexOf('/') + 1)
        if (localIds[slug] === true || localIds[id] === true || localIds[tail] === true) {
          return Object.assign({}, item, { installed: true })
        }
        return item
      }
      cards = cards.map(withInstalled)
      featured = featured.map(withInstalled)
      var categories = (data !== null && data !== undefined && data.categories !== undefined) ? data.categories : []
      var total = (data !== null && data !== undefined && data.total !== undefined) ? data.total : 0
      var pageCount = (data !== null && data !== undefined && data.pageCount !== undefined) ? data.pageCount : 1
      var pageNow = (data !== null && data !== undefined && data.page !== undefined) ? data.page : page[0]

      function refresh() {
        tick[1](tick[0] + 1)
        props.onReload()
      }

      function install(item) {
        busy[1](item.id)
        post('/skills/install-market', { slug: item.slug, namespace: item.namespace }).then(function () {
          busy[1]('')
          refresh()
        }).catch(function (error) {
          busy[1]('')
          props.onError(t('connectFailed') + ': ' + String(error.message || error))
        })
      }

      function act(path, body, id) {
        busy[1](id)
        post(path, body).then(function () {
          busy[1]('')
          refresh()
        }).catch(function (error) {
          busy[1]('')
          props.onError(String(error.message || error))
        })
      }

      function openMarket(item) {
        shown[1](item)
        shownDetail[1](null)
        detailLoading[1](true)
        api('/skill-market-detail?slug=' + encodeURIComponent(item.slug) + '&ns=' + encodeURIComponent(item.namespace || ''))
          .then(function (detail) {
            detailLoading[1](false)
            shownDetail[1](Object.assign({}, item, detail))
          })
          .catch(function () {
            detailLoading[1](false)
            shownDetail[1](item)
          })
      }

      function openLocal(skill) {
        shown[1]({ local: skill })
        shownDetail[1](null)
        detailLoading[1](true)
        api('/skill-detail?key=' + encodeURIComponent(skill.key)).then(function (detail) {
          detailLoading[1](false)
          shownDetail[1](detail)
        }).catch(function () {
          detailLoading[1](false)
          shownDetail[1](null)
        })
      }

      var current = shown[0]
      var isLocal = current !== null && current !== undefined && current.local !== undefined

      return h('div', { className: 'wbs-col' },
        h('div', { className: 'wbs-bar' },
          h('input', {
            className: 'wbs-input',
            placeholder: t('searchSkills'),
            value: query[0],
            onChange: function (event) { query[1](event.target.value) },
          }),
          h('div', { className: 'wbs-grow' }),
          h(Btn, { disabled: value.busy, onClick: refresh }, value.busy ? t('loading') : t('refresh')),
          h(Dropdown, {
            label: t('sort'),
            value: sortBy[0],
            options: [
              { value: 'installs', label: t('sortInstalls') },
              { value: 'downloads', label: t('sortDownloads') },
              { value: 'stars', label: t('sortStars') },
              { value: 'updated_at', label: t('sortUpdated') },
            ],
            onChange: function (next) { sortBy[1](next); page[1](1) },
          }),
          h(Btn, { kind: 'primary', onClick: function () { creating[1](true) } }, t('addSkill'))),
        h('div', { className: 'wbs-note' }, t('recommendedHint')),
        value.error !== '' ? h('div', { className: 'wbs-err' }, t('marketFailed') + ': ' + value.error) : null,
        featured.length === 0 ? null : h('div', { className: 'wbs-col', style: { gap: '8px' } },
          h(Section, {
            label: t('featured'),
            extra: h('button', {
              type: 'button',
              className: 'wbs-chip',
              onClick: function (event) { event.stopPropagation(); seed[1](seed[0] + 1) },
            }, t('refreshBatch')),
          }),
          h('div', { className: 'wbs-featured' }, featured.map(function (item) {
            return h(FeaturedCard, {
              key: item.key,
              item: item,
              busy: busy[0] === item.id,
              onInstall: install,
              onDetail: openMarket,
            })
          }))),
        h('div', { className: 'wbs-chips' },
          h(Chip, { on: category[0] === '', onClick: function () { category[1](''); page[1](1) } }, t('all')),
          categories.map(function (item) {
            return h(Chip, {
              key: item.key,
              on: category[0] === item.key,
              onClick: function () { category[1](category[0] === item.key ? '' : item.key); page[1](1) },
            }, item.name)
          })),
        h(Section, {
          label: keyword[0] === '' ? t('recommended') : t('searchSkills'),
          extra: String(total) + ' ' + t('marketCount'),
        }),
        cards.length === 0
          ? h('div', { className: 'wbs-empty' }, value.busy ? t('loading') : t('emptySkills'))
          : h('div', { className: 'wbs-grid' }, cards.map(function (item) {
              return h(MarketCard, {
                key: item.key,
                item: item,
                busy: busy[0] === item.id,
                onInstall: install,
                onDetail: openMarket,
              })
            })),
        h('div', { className: 'wbs-pagebar' },
          h(Btn, { size: 'sm', disabled: pageNow <= 1 || value.busy, onClick: function () { page[1](Math.max(1, pageNow - 1)) } }, t('pagePrev')),
          h('span', { className: 'wbs-muted' }, t('pageLabel').replace('%s', String(pageNow)).replace('%s', String(pageCount))),
          h(Btn, { size: 'sm', disabled: pageNow >= pageCount || value.busy, onClick: function () { page[1](Math.min(pageCount, pageNow + 1)) } }, t('pageNext'))),
        h(Section, { label: t('localSkills'), extra: String(skills.length) }),
        skills.length === 0
          ? h('div', { className: 'wbs-empty' }, t('emptySkills'))
          : h('div', { className: 'wbs-grid' }, skills.map(function (skill) {
              return h(LocalSkillCard, {
                key: skill.key,
                skill: skill,
                busy: busy[0] === skill.key,
                onDetail: openLocal,
                onFlag: function (item, flags) { act('/skills/flags', Object.assign({ key: item.key }, flags), item.key) },
                onImport: function (item) { act('/skills/import', { key: item.key }, item.key) },
                onRemove: function (item) {
                  if (window.confirm(t('confirmRemove'))) act('/skills/remove', { key: item.key }, item.key)
                },
              })
            })),
        current === null || current === undefined ? null : (isLocal
          ? h(LocalSkillDetail, {
              skill: current.local,
              detail: shownDetail[0],
              onClose: function () { shown[1](null); shownDetail[1](null) },
            })
          : h(MarketDetail, {
              item: current,
              detail: shownDetail[0],
              loading: detailLoading[0],
              busy: busy[0] === current.id,
              onInstall: install,
              onClose: function () { shown[1](null); shownDetail[1](null) },
            })),
        creating[0] ? h(CreateSkillModal, {
          onClose: function () { creating[1](false) },
          onCreate: function (payload) {
            post('/skills/create', payload).then(function () {
              creating[1](false)
              refresh()
            }).catch(function (error) { props.onError(String(error.message || error)) })
          },
        }) : null)
    }

    /* ---------- connectors pane ---------- */

    var EMPTY_FORM = {
      id: '',
      name: '',
      transport: 'stdio',
      command: '',
      argsText: '',
      url: '',
      cwd: '',
      note: '',
    }

    function formOf(connector) {
      return {
        id: connector.id,
        name: connector.name,
        transport: connector.transport,
        command: connector.command,
        argsText: (connector.args || []).join('\n'),
        url: connector.url,
        cwd: connector.cwd || '',
        note: connector.note || '',
      }
    }

    function ConnectorCard(props) {
      var connector = props.connector
      var panel = useState({ open: false, busy: false, tools: null, error: '', result: '' })
      var state = panel[0]
      var set = panel[1]

      function probe() {
        set(Object.assign({}, state, { busy: true, error: '' }))
        post('/connectors/tools', { id: connector.id }).then(function (value) {
          set({ open: true, busy: false, tools: value.tools, error: '', result: '' })
        }).catch(function (error) {
          set({ open: true, busy: false, tools: null, error: String(error.message || error), result: '' })
        })
      }

      function call(name) {
        set(Object.assign({}, state, { busy: true, error: '', result: '' }))
        post('/connectors/call', { id: connector.id, name: name, args: {} }).then(function (value) {
          set(Object.assign({}, state, { busy: false, result: value.text || '(empty)' }))
        }).catch(function (error) {
          set(Object.assign({}, state, { busy: false, error: String(error.message || error) }))
        })
      }

      return h('div', { className: 'wbs-card', 'data-flat': '1' },
        h('div', { className: 'wbs-card-top' },
          h('div', { className: 'wbs-col', style: { gap: '3px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name' }, connector.name),
            h('div', { className: 'wbs-muted' }, connector.transport + (connector.command ? ' · ' + connector.command : '') + (connector.url ? ' · ' + connector.url : '')),
            connector.args !== undefined && connector.args.length > 0
              ? h('div', { className: 'wbs-muted', style: { wordBreak: 'break-all' } }, connector.args.join(' '))
              : null),
          h('div', { className: 'wbs-grow' }),
          h('label', { className: 'wbs-switch', title: connector.enabled ? t('enabled') : t('disabled') },
            h('input', {
              type: 'checkbox',
              checked: connector.enabled,
              onChange: function (event) { props.onToggle(connector, event.target.checked) },
            }),
            connector.enabled ? t('enabled') : t('disabled'))),
        connector.note !== '' ? h('div', { className: 'wbs-note' }, connector.note) : null,
        state.open
          ? h(Modal, {
              title: connector.name + ' · ' + (state.tools === null || state.tools === undefined ? t('probing') : state.tools.length + ' tools'),
              onClose: function () { set({ open: false, busy: false, tools: null, error: '', result: '' }) },
            },
              state.error !== '' ? h('div', { className: 'wbs-err' }, state.error) : null,
              state.result !== '' ? h('pre', { className: 'wbs-pre' }, state.result) : null,
              state.tools === null || state.tools === undefined
                ? h('div', { className: 'wbs-empty' }, state.error === '' ? t('probing') : '')
                : (state.tools.length === 0
                    ? h('div', { className: 'wbs-note' }, '(no tools)')
                    : h('div', { className: 'wbs-toollist' }, state.tools.map(function (tool) {
                        return h('div', { className: 'wbs-tool', key: tool.name },
                          h('div', { className: 'wbs-col', style: { gap: '1px', minWidth: 0, flex: 1 } },
                            h('div', { className: 'wbs-tool-name' }, tool.name),
                            h('div', { className: 'wbs-muted', style: { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, tool.description || '')),
                          h(Btn, { size: 'sm', disabled: state.busy, onClick: function () { call(tool.name) } }, t('callTool')))
                      }))))
          : null,
        h('div', { className: 'wbs-card-foot' },
          h(Btn, { size: 'sm', disabled: state.busy, onClick: probe }, state.busy ? t('probing') : t('probe')),
          h(Btn, { size: 'sm', onClick: function () { props.onEdit(connector) } }, t('editConnector')),
          h('div', { className: 'wbs-grow' }),
          h(Btn, { size: 'sm', kind: 'danger', onClick: function () { props.onDelete(connector) } }, t('delete'))))
    }

    function CatalogCard(props) {
      var item = props.item
      var badge = item.available === false ? t('unavailable') : (item.transport === 'streamable-http' ? 'HTTP MCP' : 'stdio MCP')
      return h('div', { className: 'wbs-card', onClick: cardClick(function () { props.onDetail(item) }) },
        h('div', { className: 'wbs-card-top' },
          h(Icon, { src: item.iconUrl, name: item.name }),
          h('div', { className: 'wbs-col', style: { gap: '2px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name' }, item.name),
            item.nameEn !== undefined && item.nameEn !== '' && item.nameEn !== item.name
              ? h('div', { className: 'wbs-muted' }, item.nameEn)
              : null),
          item.installed
            ? h('span', { className: 'wbs-badge' }, t('installedTag'))
            : h('button', {
                type: 'button',
                className: 'wbs-plus',
                'data-done': props.busy || item.available === false ? '1' : '0',
                title: item.available === false ? t('unavailable') : t('installConnector'),
                disabled: props.busy || item.available === false,
                onClick: function (event) {
                  event.stopPropagation()
                  props.onInstall(item)
                },
              }, props.busy ? '…' : '+')),
        h(Desc, { text: item.description, clamp: 3 }),
        h('div', { className: 'wbs-row', style: { gap: '6px', flexWrap: 'wrap' } },
          h('span', { className: 'wbs-badge' }, badge)))
    }

    function CatalogDetail(props) {
      var item = props.item
      var en = item.descriptionEn !== undefined && item.descriptionEn !== '' && item.descriptionEn !== item.description ? item.descriptionEn : ''
      var examples = item.examples || []
      return h(Modal, {
        title: item.name,
        onClose: props.onClose,
        footer: h('div', { className: 'wbs-row' },
          h(Btn, { onClick: props.onClose }, t('close')),
          item.available === false
            ? h('span', { className: 'wbs-muted' }, t('unavailable'))
            : (item.installed
                ? h('span', { className: 'wbs-muted' }, t('installedTag'))
                : h(Btn, { kind: 'primary', disabled: props.busy, onClick: function () { props.onInstall(item) } },
                  props.busy ? t('installingConnector') : t('installConnector')))),
      },
        h('div', { className: 'wbs-row', style: { gap: '12px', alignItems: 'flex-start' } },
          h(Icon, { src: item.iconUrl, name: item.name }),
          h('div', { className: 'wbs-col', style: { gap: '3px', minWidth: 0, flex: 1 } },
            h('div', { className: 'wbs-card-name', style: { fontSize: '15px' } }, item.name),
            item.nameEn !== undefined && item.nameEn !== '' && item.nameEn !== item.name
              ? h('div', { className: 'wbs-muted' }, item.nameEn)
              : null)),
        h('div', { className: 'wbs-kv' },
          h('div', { className: 'wbs-kv-k' }, 'ID'),
          h('div', { className: 'wbs-id' }, item.id),
          h('div', { className: 'wbs-kv-k' }, t('tutorialServer')),
          h('div', { className: 'wbs-id' }, item.serverName || '—'),
          item.available === false ? null : h('div', { className: 'wbs-kv-k' }, t('connectorTransport')),
          item.available === false ? null : h('div', null, item.transport),
          item.url !== undefined && item.url !== '' ? h('div', { className: 'wbs-kv-k' }, t('connectorUrl')) : null,
          item.url !== undefined && item.url !== '' ? h('div', { style: { wordBreak: 'break-all' } }, item.url) : null),
        h('div', { className: 'wbs-desc-full' }, item.description || '—'),
        en === '' ? null : h('div', { className: 'wbs-desc-full', 'data-lang': '1' }, en),
        item.available === false ? h('div', { className: 'wbs-note' }, t('noServerHint')) : null,
        examples.length === 0 ? null : h('div', { className: 'wbs-col', style: { gap: '6px' } },
          h('div', { className: 'wbs-label' }, t('examples')),
          h('div', { className: 'wbs-chips' }, examples.map(function (text, index) {
            return h('span', { className: 'wbs-tag', key: index }, text)
          }))))
    }

    function ConnectorsPane(props) {
      var query = useState('')
      var editing = useState(null)
      var form = useState(EMPTY_FORM)
      var busy = useState('')
      var detail = useState(null)
      var catalog = useLoad(function () { return api('/connector-catalog') })
      var connectors = props.data.connectors || []
      var seeds = props.data.connectorSeeds || []
      var items = (catalog.value.data !== null && catalog.value.data !== undefined && catalog.value.data.connectors) || []
      var installedIds = {}
      connectors.forEach(function (connector) { installedIds[connector.id] = true })
      var q = query[0].trim().toLowerCase()
      var installedList = connectors.filter(function (connector) {
        if (q === '') return true
        return (connector.id + ' ' + connector.name + ' ' + connector.command + ' ' + connector.url).toLowerCase().indexOf(q) >= 0
      })
      var catalogList = items.filter(function (item) {
        if (q === '') return true
        var hay = [item.id, item.name, item.nameEn, item.description].join(' ').toLowerCase()
        return hay.indexOf(q) >= 0
      })

      function act(path, body, id) {
        busy[1](id || '')
        post(path, body).then(function (value) {
          busy[1](id === undefined ? '' : '')
          props.onReload()
          return value
        }).catch(function (error) {
          busy[1]('')
          props.onError(String(error.message || error))
        })
      }

      function install(item) {
        busy[1](item.id)
        post('/connectors/install-catalog', { id: item.id }).then(function () {
          busy[1]('')
          props.onReload()
          catalog.reload()
        }).catch(function (error) {
          busy[1]('')
          props.onError(t('connectFailed') + ': ' + String(error.message || error))
        })
      }

      function openForm(connector) {
        form[1](connector === undefined || connector === null ? EMPTY_FORM : formOf(connector))
        editing[1](connector === undefined || connector === null ? {} : connector)
      }

      function save() {
        var value = form[0]
        var args = value.argsText.split('\n').map(function (line) { return line.trim() }).filter(function (line) { return line !== '' })
        act('/connectors/upsert', {
          id: value.id.trim(),
          name: value.name.trim(),
          transport: value.transport,
          command: value.command.trim(),
          args: args,
          url: value.url.trim(),
          cwd: value.cwd.trim(),
          note: value.note.trim(),
        }, value.id)
        editing[1](null)
      }

      return h('div', { className: 'wbs-col' },
        h('div', { className: 'wbs-bar' },
          h('input', {
            className: 'wbs-input',
            placeholder: t('searchCatalog'),
            value: query[0],
            onChange: function (event) { query[1](event.target.value) },
          }),
          h('div', { className: 'wbs-grow' }),
          seeds.length > 0
            ? h(Btn, { disabled: busy[0] === 'import', onClick: function () { act('/connectors/import', {}, 'import') } }, t('importWorkbuddy') + ' (' + seeds.length + ')')
            : null,
          h(Btn, { kind: 'primary', onClick: function () { openForm(undefined) } }, t('customConnector'))),
        h(Section, { label: t('installedConnectors'), extra: String(connectors.length) }),
        installedList.length === 0
          ? h('div', { className: 'wbs-empty' }, q === '' ? t('emptyConnectors') : t('catalogEmpty'))
          : h('div', { className: 'wbs-grid' }, installedList.map(function (connector) {
              return h(ConnectorCard, {
                key: connector.id,
                connector: connector,
                onToggle: function (item, enabled) { act('/connectors/enable', { id: item.id, enabled }, item.id) },
                onEdit: openForm,
                onDelete: function (item) {
                  if (window.confirm(t('confirmDelete'))) act('/connectors/remove', { id: item.id }, item.id)
                },
              })
            })),
        h(Section, {
          label: t('catalog'),
          extra: catalog.value.busy
            ? t('loading')
            : (String(items.length) + ' ' + t('catalogCount')),
        }),
        catalog.value.error !== ''
          ? h('div', { className: 'wbs-err' }, catalog.value.error)
          : null,
        catalog.value.data !== null && catalog.value.data !== undefined && catalog.value.data.found === false
          ? h('div', { className: 'wbs-note' }, t('catalogMissing'))
          : null,
        catalogList.length === 0
          ? h('div', { className: 'wbs-empty' }, catalog.value.busy ? t('loading') : t('catalogEmpty'))
          : h('div', { className: 'wbs-grid' }, catalogList.map(function (item) {
              return h(CatalogCard, {
                key: item.key,
                item: Object.assign({}, item, { installed: installedIds[item.id] === true }),
                busy: busy[0] === item.id,
                onInstall: install,
                onDetail: function (value) { detail[1](value) },
              })
            })),
        detail[0] === null ? null : h(CatalogDetail, {
          item: Object.assign({}, detail[0], { installed: installedIds[detail[0].id] === true }),
          busy: busy[0] === detail[0].id,
          onClose: function () { detail[1](null) },
          onInstall: install,
        }),
        editing[0] === null ? null : h(Modal, {
          title: editing[0].id === undefined ? t('addConnector') : t('editConnector'),
          onClose: function () { editing[1](null) },
          footer: h('div', { className: 'wbs-row' },
            h(Btn, { onClick: function () { editing[1](null) } }, t('cancel')),
            h(Btn, { kind: 'primary', onClick: save }, t('save'))),
        },
          h('div', { className: 'wbs-row', style: { gap: '10px' } },
            h('div', { className: 'wbs-field', style: { flex: '1 1 0' } },
              h('div', { className: 'wbs-label' }, t('connectorId')),
              h('input', { className: 'wbs-input', value: form[0].id, disabled: editing[0].id !== undefined, onChange: function (event) {
                form[1](Object.assign({}, form[0], { id: event.target.value }))
              } })),
            h('div', { className: 'wbs-field', style: { flex: '1 1 0' } },
              h('div', { className: 'wbs-label' }, t('connectorName')),
              h('input', { className: 'wbs-input', value: form[0].name, onChange: function (event) {
                form[1](Object.assign({}, form[0], { name: event.target.value }))
              } }))),
          h('div', { className: 'wbs-field' },
            h('div', { className: 'wbs-label' }, t('connectorTransport')),
            h('div', { className: 'wbs-chips' },
              ['stdio', 'streamable-http'].map(function (value) {
                return h(Chip, { key: value, on: form[0].transport === value, onClick: function () {
                  form[1](Object.assign({}, form[0], { transport: value }))
                } }, value)
              }))),
          form[0].transport === 'stdio'
            ? h('div', { className: 'wbs-col', style: { gap: '10px' } },
                h('div', { className: 'wbs-field' },
                  h('div', { className: 'wbs-label' }, t('connectorCommand')),
                  h('input', { className: 'wbs-input', value: form[0].command, placeholder: 'node', onChange: function (event) {
                    form[1](Object.assign({}, form[0], { command: event.target.value }))
                  } })),
                h('div', { className: 'wbs-field' },
                  h('div', { className: 'wbs-label' }, t('connectorArgs')),
                  h('textarea', { className: 'wbs-input', style: { height: '86px', padding: '8px 10px', resize: 'vertical' }, value: form[0].argsText, onChange: function (event) {
                    form[1](Object.assign({}, form[0], { argsText: event.target.value }))
                  } })))
            : h('div', { className: 'wbs-field' },
                h('div', { className: 'wbs-label' }, t('connectorUrl')),
                h('input', { className: 'wbs-input', value: form[0].url, placeholder: 'https://example.com/mcp', onChange: function (event) {
                  form[1](Object.assign({}, form[0], { url: event.target.value }))
                } }))))
    }

    /* ---------- root ---------- */

    var TABS = ['experts', 'skills', 'connectors']

    function SuiteRoot() {
      var tab = useState('experts')
      var notice = useState('')
      var loaded = useLoad(function () { return api('/state') })
      var data = loaded.value.data

      function onError(message) { notice[1](message) }

      var body = null
      if (loaded.value.busy && data === null) {
        body = h('div', { className: 'wbs-empty' }, t('loading'))
      } else if (data === null) {
        body = h('div', { className: 'wbs-empty' }, loaded.value.error || t('failed'))
      } else if (tab[0] === 'experts') {
        body = h(ExpertsPane, { data, onReload: loaded.reload, onError })
      } else if (tab[0] === 'skills') {
        body = h(SkillsPane, { data, onReload: loaded.reload, onError })
      } else {
        body = h(ConnectorsPane, { data, onReload: loaded.reload, onError })
      }

      return h('div', { className: 'wbs-root' },
        h('div', { className: 'wbs-head' },
          h('div', { className: 'wbs-title' }, t('title')),
          h('div', { className: 'wbs-sub' }, t('subtitle'))),
        h('div', { className: 'wbs-bar' },
          h('div', { className: 'wbs-tabs' }, TABS.map(function (value) {
            return h('button', {
              key: value,
              type: 'button',
              className: 'wbs-tab',
              'data-on': tab[0] === value ? '1' : '0',
              onClick: function () { tab[1](value) },
            }, t('tab' + value.charAt(0).toUpperCase() + value.slice(1)))
          })),
          h('div', { className: 'wbs-grow' }),
          data !== null ? h('span', { className: 'wbs-muted' }, data.scannedAt.replace('T', ' ').slice(0, 19)) : null,
          h(Btn, { size: 'sm', disabled: loaded.value.busy, onClick: function () {
            notice[1]('')
            post('/experts/refresh', {}).then(function () { loaded.reload() })
              .catch(function (error) { onError(String(error.message || error)) })
          } }, loaded.value.busy ? t('loading') : t('refresh'))),
        notice[0] !== '' ? h('div', { className: 'wbs-err' }, notice[0]) : null,
        loaded.value.error !== '' ? h('div', { className: 'wbs-err' }, loaded.value.error) : null,
        body,
        data !== null && data.expertWarnings !== undefined && data.expertWarnings.length > 0
          ? h('details', null,
              h('summary', { className: 'wbs-muted' }, t('warnings') + ' (' + data.expertWarnings.length + ')'),
              h('pre', { className: 'wbs-pre' }, data.expertWarnings.join('\n')))
          : null)
    }

    /* ---------- panel visibility store ---------- */

    var panelStore = { open: false, listeners: [] }

    function setPanelOpen(next) {
      panelStore.open = next === true
      for (var i = 0; i < panelStore.listeners.length; i += 1) {
        try { panelStore.listeners[i](panelStore.open) } catch (error) { void error }
      }
    }

    function usePanelOpen() {
      var state = useState(panelStore.open)
      useEffect(function () {
        var listener = function (value) { state[1](value) }
        panelStore.listeners.push(listener)
        listener(panelStore.open)
        return function () {
          var index = panelStore.listeners.indexOf(listener)
          if (index >= 0) panelStore.listeners.splice(index, 1)
        }
      }, [])
      return state[0]
    }

    function SuiteOverlay() {
      var open = usePanelOpen()
      useEffect(function () {
        if (!open) return undefined
        function onKey(event) { if (event.key === 'Escape') setPanelOpen(false) }
        document.addEventListener('keydown', onKey)
        return function () { document.removeEventListener('keydown', onKey) }
      }, [open])
      if (!open) return null
      return h('div', { className: 'wbs-shell-mask', onMouseDown: function (event) {
        if (event.target === event.currentTarget) setPanelOpen(false)
      } },
        h('div', { className: 'wbs-shell' },
          h('div', { className: 'wbs-shell-head' },
            h('div', { className: 'wbs-card-name' }, '◈ ' + t('nav')),
            h('div', { className: 'wbs-grow' }),
            h(Btn, { size: 'sm', onClick: function () { setPanelOpen(false) } }, t('close'))),
          h('div', { className: 'wbs-shell-body' }, h(SuiteRoot))))
    }

    /* ---------- registration ---------- */
    function apply(ctx) {
      var disposers = []
      function collect(disposer) {
        if (typeof disposer === 'function') disposers.push(disposer)
      }

      try {
        if (ctx.locale !== undefined) {
          ctx.locale.register(NS, DICTS)
          var bound = ctx.locale.bind(NS)
          if (typeof bound === 'function') {
            var original = t
            t = function (key) {
              var value = bound(key)
              return value === undefined || value === key ? original(key) : value
            }
          }
          var active = ctx.locale.getLocale()
          if (active !== null && typeof active === 'object' && (active.active === 'en' || active.active === 'zh')) {
            locale.active = active.active
          }
        }
      } catch (error) {
        ctx.logger?.warn?.('dsh-workbuddy-suite: locale unavailable', error)
      }

      if (ctx.slots === undefined) {
        ctx.logger?.warn?.('dsh-workbuddy-suite: slots service unavailable')
        return
      }

      function openPanel() {
        setPanelOpen(!panelStore.open)
      }

      collect(ctx.slots.inject('settings.section', function () {
        return ctx.slots.register({
          name: 'settings.section',
          id: 'workbuddy-suite',
          order: 46,
          label: function () { return t('nav') },
          locale: NS,
          inject: function () { return { t } },
        }, SuiteRoot)
      }))

      collect(ctx.slots.inject('sidebar.footer.action', function () {
        return ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'workbuddy-suite',
          order: 30,
          label: function () { return t('nav') },
          locale: NS,
        }, function SidebarAction() {
          return h('button', {
            type: 'button',
            className: 'wbs-btn',
            style: { width: '100%', justifyContent: 'flex-start' },
            title: t('title'),
            onClick: openPanel,
          }, '◈ ' + t('nav'))
        })
      }))

      collect(ctx.slots.inject('shell.overlay', function () {
        return ctx.slots.register({
          name: 'shell.overlay',
          id: 'workbuddy-suite-panel',
          order: 40,
          locale: NS,
        }, SuiteOverlay)
      }))

      collect(ensureStyle())
      ctx.effect(function () {
        return function () {
          for (var i = 0; i < disposers.length; i += 1) {
            try { disposers[i]() } catch (error) { void error }
          }
        }
      }, 'dsh-workbuddy-suite: client disposers')
    }

    module.exports.name = NAME
    module.exports.inject = ['slots', 'locale']
    module.exports.apply = apply
    return module.exports
  },
})
