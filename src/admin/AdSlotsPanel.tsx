import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useLocalized } from '../lib/useLocalized'
import { publicUrl } from '../lib/media'
import { useQueryClient } from '@tanstack/react-query'
import { alertConfirm, alertError, errText, toast } from '../lib/alert'
import type { Localized } from '../types'
import type { AdminRow, TableDef } from './registry'
import RecordForm from './RecordForm'
import Lightbox from './Lightbox'
import Tooltip from '../components/Tooltip'
import { BADGE, CARD, GHOST_BTN, HERO, INK, Kpi, MUTED, PRIMARY_BTN } from './ui'

/**
 * FIXED-SLOT manager for `advertisements`. The ad POSITIONS on the site are
 * hard-wired (header 4 · homepage 2 · wing-left 4 · wing-right 3); the admin
 * edits WHAT shows inside each slot instead of free-adding rows and guessing
 * where they land. Saving a slot forces position + sort, so the content always
 * appears exactly where the slot says.
 *
 * header/homepage render via AdCarousel (crossfade), so their base slots can
 * take unlimited "+ Add extra" creatives that lengthen the rotation — wing
 * rails render as a fixed list (WingBanners.tsx) and must stay at their exact
 * count, so they don't get that button. The footer ADVERTISEMENT column stays
 * a flexible list (it's a text list, not a fixed banner).
 */

interface SlotGroup {
  position: string
  icon: string
  title: Localized
  hint: Localized
  count: number
  slotName: (i: number) => Localized
  /** Crossfade groups (header/homepage use AdCarousel) can take extra creatives
   *  beyond the base count — they just lengthen the rotation. Wing rails must
   *  stay at their exact fixed count, so they don't get this. */
  allowExtra: boolean
}

const HEADER_SLOT_NAMES: Localized[] = [
  { en: 'Ad 1 — left of logo', ko: '광고 1 — 로고 왼쪽' },
  { en: 'Ad 2 — right of logo', ko: '광고 2 — 로고 오른쪽' },
  { en: 'Ad 1 — left of logo (2nd)', ko: '광고 1 — 로고 왼쪽 (두 번째)' },
  { en: 'Ad 2 — right of logo (2nd)', ko: '광고 2 — 로고 오른쪽 (두 번째)' },
]

