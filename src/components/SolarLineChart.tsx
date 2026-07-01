import React, { useState, useRef } from 'react';

interface ChartSeries {
  name: string;
  data: number[];
  color: string;
  dashed?: boolean;
  glow?: boolean;
  upperData?: number[]; // For uncertainty upper band
  lowerData?: number[]; // For uncertainty lower band
  bandColor?: string;  // Background color for uncertainty band
}

interface SolarLineChartProps {
  dataX: number[];
  series: ChartSeries[];
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export const SolarLineChart: React.FC<SolarLineChartProps> = ({
  dataX,
  series,
  height = 180,
  title,
  xLabel = 'Time',
  yLabel = 'Flux',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Pad the chart margins
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const width = 450; // Reference width for aspect ratio
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find min/max for scaling
  const xMin = Math.min(...dataX);
  const xMax = Math.max(...dataX);

  const allVals = series.flatMap((s) => [
    ...s.data,
    ...(s.upperData || []),
    ...(s.lowerData || []),
  ]);
  const yMinRaw = Math.min(...allVals, 0);
  const yMaxRaw = Math.max(...allVals, 1);
  const yMax = yMaxRaw * 1.1; // Add 10% breathing room
  const yMin = yMinRaw;

  const getX = (xVal: number) => {
    return paddingLeft + ((xVal - xMin) / (xMax - xMin || 1)) * chartWidth;
  };

  const getY = (yVal: number) => {
    return paddingTop + chartHeight - ((yVal - yMin) / (yMax - yMin || 1)) * chartHeight;
  };

  // Generate ticks
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];
  const xTicks = [xMin, (xMin + xMax) / 2, xMax];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - paddingLeft;
    
    // Convert relative mouseX back to indices
    const relativeX = mouseX / rect.width;
    const approxIndex = Math.round(relativeX * dataX.length);
    const index = Math.max(0, Math.min(dataX.length - 1, approxIndex));
    setHoverIndex(index);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col w-full h-full">
      {title && (
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>{title}</span>
          {hoverIndex !== null && (
            <span className="text-orange-400 font-mono text-[9px] lowercase">
              idx: {hoverIndex} | value: {series[0]?.data[hoverIndex]?.toFixed(2)}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-[140px] bg-slate-950/40 rounded border border-slate-900 overflow-hidden relative">
        <svg
          className="w-full h-full select-none"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Neon Glow Filter */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            stroke="#1e293b"
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight / 2}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight / 2}
            stroke="#1e293b"
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#334155"
            strokeWidth={1}
          />

          <line
            x1={paddingLeft + chartWidth / 2}
            y1={paddingTop}
            x2={paddingLeft + chartWidth / 2}
            y2={paddingTop + chartHeight}
            stroke="#1e293b"
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />

          {/* Uncertainty Bands (Rendered FIRST below lines) */}
          {series.map((s, idx) => {
            if (s.upperData && s.lowerData && s.upperData.length === dataX.length) {
              const points: string[] = [];
              for (let i = 0; i < dataX.length; i++) {
                points.push(`${getX(dataX[i])},${getY(s.upperData[i])}`);
              }
              for (let i = dataX.length - 1; i >= 0; i--) {
                points.push(`${getX(dataX[i])},${getY(s.lowerData[i])}`);
              }
              return (
                <polygon
                  key={`band-${idx}`}
                  points={points.join(' ')}
                  fill={s.bandColor || 'rgba(249, 115, 22, 0.1)'}
                  className="transition-all duration-300"
                />
              );
            }
            return null;
          })}

          {/* Series Lines */}
          {series.map((s, idx) => {
            const points = dataX
              .map((x, i) => `${getX(x)},${getY(s.data[i])}`)
              .join(' ');
            return (
              <polyline
                key={`line-${idx}`}
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={s.glow ? 2 : 1.5}
                strokeDasharray={s.dashed ? '3,3' : undefined}
                filter={s.glow ? 'url(#glow)' : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Y Axis Labels */}
          {yTicks.map((val, idx) => (
            <text
              key={`y-tick-${idx}`}
              x={paddingLeft - 6}
              y={getY(val) + 3}
              textAnchor="end"
              fill="#64748b"
              fontSize={7}
              className="font-mono"
            >
              {val.toFixed(1)}
            </text>
          ))}

          {/* X Axis Labels */}
          {xTicks.map((val, idx) => (
            <text
              key={`x-tick-${idx}`}
              x={getX(val)}
              y={paddingTop + chartHeight + 11}
              textAnchor="middle"
              fill="#64748b"
              fontSize={7}
              className="font-mono"
            >
              {val.toFixed(0)}m
            </text>
          ))}

          {/* Hover Crosshair Marker */}
          {hoverIndex !== null && (
            <>
              <line
                x1={getX(dataX[hoverIndex])}
                y1={paddingTop}
                x2={getX(dataX[hoverIndex])}
                y2={paddingTop + chartHeight}
                stroke="rgba(249, 115, 22, 0.4)"
                strokeWidth={0.75}
                strokeDasharray="1,1"
              />
              {series.map((s, idx) => (
                <circle
                  key={`hover-dot-${idx}`}
                  cx={getX(dataX[hoverIndex])}
                  cy={getY(s.data[hoverIndex])}
                  r={3}
                  fill={s.color}
                  stroke="#020617"
                  strokeWidth={1}
                />
              ))}
            </>
          )}
        </svg>
      </div>
      <div className="flex justify-between items-center mt-1 text-[8px] text-slate-500 font-mono">
        <span className="flex items-center gap-1.5 uppercase">
          {series.map((s, idx) => (
            <span key={idx} className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
        </span>
        <span className="uppercase">{xLabel}</span>
      </div>
    </div>
  );
};
