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
 * no site Layout/theme, its own dark full-width shell, and no link anywhere in
 * the public UI — reachable only by typing the URL (guarded by RLS + redirect).
 */
// Emergency escape hatch: set to `true` ONLY to preview the console without the
// admin guard (e.g. before supabase/admin.sql has run). Never ship it as `true`.
const PREVIEW_OPEN = false

export default function AdminPage() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user, loading } = useAuth()
  const isAdmin = useIsAdmin()
  const [active, setActive] = useState<TableDef>(ADMIN_TABLES[0])

  if (!PREVIEW_OPEN) {
    if (loading || (user && isAdmin === null)) {
      return (
        <div className="min-h-screen bg-slate-950 grid place-items-center text-slate-500 text-sm">
          <span><i className="fa-solid fa-spinner fa-spin mr-2" />…</span>
        </div>
      )
    }
    if (!user) return <Navigate to="/user/login" replace />
    if (!isAdmin) return <Navigate to="/" replace /> // hindi admin — walang makikita dito
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Console top bar — its own chrome, hindi ang site header */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <span className="font-bold text-[15px] whitespace-nowrap">
            <i className="fa-solid fa-database text-emerald-400 mr-2" aria-hidden="true" />
            {t('admin.title')}
          </span>
          <div className="flex items-center gap-4 min-w-0 text-sm">
            <span className="text-slate-500 text-xs truncate hidden sm:inline">{user?.email ?? 'preview'}</span>
            <Link to="/" className="shrink-0 text-emerald-400 hover:text-emerald-300 whitespace-nowrap">
              <i className="fa-solid fa-arrow-up-right-from-square mr-1.5" aria-hidden="true" />
              {t('admin.backToSite')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <p className="text-xs text-slate-500 mb-4">{t('admin.subtitle')}</p>

        {/* Table tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {ADMIN_TABLES.map((d) => (
            <button
              key={d.table}
              type="button"
              onClick={() => setActive(d)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded border ${
                active.table === d.table
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-semibold'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <i className={`fa-solid ${d.icon}`} aria-hidden="true" />
              {L(d.title)}
            </button>
          ))}
        </div>

        {/* key remounts the panel per table so its state resets */}
        <TablePanel key={active.table} def={active} userId={user?.id ?? ''} />
      </main>
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
      <div className="border border-emerald-500/30 bg-emerald-500/10 rounded px-4 py-2.5 text-[13px] text-slate-200 mb-4">
        <i className="fa-solid fa-location-dot mr-2 text-emerald-400" aria-hidden="true" />
        <span className="font-semibold">{t('admin.usedIn')}:</span> {L(def.usedIn)}
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-slate-100">
          {L(def.title)} <span className="text-slate-500">({rows.length})</span>
        </h2>
        {def.canCreate && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 h-9 px-3 bg-emerald-500 text-slate-950 text-sm font-semibold rounded hover:bg-emerald-400"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            {t('admin.newRecord')}
          </button>
        )}
      </div>

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

      {loading ? (
        <p className="text-sm text-slate-500">…</p>
      ) : rows.length === 0 ? (
        <p className="border border-dashed border-slate-700 rounded p-6 text-sm text-slate-500 text-center">
          {t('admin.empty')}
        </p>
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-left text-xs text-slate-400">
                {def.listCols.map((c) => (
                  <th key={c} className="px-3 py-2.5 font-semibold whitespace-nowrap">{c}</th>
                ))}
                {def.placement && <th className="px-3 py-2.5 font-semibold whitespace-nowrap">{t('admin.placement')}</th>}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800 align-top hover:bg-slate-900/60">
                  {def.listCols.map((c) => (
                    <td key={c} className="px-3 py-2.5 text-slate-200 max-w-[260px] truncate">{cell(row, c)}</td>
                  ))}
                  {def.placement && (
                    <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[280px]">{def.placement(row)}</td>
                  )}
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <button
                      type="button"
                      aria-label={t('admin.editRecord')}
                      title={t('admin.editRecord')}
                      onClick={() => setEditing(row)}
                      className="h-7 w-7 rounded text-slate-400 hover:text-slate-950 hover:bg-emerald-400 mr-1"
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('post.delete')}
                      title={t('post.delete')}
                      disabled={busy}
                      onClick={() => remove(row)}
                      className="h-7 w-7 rounded text-slate-400 hover:text-white hover:bg-rose-500 disabled:opacity-50"
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
