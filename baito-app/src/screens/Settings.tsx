import { useRef, useState } from 'react'
import { PlusIcon } from '../components/Icons'
import { newId, normalize, type Store } from '../lib/store'
import type { AppData } from '../lib/types'
import { toISODate } from '../lib/format'

export function Settings({ store }: { store: Store }) {
  const { data, upsertWorkplace, deleteWorkplace, updateSettings, replaceAll } = store
  const s = data.settings
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [armed, setArmed] = useState<string | null>(null)
  const [pending, setPending] = useState<AppData | null>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `baito-backup-${toISODate(new Date())}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('バックアップを書き出しました')
  }

  const importJson = async (file: File) => {
    try {
      setPending(normalize(JSON.parse(await file.text())))
      setMessage('')
    } catch {
      setMessage('ファイルを読み込めませんでした')
    }
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <div className="eyebrow">設定</div>
        <h1>バイト先と設定</h1>
      </header>

      <section className="stack">
        <h2 className="section-title">バイト先</h2>
        {data.workplaces.map((w, i) => (
          <div className="form-card" key={w.id}>
            <label className="form-row">
              名前
              <input value={w.name} onChange={(e) => upsertWorkplace({ ...w, name: e.target.value })} />
            </label>
            <label className="form-row">
              時給（円）
              <input
                type="number"
                inputMode="numeric"
                className="num"
                min={0}
                value={w.hourly}
                onChange={(e) => upsertWorkplace({ ...w, hourly: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            <label className="form-row">
              交通費／回（円）
              <input
                type="number"
                inputMode="numeric"
                className="num"
                min={0}
                value={w.transport}
                onChange={(e) => upsertWorkplace({ ...w, transport: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            <div className="form-row">
              <span className="muted small">{i === 0 ? '「あと何時間」の計算に使うメインのバイト先' : ''}</span>
              <button
                className="link-btn danger"
                onClick={() => {
                  if (armed === w.id) {
                    deleteWorkplace(w.id)
                    setArmed(null)
                  } else setArmed(w.id)
                }}
              >
                {armed === w.id
                  ? `シフト${data.shifts.filter((x) => x.workplaceId === w.id).length}件ごと削除`
                  : '削除'}
              </button>
            </div>
          </div>
        ))}
        <button
          className="secondary-btn"
          onClick={() => upsertWorkplace({ id: newId(), name: data.workplaces.length ? `バイト先${data.workplaces.length + 1}` : 'バイト先', hourly: 1100, transport: 0 })}
        >
          <PlusIcon width={18} height={18} />
          バイト先を追加
        </button>
      </section>

      <section className="stack">
        <h2 className="section-title">あなたについて</h2>
        <div className="form-card">
          <label className="form-row">
            年齢（12月31日時点）
            <select value={s.ageGroup} onChange={(e) => updateSettings({ ageGroup: e.target.value as typeof s.ageGroup })}>
              <option value="student19to22">19〜22歳</option>
              <option value="other">それ以外</option>
            </select>
          </label>
          <label className="form-row">
            学生（勤労学生控除）
            <input type="checkbox" className="switch" checked={s.isStudent} onChange={(e) => updateSettings({ isStudent: e.target.checked })} />
          </label>
        </div>
      </section>

      <section className="stack">
        <h2 className="section-title">社会保険料率（本人負担・%）</h2>
        <div className="form-card">
          {(
            [
              ['healthRate', '健康保険'],
              ['pensionRate', '厚生年金'],
              ['employmentRate', '雇用保険'],
            ] as const
          ).map(([k, label]) => (
            <label className="form-row" key={k}>
              {label}
              <input
                type="number"
                inputMode="decimal"
                step={0.01}
                min={0}
                className="num"
                value={s[k]}
                onChange={(e) => updateSettings({ [k]: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
          ))}
        </div>
        <p className="fineprint">「税金」タブの「社会保険あり」で使います。健康保険の率は加入している保険や都道府県で変わるので、給与明細に合わせて変えてください。</p>
      </section>

      <section className="stack">
        <h2 className="section-title">バックアップ</h2>
        <p className="fineprint">データはこのiPhoneの中だけに保存されます。機種変更やSafariのデータ削除に備えて、ときどき書き出しておきましょう。</p>
        <div className="row gap-10">
          <button className="secondary-btn grow" onClick={exportJson}>書き出す</button>
          <button className="secondary-btn grow" onClick={() => fileRef.current?.click()}>読み込む</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importJson(f)
            e.target.value = ''
          }}
        />
        {pending && (
          <div className="notice warn stack-4" role="alert">
            <b>
              バイト先{pending.workplaces.length}件・シフト{pending.shifts.length}件で、今のデータを置き換えます。
            </b>
            <div className="row gap-10">
              <button
                className="secondary-btn grow"
                onClick={() => {
                  replaceAll(pending)
                  setPending(null)
                  setMessage('バックアップを読み込みました')
                }}
              >
                置き換える
              </button>
              <button className="secondary-btn grow" onClick={() => setPending(null)}>
                やめる
              </button>
            </div>
          </div>
        )}
        {message && (
          <p className="muted small" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  )
}
