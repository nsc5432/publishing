import { useEffect, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { BlockChart } from '../../components/BlockChart';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour, toHourList } from '../../format';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import {
    BLOCK_COLORS,
    TERMINALS,
    enabledTerminals,
    type BlockItem,
    type SmltTabProps,
    type TerminalKind,
} from '../../types';
import { EditDock } from './components/EditDock';
import { ISLAND_BOOTHS, SIDE_BOOTHS } from './constants';
import type { CheckinIsland, TerminalCheckinCounter } from './types';
import {
    EMPTY_CHECKIN_COUNTER,
    assignedBoothCount,
    toBooths,
    toCheckinCounter,
    toSaveReq,
} from './view';

/** 터미널별 편집 상태 — 아일랜드 목록 전체가 편집 대상이다 */
type EditState = Record<TerminalKind, CheckinIsland[]>;

/**
 * 도크 편집값 — 변경을 눌러야 목록(EditState)에 반영된다.
 *
 * 도크는 화면에 하나뿐이라 편집 중인 터미널을 함께 들고 있다. 초점이 옮겨 가도
 * 편집값을 버리지 않고, 그 터미널로 돌아오면 편집하던 상태가 그대로 다시 보인다.
 */
interface DockState {
    terminal: TerminalKind;
    /** 편집 대상. null 이면 칩 줄만 띄운 상태(아직 아일랜드를 고르지 않았다) */
    draft: CheckinIsland | null;
    /** 편집 중인 아일랜드 문자. null 이면 신규(목록에 아직 없다) */
    target: string | null;
    selectedBooth: number | null;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };
const EMPTY_DOCK: DockState = { terminal: 'T1', draft: null, target: null, selectedBooth: null };
const FETCH_FAIL = '체크인 카운터 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '체크인 카운터 저장에 실패했습니다.';

/** 차트 세로 층수 — 아일랜드 13개(A~N, I 제외)가 다 열려도 기둥이 잘리지 않는다 */
const CHART_LEVELS = 13;
/** 층 높이 — 13층이 세로 예산(380~420px) 안에 들어가는 값 */
const CHART_ROW_H = 18;

/** 조회 함수는 렌더마다 새로 만들지 않도록 컴포넌트 밖에 둔다 */
const fetchChkn = (smltId: string, tmnlId: TerminalKind) =>
    userSmltService.getChknCounterInfo(smltId, tmnlId);

/** 블럭 차트 항목 — 블럭 1개가 아일랜드 1개다 */
function toBlockItems(islands: CheckinIsland[]): BlockItem[] {
    return islands.map((island) => ({
        label: island.label,
        color: island.color,
        ranges: island.ranges,
        size: assignedBoothCount(island),
        sides: (['L', 'R'] as const).filter((side) =>
            island.booths.some((booth) => booth.side === side && booth.airline),
        ),
    }));
}

/** 요약: 피크 카운터 = 시간대별 열린 부스 수의 최댓값 */
function peakBooths(islands: CheckinIsland[]): number {
    const boothsByHour: number[] = Array(24).fill(0);
    islands.forEach((island) => {
        toHourList(island.ranges).forEach((hour) => {
            const booths = assignedBoothCount(island);
            boothsByHour[hour] += booths;
        });
    });

    return Math.max(0, ...boothsByHour);
}

/** 미운영 칩을 눌렀을 때 — 그 아일랜드 문자로 빈 값을 만든다 */
function newIsland(terminalData: TerminalCheckinCounter, label: string): CheckinIsland {
    return {
        label,
        color: BLOCK_COLORS[terminalData.islandCodes.indexOf(label) % BLOCK_COLORS.length],
        ranges: [],
        // 부스 수는 배정정보에서 오지만 신규는 기준이 없으므로 36석 골격을 미배정으로 연다
        booths: toBooths([]),
        kiosk: 0,
        bagdrop: 0,
    };
}

/**
 * 체크인 카운터 탭
 */
