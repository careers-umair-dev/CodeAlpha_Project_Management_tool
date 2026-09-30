import React from 'react';

// Lightweight, dependency-free horizontal bar breakdown used on the dashboard
// for status/priority distributions. Avoids pulling in a charting library
// for what is fundamentally a handful of proportional bars.
const MiniBarChart = ({ data, colors, total }) => {
  const max = total || data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = max > 0 ? Math.round((d.count / max) * 100) : 0;
        return (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-ink-600">{d.label}</span>
              <span className="text-ink-400">{d.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: colors[d.label] || '#5B6B80' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MiniBarChart;
