
// Core
import * as echarts from 'echarts/core';

// All chart types from echarts/charts
import {
  BarChart, LineChart, PieChart, ScatterChart, 
  RadarChart, HeatmapChart, TreeChart, TreemapChart,
  SunburstChart, BoxplotChart, CandlestickChart,
  EffectScatterChart, GraphChart, GaugeChart,
  FunnelChart, SankeyChart, ThemeRiverChart,
  PictorialBarChart, ParallelChart, LinesChart
} from 'echarts/charts';

// Components
import {
  GridComponent, TooltipComponent, TitleComponent,
  LegendComponent, DataZoomComponent, ToolboxComponent,
  MarkLineComponent, MarkPointComponent, TimelineComponent,
  VisualMapComponent, PolarComponent, RadarComponent,
  GeoComponent, ParallelComponent, CalendarComponent,
  GraphicComponent, DatasetComponent, TransformComponent,
  SingleAxisComponent, AxisPointerComponent
} from 'echarts/components';

// Renderers
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

// Features
import { LabelLayout, UniversalTransition } from 'echarts/features';

// Register all
echarts.use([
  // Charts
  BarChart, LineChart, PieChart, ScatterChart,
  RadarChart, HeatmapChart, TreeChart, TreemapChart,
  SunburstChart, BoxplotChart, CandlestickChart,
  EffectScatterChart, GraphChart, GaugeChart,
  FunnelChart, SankeyChart, ThemeRiverChart,
  PictorialBarChart, ParallelChart, LinesChart,
  // Components
  GridComponent, TooltipComponent, TitleComponent,
  LegendComponent, DataZoomComponent, ToolboxComponent,
  MarkLineComponent, MarkPointComponent, TimelineComponent,
  VisualMapComponent, PolarComponent, RadarComponent,
  GeoComponent, ParallelComponent, CalendarComponent,
  GraphicComponent, DatasetComponent, TransformComponent,
  SingleAxisComponent, AxisPointerComponent,
  // Renderers & Features
  CanvasRenderer, SVGRenderer, LabelLayout, UniversalTransition
]);

export default echarts;
