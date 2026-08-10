import { useEffect, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { BlockChart } from '../../components/BlockChart';
import { CountStepper } from '../../components/CountStepper';
import { DetailDrawer, DrawerSection } from '../../components/DetailDrawer';
import { TimeBar } from '../../components/TimeBar';
import { TerminalPanel } from '../../components/TerminalPanel';
import { formatHour, formatOperating, toHourList } from '../../format';
import { useErrorAlert } from '../../hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { BLOCK_COLORS, TERMINALS, type BlockItem, type TerminalKind } from '../../types';
import { ScRangeTable } from './components/ScRangeTable';
import { SC_PER_BLOCK } from './constants';
import type { DepartureGate } from './types';
import { EMPTY_DEPARTURE, toDeparture, toSaveReq } from './view';

interface DepartureTabProps {
    smltIds: Record<TerminalKind, string>;
    reloadKey: number;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 — 출국장 목록 전체가 편집 대상이다 */
type EditState = Record<TerminalKind, DepartureGate[]>;

/** 드로어 편집값 — 변경을 눌러야 목록(EditState)에 반영된다 */
interface DrawerState {
    draft: DepartureGate;
    /** 기존 출국장 수정이면 그 번호, `+ 추가` 로 연 신규면 null */
    target: number | null;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };

const FETCH_FAIL = '출국장 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '출국장 저장에 실패했습니다.';

/** 조회 함수는 렌더마다 새로 만들지 않도록 컴포넌트 밖에 둔다 */
const fetchDep = (smltId: string, tmnlId: TerminalKind) =>
    userSmltService.getDepInfo(smltId, tmnlId);

/** 운영계획을 시간대별 검색대 대수로 편다 — 타임바 슬롯 숫자 / 피크 계산에 함께 쓴다 */
function scByHour(gate: DepartureGate): Record<number, number> {
    const byHour: Record<number, number> = {};
    gate.plans.forEach((plan) => {
        for (let h = plan.startHour; h < plan.endHour; h += 1) byHour[h] = plan.count;
    });

    return byHour;
}

/** 요약: 피크 검색대 = 시간대별 운영 검색대 합의 최댓값 */
function peakSc(gates: DepartureGate[]): number {
    const byHour: number[] = Array(24).fill(0);
    gates
        .filter((gate) => !gate.off)
        .forEach((gate) => {
            const sc = scByHour(gate);
            toHourList(gate.ranges).forEach((hour) => {
                byHour[hour] += sc[hour] ?? 0;
            });
        });

    return Math.max(0, ...byHour);
}

/** 주 차트 — 블럭 1개 = 출국장 1개 */
function toGateItems(gates: DepartureGate[]): BlockItem[] {
    return gates.map((gate) => ({
        label: String(gate.no),
        color: gate.color,
        ranges: gate.ranges,
        size: 1,
    }));
}

/** 보조 차트 — 블럭 1개 = 검색대 4대 */
function toScItems(gates: DepartureGate[]): BlockItem[] {
    return gates.map((gate) => ({
        label: String(gate.no),
        color: gate.color,
        ranges: gate.ranges,
        size: gate.scCnt,
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

let planSeq = 0;

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
    const [drawer, setDrawer] = useState<DrawerState | null>(null);

    useErrorAlert(error);

    // 조회 결과가 들어오면 편집 상태를 조회한 값으로 되돌린다.
    useEffect(() => {
        setEdit({ T1: fetched.T1?.gates ?? [], T2: fetched.T2?.gates ?? [] });
        setDrawer(null);
    }, [fetched]);

    /** 편집 중이던 드로어는 터미널이 바뀌면 닫는다 (편집값은 터미널별로 남는다) */
    const handleTerminalChange = (terminal: TerminalKind) => {
        setDrawer(null);
        onTerminalChange(terminal);
    };

    const openGate = (label: string) => {
        const gate = edit[activeTerminal].find((it) => String(it.no) === label);
        if (!gate) return;

        setDrawer({ draft: gate, target: gate.no });
    };

    const openNew = () => {
        setDrawer({ draft: newGate(edit[activeTerminal]), target: null });
    };

    const patchDraft = (next: Partial<DepartureGate>) => {
        setDrawer((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...next } } : prev));
    };

    /** 구간 추가 — 마지막 구간 다음 2시간을 현재 검색대 대수로 잡아 준다 */
    const addPlan = () => {
        if (!drawer) return;

        const { draft } = drawer;
        const opened = toHourList(draft.ranges);
        const lastEnd = draft.plans.reduce((max, plan) => Math.max(max, plan.endHour), 0);
        const startHour = Math.max(lastEnd, opened[0] ?? 0);
        const endHour = Math.min(startHour + 2, opened[opened.length - 1] ?? 24);
        if (endHour <= startHour) return;

        patchDraft({
            plans: [
                ...draft.plans,
                { id: `new-${(planSeq += 1)}`, startHour, endHour, count: draft.scCnt },
            ],
        });
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
        setDrawer(null);
    };

    const handleSave = (terminal: TerminalKind) => {
        const smltId = smltIds[terminal];
        if (!smltId) return;

        runSave(
            userSmltService.saveDepInfo(toSaveReq(smltId, terminal, edit[terminal])),
            SAVE_FAIL,
        );
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
                const active = terminal === activeTerminal;
                const operating = gates.filter((gate) => !gate.off);
                const offGates = gates.filter((gate) => gate.off);

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
                                        {peakSc(gates)}
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
                            items={toGateItems(operating)}
                            title="시간대별 운영 출국장"
                            unit="(단위: 출국장 수)"
                            levels={6}
                            rowH={22}
                            blockFontSize={13}
                            legend={operating.map((gate) => ({
                                label: `${gate.no}출국장`,
                                color: gate.color,
                                note: `검색대 ${gate.scCnt}`,
                            }))}
                            line={panelData.wait}
                            footText="블럭을 클릭하면 출국장별 운영시간·검색대를 관리합니다. 초기값은 배정정보로 채워집니다."
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
                            selectedLabel={
                                active && drawer?.target !== null && drawer?.target !== undefined
                                    ? String(drawer.target)
                                    : null
                            }
                            onBlockSelect={openGate}
                            formatTip={(item, hour) =>
                                `${item.label}번 출국장 · 보안검색대 ${
                                    gates.find((gate) => String(gate.no) === item.label)?.scCnt ?? 0
                                }대 · ${formatHour(hour)} ~ ${formatHour(hour + 1)}`
                            }
                            disabled={!active}
                        />

                        {/* 구 보안 검색대 탭 — 시간축은 위 차트와 같으므로 X축을 생략한다 */}
                        <BlockChart
                            items={toScItems(operating)}
                            title="시간대별 보안검색대"
                            unit="(단위: 검색대 수)"
                            unitNote={`1블럭 = 검색대 ${SC_PER_BLOCK}대 · 초기값`}
                            levels={8}
                            rowH={14}
                            unitSize={SC_PER_BLOCK}
                            compact
                            showScale={false}
                            headExtra={
                                <div className="offchips">
                                    미운영
                                    {offGates.length === 0 ? (
                                        <span className="offchip">없음</span>
                                    ) : (
                                        offGates.map((gate) => (
                                            <span key={gate.no} className="offchip">
                                                {gate.no}번 출국장
                                            </span>
                                        ))
                                    )}
                                </div>
                            }
                            headActions={
                                <button
                                    type="button"
                                    className="bchart__act bchart__act--even"
                                    disabled={!active}
                                    onClick={() => console.log('[균등 배치]', { terminal })}
                                >
                                    균등 배치
                                </button>
                            }
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

                    <DrawerSection title="운영시간" hint="슬롯 안 숫자 = 시간대별 검색대 대수">
                        <TimeBar
                            label="선택 범위"
                            ranges={drawer.draft.ranges}
                            onChange={(ranges) => patchDraft({ ranges })}
                            values={scByHour(drawer.draft)}
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

                    <DrawerSection
                        title="보안검색대 운영계획"
                        hint={
                            <>
                                <button
                                    type="button"
                                    className="btn--even"
                                    onClick={() =>
                                        console.log('[균등 배치]', { gate: drawer.draft.no })
                                    }
                                >
                                    균등 배치
                                </button>
                                <button type="button" className="btn--add" onClick={addPlan}>
                                    + 구간 추가
                                </button>
                            </>
                        }
                    >
                        <ScRangeTable
                            rows={drawer.draft.plans}
                            onDelete={(id) =>
                                patchDraft({
                                    plans: drawer.draft.plans.filter((plan) => plan.id !== id),
                                })
                            }
                        />
                    </DrawerSection>
                </DetailDrawer>
            )}
        </>
    );
}
