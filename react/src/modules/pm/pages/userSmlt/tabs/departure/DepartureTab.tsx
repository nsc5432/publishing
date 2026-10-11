import { useEffect, useRef, useState } from 'react';
import type { UserSmltQuery } from '@/types/api.types';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { BlockChart, GUTTER } from '../../components/BlockChart';
import { CountStepper } from '../../components/CountStepper';
import { DetailDrawer, DrawerSection } from '../../components/DetailDrawer';
import { TimeBar } from '../../components/TimeBar';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour, formatOperating, toHourList } from '../../format';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { TERMINALS, enabledTerminals, type BlockItem, type SmltTabProps, type TerminalKind } from '../../types';
import { ScGrid } from './components/ScGrid';
import type { DepartureGate } from './types';
import { EMPTY_DEPARTURE, toDeparture, toHourArray, toPlans, toSaveReq } from './view';

type EditState = Record<TerminalKind, DepartureGate[]>;
type ScState = Record<TerminalKind, Record<number, number[]>>;
type SelectState = Record<TerminalKind, number | null>;
type GateDrafts = Record<number, DepartureGate>;

interface DrawerState {
    terminal: TerminalKind;
    no: number;
    drafts: Record<TerminalKind, GateDrafts>;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };
const EMPTY_SC: ScState = { T1: {}, T2: {} };
const EMPTY_SELECT: SelectState = { T1: null, T2: null };
const EMPTY_DRAFTS: Record<TerminalKind, GateDrafts> = { T1: {}, T2: {} };
const GATE_NOS: Record<TerminalKind, number[]> = {
    T1: [1, 2, 3, 4, 5, 6],
    T2: [1, 2],
};

const fetchDep = (query: UserSmltQuery, tmnlId: TerminalKind) => userSmltService.getDepInfo(query, tmnlId);

function toScState(gates: DepartureGate[]): Record<number, number[]> {
    return Object.fromEntries(gates.map((gate) => [gate.no, toHourArray(gate)]));
}

function peakSc(gates: DepartureGate[], scCountsByGate: Record<number, number[]>): number {
    const scByHour: number[] = Array(24).fill(0);
    gates
        .filter((gate) => !gate.off)
        .forEach((gate) => {
            const countsByHour = scCountsByGate[gate.no] ?? [];
            toHourList(gate.ranges).forEach((hour) => {
                scByHour[hour] += countsByHour[hour] ?? 0;
            });
        });

    return Math.max(0, ...scByHour);
}

function toGateItems(gates: DepartureGate[]): BlockItem[] {
    return gates.map((gate) => ({
        label: String(gate.no),
        color: gate.color,
        ranges: gate.off ? [] : gate.ranges,
        size: 1,
    }));
}

function pickGate(gates: DepartureGate[], drafts: GateDrafts, no: number): DepartureGate | undefined {
    return drafts[no] ?? gates.find((gate) => gate.no === no);
}

