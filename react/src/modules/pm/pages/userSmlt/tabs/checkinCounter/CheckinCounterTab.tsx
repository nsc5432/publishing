import { useEffect, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { BlockChart } from '../../components/BlockChart';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour, toHourList } from '../../format';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { BLOCK_COLORS, TERMINALS, enabledTerminals, type BlockItem, type SmltTabProps, type TerminalKind } from '../../types';
import { EditDock } from './components/EditDock';
import { ISLAND_BOOTHS, SIDE_BOOTHS } from './constants';
import type { CheckinIsland, TerminalCheckinCounter } from './types';
import { EMPTY_CHECKIN_COUNTER, assignedBoothCount, toBooths, toCheckinCounter, toSaveReq } from './view';

type EditState = Record<TerminalKind, CheckinIsland[]>;

interface DockState {
    terminal: TerminalKind;
    draft: CheckinIsland | null;
    target: string | null;
    selectedBooths: number[];
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };
const EMPTY_DOCK: DockState = { terminal: 'T1', draft: null, target: null, selectedBooths: [] };
const FETCH_FAIL = '체크인 카운터 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '체크인 카운터 저장에 실패했습니다.';

const CHART_LEVELS = 13;
const CHART_ROW_H = 18;

const fetchChkn = (smltId: string, tmnlId: TerminalKind) => userSmltService.getChknCounterInfo(smltId, tmnlId);

function toBlockItems(islands: CheckinIsland[]): BlockItem[] {
    return islands.map((island) => ({
        label: island.label,
        color: island.color,
        ranges: island.ranges,
        size: assignedBoothCount(island),
        sides: (['L', 'R'] as const).filter((side) => island.booths.some((booth) => booth.side === side && booth.airline)),
    }));
}

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

function newIsland(terminalData: TerminalCheckinCounter, label: string): CheckinIsland {
    return {
        label,
        color: BLOCK_COLORS[terminalData.islandCodes.indexOf(label) % BLOCK_COLORS.length],
        ranges: [],
        booths: toBooths([]),
        kiosk: 0,
        bagdrop: 0,
    };
}

export function CheckinCounterTab({ smltIds, reloadKey, enabled, onToggleTerminal, focusTerminal, onFocusChange, readOnly }: SmltTabProps) {
    const { data: terminalData, error, token } = useTerminalData(smltIds, reloadKey, fetchChkn, toCheckinCounter, FETCH_FAIL);
    const [islandsByTerminal, setIslandsByTerminal] = useState<EditState>(EMPTY_EDIT);
    const [dock, setDock] = useState<DockState>(EMPTY_DOCK);

    useErrorAlert(error, token);

    useEffect(() => {
        setIslandsByTerminal({
            T1: terminalData.T1?.islands ?? [],
            T2: terminalData.T2?.islands ?? [],
        });
        setDock(EMPTY_DOCK);
    }, [terminalData]);

    const enabledCount = enabledTerminals(enabled).length;
    const focusData = terminalData[focusTerminal] ?? EMPTY_CHECKIN_COUNTER;
    const focusIslands = islandsByTerminal[focusTerminal];
    const draft = dock.terminal === focusTerminal ? dock.draft : null;

    const openIsland = (terminal: TerminalKind, label: string) => {
        onFocusChange(terminal);
        setDock((previousDock) => {
            if (previousDock.terminal === terminal && previousDock.draft?.label === label) {
                return previousDock;
            }

            const island = islandsByTerminal[terminal].find((candidate) => candidate.label === label);
            const source = terminalData[terminal] ?? EMPTY_CHECKIN_COUNTER;

            return {
                terminal,
                draft: island ?? newIsland(source, label),
                target: island ? label : null,
                selectedBooths: [],
            };
        });
    };

    const patchDraft = (patch: Partial<CheckinIsland>) => {
        setDock((previousDock) => (previousDock.draft ? { ...previousDock, draft: { ...previousDock.draft, ...patch } } : previousDock));
    };

    const handleConfirm = () => {
        const { terminal, draft: edited, target } = dock;
        if (!edited) return;

        setIslandsByTerminal((previousIslands) => ({
            ...previousIslands,
            [terminal]:
                target === null
                    ? [...previousIslands[terminal], edited]
                    : previousIslands[terminal].map((island) => (island.label === target ? edited : island)),
        }));
        setDock({ ...EMPTY_DOCK, terminal });
    };

    const handleSave = (terminal: TerminalKind) => {
        const smltId = smltIds[terminal];
        if (!smltId) return;

        runSave(userSmltService.saveChknCounterInfo(toSaveReq(smltId, terminal, islandsByTerminal[terminal])), SAVE_FAIL);
    };

    const handleMapClick = (terminal: TerminalKind) => {
        const smltId = smltIds[terminal];
        if (!smltId) return;

        userSmltService
            .getFcltMap(smltId, terminal, 'CHKN')
            .then((dto) => console.log('[지도 보기]', dto.markerList))
            .catch(() => {});
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = terminalData[terminal] ?? EMPTY_CHECKIN_COUNTER;
                const panelIslands = islandsByTerminal[terminal];
                const terminalEnabled = enabled[terminal];

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        enabled={terminalEnabled}
                        focused={terminal === focusTerminal}
                        canDisable={enabledCount > 1}
                        onToggle={() => onToggleTerminal(terminal)}
                        onFocus={() => onFocusChange(terminal)}
                        kpis={panelData.kpis}
                        onMapClick={() => handleMapClick(terminal)}
                        readOnly={readOnly}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">전체 카운터</span>
                                    <strong className="summary__value">{panelData.total}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영 아일랜드</span>
                                    <strong className="summary__value summary__value--accent">{panelIslands.length}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">피크 카운터</span>
                                    <strong className="summary__value summary__value--accent">{peakBooths(panelIslands)}</strong>
                                </div>
                            </>
                        }
                        footer={
                            <button type="button" className="btn btn--save" onClick={() => handleSave(terminal)}>
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
                                const detail = one ? `${one} ${SIDE_BOOTHS}석 · ${one === 'L' ? 'R' : 'L'} 미운영` : `L ${SIDE_BOOTHS}석 · R ${SIDE_BOOTHS}석`;

                                return `아일랜드 ${item.label} · ${detail} · ${formatHour(hour)} ~ ${formatHour(hour + 1)}`;
                            }}
                            disabled={!terminalEnabled || readOnly}
                        />
                    </TerminalPanel>
                );
            })}

            {/* 조회 전용이면 편집 도크를 아예 그리지 않는다 (도크를 여는 블럭 차트도 잠겨 있다) */}
            {!readOnly && (
                <EditDock
                    terminal={focusTerminal}
                    codes={focusData.islandCodes}
                    islands={focusIslands}
                    selected={draft ? [draft.label] : []}
                    onSelect={(label) => openIsland(focusTerminal, label)}
                    draft={draft}
                    onPatch={patchDraft}
                    airlines={focusData.airlines}
                    selectedBooths={draft ? dock.selectedBooths : []}
                    onSelectBooths={(boothNos) =>
                        setDock((previousDock) => ({
                            ...previousDock,
                            selectedBooths: boothNos,
                        }))
                    }
                    onConfirm={handleConfirm}
                    onCancel={() => setDock({ ...EMPTY_DOCK, terminal: focusTerminal })}
                />
            )}
        </>
    );
}
