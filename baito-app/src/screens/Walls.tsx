import { hours, man, yen } from '../lib/format'
import type { Summary } from '../lib/useSummary'

export function Walls({ summary, isStudent }: { summary: Summary; isStudent: boolean }) {
  const { walls, next, done, projected, hourly, rulesYear } = summary
  const ageNote = walls.some((w) => w.applies === 'student19to22') ? '19〜22歳' : '23歳以上など'

  return (
    <div className="screen">
      <header className="screen-head">
        <div className="eyebrow">
          {rulesYear}年分ルール・{isStudent ? '学生' : '一般'}（{ageNote}）
        </div>
        <h1>年収の壁</h1>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <span>現在の累計</span>
          <b className="num">{yen(done.wage)}</b>
        </div>
        <div className="stat">
          <span>年末見込み</span>
          <b className="num">{yen(projected.taxable)}</b>
        </div>
      </div>

      <ol className="wall-list" aria-label="壁の一覧">
        {walls.map((w) => {
          const isNext = next?.id === w.id
          const state = w.crossed ? 'crossed' : isNext ? 'next' : ''
          return (
            <li key={w.id} className={`wall ${state}`}>
              <div className="row-between">
                <div className="row baseline gap-8">
                  <span className="wall-amount num">{man(w.amount)}</span>
                  <b>{w.label}</b>
                </div>
                <span className={`who ${w.target}`}>{w.target === 'self' ? '自分' : '親'}</span>
              </div>
              <div className="meter" role="img" aria-label={`${Math.round(w.progress * 100)}%`}>
                <div style={{ width: `${w.progress * 100}%` }} />
              </div>
              <div className="row-between small wrap gap-8">
                {w.crossed ? (
                  <span className="strong">超えています（{yen(-w.remaining)} 超過）</span>
                ) : (
                  <span>
                    あと <b className="num">{yen(w.remaining)}</b>
                    {hourly > 0 && <>（約{hours(Math.floor(w.remaining / hourly) * 60)}）</>}
                  </span>
                )}
                {!w.crossed && w.willCross && <span className="strong">年末に超える見込み</span>}
                {isNext && !w.willCross && <span className="strong">いちばん近い壁</span>}
              </div>
              <p className="wall-note">
                {w.note}
                {w.basis === 'gross' && '（交通費を含めて判定）'}
              </p>
            </li>
          )
        })}
      </ol>
      <p className="fineprint">
        金額は給与収入のみの場合の目安です。税金の壁は交通費を除き、健康保険の扶養は交通費を含めて判定します。年齢区分は設定から変えられます。
      </p>
    </div>
  )
}
