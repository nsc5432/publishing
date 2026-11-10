import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import { Icon } from '@/components/icons/InlineIcon';
import { EMPTY_FCLT_CARD_VARIANT } from '../view';
import type { FcltCardData, FcltCardDiff, FcltCardSnapshot, GaugeData } from '../types';

interface FcltCardProps {
    data: FcltCardData;
    onDetail: (unitCd: string, hhmm: string) => void;
    onMove: () => void;
}

interface FlowPointProps {
    snapshot: FcltCardSnapshot | null;
    label: string;
}

interface FlowMetricProps {
    icon: 'people' | 'clock';
    label: string;
    value: string;
    unit: string;
    diff?: FcltCardDiff;
}

interface GaugeDonutProps {
    label: string;
    data: GaugeData | undefined;
    accentColor: string;
}

const ARRIVAL_COLOR = '#7a5fd6';
const PROCESS_COLOR = '#2f7ff0';
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
    const tipId = useId();
    const variantsByUnit = useMemo(() => new Map(data.variants.map((item) => [item.unitCd, item])), [data.variants]);
    const unitOrder = useMemo(() => {
        const chipUnits = data.chips.map((chip) => chip.label).filter((unitCd) => variantsByUnit.has(unitCd));
        const listedUnits = new Set(chipUnits);

        return [...chipUnits, ...data.variants.map((item) => item.unitCd).filter((unitCd) => !listedUnits.has(unitCd))];
    }, [data.chips, data.variants, variantsByUnit]);
    const variant = variantsByUnit.get(selectedUnit ?? '') ?? data.variants[0] ?? EMPTY_FCLT_CARD_VARIANT;
    const selectedChip = data.chips.find((chip) => chip.label === variant?.unitCd);
    const current = variant?.current;
    const unitName = data.fcltType === 'CHKN' ? '체크인카운터' : '보안검색대';
    const operatingCount = current?.operatingCount ?? '-';

    const cycleVariant = (direction: number) => {
        setSelectedUnit((previous) => {
            const unitCd = variantsByUnit.has(previous ?? '') ? previous : data.variants[0]?.unitCd;
            if (unitOrder.length < 2) return unitCd ?? null;

            const index = Math.max(0, unitOrder.indexOf(unitCd ?? ''));
            return unitOrder[(index + direction + unitOrder.length) % unitOrder.length];
        });
    };

    return (
        <div className="fclt-card">
            <div className="fclt-card-head">
                <b>{data.title}</b>
                <div className="warn">
                    <button type="button" className="plus" aria-label={`${data.title} 상세 화면으로 이동`} onClick={onMove}>
                        <Icon name="plus" />
                    </button>
                </div>
            </div>
            <div className="fclt-card-mid">
                <div className="fclt-unit-summary">
                    <div className="fclt-unit-frame" tabIndex={0} aria-describedby={tipId}>
                        <div className="fclt-unit-heading">
                            {data.fcltType === 'CHKN' && <span className="isl">아일랜드</span>}
                            <b className="num" data-congestion={selectedChip?.kind}>
                                {variant.num}
                            </b>
                            <span className="fclt-unit-count">
                                (<b className="acc">{operatingCount}</b>/{variant.totalCount})
                            </span>
                        </div>
                        <div className="fclt-unit-status">
                            <span className="fclt-unit-cgn" data-congestion={current?.congestionKind ?? 'gray'}>
                                {current?.congestion ?? '-'}
                            </span>
                            {current && (
                                <span className="fclt-unit-capa" data-capacity={current.capacity.kind}>
                                    {current.capacity.text}
                                </span>
                            )}
                        </div>
                        <span id={tipId} className="fclt-unit-tip" role="tooltip">
                            운영 {unitName} {operatingCount}개 / 전체 {variant.totalCount}개
                            {current && current.recommend.count !== '-' && ` · 추천 ${current.recommend.count}개`}
                        </span>
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
                    <FlowPoint snapshot={variant.current} label="현재" />
                    <div className="fclt-flow-link" aria-hidden="true">
                        <span />
                        <Icon name="chevR" />
                    </div>
                    <FlowPoint snapshot={variant.next} label="+1시간" />
                </div>
            </div>
            <div className="gauge-row" aria-label={`${data.currentTime} 기준 운영 지표`}>
                <div className="gauge fclt-gauge-hrly">
                    <div className="fclt-gauge-donuts">
                        <GaugeDonut label="유입" data={current?.hourly.arrival} accentColor={ARRIVAL_COLOR} />
                        <GaugeDonut label="처리" data={current?.hourly.process} accentColor={PROCESS_COLOR} />
                    </div>
                    <div className="fclt-gauge-hrly-info">
                        <span className="k">시간당 인원</span>
                        {current?.hourly.queueDiff && (
                            <em className="fclt-gauge-diff" data-dir={current.hourly.queueDiff.dir}>
                                대기열 {current.hourly.queueDiff.text}
                            </em>
                        )}
                    </div>
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
                    <span className="name">{current?.recommend.name || unitName}</span>
                    <span className="cnt">
                        {current?.recommend.count ?? '-'}
                        <small>개</small>
                    </span>
                    <span className={`cap${current?.recommend.countNoteAccent ? ' u' : ''}`}>{current?.recommend.countNote ?? '소요'}</span>
                </button>
                <div className="gauge fclt-gauge-clear">
                    <div className="k">{current?.clear.label ?? '혼잡해소 예상'}</div>
                    <dl className="fclt-gauge-list">
                        <div>
                            <dt>현재 {operatingCount}개</dt>
                            <dd>{current?.clear.current ?? '-'}</dd>
                        </div>
                        <div className="is-rec">
                            <dt>추천 {current?.recommend.count ?? '-'}개</dt>
                            <dd>{current?.clear.recommend ?? '-'}</dd>
                        </div>
                    </dl>
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

function FlowPoint({ snapshot, label }: FlowPointProps) {
    return (
        <div className="fclt-flow-point" data-congestion={snapshot?.congestionKind ?? 'gray'}>
            <div className="fclt-flow-time">
                <span className="fclt-flow-period">{label}</span>
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
    const tipId = useId();

    return (
        <div className="fclt-flow-count" tabIndex={0} aria-describedby={tipId}>
            <Icon name={icon} />
            <span className="fclt-flow-value">
                <strong>{value}</strong>
                {value !== '-' && <small>{unit}</small>}
            </span>
            {diff && (
                <em className="fclt-flow-diff" data-dir={diff.dir} aria-label={`현재 대비 ${diff.text}${unit}`}>
                    {diff.text}
                </em>
            )}
            <span id={tipId} className="fclt-flow-tip" role="tooltip">
                {label}
            </span>
        </div>
    );
}

function GaugeDonut({ label, data, accentColor }: GaugeDonutProps) {
    const donutRef = useRef<HTMLDivElement>(null);
    const [sizeRatio, setSizeRatio] = useState(1);
    const value = data?.value ?? 0;
    const centerText = data?.centerText ?? '-';
    const averageValue = data?.average?.value;
    const averageText = data?.average?.text;

    // 차트 글자는 px 고정이라 칸 폭에 맞춰 줄어든 도넛에서 링과 겹친다 — 도넛 크기에 맞춰 줄인다
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
                        offsetCenter: [0, (averageText ? -5 : 0) * sizeRatio],
                        formatter: () => centerText,
                        fontSize: 15.6 * sizeRatio,
                        fontWeight: 700,
                        color: '#23272f',
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    title: {
                        offsetCenter: [0, 9 * sizeRatio],
                        fontSize: 9.7 * sizeRatio,
                        fontWeight: 600,
                        color: AVERAGE_COLOR,
                        fontFamily: 'Pretendard, sans-serif',
                    },
                    data: [{ value: clamp01(value), name: averageText ?? '' }],
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
        [value, centerText, accentColor, averageValue, averageText, sizeRatio],
    );

    return (
        <div className="fclt-gauge-donut">
            <div
                ref={donutRef}
                className="donut"
                role="img"
                aria-label={averageText ? `${label} ${centerText}명, 활성 시설 ${averageText}명` : `${label} ${centerText}명`}
            >
                <EChart className="donut__chart" option={option} />
            </div>
            <span className="fclt-gauge-donut-label" style={{ color: accentColor }}>
                {label}
            </span>
        </div>
    );
}
