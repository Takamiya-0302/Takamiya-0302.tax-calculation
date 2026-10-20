import { useMemo } from 'react'
import { ChevronIcon, PlusIcon } from '../components/Icons'
import { hours, jpDate, pad, yen } from '../lib/format'
import { calcShiftPay, sumShifts } from '../lib/pay'
import type { Shift, Workplace } from '../lib/types'

interface Props {
  shifts: Shift[]
  workplaces: Workplace[]
  ym: { y: number; m: number }
  onChangeMonth: (ym: { y: number; m: number }) => void
  onAdd: () => void
  onEdit: (s: Shift) => void
}

export function Shifts({ shifts, workplaces, ym, onChangeMonth, onAdd, onEdit }: Props) {
  const prefix = `${ym.y}-${pad(ym.m + 1)}`
  const list = useMemo(
    () => shifts.filter((s) => s.date.startsWith(prefix)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [shifts, prefix],
  )
  const totals = sumShifts(list, workplaces)
  const byId = new Map(workplaces.map((w) => [w.id, w]))
  const move = (d: number) => {
    const dt = new Date(ym.y, ym.m + d, 1)
    onChangeMonth({ y: dt.getFullYear(), m: dt.getMonth() })
  }

  return (
    <div className="screen">
      <header className="screen-head row-between">
        <div>
          <div className="eyebrow">記録</div>
          <h1>シフト</h1>
        </div>
        <button className="icon-btn accent" aria-label="シフトを追加" onClick={onAdd}>
          <PlusIcon width={20} height={20} />
        </button>
      </header>

      <div className="month-nav">
        <button className="icon-btn" aria-label="前の月" onClick={() => move(-1)}>
          <ChevronIcon dir="left" width={18} height={18} />
        </button>
        <b>
          {ym.y}年 {ym.m + 1}月
        </b>
        <button className="icon-btn" aria-label="次の月" onClick={() => move(1)}>
          <ChevronIcon width={18} height={18} />
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <span>合計（交通費込み）</span>
          <b className="num">{yen(totals.total)}</b>
        </div>
        <div className="stat">
          <span>勤務</span>
          <b className="num">
            {totals.shifts}日 / {hours(totals.workedMin)}
          </b>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <p>この月のシフトはまだありません。</p>
          <button className="primary-btn" onClick={onAdd}>
            <PlusIcon width={20} height={20} />
            シフトを追加
          </button>
        </div>
      ) : (
        <ul className="shift-list">
          {list.map((s) => {
            const wp = byId.get(s.workplaceId)
            const p = calcShiftPay(s, wp?.hourly ?? 0)
            return (
              <li key={s.id}>
                <button className="shift-item" onClick={() => onEdit(s)}>
                  <span className="stack-4">
                    <b>{jpDate(s.date)}</b>
                    <span className="muted small">
                      {wp?.name ?? '（削除されたバイト先）'}・{s.start}〜{s.end}
                      {p.nightMin > 0 && <span className="tag">深夜</span>}
                    </span>
                  </span>
                  <span className="stack-4 right">
                    <b className="num">{yen(p.total)}</b>
                    <span className="muted small num">{hours(p.workedMin)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
