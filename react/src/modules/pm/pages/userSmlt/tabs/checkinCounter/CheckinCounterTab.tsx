import { useEffect, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { BlockChart } from '../../components/BlockChart';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour, toHourList } from '../../format';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { BLOCK_COLORS, TERMINALS, type BlockItem, type TerminalKind } from '../../types';
import { EditDock } from './components/EditDock';
import { ISLAND_BOOTHS, SIDE_BOOTHS } from './constants';
import type { CheckinIsland, TerminalCheckinCounter } from './types';
import { EMPTY_CHECKIN_COUNTER, toCheckinCounter, toSaveReq, toSide } from './view';

interface CheckinCounterTabProps {
    smltIds: Record<TerminalKind, string>;
    reloadKey: number;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 — 아일랜드 목록 전체가 편집 대상이다 */
type EditState = Record<TerminalKind, CheckinIsland[]>;

/** 도크 편집값 — 변경을 눌러야 목록(EditState)에 반영된다 */
interface DockState {
    /** 편집 대상. null 이면 칩 줄만 띄운 상태(아직 아일랜드를 고르지 않았다) */
    draft: CheckinIsland | null;
    /** 편집 중인 아일랜드 문자. null 이면 신규(목록에 아직 없다) */
    target: string | null;
    selectedBooth: number | null;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };

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
        size: island.booths.length,
        // 부스가 있는 면만 — 한쪽만 있으면 BlockChart 가 블럭을 위/아래로 가른다
        sides: (['L', 'R'] as const).filter((side) =>
            island.booths.some((booth) => booth.side === side),
        ),
    }));
}

/** 요약: 피크 카운터 = 시간대별 열린 부스 수의 최댓값 */
function peakBooths(islands: CheckinIsland[]): number {
    const boothsByHour: number[] = Array(24).fill(0);
    islands.forEach((island) => {
        toHourList(island.ranges).forEach((hour) => {
            boothsByHour[hour] += island.booths.length;
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
        booths: Array.from({ length: ISLAND_BOOTHS }, (_, i) => ({
            no: i + 1,
            side: toSide(i + 1),
            airline: '',
        })),
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
    activeTerminal,
    onTerminalChange,
}: CheckinCounterTabProps) {
    const { data: fetched, error } = useTerminalData(
        smltIds,
        reloadKey,
        fetchChkn,
        toCheckinCounter,
        FETCH_FAIL,
    );
    const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);
    const [dock, setDock] = useState<DockState | null>(null);

    useErrorAlert(error);

    // 조회 결과가 들어오면 편집 상태를 조회한 값으로 되돌린다.
    useEffect(() => {
        setEdit({ T1: fetched.T1?.islands ?? [], T2: fetched.T2?.islands ?? [] });
        setDock(null);
    }, [fetched]);

    const data = fetched[activeTerminal] ?? EMPTY_CHECKIN_COUNTER;
    const activeIslands = edit[activeTerminal];
    /** 차트·칩 줄이 함께 쓰는 선택 상태 (다중 선택은 아직 열지 않았다) */
    const selected = dock?.draft ? [dock.draft.label] : [];

    /**
     * 칩 줄만 띄운 채로 도크를 연다.
     * 하루 종일 닫힌 아일랜드는 차트에 블럭이 없어 클릭할 대상이 없으므로 입구가 하나 필요하다.
     */
    const openDock = () => {
        setDock((prev) => prev ?? { draft: null, target: null, selectedBooth: null });
    };

    /** 편집 중이던 도크는 터미널이 바뀌면 닫는다 (편집값은 터미널별로 남는다) */
    const handleTerminalChange = (terminal: TerminalKind) => {
        setDock(null);
        onTerminalChange(terminal);
    };

    /**
     * 블럭 · 칩 클릭 — 운영 중이면 그 아일랜드를, 미운영이면 신규를 편집 대상으로 연다.
     * (Ctrl 누적 선택은 STEP-1 스텝 4 에서 켠다)
     */
    const openIsland = (label: string) => {
        setDock((prev) => {
            if (prev?.draft?.label === label) return prev; // 이미 편집 중이면 값을 지킨다

            const island = activeIslands.find((island) => island.label === label);

            return {
                draft: island ?? newIsland(data, label),
                target: island ? label : null,
                selectedBooth: null,
            };
        });
    };

    const patchDraft = (next: Partial<CheckinIsland>) => {
        setDock((prev) => (prev?.draft ? { ...prev, draft: { ...prev.draft, ...next } } : prev));
    };

    /** 도크 `변경` — 신규면 목록에 더하고, 기존이면 그 자리를 갈아 끼운다 */
    const handleConfirm = () => {
        if (!dock?.draft) return;

        const { draft, target } = dock;
        setEdit((prev) => ({
            ...prev,
            [activeTerminal]:
                target === null
                    ? [...prev[activeTerminal], draft]
                    : prev[activeTerminal].map((it) => (it.label === target ? draft : it)),
        }));
        setDock(null);
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
                const active = terminal === activeTerminal;

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        active={active}
                        onActivate={() => handleTerminalChange(terminal)}
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
                                note: `${island.booths.length}석`,
                            }))}
                            line={panelData.wait}
                            footText="블럭을 클릭하면 아래 도크에서 아일랜드별 배정을 조정합니다. 초기값은 배정정보로 채워집니다."
                            actions={
                                <>
                                    <button
                                        type="button"
                                        className="bchart__act bchart__act--add"
                                        disabled={!active}
                                        onClick={openDock}
                                    >
                                        아일랜드 편집
                                    </button>
                                    <button
                                        type="button"
                                        className="bchart__act"
                                        disabled={!active}
                                        onClick={() =>
                                            console.log('[세부 운영시간 직접 설정]', { terminal })
                                        }
                                    >
                                        세부 운영시간 직접 설정 →
                                    </button>
                                </>
                            }
                            selected={active ? selected : []}
                            onBlockSelect={(label) => openIsland(label)}
                            formatTip={(item, hour) => {
                                const one = item.sides?.length === 1 ? item.sides[0] : null;
                                const detail = one
                                    ? `${one} ${SIDE_BOOTHS}석 · ${one === 'L' ? 'R' : 'L'} 미운영`
                                    : `L ${SIDE_BOOTHS}석 · R ${SIDE_BOOTHS}석`;

                                return `아일랜드 ${item.label} · ${detail} · ${formatHour(hour)} ~ ${formatHour(hour + 1)}`;
                            }}
                            disabled={!active}
                        />
                    </TerminalPanel>
                );
            })}

            {dock && (
                <EditDock
                    codes={data.islandCodes}
                    islands={activeIslands}
                    selected={selected}
                    onSelect={(label) => openIsland(label)}
                    draft={dock.draft}
                    onPatch={patchDraft}
                    airlines={data.airlines}
                    selectedBooth={dock.selectedBooth}
                    onSelectBooth={(no) =>
                        setDock((prev) => (prev ? { ...prev, selectedBooth: no } : prev))
                    }
                    onConfirm={handleConfirm}
                    onClose={() => setDock(null)}
                />
            )}
        </>
    );
}
