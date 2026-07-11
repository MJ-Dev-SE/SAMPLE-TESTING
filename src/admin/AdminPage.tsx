import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'
import { ADMIN_TABLES, type AdminRow, type TableDef } from './registry'
import { useIsAdmin } from './useIsAdmin'
import RecordForm from './RecordForm'

/**
 * /admin — the DBMS. A STANDALONE console, deliberately not part of the website:
 * its own clean beige/white theme, a collapsible sidebar, and no link anywhere in
 * the public UI — reachable only by typing the URL (guarded by RLS + redirect).
 */
// Emergency escape hatch: set to `true` ONLY to preview the console without the
// admin guard (e.g. before supabase/admin.sql has run). Never ship it as `true`.
const PREVIEW_OPEN = false

// Primary action button (New record / Save) — warm espresso on beige.
const PRIMARY_BTN =
  'inline-flex items-center gap-1.5 h-9 px-4 bg-[#4b4137] text-white text-sm font-semibold rounded-lg hover:bg-[#372f27] transition-colors disabled:opacity-60'

export default function AdminPage() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user, loading } = useAuth()
  const isAdmin = useIsAdmin()
  const [active, setActive] = useState<TableDef>(ADMIN_TABLES[0])
  const [open, setOpen] = useState(true)

  if (!PREVIEW_OPEN) {
    if (loading || (user && isAdmin === null)) {
      return (
        <div className="min-h-screen bg-[#f5efe4] grid place-items-center text-[#8a8072] text-sm">
          <span><i className="fa-solid fa-spinner fa-spin mr-2 text-[#a98c5a]" />…</span>
        </div>
      )
    }
    if (!user) return <Navigate to="/user/login" replace />
    if (!isAdmin) return <NotAuthorized email={user.email ?? '(no email)'} uid={user.id} />
  }

  return (
    <div className="min-h-screen bg-[#f5efe4] text-[#3f382f] flex">
      {/* SIDEBAR — collapsible, smooth width + label animation */}
      <aside
        className={`sticky top-0 h-screen shrink-0 bg-white border-r border-[#e7ddca] flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${
          open ? 'w-64' : 'w-[74px]'
        }`}
      >
        {/* Brand + collapse toggle */}
        <div className="h-16 shrink-0 flex items-center gap-2.5 px-3 border-b border-[#e7ddca]">
          <span className="w-10 h-10 shrink-0 grid place-items-center rounded-xl bg-[#efe7d5] text-[#a98c5a]">
            <i className="fa-solid fa-database" aria-hidden="true" />
          </span>
          <span
            className={`font-bold text-[15px] whitespace-nowrap transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {t('admin.title')}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={t('admin.toggleSidebar')}
            className="ml-auto shrink-0 h-8 w-8 grid place-items-center rounded-lg text-[#8a8072] hover:bg-[#f5efe4] hover:text-[#4b4137] transition-colors"
          >
            <i className={`fa-solid fa-angles-left transition-transform duration-300 ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
          </button>
        </div>

        {/* Table nav */}
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {ADMIN_TABLES.map((d) => {
            const activeTab = active.table === d.table
            return (
              <button
                key={d.table}
                type="button"
                onClick={() => setActive(d)}
                title={!open ? L(d.title) : undefined}
                className={`group w-full flex items-center gap-3 h-11 px-3 rounded-xl transition-colors ${
                  activeTab
                    ? 'bg-[#efe7d5] text-[#4b4137] font-semibold'
                    : 'text-[#8a8072] hover:bg-[#f5efe4] hover:text-[#4b4137]'
                }`}
              >
                <i className={`fa-solid ${d.icon} w-5 text-center shrink-0 ${activeTab ? 'text-[#a98c5a]' : ''}`} aria-hidden="true" />
                <span className={`truncate transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
                  {L(d.title)}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Back to site */}
        <div className="p-2 border-t border-[#e7ddca]">
          <Link
            to="/"
            title={!open ? t('admin.backToSite') : undefined}
            className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-[#8a8072] hover:bg-[#f5efe4] hover:text-[#4b4137] transition-colors"
          >
            <i className="fa-solid fa-arrow-up-right-from-square w-5 text-center shrink-0" aria-hidden="true" />
            <span className={`truncate transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
              {t('admin.backToSite')}
            </span>
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur border-b border-[#e7ddca] flex items-center justify-between gap-3 px-5">
          <h1 className="text-base font-bold text-[#3f382f] truncate min-w-0">
            <i className={`fa-solid ${active.icon} mr-2 text-[#a98c5a]`} aria-hidden="true" />
            {L(active.title)}
          </h1>
          <span className="text-xs text-[#8a8072] truncate hidden sm:block">{user?.email ?? 'preview'}</span>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 py-6">
          <p className="text-xs text-[#8a8072] mb-4">{t('admin.subtitle')}</p>
          <TablePanel key={active.table} def={active} userId={user?.id ?? ''} />
        </main>
      </div>
    </div>
  )
}

/** Shown to a logged-in NON-admin at /admin: which session was checked + the exact fix. */
function NotAuthorized({ email, uid }: { email: string; uid: string }) {
  const { t } = useTranslation()
  const sql = `insert into public.admins (user_id) values ('${uid}')\non conflict (user_id) do nothing;`
  return (
    <div className="min-h-screen bg-[#f5efe4] text-[#3f382f] grid place-items-center px-4">
      <div className="max-w-[560px] w-full border border-[#e7ddca] bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-lg font-bold mb-1">
          <i className="fa-solid fa-lock text-[#c15f3c] mr-2" aria-hidden="true" />
          {t('admin.forbiddenTitle')}
        </h1>
        <p className="text-sm text-[#8a8072] mb-4">
          {t('admin.forbiddenLoggedInAs')}{' '}
          <span className="text-[#3f382f] font-semibold">{email}</span>
          <br />
          <span className="text-xs font-mono text-[#a89e8c]">uid: {uid}</span>
        </p>
        <p className="text-sm text-[#57503f] mb-2">{t('admin.forbiddenHint')}</p>
        <pre className="bg-[#faf6ee] border border-[#e7ddca] rounded-lg p-3 text-xs text-[#6b5a3c] overflow-x-auto whitespace-pre-wrap mb-4">
          {sql}
        </pre>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className={PRIMARY_BTN}>
            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
            {t('admin.recheck')}
          </button>
          <Link to="/" className="text-sm text-[#8a8072] hover:text-[#4b4137]">
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

  return (
    <section>
      {/* WHERE THIS DATA IS USED — the point of the DBMS */}
      <div className="border border-[#e7ddca] bg-[#faf6ee] rounded-xl px-4 py-2.5 text-[13px] text-[#5c5346] mb-4">
        <i className="fa-solid fa-location-dot mr-2 text-[#a98c5a]" aria-hidden="true" />
        <span className="font-semibold">{t('admin.usedIn')}:</span> {L(def.usedIn)}
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-[#3f382f]">
          {L(def.title)} <span className="text-[#a89e8c]">({rows.length})</span>
        </h2>
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
          editing !== null ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0'
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

      {loading ? (
        <p className="text-sm text-[#8a8072]">…</p>
      ) : rows.length === 0 ? (
        <p className="border border-dashed border-[#dcd0b8] rounded-xl p-6 text-sm text-[#8a8072] text-center">
          {t('admin.empty')}
        </p>
      ) : (
        <div className="border border-[#e7ddca] rounded-xl overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf6ee] text-left text-xs text-[#8a8072] border-b border-[#e7ddca]">
                {def.listCols.map((c) => (
                  <th key={c} className="px-3 py-2.5 font-semibold whitespace-nowrap">{c}</th>
                ))}
                {def.placement && <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('admin.placement')}</th>}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#eee6d6] align-top hover:bg-[#faf6ee] transition-colors">
                  {def.listCols.map((c) => (
                    <td key={c} className="px-3 py-2.5 text-[#3f382f] max-w-[260px] truncate">{cell(row, c)}</td>
                  ))}
                  {def.placement && (
                    <td className="px-3 py-2.5 text-xs text-[#8a8072] max-w-[280px]">{def.placement(row)}</td>
                  )}
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <button
                      type="button"
                      aria-label={t('admin.editRecord')}
                      title={t('admin.editRecord')}
                      onClick={() => setEditing(row)}
                      className="h-8 w-8 rounded-lg text-[#8a8072] hover:text-[#4b4137] hover:bg-[#efe7d5] transition-colors mr-1"
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('post.delete')}
                      title={t('post.delete')}
                      disabled={busy}
                      onClick={() => remove(row)}
                      className="h-8 w-8 rounded-lg text-[#8a8072] hover:text-white hover:bg-[#c15f3c] transition-colors disabled:opacity-50"
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
    </section>
  )
}