const GROUPS: SlotGroup[] = [
  {
    position: 'header',
    icon: 'fa-window-maximize',
    title: { en: 'Header banner — manilatour.com', ko: '헤더 배너 — manilatour.com' },
    hint: {
      en: 'Two spots beside the logo — LEFT and RIGHT — each crossfades between 2 creatives (4 total); "+ Add extra" lengthens the rotation. Shows on manilatour.com only — hanin.tv has its own group below.',
      ko: '로고 왼쪽·오른쪽 자리 각각 소재 2개씩(총 4개) 교차 노출, "+ 추가 소재"로 더 늘릴 수 있습니다. manilatour.com에만 노출 — hanin.tv는 아래 전용 그룹을 사용합니다.',
    },
    count: 4,
    slotName: (i) => HEADER_SLOT_NAMES[i] ?? { en: `Slot ${i + 1}`, ko: `슬롯 ${i + 1}` },
    allowExtra: true,
  },
  {
    // hanin.tv's own header inventory (brandedAdPositions in src/config/brand.ts):
    // rows save under position 'hanin:header' and render ONLY on hanin.tv.
    position: 'hanin:header',
    icon: 'fa-tv',
    title: { en: 'Header banner — hanin.tv', ko: '헤더 배너 — hanin.tv' },
    hint: {
      en: 'Same two spots beside the logo, but on hanin.tv only. Creatives uploaded here never appear on manilatour.com (and vice versa).',
      ko: '로고 옆 동일한 두 자리이지만 hanin.tv에만 노출됩니다. 여기 올린 소재는 manilatour.com에는 나오지 않습니다(반대도 동일).',
    },
    count: 4,
    slotName: (i) => HEADER_SLOT_NAMES[i] ?? { en: `Slot ${i + 1}`, ko: `슬롯 ${i + 1}` },
    allowExtra: true,
  },
  {
    position: 'homepage',
    icon: 'fa-table-cells-large',
    title: { en: 'Homepage ad cards', ko: '홈페이지 광고 카드' },
    hint: {
      en: 'The two ad cards on the homepage (BannerRow.tsx). Use "+ Add extra" for a longer crossfade rotation.',
      ko: '홈페이지의 광고 카드 2개(BannerRow.tsx). "+ 추가 소재"로 회전을 늘릴 수 있습니다.',
    },
    count: 2,
    slotName: (i) => ({ en: `Card ${i + 1}`, ko: `카드 ${i + 1}` }),
    allowExtra: true,
  },
  {
    position: 'wing-left',
    icon: 'fa-angles-left',
    title: { en: 'Left wing rail — manilatour.com', ko: '왼쪽 윙 배너 — manilatour.com' },
    hint: {
      en: '4 fixed banners on the LEFT side of the page (WingBanners.tsx). Shows on manilatour.com only — hanin.tv has its own wing group below.',
      ko: '페이지 왼쪽의 고정 배너 4개(WingBanners.tsx). manilatour.com에만 노출 — hanin.tv는 아래 전용 윙 그룹을 사용합니다.',
    },
    count: 4,
    slotName: (i) => ({ en: `Slot ${i + 1}`, ko: `슬롯 ${i + 1}` }),
    allowExtra: false,
  },
  {
    position: 'wing-right',
    icon: 'fa-angles-right',
    title: { en: 'Right wing rail — manilatour.com', ko: '오른쪽 윙 배너 — manilatour.com' },
    hint: {
      en: '3 fixed banners on the RIGHT side of the page (WingBanners.tsx). Shows on manilatour.com only — hanin.tv has its own wing group below.',
      ko: '페이지 오른쪽의 고정 배너 3개(WingBanners.tsx). manilatour.com에만 노출 — hanin.tv는 아래 전용 윙 그룹을 사용합니다.',
    },
    count: 3,
    slotName: (i) => ({ en: `Slot ${i + 1}`, ko: `슬롯 ${i + 1}` }),
    allowExtra: false,
  },
  {
    // hanin.tv's own wings (brandedAdPositions in src/config/brand.ts): rows save
    // under 'hanin:wing-left' / 'hanin:wing-right' and render ONLY on hanin.tv.
    // Until filled, hanin.tv shows the static defaults in src/data/haninWings.ts.
    position: 'hanin:wing-left',
    icon: 'fa-angles-left',
    title: { en: 'Left wing rail — hanin.tv', ko: '왼쪽 윙 배너 — hanin.tv' },
    hint: {
      en: '4 fixed banners on the LEFT side, on hanin.tv only. Uploading here replaces the built-in hanin default for that slot; never shows on manilatour.com.',
      ko: 'hanin.tv 전용 왼쪽 고정 배너 4개. 여기 올리면 해당 슬롯의 기본 이미지를 대체하며 manilatour.com에는 나오지 않습니다.',
    },
    count: 4,
    slotName: (i) => ({ en: `Slot ${i + 1}`, ko: `슬롯 ${i + 1}` }),
    allowExtra: false,
  },
  {
    position: 'hanin:wing-right',
    icon: 'fa-angles-right',
    title: { en: 'Right wing rail — hanin.tv', ko: '오른쪽 윙 배너 — hanin.tv' },
    hint: {
      en: '4 fixed banners on the RIGHT side, on hanin.tv only. Uploading here replaces the built-in hanin default for that slot; never shows on manilatour.com.',
      ko: 'hanin.tv 전용 오른쪽 고정 배너 4개. 여기 올리면 해당 슬롯의 기본 이미지를 대체하며 manilatour.com에는 나오지 않습니다.',
    },
    count: 4,
    slotName: (i) => ({ en: `Slot ${i + 1}`, ko: `슬롯 ${i + 1}` }),
    allowExtra: false,
  },
]

const FOOTER_GROUP = {
  position: 'footer-info',
  icon: 'fa-shoe-prints',
  title: { en: 'Footer ADVERTISEMENT column', ko: '푸터 광고 열' } as Localized,
  hint: {
    en: 'Flexible list — each row is a text link in the footer that opens its /ad/view page.',
    ko: '자유 목록 — 각 행은 푸터의 텍스트 링크이며 /ad/view 페이지로 열립니다.',
  } as Localized,
}

/** What is being edited: a fixed slot (locked position+sort) or a footer row. */
interface EditTarget {
  position: string
  sort: number
  row: AdminRow | null
  caption: string
  isFooter: boolean
}

