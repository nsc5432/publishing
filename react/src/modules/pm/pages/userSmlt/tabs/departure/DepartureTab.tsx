import { useEffect, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { BlockChart, GUTTER } from '../../components/BlockChart';
import { CountStepper } from '../../components/CountStepper';
import { DetailDrawer, DrawerSection } from '../../components/DetailDrawer';
import { TimeBar } from '../../components/TimeBar';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour, formatOperating, toHourList } from '../../format';
import { useErrorAlert } from '../../hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { BLOCK_COLORS, TERMINALS, type BlockItem, type TerminalKind } from '../../types';
import { ScGrid } from './components/ScGrid';
import type { DepartureGate } from './types';
import { EMPTY_DEPARTURE, toDeparture, toHourArray, toPlans, toSaveReq } from './view';

interface DepartureTabProps {
    smltIds: Record<TerminalKind, string>;
    reloadKey: number;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 — 출국장 목록 전체가 편집 대상이다 */
type EditState = Record<TerminalKind, DepartureGate[]>;

/** 출국장 번호 → 24칸 검색대 대수. 조회 결과가 들어올 때 toHourArray() 로 채운다 */
type ScState = Record<TerminalKind, Record<number, number[]>>;

/** 드로어 편집값 — 변경을 눌러야 목록(EditState)에 반영된다 */
interface DrawerState {
    draft: DepartureGate;
    /** 기존 출국장 수정이면 그 번호, `+ 추가` 로 연 신규면 null */
    target: number | null;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };
const EMPTY_SC: ScState = { T1: {}, T2: {} };

const FETCH_FAIL = '출국장 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '출국장 저장에 실패했습니다.';

/** 층 높이 — 아래 격자와 합쳐도 패널 세로 예산(420px) 안에 들어가는 값 */
const CHART_ROW_H = 18;

/** 조회 함수는 렌더마다 새로 만들지 않도록 컴포넌트 밖에 둔다 */
const fetchDep = (smltId: string, tmnlId: TerminalKind) =>
    userSmltService.getDepInfo(smltId, tmnlId);

/** 조회 결과 → 격자 값 (출국장 번호 → 24칸) */
function toScState(gates: DepartureGate[]): Record<number, number[]> {
    return Object.fromEntries(gates.map((gate) => [gate.no, toHourArray(gate)]));
}

/** 요약: 피크 검색대 = 시간대별 운영 검색대 합의 최댓값 */
function peakSc(gates: DepartureGate[], sc: Record<number, number[]>): number {
    const byHour: number[] = Array(24).fill(0);
    gates
        .filter((gate) => !gate.off)
        .forEach((gate) => {
            const hours = sc[gate.no] ?? [];
            toHourList(gate.ranges).forEach((hour) => {
                byHour[hour] += hours[hour] ?? 0;
            });
        });

    return Math.max(0, ...byHour);
}

/**
 * 주 차트 — 블럭 1개 = 출국장 1개.
 *
 * 미운영 출국장도 넘긴다. stackMode="fixed" 가 항목 순서로 층을 고정하므로
 * 구간을 비워 두면 블럭만 사라지고 그 출국장의 자리(층)는 아래 격자와 같은 줄에 남는다.
 */
function toGateItems(gates: DepartureGate[]): BlockItem[] {
    return gates.map((gate) => ({
        label: String(gate.no),
        color: gate.color,
        ranges: gate.off ? [] : gate.ranges,
        size: 1,
    }));
}

/** `+ 추가` — 다음 번호로 빈 출국장을 만든다 */
function newGate(gates: DepartureGate[]): DepartureGate {
    const no = Math.max(0, ...gates.map((gate) => gate.no)) + 1;

    return {
        no,
        color: BLOCK_COLORS[gates.length % BLOCK_COLORS.length],
        ranges: [],
        off: false,
        scCnt: 0,
        normalCnt: 0,
        smartPassCnt: 0,
        plans: [],
    };
}

/**
 * 출국장 탭
 */
export function DepartureTab({
    smltIds,
    reloadKey,
    activeTerminal,
    onTerminalChange,
}: DepartureTabProps) {
    const { data: fetched, error } = useTerminalData(
        smltIds,
        reloadKey,
        fetchDep,
        toDeparture,
        FETCH_FAIL,
    );
    const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);
    const [sc, setSc] = useState<ScState>(EMPTY_SC);
    const [drawer, setDrawer] = useState<DrawerState | null>(null);
    /** 위 차트 블럭 · 아래 격자 줄이 함께 쓰는 선택 상태 */
    const [selected, setSelected] = useState<number | null>(null);

