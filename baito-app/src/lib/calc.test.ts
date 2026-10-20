import { describe, expect, it } from 'vitest'
import { rules2026 as r } from '../rules/rules2026'
import { calcShiftPay, projectYear, emptyTotals } from './pay'
import { calcTakeHome, incomeTax, residentTax, salaryDeduction } from './tax'
import { wallStatuses } from './walls'

const settings = { ageGroup: 'student19to22' as const, isStudent: true, healthRate: 5, pensionRate: 9.15, employmentRate: 0.5 }

describe('シフトの給与', () => {
  it('17:00〜23:30 休憩30分 時給1,100円', () => {
    const p = calcShiftPay({ start: '17:00', end: '23:30', breakMin: 30, transport: 440 }, 1100)
    expect(p.workedMin).toBe(360)
    expect(p.nightMin).toBe(90)
    expect(p.base).toBe(6600)
    expect(p.nightExtra).toBe(413)
    expect(p.total).toBe(6600 + 413 + 440)
  })
  it('日をまたぐシフト 22:00〜6:00 休憩60分は昼の時間帯から引く', () => {
    const p = calcShiftPay({ start: '22:00', end: '6:00', breakMin: 60, transport: 0 }, 1200)
    expect(p.workedMin).toBe(420)
    expect(p.nightMin).toBe(420)
  })
  it('8時間を超えた分は時間外', () => {
    const p = calcShiftPay({ start: '9:00', end: '19:00', breakMin: 0, transport: 0 }, 1200)
    expect(p.overtimeMin).toBe(120)
    expect(p.overtimeExtra).toBe(600)
  })
  it('時刻が不正なら0円（交通費のみ）', () => {
    expect(calcShiftPay({ start: 'x', end: '10:00', breakMin: 0, transport: 300 }, 1000).total).toBe(300)
  })
})

describe('2026年分の税金', () => {
  it('給与所得控除の最低保障は74万円', () => {
    expect(salaryDeduction(1_500_000, r)).toBe(740_000)
    expect(salaryDeduction(3_000_000, r)).toBe(980_000)
  })
  it('178万円までは所得税0円、超えるとかかる', () => {
    expect(incomeTax({ income: 1_780_000, isStudent: false, socialInsurance: 0 }, r).tax).toBe(0)
    expect(incomeTax({ income: 1_790_000, isStudent: false, socialInsurance: 0 }, r).tax).toBe(500)
  })
  it('年収200万円の学生（デザインの例）', () => {
    const t = calcTakeHome(2_000_000, { isStudent: true, withSocialInsurance: false, settings }, r)
    expect(t.incomeTax.tax).toBe(11_200)
    expect(t.residentTax.tax).toBe(85_500)
    expect(t.takeHome).toBe(1_903_300)
  })
  it('住民税は119万円まで非課税', () => {
    expect(residentTax({ income: 1_190_000, isStudent: false, socialInsurance: 0 }, r).tax).toBe(0)
    expect(residentTax({ income: 1_200_000, isStudent: false, socialInsurance: 0 }, r).tax).toBe(6_500)
  })
  it('勤労学生は住民税の所得割がかからず均等割のみ', () => {
    expect(residentTax({ income: 1_200_000, isStudent: true, socialInsurance: 0 }, r).tax).toBe(5_000)
  })
  it('高所得では基礎控除が減る', () => {
    expect(incomeTax({ income: 7_000_000, isStudent: false, socialInsurance: 0 }, r).basic).toBe(670_000)
  })
})

describe('年収の壁', () => {
  it('19〜22歳は健康保険の壁が150万円、交通費込みで判定', () => {
    const s = wallStatuses('student19to22', { taxable: 1_000_000, gross: 1_050_000 }, { taxable: 1_200_000, gross: 1_260_000 }, r)
    expect(s.map((w) => w.amount)).toEqual([1_190_000, 1_360_000, 1_500_000, 1_780_000])
    expect(s[0].remaining).toBe(190_000)
    expect(s[0].willCross).toBe(true)
    expect(s[2].current).toBe(1_050_000)
  })
  it('それ以外の年齢は130万円', () => {
    const s = wallStatuses('other', { taxable: 0, gross: 0 }, { taxable: 0, gross: 0 }, r)
    expect(s.some((w) => w.amount === 1_300_000)).toBe(true)
  })
})

describe('年末見込み', () => {
  it('完了月の平均で残りを埋める', () => {
    const months = Array.from({ length: 12 }, emptyTotals)
    months[7] = { ...emptyTotals(), shifts: 1, wage: 80_000 }
    months[8] = { ...emptyTotals(), shifts: 1, wage: 100_000 }
    months[9] = { ...emptyTotals(), shifts: 1, wage: 50_000 }
    // 10月時点: 実績23万 + 平均9万 × 残り2か月
    expect(projectYear(months, 9, 'wage')).toBe(410_000)
  })
})
