import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { ECElementEvent } from 'echarts/core';
import { echarts, ReactEChartsCore, type EChartsInstance, type EChartsOption } from '@/lib/echarts';

export interface EChartProps {
    option: EChartsOption;
    className?: string;
    style?: CSSProperties;
    onClick?: (params: ECElementEvent) => void;
    onChartReady?: (chart: EChartsInstance) => void;
}

const FILL: CSSProperties = { width: '100%', height: '100%' };

const POINTER_EVENT_TYPES = [
    'pointerdown',
    'pointerup',
    'pointermove',
    'pointerout',
    'mousedown',
    'mouseup',
    'mousemove',
    'mouseout',
    'click',
    'dblclick',
    'contextmenu',
    'wheel',
] as const;

// 조상에 CSS zoom 이 걸리면(요약보기 화면 축소) 브라우저의 offsetX 가 레이아웃 px 와 어긋나 zrender 의 hover · 클릭 위치가 밀린다.
function toLayoutOffset(event: Event) {
    const dom = event.currentTarget as HTMLElement;
    const rect = dom.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = dom.offsetWidth / rect.width;
    const scaleY = dom.offsetHeight / rect.height;
    if (Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001) return;

    const { clientX, clientY } = event as MouseEvent;
    Object.defineProperty(event, 'offsetX', { configurable: true, value: (clientX - rect.left) * scaleX });
    Object.defineProperty(event, 'offsetY', { configurable: true, value: (clientY - rect.top) * scaleY });
}

export function EChart({ option, className, style, onClick, onChartReady }: EChartProps) {
    const clickRef = useRef(onClick);
    const chartReadyRef = useRef(onChartReady);

    const handleChartReady = useCallback((chart: EChartsInstance) => {
        const dom = chart.getDom();
        for (const type of POINTER_EVENT_TYPES) dom.addEventListener(type, toLayoutOffset, { capture: true, passive: true });
        chartReadyRef.current?.(chart);
    }, []);

    useEffect(() => {
        clickRef.current = onClick;
        chartReadyRef.current = onChartReady;
    }, [onClick, onChartReady]);

    const events = useMemo(() => ({ click: (params: ECElementEvent) => clickRef.current?.(params) }), []);

    return (
        <ReactEChartsCore
            echarts={echarts}
            option={option}
            notMerge
            lazyUpdate
            className={className}
            style={style ? { ...FILL, ...style } : FILL}
            onEvents={events}
            onChartReady={handleChartReady}
        />
    );
}
