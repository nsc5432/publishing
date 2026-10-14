import { useEffect, useRef, useState } from 'react';
import type { UserSmltQuery } from '@/types/api.types';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import { BlockChart } from '../../components/BlockChart';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour } from '../../format';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { BLOCK_COLORS, TERMINALS, enabledTerminals, type BlockItem, type SmltTabProps, type TerminalKind } from '../../types';
import { EditDock } from './components/EditDock';
import { ISLAND_BOOTHS, SIDE_BOOTHS } from './constants';
import type { CheckinIsland, TerminalCheckinCounter } from './types';
import {
    EMPTY_CHECKIN_COUNTER,
    assignedBoothCount,
    toBooths,
    toCheckinCounter,
    toCheckinCounterKpis,
    toSaveReq,
} from './view';

type EditState = Record<TerminalKind, CheckinIsland[]>;

interface DockState {
    terminal: TerminalKind;
    draft: CheckinIsland | null;
    target: string | null;
    selectedBooths: number[];
    changed: boolean;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };
const EMPTY_DOCK: DockState = { terminal: 'T1', draft: null, target: null, selectedBooths: [], changed: false };
const FETCH_FAIL = '체크인 카운터 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '체크인 카운터 저장에 실패했습니다.';

const CHART_LEVELS = 13;
const CHART_ROW_H = 18;

async function fetchChkn(query: UserSmltQuery, tmnlId: TerminalKind) {
    const [checkin, flightPax] = await Promise.all([
        userSmltService.getChknCounterInfo(query, tmnlId),
        userSmltService.getFltPsgInfo(query, tmnlId),
    ]);

    return {
        ...unwrap(checkin, FETCH_FAIL),
        flightPax: unwrap(flightPax, '운항 및 여객 정보를 불러오지 못했습니다.'),
    };
}

function toBlockItems(islands: CheckinIsland[]): BlockItem[] {
    return islands.map((island) => ({
        label: island.label,
        color: island.color,
        ranges: island.ranges,
        size: assignedBoothCount(island),
        sides: (['L', 'R'] as const).filter((side) => island.booths.some((booth) => booth.side === side && booth.airline)),
    }));
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

export function CheckinCounterTab({
    query,
    busy,
    beginRequest,
    endRequest,
    onDraftChange,
    reloadKey,
    enabled,
    onToggleTerminal,
    focusTerminal,
    onFocusChange,
    readOnly,
}: SmltTabProps) {
    const { data: terminalData, error, responseSeq } = useTerminalData(query, reloadKey, fetchChkn, toCheckinCounter, FETCH_FAIL);
    const [islandsByTerminal, setIslandsByTerminal] = useState<EditState>(EMPTY_EDIT);
    const [dock, setDock] = useState<DockState>(EMPTY_DOCK);

    const dirty = useRef<Record<TerminalKind, boolean>>({ T1: false, T2: false });

    useErrorAlert(error, responseSeq);

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

    const openIsland = (terminal: TerminalKind, label: string, toggle = false) => {
        if (busy || !terminalData[terminal]) return;
        const selected = dock.terminal === terminal && dock.draft?.label === label;
        if (selected && !toggle) return;
        if (dock.draft && dock.changed) {
            const previous = collectIslands(dock.terminal);
            setIslandsByTerminal((current) => ({ ...current, [dock.terminal]: previous }));
        }
        onFocusChange(terminal);
        if (selected) {
            setDock({ ...EMPTY_DOCK, terminal });
            return;
        }
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
                changed: false,
            };
        });
    };

    const patchDraft = (patch: Partial<CheckinIsland>) => {
        if (busy) return;
        dirty.current[dock.terminal] = true;
        setDock((previousDock) => (previousDock.draft ? { ...previousDock, changed: true, draft: { ...previousDock.draft, ...patch } } : previousDock));
    };

    const handleConfirm = () => {
        const { terminal, draft: edited, target } = dock;
        if (busy || !edited) return;
        dirty.current[terminal] = true;

        setIslandsByTerminal((previousIslands) => ({
            ...previousIslands,
            [terminal]:
                target === null
                    ? [...previousIslands[terminal], edited]
                    : previousIslands[terminal].map((island) => (island.label === target ? edited : island)),
        }));
        setDock({ ...EMPTY_DOCK, terminal });
    };

    const collectIslands = (terminal: TerminalKind) => {
        const islands = islandsByTerminal[terminal];
        if (dock.terminal !== terminal || !dock.draft || !dock.changed) return islands;
        return dock.target === null ? [...islands, dock.draft] : islands.map((island) => (island.label === dock.target ? dock.draft! : island));
    };
    useEffect(() => {
        onDraftChange('checkinCounter', () => ({
            chknList: TERMINALS.filter((terminal) => dirty.current[terminal] && terminalData[terminal]).map((terminal) =>
                toSaveReq(query.ymd, terminal, collectIslands(terminal)),
            ),
        }));
    });

    const handleSave = async (terminal: TerminalKind) => {
        if (busy) return;
        const ymd = query.ymd;
        if (!ymd || !terminalData[terminal]) return;

        if (!beginRequest()) return;
        const islands = collectIslands(terminal);
        const saved = await runSave(userSmltService.saveChknCounterInfo(toSaveReq(ymd, terminal, islands)), SAVE_FAIL);
        endRequest(saved);
        if (saved) {
            setIslandsByTerminal((previous) => ({ ...previous, [terminal]: islands }));
            if (dock.terminal === terminal) setDock({ ...EMPTY_DOCK, terminal });
            dirty.current[terminal] = false;
        }
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
                        kpis={terminalData[terminal] ? toCheckinCounterKpis(panelData, panelIslands) : []}
                        summaryLayout="stacked"
                        readOnly={readOnly}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">전체 아일랜드 수</span>
                                    <strong className="summary__value">13</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영 아일랜드</span>
                                    <strong className="summary__value summary__value--accent">{panelIslands.length}</strong>
                                </div>
                            </>
                        }
                        footer={
                            <button type="button" className="btn btn--save" disabled={busy || !terminalData[terminal]} onClick={() => handleSave(terminal)}>
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
                            onBlockSelect={(label) => openIsland(terminal, label, true)}
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

            {!readOnly && (
                <EditDock
                    terminal={focusTerminal}
                    disabled={busy}
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
