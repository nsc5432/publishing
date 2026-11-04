import { useEffect, useMemo, useRef, useState } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { Icon } from '@/components/icons/InlineIcon';
import type { FcltCardData, FcltCardDiff, FcltCardSnapshot, GaugeAverage } from '../types';

interface FcltCardProps {
    data: FcltCardData;
    onDetail: (unitCd: string, hhmm: string) => void;
    onMove: () => void;
}

interface FlowPointProps {
    snapshot: FcltCardSnapshot | null;
    label: string;
    time: string;
}

interface FlowMetricProps {
    icon: 'people' | 'clock';
    label: string;
    value: string;
    unit: string;
    diff?: FcltCardDiff;
}

interface GaugeDonutProps {
    value: number;
    centerText: string;
    captionText: string;
    accentColor: string;
    average?: GaugeAverage;
}

const GAUGE_ACCENT: Record<string, string> = {
    b: '#2f7ff0',
    g: '#2f7ff0',
    o: '#e0691c',
    r: '#d92626',
    gray: '#8a93a3',
};
const SWEEP_ANGLE = 360 * 0.84;
const START_ANGLE = 360 - 119;
const END_ANGLE = START_ANGLE - SWEEP_ANGLE;
const RADIUS = `${((30 / 37) * 100).toFixed(1)}%`;
const RING_WIDTH = 3.4;
const INNER_RADIUS = `${((25 / 37) * 100).toFixed(1)}%`;
const INNER_RING_WIDTH = 2.6;
const AVERAGE_COLOR = '#6c7688';
const BASE_DONUT_SIZE = 72;
const TRACK_STOPS: [number, string][] = [[1, '#e7ebf2']];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function FcltCard({ data, onDetail, onMove }: FcltCardProps) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const variantsByUnit = useMemo(() => new Map(data.variants.map((item) => [item.unitCd, item])), [data.variants]);
    const unitOrder = useMemo(() => {
        const chipUnits = data.chips.map((chip) => chip.label).filter((unitCd) => variantsByUnit.has(unitCd));
        const listedUnits = new Set(chipUnits);

        return [...chipUnits, ...data.variants.map((item) => item.unitCd).filter((unitCd) => !listedUnits.has(unitCd))];
    }, [data.chips, data.variants, variantsByUnit]);
    const variant = variantsByUnit.get(selectedUnit ?? '') ?? data.variants[0];
    const selectedChip = data.chips.find((chip) => chip.label === variant?.unitCd);
    const current = variant?.current;
    const accentColor = GAUGE_ACCENT[current?.congestionKind ?? 'gray'];

    const cycleVariant = (direction: number) => {
        setSelectedUnit((previous) => {
            const unitCd = variantsByUnit.has(previous ?? '') ? previous : data.variants[0]?.unitCd;
            if (unitOrder.length < 2) return unitCd ?? null;

            const index = Math.max(0, unitOrder.indexOf(unitCd ?? ''));
            return unitOrder[(index + direction + unitOrder.length) % unitOrder.length];
        });
    };

    if (!variant) return null;

    return (
        <div className="fclt-card">
            <div className="fclt-card-head">
                <b>{data.title}</b>
                <div className="warn">
                    <span>{data.warn}</span>
                    <button type="button" className="plus" aria-label={`${data.title} 상세 화면으로 이동`} onClick={onMove}>
                        <Icon name="plus" />
                    </button>
                </div>
            </div>
            <div className="fclt-card-mid">
                <div className="fclt-unit-summary">
                    <div className="fclt-unit-frame">
                        <div className="fclt-unit-heading">
                            {data.fcltType === 'CHKN' && <span className="isl">아일랜드</span>}
                            <b className="num" data-congestion={selectedChip?.kind}>
                                {variant.num}
                            </b>
                        </div>
                        <div className="meta">
                            {variant.meta.map((cell) => (
                                <span key={cell.label}>
                                    {cell.label}
                                    <b>{cell.value}</b>개
                                </span>
                            ))}
                            <span>
                                운영<b className="acc">{current?.operatingCount ?? '-'}</b>개
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="fclt-card-arrow prev"
                        aria-label={`이전 ${data.title} 시설`}
                        disabled={unitOrder.length < 2}
                        onClick={() => cycleVariant(-1)}
                    >
                        <Icon name="chevL" />
                    </button>
                    <button
                        type="button"
                        className="fclt-card-arrow next"
                        aria-label={`다음 ${data.title} 시설`}
                        disabled={unitOrder.length < 2}
                        onClick={() => cycleVariant(1)}
                    >
                        <Icon name="chevR" />
                    </button>
                </div>
                <div className="fclt-flow" aria-label={`${data.title} ${variant.num} 혼잡 변화`}>
                    <FlowPoint snapshot={variant.current} label="현재" time={data.currentTime} />
                    <div className="fclt-flow-link" aria-hidden="true">
                        <span />
                        <Icon name="chevR" />
                    </div>
                    <FlowPoint snapshot={variant.next} label="+1시간" time={data.nextTime} />
                </div>
            </div>
            <div className="gauge-row" aria-label={`${data.currentTime} 기준 운영 지표`}>
                <div className="gauge">
                    <div className="k">시간당 처리인원</div>
                    <GaugeDonut
                        value={current?.processRate.value ?? 0}
                        centerText={current?.processRate.centerText ?? '-'}
                        captionText={current ? current.processRate.captionText : ''}
                        accentColor={accentColor}
                        average={current?.processRate.average}
                    />
                </div>
                <button
                    type="button"
                    className="rec"
                    aria-label={`${data.title} ${variant.unitCd} ${data.currentTime} 혼잡해소 시뮬레이션`}
                    aria-haspopup="dialog"
                    disabled={!current}
                    onClick={() => current && onDetail(variant.unitCd, current.hhmm)}
                >
                    <span className="tag">추천</span>
                    <span className="name">{current?.recommend.name || (data.fcltType === 'CHKN' ? '체크인카운터' : '보안검색대')}</span>
                    <span className="cnt">
                        {current?.recommend.count ?? '-'}
                        <small>개</small>
                    </span>
                    <span className={`cap${current?.recommend.countNoteAccent ? ' u' : ''}`}>{current?.recommend.countNote ?? '소요'}</span>
                </button>
                <div className="gauge">
                    <div className="k">{current?.clearTime.label ?? '혼잡해소 예상'}</div>
                    <GaugeDonut
                        value={current?.clearTime.value ?? 0}
                        centerText={current?.clearTime.clockText ?? '-'}
                        captionText={current?.clearTime.captionText ?? ''}
                        accentColor={accentColor}
                    />
                </div>
            </div>
            <div className="chips" aria-label={`${data.title} 시설 선택 · 조회 시점 혼잡도`}>
                {data.chips.map((chip) => (
                    <button
                        type="button"
                        key={chip.label}
                        className={`chip ${chip.kind}${chip.label === variant.unitCd ? ' sel' : ''}`}
                        aria-label={`${data.title} ${chip.label}`}
                        aria-pressed={chip.label === variant.unitCd}
                        disabled={!data.variants.some((item) => item.unitCd === chip.label)}
                        onClick={() => setSelectedUnit(chip.label)}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function FlowPoint({ snapshot, label, time }: FlowPointProps) {
    return (
        <div className="fclt-flow-point" data-congestion={snapshot?.congestionKind ?? 'gray'}>
            <div className="fclt-flow-time">
                <span className="fclt-flow-period">{label}</span>
                <time>{time}</time>
            </div>
            <span className="fclt-flow-status">{snapshot?.congestion ?? '-'}</span>
            <div className="fclt-flow-metrics">
                <FlowMetric
                    icon="people"
                    label="대기인원"
                    value={snapshot?.waitingCount ?? '-'}
                    unit="명"
                    diff={snapshot?.waitingCountDiff}
                />
                <FlowMetric
                    icon="clock"
                    label="대기시간"
                    value={snapshot?.waitingTime ?? '-'}
                    unit="분"
                    diff={snapshot?.waitingTimeDiff}
                />
            </div>
        </div>
    );
}

function FlowMetric({ icon, label, value, unit, diff }: FlowMetricProps) {
    return (
        <div className="fclt-flow-count">
            <Icon name={icon} />
            <span className="fclt-flow-label">{label}</span>
            <span className="fclt-flow-value">
                <strong>{value}</strong>
                {value !== '-' && <small>{unit}</small>}
                {diff && (
                    <em className="fclt-flow-diff" data-dir={diff.dir} aria-label={`현재 대비 ${diff.text}${unit}`}>
                        {diff.text}
                    </em>
                )}
            </span>
        </div>
    );
}

function GaugeDonut({ value, centerText, captionText, accentColor, average }: GaugeDonutProps) {
    const donutRef = useRef<HTMLDivElement>(null);
    const [sizeRatio, setSizeRatio] = useState(1);
    const averageValue = average?.value;
    const averageText = average?.text;
    // 차트 글자는 px 고정이라 촘촘 모드(58px)에서 안쪽 링과 겹친다 — 두 겹일 때만 도넛 크기에 맞춰 줄인다
    const textScale = averageText ? sizeRatio : 1;

    useEffect(() => {
        const el = donutRef.current;
        if (!el) return;

        const observer = new ResizeObserver(([entry]) => setSizeRatio(Math.min(entry.contentRect.width / BASE_DONUT_SIZE, 1)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

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
                        lineStyle: { width: RING_WIDTH, color: TRACK_STOPS },
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
                        offsetCenter: [0, -5 * textScale],
                        formatter: () => centerText,
                        fontSize: 15.6 * textScale,
                        fontWeight: 700,
                        color: '#23272f',
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    title: {
                        offsetCenter: [0, 9 * textScale],
                        fontSize: 9.7 * textScale,
                        fontWeight: averageText ? 600 : 400,
                        color: averageText ? AVERAGE_COLOR : '#8a93a3',
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    data: [{ value: clamp01(value), name: averageText ?? captionText }],
                },
                ...(averageValue === undefined
                    ? []
                    : [
                          {
                              type: 'gauge' as const,
                              silent: true,
                              center: ['50%', '50%'],
                              radius: INNER_RADIUS,
                              startAngle: START_ANGLE,
                              endAngle: END_ANGLE,
                              min: 0,
                              max: 1,
                              axisLine: {
                                  roundCap: true,
                                  lineStyle: { width: INNER_RING_WIDTH, color: TRACK_STOPS },
                              },
                              progress: {
                                  show: true,
                                  roundCap: true,
                                  width: INNER_RING_WIDTH,
                                  itemStyle: { color: AVERAGE_COLOR },
                              },
                              pointer: { show: false },
                              axisTick: { show: false },
                              splitLine: { show: false },
                              axisLabel: { show: false },
                              detail: { show: false },
                              title: { show: false },
                              data: [{ value: clamp01(averageValue) }],
                          },
                      ]),
            ],
        }),
        [value, centerText, captionText, accentColor, averageValue, averageText, textScale],
    );

    return (
        <div
            ref={donutRef}
            className="donut"
            role="img"
            aria-label={averageText ? `${centerText} ${captionText}, 활성 시설 ${averageText}` : `${centerText} ${captionText}`}
        >
            <EChart className="donut__chart" option={option} />
        </div>
    );
}
