interface SalesChartProps {
  data: { date: string; sales: number; label: string }[];
}

export function SalesChart({ data }: SalesChartProps) {
  const maxSales = Math.max(...data.map((d) => d.sales), 1);
  const width = 480;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - (d.sales / maxSales) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartH} L ${points[0]?.x ?? 0} ${padding.top + chartH} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5c59e8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5c59e8" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding.top + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-gray-400 text-[9px]">
                {Math.round(maxSales * pct)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#salesGradient)" />
        <path d={linePath} fill="none" stroke="#5c59e8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#5c59e8" stroke="white" strokeWidth="2" />
            <text x={p.x} y={height - 8} textAnchor="middle" className="fill-gray-500 text-[9px]">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
