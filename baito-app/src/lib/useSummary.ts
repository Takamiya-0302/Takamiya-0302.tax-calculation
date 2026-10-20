import { useMemo } from 'react'
import { currentRules } from '../rules/rules2026'
import { monthlyTotals, projectYear, sumShifts } from './pay'
import type { AppData } from './types'
import { wallStatuses, nextWall } from './walls'
import { toISODate } from './format'

export function useSummary(data: AppData, today = new Date()) {
  return useMemo(() => {
    const year = today.getFullYear()
    const month = today.getMonth()
    const todayISO = toISODate(today)
    const yearShifts = data.shifts.filter((s) => s.date.startsWith(`${year}-`))
    const months = monthlyTotals(yearShifts, data.workplaces, year)
    const done = sumShifts(yearShifts.filter((s) => s.date <= todayISO), data.workplaces)
    const all = sumShifts(yearShifts, data.workplaces)
    const projected = {
      taxable: Math.max(all.wage, projectYear(months, month, 'wage')),
      gross: Math.max(all.total, projectYear(months, month, 'total')),
    }
    const walls = wallStatuses(data.settings.ageGroup, { taxable: done.wage, gross: done.total }, projected, currentRules)
    const primary = data.workplaces[0]
    return {
      year,
      month,
      months,
      thisMonth: months[month],
      done,
      projected,
      walls,
      next: nextWall(walls),
      hourly: primary?.hourly ?? 0,
      rulesYear: currentRules.year,
    }
  }, [data, today])
}

export type Summary = ReturnType<typeof useSummary>
