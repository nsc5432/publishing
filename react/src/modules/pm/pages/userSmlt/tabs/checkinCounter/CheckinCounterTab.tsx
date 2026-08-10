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
import { BoothGrid } from './components/BoothGrid';
import { BOOTH_PER_BLOCK } from './constants';
import type { CheckinIsland, TerminalCheckinCounter } from './types';
import { EMPTY_CHECKIN_COUNTER, toCheckinCounter, toSaveReq } from './view';

interface CheckinCounterTabProps {
    smltIds: Record<TerminalKind, string>;
    reloadKey: number;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 — 아일랜드 목록 전체가 편집 대상이다 */
type EditState = Record<TerminalKind, CheckinIsland[]>;

/** 드로어 편집값 — 변경을 눌러야 목록(EditState)에 반영된다 */
interface DrawerState {
    draft: CheckinIsland;
    target: string | null;
    selectedBooth: number | null;
}

const EMPTY_EDIT: EditState = { T1: [], T2: [] };

const FETCH_FAIL = '체크인 카운터 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '체크인 카운터 저장에 실패했습니다.';

/** 조회 함수는 렌더마다 새로 만들지 않도록 컴포넌트 밖에 둔다 */
const fetchChkn = (smltId: string, tmnlId: TerminalKind) =>
    userSmltService.getChknCounterInfo(smltId, tmnlId);

/** 블럭 차트 항목 — 세로 높이가 그 시간대에 열린 부스 규모가 된다 */
function toBlockItems(islands: CheckinIsland[]): BlockItem[] {
    return islands.map((island) => ({
        label: island.label,
        color: island.color,
        ranges: island.ranges,
        size: island.booths.length,
    }));
}

/** 요약: 피크 카운터 = 시간대별 열린 부스 수의 최댓값 */
function peakBooths(islands: CheckinIsland[]): number {
    const byHour: number[] = Array(24).fill(0);
    islands.forEach((island) => {
        toHourList(island.ranges).forEach((hour) => {
            byHour[hour] += island.booths.length;
        });
    });

    return Math.max(0, ...byHour);
}

/** `+ 추가` — 아직 안 쓴 아일랜드 문자로 빈 값을 만든다 */
function newIsland(data: TerminalCheckinCounter, islands: CheckinIsland[]): CheckinIsland {
    const used = islands.map((island) => island.label);
    const label = data.islandCodes.find((code) => !used.includes(code)) ?? '';

    return {
        label,
        color: BLOCK_COLORS[islands.length % BLOCK_COLORS.length],
        ranges: [],
        // 부스 수는 배정정보에서 오지만 신규는 기준이 없으므로 1블럭(4석)분 미배정으로 연다
        booths: Array.from({ length: BOOTH_PER_BLOCK }, (_, i) => ({ no: i + 1, airline: '' })),
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
    const [drawer, setDrawer] = useState<DrawerState | null>(null);

    useErrorAlert(error);

    // 조회 결과가 들어오면 편집 상태를 조회한 값으로 되돌린다.
    useEffect(() => {
        setEdit({ T1: fetched.T1?.islands ?? [], T2: fetched.T2?.islands ?? [] });
        setDrawer(null);
    }, [fetched]);

    const data = fetched[activeTerminal] ?? EMPTY_CHECKIN_COUNTER;
    const islands = edit[activeTerminal];

    /** 편집 중이던 드로어는 터미널이 바뀌면 닫는다 (편집값은 터미널별로 남는다) */
    const handleTerminalChange = (terminal: TerminalKind) => {
        setDrawer(null);
        onTerminalChange(terminal);
    };

    const openIsland = (label: string) => {
        const island = islands.find((it) => it.label === label);
        if (!island) return;

        setDrawer({ draft: island, target: label, selectedBooth: null });
    };

    const openNew = () => {
        setDrawer({ draft: newIsland(data, islands), target: null, selectedBooth: null });
    };

    const patchDraft = (next: Partial<CheckinIsland>) => {
        setDrawer((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...next } } : prev));
    };

