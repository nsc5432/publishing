import './monitoring.css';
import { useState } from 'react';
import { Lnb } from '@/components/lnb';
import { usePageScope } from '@/hooks/usePageScope';
import { HistoryTable } from './components/HistoryTable';
import { MonitoringGnb } from './components/MonitoringGnb';
import { StatCards } from './components/StatCards';
import { HEADER, HISTORY, STATS } from './mock';
import type { HistoryRow, RangeCondition } from './types';

/**
 * PM 예측관리 / 시뮬레이션 모니터링.
 * 시안(4_시뮬레이션_모니터링.png) 기준 — 조회 기간 안의 수행 현황(KPI 4개)과
 * 표준 / 사용자 시뮬레이션 이력을 좌우로 나란히 보여준다.
 *
 * 셸(GNB → .body → LNB + 본문)은 사용자 시뮬레이션 화면과 같은 구성이다.
 */
function Monitoring() {
    // monitoring.css 를 이 화면에서만 적용시킨다 (hooks/usePageScope 참고)
    usePageScope('monitoring');

    const [range, setRange] = useState<RangeCondition>(HEADER.range);

    const handleSearch = () => {
        // 실제 조회 연동 전: 현재 조회 조건만 확인한다.
        console.log('[조회]', range);
    };

    const handleView = (row: HistoryRow) => {
        console.log('[결과 보기]', row);
    };

    return (
        <>
            <MonitoringGnb
                title={HEADER.title}
                range={range}
                onChange={setRange}
                onSearch={handleSearch}
            />

            <div className="body">
                {/* 이 화면에는 하단 보기 선택(요약/맵…)에 해당하는 항목이 없다 */}
                <Lnb bottomItems={[]} />

                <main className="content">
                    <StatCards cards={STATS} />

                    <div className="history">
                        <HistoryTable
                            kind="standard"
                            rows={HISTORY.standard}
                            onView={handleView}
                        />
                        <HistoryTable kind="user" rows={HISTORY.user} onView={handleView} />
                    </div>
                </main>
            </div>
        </>
    );
}

export default Monitoring;
