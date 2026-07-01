"use client";

import React from "react";
import { scaleLinear } from "d3-scale";

interface HeatmapProps {
  data: Record<string, any>[];
  xKey: string;
  yKeys: string[];
  colorRange?: [string, string];
}

export default function HeatmapChart({ data, xKey, yKeys, colorRange = ["#f8fafc", "#8b5cf6"] }: HeatmapProps) {
  const allValues = data.flatMap(d => yKeys.map(k => Number(d[k]) || 0));
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  
  const colorScale = scaleLinear<string>().domain([min, max]).range(colorRange);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="inline-grid gap-1" style={{ 
          gridTemplateColumns: `auto repeat(${data.length}, minmax(40px, 1fr))`,
          alignItems: 'center'
        }}>
          {/* Header */}
          <div />
          {data.map((d, i) => (
            <div key={`${d[xKey]}-${i}`} className="text-[10px] font-bold text-slate-500 text-center truncate px-1">
              {d[xKey]}
            </div>
          ))}

          {/* Rows */}
          {yKeys.map((key) => (
            <React.Fragment key={key}>
              <div className="text-[11px] font-bold text-slate-700 pr-2 whitespace-nowrap">
                {key}
              </div>
              {data.map((d, i) => {
                const val = Number(d[key]) || 0;
                return (
                  <div
                    key={`${key}-${d[xKey]}-${i}`}
                    className="h-10 rounded-sm group relative flex items-center justify-center transition-transform hover:scale-105"
                    style={{ backgroundColor: colorScale(val) }}
                  >
                    <span className="text-[9px] font-bold text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                      {val.toFixed(1)}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                      <div className="bg-slate-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                        {d[xKey]} - {key}: {val}
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
