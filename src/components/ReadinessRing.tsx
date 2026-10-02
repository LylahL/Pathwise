/** Circular score. Color carries meaning: emerald = ready, indigo = building, amber = early. */
export default function ReadinessRing({ score, size = 112 }: { score: number; size?: number }) {
  const r = (size - 12) / 2, c = 2 * Math.PI * r
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#4f46e5' : '#f59e0b'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Career readiness ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f6" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center"><div className="num text-3xl font-semibold leading-none tracking-tight text-zinc-900">{score}</div><div className="mt-0.5 text-[10px] text-zinc-400">out of 100</div></div>
      </div>
    </div>
  )
}
