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

function toQuery(range: RangeCondition): MonitoringQuery {
    return {
        bgnDt: toDateTime(range.startDate, range.startHour, range.startMinute),
        endDt: toDateTime(range.endDate, range.endHour, range.endMinute),
    };
}

function Monitoring() {
    usePageScope('monitoring');
    const navigate = useNavigate();

    const [range, setRange] = useState<RangeCondition>(defaultRange);
    const [query, setQuery] = useState<MonitoringQuery>(() => toQuery(defaultRange()));
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const { data, error, token } = useMonitoring(query);

    useErrorAlert(error, token);

    const handleSearch = () => {
        setQuery(toQuery(range));
        setStatusFilter('all');
    };

    const standardRows = useMemo(() => filterByStatus(data?.history.standard ?? [], statusFilter), [data, statusFilter]);
    const userRows = useMemo(() => filterByStatus(data?.history.user ?? [], statusFilter), [data, statusFilter]);

    const handleView = (row: HistoryRow) => {
        monitoringService
            .getExecDetail(row.smltId)
            .then((dto) => unwrap(dto, DETAIL_FAIL))
            .then((execDetail) => {
                const dashboardParams = new URLSearchParams({
                    smltId: execDetail.smltId,
                    smltType: execDetail.smltType,
                    ymd: execDetail.ymd,
                    tmnlId: execDetail.tmnlId,
                });

                navigate(`${DASHBOARD_PATH}?${dashboardParams.toString()}`);
            })
            .catch((error: ApiError) => {
                dialog.alert({ title: '조회 실패', description: error?.message || DETAIL_FAIL }).catch(() => {});
            });
    };

    return (
        <>
            <MonitoringGnb title={TITLE} range={range} onChange={setRange} onSearch={handleSearch} />

            <div className="body">
                <Lnb />

                <main className="content">
                    <StatCards cards={data?.stats ?? []} activeFilter={statusFilter} onFilterChange={setStatusFilter} />

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
