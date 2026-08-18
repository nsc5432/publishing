import './monitoring.css';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { monitoringService } from '@/api/pm/services/monitoring.service';
import { unwrap } from '@/api/pm/result';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import type { ApiError } from '@/types/api.types';
import { HistoryTable } from './components/HistoryTable';
import { MonitoringGnb } from './components/MonitoringGnb';
import { StatCards } from './components/StatCards';
import { useMonitoring, type MonitoringQuery } from './hooks/useMonitoringData';
import { defaultRange, TITLE, toDateTime } from './options';
import type { HistoryRow, RangeCondition, StatusFilter } from './types';

function filterByStatus(rows: HistoryRow[], filter: StatusFilter): HistoryRow[] {
    return filter === 'all' ? rows : rows.filter((row) => row.status === filter);
}

const DETAIL_FAIL = '시뮬레이션 결과를 불러오지 못했습니다.';
const DASHBOARD_PATH = '/rui/pm/daily-smlt/dashboard';

/** 조회 조건 → 서버가 받는 기간 (yyyyMMddHHmm) */
function toQuery(range: RangeCondition): MonitoringQuery {
    return {
        bgnDt: toDateTime(range.startDate, range.startHour, range.startMinute),
        endDt: toDateTime(range.endDate, range.endHour, range.endMinute),
    };
}

/**
 * PM 예측관리 / 시뮬레이션 모니터링.
 *
 * 조회 기간(시작 ~ 종료 일시)으로 상단 KPI 와 이력을 함께 부른다.
 * 시/분 선택은 조회 버튼을 눌러야 반영된다.
 */
function Monitoring() {
    usePageScope('monitoring');
    const navigate = useNavigate();

    const [range, setRange] = useState<RangeCondition>(defaultRange);
    // 조회 버튼으로 확정된 조건 — 최초 진입은 기본 기간으로 한 번 조회한다.
    const [query, setQuery] = useState<MonitoringQuery>(() => toQuery(defaultRange()));
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const { data, error } = useMonitoring(query);

    useErrorAlert(error);

    const handleSearch = () => {
        setQuery(toQuery(range));
        setStatusFilter('all');
    };

    const standardRows = useMemo(
        () => filterByStatus(data?.history.standard ?? [], statusFilter),
        [data, statusFilter],
    );
    const userRows = useMemo(
        () => filterByStatus(data?.history.user ?? [], statusFilter),
        [data, statusFilter],
    );

    /**
     * 결과 보기 — 그 시뮬레이션의 대시보드로 간다.
     *
     * 표준/사용자 두 그리드가 같은 핸들러를 쓴다. 어느 쪽인지는 이력 상세의 `smltType` 이
     * 알려 주므로 행이 어느 표에서 왔는지 따로 넘기지 않아도 된다.
     */
    const handleView = (row: HistoryRow) => {
        monitoringService
            .getExecDetail(row.smltId)
            .then((dto) => unwrap(dto, DETAIL_FAIL))
            .then((execDetail) => {
                const query = new URLSearchParams({
                    smltId: execDetail.smltId,
                    smltType: execDetail.smltType,
                    ymd: execDetail.ymd,
                    tmnlId: execDetail.tmnlId,
                });

                navigate(`${DASHBOARD_PATH}?${query.toString()}`);
            })
            .catch((err: ApiError) => {
                dialog
                    .alert({ title: '조회 실패', description: err?.message || DETAIL_FAIL })
                    .catch(() => {});
            });
    };

    return (
        <>
            <MonitoringGnb
                title={TITLE}
                range={range}
                onChange={setRange}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb />

                <main className="content">
                    <StatCards
                        cards={data?.stats ?? []}
                        activeFilter={statusFilter}
                        onFilterChange={setStatusFilter}
                    />

                    <div className="history">
                        <HistoryTable kind="standard" rows={standardRows} onView={handleView} />
                        <HistoryTable kind="user" rows={userRows} onView={handleView} />
                    </div>
                </main>
            </div>
        </>
    );
}

export default Monitoring;
