import { useMemo, type CSSProperties } from 'react';
import { EChart } from '@/components/charts/EChart';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AXIS_LABEL, TOOLTIP_TEXT_STYLE, toTooltipItems } from '@/lib/chart';
import type { EChartsOption } from '@/lib/echarts';
import { formatCount } from '@/lib/format';
import { useFcltQueueScenario } from '../hooks/useFcltQueueScenario';
import { FCLT_QUEUE_LABEL, type FcltQueueScenarioView, type FcltQueueTarget, type QueueBarView, type QueueTimeAxis } from '../types';
import { toQueueBarDetail } from '../view';

interface FcltQueueScenarioModalProps {
    target: FcltQueueTarget;
    onClose: () => void;
}

interface TargetStepperProps {
    value: number;
    range: { min: number; max: number };
    onStep: (delta: number) => void;
}

interface QueueBarChartProps {
    view: FcltQueueScenarioView;
    selected: QueueBarView | null;
    pending: boolean;
    onSelect: (cnt: number) => void;
}

interface QueueTimeChartProps {
    bar: QueueBarView;
    axis: QueueTimeAxis;
    resource: string;
}

interface ScenarioDetailProps {
    view: FcltQueueScenarioView;
    selected: QueueBarView | null;
    pending: boolean;
    error: string;
    onRetry: () => void;
}

const TIME_COLOR = {
    wait: '#4338ca',
    arvl: '#cfd5e2',
    arvlText: '#7a8396',
    threshold: '#a14a05',
    target: '#4338ca',
    grid: '#eef0f4',
    line: '#e4e7ee',
};

const TIME_STEP_MIN = 10;
const TIME_Y_SPLITS = 4;
// 유입 막대가 평균 대기 선을 덮지 않도록 오른쪽 축을 최댓값보다 넉넉히 잡아 막대를 아래쪽에 둔다
const ARVL_HEADROOM = 1.6;

function toNiceStep(raw: number): number {
    const base = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].find((mul) => mul * base >= raw) ?? 10;

    return step * base;
}

function toTimeChartOption(bar: QueueBarView, axis: QueueTimeAxis): EChartsOption {
    const points = bar.timeline;
    const clockByMinute = new Map(points.map((point) => [point.minute, point.clockText]));
    const waitMax = Math.max(axis.thresholdMin * 1.5, ...points.map((point) => point.waitMin ?? 0));
    const arvlMax = Math.max(...points.map((point) => point.arvlPsgCnt ?? 0));
    // 좌우 축의 눈금 수를 같게 맞춰 격자선을 하나로 쓴다
    const waitStep = toNiceStep(Math.max(waitMax / TIME_Y_SPLITS, 1));
    const arvlStep = toNiceStep(Math.max((arvlMax * ARVL_HEADROOM) / TIME_Y_SPLITS, 1));
    const interval = axis.judgeMin > 60 ? TIME_STEP_MIN * 2 : TIME_STEP_MIN;
    const yBase = { type: 'value' as const, min: 0, axisLabel: AXIS_LABEL, axisTick: { show: false } };

    return {
        animation: false,
        grid: { left: 40, right: 44, top: 34, bottom: 24 },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'line', snap: true, lineStyle: { color: TIME_COLOR.line } },
            textStyle: TOOLTIP_TEXT_STYLE,
            formatter: (params) => {
                const value = Number(toTooltipItems(params)[0]?.axisValue);
                const minute = Math.ceil(value / TIME_STEP_MIN) * TIME_STEP_MIN;
                const point = points.find((item) => item.minute === minute);
                if (!point) return '';

                const fromClock = clockByMinute.get(minute - TIME_STEP_MIN);
                const lines = [
                    `<strong>${fromClock ? `${fromClock} ~ ${point.clockText}` : point.clockText}</strong>`,
                    `평균 대기 ${point.waitMin === null ? '처리 여객 없음' : `${Math.round(point.waitMin)}분`}`,
                    `대기 ${formatCount(Math.round(point.queuePsgCnt))}명`,
                ];
                if (point.arvlPsgCnt !== null) lines.push(`유입 ${formatCount(Math.round(point.arvlPsgCnt))}명`);

                return lines.join('<br/>');
            },
        },
        xAxis: {
            type: 'value',
            min: 0,
            max: axis.judgeMin,
            interval,
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...AXIS_LABEL, formatter: (value: number) => clockByMinute.get(value) ?? '' },
            axisLine: { lineStyle: { color: TIME_COLOR.line } },
        },
        yAxis: [
            {
                ...yBase,
                max: waitStep * TIME_Y_SPLITS,
                interval: waitStep,
                name: '평균 대기 (분)',
                nameTextStyle: { ...AXIS_LABEL, color: TIME_COLOR.wait, fontWeight: 600, align: 'left' },
                splitLine: { lineStyle: { color: TIME_COLOR.grid } },
            },
            {
                ...yBase,
                position: 'right',
                max: arvlStep * TIME_Y_SPLITS,
                interval: arvlStep,
                name: '10분 유입 (명)',
                nameTextStyle: { ...AXIS_LABEL, color: TIME_COLOR.arvlText, fontWeight: 600, align: 'right' },
                splitLine: { show: false },
            },
        ],
        series: [
            {
                type: 'bar',
                name: '10분 유입',
                yAxisIndex: 1,
                data: points.flatMap((point) => (point.arvlPsgCnt === null ? [] : [[point.minute - TIME_STEP_MIN / 2, Math.round(point.arvlPsgCnt)]])),
                barWidth: '60%',
                barMaxWidth: 24,
                itemStyle: { color: TIME_COLOR.arvl, borderRadius: [3, 3, 0, 0] },
            },
            {
                type: 'line',
                name: '평균 대기',
                yAxisIndex: 0,
                z: 3,
                data: points.map((point) => [point.minute, point.waitMin === null ? null : Math.round(point.waitMin * 10) / 10]),
                connectNulls: false,
                symbolSize: 7,
                lineStyle: { width: 2, color: TIME_COLOR.wait },
                itemStyle: { color: TIME_COLOR.wait },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    label: { ...AXIS_LABEL, fontWeight: 700 },
                    data: [
                        {
                            yAxis: axis.thresholdMin,
                            lineStyle: { type: 'dashed', width: 1.5, color: TIME_COLOR.threshold },
                            label: { position: 'insideEndTop', color: TIME_COLOR.threshold, formatter: `해소 기준 ${formatCount(axis.thresholdMin)}분` },
                        },
                        {
                            xAxis: axis.targetMin,
                            lineStyle: { type: 'dashed', width: 1.5, color: TIME_COLOR.target },
                            label: { position: 'end', color: TIME_COLOR.target, formatter: `목표 ${axis.targetClockText}` },
                        },
                    ],
                },
            },
        ],
    };
}

