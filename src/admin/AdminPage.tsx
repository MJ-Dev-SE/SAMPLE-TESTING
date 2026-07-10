import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useLocalized } from '../lib/useLocalized'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'
import { ADMIN_TABLES, type AdminRow, type TableDef } from './registry'
import { useIsAdmin } from './useIsAdmin'
import RecordForm from './RecordForm'

/**
 * /admin — the DBMS: admin-only CRUD over every content table, with each
 * dataset (and row) labelled with WHERE it is used in the site.
 */
export default function AdminPage() {
  const { t } = useTranslation()
  const L = useLocalized()
  const { user, loading } = useAuth()
  const isAdmin = useIsAdmin()
  const [active, setActive] = useState<TableDef>(ADMIN_TABLES[0])

  if (loading || (user && isAdmin === null)) {
    return <Layout><p className="text-sm text-muted">…</p></Layout>
  }
  if (!user) return <Navigate to="/user/login" replace />
  if (!isAdmin) return <Navigate to="/" replace /> // hindi admin — walang makikita dito

  return (
    <Layout>
      <h1 className="text-xl font-bold text-text-normal mb-s">
        <i className="fa-solid fa-database mr-2 text-accent-blue" />
        {t('admin.title')}
      </h1>
      <p className="text-xs text-subtlest mb-m">{t('admin.subtitle')}</p>

      {/* Table tabs */}
      <div className="flex flex-wrap gap-2 mb-m">
        {ADMIN_TABLES.map((d) => (
          <button
            key={d.table}
            type="button"
            onClick={() => setActive(d)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-m border ${
              active.table === d.table
                ? 'bg-accent-blue text-white border-accent-blue font-semibold'
                : 'border-neutral-90 text-text-normal hover:bg-neutral-97'
            }`}
          >
            <i className={`fa-solid ${d.icon}`} aria-hidden="true" />
            {L(d.title)}
          </button>
        ))}
      </div>

      {/* key remounts the panel per table so its state resets */}
      <TablePanel key={active.table} def={active} userId={user.id} />
    </Layout>
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
      <div className="border border-accent-blue/30 bg-chip-blue/30 rounded-m px-m py-2.5 text-[13px] text-body mb-m">
        <i className="fa-solid fa-location-dot mr-2 text-accent-blue" aria-hidden="true" />
        <span className="font-semibold">{t('admin.usedIn')}:</span> {L(def.usedIn)}
      </div>

      <div className="flex items-center justify-between gap-3 mb-s">
        <h2 className="text-sm font-semibold text-text-normal">
          {L(def.title)} ({rows.length})
        </h2>
        {def.canCreate && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 h-9 px-3 bg-accent-blue text-white text-sm font-semibold rounded-m hover:bg-[#005bc4]"
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
        <p className="text-sm text-subtlest">…</p>
      ) : rows.length === 0 ? (
        <p className="border border-dashed border-neutral-90 rounded-l p-l text-sm text-subtlest text-center">
          {t('admin.empty')}
        </p>
      ) : (
        <div className="border border-neutral-90 rounded-l overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-97 text-left text-xs text-muted">
                {def.listCols.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>
                ))}
                {def.placement && <th className="px-3 py-2 font-semibold whitespace-nowrap">{t('admin.placement')}</th>}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-90 align-top hover:bg-neutral-97">
                  {def.listCols.map((c) => (
                    <td key={c} className="px-3 py-2 text-body max-w-[260px] truncate">{cell(row, c)}</td>
                  ))}
                  {def.placement && (
                    <td className="px-3 py-2 text-xs text-subtlest max-w-[260px]">{def.placement(row)}</td>
                  )}
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button
                      type="button"
                      aria-label={t('admin.editRecord')}
                      title={t('admin.editRecord')}
                      onClick={() => setEditing(row)}
                      className="h-7 w-7 rounded-m text-muted hover:text-white hover:bg-accent-blue mr-1"
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('post.delete')}
                      title={t('post.delete')}
                      disabled={busy}
                      onClick={() => remove(row)}
                      className="h-7 w-7 rounded-m text-muted hover:text-white hover:bg-accent-pink disabled:opacity-50"
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