export default function AdSlotsPanel({ def }: { def: TableDef }) {
  const { t } = useTranslation()
  const L = useLocalized()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('sort', { ascending: true })
    setRows(error ? [] : ((data ?? []) as AdminRow[]))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** slots[i] = the row whose sort === i (first match); everything else is an extra. */
  const grouped = useMemo(() => {
    const out: Record<string, { slots: (AdminRow | null)[]; extras: AdminRow[] }> = {}
    for (const g of GROUPS) {
      const list = rows.filter((r) => r.position === g.position)
      const used = new Set<string>()
      const slots: (AdminRow | null)[] = []
      for (let i = 0; i < g.count; i++) {
        const r = list.find((x) => (x.sort ?? 0) === i && !used.has(String(x.id)))
        slots.push(r ?? null)
        if (r) used.add(String(r.id))
      }
      out[g.position] = { slots, extras: list.filter((x) => !used.has(String(x.id))) }
    }
    return out
  }, [rows])

  const footerRows = useMemo(() => rows.filter((r) => r.position === FOOTER_GROUP.position), [rows])

  const totalSlots = GROUPS.reduce((n, g) => n + g.count, 0)
  const filled = GROUPS.reduce((n, g) => n + grouped[g.position].slots.filter(Boolean).length, 0)
  const activeCount = rows.filter((r) => r.active).length
  const extrasCount = GROUPS.reduce((n, g) => n + grouped[g.position].extras.length, 0)

  // Slot form: position + sort are locked by the slot itself, and the form's
  // live "Will appear at" strip shows the slot's fixed spot instead.
  const slotDef: TableDef = useMemo(
    () => ({
      ...def,
      fields: def.fields.filter((f) => f.key !== 'position' && f.key !== 'sort'),
      placement: editing ? () => editing.caption : undefined,
    }),
    [def, editing],
  )

  const openSlot = (g: SlotGroup, i: number, row: AdminRow | null) =>
    setEditing({ position: g.position, sort: i, row, caption: `${L(g.title)} · ${L(g.slotName(i))}`, isFooter: false })

  /** Add a NEW creative to a crossfade group, appended after its existing rows
   *  so it joins the rotation without colliding with any fixed slot's sort. */
  const openExtra = (g: SlotGroup) => {
    const list = rows.filter((r) => r.position === g.position)
    const nextSort = list.reduce((m, r) => Math.max(m, (r.sort ?? 0) + 1), g.count)
    setEditing({
      position: g.position,
      sort: nextSort,
      row: null,
      caption: `${L(g.title)} · ${t('admin.extraCreative')}`,
      isFooter: false,
    })
  }

  /** Edit an existing extra creative in place (keeps its current sort). */
  const editExtra = (g: SlotGroup, row: AdminRow) =>
    setEditing({
      position: g.position,
      sort: row.sort ?? 0,
      row,
      caption: `${L(g.title)} · ${t('admin.extraCreative')}`,
      isFooter: false,
    })

  const openFooter = (row: AdminRow | null) =>
    setEditing({
      position: FOOTER_GROUP.position,
      sort: row?.sort ?? footerRows.reduce((m, r) => Math.max(m, (r.sort ?? 0) + 1), 0),
      row,
      caption: L(FOOTER_GROUP.title),
      isFooter: true,
    })

  const save = async (values: AdminRow) => {
    if (!editing) return
    setBusy(true)
    try {
      const payload = { ...values, position: editing.position, sort: editing.sort }
      if (editing.row) {
        const { error } = await supabase.from('advertisements').update(payload).eq('id', editing.row.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('advertisements').insert(payload)
        if (error) throw error
      }
      queryClient.invalidateQueries({ queryKey: ['ads'] }) // header/homepage/wing ads re-read fresh on the site
      toast(t('admin.saved'))
      setEditing(null)
      load()
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row: AdminRow, slot: boolean) => {
    const ok = await alertConfirm(
      slot ? t('admin.clearSlotConfirmTitle') : t('admin.deleteConfirmTitle'),
      slot ? t('admin.clearSlotConfirmText') : t('admin.deleteConfirmText'),
      t('post.delete'),
      t('post.cancel'),
    )
    if (!ok) return
    setBusy(true)
    try {
      const { error } = await supabase.from('advertisements').delete().eq('id', row.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      toast(t('admin.deleted'))
      setEditing(null)
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err) {
      alertError(t('auth.errorTitle'), errText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      {/* HERO */}
      <div className={HERO}>
        <h1 className="text-3xl font-bold leading-9">{L(def.title)}</h1>
        <p className="mt-2 text-sm text-white/80 max-w-2xl">{t('admin.slotsNote')}</p>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label={t('admin.kpiSlotsFilled')} value={loading ? '…' : `${filled}/${totalSlots}`} />
          <Kpi label={t('admin.kpiActiveAds')} value={loading ? '…' : String(activeCount)} />
          <Kpi label={L(FOOTER_GROUP.title)} value={loading ? '…' : String(footerRows.length)} />
          <Kpi label={t('admin.extraRows')} value={loading ? '…' : String(extrasCount)} />
        </div>
      </div>

      {/* Edit form — appears right under the hero so it's never lost below the groups */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          editing !== null ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {editing !== null && (
            <RecordForm
              key={`${editing.position}-${editing.sort}-${editing.row?.id ?? 'new'}`}
              def={slotDef}
              row={editing.row}
              busy={busy}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      </div>

      {/* Fixed-slot groups */}
      {GROUPS.map((g) => {
        const { slots, extras } = grouped[g.position]
        return (
          <div key={g.position} className={`mt-6 overflow-hidden ${CARD}`}>
            <div className="px-5 py-4 border-b border-[#e7ddca] flex flex-wrap items-center gap-2">
              <i className={`fa-solid ${g.icon} text-[#a98c5a]`} aria-hidden="true" />
              <h2 className={`text-base font-semibold ${INK}`}>{L(g.title)}</h2>
              <span className={BADGE}>{slots.filter(Boolean).length}/{g.count}</span>
              <p className={`flex-1 min-w-[200px] text-xs ${MUTED}`}>{L(g.hint)}</p>
              {g.allowExtra && (
                <button
                  type="button"
                  onClick={() => openExtra(g)}
                  className={`${GHOST_BTN} !h-7 !px-3 shrink-0`}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                  {t('admin.addExtra')}
                </button>
              )}
            </div>

            <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {slots.map((row, i) => {
                const isEditing = editing?.position === g.position && editing?.sort === i && !editing?.isFooter
                return (
                  <div
                    key={i}
                    className={`rounded-[14px] border bg-white overflow-hidden flex flex-col transition-shadow ${
                      isEditing ? 'border-[#a98c5a] ring-2 ring-[#a98c5a]/25' : 'border-[#e7ddca]'
                    }`}
                  >
                    {row?.image_url ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightbox(String(row.image_url))
                        }}
                        aria-label={t('admin.viewImage')}
                        className="group relative block w-full"
                      >
                        <img
                          src={publicUrl(String(row.image_url))}
                          alt=""
                          loading="lazy"
                          className="h-24 w-full object-cover border-b border-[#e7ddca] bg-[#f5efe4] cursor-zoom-in hover:opacity-90 transition-opacity"
                        />
                        <Tooltip label={t('admin.viewImage')} />
                      </button>
                    ) : (
                      <div className="h-24 grid place-items-center border-b border-dashed border-[#e7ddca] text-[#a89e8c] bg-[#fbf8f1]">
                        <i className="fa-regular fa-image text-xl" aria-hidden="true" />
                      </div>
                    )}
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <div className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${MUTED}`}>
                        {L(g.slotName(i))}
                      </div>
                      <div className={`text-sm font-medium truncate ${row ? INK : 'text-[#a89e8c] italic'}`}>
                        {row ? L(row.title) || '—' : t('admin.emptySlot')}
                      </div>
                      <div className="mt-auto flex items-center gap-1.5 pt-2">
                        {row && !row.active && <span className={BADGE}>{t('admin.hiddenBadge')}</span>}
                        <button
                          type="button"
                          onClick={() => openSlot(g, i, row)}
                          className={`${GHOST_BTN} !h-7 !px-3`}
                        >
                          <i className={`fa-solid ${row ? 'fa-pen' : 'fa-plus'}`} aria-hidden="true" />
                          {row ? t('admin.editRecord') : t('admin.setContent')}
                        </button>
                        {row && (
                          <button
                            type="button"
                            aria-label={t('admin.clearSlot')}
                            disabled={busy}
                            onClick={() => remove(row, true)}
                            className="group relative h-7 w-7 shrink-0 rounded-[14px] text-[#8a8072] hover:text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                          >
                            <i className="fa-solid fa-eraser" aria-hidden="true" />
                            <Tooltip label={t('admin.clearSlot')} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Extra creatives beyond the fixed slots — extend the rotation, editable/removable here */}
            {extras.length > 0 && (
              <div className="px-4 pb-4">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] mb-2 ${MUTED}`}>
                  {t('admin.extraRows')} ({extras.length})
                </p>
                <ul className="flex flex-col gap-1.5">
                  {extras.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 rounded-[14px] border border-[#e7ddca] bg-[#fbf8f1] px-3 py-2">
                      {r.image_url ? (
                        <button
                          type="button"
                          onClick={() => setLightbox(String(r.image_url))}
                          aria-label={t('admin.viewImage')}
                          className="group relative shrink-0"
                        >
                          <img
                            src={publicUrl(String(r.image_url))}
                            alt=""
                            loading="lazy"
                            className="h-8 w-12 object-cover rounded-lg border border-[#e7ddca] cursor-zoom-in hover:opacity-90 transition-opacity"
                          />
                          <Tooltip label={t('admin.viewImage')} />
                        </button>
                      ) : (
                        <span className="h-8 w-12 grid place-items-center rounded-lg border border-dashed border-[#e7ddca] text-[#a89e8c]">
                          <i className="fa-regular fa-image" aria-hidden="true" />
                        </span>
                      )}
                      <span className={`text-sm truncate flex-1 ${INK}`}>{L(r.title) || '—'}</span>
                      {!r.active && <span className={BADGE}>{t('admin.hiddenBadge')}</span>}
                      <button
                        type="button"
                        aria-label={t('admin.editRecord')}
                        onClick={() => editExtra(g, r)}
                        className="group relative h-7 w-7 shrink-0 rounded-[14px] text-[#8a8072] hover:text-[#a98c5a] hover:bg-[#efe7d5] transition-colors"
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                        <Tooltip label={t('admin.editRecord')} />
                      </button>
                      <button
                        type="button"
                        aria-label={t('post.delete')}
                        disabled={busy}
                        onClick={() => remove(r, false)}
                        className="group relative h-7 w-7 shrink-0 rounded-[14px] text-[#8a8072] hover:text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                      >
                        <i className="fa-solid fa-trash-can" aria-hidden="true" />
                        <Tooltip label={t('post.delete')} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}

      {/* Footer ADVERTISEMENT column — flexible list */}
      <div className={`mt-6 overflow-hidden ${CARD}`}>
        <div className="px-5 py-4 border-b border-[#e7ddca] flex flex-wrap items-center gap-2">
          <i className={`fa-solid ${FOOTER_GROUP.icon} text-[#a98c5a]`} aria-hidden="true" />
          <h2 className={`text-base font-semibold ${INK}`}>{L(FOOTER_GROUP.title)}</h2>
          <span className={`text-xs ${MUTED}`}>({footerRows.length})</span>
          <p className={`flex-1 text-xs ${MUTED}`}>{L(FOOTER_GROUP.hint)}</p>
          <button type="button" onClick={() => openFooter(null)} className={PRIMARY_BTN}>
            <i className="fa-solid fa-plus" aria-hidden="true" />
            {t('admin.newRecord')}
          </button>
        </div>
        {loading ? (
          <p className={`p-8 text-center text-sm ${MUTED}`}>
            <i className="fa-solid fa-spinner fa-spin mr-2 text-[#a98c5a]" aria-hidden="true" />…
          </p>
        ) : footerRows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${MUTED}`}>{t('admin.empty')}</p>
        ) : (
          <ul className="p-4 flex flex-col gap-1.5">
            {footerRows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-[14px] border border-[#e7ddca] bg-white px-3 py-2">
                <span className={`text-sm truncate flex-1 ${INK}`}>{L(r.title) || '—'}</span>
                {!r.active && <span className={BADGE}>{t('admin.hiddenBadge')}</span>}
                <button
                  type="button"
                  aria-label={t('admin.editRecord')}
                  onClick={() => openFooter(r)}
                  className="group relative h-7 w-7 shrink-0 rounded-[14px] text-[#8a8072] hover:text-[#a98c5a] hover:bg-[#efe7d5] transition-colors"
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                  <Tooltip label={t('admin.editRecord')} />
                </button>
                <button
                  type="button"
                  aria-label={t('post.delete')}
                  disabled={busy}
                  onClick={() => remove(r, false)}
                  className="group relative h-7 w-7 shrink-0 rounded-[14px] text-[#8a8072] hover:text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  <i className="fa-solid fa-trash-can" aria-hidden="true" />
                  <Tooltip label={t('post.delete')} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </section>
  )
}
