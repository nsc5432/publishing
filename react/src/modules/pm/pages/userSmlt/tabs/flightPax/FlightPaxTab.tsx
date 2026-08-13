import { useEffect, useMemo, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import type { UserSmltFltPsgDto } from '@/types/api.types';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, enabledTerminals, type SmltTabProps, type TerminalKind } from '../../types';
import { BarChart } from './components/BarChart';
import { FlightEditor } from './components/FlightEditor';
import { EMPTY_FLIGHT_PAX, toFlightPax, toSaveReq } from './view';

/** 터미널별 전체 비율 (%) */
type RatioState = Record<TerminalKind, number>;

const EMPTY_RATIO: RatioState = { T1: 0, T2: 0 };

const FETCH_FAIL = '운항편/여객수 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '운항편/여객수 저장에 실패했습니다.';

/** 조회·매핑 함수는 렌더마다 새로 만들지 않도록 컴포넌트 밖에 둔다 */
const fetchFltPsg = (smltId: string, tmnlId: TerminalKind) =>
    userSmltService.getFltPsgInfo(smltId, tmnlId);

/**
 * 뷰 변환에 화면 상태(전체 비율)가 필요해 조회 훅에서는 DTO 를 그대로 받는다.
 * 실제 매핑은 비율까지 아는 아래 useMemo 에서 한다.
 */
const keepDto = (dto: UserSmltFltPsgDto) => dto;

/** 운항편/여객수 탭 */
export function FlightPaxTab({
    smltIds,
    reloadKey,
    enabled,
    onToggleTerminal,
    focusTerminal,
    onFocusChange,
}: SmltTabProps) {
    const { raw, error } = useTerminalData(smltIds, reloadKey, fetchFltPsg, keepDto, FETCH_FAIL);
    const [ratios, setRatios] = useState<RatioState>(EMPTY_RATIO);

    // 비율이 바뀌면 차트·표를 조회값 기준으로 다시 계산한다.
    const panels = useMemo(
        () => ({
            T1: raw.T1 ? toFlightPax(raw.T1, ratios.T1) : EMPTY_FLIGHT_PAX,
            T2: raw.T2 ? toFlightPax(raw.T2, ratios.T2) : EMPTY_FLIGHT_PAX,
        }),
        [raw, ratios],
    );

    useErrorAlert(error);

    // 조회 결과가 들어오면 비율을 조회한 값으로 되돌린다.
    useEffect(() => {
        setRatios({ T1: raw.T1?.adjRate ?? 0, T2: raw.T2?.adjRate ?? 0 });
    }, [raw]);

    const handleRatioChange = (terminal: TerminalKind, ratio: number) => {
        setRatios((prev) => ({ ...prev, [terminal]: ratio }));
    };

    const handleSave = (terminal: TerminalKind) => {
        const dto = raw[terminal];
        const smltId = smltIds[terminal];
        if (!dto || !smltId) return;

        runSave(
            userSmltService.saveFltPsgInfo(toSaveReq(smltId, terminal, dto, ratios[terminal])),
            SAVE_FAIL,
        );
    };

    const enabledCount = enabledTerminals(enabled).length;

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = panels[terminal];
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
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">운항편</span>
                                    <strong className="summary__value">{panelData.flights}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">여객</span>
                                    <strong className="summary__value">{panelData.pax}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">피크</span>
                                    <strong className="summary__value summary__value--accent">
                                        {panelData.peak}
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
                        <BarChart data={panelData.flightChart} />
                        <BarChart data={panelData.paxChart} />

                        <FlightEditor
                            ratio={ratios[terminal]}
                            onRatioChange={(ratio) => handleRatioChange(terminal, ratio)}
                            rows={panelData.rows}
                            disabled={!on}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
