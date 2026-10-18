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
      '.wbs-switch{display:inline-flex;align-items:center;gap:6px;font-size:12px;opacity:.8}',
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


    /* ---------- experts pane ---------- */

    function avatarOf(expert) {
      if (expert.avatarUrl !== undefined) {
        return h('img', { className: 'wbs-avatar', src: expert.avatarUrl, alt: '', loading: 'lazy' })
      }
      var letter = String(expert.name || expert.id || '?').slice(0, 1).toUpperCase()
      return h('div', { className: 'wbs-avatar' }, letter)
    }

    function ExpertCard(props) {
      var expert = props.expert
      return h('div', { className: 'wbs-card' },
        h('div', { className: 'wbs-card-top' },
          avatarOf(expert),
          h('div', { className: 'wbs-col', style: { gap: '2px', minWidth: 0 } },
            h('div', { className: 'wbs-card-name' }, expert.name,
              expert.kind === 'team' ? h('span', { className: 'wbs-tag', style: { marginLeft: '6px' } }, t('teamTag')) : null),
            expert.profession !== '' && expert.profession !== undefined
              ? h('div', { className: 'wbs-muted' }, expert.profession)
              : null)),
        h('div', { className: 'wbs-card-desc', title: expert.description }, expert.description || '—'),
        h(Tags, { items: expert.tags }),
        h('div', { className: 'wbs-card-foot' },
          expert.installed
            ? h(Btn, { size: 'sm', kind: 'danger', disabled: props.busy, onClick: function () { props.onUninstall(expert) } }, t('uninstall'))
            : h(Btn, { size: 'sm', kind: 'primary', disabled: props.busy, onClick: function () { props.onInstall(expert) } },
              props.busy ? t('installing') : t('install')),
          expert.installed ? h('span', { className: 'wbs-muted' }, t('installedTag')) : null,
          h('div', { className: 'wbs-grow' }),
          h(Btn, { size: 'sm', onClick: function () { props.onPreview(expert) } }, t('preview'))))
    }

    function ExpertsPane(props) {
      var query = useState('')
      var filter = useState('all')
      var sort = useState('default')
      var busyId = useState('')
      var preview = useState(null)
      var experts = props.data.experts || []
      var q = query[0].trim().toLowerCase()
      var filtered = useMemo(function () {
        var list = experts.filter(function (expert) {
          if (filter[0] === 'installed' && !expert.installed) return false
          if (filter[0] === 'available' && expert.installed) return false
          if (filter[0] === 'team' && expert.kind !== 'team') return false
          if (q === '') return true
          var hay = [expert.id, expert.name, expert.profession, expert.description].concat(expert.tags || []).join(' ').toLowerCase()
          return hay.indexOf(q) >= 0
        })
        if (sort[0] === 'name') list = list.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN') })
        if (sort[0] === 'origin') list = list.slice().sort(function (a, b) { return String(a.origin).localeCompare(String(b.origin)) })
        return list
      }, [experts, q, filter[0], sort[0]])
      var counts = useMemo(function () { return { all: experts.length, installed: experts.filter(function (e) { return e.installed }).length } }, [experts])

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
          h(Chip, { on: filter[0] === 'team', onClick: function () { filter[1]('team') } }, t('teams'))),
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
                onPreview: function (item) { preview[1](item) },
              })
            })),
        preview[0] === null ? null : h(Modal, {
          title: preview[0].name,
          onClose: function () { preview[1](null) },
        },
          h('div', { className: 'wbs-row' },
            avatarOf(preview[0]),
            h('div', { className: 'wbs-col', style: { gap: '2px' } },
              h('div', { className: 'wbs-card-name' }, preview[0].name),
              h('div', { className: 'wbs-muted' }, [preview[0].origin, preview[0].kind, preview[0].categoryId].filter(Boolean).join(' · ')))),
          h('div', { className: 'wbs-col', style: { gap: '6px' } },
            h('div', { className: 'wbs-label' }, 'ID'),
            h('div', { className: 'wbs-tool-name' }, preview[0].id)),
          h('div', { className: 'wbs-col', style: { gap: '6px' } },
            h('div', { className: 'wbs-label' }, 'Description'),
            h('div', { style: { lineHeight: 1.6 } }, preview[0].description || '—')),
          h(Tags, { items: preview[0].tags }),
          preview[0].skills !== undefined && preview[0].skills.length > 0
            ? h('div', { className: 'wbs-col', style: { gap: '6px' } },
                h('div', { className: 'wbs-label' }, 'Skills'),
                h('div', { className: 'wbs-chips' }, preview[0].skills.map(function (name, index) {
                  return h('span', { className: 'wbs-tag', key: index }, name)
                })))
            : null),
      )
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
              return h(Chip, { key: scope, on: value.scope === scope, onClick: function () { patch({ scope }) } },
                t(scope === 'user' ? 'scopeUser' : 'scopeProject'))
            }))))
    }

    function SkillsPane(props) {
      var query = useState('')
      var origin = useState('all')
      var sort = useState('default')
      var detail = useState(null)
      var creating = useState(false)
      var busy = useState('')
      var skills = props.data.skills || []
      var q = query[0].trim().toLowerCase()
      var filtered = useMemo(function () {
        var list = skills.filter(function (skill) {
          if (origin[0] !== 'all' && skill.origin !== origin[0]) return false
          if (q === '') return true
          return (skill.name + ' ' + skill.description).toLowerCase().indexOf(q) >= 0
        })
        if (sort[0] === 'name') list = list.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)) })
        return list
      }, [skills, q, origin[0], sort[0]])

      function act(path, body, id) {
        busy[1](id)
        post(path, body).then(function () { busy[1](''); props.onReload() })
          .catch(function (error) { busy[1](''); props.onError(String(error.message || error)) })
      }

      return h('div', { className: 'wbs-col' },
        h('div', { className: 'wbs-bar' },
          h('input', {
            className: 'wbs-input',
            placeholder: t('searchSkills'),
            value: query[0],
            onChange: function (event) { query[1](event.target.value) },
          }),
          h('div', { className: 'wbs-grow' }),
          h(Btn, { onClick: function () { creating[1](true) } }, t('createSkill')),
          h(Dropdown, {
            label: t('sort'),
            value: sort[0],
            options: [{ value: 'default', label: t('sortDefault') }, { value: 'name', label: t('sortName') }],
            onChange: function (value) { sort[1](value) },
          })),
        h('div', { className: 'wbs-chips' },
          ['all', 'project', 'user', 'workbuddy'].map(function (value) {
            return h(Chip, {
              key: value,
              on: origin[0] === value,
              onClick: function () { origin[1](value) },
            }, value === 'all' ? t('all') : (t('origins')[value] || value))
          })),
        h('div', { className: 'wbs-note' }, t('skillsHint')),
        filtered.length === 0
          ? h('div', { className: 'wbs-empty' }, t('emptySkills'))
          : h('div', { className: 'wbs-grid' }, filtered.map(function (skill) {
              return h('div', { className: 'wbs-card', key: skill.key },
                h('div', { className: 'wbs-card-top' },
                  h('div', { className: 'wbs-col', style: { gap: '3px', minWidth: 0 } },
                    h('div', { className: 'wbs-card-name' }, skill.name),
                    h('div', { className: 'wbs-muted' }, (t('origins')[skill.origin] || skill.origin)
                      + (skill.version ? ' · v' + skill.version : '')
                      + (skill.files ? ' · ' + skill.files + ' files' : '')))),
                h('div', { className: 'wbs-card-desc', title: skill.description }, skill.description || '—'),
                skill.valid === false ? h('div', { className: 'wbs-err' }, skill.problem) : null,
                h('div', { className: 'wbs-row', style: { gap: '12px', flexWrap: 'wrap' } },
                  h('label', { className: 'wbs-switch' },
                    h('input', {
                      type: 'checkbox',
                      checked: skill.modelInvocable !== false,
                      disabled: busy[0] === skill.key,
                      onChange: function (event) { act('/skills/flags', { key: skill.key, modelInvocable: event.target.checked }, skill.key) },
                    }),
                    t('modelInvocable')),
                  h('label', { className: 'wbs-switch' },
                    h('input', {
                      type: 'checkbox',
                      checked: skill.userInvocable !== false,
                      disabled: busy[0] === skill.key,
                      onChange: function (event) { act('/skills/flags', { key: skill.key, userInvocable: event.target.checked }, skill.key) },
                    }),
                    t('userInvocable'))),
                h('div', { className: 'wbs-card-foot' },
                  h(Btn, { size: 'sm', onClick: function () {
                    api('/skill-detail?key=' + encodeURIComponent(skill.key)).then(function (value) { detail[1](value) })
                      .catch(function (error) { props.onError(String(error.message || error)) })
                  } }, t('preview')),
                  skill.origin === 'workbuddy'
                    ? h(Btn, { size: 'sm', kind: 'primary', disabled: busy[0] === skill.key, onClick: function () { act('/skills/import', { key: skill.key }, skill.key) } }, t('importWorkbuddy'))
                    : null,
                  skill.managed
                    ? h(Btn, { size: 'sm', kind: 'danger', disabled: busy[0] === skill.key, onClick: function () {
                        if (window.confirm(t('confirmRemove'))) act('/skills/remove', { key: skill.key }, skill.key)
                      } }, t('removeSkill'))
                    : null))
            })),
        detail[0] === null ? null : h(Modal, {
          title: detail[0].folder,
          onClose: function () { detail[1](null) },
        },
          h('div', { className: 'wbs-row', style: { flexWrap: 'wrap', gap: '6px' } }, (detail[0].files || []).map(function (item, index) {
            return h('span', { className: 'wbs-tag', key: index }, (item.dir ? '▸ ' : '') + item.name)
          })),
          h('pre', { className: 'wbs-pre' }, detail[0].body || '')),
        creating[0] ? h(CreateSkillModal, {
          onClose: function () { creating[1](false) },
          onCreate: function (payload) {
            post('/skills/create', payload).then(function () {
              creating[1](false)
              props.onReload()
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

      return h('div', { className: 'wbs-card' },
        h('div', { className: 'wbs-card-top' },
          h('div', { className: 'wbs-col', style: { gap: '3px', minWidth: 0 } },
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
          ? h('div', { className: 'wbs-col', style: { gap: '6px' } },
              state.error !== '' ? h('div', { className: 'wbs-err' }, state.error) : null,
              state.tools === null || state.tools === undefined
                ? null
                : (state.tools.length === 0
                    ? h('div', { className: 'wbs-note' }, '(no tools)')
                    : h('div', null, state.tools.map(function (tool) {
                        return h('div', { className: 'wbs-tool', key: tool.name },
                          h('div', { className: 'wbs-col', style: { gap: '1px', minWidth: 0 } },
                            h('div', { className: 'wbs-tool-name' }, tool.name),
                            h('div', { className: 'wbs-muted', style: { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, tool.description || '')),
                          h('div', { className: 'wbs-grow' }),
                          h(Btn, { size: 'sm', disabled: state.busy, onClick: function () { call(tool.name) } }, t('callTool')))
                      }))),
              state.result !== '' ? h('pre', { className: 'wbs-pre' }, state.result) : null)
          : null,
        h('div', { className: 'wbs-card-foot' },
          h(Btn, { size: 'sm', disabled: state.busy, onClick: probe }, state.busy ? t('probing') : t('probe')),
          h(Btn, { size: 'sm', onClick: function () { props.onEdit(connector) } }, t('editConnector')),
          h('div', { className: 'wbs-grow' }),
          h(Btn, { size: 'sm', kind: 'danger', onClick: function () { props.onDelete(connector) } }, t('delete'))))
    }

    function ConnectorsPane(props) {
      var query = useState('')
      var editing = useState(null)
      var form = useState(EMPTY_FORM)
      var busy = useState('')
      var connectors = props.data.connectors || []
      var seeds = props.data.connectorSeeds || []
      var q = query[0].trim().toLowerCase()
      var filtered = connectors.filter(function (connector) {
        if (q === '') return true
        return (connector.id + ' ' + connector.name + ' ' + connector.command + ' ' + connector.url).toLowerCase().indexOf(q) >= 0
      })

      function act(path, body, id) {
        busy[1](id || '')
        post(path, body).then(function (value) {
          busy[1]('')
          props.onReload()
          return value
        }).catch(function (error) {
          busy[1]('')
          props.onError(String(error.message || error))
        })
      }

      function openForm(connector) {
        form[1](connector === undefined ? EMPTY_FORM : formOf(connector))
        editing[1](connector === undefined ? {} : connector)
      }

      function save() {
        var value = form[0]
        var args = value.argsText.split(/\r?\n/).map(function (line) { return line.trim() }).filter(function (line) { return line !== '' })
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
            placeholder: t('searchConnectors'),
            value: query[0],
            onChange: function (event) { query[1](event.target.value) },
          }),
          h('div', { className: 'wbs-grow' }),
          seeds.length > 0
            ? h(Btn, { disabled: busy[0] === 'import', onClick: function () { act('/connectors/import', {}, 'import') } }, t('importWorkbuddy') + ' (' + seeds.length + ')')
            : null,
          h(Btn, { kind: 'primary', onClick: function () { openForm(undefined) } }, t('addConnector'))),
        seeds.length > 0
          ? h('div', { className: 'wbs-col', style: { gap: '6px' } },
              h('div', { className: 'wbs-label' }, t('importWorkbuddy')),
              h('div', { className: 'wbs-chips' }, seeds.map(function (seed) {
                return h(Chip, { key: seed.id, static: true, on: false }, seed.name)
              })))
          : null,
        filtered.length === 0
          ? h('div', { className: 'wbs-empty' }, t('emptyConnectors'))
          : h('div', { className: 'wbs-grid' }, filtered.map(function (connector) {
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
                } }))),
      )
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
