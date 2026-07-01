"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipContentProps,
  Sector,
} from "recharts";

export interface SeriesConfig {
  dataKey: string;
  name?: string;
  color: string;
  fill?: string;
  type?: "line" | "bar" | "area";
  stackId?: string;
  dot?: boolean;
  barSize?: number;
  strokeWidth?: number;
  radius?: [number, number, number, number];
  domain?: [number, number];
}

export interface ChartConfig {
  type: "line" | "bar" | "area" | "composed" | "pie" | "stacked_area";
  data: Record<string, any>[];
  xAxisKey: string;
  series: SeriesConfig[];
  yDomain?: [number, number];
  xTickInterval?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  legendIconType?: "circle" | "rect" | "line";
  legendHeight?: number;
  className?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipContentProps<any, any>) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-white p-2 shadow-xs text-[10px] min-w-[120px] pointer-events-none">
      <p className="font-semibold mb-1 text-foreground">{label}</p>
      <div>
        {payload.map((entry, index) => (
          <div key={`${entry.dataKey || entry.name}-${index}`} className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <span
                className="inline-block w-1 h-1 rounded-full ring-0.5 ring-background"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium text-foreground">
              {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function renderSeries(series: SeriesConfig[], chartType: string) {
  return series.map((s) => {
    const commonProps = {
      dataKey: s.dataKey,
      name: s.name || s.dataKey,
      stroke: s.color,
      strokeWidth: s.strokeWidth ?? (chartType === "composed" && s.type === "line" ? 2 : 1),
      dot: s.dot
        ? { r: 3, fill: s.color, stroke: "#fff", strokeWidth: 1 }
        : false,
    };

    if (chartType === "composed") {
      if (s.type === "bar") {
        return (
          <Bar
            key={s.dataKey}
            {...commonProps}
            fill={s.fill || s.color}
            barSize={s.barSize || 12}
            radius={s.radius || [2, 2, 0, 0]}
          />
        );
      }
      return (
        <Line
          key={s.dataKey}
          {...commonProps}
          type="monotone"
          fill={s.fill}
        />
      );
    }

    if (chartType === "area") {
      return (
        <Area
          key={s.dataKey}
          type="monotone"
          {...commonProps}
          fill={s.fill || s.color}
          stackId={s.stackId || "1"}
        />
      );
    }

    if (chartType === "bar") {
      return (
        <Bar
          key={s.dataKey}
          {...commonProps}
          fill={s.fill || s.color}
          barSize={s.barSize || 12}
          radius={s.radius || [2, 2, 0, 0]}
        />
      );
    }

    // line
    return <Line key={s.dataKey} type="monotone" {...commonProps} fill={s.fill} />;
  });
}
export default function UniversalChart({ config }: { config: ChartConfig }) {
  const {
    type,
    data,
    xAxisKey,
    series,
    yDomain,
    xTickInterval,
    showLegend = true,
    showGrid = true,
    legendIconType = "circle",
    legendHeight = 24,
  } = config;

  const commonElements = (
    <>
      {showGrid && (
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
      )}
      <XAxis
        dataKey={xAxisKey}
        tick={{ fontSize: 10, fill: "#6b7280" }}
        axisLine={false}
        tickLine={false}
        interval={"preserveStartEnd"}
      />
      {type !== "pie" && (
        <YAxis
          tick={{ fontSize: 10, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          domain={yDomain}
        />
      )}
      <Tooltip content={CustomTooltip} cursor={{ fill: "rgba(250, 250, 250, 0.9)" }} />
      {showLegend && (
        <Legend
          verticalAlign="bottom"
          height={legendHeight}
          iconType={legendIconType}
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
      )}
    </>
  );

  if (type === "pie") {
    const colors = ["#8B5CF6", "#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#EC4899", "#06B6D4"];
    let pieData = [];

    // If we have one series and multiple rows, it's likely categorical (one slice per row)
    if (series.length === 1 && data.length > 1) {
      const dataKey = series[0].dataKey;
      pieData = data.map((d, i) => ({
        name: String(d[xAxisKey] || d.name || d.label || d.category || Object.values(d).find(v => typeof v === 'string') || `Slice ${i}`),
        value: Number(d[dataKey]) || 0,
        color: colors[i % colors.length]
      }));
    } else {
      // If we have multiple series, each series is a slice (summed over all rows)
      pieData = series.map((s, i) => ({
        name: s.name || s.dataKey,
        value: data.reduce((sum, d) => sum + (Number(d[s.dataKey]) || 0), 0),
        color: s.color || colors[i % colors.length],
      }));
    }
    const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
      return null;
    }
    // For pie chart: innerRadius is 0, so we position label at ~60% of radius
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const ncx = Number(cx);
    const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const ncy = Number(cy);
    const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        dominantBaseline="central"
        fontSize={10}
        fontWeight={500}
      >
        {`${((percent ?? 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom shape component for applying dynamic colors
  const MyCustomPie = (props: any) => {
    const entry = pieData[props.index];
    return <Sector {...props} fill={entry?.color || colors[props.index % colors.length]} />;
  };

    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Tooltip content={CustomTooltip} />
            <Legend
              verticalAlign="bottom"
              height={legendHeight}
              iconType={legendIconType}
              iconSize={14}
              wrapperStyle={{ fontSize: 10 }}
            />
            <Pie
              data={pieData}
              // cx="50%"
              // cy="50%"
              // innerRadius="40%"
              outerRadius="75%"
              dataKey="value"
              nameKey="name"
              paddingAngle={0}
              label={renderCustomizedLabel}
              labelLine={false}
              shape={MyCustomPie}
              isAnimationActive={true}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "composed") {
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            {commonElements}
            {renderSeries(series, type)}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "stacked_area") {
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            {commonElements}
            {renderSeries(series, "area")}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "area") {
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            {commonElements}
            {renderSeries(series, type)}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            {commonElements}
            {renderSeries(series, type)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // line (default)
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          {commonElements}
          {renderSeries(series, type)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
