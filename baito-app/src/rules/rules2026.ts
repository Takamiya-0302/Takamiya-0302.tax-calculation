// 2026年分（令和8年分）の所得税・令和9年度の住民税ルール。
// 税制は毎年変わるので、年ごとにこのファイルを差し替える。
// 出典: 国税庁タックスアンサーNo.1199、仙台市「令和9年度から適用される個人市県民税の税制改正」ほか

export interface Bracket {
  /** この金額「以下」に適用（Infinityで上限なし） */
  upTo: number
  rate: number
  /** 控除額（所得税の速算表）または加算額（給与所得控除） */
  amount: number
}

export interface TaxRules {
  year: number
  /** 給与所得控除: 収入 upTo 以下なら 収入×rate+amount、ただし minimum 以上 */
  salaryDeduction: { minimum: number; brackets: Bracket[] }
  incomeTax: {
    /** 基礎控除: 合計所得 upTo 以下なら amount */
    basic: { upTo: number; amount: number }[]
    /** 勤労学生控除 */
    workingStudent: { amount: number; incomeLimit: number }
    /** 速算表 */
    brackets: Bracket[]
    /** 復興特別所得税 */
    reconstructionRate: number
  }
  residentTax: {
    basic: number
    workingStudent: number
    rate: number
    /** 合計所得がこれ以下なら非課税（扶養なし単身・1級地） */
    exemptIncome: number
    /** 均等割（森林環境税込み） */
    perCapita: number
    /** 調整控除の人的控除差（基礎控除分） */
    adjustmentBase: number
    adjustmentStudentExtra: number
  }
  /** 年収の壁（給与収入ベース） */
  walls: Wall[]
}

export type WallTarget = 'self' | 'parent'

export interface Wall {
  id: string
  amount: number
  label: string
  target: WallTarget
  note: string
  /** student19to22: 19〜22歳のみ / other: それ以外の年齢のみ / all */
  applies: 'all' | 'student19to22' | 'other'
  /** taxable: 交通費を除く（税金） / gross: 交通費を含む（健康保険の扶養） */
  basis: 'taxable' | 'gross'
}

export const rules2026: TaxRules = {
  year: 2026,
  salaryDeduction: {
    // 2026・2027年分は最低保障74万円（本則69万円＋特例5万円）。220万円以下に適用
    minimum: 740_000,
    brackets: [
      { upTo: 3_600_000, rate: 0.3, amount: 80_000 },
      { upTo: 6_600_000, rate: 0.2, amount: 440_000 },
      { upTo: 8_500_000, rate: 0.1, amount: 1_100_000 },
      { upTo: Infinity, rate: 0, amount: 1_950_000 },
    ],
  },
  incomeTax: {
    basic: [
      { upTo: 4_890_000, amount: 1_040_000 },
      { upTo: 6_550_000, amount: 670_000 },
      { upTo: 23_500_000, amount: 620_000 },
      { upTo: 24_000_000, amount: 480_000 },
      { upTo: 24_500_000, amount: 320_000 },
      { upTo: 25_000_000, amount: 160_000 },
      { upTo: Infinity, amount: 0 },
    ],
    workingStudent: { amount: 270_000, incomeLimit: 890_000 },
    brackets: [
      { upTo: 1_949_000, rate: 0.05, amount: 0 },
      { upTo: 3_299_000, rate: 0.1, amount: 97_500 },
      { upTo: 6_949_000, rate: 0.2, amount: 427_500 },
      { upTo: 8_999_000, rate: 0.23, amount: 636_000 },
      { upTo: 17_999_000, rate: 0.33, amount: 1_536_000 },
      { upTo: 39_999_000, rate: 0.4, amount: 2_796_000 },
      { upTo: Infinity, rate: 0.45, amount: 4_796_000 },
    ],
    reconstructionRate: 0.021,
  },
  residentTax: {
    basic: 430_000,
    workingStudent: 260_000,
    rate: 0.1,
    exemptIncome: 450_000,
    perCapita: 5_000,
    adjustmentBase: 50_000,
    adjustmentStudentExtra: 10_000,
  },
  walls: [
    {
      id: 'resident',
      amount: 1_190_000,
      label: '住民税がかかる',
      target: 'self',
      note: '翌年に住民税（年5,000円〜）がかかりはじめる。自治体で多少差あり',
      applies: 'all',
      basis: 'taxable',
    },
    {
      id: 'parent-tax',
      amount: 1_360_000,
      label: '親の税金の扶養',
      target: 'parent',
      note: '親の扶養控除の条件（所得62万円）を超える。19〜22歳は特定親族特別控除で段階的に減少',
      applies: 'all',
      basis: 'taxable',
    },
    {
      id: 'health-130',
      amount: 1_300_000,
      label: '親の健康保険の扶養',
      target: 'parent',
      note: '超えると親の健康保険から外れ、自分で保険料を払う',
      applies: 'other',
      basis: 'gross',
    },
    {
      id: 'health-150',
      amount: 1_500_000,
      label: '親の健康保険の扶養',
      target: 'parent',
      note: '19〜22歳は150万円未満まで扶養に入れる。超えると自分で保険料を払う',
      applies: 'student19to22',
      basis: 'gross',
    },
    {
      id: 'income',
      amount: 1_780_000,
      label: '所得税がかかる',
      target: 'self',
      note: '自分に所得税がかかりはじめる',
      applies: 'all',
      basis: 'taxable',
    },
  ],
}

export const currentRules = rules2026
