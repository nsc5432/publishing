import type { HistoryKind, HistoryRow, RangeCondition, StatCard } from './types';

/**
 * 시뮬레이션 모니터링 목업 데이터.
 * 실제 API 연동 전, 화면과 조회 조건 동작을 확인하기 위한 정적 데이터.
 * 컴포넌트는 이 파일의 데이터를 소비하고 상호작용만 상태로 관리한다.
 */

/* ================= 헤더 / 조회 조건 ================= */

export const HEADER = {
    title: 'PM 예측관리 / 시뮬레이션 모니터링',
    range: {
        startDate: '2026/07/23',
        startHour: '10',
        startMinute: '00',
        endDate: '2026/07/23',
        endHour: '14',
        endMinute: '00',
    } as RangeCondition,
};

/** 00 ~ 23 시 */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
/** 10분 단위 */
export const MINUTE_OPTIONS = ['00', '10', '20', '30', '40', '50'];

/* ================= 상단 KPI ================= */

export const STATS: StatCard[] = [
    { id: 'total', icon: 'layers', label: '전체 수행', values: [{ value: '50', unit: '건' }] },
    {
        id: 'done',
        icon: 'checkCircle',
        label: '완료',
        values: [{ value: '13', unit: '건' }],
        tone: 'teal',
    },
    { id: 'running', icon: 'spinner', label: '진행중', values: [{ value: '37', unit: '건' }] },
    {
        id: 'avg',
        icon: 'clock',
        label: '평균 수행시간',
        values: [
            { value: '15', unit: '분' },
            { value: '00', unit: '초' },
        ],
    },
];

/* ================= 시뮬레이션 이력 ================= */

/** 시안은 모든 줄이 같은 값이고 3·4번만 진행중이다. 스크롤 확인을 위해 30줄을 만든다. */
function buildRows(runningNos: number[]): HistoryRow[] {
    return Array.from({ length: 30 }, (_, i) => {
        const no = i + 1;
        return {
            no,
            dept: '시설관리팀',
            name: '김민수',
            startAt: '2026.07.23 13:00',
            endAt: '2026.07.23 13:15',
            duration: 15,
            status: runningNos.includes(no) ? ('running' as const) : ('done' as const),
        };
    });
}

export const HISTORY: Record<HistoryKind, HistoryRow[]> = {
    standard: buildRows([3, 4, 19, 20]),
    user: buildRows([3, 4, 22]),
};
