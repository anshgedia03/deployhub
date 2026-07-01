import { z } from 'zod';

/*
|--------------------------------------------------------------------------
| CHART TYPES
|--------------------------------------------------------------------------
*/

export const chartTypeEnum = z.enum([
  'line',
  'bar',
  'area',
  'pie',
  'donut',
  'scatter',
  'radar',
  'table',
  'composed',
  'kpi',

  'stacked_bar',
  'stacked_area',
  'multi_line',
  'heatmap',

  'geo_map',
  'bubble_map',
  'choropleth_map',

  'kpi_grid',
  'stat_cards',
]);

/*
|--------------------------------------------------------------------------
| DATASET SCHEMA
|--------------------------------------------------------------------------
*/

const datasetSchema = z.object({
  dataset_id: z.string(),

  name: z.string(),

  description: z.string(),

  schema: z.object({
    /*
     |-----------------------------------------------------------------------
     | STANDARD
     |-----------------------------------------------------------------------
     */

    x_key: z.string().nullable(),

    y_keys: z.array(z.string()),

    category_keys: z.array(z.string()),

    value_keys: z.array(z.string()),

    label_keys: z.array(z.string()),

    date_keys: z.array(z.string()),

    /*
     |-----------------------------------------------------------------------
     | GEO
     |-----------------------------------------------------------------------
     */

    coordinate_key: z.string().nullable(),

    latitude_key: z.string().nullable(),

    longitude_key: z.string().nullable(),

    country_key: z.string().nullable(),

    geojson_url: z.string().nullable(),

    /*
     |-----------------------------------------------------------------------
     | KPI
     |-----------------------------------------------------------------------
     */

    metric_keys: z.array(z.string()),

    delta_keys: z.array(z.string()),
  }),

  records: z.array(z.record(z.string(), z.any())),
});

/*
|--------------------------------------------------------------------------
| VISUALIZATION SCHEMA
|--------------------------------------------------------------------------
*/

const visualizationSchema = z.object({
  viz_id: z.string(),

  title: z.string(),

  chart_type: chartTypeEnum,

  purpose: z.string(),

  dataset_id: z.string(),

  /*
   |------------------------------------------------------------------------
   | STANDARD CHARTS
   |------------------------------------------------------------------------
   */

  x_key: z.string().nullable(),

  y_keys: z.array(z.string()),

  series: z.array(z.string()),

  stacked: z.boolean(),

  /*
   |------------------------------------------------------------------------
   | GEO
   |------------------------------------------------------------------------
   */

  geo_key: z.string().nullable(),

  coordinate_key: z.string().nullable(),

  latitude_key: z.string().nullable(),

  longitude_key: z.string().nullable(),

  size_key: z.string().nullable(),

  color_key: z.string().nullable(),

  geojson_url: z.string().nullable(),

  /*
   |------------------------------------------------------------------------
   | KPI
   |------------------------------------------------------------------------
   */

  metric_key: z.string().nullable(),

  delta_key: z.string().nullable(),

  label_key: z.string().nullable(),

  icon_key: z.string().nullable(),

  /*
   |------------------------------------------------------------------------
   | FRONTEND
   |------------------------------------------------------------------------
   */

  recharts_hint: z.string(),

  insight: z.string(),
});

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

export const unifiedSchema = z.object({
  summary: z.string(),

  detected_input_type: z.enum([
    'numeric_summary',
    'time_series',
    'categorical_distribution',
    'comparison_table',
    'correlation',
    'hierarchical',
    'geospatial',
    'kpi_metrics',
    'mixed_dashboard',
    'text_insights',
    'mixed_dataset',
    'unknown',
  ]),

  confidence: z.number().min(0).max(1),

  analysis: z.string(),

  key_insights: z.array(z.string()),

  warnings: z.array(z.string()),

  needs_clarification: z.boolean(),

  clarification_questions: z.array(z.string()),

  /*
   |------------------------------------------------------------------------
   | VISUALIZATION SWITCH
   |------------------------------------------------------------------------
   */

  is_visualization: z.boolean(),

  /*
   |------------------------------------------------------------------------
   | DATASET
   |------------------------------------------------------------------------
   */

  dataset: datasetSchema.nullable(),

  /*
   |------------------------------------------------------------------------
   | VISUALIZATION
   |------------------------------------------------------------------------
   */

  visualization: visualizationSchema.nullable(),
});
