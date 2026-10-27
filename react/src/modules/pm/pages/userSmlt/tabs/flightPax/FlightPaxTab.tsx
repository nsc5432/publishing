import { useEffect, useRef, useMemo, useState } from 'react';
import type { UserSmltQuery } from '@/types/api.types';
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

const fetchFltPsg = (query: UserSmltQuery, tmnlId: TerminalKind) => userSmltService.getFltPsgInfo(query, tmnlId);

const keepDto = (dto: UserSmltFltPsgDto) => dto;

export function FlightPaxTab({
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
    const { raw: dtoByTerminal, error, responseSeq } = useTerminalData(query, reloadKey, fetchFltPsg, keepDto, '운항편/여객수 정보를 불러오지 못했습니다.');
    const [ratios, setRatios] = useState<RatioState>({ T1: 0, T2: 0 });

    const panelDataByTerminal = useMemo(
        () => ({
            T1: dtoByTerminal.T1 ? toFlightPax(dtoByTerminal.T1, ratios.T1) : EMPTY_FLIGHT_PAX,
            T2: dtoByTerminal.T2 ? toFlightPax(dtoByTerminal.T2, ratios.T2) : EMPTY_FLIGHT_PAX,
        }),
        [dtoByTerminal, ratios],
    );

    const dirty = useRef<Record<TerminalKind, boolean>>({ T1: false, T2: false });

    useErrorAlert(error, responseSeq);

    useEffect(() => {
        setRatios({
            T1: dtoByTerminal.T1?.ajmtRt ?? 0,
            T2: dtoByTerminal.T2?.ajmtRt ?? 0,
        });
    }, [dtoByTerminal]);

    const handleRatioChange = (terminal: TerminalKind, ratio: number) => {
        if (busy) return;
        dirty.current[terminal] = true;
        setRatios((previousRatios) => ({ ...previousRatios, [terminal]: ratio }));
    };

    const handleSave = async (terminal: TerminalKind) => {
        if (busy || readOnly) return;
        const dto = dtoByTerminal[terminal];
        const ymd = query.ymd;
        if (!dto || !ymd) return;

        if (!beginRequest()) return;
        const saved = await runSave(userSmltService.saveFltPsgInfo(toSaveReq(ymd, terminal, ratios[terminal])), '운항편/여객수 저장에 실패했습니다.');
        endRequest(saved);
        if (saved) dirty.current[terminal] = false;
    };

    useEffect(() => {
        onDraftChange('flightPax', () => ({
            fltPsgList: TERMINALS.filter((terminal) => dirty.current[terminal] && dtoByTerminal[terminal]).map((terminal) =>
                toSaveReq(query.ymd, terminal, ratios[terminal]),
            ),
        }));
    }, [dtoByTerminal, onDraftChange, query.ymd, ratios]);

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
                            <button type="button" className="btn btn--save" disabled={busy || readOnly || !dtoByTerminal[terminal]} onClick={() => handleSave(terminal)}>
                                현재상태 저장
                            </button>
                        }
                    >
                        <BarChart data={panelData.flightChart} />
                        <BarChart data={panelData.paxChart} />

                        <FlightEditor
                            readOnly={readOnly}
                            ratio={ratios[terminal]}
                            onRatioChange={(ratio) => handleRatioChange(terminal, ratio)}
                            rows={panelData.rows}
                            disabled={busy || !terminalEnabled || Boolean(readOnly)}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
