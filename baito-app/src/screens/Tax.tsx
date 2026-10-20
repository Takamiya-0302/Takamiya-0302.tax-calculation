import { useMemo, useState } from 'react'
import { currentRules } from '../rules/rules2026'
import { man, yen } from '../lib/format'
import { calcTakeHome } from '../lib/tax'
import type { Settings } from '../lib/types'

interface Props {
  settings: Settings
  projectedIncome: number
}

export function Tax({ settings, projectedIncome }: Props) {
  const [text, setText] = useState(() => (projectedIncome > 0 ? projectedIncome : 2_000_000).toLocaleString('ja-JP'))
  const [mode, setMode] = useState<'student' | 'employee'>(settings.isStudent ? 'student' : 'employee')
  const income = Math.max(0, Number(text.replace(/[^\d]/g, '')) || 0)
  const r = useMemo(
    () => calcTakeHome(income, { isStudent: mode === 'student', withSocialInsurance: mode === 'employee', settings }, currentRules),
    [income, mode, settings],
  )
  const share = (v: number) => (income > 0 ? (v / income) * 100 : 0)
  const it = r.incomeTax

  return (
    <div className="screen">
      <header className="screen-head">
        <div className="eyebrow">年収から概算</div>
        <h1>税金・手取り</h1>
      </header>

      <label className="card income-input">
        <span className="muted small">年収（給与のみ・交通費を除く）</span>
        <span className="row baseline gap-4">
          <span className="yen-mark num">¥</span>
          <input
            className="num"
            inputMode="numeric"
            value={text}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^\d]/g, ''))
              setText(e.target.value === '' ? '' : n.toLocaleString('ja-JP'))
            }}
          />
        </span>
        {projectedIncome > 0 && (
          <button type="button" className="link-btn left" onClick={() => setText(projectedIncome.toLocaleString('ja-JP'))}>
            今年の見込み額（{man(projectedIncome)}円）を入れる
          </button>
        )}
      </label>

      <div className="segmented" role="group" aria-label="区分">
        <button aria-pressed={mode === 'student'} onClick={() => setMode('student')}>
          学生バイト
        </button>
        <button aria-pressed={mode === 'employee'} onClick={() => setMode('employee')}>
          社会保険あり
        </button>
      </div>

      <section className="card stack" aria-label="結果" aria-live="polite">
        <div className="row-between baseline wrap">
          <b>手取り（年）</b>
          <span className="big-num num accent-text">{yen(r.takeHome)}</span>
        </div>
        <div className="share-bar" role="img" aria-label={`手取り${share(r.takeHome).toFixed(1)}%`}>
          <div className="take" style={{ flexGrow: share(r.takeHome) }} />
          {r.socialInsurance > 0 && <div className="si" style={{ flexGrow: share(r.socialInsurance) }} />}
          {r.residentTax.tax > 0 && <div className="rt" style={{ flexGrow: share(r.residentTax.tax) }} />}
          {it.tax > 0 && <div className="it" style={{ flexGrow: share(it.tax) }} />}
        </div>
        <dl className="breakdown">
          <div>
            <dt><i className="sw it" />所得税（復興税込み）</dt>
            <dd className="num">{yen(it.tax)}</dd>
          </div>
          <div>
            <dt><i className="sw rt" />住民税（翌年に課税）</dt>
            <dd className="num">{yen(r.residentTax.tax)}</dd>
          </div>
          <div className={r.socialInsurance ? '' : 'muted'}>
            <dt><i className="sw si" />社会保険料</dt>
            <dd className="num">{yen(r.socialInsurance)}</dd>
          </div>
          <div className="muted small">
            <dt>月あたりの手取り</dt>
            <dd className="num">{yen(r.takeHome / 12)}</dd>
          </div>
        </dl>
      </section>

      <details className="card">
        <summary>計算の内訳を見る</summary>
        <ul className="detail-list">
          <li>給与所得控除 {yen(it.salaryDeduction)} → 給与所得 {yen(it.salaryIncome)}</li>
          <li>
            所得税：基礎控除 {yen(it.basic)}
            {it.workingStudent > 0 && `・勤労学生控除 ${yen(it.workingStudent)}`}
            {it.socialInsurance > 0 && `・社会保険料控除 ${yen(it.socialInsurance)}`} → 課税所得 {yen(it.taxable)}
          </li>
          <li>
            住民税：
            {r.residentTax.exempt
              ? '所得45万円以下のため非課税'
              : `課税所得 ${yen(r.residentTax.taxable)} × 10% − 調整控除 ＋ 均等割 ${yen(r.residentTax.perCapita)}`}
          </li>
          {mode === 'employee' && (
            <li>
              社会保険料率（本人負担）：健康保険 {settings.healthRate}%・厚生年金 {settings.pensionRate}%・雇用保険 {settings.employmentRate}%（設定で変更可）
            </li>
          )}
        </ul>
      </details>

      <p className="fineprint">
        {currentRules.year}年分のルールで計算した概算です。実際の税額は自治体や年末調整、他の控除の内容で変わります。社会保険料は等級を使わず率で計算しています。
      </p>
    </div>
  )
}