    /** 선택한 부스에 항공사를 배정한다 */
    const assignAirline = (airline: string) => {
        if (!drawer) return;
        if (drawer.selectedBooth === null) {
            // 실제 배정 UI 연동 전: 부스를 먼저 고르라는 안내 대신 조작 의도만 남긴다.
            console.log('[항공사 배정] 부스를 먼저 선택하세요', { airline });
            return;
        }

        patchDraft({
            booths: drawer.draft.booths.map((booth) =>
                booth.no === drawer.selectedBooth ? { ...booth, airline } : booth,
            ),
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
                    : prev[activeTerminal].map((it) => (it.label === target ? draft : it)),
        }));
        setDrawer(null);
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
                const kiosk = panelIslands.reduce((sum, it) => sum + it.kiosk, 0);
                const bagdrop = panelIslands.reduce((sum, it) => sum + it.bagdrop, 0);

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
                            unitNote={`1블럭 = 부스 ${BOOTH_PER_BLOCK}석`}
                            levels={10}
                            rowH={22}
                            unitSize={BOOTH_PER_BLOCK}
                            legend={panelIslands.map((island) => ({
                                label: island.label,
                                color: island.color,
                                note: `${island.booths.length}석`,
                            }))}
                            line={panelData.wait}
                            footText="블럭을 클릭하면 아일랜드별 배정을 조정합니다. 초기값은 배정정보로 채워집니다."
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
                            selectedLabel={active ? (drawer?.target ?? null) : null}
                            onBlockSelect={openIsland}
                            formatTip={(item, hour) =>
                                `아일랜드 ${item.label} · 부스 ${item.size}석 · ${formatHour(hour)} ~ ${formatHour(hour + 1)}`
                            }
                            disabled={!active}
                        />

                        <div className="selfbar">
                            <p className="selfbar__title">
                                셀프 서비스<span>체크인 카운터에 통합</span>
                            </p>
                            <div className="selfbar__items">
                                <span className="selfbar__item">
                                    셀프체크인 키오스크 <b>{kiosk}</b>대
                                </span>
                                <span className="selfbar__item">
                                    셀프백드롭 <b>{bagdrop}</b>대
                                </span>
                            </div>
                            <p className="selfbar__note">
                                아일랜드 블럭을 클릭하면 아일랜드별로 조정합니다
                            </p>
                        </div>
                    </TerminalPanel>
                );
            })}

            {drawer && (
                <DetailDrawer
                    badge={drawer.draft.label}
                    badgeColor={drawer.draft.color}
                    title={
                        drawer.target === null
                            ? `아일랜드 ${drawer.draft.label} 추가`
                            : `아일랜드 ${drawer.draft.label}`
                    }
                    subtitle={formatOperating(activeTerminal, drawer.draft.ranges)}
                    onClose={() => setDrawer(null)}
                    onConfirm={handleConfirm}
                >
                    <DrawerSection title="운영시간" hint="1시간 단위">
                        <TimeBar
                            label="운영시간"
                            ranges={drawer.draft.ranges}
                            onChange={(ranges) => patchDraft({ ranges })}
                        />
                    </DrawerSection>

                    <DrawerSection
                        title="자원 배정"
                        hint={`부스 ${drawer.draft.booths.length}석 · 배정정보 기준`}
                    >
                        <BoothGrid
                            booths={drawer.draft.booths}
                            selected={drawer.selectedBooth}
                            onSelect={(no) =>
                                setDrawer((prev) =>
                                    prev
                                        ? {
                                            ...prev,
                                            selectedBooth: prev.selectedBooth === no ? null : no,
                                        }
                                        : prev,
                                )
                            }
                        />

                        <div className="drow">
                            <p className="drow__label">배정 항공사</p>
                            <div className="airchips">
                                {data.airlines.map((airline) => (
                                    <button
                                        key={airline}
                                        type="button"
                                        className="airchip"
                                        onClick={() => assignAirline(airline)}
                                    >
                                        {airline}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="airchip airchip--ghost"
                                    onClick={() => console.log('[Custom 항공사 추가]')}
                                >
                                    + Custom
                                </button>
                            </div>
                        </div>
                    </DrawerSection>

                    <DrawerSection title="셀프 서비스" hint="구 셀프체크인/백드롭 탭">
                        <CountStepper
                            label="셀프체크인 카운터"
                            value={drawer.draft.kiosk}
                            onChange={(kiosk) => patchDraft({ kiosk })}
                        />
                        <CountStepper
                            label="셀프백드롭"
                            value={drawer.draft.bagdrop}
                            onChange={(bagdrop) => patchDraft({ bagdrop })}
                        />
                    </DrawerSection>
                </DetailDrawer>
            )}
        </>
    );
}
