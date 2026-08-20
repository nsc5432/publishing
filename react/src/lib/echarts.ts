/**
 * ECharts 공통 설정.
 *
 * echarts 전체를 그대로 들고 오면 번들이 크게 늘어나므로, 화면에서 실제로 쓰는
 * 차트/컴포넌트만 등록해서 쓴다. 새 차트 종류를 붙일 때 여기에 한 줄 추가하면 된다.
 *
 * 렌더러는 SVG 를 쓴다. 원본 퍼블리싱이 SVG/DOM 이라 글자가 또렷했는데,
 * 캔버스로 바꾸면 작은 축 라벨이 뭉개져 보인다.
 */
import * as echarts from 'echarts/core';
import { BarChart, CustomChart, GaugeChart, LineChart } from 'echarts/charts';
import {
    GraphicComponent,
    GridComponent,
    MarkLineComponent,
    MarkPointComponent,
    TooltipComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/lib/core';

echarts.use([
    BarChart,
    CustomChart,
    GaugeChart,
    LineChart,
    GraphicComponent,
    GridComponent,
    MarkLineComponent,
    MarkPointComponent,
    TooltipComponent,
    SVGRenderer,
]);

export { echarts, ReactEChartsCore };
export type {
    CustomSeriesOption,
    CustomSeriesRenderItemReturn,
    EChartsOption,
    LineSeriesOption,
    TooltipComponentOption,
    XAXisComponentOption,
    YAXisComponentOption,
} from 'echarts';
