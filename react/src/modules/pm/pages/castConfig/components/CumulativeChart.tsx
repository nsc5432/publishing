import { useMemo } from 'react';
import { EChart } from '@/components/charts/EChart';
import { AXIS_LABEL, CHART_FONT_FAMILY, TOOLTIP_TEXT_STYLE } from '@/lib/chart';
import type { EChartsOption } from '@/lib/echarts';
import type { Dataset, DraftChanges, Validation } from '../types';
import { readCellValue } from '../view';

interface CumulativeChartProps {
    dataset: Dataset;
    rule: Validation;
    drafts: DraftChanges;
}

const LINE_COLORS = ['#4441cc', '#12b09a', '#e8a318', '#e12b2b', '#1f9d3a'];

function toOption(dataset: Dataset, rule: Validation, drafts: DraftChanges): EChartsOption {
    const stepColumn = dataset.columns.find((column) => column.type === 'time')?.key ?? '';
    const groups = new Map<string, { steps: string[]; values: number[] }>();

    for (const row of dataset.rows) {
        const name = readCellValue(dataset.sheetName, row, rule.groupColumn, drafts);
        const series = groups.get(name) ?? { steps: [], values: [] };
        series.steps.push(readCellValue(dataset.sheetName, row, stepColumn, drafts));
        series.values.push(Number(readCellValue(dataset.sheetName, row, rule.column, drafts)) || 0);
        groups.set(name, series);
    }

    const names = [...groups.keys()];

    return {
        grid: { top: 28, right: 16, bottom: 24, left: 44 },
        legend: { top: 0, textStyle: { ...AXIS_LABEL, fontSize: 11 }, itemHeight: 8, itemWidth: 14 },
        tooltip: { trigger: 'axis', textStyle: TOOLTIP_TEXT_STYLE },
        xAxis: {
            type: 'category',
            data: groups.get(names[0])?.steps ?? [],
            axisLabel: AXIS_LABEL,
        },
        yAxis: {
            type: 'value',
            max: rule.target,
            axisLabel: { ...AXIS_LABEL, formatter: '{value}' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        },
        series: names.map((name, index) => ({
            type: 'line',
            name,
            data: groups.get(name)?.values ?? [],
            smooth: true,
            symbolSize: 6,
            lineStyle: { width: 2, color: LINE_COLORS[index % LINE_COLORS.length] },
            itemStyle: { color: LINE_COLORS[index % LINE_COLORS.length] },
        })),
        textStyle: { fontFamily: CHART_FONT_FAMILY },
    };
}

export function CumulativeChart({ dataset, rule, drafts }: CumulativeChartProps) {
    const option = useMemo(() => toOption(dataset, rule, drafts), [dataset, rule, drafts]);

    return (
        <div className="cast-config-preview">
            <EChart option={option} />
        </div>
    );
}