export function DepartureTab({
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
    const { data: terminalData, error, token } = useTerminalData(query, reloadKey, fetchDep, toDeparture, '출국장 정보를 불러오지 못했습니다.');
    const [gatesByTerminal, setGatesByTerminal] = useState<EditState>(EMPTY_EDIT);
    const [scCountsByTerminal, setScCountsByTerminal] = useState<ScState>(EMPTY_SC);
    const [drawer, setDrawer] = useState<DrawerState | null>(null);
    const [selected, setSelected] = useState<SelectState>(EMPTY_SELECT);

    const dirty = useRef<Record<TerminalKind, boolean>>({ T1: false, T2: false });

    useErrorAlert(error, token);

    const enabledCount = enabledTerminals(enabled).length;
    const openDrawer = drawer && drawer.terminal === focusTerminal ? drawer : null;
    const gateNos = openDrawer ? GATE_NOS[openDrawer.terminal] : [];
    const draft = openDrawer ? openDrawer.drafts[openDrawer.terminal][openDrawer.no] : null;

    useEffect(() => {
        const t1Gates = terminalData.T1?.gates ?? [];
        const t2Gates = terminalData.T2?.gates ?? [];

        setGatesByTerminal({ T1: t1Gates, T2: t2Gates });
        setScCountsByTerminal({ T1: toScState(t1Gates), T2: toScState(t2Gates) });
        setDrawer(null);
        setSelected(EMPTY_SELECT);
    }, [terminalData]);

    const openGate = (terminal: TerminalKind, no: number) => {
        const gate = gatesByTerminal[terminal].find((candidate) => candidate.no === no);
        if (busy || !gate) return;

        onFocusChange(terminal);
        setSelected((previousSelection) => ({ ...previousSelection, [terminal]: no }));
        setDrawer((previousDrawer) => {
            const drafts = previousDrawer?.drafts ?? EMPTY_DRAFTS;
            const gateDrafts = drafts[terminal];

            return {
                terminal,
                no,
                drafts: { ...drafts, [terminal]: { ...gateDrafts, [no]: gateDrafts[no] ?? gate } },
            };
        });
    };

    const openDetail = (terminal: TerminalKind) => {
        const gates = gatesByTerminal[terminal];
        if (gates.length === 0) return;

        const selectedGate = gates.find((gate) => gate.no === selected[terminal]) ?? gates[0];
        openGate(terminal, selectedGate.no);
    };

    const patchDraft = (patch: Partial<DepartureGate>) => {
        if (busy) return;
        if (drawer) dirty.current[drawer.terminal] = true;
        setDrawer((previousDrawer) => {
            if (!previousDrawer) return previousDrawer;

            const gateDrafts = previousDrawer.drafts[previousDrawer.terminal];

            return {
                ...previousDrawer,
                drafts: {
                    ...previousDrawer.drafts,
                    [previousDrawer.terminal]: {
                        ...gateDrafts,
                        [previousDrawer.no]: { ...gateDrafts[previousDrawer.no], ...patch },
                    },
                },
            };
        });
    };

    const handleConfirm = () => {
        if (busy || !drawer) return;

        const { drafts } = drawer;
        setGatesByTerminal((previousGates) => ({
            ...previousGates,
            T1: previousGates.T1.map((gate) => drafts.T1[gate.no] ?? gate),
            T2: previousGates.T2.map((gate) => drafts.T2[gate.no] ?? gate),
        }));
        setDrawer(null);
    };

    const collectGates = (terminal: TerminalKind) =>
        gatesByTerminal[terminal].map((original) => {
            const gate = drawer?.drafts[terminal][original.no] ?? original;
            const openHours = new Set(gate.off ? [] : toHourList(gate.ranges));
            const counts = Array.from({ length: 24 }, (_, hour) => (openHours.has(hour) ? (scCountsByTerminal[terminal][gate.no]?.[hour] ?? 0) : 0));
            return { ...gate, plans: toPlans(counts, gate.plans) };
        });

    useEffect(() => {
        onDraftChange('departure', () => ({
            depList: TERMINALS.filter((terminal) => dirty.current[terminal] && terminalData[terminal]).map((terminal) =>
                toSaveReq(query.ymd, terminal, collectGates(terminal)),
            ),
        }));
    });

    const handleSave = async (terminal: TerminalKind) => {
        if (busy || !terminalData[terminal]) return;
        if (!beginRequest()) return;
        const gates = collectGates(terminal);
        const saved = await runSave(userSmltService.saveDepInfo(toSaveReq(query.ymd, terminal, gates)), '출국장 저장에 실패했습니다.');
        endRequest(saved);
        if (saved) {
            setGatesByTerminal((previous) => ({ ...previous, [terminal]: gates }));
            setDrawer((previous) => (previous ? { ...previous, drafts: { ...previous.drafts, [terminal]: {} } } : null));
            dirty.current[terminal] = false;
        }
    };

    const handleMapClick = (terminal: TerminalKind) => {
        const ymd = query.ymd;
        if (!ymd) return;

        userSmltService
            .getFcltMap(query, terminal, 'DEP')
            .then((dto) => console.log('[지도 보기]', dto.markerList))
            .catch(() => {});
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = terminalData[terminal] ?? EMPTY_DEPARTURE;
                const gates = gatesByTerminal[terminal];
                const scCountsByGate = scCountsByTerminal[terminal];
                const terminalEnabled = enabled[terminal];
                const operatingGates = gates.filter((gate) => !gate.off);

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
                                    <span className="summary__label">전체 출국장</span>
                                    <strong className="summary__value">{gates.length}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영</span>
                                    <strong className="summary__value summary__value--accent">{operatingGates.length}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">피크 검색대</span>
                                    <strong className="summary__value summary__value--accent">{peakSc(gates, scCountsByGate)}</strong>
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
                            items={toGateItems(gates)}
                            title="시간대별 운영 출국장"
                            unit="1블럭 = 출국장 1개"
                            levels={8}
                            rowH={18}
                            gridLeft={GUTTER}
                            blockFontSize={13}
                            line={panelData.wait}
                            footText={
                                readOnly
                                    ? '블럭을 클릭하면 아래 격자에서 그 출국장 줄이 켜집니다.'
                                    : '블럭을 클릭하면 아래 격자에서 그 출국장 줄이 켜집니다. 줄 라벨을 클릭하면 출국장 속성을 편집합니다.'
                            }
                            actions={
                                readOnly ? undefined : (
                                    <button type="button" className="bchart__act" disabled={!terminalEnabled} onClick={() => openDetail(terminal)}>
                                        세부 운영시간 직접 설정 →
                                    </button>
                                )
                            }
                            selected={selected[terminal] !== null ? [String(selected[terminal])] : []}
                            onBlockSelect={(label) =>
                                setSelected((previousSelection) => ({
                                    ...previousSelection,
                                    [terminal]: Number(label),
                                }))
                            }
                            formatTip={(item, hour) => {
                                const gate = gates.find((it) => String(it.no) === item.label);
                                const range = gate?.ranges.find((it) => hour >= it.start && hour < it.end);
                                const count = scCountsByGate[Number(item.label)]?.[hour] ?? 0;
                                const when = range ? `${range.start}~${range.end}시` : `${formatHour(hour)} ~ ${formatHour(hour + 1)}`;

                                return `${item.label}번 출국장 · ${when} · 검색대 ${count}대`;
                            }}
                            disabled={!terminalEnabled}
                        />

                        <ScGrid
                            gates={gates}
                            value={scCountsByGate}
                            onChange={(nextCounts) => {
                                if (busy) return;
                                dirty.current[terminal] = true;
                                setScCountsByTerminal((previousCounts) => ({
                                    ...previousCounts,
                                    [terminal]: nextCounts,
                                }));
                            }}
                            selected={selected[terminal]}
                            onSelect={(no) =>
                                setSelected((previousSelection) => ({
                                    ...previousSelection,
                                    [terminal]: no,
                                }))
                            }
                            onLabelClick={(no) => openGate(terminal, no)}
                            disabled={busy || !terminalEnabled || readOnly}
                        />
                    </TerminalPanel>
                );
            })}

            {!readOnly && openDrawer && draft && (
                <DetailDrawer
                    badge={String(draft.no)}
                    badgeColor={draft.color}
                    title={`${draft.no}번 출국장`}
                    subtitle={formatOperating(openDrawer.terminal, draft.ranges)}
                    onClose={() => setDrawer(null)}
                    onConfirm={handleConfirm}
                >
                    <DrawerSection title="출국장 선택" hint={`${openDrawer.terminal} ${gateNos.length}개`}>
                        <div className="gatepick">
                            {gateNos.map((no) => {
                                const gate = pickGate(gatesByTerminal[openDrawer.terminal], openDrawer.drafts[openDrawer.terminal], no);
                                const selectedGate = no === openDrawer.no;

                                return (
                                    <button
                                        key={no}
                                        type="button"
                                        className={`gatepick__item${selectedGate ? ' is-on' : ''}` + `${gate?.off ? ' is-off' : ''}`}
                                        aria-pressed={selectedGate}
                                        disabled={!gate}
                                        onClick={() => openGate(openDrawer.terminal, no)}
                                    >
                                        <i className="gatepick__dot" style={gate && !gate.off ? { background: `var(--${gate.color})` } : undefined} />
                                        {no}번
                                    </button>
                                );
                            })}
                        </div>
                    </DrawerSection>

                    <DrawerSection>
                        <div className="drow">
                            <p className="drow__label">출국장 운영 여부</p>
                            <div className="seg">
                                <button
                                    type="button"
                                    className={`seg__item${draft.off ? '' : ' is-on'}`}
                                    aria-pressed={!draft.off}
                                    onClick={() => patchDraft({ off: false })}
                                >
                                    사용
                                </button>
                                <button
                                    type="button"
                                    className={`seg__item${draft.off ? ' is-on' : ''}`}
                                    aria-pressed={draft.off}
                                    onClick={() => patchDraft({ off: true })}
                                >
                                    미사용
                                </button>
                            </div>
                        </div>
                    </DrawerSection>

                    <DrawerSection title="운영시간" hint="1시간 단위">
                        <TimeBar label="선택 범위" ranges={draft.ranges} onChange={(ranges) => patchDraft({ ranges })} disabled={busy || draft.off} />
                    </DrawerSection>

                    <DrawerSection title="검색대 구성" hint={`${draft.no}번 출국장 소속`}>
                        <CountStepper label="일반" value={draft.gnrlSrchCntom} onChange={(gnrlSrchCntom) => patchDraft({ gnrlSrchCntom })} />
                        <CountStepper
                            label="스마트패스"
                            value={draft.smartPassSrchCntom}
                            onChange={(smartPassSrchCntom) => patchDraft({ smartPassSrchCntom })}
                        />
                        <CountStepper label="보안검색대" sub="피크 시간대 기준" value={draft.scshCntom} onChange={(scshCntom) => patchDraft({ scshCntom })} />
                    </DrawerSection>
                </DetailDrawer>
            )}
        </>
    );
}
