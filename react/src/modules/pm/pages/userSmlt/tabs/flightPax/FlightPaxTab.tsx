import { useEffect, useState } from 'react';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { useTerminalData } from '../../hooks/useTerminalData';
import { runSave } from '../../save';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, type TerminalKind } from '../../types';
import { BarChart } from './components/BarChart';
import { FlightEditor } from './components/FlightEditor';
import type { EditMode } from './types';
import { EMPTY_FLIGHT_PAX, toFlightPax, toSaveReq } from './view';

interface FlightPaxTabProps {
    smltIds: Record<TerminalKind, string>;
    reloadKey: number;
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 (전체 비율 / 수정 방식) */
type EditState = Record<TerminalKind, { ratio: number; mode: EditMode }>;

const EMPTY_EDIT: EditState = {
    T1: { ratio: 0, mode: 'ratio' },
    T2: { ratio: 0, mode: 'ratio' },
};

const FETCH_FAIL = '운항편/여객수 정보를 불러오지 못했습니다.';
const SAVE_FAIL = '운항편/여객수 저장에 실패했습니다.';

/** 조회·매핑 함수는 렌더마다 새로 만들지 않도록 컴포넌트 밖에 둔다 */
const fetchFltPsg = (smltId: string, tmnlId: TerminalKind) =>
    userSmltService.getFltPsgInfo(smltId, tmnlId);

/** 운항편/여객수 탭 */
export function FlightPaxTab({
    smltIds,
    reloadKey,
    activeTerminal,
    onTerminalChange,
}: FlightPaxTabProps) {
    const { data, raw, error } = useTerminalData(
        smltIds,
        reloadKey,
        fetchFltPsg,
        toFlightPax,
        FETCH_FAIL,
    );
    const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);

    useErrorAlert(error);

    // 조회 결과가 들어오면 편집 상태를 조회한 값으로 되돌린다.
    useEffect(() => {
        setEdit({
            T1: {
                ratio: raw.T1?.adjRate ?? 0,
                mode: raw.T1?.adjType === 'HOURLY' ? 'hourly' : 'ratio',
            },
            T2: {
                ratio: raw.T2?.adjRate ?? 0,
                mode: raw.T2?.adjType === 'HOURLY' ? 'hourly' : 'ratio',
            },
        });
    }, [raw]);

    const patchEdit = (terminal: TerminalKind, next: Partial<EditState[TerminalKind]>) => {
        setEdit((prev) => ({ ...prev, [terminal]: { ...prev[terminal], ...next } }));
    };

    const handleSave = (terminal: TerminalKind) => {
        const dto = raw[terminal];
        const smltId = smltIds[terminal];
        if (!dto || !smltId) return;

        runSave(
            userSmltService.saveFltPsgInfo(toSaveReq(smltId, terminal, dto, edit[terminal])),
            SAVE_FAIL,
        );
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const panelData = data[terminal] ?? EMPTY_FLIGHT_PAX;
                const active = terminal === activeTerminal;

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        active={active}
                        onActivate={() => onTerminalChange(terminal)}
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
                            terminal={terminal}
                            ratio={edit[terminal].ratio}
                            onRatioChange={(ratio) => patchEdit(terminal, { ratio })}
                            mode={edit[terminal].mode}
                            onModeChange={(mode) => patchEdit(terminal, { mode })}
                            rows={panelData.rows}
                            disabled={!active}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
