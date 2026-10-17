import { useMemo, useState } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { Icon } from '@/components/icons/InlineIcon';
import type { FcltCardData } from '../types';

interface FcltCardProps {
    data: FcltCardData;
    gauge: string;
    onDetail: (unitCd: string) => void;
}

interface GaugeDonutProps {
    value: number;
    centerText: string;
    captionText: string;
    accentColor: string;
}

const SWEEP_ANGLE = 360 * 0.84;
const START_ANGLE = 360 - 119;
const END_ANGLE = START_ANGLE - SWEEP_ANGLE;
const RADIUS = `${((30 / 37) * 100).toFixed(1)}%`;
const RING_WIDTH = 3.4;

export function FcltCard({ data, gauge, onDetail }: FcltCardProps) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const variantIndex = Math.max(
        0,
        data.variants.findIndex((item) => item.unitCd === selectedUnit),
    );
    const variant = data.variants[variantIndex];

    const cycleVariant = (direction: number) => {
        const nextIndex = (variantIndex + direction + data.variants.length) % data.variants.length;
        setSelectedUnit(data.variants[nextIndex].unitCd);
    };

    if (!variant) return null;

    return (
        <div className="fclt-card">
            <div className="fclt-card-head">
                <b>{data.title}</b>
                <div className="warn">
                    <span>{data.warn}</span>
                    <button
                        type="button"
                        className="plus"
                        aria-label={`${data.title} ${variant.unitCd} 혼잡해소 시뮬레이션`}
                        aria-haspopup="dialog"
                        onClick={() => onDetail(variant.unitCd)}
                    >
                        <Icon name="plus" />
                    </button>
                </div>
            </div>
            <div className="fclt-card-mid">
                <div className="isl">{variant.island ?? ' '}</div>
                <div className="num">{variant.num}</div>
                <div className="meta">
                    {variant.meta.map((metaCell) => (
                        <span key={metaCell.label}>
                            {metaCell.label} <b className={metaCell.accent ? 'acc' : undefined}>{metaCell.value}</b>
                        </span>
                    ))}
                </div>
            </div>
            <div className="gauge-row">
                <div className="gauge">
                    <div className="k">시간당 처리율</div>
                    <GaugeDonut
                        value={variant.processRate.value}
                        centerText={variant.processRate.centerText}
                        captionText={variant.processRate.captionText}
                        accentColor={gauge}
                    />
                </div>
                <div className="rec">
                    <div className="tag">{variant.recommend.tag}</div>
                    <div className="name">{variant.recommend.name}</div>
                    <div className="cnt">
                        {variant.recommend.count}
                        <small>개</small>
                    </div>
                    <div className={`cap${variant.recommend.countNoteAccent ? ' u' : ''}`}>
                        {variant.recommend.countNote}
                    </div>
                </div>
                <div className="gauge">
                    <div className="k">혼잡해소 예상</div>
                    <GaugeDonut
                        value={variant.clearTime.value}
                        centerText={variant.clearTime.centerText}
                        captionText={variant.clearTime.captionText}
                        accentColor={gauge}
                    />
                </div>
            </div>
            <div className="chips">
                {data.chips.map((chip) => (
                    <button
                        type="button"
                        key={chip.label}
                        className={`chip ${chip.kind}${chip.label === variant.unitCd ? ' sel' : ''}`}
                        aria-pressed={chip.label === variant.unitCd}
                        disabled={!data.variants.some((item) => item.unitCd === chip.label)}
                        onClick={() => setSelectedUnit(chip.label)}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
            <button type="button" className="fclt-card-arrow prev" onClick={() => cycleVariant(-1)}>
                <Icon name="chevL" />
            </button>
            <button type="button" className="fclt-card-arrow next" onClick={() => cycleVariant(1)}>
                <Icon name="chevR" />
            </button>
        </div>
    );
}

function GaugeDonut({ value, centerText, captionText, accentColor }: GaugeDonutProps) {
    const option = useMemo<EChartsOption>(
        () => ({
            animation: false,
            series: [
                {
                    type: 'gauge',
                    silent: true,
                    center: ['50%', '50%'],
                    radius: RADIUS,
                    startAngle: START_ANGLE,
                    endAngle: END_ANGLE,
                    min: 0,
                    max: 1,
                    axisLine: {
                        roundCap: true,
                        lineStyle: { width: RING_WIDTH, color: [[1, '#e7ebf2']] },
                    },
                    progress: {
                        show: true,
                        roundCap: true,
                        width: RING_WIDTH,
                        itemStyle: { color: accentColor },
                    },
                    pointer: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: {
                        offsetCenter: [0, -5],
                        formatter: () => centerText,
                        fontSize: 15.6,
                        fontWeight: 700,
                        color: '#23272f',
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    title: {
                        offsetCenter: [0, 9],
                        fontSize: 9.7,
                        color: '#8a93a3',
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    data: [{ value: Math.min(Math.max(value, 0), 1), name: captionText }],
                },
            ],
        }),
        [value, centerText, captionText, accentColor],
    );

    return (
        <div className="donut">
            <EChart className="donut__chart" option={option} />
        </div>
    );
}