    useErrorAlert(error);

    // 조회 결과가 들어오면 편집 상태를 조회한 값으로 되돌린다.
    useEffect(() => {
        const t1 = fetched.T1?.gates ?? [];
        const t2 = fetched.T2?.gates ?? [];

        setEdit({ T1: t1, T2: t2 });
        setSc({ T1: toScState(t1), T2: toScState(t2) });
        setDrawer(null);
        setSelected(null);
    }, [fetched]);

    /** 편집 중이던 드로어는 터미널이 바뀌면 닫는다 (편집값은 터미널별로 남는다) */
    const handleTerminalChange = (terminal: TerminalKind) => {
        setDrawer(null);
        setSelected(null);
        onTerminalChange(terminal);
    };

    /** 격자 줄 라벨 클릭 — 출국장 속성 편집을 연다 (위 차트 블럭 클릭은 줄 강조만 한다) */
    const openGate = (no: number) => {
        const gate = edit[activeTerminal].find((it) => it.no === no);
        if (!gate) return;

        setSelected(no);
        setDrawer({ draft: gate, target: no });
    };

    const openNew = () => {
        setDrawer({ draft: newGate(edit[activeTerminal]), target: null });
    };

    const patchDraft = (next: Partial<DepartureGate>) => {
        setDrawer((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...next } } : prev));
    };

    /** 드로어 `변경` — 신규면 목록에 더하고, 기존이면 그 자리를 갈아 끼운다 */
    const handleConfirm = () => {
        if (!drawer) return;

        const { draft, target } = drawer;
        setEdit((prev) => ({
            ...prev,
            [activeTerminal]:
                target === null
                    ? [...prev[activeTerminal], draft]
                    : prev[activeTerminal].map((it) => (it.no === target ? draft : it)),
        }));
        // 신규 출국장은 격자에 빈 줄(24칸 0)로 자리를 잡아 준다
        setSc((prev) => ({
            ...prev,
            [activeTerminal]: {
                ...prev[activeTerminal],
                [draft.no]: prev[activeTerminal][draft.no] ?? Array<number>(24).fill(0),
            },
        }));
        setDrawer(null);
    };

    const handleSave = (terminal: TerminalKind) => {
        const smltId = smltIds[terminal];
        if (!smltId) return;

        // 격자 24칸을 구간으로 되묶어 넘긴다 — 시작 시각이 같은 기존 행은 id(planSn)를 물려받는다.
        // 운영시간을 뒤에 줄였다면 그 밖에 남은 값은 구간으로 나가지 않게 0 으로 덮는다.
        const gates = edit[terminal].map((gate) => {
            const open = new Set(gate.off ? [] : toHourList(gate.ranges));
            const byHour = Array.from({ length: 24 }, (_, hour) =>
                open.has(hour) ? (sc[terminal][gate.no]?.[hour] ?? 0) : 0,
            );

            return { ...gate, plans: toPlans(byHour, gate.plans) };
        });

        runSave(userSmltService.saveDepInfo(toSaveReq(smltId, terminal, gates)), SAVE_FAIL);
    };

    /** 지도 보기 — 배치 마커를 받아 둔다 (도면 UI 는 아직 붙지 않았다) */
    const handleMapClick = (terminal: TerminalKind) => {
        const smltId = smltIds[terminal];
        if (!smltId) return;

        userSmltService
            .getFcltMap(smltId, terminal, 'DEP')
            .then((dto) => console.log('[지도 보기]', dto.markerList))
            .catch(() => {
                // 지도는 보조 기능이라 실패해도 편집 흐름을 끊지 않는다 (콘솔에 이미 남는다).
            });
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = fetched[terminal] ?? EMPTY_DEPARTURE;
                const gates = edit[terminal];
                const byGate = sc[terminal];
                const active = terminal === activeTerminal;
                const operating = gates.filter((gate) => !gate.off);

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
                                    <span className="summary__label">전체 출국장</span>
                                    <strong className="summary__value">{gates.length}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영</span>
                                    <strong className="summary__value summary__value--accent">
                                        {operating.length}
                                    </strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">피크 검색대</span>
                                    <strong className="summary__value summary__value--accent">
                                        {peakSc(gates, byGate)}
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
                            items={toGateItems(gates)}
                            title="시간대별 운영 출국장"
                            unit="1블럭 = 출국장 1개"
                            // 출국장 수만큼 층을 둔다 (조회 전에는 0층이 되지 않게 받쳐 둔다)
                            levels={Math.max(gates.length, 1)}
                            rowH={CHART_ROW_H}
                            gridLeft={GUTTER}
                            stackMode="fixed"
                            blockFontSize={13}
                            line={panelData.wait}
                            footText="블럭을 클릭하면 아래 격자에서 그 출국장 줄이 켜집니다. 줄 라벨을 클릭하면 출국장 속성을 편집합니다."
                            actions={
                                <>
                                    <button
                                        type="button"
                                        className="bchart__act bchart__act--add"
                                        disabled={!active}
                                        onClick={openNew}
                                    >
                                        + 추가
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
                            selected={active && selected !== null ? [String(selected)] : []}
                            onBlockSelect={(label) => setSelected(Number(label))}
                            formatTip={(item, hour) => {
                                const gate = gates.find((it) => String(it.no) === item.label);
                                const range = gate?.ranges.find(
                                    (it) => hour >= it.start && hour < it.end,
                                );
                                const count = byGate[Number(item.label)]?.[hour] ?? 0;
                                const when = range
                                    ? `${range.start}~${range.end}시`
                                    : `${formatHour(hour)} ~ ${formatHour(hour + 1)}`;

                                return `${item.label}번 출국장 · ${when} · 검색대 ${count}대`;
                            }}
                            disabled={!active}
                        />

                        <ScGrid
                            gates={gates}
                            value={byGate}
                            onChange={(next) => setSc((prev) => ({ ...prev, [terminal]: next }))}
                            selected={active ? selected : null}
                            onSelect={setSelected}
                            onLabelClick={openGate}
                            disabled={!active}
                        />
                    </TerminalPanel>
                );
            })}

            {drawer && (
                <DetailDrawer
                    badge={String(drawer.draft.no)}
                    badgeColor={drawer.draft.color}
                    title={
                        drawer.target === null
                            ? `${drawer.draft.no}번 출국장 추가`
                            : `${drawer.draft.no}번 출국장`
                    }
                    subtitle={formatOperating(activeTerminal, drawer.draft.ranges)}
                    onClose={() => setDrawer(null)}
                    onConfirm={handleConfirm}
                >
                    <DrawerSection>
                        <div className="drow">
                            <p className="drow__label">출국장 운영 여부</p>
                            <div className="seg">
                                <button
                                    type="button"
                                    className={`seg__item${drawer.draft.off ? '' : ' is-on'}`}
                                    aria-pressed={!drawer.draft.off}
                                    onClick={() => patchDraft({ off: false })}
                                >
                                    사용
                                </button>
                                <button
                                    type="button"
                                    className={`seg__item${drawer.draft.off ? ' is-on' : ''}`}
                                    aria-pressed={drawer.draft.off}
                                    onClick={() => patchDraft({ off: true })}
                                >
                                    미사용
                                </button>
                            </div>
                        </div>
                    </DrawerSection>

                    <DrawerSection title="운영시간" hint="1시간 단위">
                        <TimeBar
                            label="선택 범위"
                            ranges={drawer.draft.ranges}
                            onChange={(ranges) => patchDraft({ ranges })}
                            disabled={drawer.draft.off}
                        />
                    </DrawerSection>

                    <DrawerSection title="검색대 구성" hint={`${drawer.draft.no}번 출국장 소속`}>
                        <CountStepper
                            label="일반"
                            value={drawer.draft.normalCnt}
                            onChange={(normalCnt) => patchDraft({ normalCnt })}
                        />
                        <CountStepper
                            label="스마트패스"
                            value={drawer.draft.smartPassCnt}
                            onChange={(smartPassCnt) => patchDraft({ smartPassCnt })}
                        />
                        <CountStepper
                            label="보안검색대"
                            sub="피크 시간대 기준"
                            value={drawer.draft.scCnt}
                            onChange={(scCnt) => patchDraft({ scCnt })}
                        />
                    </DrawerSection>
                </DetailDrawer>
            )}
        </>
    );
}
