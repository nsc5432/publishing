import { useEffect, useRef, useState } from 'react';
import type { UserSmltQuery } from '@/types/api.types';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import { BlockChart } from '../../components/BlockChart';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour } from '../../format';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { BLOCK_COLORS, TERMINALS, enabledTerminals, type BlockItem, type SmltTabProps, type TerminalKind } from '../../types';
import { CheckinCounterEditDock } from './components/CheckinCounterEditDock';
import { ISLAND_BOOTHS } from './constants';
import type { CheckinIsland, TerminalCheckinCounter } from './types';
import { EMPTY_CHECKIN_COUNTER, assignedBoothCount, toBooths, toCheckinCounter, toCheckinCounterKpis, toSaveReq } from './view';

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

const CHART_LEVELS = 13;
const CHART_ROW_H = 18;

async function fetchChkn(query: UserSmltQuery, tmnlId: TerminalKind) {
    const [checkin, flightPax] = await Promise.all([userSmltService.getChknCounterInfo(query, tmnlId), userSmltService.getFltPsgInfo(query, tmnlId)]);

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

function toDock(terminal: TerminalKind, label: string, islands: CheckinIsland[], source: TerminalCheckinCounter): DockState {
    const island = islands.find((candidate) => candidate.label === label);

    return {
        terminal,
        draft: island ?? newIsland(source, label),
        target: island ? label : null,
        selectedBooths: [],
        changed: false,
    };
}

export function CheckinCounterTab({
    query,
    busy,
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

    const islandDock = (terminal: TerminalKind, label: string) =>
        toDock(terminal, label, islandsByTerminal[terminal], terminalData[terminal] ?? EMPTY_CHECKIN_COUNTER);

    const isDockOf = (candidate: DockState, terminal: TerminalKind) => candidate.terminal === terminal && candidate.draft !== null;

    const defaultDock = (terminal: TerminalKind): DockState => {
        const label = islandsByTerminal[terminal][0]?.label ?? terminalData[terminal]?.islandCodes[0];
        return label ? islandDock(terminal, label) : { ...EMPTY_DOCK, terminal };
    };

    const activeDock = isDockOf(dock, focusTerminal) ? dock : defaultDock(focusTerminal);
    const draft = activeDock.draft;

    const keepPendingChanges = () => {
        if (!dock.draft || !dock.changed) return;
        const previous = collectIslands(dock.terminal);
        setIslandsByTerminal((current) => ({ ...current, [dock.terminal]: previous }));
    };

    const updateActiveDock = (update: (current: DockState) => DockState) => {
        if (dock !== activeDock) keepPendingChanges();
        setDock((previousDock) => update(isDockOf(previousDock, focusTerminal) ? previousDock : activeDock));
    };

    const openIsland = (terminal: TerminalKind, label: string) => {
        if (busy || !terminalData[terminal]) return;
        onFocusChange(terminal);
        const current = isDockOf(dock, terminal) ? dock : defaultDock(terminal);
        if (current.draft?.label === label) return;
        keepPendingChanges();
        setDock(islandDock(terminal, label));
    };

    const patchDraft = (patch: Partial<CheckinIsland>) => {
        if (busy || readOnly || !draft) return;
        dirty.current[activeDock.terminal] = true;
        updateActiveDock((current) => (current.draft ? { ...current, changed: true, draft: { ...current.draft, ...patch } } : current));
    };

    const selectBooths = (boothNos: number[]) => updateActiveDock((current) => ({ ...current, selectedBooths: boothNos }));

    const handleConfirm = () => {
        const { terminal, draft: edited, target } = activeDock;
        if (busy || readOnly || !edited) return;
        dirty.current[terminal] = true;

        setIslandsByTerminal((previousIslands) => ({
            ...previousIslands,
            [terminal]:
                target === null
                    ? [...previousIslands[terminal], edited]
                    : previousIslands[terminal].map((island) => (island.label === target ? edited : island)),
        }));
        setDock({ terminal, draft: edited, target: edited.label, selectedBooths: [], changed: false });
    };

    const handleCancel = () => {
        if (!draft) return;
        setDock(islandDock(activeDock.terminal, draft.label));
    };

    const collectIslands = (terminal: TerminalKind) => {
        const islands = islandsByTerminal[terminal];
        if (dock.terminal !== terminal || !dock.draft || !dock.changed) return islands;
        return dock.target === null ? [...islands, dock.draft] : islands.map((island) => (island.label === dock.target ? dock.draft! : island));
    };
    useEffect(() => {
        onDraftChange('checkinCounter', {
            collect: (all = false) => ({
                chknList: TERMINALS.filter((terminal) => (all || dirty.current[terminal]) && terminalData[terminal]).map((terminal) =>
                    toSaveReq(query.ymd, terminal, collectIslands(terminal)),
                ),
            }),
            onSaved: () => {
                const saved = { T1: collectIslands('T1'), T2: collectIslands('T2') };
                const { terminal, draft: current } = activeDock;
                setIslandsByTerminal(saved);
                setDock(current ? toDock(terminal, current.label, saved[terminal], terminalData[terminal] ?? EMPTY_CHECKIN_COUNTER) : EMPTY_DOCK);
                dirty.current = { T1: false, T2: false };
            },
        });
    });

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
                    >
                        <BlockChart
                            items={toBlockItems(panelIslands)}
                            title="시간대별 운영 아일랜드"
                            unit="(단위: 아일랜드 수)"
                            unitNote={`1블럭 = 아일랜드 1개(${ISLAND_BOOTHS}대)`}
                            levels={CHART_LEVELS}
                            rowH={CHART_ROW_H}
                            unitSize={ISLAND_BOOTHS}
                            blockFontSize={12}
                            legend={panelIslands.map((island) => ({
                                label: island.label,
                                color: island.color,
                                note: `${assignedBoothCount(island)}대`,
                            }))}
                            line={panelData.wait}
                            selected={terminal === focusTerminal && draft ? [draft.label] : []}
                            onBlockSelect={(label) => openIsland(terminal, label)}
                            formatTip={(item, hour) =>
                                `아일랜드 ${item.label} ${item.size}대 / ${ISLAND_BOOTHS}대 · ${formatHour(hour)} ~ ${formatHour(hour + 1)}`
                            }
                            disabled={!terminalEnabled}
                        />
                    </TerminalPanel>
                );
            })}

            <CheckinCounterEditDock
                terminal={focusTerminal}
                disabled={busy || !!readOnly}
                codes={focusData.islandCodes}
                islands={focusIslands}
                selected={draft ? [draft.label] : []}
                onSelect={(label) => openIsland(focusTerminal, label)}
                draft={draft}
                changed={activeDock.changed}
                onPatch={patchDraft}
                airlines={focusData.airlines}
                selectedBooths={activeDock.selectedBooths}
                onSelectBooths={selectBooths}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </>
    );
}