export function CheckinCounterTab({
    smltIds,
    reloadKey,
    enabled,
    onToggleTerminal,
    focusTerminal,
    onFocusChange,
}: SmltTabProps) {
    const { data: fetched, error } = useTerminalData(
        smltIds,
        reloadKey,
        fetchChkn,
        toCheckinCounter,
        FETCH_FAIL,
    );
    const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);
    const [dock, setDock] = useState<DockState>(EMPTY_DOCK);

    useErrorAlert(error);

    // 조회 결과가 들어오면 편집 상태를 조회한 값으로 되돌린다.
    useEffect(() => {
        setEdit({ T1: fetched.T1?.islands ?? [], T2: fetched.T2?.islands ?? [] });
        setDock(EMPTY_DOCK);
    }, [fetched]);

    const enabledCount = enabledTerminals(enabled).length;
    /** 도크가 보는 터미널 = 편집 초점. 다른 터미널의 편집값은 그대로 두고 감춘다 */
    const focusData = fetched[focusTerminal] ?? EMPTY_CHECKIN_COUNTER;
    const focusIslands = edit[focusTerminal];
    const draft = dock.terminal === focusTerminal ? dock.draft : null;

    /**
     * 블럭 · 칩 클릭 — 운영 중이면 그 아일랜드를, 미운영이면 신규를 편집 대상으로 연다.
     * 꺼진 패널의 블럭은 눌리지 않으므로 여기 오는 터미널은 항상 켜져 있다.
     * (Ctrl 누적 선택은 STEP-1 스텝 4 에서 켠다)
     */
    const openIsland = (terminal: TerminalKind, label: string) => {
        onFocusChange(terminal);
        setDock((prev) => {
            // 이미 편집 중이면 값을 지킨다
            if (prev.terminal === terminal && prev.draft?.label === label) return prev;

            const island = edit[terminal].find((it) => it.label === label);
            const source = fetched[terminal] ?? EMPTY_CHECKIN_COUNTER;

            return {
                terminal,
                draft: island ?? newIsland(source, label),
                target: island ? label : null,
                selectedBooth: null,
            };
        });
    };

    const patchDraft = (next: Partial<CheckinIsland>) => {
        setDock((prev) => (prev.draft ? { ...prev, draft: { ...prev.draft, ...next } } : prev));
    };

    /** 도크 `변경` — 신규면 목록에 더하고, 기존이면 그 자리를 갈아 끼운다 */
    const handleConfirm = () => {
        const { terminal, draft: edited, target } = dock;
        if (!edited) return;

        setEdit((prev) => ({
            ...prev,
            [terminal]:
                target === null
                    ? [...prev[terminal], edited]
                    : prev[terminal].map((it) => (it.label === target ? edited : it)),
        }));
        setDock({ ...EMPTY_DOCK, terminal });
    };

    const handleSave = (terminal: TerminalKind) => {
        const smltId = smltIds[terminal];
        if (!smltId) return;

        runSave(
            userSmltService.saveChknCounterInfo(toSaveReq(smltId, terminal, edit[terminal])),
            SAVE_FAIL,
        );
    };

    /** 지도 보기 — 배치 마커를 받아 둔다 (도면 UI 는 아직 붙지 않았다) */
    const handleMapClick = (terminal: TerminalKind) => {
        const smltId = smltIds[terminal];
        if (!smltId) return;

        userSmltService
            .getFcltMap(smltId, terminal, 'CHKN')
            .then((dto) => console.log('[지도 보기]', dto.markerList))
            .catch(() => {
                // 지도는 보조 기능이라 실패해도 편집 흐름을 끊지 않는다 (콘솔에 이미 남는다).
            });
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = fetched[terminal] ?? EMPTY_CHECKIN_COUNTER;
                const panelIslands = edit[terminal];
                const on = enabled[terminal];

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        enabled={on}
                        focused={terminal === focusTerminal}
                        canDisable={enabledCount > 1}
                        onToggle={() => onToggleTerminal(terminal)}
                        onFocus={() => onFocusChange(terminal)}
                        kpis={panelData.kpis}
                        onMapClick={() => handleMapClick(terminal)}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">전체 카운터</span>
                                    <strong className="summary__value">{panelData.total}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영 아일랜드</span>
                                    <strong className="summary__value summary__value--accent">
                                        {panelIslands.length}
                                    </strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">피크 카운터</span>
                                    <strong className="summary__value summary__value--accent">
                                        {peakBooths(panelIslands)}
                                    </strong>
                                </div>
                            </>
                        }
                        footer={
                            <button
                                type="button"
                                className="btn btn--save"
                                onClick={() => handleSave(terminal)}
                            >
                                현재상태 저장
                            </button>
                        }
                    >
                        <BlockChart
                            items={toBlockItems(panelIslands)}
                            title="시간대별 운영 아일랜드"
                            unit="(단위: 아일랜드 수)"
                            unitNote={`1블럭 = 아일랜드 1개(${ISLAND_BOOTHS}석)`}
                            levels={CHART_LEVELS}
                            rowH={CHART_ROW_H}
                            unitSize={ISLAND_BOOTHS}
                            blockFontSize={12}
                            legend={panelIslands.map((island) => ({
                                label: island.label,
                                color: island.color,
                                note: `${assignedBoothCount(island)}석`,
                            }))}
                            line={panelData.wait}
                            selected={terminal === focusTerminal && draft ? [draft.label] : []}
                            onBlockSelect={(label) => openIsland(terminal, label)}
                            formatTip={(item, hour) => {
                                const one = item.sides?.length === 1 ? item.sides[0] : null;
                                const detail = one
                                    ? `${one} ${SIDE_BOOTHS}석 · ${one === 'L' ? 'R' : 'L'} 미운영`
                                    : `L ${SIDE_BOOTHS}석 · R ${SIDE_BOOTHS}석`;

                                return `아일랜드 ${item.label} · ${detail} · ${formatHour(hour)} ~ ${formatHour(hour + 1)}`;
                            }}
                            disabled={!on}
                        />
                    </TerminalPanel>
                );
            })}

            <EditDock
                terminal={focusTerminal}
                codes={focusData.islandCodes}
                islands={focusIslands}
                selected={draft ? [draft.label] : []}
                onSelect={(label) => openIsland(focusTerminal, label)}
                draft={draft}
                onPatch={patchDraft}
                airlines={focusData.airlines}
                selectedBooth={draft ? dock.selectedBooth : null}
                onSelectBooth={(no) => setDock((prev) => ({ ...prev, selectedBooth: no }))}
                onConfirm={handleConfirm}
                onCancel={() => setDock({ ...EMPTY_DOCK, terminal: focusTerminal })}
            />
        </>
    );
}
