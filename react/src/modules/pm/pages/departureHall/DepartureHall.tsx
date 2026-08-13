import './departureHall.css';
import { useCallback, useEffect, useState } from 'react';
// 도면 배경은 맵형태보기와 같은 파일이다 (T1: terminal1-icon / T2: terminal2-plan)
import { Terminal1Icon, Terminal2Plan } from '@/components/icons';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { formatYmd, todayYmd } from '@/lib/format';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { CongestionNotice } from './components/CongestionNotice';
import { DepChartView } from './components/DepChartView';
import { DepMapView } from './components/DepMapView';
import { DepTableView } from './components/DepTableView';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { ViewSwitch } from './components/ViewSwitch';
import { useDepHall, type DepHallQuery } from './hooks/useDepHallData';
import { EMPTY_DEP_SLOT, EMPTY_TREND } from './view';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { TIMELINE_RANGE } from './timeline';
import type { DepGateMarker, TerminalKind, ViewMode } from './types';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 출국장.
 *
 * 화면에 들어오면 기준 정보(getBaseInfo)로 시뮬레이션 ID 를 받고,
 * 터미널을 조회 조건으로 본문 하루치(getDepHall)를 한 번에 받는다.
 * 맵 · 표 · 차트 세 보기와 타임라인이 같은 한 건을 나눠 쓰므로 전환은 표시 방식만 바꾼다.
 */
function DepartureHall() {
    usePageScope('departureHall');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [view, setView] = useState<ViewMode>('map');
    const [activeDepGate, setActiveDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline(TIMELINE_RANGE);

    // 조회 조건 — 터미널이 바뀌면 그 터미널의 하루치를 다시 받는다.
    const [query, setQuery] = useState<DepHallQuery | null>(null);

    const applyQuery = useCallback(() => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    }, [baseInfo, terminal]);

    useEffect(applyQuery, [applyQuery]);

    const { data: depDay, error: depHallError } = useDepHall(query);

    // 조회가 두 갈래라 먼저 걸린 사유 하나만 알린다 (같은 실패로 알럿이 겹치지 않게).
    const error = baseError || depHallError;

    useErrorAlert(error);

    // 타임라인이 가리키는 시각의 값 — 받아 둔 하루치에서 자리만 옮긴다.
    const slot = depDay?.slots[timeline.hhmm] ?? EMPTY_DEP_SLOT;
    const FloorPlan = terminal === 'T1' ? Terminal1Icon : Terminal2Plan;

    const handleTerminalChange = (nextTerminal: TerminalKind) => {
        setTerminal(nextTerminal);
        setActiveDepGate(null);
    };

    // 조건이 그대로여도 다시 눌러 최신 결과를 받아올 수 있도록 조회를 한 번 더 건다.
    const handleSearch = applyQuery;

    return (
        <div className="wrap">
            <Header
                baseDate={formatYmd(baseInfo?.ymd ?? '')}
                terminal={terminal}
                onTerminalChange={handleTerminalChange}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb />

                <main className="container">
                    <CongestionNotice level={slot.notice.level} items={slot.notice.items} />

                    <section className={`dep-view dep-view--${view}`}>
                        {/* 도면 배경은 맵 보기에서만 드러난다 */}
                        {view === 'map' && (
                            <FloorPlan
                                className="dep-view__bg"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                                focusable="false"
                            />
                        )}

                        <ViewSwitch view={view} onChange={setView} />

                        <div className="dep-view__body">
                            {view === 'map' && (
                                <DepMapView
                                    data={slot.map}
                                    activeId={activeDepGate?.id}
                                    onDepGateHover={setActiveDepGate}
                                />
                            )}

                            {view === 'table' && (
                                <DepTableView cards={slot.map.cards} time={timeline.label} />
                            )}

                            {view === 'chart' && (
                                <DepChartView
                                    trend={depDay?.trend ?? EMPTY_TREND}
                                    step={timeline.step}
                                    time={timeline.label}
                                />
                            )}
                        </div>

                        <Timeline timeline={timeline} />
                    </section>
                </main>
            </div>
        </div>
    );
}

export default DepartureHall;
