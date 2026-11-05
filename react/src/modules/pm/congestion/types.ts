/** worse = 평균보다 나쁨, better = 평균보다 좋음, even = 평균 수준이거나 비교 불가 */
export type CongestionStatTone = 'worse' | 'better' | 'even';

export interface CongestionStatCmpr {
    /** 예: 평균보다 8초 / 평균 수준 / 전체의 25% */
    text: string;
    /** 평균보다 값이 크면 up */
    arrow: 'up' | 'down' | null;
    tone: CongestionStatTone;
    /** 마우스를 올리면 보이는 비교 기준. 예: 아일랜드 평균 30초 · 8초 높음 */
    title: string;
}

export interface CongestionStat {
    /** terminalMap.css 의 .ico-wait-people 등 */
    ico: 'wait-people' | 'wait-time' | 'done-people' | 'done-time';
    label: string;
    value: string;
    unit: string;
    /** 강조(빨강) 표기 */
    point?: boolean;
    cmpr: CongestionStatCmpr;
}
