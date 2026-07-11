import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'
import { ADMIN_TABLES, type AdminRow, type TableDef } from './registry'
import { useIsAdmin } from './useIsAdmin'
import { listRecentLogins, formatDateTime, type LoginRow } from './audit'
import RecordForm from './RecordForm'

const AUDIT_ICON = 'fa-clock-rotate-left'

/**
 * /admin — the DBMS. A STANDALONE console, deliberately not part of the website.
 * Styled after the "Flux" dashboard (flux.dashboardpack.com): lavender-white page,
 * frosted header, purple→blue gradient hero with glassmorphism KPI cards, white
 * 18px-rounded content cards with soft purple-tinted shadows, pill-shaped controls.
 * Reachable only by typing the URL (guarded by RLS + redirect).
 */
// Emergency escape hatch: set to `true` ONLY to preview the console without the
// admin guard (e.g. before supabase/admin.sql has run). Never ship it as `true`.
const PREVIEW_OPEN = false

// ---- Flux design tokens (class fragments; Tailwind JIT scans these strings) ----
const INK = 'text-[oklch(0.13_0.02_285)]'
const MUTED = 'text-[oklch(0.5_0.02_285)]'
const CARD =
  'bg-white rounded-[18px] border border-[oklch(0.93_0.01_285)] shadow-[0_1px_3px_0_oklch(0.55_0.15_285/0.06),0_8px_24px_0_oklch(0.55_0.15_285/0.08)] transition-shadow duration-200 hover:shadow-[0_2px_6px_0_oklch(0.55_0.15_285/0.09),0_16px_36px_0_oklch(0.55_0.15_285/0.12)]'
const HERO =
  'relative overflow-hidden rounded-[22px] p-8 text-white bg-gradient-to-br from-[oklch(0.55_0.25_285)] via-[oklch(0.55_0.25_285)]/90 to-[oklch(0.6_0.2_230)]'
const PRIMARY_BTN =
  'inline-flex items-center gap-1.5 h-8 px-4 rounded-[18px] bg-gradient-to-r from-[oklch(0.55_0.25_285)] to-[oklch(0.6_0.2_230)] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60'
const GHOST_BTN =
  'inline-flex items-center gap-1.5 h-8 px-4 rounded-[18px] border border-[oklch(0.93_0.01_285)] bg-white text-xs font-medium text-[oklch(0.5_0.02_285)] hover:text-[oklch(0.55_0.25_285)] hover:bg-[oklch(0.96_0.02_285)] transition-colors disabled:opacity-60'
const BADGE =
  'inline-flex items-center rounded-xl bg-[oklch(0.55_0.25_285)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[oklch(0.55_0.25_285)]'
const AVATAR = 'bg-gradient-to-br from-[oklch(0.55_0.25_285)] to-[oklch(0.6_0.2_230)]'

/** Sidebar nav item — 36px pill, active = lavender bg + primary text (Flux spec). */
const navCls = (activeTab: boolean) =>
  `w-full flex items-center gap-3 h-9 px-3 rounded-[18px] text-sm font-medium transition-colors ${
    activeTab
      ? 'bg-[oklch(0.96_0.02_285)] text-[oklch(0.55_0.25_285)]'
      : 'text-[oklch(0.5_0.02_285)] hover:bg-[oklch(0.96_0.02_285)]/60 hover:text-[oklch(0.13_0.02_285)]'
  }`

const shortDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'

