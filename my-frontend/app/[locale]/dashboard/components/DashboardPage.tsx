"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { CalendarDays, RefreshCw, Calendar } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ChatChartRenderer } from "../../chat/components/ChatChartRenderer";
import { WidgetLayout } from "./WidgetLayout";
import { useDashboardWidgets } from "@/hooks/use-dashboard-widgets";
import { useProjectStore } from "@/store/useProjectStore";

const ROW_HEIGHT = 120;
const MARGIN: [number, number] = [16, 16];

interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

type Layouts = Record<string, GridItem[]>;

type SupportedChartType =
  | "line"
  | "bar"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "radar"
  | "geo"
  | "geo_map"
  | "bubble_map"
  | "choropleth_map"
  | "heatmap"
  | "table"
  | "composed"
  | "kpi"
  | "kpi_grid"
  | "stat_cards";

type DatasetRecord = Record<string, unknown>;

interface VisualizationDataset {
  dataset_id: string;
  name: string;
  description: string;
  schema: {
    x_key: string | null;
    y_keys: string[];
    category_keys: string[];
    value_keys: string[];
    label_keys: string[];
    date_keys: string[];
    coordinate_key?: string | null;
    latitude_key?: string | null;
    longitude_key?: string | null;
    geojson_url?: string | null;
  }; records: DatasetRecord[];
}

interface VisualizationDef {
  viz_id: string;
  title: string;
  chart_type: SupportedChartType | string;
  purpose: string;
  dataset_id: string;
  x_key: string | null;
  y_keys: string[];
  series: string[];
  stacked: boolean;
  recharts_hint: string;
  insight: string;
  geo_key?: string | null;
  coordinate_key?: string | null;
  geojson_url?: string | null;
  messageId?: string;
}

interface VisualizationResponse {
  summary: string;
  detected_input_type: string;
  confidence: number;
  analysis: string;
  key_insights: string[];
  warnings: string[];
  needs_clarification: boolean;
  clarification_questions: string[];
  datasets: VisualizationDataset[];
  visualizations: VisualizationDef[];
}

interface WidgetDef {
  i: string;
  type: "kpi" | "widget";
  title: string;
  description?: string;
  render: () => React.ReactNode;
  default: { x: number; y: number; w: number; h: number };
  min?: { w: number; h: number };
  max?: { w: number; h: number };
  messageId?: string;
}

function NoDataState({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-md p-4 text-center">
      {message}
    </div>
  );
}

function buildWidgetDefs(payload: VisualizationResponse, t: (key: string) => string): WidgetDef[] {
  const datasetMap = new Map(payload.datasets.map((dataset) => [dataset.dataset_id, dataset]));

  return payload.visualizations.map((viz, index) => {
    const dataset = datasetMap.get(viz.dataset_id);
    const isKpi = ['kpi', 'kpi_grid', 'stat_cards'].includes(viz.chart_type);
    const numRecords = dataset?.records?.length || 1;

    // Default size calculation: 2 rows (240px) per record so they default to large
    const kpiHeight = Math.max(2, Math.min(numRecords * 2, 8));
    const defaultHeight = viz.chart_type === "table" ? 4 : isKpi ? kpiHeight : 3;

    const render = () => {
      if (!dataset) return <NoDataState message={t("datasetNotFound")} />;
      if (!dataset.records.length) return <NoDataState message={t("noRecords")} />;
      return <ChatChartRenderer viz={viz} data={dataset.records} isDashboard />;
    };

    return {
      i: viz.viz_id || `viz-${index}`,
      type: isKpi ? "kpi" : "widget",
      title: viz.title,
      description: viz.insight || viz.purpose || undefined,
      render,
      default: { x: index % 3, y: Math.floor(index / 3) + (isKpi ? 0 : 1), w: 1, h: defaultHeight },
      min: { w: 1, h: 3 },
      max: { w: 3, h: 12 },
      messageId: viz.messageId,
    };
  });
}

