import './monitoring.css';
import { useState } from 'react';
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
import type { HistoryRow, RangeCondition } from './types';

const DETAIL_FAIL = '시뮬레이션 결과를 불러오지 못했습니다.';

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

    const [range, setRange] = useState<RangeCondition>(defaultRange);
    // 조회 버튼으로 확정된 조건 — 최초 진입은 기본 기간으로 한 번 조회한다.
    const [query, setQuery] = useState<MonitoringQuery>(() => toQuery(defaultRange()));

    const { data, error } = useMonitoring(query);

    useErrorAlert(error);

    const handleSearch = () => setQuery(toQuery(range));

    const handleView = (row: HistoryRow) => {
        monitoringService
            .getExecDetail(row.smltId)
            .then((dto) => unwrap(dto, DETAIL_FAIL))
            .then((execDetail) => {
                // 결과 화면 이동은 아직 정해지지 않았다. 받은 값만 남긴다.
                console.log('[결과 보기]', execDetail);
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
                <Lnb bottomItems={[]} />

                <main className="content">
                    <StatCards cards={data?.stats ?? []} />

                    <div className="history">
                        <HistoryTable
                            kind="standard"
                            rows={data?.history.standard ?? []}
                            onView={handleView}
                        />
                        <HistoryTable
                            kind="user"
                            rows={data?.history.user ?? []}
                            onView={handleView}
                        />
                    </div>
                </main>
            </div>
        </>
    );
}

export default Monitoring;
