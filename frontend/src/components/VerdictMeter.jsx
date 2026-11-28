const VERDICT_META = [
  { key: 'skip', label: 'Pass', color: '#f43f5e', barClass: 'bg-rose-500', textClass: 'text-rose-400' },
  { key: 'casual', label: 'Casual', color: '#f59e0b', barClass: 'bg-amber-500', textClass: 'text-amber-400' },
  { key: 'recommended', label: 'Worth It', color: '#10b981', barClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
  { key: 'masterpiece', label: 'Masterpiece', color: '#8b5cf6', barClass: 'bg-violet-500', textClass: 'text-violet-400' },
];

export function VerdictMeter({ verdictCounts = {}, totalVotes = 0 }) {
  const breakdown = VERDICT_META.map((tier) => {
    const count = verdictCounts[tier.key] || 0;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return { ...tier, count, pct };
  });

  const leading =
    totalVotes > 0
      ? breakdown.reduce((best, curr) => (curr.count > best.count ? curr : best), breakdown[0])
      : null;

  // Semi-circle SVG arc math (radius 70, circumference of half circle = pi * 70 ≈ 219.91)
  const radius = 70;
  const halfCircumference = Math.PI * radius;
  let cumulativeRatio = 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Semi-circular gauge */}
        <div className="flex flex-col items-center">
          <div className="relative h-28 w-48">
            <svg viewBox="0 0 180 100" className="h-full w-full overflow-visible">
              <path
                d="M 20 90 A 70 70 0 0 1 160 90"
                fill="none"
                stroke="#27272a"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {totalVotes > 0 &&
                breakdown.map((tier) => {
                  const ratio = tier.count / totalVotes;
                  if (ratio <= 0) return null;
                  const segLength = ratio * halfCircumference;
                  const offset = -cumulativeRatio * halfCircumference;
                  cumulativeRatio += ratio;
                  return (
                    <path
                      key={tier.key}
                      d="M 20 90 A 70 70 0 0 1 160 90"
                      fill="none"
                      stroke={tier.color}
                      strokeWidth="14"
                      strokeDasharray={`${segLength} ${halfCircumference}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
            </svg>
            <div className="absolute inset-x-0 bottom-1 text-center">
              <div className="text-2xl font-bold text-white">
                {leading ? `${leading.pct}%` : '—'}
              </div>
              <div className={`text-xs font-semibold ${leading ? leading.textClass : 'text-zinc-400'}`}>
                {leading ? leading.label : 'No votes yet'}
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {totalVotes} {totalVotes === 1 ? 'verdict' : 'verdicts'} on Cinephiles
          </p>
        </div>

        {/* Tier breakdown bars */}
        <div className="flex-1 space-y-2.5">
          {breakdown.map((tier) => (
            <div key={tier.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${tier.textClass}`}>{tier.label}</span>
                <span className="text-zinc-400">
                  {tier.pct}% ({tier.count})
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${tier.barClass}`}
                  style={{ width: `${tier.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
