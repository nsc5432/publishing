import { useMemo } from 'react';
import type { DepTrend } from '../types';

interface DepChartViewProps {
    trend: DepTrend;
    /** 타임라인 현재 스텝 — 세로 표시선 자리 */
    step: number;
    /** 현재 시각 라벨 (예: 10:30) */
    time: string;
}

/** y 축 눈금 개수 (0 포함) */
const Y_TICKS = 5;
/** x 축 라벨 간격 — 30분 단위 스텝 기준 2시간마다 */
const X_LABEL_STEP = 4;

/** 눈금이 딱 떨어지도록 최댓값을 올림한다 (예: 317 → 400) */
function toAxisMax(max: number) {
    if (max <= 0) return Y_TICKS;

    const unit = 10 ** Math.floor(Math.log10(max));

    return Math.ceil(max / unit) * unit;
}

/**
 * 차트 보기 — 출국장별 시간대별 대기인원 추이.
 * 맵·표 보기가 한 시각의 값이라면, 차트는 하루 흐름에서 그 시각이 어디쯤인지 보여준다.
 */
export function DepChartView({ trend, step, time }: DepChartViewProps) {
    const lastStep = Math.max(1, trend.timeLabels.length - 1);

    const axisMax = useMemo(
        () => toAxisMax(Math.max(...trend.series.flatMap((series) => series.values), 0)),
        [trend],
    );

    const x = (i: number) => (i / lastStep) * 100;
    const y = (value: number) => 100 - (value / axisMax) * 100;

    return (
        <div className="dep-chart">
            <div className="dep-chart__head">
                <p className="dep-chart__title">
                    출국장별 대기인원 추이 <em>(단위: 명)</em>
                </p>
                <ul className="dep-chart__legend">
                    {trend.series.map((series) => (
                        <li key={series.depNum}>
                            <i style={{ background: series.color }} aria-hidden="true" />
                            {series.title}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="dep-chart__body">
                <ul className="dep-chart__yaxis" aria-hidden="true">
                    {Array.from({ length: Y_TICKS + 1 }, (_, i) => (
                        <li key={i}>{Math.round((axisMax / Y_TICKS) * (Y_TICKS - i))}</li>
                    ))}
                </ul>

                <div className="dep-chart__plot">
                    {Array.from({ length: Y_TICKS + 1 }, (_, i) => (
                        <span
                            key={i}
                            className="dep-chart__grid"
                            style={{ top: `${(100 / Y_TICKS) * i}%` }}
                            aria-hidden="true"
                        />
                    ))}

                    {/* 타임라인이 가리키는 시각 */}
                    <span
                        className="dep-chart__now"
                        style={{ left: `${x(step)}%` }}
                        aria-hidden="true"
                    >
                        <b>{time}</b>
                    </span>

                    <svg
                        className="dep-chart__svg"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label={`출국장별 대기인원 추이, 최대 ${axisMax}명`}
                    >
                        {trend.series.map((series) => (
                            <polyline
                                key={series.depNum}
                                points={series.values
                                    .map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`)
                                    .join(' ')}
                                stroke={series.color}
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                    </svg>

                    {/* 현재 시각의 값 — 꺾은선 위 점 */}
                    {trend.series.map((series) => (
                        <span
                            key={series.depNum}
                            className="dep-chart__dot"
                            style={{
                                left: `${x(step)}%`,
                                top: `${y(series.values[step] ?? 0)}%`,
                                borderColor: series.color,
                            }}
                            aria-hidden="true"
                        />
                    ))}
                </div>
            </div>

            <ul className="dep-chart__xaxis" aria-hidden="true">
                {trend.timeLabels.map((label, i) =>
                    i % X_LABEL_STEP === 0 ? (
                        <li key={label} style={{ left: `${x(i)}%` }}>
                            {label}
                        </li>
                    ) : null,
                )}
            </ul>
        </div>
    );
}
