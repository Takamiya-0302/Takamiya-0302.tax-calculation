import { useEffect, useState } from 'react'
import { CalcIcon, CalendarIcon, ChartIcon, GearIcon, HomeIcon } from './components/Icons'
import { toISODate } from './lib/format'
import { newId, useAppData } from './lib/store'
import type { Shift } from './lib/types'
import { useSummary } from './lib/useSummary'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'
import { ShiftEditor } from './screens/ShiftEditor'
import { Shifts } from './screens/Shifts'
import { Tax } from './screens/Tax'
import { Walls } from './screens/Walls'

type Tab = 'home' | 'shifts' | 'walls' | 'tax' | 'settings'

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'ホーム', Icon: HomeIcon },
  { id: 'shifts', label: 'シフト', Icon: CalendarIcon },
  { id: 'walls', label: '年収の壁', Icon: ChartIcon },
  { id: 'tax', label: '税金', Icon: CalcIcon },
  { id: 'settings', label: '設定', Icon: GearIcon },
]

export default function App() {
  const store = useAppData()
  const { data } = store
  const [today] = useState(() => new Date())
  const summary = useSummary(data, today)
  const [tab, setTab] = useState<Tab>('home')
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [editor, setEditor] = useState<{ shift: Shift | null } | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  const openNew = () => {
    if (data.workplaces.length === 0) {
      setTab('settings')
      return
    }
    setEditor({ shift: null })
  }
  const lastShift = [...data.shifts].sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))[0]
  const thisYm = ym.y === today.getFullYear() && ym.m === today.getMonth()
  const defaultDate = thisYm ? toISODate(today) : `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-01`

  return (
    <div className="app">
      {store.saveError && <div className="banner">保存できませんでした。プライベートブラウズでは保存されません。</div>}
      <main>
        {tab === 'home' && (
          <Home
            summary={summary}
            hasWorkplace={data.workplaces.length > 0}
            onAddShift={openNew}
            onOpenWalls={() => setTab('walls')}
            onOpenSettings={() => setTab('settings')}
          />
        )}
        {tab === 'shifts' && (
          <Shifts shifts={data.shifts} workplaces={data.workplaces} ym={ym} onChangeMonth={setYm} onAdd={openNew} onEdit={(s) => setEditor({ shift: s })} />
        )}
        {tab === 'walls' && <Walls summary={summary} isStudent={data.settings.isStudent} />}
        {tab === 'tax' && <Tax settings={data.settings} projectedIncome={summary.projected.taxable} />}
        {tab === 'settings' && <Settings store={store} />}
      </main>

      <nav className="tabbar" aria-label="メイン">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'is-active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {editor && (
        <ShiftEditor
          initial={editor.shift}
          defaultDate={defaultDate}
          workplaces={data.workplaces}
          lastShift={lastShift}
          onClose={() => setEditor(null)}
          onSave={(s) => {
            store.upsertShift(s)
            setEditor(null)
            setYm({ y: Number(s.date.slice(0, 4)), m: Number(s.date.slice(5, 7)) - 1 })
          }}
          onDelete={(id) => {
            store.deleteShift(id)
            setEditor(null)
          }}
          onAddWorkplace={() => {
            store.upsertWorkplace({ id: newId(), name: `バイト先${data.workplaces.length + 1}`, hourly: 1100, transport: 0 })
            setEditor(null)
            setTab('settings')
          }}
        />
      )}
    </div>
  )
}
