import { useId } from 'react';
import type { DsbdRsltDto } from '@/types/api.types';
import { formatCount } from '../format';

/* 좌표는 고정 viewBox(430x190) 기준. 원본 퍼블리싱 좌표를 그대로 유지한다. */
/** 첫 점의 x (왼쪽 Y축 라벨 자리 다음) */
const X0 = 44;
/** 점 사이 간격 — 24개 점이 412 에서 끝난다 */
const X_STEP = 16;
/** 값이 최댓값일 때의 y */
const TOP_Y = 26;
/** 값이 0 일 때의 y */
const BASE_Y = 176;
const PLOT_H = BASE_Y - TOP_Y;
/** Y축 눈금 칸 수 (라벨은 7개) */
const STEPS = 6;
/** 3시간 간격으로 x축 라벨을 찍는다 */
const AXIS_STEP = 3;

/**
 * Y축 최댓값을 눈금이 딱 떨어지는 값으로 올린다.
 * (실제 최댓값을 그대로 쓰면 라벨이 137, 274 … 처럼 읽기 어려운 수가 된다)
 */
function niceMax(value: number): number {
    // 값이 없거나 아주 작을 때 0.2·0.4 같은 눈금이 뜨지 않도록 눈금 수만큼은 확보한다.
    if (value <= STEPS) return STEPS;

    const rough = value / STEPS;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].find((unit) => unit * magnitude >= rough) ?? 10;

    return step * magnitude * STEPS;
}

interface TerminalChartProps {
    rsltList: DsbdRsltDto[];
    /** 피크 시간대 — 세로 막대로 표시 */
    peakIndex: number;
}

/**
 * 터미널 패널의 큰 차트 — 시간대별 대기인원 예측/실적.
 *
 * 색과 선 모양은 범례(예측=빨강 실선 / 실적=파랑 점선)에 맞춘다.
 */
export function TerminalChart({ rsltList, peakIndex }: TerminalChartProps) {
    // 그라디언트 id 는 문서에서 유일해야 한다. 패널이 둘이라 useId 로 나눈다.
    const gid = useId().replace(/:/g, '');

    const max = niceMax(
        Math.max(1, ...rsltList.map((r) => Math.max(r.fcstWtngPsgCnt, r.wtngPsgCnt))),
    );

    const x = (index: number) => X0 + index * X_STEP;
    const y = (value: number) => BASE_Y - (Math.min(value, max) / max) * PLOT_H;
    const points = (pick: (rslt: DsbdRsltDto) => number) =>
        rsltList.map((rslt, i) => `${x(i)},${y(pick(rslt)).toFixed(1)}`).join(' ');

    const fcstPoints = points((rslt) => rslt.fcstWtngPsgCnt);
    const rsltPoints = points((rslt) => rslt.wtngPsgCnt);

    /** 위(최댓값) → 아래(0) 순서의 눈금 값 */
    const ticks = Array.from({ length: STEPS + 1 }, (_, i) => (max / STEPS) * (STEPS - i));

    return (
        <svg viewBox="0 0 430 190" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#ff8f8f" />
                    <stop offset=".45" stopColor="#ff1a1a" />
                    <stop offset="1" stopColor="#ffa3a3" />
                </linearGradient>
            </defs>

            {/* 가로 눈금선 — 맨 아래(0) 선은 x축 라벨과 겹쳐 긋지 않는다 */}
            <g stroke="#eceff5" strokeWidth="1">
                {ticks.slice(0, STEPS).map((_, i) => (
                    <line key={i} x1="36" y1={TOP_Y + i * 25} x2="424" y2={TOP_Y + i * 25} />
                ))}
            </g>

            <g fontSize="11" fill="#9aa3b2" textAnchor="end" fontFamily="Pretendard, sans-serif">
                {ticks.map((tick, i) => (
                    <text key={i} x="28" y={TOP_Y + i * 25 + 4}>
                        {formatCount(Math.round(tick))}
                    </text>
                ))}
            </g>

            {rsltList.length > 0 && (
                <>
                    <rect
                        className="peakbar"
                        x={x(peakIndex) - 9.5}
                        y={TOP_Y}
                        width="19"
                        height={PLOT_H - 25}
                        fill={`url(#${gid})`}
                    />
                    <polyline
                        className="ln-r"
                        points={fcstPoints}
                        fill="none"
                        stroke="#f43f3f"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <polyline
                        className="ln-b"
                        points={rsltPoints}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        strokeLinejoin="round"
                    />
                    <g fill="#3b82f6">
                        {rsltList.map((rslt, i) => (
                            <circle key={rslt.time} cx={x(i)} cy={y(rslt.wtngPsgCnt)} r="2.7" />
                        ))}
                    </g>
                    <g fill="#f43f3f">
                        {rsltList.map((rslt, i) => (
                            <circle key={rslt.time} cx={x(i)} cy={y(rslt.fcstWtngPsgCnt)} r="2.7" />
                        ))}
                    </g>
                </>
            )}

            <g fontSize="11" fill="#9aa3b2" textAnchor="middle" fontFamily="Pretendard, sans-serif">
                {rsltList.map((rslt, i) =>
                    i % AXIS_STEP === 0 || i === rsltList.length - 1 ? (
                        <text key={rslt.time} x={x(i)} y="172">
                            {Number(rslt.time.slice(0, 2))}H
                        </text>
                    ) : null,
                )}
            </g>
        </svg>
    );
}
