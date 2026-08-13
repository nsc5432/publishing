import './checkinCounter.css';
import { useCallback, useEffect, useState } from 'react';
import { Lnb } from '@/components/lnb';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { formatYmd, todayYmd } from '@/lib/format';
import { useTimeline } from '@/modules/pm/hooks/useTimeline';
import { Header } from './components/Header';
import { IslandStrip } from './components/IslandStrip';
import { IslandTable } from './components/IslandTable';
import { ResourceChart } from './components/ResourceChart';
import { SummaryBar } from './components/SummaryBar';
import { Timeline } from './components/Timeline';
import { ViewSwitch } from './components/ViewSwitch';
import { useChknCounter, type ChknCounterQuery } from './hooks/useChknCounterData';
import { TIMELINE_RANGE } from './timeline';
import type { TerminalKind, ViewMode } from './types';
import { EMPTY_CHKN_SLOT, EMPTY_RESOURCE } from './view';

/**
 * PM 예측관리 / 일일 시뮬레이션 결과 조회 — 체크인카운터.
 *
 * 구 메뉴의 `체크인카운터` 와 `셀프체크인/백드롭` 을 한 화면으로 합친 것이다.
 * 둘은 서로 다른 시설이 아니라 같은 아일랜드가 가진 자원의 종류라, 나눠 보면
 * "이 아일랜드가 지금 얼마나 버티는가" 를 두 화면을 오가며 맞춰 봐야 했다.
 *
 * 화면에 들어오면 기준 정보(getBaseInfo)로 시뮬레이션 ID 를 받고, 터미널을 조회 조건으로
 * 본문 하루치(getChknCounter)를 한 번에 받는다. 차트·표 두 보기와 타임라인이 같은 한 건을
 * 나눠 쓰므로 전환은 표시 방식만 바꾼다 (출국장 화면과 같은 규칙).
 */
function CheckinCounter() {
    usePageScope('checkinCounter');

    // 기준일자 — 최초 진입은 오늘. (달력 UI 가 붙으면 여기서 바꾼다)
    const [ymd] = useState(todayYmd);
    const { data: baseInfo, error: baseError } = useBaseInfo(ymd);

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [view, setView] = useState<ViewMode>('chart');
    const timeline = useTimeline(TIMELINE_RANGE);

    // 조회 조건 — 터미널이 바뀌면 그 터미널의 하루치를 다시 받는다.
    const [query, setQuery] = useState<ChknCounterQuery | null>(null);

    const applyQuery = useCallback(() => {
        if (!baseInfo) return;

        setQuery({ smltId: baseInfo.smltId, tmnlId: terminal });
    }, [baseInfo, terminal]);

    useEffect(applyQuery, [applyQuery]);

    const { data: chknDay, error: chknError } = useChknCounter(query);

    // 조회가 두 갈래라 먼저 걸린 사유 하나만 알린다 (같은 실패로 알럿이 겹치지 않게).
    const error = baseError || chknError;

    useErrorAlert(error);

    // 타임라인이 가리키는 시각의 값 — 받아 둔 하루치에서 자리만 옮긴다.
    const slot = chknDay?.slots[timeline.hhmm] ?? EMPTY_CHKN_SLOT;

    // 조건이 그대로여도 다시 눌러 최신 결과를 받아올 수 있도록 조회를 한 번 더 건다.
    const handleSearch = applyQuery;

    return (
        <div className="wrap">
            <Header
                baseDate={formatYmd(baseInfo?.ymd ?? '')}
                terminal={terminal}
                onTerminalChange={setTerminal}
                onSearch={handleSearch}
            />

            <div className="body">
                <Lnb />

                <main className="container">
                    <SummaryBar
                        summary={chknDay?.summary ?? []}
                        kpis={chknDay?.kpis ?? []}
                        notice={slot.notice}
                    />

                    <section className={`chkn-view chkn-view--${view}`}>
                        <ViewSwitch view={view} onChange={setView} />

                        <div className="chkn-view__body">
                            {view === 'chart' ? (
                                <>
                                    <ResourceChart
                                        resource={chknDay?.resource ?? EMPTY_RESOURCE}
                                        step={timeline.step}
                                        time={timeline.label}
                                    />
                                    <IslandStrip islands={slot.islands} time={timeline.label} />
                                </>
                            ) : (
                                <IslandTable islands={slot.islands} time={timeline.label} />
                            )}
                        </div>

                        <Timeline timeline={timeline} />
                    </section>
                </main>
            </div>
        </div>
    );
}

export default CheckinCounter;
