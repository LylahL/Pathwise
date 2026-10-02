export default function ReadinessRing({ score, size = 112 }: { score: number; size?: number }) {
  const r = (size - 12) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f4f4f5" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#4f46e5" strokeWidth={8} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center"><div className="tabular text-3xl font-semibold tracking-tight">{score}</div><div className="-mt-0.5 text-[10px] text-zinc-500">/ 100</div></div>
      </div>
    </div>
  )
}
