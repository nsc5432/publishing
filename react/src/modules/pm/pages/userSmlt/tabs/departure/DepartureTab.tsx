import { useEffect, useRef, useState } from 'react';
import type { UserSmltQuery } from '@/types/api.types';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { unwrap } from '@/api/pm/result';
import { BlockChart, GUTTER } from '../../components/BlockChart';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour } from '../../format';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { TERMINALS, enabledTerminals, type BlockItem, type SmltTabProps, type TerminalKind } from '../../types';
import { DepartureEditDock } from './components/DepartureEditDock';
import type { DepartureGate } from './types';
import { EMPTY_DEPARTURE, toDeparture, toDepartureKpis, toSaveReq } from './view';

type EditState = Record<TerminalKind, DepartureGate[]>;
type SelectState = Record<TerminalKind, number | null>;
type GateDrafts = Record<number, DepartureGate>;

interface DraftState {
    drafts: Record<TerminalKind, GateDrafts>;
    changed: boolean;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };
const EMPTY_SELECT: SelectState = { T1: null, T2: null };
const EMPTY_DRAFT_STATE: DraftState = { drafts: { T1: {}, T2: {} }, changed: false };

async function fetchDep(query: UserSmltQuery, tmnlId: TerminalKind) {
    const [departure, flightPax] = await Promise.all([
        userSmltService.getDepInfo(query, tmnlId),
        userSmltService.getFltPsgInfo(query, tmnlId),
    ]);

    return {
        ...unwrap(departure, '출국장 정보를 불러오지 못했습니다.'),
        flightPax: unwrap(flightPax, '운항 및 여객 정보를 불러오지 못했습니다.'),
    };
}

function toGateItems(gates: DepartureGate[]): BlockItem[] {
    return gates.map((gate) => ({
        label: String(gate.no),
        color: gate.color,
        ranges: gate.off ? [] : gate.ranges,
        size: 1,
    }));
}

export function DepartureTab({
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
    const { data: terminalData, error, responseSeq } = useTerminalData(query, reloadKey, fetchDep, toDeparture, '출국장 정보를 불러오지 못했습니다.');
    const [gatesByTerminal, setGatesByTerminal] = useState<EditState>(EMPTY_EDIT);
    const [draftState, setDraftState] = useState<DraftState>(EMPTY_DRAFT_STATE);
    const [selected, setSelected] = useState<SelectState>(EMPTY_SELECT);

    const edited = useRef<Record<TerminalKind, boolean>>({ T1: false, T2: false });

    useErrorAlert(error, responseSeq);

    const enabledCount = enabledTerminals(enabled).length;

    const collectGates = (terminal: TerminalKind) => gatesByTerminal[terminal].map((gate) => draftState.drafts[terminal][gate.no] ?? gate);

    const selectedGateOf = (terminal: TerminalKind) => {
        const gates = collectGates(terminal);
        return gates.find((gate) => gate.no === selected[terminal]) ?? gates[0] ?? null;
    };

    const draft = selectedGateOf(focusTerminal);

    useEffect(() => {
        const t1Gates = terminalData.T1?.gates ?? [];
        const t2Gates = terminalData.T2?.gates ?? [];

        setGatesByTerminal({ T1: t1Gates, T2: t2Gates });
        setDraftState(EMPTY_DRAFT_STATE);
        setSelected(EMPTY_SELECT);
    }, [terminalData]);

    const openGate = (terminal: TerminalKind, no: number) => {
        const gate = gatesByTerminal[terminal].find((candidate) => candidate.no === no);
        if (busy || !gate) return;

        onFocusChange(terminal);
        setSelected((previousSelection) => ({ ...previousSelection, [terminal]: no }));
    };

    const patchDraft = (patch: Partial<DepartureGate>) => {
        if (busy || readOnly || !draft) return;
        const terminal = focusTerminal;
        edited.current[terminal] = true;
        setDraftState((previous) => {
            const gateDrafts = previous.drafts[terminal];

            return {
                changed: true,
                drafts: {
                    ...previous.drafts,
                    [terminal]: { ...gateDrafts, [draft.no]: { ...(gateDrafts[draft.no] ?? draft), ...patch } },
                },
            };
        });
    };

    const handleConfirm = () => {
        if (busy || readOnly) return;

        setGatesByTerminal({ T1: collectGates('T1'), T2: collectGates('T2') });
        setDraftState(EMPTY_DRAFT_STATE);
    };

    useEffect(() => {
        onDraftChange('departure', {
            collect: (all = false) => ({
                depList: TERMINALS.filter((terminal) => (all || edited.current[terminal]) && terminalData[terminal]).map((terminal) =>
                    toSaveReq(query.ymd, terminal, collectGates(terminal)),
                ),
            }),
            onSaved: () => {
                setGatesByTerminal({ T1: collectGates('T1'), T2: collectGates('T2') });
                setDraftState(EMPTY_DRAFT_STATE);
                edited.current = { T1: false, T2: false };
            },
        });
    });

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = terminalData[terminal] ?? EMPTY_DEPARTURE;
                const gates = gatesByTerminal[terminal];
                const terminalEnabled = enabled[terminal];
                const operatingGates = gates.filter((gate) => !gate.off);
                const selectedGate = selectedGateOf(terminal);

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        enabled={terminalEnabled}
                        focused={terminal === focusTerminal}
                        canDisable={enabledCount > 1}
                        onToggle={() => onToggleTerminal(terminal)}
                        onFocus={() => onFocusChange(terminal)}
                        kpis={terminalData[terminal] ? toDepartureKpis(panelData, gates) : []}
                        summaryLayout="stacked"
                        readOnly={readOnly}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">전체 출국장</span>
                                    <strong className="summary__value">{gates.length}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영</span>
                                    <strong className="summary__value summary__value--accent">{operatingGates.length}</strong>
                                </div>
                            </>
                        }
                    >
                        <BlockChart
                            items={toGateItems(gates)}
                            title="시간대별 운영 출국장"
                            unit="1블럭 = 출국장 1개"
                            levels={8}
                            rowH={18}
                            gridLeft={GUTTER}
                            blockFontSize={13}
                            line={panelData.wait}
                            selected={terminal === focusTerminal && selectedGate ? [String(selectedGate.no)] : []}
                            onBlockSelect={(label) => openGate(terminal, Number(label))}
                            formatTip={(item, hour) => {
                                const gate = gates.find((it) => String(it.no) === item.label);
                                const range = gate?.ranges.find((it) => hour >= it.start && hour < it.end);
                                const when = range ? `${range.start}~${range.end}시` : `${formatHour(hour)} ~ ${formatHour(hour + 1)}`;

                                return `${item.label}번 출국장 / ${when} / 보안검색대 ${gate?.scshCntom ?? 0}대`;
                            }}
                            disabled={!terminalEnabled}
                        />
                    </TerminalPanel>
                );
            })}

            {draft && (
                <DepartureEditDock
                    terminal={focusTerminal}
                    disabled={busy || !!readOnly}
                    gates={collectGates(focusTerminal)}
                    draft={draft}
                    changed={draftState.changed}
                    onSelect={(no) => openGate(focusTerminal, no)}
                    onPatch={patchDraft}
                    onConfirm={handleConfirm}
                    onCancel={() => setDraftState(EMPTY_DRAFT_STATE)}
                />
            )}
        </>
    );
}