export default function AdminPage() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user, loading } = useAuth()
  const isAdmin = useIsAdmin()
  const [active, setActive] = useState<TableDef | 'audit'>(ADMIN_TABLES[0])
  const [open, setOpen] = useState(true)
  const isAudit = active === 'audit'

  if (!PREVIEW_OPEN) {
    if (loading || (user && isAdmin === null)) {
      return (
        <div className={`min-h-screen bg-[oklch(0.985_0.005_285)] grid place-items-center text-sm ${MUTED}`}>
          <span><i className="fa-solid fa-spinner fa-spin mr-2 text-[oklch(0.55_0.25_285)]" />…</span>
        </div>
      )
    }
    if (!user) return <Navigate to="/user/login" replace />
    if (!isAdmin) return <NotAuthorized email={user.email ?? '(no email)'} uid={user.id} />
  }

  const email = user?.email ?? 'preview'
  const initials = email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'AD'

  return (
    <div className={`min-h-screen bg-[oklch(0.985_0.005_285)] ${INK} flex [font-family:Inter,ui-sans-serif,system-ui,sans-serif]`}>
      {/* SIDEBAR — collapsible, smooth width + label animation */}
      <aside
        className={`sticky top-0 h-screen shrink-0 bg-[oklch(0.99_0.005_285)] border-r border-[oklch(0.93_0.01_285)] flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${
          open ? 'w-[260px]' : 'w-[72px]'
        }`}
      >
        {/* Brand + collapse toggle */}
        <div className="h-16 shrink-0 flex items-center gap-2.5 px-3 border-b border-[oklch(0.93_0.01_285)]">
          <span
            className={`h-9 shrink-0 grid place-items-center rounded-[14px] text-white overflow-hidden transition-all duration-300 ${AVATAR} ${
              open ? 'w-9 opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <i className="fa-solid fa-database text-sm" aria-hidden="true" />
          </span>
          <span
            className={`font-bold text-[15px] whitespace-nowrap truncate min-w-0 flex-1 transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {t('admin.title')}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={t('admin.toggleSidebar')}
            className={`shrink-0 h-8 w-8 grid place-items-center rounded-[14px] text-[oklch(0.5_0.02_285)] hover:bg-[oklch(0.96_0.02_285)] hover:text-[oklch(0.55_0.25_285)] transition-colors ${
              open ? 'ml-auto' : 'mx-auto'
            }`}
          >
            <i className={`fa-solid fa-angles-left transition-transform duration-300 ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
          </button>
        </div>

        {/* Table nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-1">
          <NavLabel open={open}>{t('admin.navData')}</NavLabel>
          {ADMIN_TABLES.map((d) => {
            const activeTab = active !== 'audit' && active.table === d.table
            return (
              <button
                key={d.table}
                type="button"
                onClick={() => setActive(d)}
                title={!open ? L(d.title) : undefined}
                className={navCls(activeTab)}
              >
                <i className={`fa-solid ${d.icon} w-5 text-center shrink-0`} aria-hidden="true" />
                <span className={`truncate min-w-0 flex-1 text-left transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
                  {L(d.title)}
                </span>
              </button>
            )
          })}

          {/* Audit (read-only, not a table) */}
          <NavLabel open={open}>{t('admin.navSystem')}</NavLabel>
          <button
            type="button"
            onClick={() => setActive('audit')}
            title={!open ? t('admin.audit') : undefined}
            className={navCls(isAudit)}
          >
            <i className={`fa-solid ${AUDIT_ICON} w-5 text-center shrink-0`} aria-hidden="true" />
            <span className={`truncate min-w-0 flex-1 text-left transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
              {t('admin.audit')}
            </span>
          </button>
        </nav>

        {/* Back to site */}
        <div className="p-3 border-t border-[oklch(0.93_0.01_285)]">
          <Link to="/" title={!open ? t('admin.backToSite') : undefined} className={navCls(false)}>
            <i className="fa-solid fa-arrow-up-right-from-square w-5 text-center shrink-0" aria-hidden="true" />
            <span className={`truncate min-w-0 flex-1 text-left transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
              {t('admin.backToSite')}
            </span>
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Frosted header (Flux: white/80 + blur + bottom border) */}
        <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur border-b border-[oklch(0.93_0.01_285)] flex items-center justify-between gap-3 px-6">
          <h1 className={`text-base font-semibold truncate min-w-0 ${INK}`}>
            <i className={`fa-solid ${active === 'audit' ? AUDIT_ICON : active.icon} mr-2 text-[oklch(0.55_0.25_285)]`} aria-hidden="true" />
            {active === 'audit' ? t('admin.audit') : L(active.title)}
          </h1>
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-xs truncate hidden sm:block ${MUTED}`}>{email}</span>
            <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center text-[10px] font-bold text-white ${AVATAR}`}>
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1280px] mx-auto p-6">
          {active === 'audit' ? (
            <AuditPanel />
          ) : (
            <TablePanel key={active.table} def={active} userId={user?.id ?? ''} />
          )}
        </main>
      </div>
    </div>
  )
}

