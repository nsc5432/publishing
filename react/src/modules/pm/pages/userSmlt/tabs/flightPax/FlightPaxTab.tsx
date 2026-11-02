import { useEffect, useRef, useMemo, useState } from 'react';
import type { UserSmltQuery } from '@/types/api.types';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import type { UserSmltFltPsgDto } from '@/types/api.types';
import { useTerminalData } from '../../hooks/useTerminalData';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, enabledTerminals, type SmltTabProps, type TerminalKind } from '../../types';
import { FlightPaxChart } from './components/FlightPaxChart';
import { FlightEditor } from './components/FlightEditor';
import type { FlightPaxDraft } from './types';
import { EMPTY_DRAFT, EMPTY_FLIGHT_PAX, toDraft, toFlightPax, toSaveReq } from './view';

type DraftState = Record<TerminalKind, FlightPaxDraft>;

const fetchFltPsg = (query: UserSmltQuery, tmnlId: TerminalKind) => userSmltService.getFltPsgInfo(query, tmnlId);

const keepDto = (dto: UserSmltFltPsgDto) => dto;

export function FlightPaxTab({
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
    const { raw: dtoByTerminal, error, responseSeq } = useTerminalData(query, reloadKey, fetchFltPsg, keepDto, '운항편/여객수 정보를 불러오지 못했습니다.');
    const [drafts, setDrafts] = useState<DraftState>({ T1: EMPTY_DRAFT, T2: EMPTY_DRAFT });

    const panelDataByTerminal = useMemo(
        () => ({
            T1: dtoByTerminal.T1 ? toFlightPax(dtoByTerminal.T1, drafts.T1) : EMPTY_FLIGHT_PAX,
            T2: dtoByTerminal.T2 ? toFlightPax(dtoByTerminal.T2, drafts.T2) : EMPTY_FLIGHT_PAX,
        }),
        [dtoByTerminal, drafts],
    );

    const dirty = useRef<Record<TerminalKind, boolean>>({ T1: false, T2: false });

    useErrorAlert(error, responseSeq);

    useEffect(() => {
        setDrafts({
            T1: dtoByTerminal.T1 ? toDraft(dtoByTerminal.T1) : EMPTY_DRAFT,
            T2: dtoByTerminal.T2 ? toDraft(dtoByTerminal.T2) : EMPTY_DRAFT,
        });
    }, [dtoByTerminal]);

    const updateDraft = (terminal: TerminalKind, update: (draft: FlightPaxDraft) => FlightPaxDraft) => {
        if (busy) return;
        dirty.current[terminal] = true;
        setDrafts((previousDrafts) => ({ ...previousDrafts, [terminal]: update(previousDrafts[terminal]) }));
    };

    const handleRatioChange = (terminal: TerminalKind, ratio: number) =>
        updateDraft(terminal, (draft) => ({ ajmtRt: ratio, hourRates: draft.hourRates.map(() => ratio) }));

    const handleHourRatioChange = (terminal: TerminalKind, index: number, ratio: number) =>
        updateDraft(terminal, (draft) => ({
            ...draft,
            hourRates: draft.hourRates.map((hourRate, hourIndex) => (hourIndex === index ? ratio : hourRate)),
        }));

    useEffect(() => {
        onDraftChange('flightPax', {
            collect: (all = false) => ({
                fltPsgList: TERMINALS.flatMap((terminal) => {
                    const dto = dtoByTerminal[terminal];
                    return (all || dirty.current[terminal]) && dto ? [toSaveReq(query.ymd, terminal, dto, drafts[terminal])] : [];
                }),
            }),
            onSaved: () => {
                dirty.current = { T1: false, T2: false };
            },
        });
    }, [dtoByTerminal, onDraftChange, query.ymd, drafts]);

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
                                    <span className="summary__label">최다 운항 시간대</span>
                                    <strong className="summary__value summary__value--accent">{panelData.peak}</strong>
                                </div>
                            </>
                        }
                    >
                        <FlightPaxChart data={panelData.chart} />

                        <FlightEditor
                            readOnly={readOnly}
                            ratio={drafts[terminal].ajmtRt}
                            onRatioChange={(ratio) => handleRatioChange(terminal, ratio)}
                            onHourRatioChange={(index, ratio) => handleHourRatioChange(terminal, index, ratio)}
                            rows={panelData.rows}
                            disabled={busy || !terminalEnabled || Boolean(readOnly)}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
