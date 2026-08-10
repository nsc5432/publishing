import type { HourlyPsgDto } from '@/types/api.types';
import { formatCount } from '../format';

/* 카드 안의 작은 차트라 좌표를 고정 viewBox(256x50) 안에서 계산한다. */
const WIDTH = 256;
/** 막대 바닥 (그 아래는 축 라벨 자리) */
const BASE_Y = 38;
/** 막대가 가장 높을 때의 y */
const TOP_Y = 6;
const PLOT_H = BASE_Y - TOP_Y;
/** 3시간 간격으로 축 라벨을 찍는다 */
const AXIS_STEP = 3;

interface HourlyPsgChartProps {
    data: HourlyPsgDto | null;
    iconSrc: string;
    iconAlt: string;
    /** 예측선 색 (터미널별로 다르다) */
    lineColor: string;
}

/**
 * 시간대별 출발여객 — 막대(실적) + 꺾은선(예측).
 *
 * 축 라벨 행까지 같이 그린다. 차트와 라벨의 칸 수가 어긋나면 눈금이 막대와 안 맞는데,
 * 두 곳에서 따로 계산하면 그 어긋남이 잘 드러나지 않는다.
 */
export function HourlyPsgChart({ data, iconSrc, iconAlt, lineColor }: HourlyPsgChartProps) {
    const items = data?.itemList ?? [];
    // 0 으로 나누지 않도록 최솟값을 둔다 (전 시간대 0 인 날은 빈 차트로 보인다).
    const max = Math.max(1, data?.maxPsgCnt ?? 1);
    const slot = items.length > 0 ? WIDTH / items.length : WIDTH;
    const barWidth = slot * 0.66;

    const y = (value: number) => BASE_Y - (Math.min(value, max) / max) * PLOT_H;

    const linePoints = items
        .map((item, i) => `${(i * slot + slot / 2).toFixed(1)},${y(item.fcstPsgCnt).toFixed(1)}`)
        .join(' ');

    return (
        <>
            <div className="hourly-row">
                <span className="ic">
                    <img className="tico" src={iconSrc} alt={iconAlt} />
                </span>
                <svg viewBox={`0 0 ${WIDTH} 50`} preserveAspectRatio="none">
                    <g stroke="#e4e8f0" strokeWidth=".9">
                        <line x1="0" y1={TOP_Y} x2={WIDTH} y2={TOP_Y} />
                        <line x1="0" y1={(TOP_Y + BASE_Y) / 2} x2={WIDTH} y2={(TOP_Y + BASE_Y) / 2} />
                        <line x1="0" y1={BASE_Y} x2={WIDTH} y2={BASE_Y} />
                    </g>
                    <g fill="#3f8ee6">
                        {items.map((item, i) => {
                            const top = y(item.psgCnt);
                            return (
                                <rect
                                    key={item.time}
                                    x={(i * slot + (slot - barWidth) / 2).toFixed(1)}
                                    y={top.toFixed(1)}
                                    width={barWidth.toFixed(1)}
                                    height={(BASE_Y - top).toFixed(1)}
                                />
                            );
                        })}
                    </g>
                    {items.length > 0 && (
                        <polyline
                            points={linePoints}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </svg>
                <div className="ylab">
                    <span>{formatCount(max)}</span>
                    <span>{formatCount(Math.round(max / 2))}</span>
                    <span>0</span>
                </div>
            </div>
            <div className="axis-row">
                <span className="ic" />
                <div className="axis">
                    {items
                        .filter((_, i) => i % AXIS_STEP === 0)
                        .map((item) => (
                            <span key={item.time}>{Number(item.time)}</span>
                        ))}
                </div>
            </div>
        </>
    );
}