function toBarTone(bar: QueueBarView): string {
    if (bar.kind === 'unreachable') return 'unreachable';
    if (bar.kind === 'unavailable') return 'unavailable';

    return bar.goalMet ? 'met' : 'miss';
}

function toBarTag(bar: QueueBarView): string {
    if (bar.isCurrent && bar.isRecommend) return '현재·추천';
    if (bar.isRecommend) return '추천';

    return bar.isCurrent ? '현재' : '';
}

// 고른 수량이 없으면 추천 → 현재 → 마지막 막대 순으로 보여준다
function resolveSelected(view: FcltQueueScenarioView, selectedCnt: number | null): QueueBarView | null {
    const { bars } = view;

    return (
        bars.find((bar) => bar.cnt === selectedCnt) ?? bars.find((bar) => bar.isRecommend) ?? bars.find((bar) => bar.isCurrent) ?? bars[bars.length - 1] ?? null
    );
}

export function FcltQueueScenarioModal({ target, onClose }: FcltQueueScenarioModalProps) {
    const scenario = useFcltQueueScenario(target);

    const { view } = scenario;
    const label = FCLT_QUEUE_LABEL[target.fcltType];
    const selected = view ? resolveSelected(view, scenario.selectedCnt) : null;

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="fqs" aria-describedby={undefined}>
                <header className="fqs-head">
                    <div className="fqs-head-main">
                        <div className="fqs-target">
                            <span className="fqs-tmnl">{target.tmnlId}</span>
                            <DialogTitle asChild>
                                <strong>{label.title}</strong>
                            </DialogTitle>
                            <span className="fqs-muted">{view?.fcltNm ?? target.unitCd}</span>
                        </div>
                    </div>
                    <DialogClose className="fqs-x" aria-label="팝업 닫기">
                        ×
                    </DialogClose>
                </header>

                <div className="fqs-body">
                    {view && scenario.targetMin !== null ? (
                        <>
                            <div className="fqs-toolbar">
                                <TargetStepper value={scenario.targetMin} range={view.targetRange} onStep={scenario.stepTarget} />
                            </div>

                            {view.calm && <p className="fqs-calm">지금도 {view.targetShort}이라 혼잡하지 않습니다.</p>}

                            <QueueBarChart view={view} selected={selected} pending={scenario.pending} onSelect={scenario.selectCnt} />

                            <ScenarioDetail view={view} selected={selected} pending={scenario.pending} error={scenario.error} onRetry={scenario.retry} />

                            {selected && view.timeAxis && selected.timeline.length > 0 && (
                                <QueueTimeChart bar={selected} axis={view.timeAxis} resource={view.label.resource} />
                            )}

                            <details className="fqs-basis">
                                <summary>계산 근거</summary>
                                <dl>
                                    {view.basis.map((row) => (
                                        <div className="fqs-basis-row" key={row.term}>
                                            <dt>{row.term}</dt>
                                            <dd>{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </details>
                        </>
                    ) : (
                        <div className="fqs-state" aria-live="polite">
                            {scenario.error ? (
                                <>
                                    <span className="fqs-state-err">{scenario.error}</span>
                                    <button type="button" className="fqs-retry" onClick={scenario.retry}>
                                        다시 계산
                                    </button>
                                </>
                            ) : (
                                '계산 중…'
                            )}
                        </div>
                    )}
                </div>

                <footer className="fqs-foot">
                    <DialogClose className="fqs-close">닫기</DialogClose>
                </footer>
            </DialogContent>
        </Dialog>
    );
}

function TargetStepper({ value, range, onStep }: TargetStepperProps) {
    return (
        <div className="fqs-goal-ctrl" role="group" aria-label="목표 해소시간">
            <span>목표</span>
            <div className="fqs-stepper">
                <button type="button" aria-label="목표 해소시간 줄이기" disabled={value <= range.min} onClick={() => onStep(-1)}>
                    −
                </button>
                <strong aria-live="polite">{formatCount(value)}분</strong>
                <button type="button" aria-label="목표 해소시간 늘리기" disabled={value >= range.max} onClick={() => onStep(1)}>
                    +
                </button>
            </div>
        </div>
    );
}

function QueueBarChart({ view, selected, pending, onSelect }: QueueBarChartProps) {
    if (view.bars.length === 0) {
        return <p className="fqs-chart-empty">비교할 수량이 없습니다. {view.recommend.subText}</p>;
    }

    return (
        <div className="fqs-chart" aria-busy={pending}>
            <div className="fqs-plot" style={{ '--fqs-goal': view.targetHeight } as CSSProperties}>
                <div className="fqs-goal" aria-hidden="true">
                    <span>목표 {formatCount(view.targetMin)}분</span>
                </div>
                <div className="fqs-cols" role="group" aria-label={`${view.label.resource} 수별 해소 예상`}>
                    {view.bars.map((bar) => (
                        <button
                            type="button"
                            key={bar.cnt}
                            className={`fqs-col ${toBarTone(bar)}${bar === selected ? ' is-selected' : ''}`}
                            aria-pressed={bar === selected}
                            aria-label={`${bar.cnt}개, ${bar.kind === 'value' ? `${bar.valueText} 후 해소` : bar.valueText}`}
                            onClick={() => onSelect(bar.cnt)}
                        >
                            <span className="fqs-col-val">{bar.valueText}</span>
                            <span className="fqs-col-bar" style={{ '--fqs-h': bar.height } as CSSProperties} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="fqs-axis" aria-hidden="true">
                {view.bars.map((bar) => (
                    <div key={bar.cnt} className={bar === selected ? 'is-selected' : undefined}>
                        <span>{bar.cnt}</span>
                        <em className={bar.isRecommend ? 'rec' : undefined}>{toBarTag(bar)}</em>
                    </div>
                ))}
            </div>
            <div className="fqs-chart-foot">
                <span className="fqs-axis-cap">{view.axisText}</span>
                <ul className="fqs-legend">
                    <li className="met">목표 달성</li>
                    <li className="miss">목표보다 늦음</li>
                    <li className="unreachable">해소 불가</li>
                </ul>
            </div>
        </div>
    );
}

function QueueTimeChart({ bar, axis, resource }: QueueTimeChartProps) {
    const option = useMemo(() => toTimeChartOption(bar, axis), [bar, axis]);

    return (
        <section className="fqs-time" aria-label={`${resource} ${bar.cnt}개 운영 시 시간대별 예측`}>
            <div className="fqs-time-head">
                <strong>{formatCount(bar.cnt)}개 운영 시 시간대별 예측</strong>
                <span>{axis.rangeText} · 점선 아래로 내려가 끝까지 유지되고 줄이 늘지 않으면 해소</span>
            </div>
            <div className="fqs-time-chart">
                <EChart option={option} />
            </div>
            {!axis.arvlProfiled && <p className="fqs-time-note">CAST 10분 유입이 없어 직전 10분 유입률 하나로 계산했습니다.</p>}
        </section>
    );
}

function ScenarioDetail({ view, selected, pending, error, onRetry }: ScenarioDetailProps) {
    const detail = selected ? toQueueBarDetail(view, selected) : null;
    const { recommend } = view;

    return (
        <div className="fqs-detail" aria-live="polite" aria-busy={pending}>
            <div className="fqs-detail-sel">
                {detail && (
                    <>
                        <span>{detail.title}</span>
                        <strong className={detail.goalMet ? undefined : 'warn'}>{detail.mainText}</strong>
                        {detail.subText && <p>{detail.subText}</p>}
                    </>
                )}
            </div>
            <div className="fqs-detail-rec">
                <span>목표 {formatCount(view.targetMin)}분 추천</span>
                {error ? (
                    <>
                        <strong className="warn">계산 실패</strong>
                        <button type="button" className="fqs-retry" onClick={onRetry}>
                            다시 계산
                        </button>
                    </>
                ) : pending ? (
                    <strong className="muted">계산 중…</strong>
                ) : (
                    <>
                        <strong className={recommend.short ? 'warn' : undefined}>{recommend.mainText}</strong>
                        {recommend.subText && <p className={recommend.short ? 'warn' : undefined}>{recommend.subText}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
