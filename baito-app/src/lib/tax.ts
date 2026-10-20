import type { TaxRules } from '../rules/rules2026'
import type { Settings } from './types'

const floorTo = (v: number, unit: number) => Math.floor(v / unit) * unit

/** 給与所得控除 */
export function salaryDeduction(income: number, r: TaxRules): number {
  if (income <= 0) return 0
  const b = r.salaryDeduction.brackets.find((x) => income <= x.upTo)!
  const d = Math.floor(income * b.rate + b.amount)
  return Math.min(income, Math.max(r.salaryDeduction.minimum, d))
}

/** 給与所得（合計所得金額） */
export function salaryIncome(income: number, r: TaxRules): number {
  return Math.max(0, income - salaryDeduction(income, r))
}

export function basicDeduction(totalIncome: number, r: TaxRules): number {
  return r.incomeTax.basic.find((b) => totalIncome <= b.upTo)!.amount
}

export interface TaxInput {
  /** 年間の給与収入（交通費を除く） */
  income: number
  isStudent: boolean
  /** 年間の社会保険料（本人負担） */
  socialInsurance: number
}

export interface IncomeTaxDetail {
  salaryDeduction: number
  salaryIncome: number
  basic: number
  workingStudent: number
  socialInsurance: number
  taxable: number
  tax: number
}

export function incomeTax(input: TaxInput, r: TaxRules): IncomeTaxDetail {
  const sd = salaryDeduction(input.income, r)
  const si = Math.max(0, input.income - sd)
  const basic = basicDeduction(si, r)
  const ws = input.isStudent && si <= r.incomeTax.workingStudent.incomeLimit ? r.incomeTax.workingStudent.amount : 0
  const taxable = floorTo(Math.max(0, si - basic - ws - input.socialInsurance), 1000)
  const b = r.incomeTax.brackets.find((x) => taxable <= x.upTo)!
  const base = Math.max(0, taxable * b.rate - b.amount)
  const tax = floorTo(base * (1 + r.incomeTax.reconstructionRate), 100)
  return { salaryDeduction: sd, salaryIncome: si, basic, workingStudent: ws, socialInsurance: input.socialInsurance, taxable, tax }
}

export interface ResidentTaxDetail {
  exempt: boolean
  taxable: number
  incomeLevy: number
  perCapita: number
  tax: number
}

export function residentTax(input: TaxInput, r: TaxRules): ResidentTaxDetail {
  const rt = r.residentTax
  const si = salaryIncome(input.income, r)
  if (si <= rt.exemptIncome) return { exempt: true, taxable: 0, incomeLevy: 0, perCapita: 0, tax: 0 }
  const ws = input.isStudent && si <= r.incomeTax.workingStudent.incomeLimit ? rt.workingStudent : 0
  const taxable = floorTo(Math.max(0, si - rt.basic - ws - input.socialInsurance), 1000)
  const adjBase = rt.adjustmentBase + (ws ? rt.adjustmentStudentExtra : 0)
  const adjustment = taxable <= 2_000_000 ? Math.min(adjBase, taxable) * 0.05 : 0
  const incomeLevy = floorTo(Math.max(0, taxable * rt.rate - adjustment), 100)
  return { exempt: false, taxable, incomeLevy, perCapita: rt.perCapita, tax: incomeLevy + rt.perCapita }
}

/** 社会保険料（本人負担）の概算。標準報酬月額の等級は使わず率で計算する */
export function socialInsurance(income: number, s: Pick<Settings, 'healthRate' | 'pensionRate' | 'employmentRate'>): number {
  const rate = (s.healthRate + s.pensionRate + s.employmentRate) / 100
  return Math.round(income * rate)
}

export interface TakeHome {
  income: number
  incomeTax: IncomeTaxDetail
  residentTax: ResidentTaxDetail
  socialInsurance: number
  takeHome: number
}

export function calcTakeHome(income: number, opts: { isStudent: boolean; withSocialInsurance: boolean; settings: Settings }, r: TaxRules): TakeHome {
  const si = opts.withSocialInsurance ? socialInsurance(income, opts.settings) : 0
  const input = { income, isStudent: opts.isStudent, socialInsurance: si }
  const it = incomeTax(input, r)
  const rt = residentTax(input, r)
  return { income, incomeTax: it, residentTax: rt, socialInsurance: si, takeHome: income - it.tax - rt.tax - si }
}
