import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { ECElementEvent } from 'echarts/core';
import { echarts, ReactEChartsCore, type EChartsOption } from '@/lib/echarts';

export interface EChartProps {
    option: EChartsOption;
    className?: string;
    style?: CSSProperties;
    /** 차트 요소 클릭 (블럭 차트의 블럭 선택 등) */
    onClick?: (params: ECElementEvent) => void;
}

/** 컨테이너를 꽉 채우는 것이 이 프로젝트 차트들의 기본값이다. */
const FILL: CSSProperties = { width: '100%', height: '100%' };

/**
 * ECharts 공통 래퍼.
 *
 * 옵션을 갈아끼울 때 `notMerge` 를 켠다. 시리즈 개수가 줄어드는 경우(예: 출국장 하나가
 * 운영 종료) 병합 모드에서는 이전 시리즈가 남아 유령 선이 그려진다.
 */
export function EChart({ option, className, style, onClick }: EChartProps) {
    /**
     * 차트에 넘기는 events 는 마운트 때 한 번만 만들고, 실제 핸들러는 ref 로 갈아 끼운다.
     *
     * echarts-for-react 의 init 은 'finished' 이벤트를 기다리는 비동기다. 그런데 바인딩할
     * onEvents 는 await 이전에 캡처해 두고, await 중에 들어온 바인딩은 곧 버려질 임시
     * 인스턴스에 붙는다. 그래서 참조가 바뀌는 핸들러를 그대로 넘기면 조회 전(빈 데이터)
     * 클로저가 차트에 그대로 굳어, 클릭해도 아무 일도 일어나지 않는다.
     * 참조를 고정하면 리바인딩 자체가 없어지므로 이 경합에서 벗어난다.
     */
    const clickRef = useRef(onClick);
    useEffect(() => {
        clickRef.current = onClick;
    }, [onClick]);

    const events = useMemo(
        () => ({ click: (params: ECElementEvent) => clickRef.current?.(params) }),
        [],
    );

    return (
        <ReactEChartsCore
            echarts={echarts}
            option={option}
            notMerge
            lazyUpdate
            className={className}
            style={style ? { ...FILL, ...style } : FILL}
            onEvents={events}
        />
    );
}
