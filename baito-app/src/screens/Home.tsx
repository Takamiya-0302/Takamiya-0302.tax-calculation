import { AlertIcon, CheckIcon, GearIcon, PlusIcon } from '../components/Icons'
import { hours, man, yen } from '../lib/format'
import type { Summary } from '../lib/useSummary'

interface Props {
  summary: Summary
  hasWorkplace: boolean
  onAddShift: () => void
  onOpenWalls: () => void
  onOpenSettings: () => void
}

export function Home({ summary, hasWorkplace, onAddShift, onOpenWalls, onOpenSettings }: Props) {
  const { thisMonth: m, done, projected, walls, next, hourly, month, year } = summary
  const scaleMax = walls[walls.length - 1]?.amount ?? 1_780_000
  const pct = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`
  const premium = m.nightExtra + m.overtimeExtra

  return (
    <div className="screen">
      <header className="screen-head row-between">
        <div>
          <div className="eyebrow">{year}年 {month + 1}月</div>
          <h1>ホーム</h1>
        </div>
        <button className="icon-btn" aria-label="設定" onClick={onOpenSettings}>
          <GearIcon width={20} height={20} />
        </button>
      </header>

      {!hasWorkplace ? (
        <section className="card stack">
          <h2>はじめに</h2>
          <p className="muted">バイト先と時給を登録すると、シフトから給与と年収の壁を自動で計算します。</p>
          <button className="primary-btn" onClick={onOpenSettings}>バイト先を登録する</button>
        </section>
      ) : (
        <>
          <section className="hero">
            <div className="row-between">
              <span className="hero-label">今月の給与見込み</span>
              <span className="pill-dark">
                {m.shifts}日 / {hours(m.workedMin)}
              </span>
            </div>
            <div className="hero-amount num">{yen(m.total)}</div>
            <div className="hero-grid">
              <div>
                <span>基本</span>
                <b className="num">{yen(m.base)}</b>
              </div>
              <div>
                <span>深夜・残業割増</span>
                <b className="num">{yen(premium)}</b>
              </div>
              <div>
                <span>交通費</span>
                <b className="num">{yen(m.transport)}</b>
              </div>
            </div>
          </section>

          <section className="card stack">
            <div className="row-between baseline">
              <h2>今年の累計</h2>
              <button className="link-btn" onClick={onOpenWalls}>
                壁を見る →
              </button>
            </div>
            <div className="row baseline wrap gap-10">
              <span className="big-num num">{yen(done.wage)}</span>
              <span className="muted small">年末見込み {yen(projected.taxable)}</span>
            </div>
            <div className="wallbar" aria-hidden="true">
              <div className="wallbar-track" />
              <div className="wallbar-proj" style={{ left: pct(done.wage), width: `calc(${pct(projected.taxable)} - ${pct(done.wage)})` }} />
              <div className="wallbar-fill" style={{ width: pct(done.wage) }} />
              {walls.map((w) => (
                <div key={w.id} className={`wallbar-mark ${next?.id === w.id ? 'is-next' : ''}`} style={{ left: pct(w.amount) }} />
              ))}
            </div>
            <div className="wallbar-labels">
              {/* ラベルが重ならないよう、次の壁と右端だけ表示する */}
              {walls
                .filter((w, i) => next?.id === w.id || i === walls.length - 1)
                .map((w) => (
                  <span key={w.id} className={next?.id === w.id ? 'is-next' : ''} style={{ left: pct(w.amount) }}>
                    {man(w.amount)}
                  </span>
                ))}
            </div>
            <p className="muted small">税金の計算に使う額（交通費を除く）</p>
          </section>

          {next ? (
            <section className={`notice ${next.willCross ? 'warn' : 'ok'}`}>
              {next.willCross ? <AlertIcon className="notice-icon" /> : <CheckIcon className="notice-icon" />}
              <div className="stack-4">
                <b>
                  {next.label}（{man(next.amount)}円）まで あと {yen(next.remaining)}
                </b>
                <span>
                  {hourly > 0 && <>時給{hourly.toLocaleString()}円で約{Math.floor(next.remaining / hourly)}時間。</>}
                  {next.willCross
                    ? `このペースだと年末に ${yen(next.projected - next.amount)} 超える見込みです。`
                    : `このペースだと年末は ${yen(next.amount - next.projected)} の余裕です。`}
                </span>
              </div>
            </section>
          ) : (
            <section className="notice warn">
              <AlertIcon className="notice-icon" />
              <b>すべての壁を超えています。税金タブで手取りを確認しましょう。</b>
            </section>
          )}

          <button className="primary-btn" onClick={onAddShift}>
            <PlusIcon width={20} height={20} />
            シフトを追加
          </button>
        </>
      )}
    </div>
  )
}
