import { useCallback, useEffect, useState } from 'react'
import type { AppData, Settings, Shift, Workplace } from './types'

const KEY = 'baito-app:v1'

export const defaultSettings: Settings = {
  ageGroup: 'student19to22',
  isStudent: true,
  healthRate: 5.0,
  pensionRate: 9.15,
  employmentRate: 0.5,
}

export const emptyData = (): AppData => ({ version: 1, workplaces: [], shifts: [], settings: { ...defaultSettings } })

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    return normalize(JSON.parse(raw))
  } catch {
    return emptyData()
  }
}

/** 読み込んだJSONを安全な形にそろえる（バックアップの読み込みにも使う） */
export function normalize(x: unknown): AppData {
  const d = (x ?? {}) as Partial<AppData>
  const num = (v: unknown, fb: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fb)
  const str = (v: unknown, fb = '') => (typeof v === 'string' ? v : fb)
  const workplaces: Workplace[] = Array.isArray(d.workplaces)
    ? d.workplaces.map((w) => ({ id: str(w?.id, newId()), name: str(w?.name, 'バイト先'), hourly: num(w?.hourly, 1000), transport: num(w?.transport, 0) }))
    : []
  const shifts: Shift[] = Array.isArray(d.shifts)
    ? d.shifts
        .filter((s) => s && /^\d{4}-\d{2}-\d{2}$/.test(str(s.date)))
        .map((s) => ({
          id: str(s.id, newId()),
          workplaceId: str(s.workplaceId),
          date: str(s.date),
          start: str(s.start, '09:00'),
          end: str(s.end, '17:00'),
          breakMin: num(s.breakMin, 0),
          transport: num(s.transport, 0),
        }))
    : []
  const s = (d.settings ?? {}) as Partial<Settings>
  const settings: Settings = {
    ageGroup: s.ageGroup === 'other' ? 'other' : 'student19to22',
    isStudent: typeof s.isStudent === 'boolean' ? s.isStudent : true,
    healthRate: num(s.healthRate, defaultSettings.healthRate),
    pensionRate: num(s.pensionRate, defaultSettings.pensionRate),
    employmentRate: num(s.employmentRate, defaultSettings.employmentRate),
  }
  return { version: 1, workplaces, shifts, settings }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(load)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [data])

  const upsertShift = useCallback((s: Shift) => {
    setData((d) => ({ ...d, shifts: d.shifts.some((x) => x.id === s.id) ? d.shifts.map((x) => (x.id === s.id ? s : x)) : [...d.shifts, s] }))
  }, [])
  const deleteShift = useCallback((id: string) => setData((d) => ({ ...d, shifts: d.shifts.filter((x) => x.id !== id) })), [])
  const upsertWorkplace = useCallback((w: Workplace) => {
    setData((d) => ({ ...d, workplaces: d.workplaces.some((x) => x.id === w.id) ? d.workplaces.map((x) => (x.id === w.id ? w : x)) : [...d.workplaces, w] }))
  }, [])
  const deleteWorkplace = useCallback((id: string) => {
    setData((d) => ({ ...d, workplaces: d.workplaces.filter((x) => x.id !== id), shifts: d.shifts.filter((s) => s.workplaceId !== id) }))
  }, [])
  const updateSettings = useCallback((p: Partial<Settings>) => setData((d) => ({ ...d, settings: { ...d.settings, ...p } })), [])
  const replaceAll = useCallback((next: AppData) => setData(next), [])

  return { data, saveError, upsertShift, deleteShift, upsertWorkplace, deleteWorkplace, updateSettings, replaceAll }
}

export type Store = ReturnType<typeof useAppData>