const BREAKPOINTS = { lg: 1022, md: 768, sm: 375, xs: 0, };
const COLS = { lg: 3, md: 2, sm: 1, xs: 1, };

function generateLayouts(widgets: WidgetDef[]): Layouts {
  const toItem = (w: WidgetDef, x: number, y: number, bpCols: number): GridItem => ({
    i: w.i,
    x,
    y,
    w: Math.min(w.default.w, bpCols),
    h: w.default.h,
    minW: w.min?.w,
    minH: w.min?.h,
    maxW: Math.min(w.max?.w || bpCols, bpCols),
    maxH: w.max?.h,
  });

  const lg = widgets.map((w) => toItem(w, w.default.x, w.default.y, 3));

  let y = 0;
  const singleCol = widgets.map((w) => {
    const item = toItem(w, 0, y, 1);
    y += w.default.h;
    return item;
  });

  return { lg, md: singleCol, sm: singleCol, xs: singleCol, xxs: singleCol };
}

function DashboardPageContent() {
  const t = useTranslations("Dashboard");
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  // const searchParams = useSearchParams();
  const { currentSession } = useProjectStore();
  const router = useRouter();

  const { widgetsData, isLoading, error, deleteWidget } = useDashboardWidgets();

  const handleWidgetClick = useCallback(() => {
    router.push("/chat");
  }, [router]);

  const convertedPayload = useMemo(() => {
    if (!widgetsData?.data) {
      return {
        summary: "",
        detected_input_type: "dashboard",
        confidence: 0,
        analysis: "",
        key_insights: [],
        warnings: [],
        needs_clarification: false,
        clarification_questions: [],
        datasets: [],
        visualizations: [],
      };
    }

    const visualizations = widgetsData.data.map((widget) => ({
      viz_id: widget._id,
      title: widget.visualizationJSON.chartTitle,
      chart_type: widget.visualizationJSON.chartType,
      purpose: "",
      dataset_id: `dataset-${widget._id}`,
      x_key: widget.visualizationJSON.xKey,
      y_keys: widget.visualizationJSON.yKeys,
      series: widget.visualizationJSON.yKeys,
      stacked: widget.visualizationJSON.chartType === "stacked_area",
      recharts_hint: "",
      insight: "",
      messageId: widget._id
    }));

    const datasets = widgetsData.data.map((widget) => ({
      dataset_id: `dataset-${widget._id}`,
      name: widget.visualizationJSON.chartTitle,
      description: "",
      schema: {
        x_key: widget.visualizationJSON.xKey,
        y_keys: widget.visualizationJSON.yKeys,
        category_keys: [],
        value_keys: widget.visualizationJSON.yKeys,
        label_keys: [],
        date_keys: [],
      },
      records: widget.visualizationJSON.data,
    }));

    return {
      summary: "Dashboard widgets loaded from backend",
      detected_input_type: "dashboard",
      confidence: 1,
      analysis: "",
      key_insights: [],
      warnings: [],
      needs_clarification: false,
      clarification_questions: [],
      datasets,
      visualizations,
    };
  }, [widgetsData]);

  const widgetDefs = useMemo(() => (convertedPayload ? buildWidgetDefs(convertedPayload, t) : []), [convertedPayload, t]);
  const [layouts, setLayouts] = useState<Layouts | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogWidgetId, setDialogWidgetId] = useState<string | null>(null);
  const activeLayouts = useMemo(() => layouts ?? generateLayouts(widgetDefs), [layouts, widgetDefs]);

  useEffect(() => {
    setLayouts(null);
  }, [currentSession?._id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen]);

  const visibleWidgets = useMemo(() => {
    const ids = new Set(activeLayouts.lg.map((item) => item.i));
    return widgetDefs.filter((w) => ids.has(w.i));
  }, [activeLayouts, widgetDefs]);

  const dialogWidget = useMemo(
    () => widgetDefs.find((w) => w.i === dialogWidgetId) ?? null,
    [dialogWidgetId, widgetDefs]
  );

  const handleMaximize = useCallback((id: string) => {
    setDialogWidgetId(id);
    setDialogOpen(true);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      const widget = widgetDefs.find(w => w.i === id);
      if (widget?.messageId) {
        deleteWidget({ messageId: widget.messageId });
      }

      setLayouts((prev) => {
        const currentLayouts = prev ?? generateLayouts(widgetDefs);
        const next: Layouts = {};
        for (const bp of Object.keys(currentLayouts)) {
          next[bp] = currentLayouts[bp].filter((item) => item.i !== id);
        }
        return next;
      });
    },
    [deleteWidget, widgetDefs]
  );

  return (
    <div className="min-h-[90dvh] border border-border rounded-xl p-3 mb-2 bg-[#FAFAFA]">
      <div id="tour-dashboard-header" className="mb-4">
        <div className="relative overflow-hidden p-6 rounded-xl" style={{ background: 'linear-gradient(270.26deg, rgb(157, 107, 255) 0%, rgb(111, 77, 200) 18.34%, rgb(53, 45, 140) 71.63%, rgb(32, 1, 52) 100.37%)' }}>
          <div className="absolute pointer-events-none" style={{ width: '320px', height: '100%', transform: 'rotate(40deg)', background: 'rgb(255, 0, 166)', filter: 'blur(50px)', top: '0%', bottom: '0%', right: '20%', borderRadius: '50%' }}></div>
          <div className="relative z-10">
            <div className="relative z-10 flex flex-col gap-2">
              <h1 className="text-white text-2xl font-semibold">{t("cockpit")}</h1>
              <p className="text-white/90">
                {t("cockpitDescription")}
              </p>
              <p className="text-white/70 flex text-xs items-center gap-2">
                <Calendar size={16} />
                Last Updated on {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error.message}</div>
      ) : null}

      <div ref={containerRef}>
        {!isLoading && visibleWidgets.length > 0 && (
          <Responsive
            className="layout"
            layouts={activeLayouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            width={width}
            margin={MARGIN}
            containerPadding={[0, 0]}
            onLayoutChange={(_currentLayout, allLayouts) => setLayouts(allLayouts as Layouts)}
            onResizeStart={(_layout, _oldItem, newItem) => setResizingId(newItem!.i)}
            onResizeStop={() => setResizingId(null)}
          >
            {visibleWidgets.map((w, index) => (
              <div
                key={w.i}
                id={index === 0 ? "tour-dashboard-widget-0" : undefined}
                className={
                  "rounded-xl overflow-hidden transition-colors duration-150 flex flex-col " +
                  (resizingId === w.i ? "bg-red-50 border-red-300 border" : "bg-transparent")
                }
              >
                <WidgetLayout
                  title={w.title}
                  description={w.description}
                  isResizing={resizingId === w.i}
                  isMaximized={dialogOpen && dialogWidgetId === w.i}
                  onMaximize={() => handleMaximize(w.i)}
                  onRemove={() => handleRemove(w.i)}
                  onClick={handleWidgetClick}
                >
                  {w.render()}
                </WidgetLayout>
              </div>
            ))}
          </Responsive>
        )}

        {!isLoading && !error && !visibleWidgets.length ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("noVisualizations")}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : null}
      </div>

      {dialogOpen && dialogWidget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="w-full max-w-[90vw] h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col p-0 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col [&>div]:flex-1 [&>div]:h-full">
              <WidgetLayout
                title={dialogWidget.title}
                description={dialogWidget.description}
                isMaximized={true}
                onMaximize={() => setDialogOpen(false)}
                onRemove={() => {
                  handleRemove(dialogWidget.i);
                  setDialogOpen(false);
                }}
              >
                {dialogWidget.render()}
              </WidgetLayout>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { currentSession } = useProjectStore();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin" />
      </div>
    }>
      <DashboardPageContent key={currentSession?._id} />
    </Suspense>
  );
}