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

type RatioState = Record<TerminalKind, number>;

const EMPTY_RATIO: RatioState = { T1: 0, T2: 0 };

const FETCH_FAIL = '운항편/여객수 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '운항편/여객수 저장에 실패했습니다.';

const fetchFltPsg = (smltId: string, tmnlId: TerminalKind) => userSmltService.getFltPsgInfo(smltId, tmnlId);

const keepDto = (dto: UserSmltFltPsgDto) => dto;

export function FlightPaxTab({ smltIds, reloadKey, enabled, onToggleTerminal, focusTerminal, onFocusChange, readOnly }: SmltTabProps) {
    const { raw: dtoByTerminal, error, token } = useTerminalData(smltIds, reloadKey, fetchFltPsg, keepDto, FETCH_FAIL);
    const [ratios, setRatios] = useState<RatioState>(EMPTY_RATIO);

    const panelDataByTerminal = useMemo(
        () => ({
            T1: dtoByTerminal.T1 ? toFlightPax(dtoByTerminal.T1, ratios.T1) : EMPTY_FLIGHT_PAX,
            T2: dtoByTerminal.T2 ? toFlightPax(dtoByTerminal.T2, ratios.T2) : EMPTY_FLIGHT_PAX,
        }),
        [dtoByTerminal, ratios],
    );

    useErrorAlert(error, token);

    useEffect(() => {
        setRatios({
            T1: dtoByTerminal.T1?.ajmtRt ?? 0,
            T2: dtoByTerminal.T2?.ajmtRt ?? 0,
        });
    }, [dtoByTerminal]);

    const handleRatioChange = (terminal: TerminalKind, ratio: number) => {
        setRatios((previousRatios) => ({ ...previousRatios, [terminal]: ratio }));
    };

    const handleSave = (terminal: TerminalKind) => {
        const dto = dtoByTerminal[terminal];
        const smltId = smltIds[terminal];
        if (!dto || !smltId) return;

        runSave(userSmltService.saveFltPsgInfo(toSaveReq(smltId, terminal, dto, ratios[terminal])), SAVE_FAIL);
    };

    const enabledCount = enabledTerminals(enabled).length;

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = panelDataByTerminal[terminal];
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
                        readOnly={readOnly}
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
                                    <strong className="summary__value summary__value--accent">{panelData.peak}</strong>
                                </div>
                            </>
                        }
                        footer={
                            <button type="button" className="btn btn--save" onClick={() => handleSave(terminal)}>
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
                            disabled={!terminalEnabled || Boolean(readOnly)}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
