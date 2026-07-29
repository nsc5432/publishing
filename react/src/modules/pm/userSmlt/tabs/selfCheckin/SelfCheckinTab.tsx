import './selfCheckin.css';
import { useState } from 'react';
import type { TimeRange } from '@/components/ui/time-range-selector';
import { IslandPicker } from '../../components/IslandPicker';
import { SummaryMapButton } from '../../components/SummaryMapButton';
import { TerminalPanel } from '../../components/TerminalPanel';
import { TERMINALS, type TerminalKind } from '../../types';
import { DeviceRow } from './components/DeviceRow';
import { SELF_CHECKIN, toDeviceState } from './mock';
import type { DeviceState } from './types';

interface SelfCheckinTabProps {
    activeTerminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
}

/** 터미널별 편집 상태 (아일랜드 / 기기별 미운영·운영시간) */
type EditState = Record<TerminalKind, { island: string; devices: DeviceState }>;

const INITIAL_EDIT: EditState = {
    T1: { island: SELF_CHECKIN.T1.island, devices: toDeviceState('T1') },
    T2: { island: SELF_CHECKIN.T2.island, devices: toDeviceState('T2') },
};

/**
 * 셀프체크인/백드롭 탭 — html/셀프체크인_백드롭/index.html 이식.
 * 터미널별 편집 상태를 각각 들고 있어 터미널을 오가도 값이 보존된다.
 */
export function SelfCheckinTab({ activeTerminal, onTerminalChange }: SelfCheckinTabProps) {
    const [edit, setEdit] = useState<EditState>(INITIAL_EDIT);

    const patchDevice = (
        terminal: TerminalKind,
        id: string,
        next: Partial<{ off: boolean; ranges: TimeRange[] }>,
    ) => {
        setEdit((prev) => ({
            ...prev,
            [terminal]: {
                ...prev[terminal],
                devices: {
                    ...prev[terminal].devices,
                    [id]: { ...prev[terminal].devices[id], ...next },
                },
            },
        }));
    };

    const handleSave = (terminal: TerminalKind) => {
        // 실제 저장 연동 전: 현재 편집 상태만 확인한다.
        console.log('[현재상태 저장]', { terminal, ...edit[terminal] });
    };

    return (
        <>
            {TERMINALS.map((terminal) => {
                const data = SELF_CHECKIN[terminal];
                const state = edit[terminal];
                const active = terminal === activeTerminal;

                // 운영 중(미운영 해제)인 기기의 대수 합계
                const operatingCount = data.devices.reduce(
                    (sum, device) => (state.devices[device.id].off ? sum : sum + device.count),
                    0,
                );

                return (
                    <TerminalPanel
                        key={terminal}
                        terminal={terminal}
                        active={active}
                        onActivate={() => onTerminalChange(terminal)}
                        summary={
                            <>
                                <div className="summary__group">
                                    <span className="summary__label">전체</span>
                                    <strong className="summary__value">{data.total}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">운영</span>
                                    <strong className="summary__value">{operatingCount}</strong>
                                </div>
                                <div className="summary__group">
                                    <span className="summary__label">아일랜드</span>
                                    <strong className="summary__value summary__value--island">
                                        {state.island}
                                    </strong>
                                </div>
                                <SummaryMapButton
                                    disabled={!active}
                                    onClick={() => console.log('[지도 보기]', { terminal })}
                                />
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
                        <div className="devices">
                            {data.devices.map((device) => (
                                <DeviceRow
                                    key={device.id}
                                    device={device}
                                    off={state.devices[device.id].off}
                                    onOffChange={(off) => patchDevice(terminal, device.id, { off })}
                                    ranges={state.devices[device.id].ranges}
                                    onRangesChange={(ranges) =>
                                        patchDevice(terminal, device.id, { ranges })
                                    }
                                    disabled={!active}
                                />
                            ))}
                        </div>

                        <IslandPicker
                            islands={data.islands}
                            value={state.island}
                            onChange={(island) =>
                                setEdit((prev) => ({
                                    ...prev,
                                    [terminal]: { ...prev[terminal], island },
                                }))
                            }
                            disabled={!active}
                        />
                    </TerminalPanel>
                );
            })}
        </>
    );
}
