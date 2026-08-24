import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EChartsOption } from '@/lib/echarts';
import { EChart } from '@/components/charts/EChart';
import type { OperCard } from '../types';

interface OperCardsProps {
    cards: OperCard[];
}

/* 원본 퍼블리싱: 120x120 viewBox 에 반지름 52, 굵기 7 의 링.
   운영 구간은 0시(12시 방향)에서 끝나고, 그 앞쪽으로 rate% 만큼 뻗는다. */
const VIEWBOX = 120;
const RING_R = 52;
const RING_W = 7;
const RADIUS = `${((RING_R / (VIEWBOX / 2)) * 100).toFixed(1)}%`;
/** 12시 방향 — ECharts 는 3시가 0°, 반시계가 + 다 */
const TOP_ANGLE = -270;
const TRACK_COLOR = '#e5e9f0';
const VALUE_COLOR = '#2f7ff0';

export function OperCards({ cards }: OperCardsProps) {
    const gridStyle = { '--oper-cols': cards.length } as CSSProperties;

    return (
        <div className="oper-cards" style={gridStyle}>
            {cards.map((card) =>
                card.empty ? (
                    <div key={card.id} className="oper-card oper-card--empty" aria-hidden="true" />
                ) : (
                    <div key={card.id} className={`oper-card${card.dim ? ' is-dim' : ''}`}>
                        <span className="oper-card__gate" aria-label={`출국장 ${card.dptgtNo}`}>
                            {card.dptgtNo}
                        </span>
                        <Donut card={card} />
                    </div>
                ),
            )}
        </div>
    );
}

/** 컨테이너 한 변(px) — 링 굵기를 원본 비율대로 키우려면 실제 크기가 필요하다 */
function useBoxSize<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [size, setSize] = useState(0);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new ResizeObserver(([entry]) => setSize(entry.contentRect.width));
        observer.observe(element);
        setSize(element.getBoundingClientRect().width);

        return () => observer.disconnect();
    }, []);

    return [ref, size] as const;
}

function Donut({ card }: { card: OperCard }) {
    const [ref, size] = useBoxSize<HTMLDivElement>();
    const rate = Math.min(Math.max(card.rate, 0), 100);

    const option = useMemo<EChartsOption>(() => {
        const ringWidth = (size * RING_W) / VIEWBOX;
        const baseGauge = {
            type: 'gauge' as const,
            silent: true,
            center: ['50%', '50%'] as [string, string],
            radius: RADIUS,
            min: 0,
            max: 1,
            pointer: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: { show: false },
            title: { show: false },
        };

        return {
            animation: false,
            series: [
                {
                    ...baseGauge,
                    // 바탕 링 — 하루 24시간 (12시 방향에서 한 바퀴)
                    startAngle: 90,
                    endAngle: TOP_ANGLE,
                    axisLine: { lineStyle: { width: ringWidth, color: [[1, TRACK_COLOR]] } },
                    data: [{ value: 0 }],
                },
                {
                    ...baseGauge,
                    // 운영 구간 — 0시(12시 방향)에서 끝나도록 뒤에서부터 채운다
                    startAngle: rate * 3.6 + TOP_ANGLE,
                    endAngle: TOP_ANGLE,
                    axisLine: { lineStyle: { width: ringWidth, color: [[1, 'transparent']] } },
                    progress: {
                        show: true,
                        roundCap: true,
                        width: ringWidth,
                        itemStyle: { color: VALUE_COLOR },
                    },
                    data: [{ value: 1 }],
                },
            ],
        };
    }, [rate, size]);

    return (
        <div className="donut" ref={ref}>
            <EChart className="donut__chart" option={option} />
            <span className="donut__mark donut__mark--t">0시</span>
            <span className="donut__mark donut__mark--r">6시</span>
            <span className="donut__mark donut__mark--b">12시</span>
            <span className="donut__mark donut__mark--l">18시</span>
            <div className="donut__info">
                <strong className="donut__time">{card.time}</strong>
                <span className="donut__desc">{card.desc}</span>
            </div>
        </div>
    );
}
