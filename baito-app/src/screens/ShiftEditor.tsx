import { useMemo, useState } from 'react'
import { PlusIcon } from '../components/Icons'
import { hours, yen } from '../lib/format'
import { calcShiftPay } from '../lib/pay'
import { newId } from '../lib/store'
import type { Shift, Workplace } from '../lib/types'

interface Props {
  initial: Shift | null
  defaultDate: string
  workplaces: Workplace[]
  lastShift?: Shift
  onSave: (s: Shift) => void
  onDelete: (id: string) => void
  onClose: () => void
  onAddWorkplace: () => void
}

export function ShiftEditor({ initial, defaultDate, workplaces, lastShift, onSave, onDelete, onClose, onAddWorkplace }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState<Shift>(() => {
    if (initial) return initial
    // 前回のシフトの時間を初期値にすると入力が速い
    const wp = workplaces.find((w) => w.id === lastShift?.workplaceId) ?? workplaces[0]
    return {
      id: newId(),
      workplaceId: wp?.id ?? '',
      date: defaultDate,
      start: lastShift?.start ?? '17:00',
      end: lastShift?.end ?? '22:00',
      breakMin: lastShift?.breakMin ?? 0,
      transport: wp?.transport ?? 0,
    }
  })
  const wp = workplaces.find((w) => w.id === draft.workplaceId)
  const pay = useMemo(() => calcShiftPay(draft, wp?.hourly ?? 0), [draft, wp])
  const set = (p: Partial<Shift>) => setDraft((d) => ({ ...d, ...p }))
  const valid = !!wp && pay.workedMin > 0
  const regularMin = pay.workedMin - pay.nightMin

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="shift-title">
      <header className="sheet-head">
        <button className="link-btn" onClick={onClose}>キャンセル</button>
        <h1 id="shift-title">{initial ? 'シフトを編集' : 'シフトを追加'}</h1>
        <span className="sheet-head-spacer" />
      </header>

      <form
        className="sheet-body"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onSave(draft)
        }}
      >
        <fieldset className="plain">
          <legend className="field-legend">バイト先</legend>
          <div className="chips">
            {workplaces.map((w) => (
              <button
                type="button"
                key={w.id}
                className={`chip ${w.id === draft.workplaceId ? 'is-on' : ''}`}
                aria-pressed={w.id === draft.workplaceId}
                onClick={() => set({ workplaceId: w.id, transport: initial ? draft.transport : w.transport })}
              >
                {w.name}　{yen(w.hourly)}
              </button>
            ))}
            <button type="button" className="chip-add" aria-label="バイト先を追加" onClick={onAddWorkplace}>
              <PlusIcon width={16} height={16} />
            </button>
          </div>
        </fieldset>

        <div className="form-card">
          <label className="form-row">
            日付
            <input type="date" required value={draft.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
          <label className="form-row">
            開始
            <input type="time" required className="num" value={draft.start} onChange={(e) => set({ start: e.target.value })} />
          </label>
          <label className="form-row">
            終了
            <input type="time" required className="num" value={draft.end} onChange={(e) => set({ end: e.target.value })} />
          </label>
          <label className="form-row">
            休憩（分）
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={5}
              className="num"
              value={draft.breakMin}
              onChange={(e) => set({ breakMin: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <label className="form-row">
            交通費（円）
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="num"
              value={draft.transport}
              onChange={(e) => set({ transport: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
        </div>

        <section className="hero compact" aria-label="この日の計算" aria-live="polite">
          <div className="calc-line">
            <span>通常 {hours(regularMin)} × {yen(wp?.hourly ?? 0)}</span>
            <b className="num">{yen(Math.round((regularMin * (wp?.hourly ?? 0)) / 60))}</b>
          </div>
          {pay.nightMin > 0 && (
            <div className="calc-line">
              <span>深夜 {hours(pay.nightMin)} × {yen((wp?.hourly ?? 0) * 1.25)}</span>
              <b className="num">{yen(Math.round((pay.nightMin * (wp?.hourly ?? 0)) / 60) + pay.nightExtra)}</b>
            </div>
          )}
          {pay.overtimeMin > 0 && (
            <div className="calc-line">
              <span>残業割増 {hours(pay.overtimeMin)}</span>
              <b className="num">{yen(pay.overtimeExtra)}</b>
            </div>
          )}
          <div className="calc-line">
            <span>交通費</span>
            <b className="num">{yen(pay.transport)}</b>
          </div>
          <div className="calc-total">
            <b>この日の合計</b>
            <b className="num">{yen(pay.total)}</b>
          </div>
          <div className="hero-foot">22時〜5時は25%、8時間を超えた分も25%割増で計算します</div>
        </section>

        <button type="submit" className="primary-btn" disabled={!valid}>
          保存する
        </button>
        {initial && (
          <button
            type="button"
            className={`danger-btn ${confirmDelete ? 'is-armed' : ''}`}
            onClick={() => (confirmDelete ? onDelete(initial.id) : setConfirmDelete(true))}
          >
            {confirmDelete ? 'もう一度押すと削除します' : 'このシフトを削除'}
          </button>
        )}
      </form>
    </div>
  )
}