/** Uppercase, letter-spaced section label in the sidebar (Flux "OVERVIEW" style). */
function NavLabel({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.5_0.02_285)] whitespace-nowrap transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
}

/** Glassmorphism KPI stat card inside the gradient hero (white/10 + backdrop blur). */
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white/10 backdrop-blur-[8px] p-4 hover:bg-white/15 transition-colors">
      <div className="text-[11px] font-medium text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white truncate">{value}</div>
    </div>
  )
}

/** Shown to a logged-in NON-admin at /admin: which session was checked + the exact fix. */
function NotAuthorized({ email, uid }: { email: string; uid: string }) {
  const { t } = useTranslation()
  const sql = `insert into public.admins (user_id) values ('${uid}')\non conflict (user_id) do nothing;`
  return (
    <div className={`min-h-screen bg-[oklch(0.985_0.005_285)] ${INK} grid place-items-center px-4 [font-family:Inter,ui-sans-serif,system-ui,sans-serif]`}>
      <div className={`max-w-[560px] w-full rounded-[22px] p-6 ${CARD}`}>
        <div className={`h-10 w-10 grid place-items-center rounded-[14px] text-white mb-3 ${AVATAR}`}>
          <i className="fa-solid fa-lock" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold mb-1">{t('admin.forbiddenTitle')}</h1>
        <p className={`text-sm mb-4 ${MUTED}`}>
          {t('admin.forbiddenLoggedInAs')}{' '}
          <span className={`font-semibold ${INK}`}>{email}</span>
          <br />
          <span className="text-xs font-mono text-[oklch(0.6_0.02_285)]">uid: {uid}</span>
        </p>
        <p className={`text-sm mb-2 ${INK}`}>{t('admin.forbiddenHint')}</p>
        <pre className="bg-[oklch(0.985_0.005_285)] border border-[oklch(0.93_0.01_285)] rounded-[14px] p-3 text-xs text-[oklch(0.45_0.1_285)] overflow-x-auto whitespace-pre-wrap mb-4">
          {sql}
        </pre>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className={PRIMARY_BTN}>
            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
            {t('admin.recheck')}
          </button>
          <Link to="/" className={`text-sm hover:text-[oklch(0.55_0.25_285)] ${MUTED}`}>
            {t('admin.backToSite')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function TablePanel({ def, userId }: { def: TableDef; userId: string }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const [rows, setRows] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  /** null = closed · 'new' = creating · row = editing that row */
  const [editing, setEditing] = useState<AdminRow | 'new' | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from(def.table).select('*').order(def.orderBy.col, { ascending: def.orderBy.ascending })
    if (def.filter) q = q.like(def.filter.col, def.filter.value)
    const { data, error } = await q
    setRows(error ? [] : ((data ?? []) as AdminRow[]))
    setLoading(false)
  }, [def])

  useEffect(() => {
    load()
  }, [load])

  const save = async (values: AdminRow) => {
    setBusy(true)
    try {
      if (editing === 'new') {
        const extra = def.injectOnCreate?.(userId) ?? {}
        const { error } = await supabase.from(def.table).insert({ ...values, ...extra })
        if (error) throw error
      } else if (editing) {
        const { error } = await supabase.from(def.table).update(values).eq('id', editing.id)
        if (error) throw error
      }
      toast(t('admin.saved'))
      setEditing(null)
      load()
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: AdminRow) => {
    const ok = await alertConfirm(
      t('admin.deleteConfirmTitle'),
      t('admin.deleteConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    setBusy(true)
    try {
      const { error } = await supabase.from(def.table).delete().eq('id', row.id)
      if (error) throw error
      toast(t('admin.deleted'))
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  /** Render one list-view cell, whatever shape the column holds. */
  const cell = (row: AdminRow, col: string): string => {
    const v = row[col]
    if (v == null || v === '') return '—'
    if (typeof v === 'boolean') return v ? '✓' : '✗'
    if (typeof v === 'object') return String((v as AdminRow).en ?? JSON.stringify(v))
    const s = String(v)
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10) // ISO timestamp → date
    return s.length > 60 ? `${s.slice(0, 60)}…` : s
  }

  const newest = rows.reduce<string | null>((acc, r) => {
    const v = (r.updated_at ?? r.created_at) as string | undefined
    return typeof v === 'string' && (!acc || v > acc) ? v : acc
  }, null)

  return (
    <section>
      {/* HERO — gradient welcome banner: what this dataset is + where it feeds the site */}
      <div className={HERO}>
        <h1 className="text-3xl font-bold leading-9">{L(def.title)}</h1>
        <p className="mt-2 text-sm text-white/80 max-w-2xl">{L(def.usedIn)}</p>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label={t('admin.kpiRecords')} value={loading ? '…' : String(rows.length)} />
          <Kpi label={t('admin.kpiNewest')} value={loading ? '…' : shortDate(newest)} />
          <Kpi label={t('admin.kpiMode')} value={def.canCreate ? t('admin.kpiFullCrud') : t('admin.kpiModerate')} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className={`text-xs ${MUTED}`}>{t('admin.subtitle')}</p>
        {def.canCreate && (
          <button type="button" onClick={() => setEditing('new')} className={PRIMARY_BTN}>
            <i className="fa-solid fa-plus" aria-hidden="true" />
            {t('admin.newRecord')}
          </button>
        )}
      </div>

      {/* Create/edit form — smooth expand/collapse */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          editing !== null ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {editing !== null && (
            <RecordForm
              key={editing === 'new' ? 'new' : editing.id}
              def={def}
              row={editing === 'new' ? null : editing}
              busy={busy}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      </div>

      {/* Content card */}
      <div className={`mt-4 overflow-hidden ${CARD}`}>
        <div className="px-5 py-4 border-b border-[oklch(0.93_0.01_285)] flex items-center gap-2">
          <h2 className={`text-base font-semibold ${INK}`}>{L(def.title)}</h2>
          <span className={`text-xs ${MUTED}`}>({rows.length})</span>
        </div>
        {loading ? (
          <p className={`p-8 text-center text-sm ${MUTED}`}>
            <i className="fa-solid fa-spinner fa-spin mr-2 text-[oklch(0.55_0.25_285)]" aria-hidden="true" />…
          </p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${MUTED}`}>{t('admin.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`bg-[oklch(0.985_0.005_285)] text-left text-[11px] uppercase tracking-wide border-b border-[oklch(0.93_0.01_285)] ${MUTED}`}>
                  {def.listCols.map((c) => (
                    <th key={c} className="px-4 py-2.5 font-semibold whitespace-nowrap">{c}</th>
                  ))}
                  {def.placement && <th className="px-4 py-2.5 font-semibold whitespace-nowrap">{t('admin.placement')}</th>}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[oklch(0.96_0.005_285)] align-top hover:bg-[oklch(0.96_0.02_285)]/50 transition-colors">
                    {def.listCols.map((c) => (
                      <td key={c} className={`px-4 py-3 max-w-[260px] truncate ${INK}`}>{cell(row, c)}</td>
                    ))}
                    {def.placement && (
                      <td className="px-4 py-3 max-w-[280px]">
                        <span className={BADGE}>{def.placement(row)}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        type="button"
                        aria-label={t('admin.editRecord')}
                        title={t('admin.editRecord')}
                        onClick={() => setEditing(row)}
                        className="h-8 w-8 rounded-[14px] text-[oklch(0.5_0.02_285)] hover:text-[oklch(0.55_0.25_285)] hover:bg-[oklch(0.96_0.02_285)] transition-colors mr-1"
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('post.delete')}
                        title={t('post.delete')}
                        disabled={busy}
                        onClick={() => remove(row)}
                        className="h-8 w-8 rounded-[14px] text-[oklch(0.5_0.02_285)] hover:text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                      >
                        <i className="fa-solid fa-trash-can" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

/** Read-only login audit — most recent sign-ins across the system (admin-only RPC). */
function AuditPanel() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<LoginRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    listRecentLogins(50)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const admins = rows.filter((r) => r.is_admin).length
  const never = rows.filter((r) => !r.last_sign_in_at).length
  const latest = rows.find((r) => r.last_sign_in_at)?.last_sign_in_at ?? null

  return (
    <section>
      {/* HERO — gradient banner + glass KPI stats */}
      <div className={HERO}>
        <h1 className="text-3xl font-bold leading-9">{t('admin.audit')}</h1>
        <p className="mt-2 text-sm text-white/80 max-w-2xl">{t('admin.auditUsedIn')}</p>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label={t('admin.kpiAccounts')} value={loading ? '…' : String(rows.length)} />
          <Kpi label={t('admin.kpiAdmins')} value={loading ? '…' : String(admins)} />
          <Kpi label={t('admin.neverLoggedIn')} value={loading ? '…' : String(never)} />
          <Kpi label={t('admin.kpiLatest')} value={loading ? '…' : shortDate(latest)} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className={`text-xs ${MUTED}`}>{t('admin.subtitle')}</p>
        <button type="button" onClick={load} disabled={loading} className={GHOST_BTN}>
          <i className={`fa-solid fa-rotate-right ${loading ? 'fa-spin' : ''}`} aria-hidden="true" />
          {t('admin.refresh')}
        </button>
      </div>

      {/* Content card */}
      <div className={`mt-4 overflow-hidden ${CARD}`}>
        <div className="px-5 py-4 border-b border-[oklch(0.93_0.01_285)] flex items-center gap-2">
          <h2 className={`text-base font-semibold ${INK}`}>{t('admin.recentLogins')}</h2>
          <span className={`text-xs ${MUTED}`}>({rows.length})</span>
        </div>
        {loading ? (
          <p className={`p-8 text-center text-sm ${MUTED}`}>
            <i className="fa-solid fa-spinner fa-spin mr-2 text-[oklch(0.55_0.25_285)]" aria-hidden="true" />…
          </p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${MUTED}`}>{t('admin.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`bg-[oklch(0.985_0.005_285)] text-left text-[11px] uppercase tracking-wide border-b border-[oklch(0.93_0.01_285)] ${MUTED}`}>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">{t('admin.account')}</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">{t('admin.lastLogin')}</th>
                  <th className="px-4 py-2.5 font-semibold whitespace-nowrap">{t('admin.accountCreated')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[oklch(0.96_0.005_285)] align-top hover:bg-[oklch(0.96_0.02_285)]/50 transition-colors">
                    <td className="px-4 py-3 max-w-[320px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center text-[10px] font-bold text-white ${AVATAR}`}>
                          {(r.username || r.email || '?').replace(/[^a-zA-Z0-9가-힣]/g, '').slice(0, 2).toUpperCase() || '?'}
                        </span>
                        <div className="min-w-0">
                          <div className={`font-medium truncate flex items-center gap-2 ${INK}`}>
                            {r.username || r.email || '—'}
                            {r.is_admin && <span className={BADGE}>{t('admin.adminBadge')}</span>}
                          </div>
                          {r.email && r.username && <div className={`text-xs truncate ${MUTED}`}>{r.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${INK}`}>
                      {r.last_sign_in_at ? formatDateTime(r.last_sign_in_at) : (
                        <span className={MUTED}>{t('admin.neverLoggedIn')}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${MUTED}`}>{formatDateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
