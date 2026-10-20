export interface Workplace {
  id: string
  name: string
  /** 時給（円） */
  hourly: number
  /** 1回あたりの交通費の初期値（円） */
  transport: number
}

export interface Shift {
  id: string
  workplaceId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  start: string
  /** HH:MM（開始より前なら翌日） */
  end: string
  breakMin: number
  transport: number
}

export type AgeGroup = 'student19to22' | 'other'

export interface Settings {
  ageGroup: AgeGroup
  isStudent: boolean
  /** 社会保険料率（本人負担・%） */
  healthRate: number
  pensionRate: number
  employmentRate: number
}

export interface AppData {
  version: 1
  workplaces: Workplace[]
  shifts: Shift[]
  settings: Settings
}
