import type { Shift, Workplace } from './types'

export const NIGHT_PREMIUM = 0.25
export const OVERTIME_PREMIUM = 0.25
/** 1日8時間を超えると時間外 */
export const OVERTIME_AFTER_MIN = 8 * 60

export interface ShiftPay {
  /** 実働（分） */
  workedMin: number
  /** うち深夜（22〜5時）の分 */
  nightMin: number
  /** うち時間外（8時間超）の分 */
  overtimeMin: number
  /** 割増なしで計算した基本給 */
  base: number
  /** 深夜割増分 */
  nightExtra: number
  /** 時間外割増分 */
  overtimeExtra: number
  transport: number
  /** 給与（交通費を除く） */
  wage: number
  /** 交通費込み */
  total: number
}

export function parseTime(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return NaN
  return Number(m[1]) * 60 + Number(m[2])
}

const isNight = (minuteOfDay: number) => {
  const m = minuteOfDay % 1440
  return m >= 22 * 60 || m < 5 * 60
}

/**
 * 1シフトの給与を計算する。
 * - 終了が開始以前なら翌日終了とみなす
 * - 休憩は深夜以外の時間帯の中ほどで取ったものとして差し引く
 * - 8時間を超えた分は時間外（25%増）、深夜と重なれば50%増
 */
export function calcShiftPay(shift: Pick<Shift, 'start' | 'end' | 'breakMin' | 'transport'>, hourly: number): ShiftPay {
  const start = parseTime(shift.start)
  let end = parseTime(shift.end)
  const empty: ShiftPay = { workedMin: 0, nightMin: 0, overtimeMin: 0, base: 0, nightExtra: 0, overtimeExtra: 0, transport: shift.transport || 0, wage: 0, total: shift.transport || 0 }
  if (Number.isNaN(start) || Number.isNaN(end)) return empty
  if (end <= start) end += 1440

  const minutes: number[] = []
  for (let t = start; t < end; t++) minutes.push(t)

  // 休憩を深夜以外の時間帯の中央から取り除く（足りなければ深夜からも）
  let breakLeft = Math.max(0, Math.min(shift.breakMin || 0, minutes.length))
  const removed = new Set<number>()
  const dayIdx = minutes.map((t, i) => (isNight(t) ? -1 : i)).filter((i) => i >= 0)
  const takeFromMiddle = (idx: number[]) => {
    if (breakLeft <= 0 || idx.length === 0) return
    const n = Math.min(breakLeft, idx.length)
    const from = Math.floor((idx.length - n) / 2)
    for (let k = from; k < from + n; k++) removed.add(idx[k])
    breakLeft -= n
  }
  takeFromMiddle(dayIdx)
  takeFromMiddle(minutes.map((_, i) => i).filter((i) => !removed.has(i)))

  let workedMin = 0
  let nightMin = 0
  let overtimeMin = 0
  minutes.forEach((t, i) => {
    if (removed.has(i)) return
    workedMin++
    if (isNight(t)) nightMin++
    if (workedMin > OVERTIME_AFTER_MIN) overtimeMin++
  })

  // 浮動小数の誤差を避けるため、掛けてから60で割る
  const base = Math.round((workedMin * hourly) / 60)
  const nightExtra = Math.round((nightMin * hourly * NIGHT_PREMIUM) / 60)
  const overtimeExtra = Math.round((overtimeMin * hourly * OVERTIME_PREMIUM) / 60)
  const wage = base + nightExtra + overtimeExtra
  const transport = Math.max(0, shift.transport || 0)
  return { workedMin, nightMin, overtimeMin, base, nightExtra, overtimeExtra, transport, wage, total: wage + transport }
}

export interface Totals {
  shifts: number
  workedMin: number
  base: number
  nightExtra: number
  overtimeExtra: number
  transport: number
  wage: number
  total: number
}

export const emptyTotals = (): Totals => ({ shifts: 0, workedMin: 0, base: 0, nightExtra: 0, overtimeExtra: 0, transport: 0, wage: 0, total: 0 })

export function sumShifts(shifts: Shift[], workplaces: Workplace[]): Totals {
  const byId = new Map(workplaces.map((w) => [w.id, w]))
  const t = emptyTotals()
  for (const s of shifts) {
    const wp = byId.get(s.workplaceId)
    if (!wp) continue
    const p = calcShiftPay(s, wp.hourly)
    t.shifts++
    t.workedMin += p.workedMin
    t.base += p.base
    t.nightExtra += p.nightExtra
    t.overtimeExtra += p.overtimeExtra
    t.transport += p.transport
    t.wage += p.wage
    t.total += p.total
  }
  return t
}

/** 年の各月（0〜11）の合計 */
export function monthlyTotals(shifts: Shift[], workplaces: Workplace[], year: number): Totals[] {
  return Array.from({ length: 12 }, (_, m) => {
    const prefix = `${year}-${String(m + 1).padStart(2, '0')}`
    return sumShifts(shifts.filter((s) => s.date.startsWith(prefix)), workplaces)
  })
}

/**
 * 年末見込み。今月までの実績（予定込み）＋ 過去の完了月の平均 × 残り月数。
 * 完了月のデータがなければ今月の額を平均として使う。
 */
export function projectYear(months: Totals[], currentMonth: number, key: 'wage' | 'total'): number {
  const soFar = months.slice(0, currentMonth + 1).reduce((a, m) => a + m[key], 0)
  const first = months.findIndex((m) => m.shifts > 0)
  const completed = first >= 0 && first < currentMonth ? months.slice(first, currentMonth) : []
  const avg = completed.length ? completed.reduce((a, m) => a + m[key], 0) / completed.length : months[currentMonth][key]
  const future = months.slice(currentMonth + 1).reduce((a, m) => a + m[key], 0)
  const remainingMonths = 11 - currentMonth
  // 先の月にすでに入っている予定は、平均より多ければそちらを使う
  return Math.round(soFar + Math.max(future, avg * remainingMonths))
}
