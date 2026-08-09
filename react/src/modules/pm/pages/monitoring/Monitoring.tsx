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
 */
function Monitoring() {
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
