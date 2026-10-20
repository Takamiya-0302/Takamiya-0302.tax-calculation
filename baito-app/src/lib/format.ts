export const yen = (n: number) => '¥' + Math.round(n).toLocaleString('ja-JP')
export const man = (n: number) => {
  const v = n / 10_000
  return (Number.isInteger(v) ? v.toString() : v.toFixed(1)) + '万'
}
export const hours = (min: number) => {
  const h = min / 60
  return (Number.isInteger(h) ? h.toString() : h.toFixed(1)) + '時間'
}
export const pad = (n: number) => String(n).padStart(2, '0')
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const WEEK = ['日', '月', '火', '水', '木', '金', '土']
export const jpDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${m}月${d}日（${WEEK[dt.getDay()]}）`
}
