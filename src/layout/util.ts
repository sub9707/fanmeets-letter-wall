export const round = (v: number) => Math.round(v * 10) / 10
export const round3 = (v: number) => Math.round(v * 1000) / 1000

export function shuffled<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
