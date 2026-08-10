import './departureHall.css';
import { useEffect, useState } from 'react';
// 도면 배경은 맵형태보기와 같은 파일이다 (T1: terminal1-icon / T2: terminal2-plan)
import { Terminal1Icon, Terminal2Plan } from '@/components/icons';
import { Lnb } from '@/components/lnb';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import { formatYmd, todayYmd } from '@/modules/pm/pages/dashboard/format';
import { useBaseInfo } from '@/modules/pm/pages/dashboard/hooks/useBaseInfo';
import { CongestionNotice } from './components/CongestionNotice';
import { DepChartView } from './components/DepChartView';
import { DepMapView } from './components/DepMapView';
import { DepTableView } from './components/DepTableView';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { ViewSwitch } from './components/ViewSwitch';
import {
    EMPTY_DEP_MAP,
    EMPTY_NOTICE,
    EMPTY_TREND,
    useDepHall,
    useDepHallTrend,
    type DepHallQuery,
} from './hooks/useDepHallData';
import { useTimeline } from './hooks/useTimeline';
import type { DepGateMarker, TerminalKind, ViewMode } from './types';

/* 메뉴 구성은 화면 공용(@/components/lnb)이라 여기서는 활성 항목만 지정한다. */
const DEFAULT_NAV_BOTTOM = 'departure';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 출국장.
 *
 * 화면에 들어오면 기준 정보(getBaseInfo)로 시뮬레이션 ID 를 받고,
 * 터미널·타임라인 시각을 조회 조건으로 본문(getDepHall)을 부른다.
 * 맵 · 표 · 차트 세 보기가 같은 조회 조건을 공유하므로 전환은 표시 방식만 바꾼다.
 */
function DepartureHall() {
    usePageScope('departureHall');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [view, setView] = useState<ViewMode>('map');
    const [activeDepGate, setActiveDepGate] = useState<DepGateMarker | null>(null);
    const timeline = useTimeline();

    // 조회 조건 — 터미널·타임라인 시각이 바뀌면 그대로 다시 조회한다.
    const [query, setQuery] = useState<DepHallQuery | null>(null);

    useEffect(() => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal, hhmm: timeline.hhmm });
    }, [baseInfo, terminal, timeline.hhmm]);

    const { data: depHall, error: depHallError } = useDepHall(query);
    const { data: trend, error: trendError } = useDepHallTrend(baseInfo?.smltId ?? '', terminal);

    // 조회가 여러 갈래라 먼저 걸린 사유 하나만 알린다 (같은 실패로 알럿이 겹치지 않게).
    const error = baseError || depHallError || trendError;

    useEffect(() => {
        if (!error) return;

        dialog.alert({ title: '조회 실패', description: error }).catch(() => {
            // 다이얼로그를 못 띄우는 상황까지 화면이 끌려갈 이유는 없다 (콘솔에 이미 남는다).
        });
    }, [error]);

    const mapData = depHall?.map ?? EMPTY_DEP_MAP;
    const notice = depHall?.notice ?? EMPTY_NOTICE;
    const MapPlan = terminal === 'T1' ? Terminal1Icon : Terminal2Plan;

    const handleTerminalChange = (kind: TerminalKind) => {
        setTerminal(kind);
        setActiveDepGate(null);
    };

    const handleSearch = () => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal, hhmm: timeline.hhmm });
    };

    return (
        <div className="wrap">
            <Header
                baseDate={formatYmd(baseInfo?.ymd ?? '')}
                terminal={terminal}
                onTerminalChange={handleTerminalChange}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb defaultBottom={DEFAULT_NAV_BOTTOM} />

                <main className="container">
                    <CongestionNotice level={notice.level} items={notice.items} />

                    <section className={`dep-view dep-view--${view}`}>
                        {/* 도면 배경은 맵 보기에서만 드러난다 */}
                        {view === 'map' && (
                            <MapPlan
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
                                    data={mapData}
                                    activeId={activeDepGate?.id}
                                    onDepGateHover={setActiveDepGate}
                                />
                            )}

                            {view === 'table' && (
                                <DepTableView cards={mapData.cards} time={timeline.label} />
                            )}

                            {view === 'chart' && (
                                <DepChartView
                                    trend={trend ?? EMPTY_TREND}
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
