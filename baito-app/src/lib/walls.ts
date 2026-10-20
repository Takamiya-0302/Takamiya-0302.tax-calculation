import type { TaxRules, Wall } from '../rules/rules2026'
import type { AgeGroup } from './types'

export interface WallStatus extends Wall {
  current: number
  projected: number
  remaining: number
  /** 0〜1 */
  progress: number
  crossed: boolean
  willCross: boolean
}

export function wallsFor(ageGroup: AgeGroup, r: TaxRules): Wall[] {
  return r.walls.filter((w) => w.applies === 'all' || w.applies === ageGroup).sort((a, b) => a.amount - b.amount)
}

export function wallStatuses(
  ageGroup: AgeGroup,
  income: { taxable: number; gross: number },
  projected: { taxable: number; gross: number },
  r: TaxRules,
): WallStatus[] {
  return wallsFor(ageGroup, r).map((w) => {
    const current = income[w.basis]
    const proj = projected[w.basis]
    return {
      ...w,
      current,
      projected: proj,
      remaining: w.amount - current,
      progress: Math.min(1, Math.max(0, current / w.amount)),
      // 健康保険の扶養は「未満」、税金は「以下」が条件
      crossed: w.basis === 'gross' ? current >= w.amount : current > w.amount,
      willCross: w.basis === 'gross' ? proj >= w.amount : proj > w.amount,
    }
  })
}

/** まだ超えていない最も近い壁 */
export function nextWall(statuses: WallStatus[]): WallStatus | undefined {
  return statuses.find((s) => !s.crossed)
}
