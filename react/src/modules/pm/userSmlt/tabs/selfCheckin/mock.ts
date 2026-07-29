import type { TerminalKind } from '../../types';
import type { DeviceState, TerminalSelfCheckin } from './types';

/** 아일랜드 목록 — 원본 퍼블리싱과 동일하게 I 를 건너뛴다 */
const ISLANDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];

export const SELF_CHECKIN: Record<TerminalKind, TerminalSelfCheckin> = {
    T1: {
        total: 14,
        islands: ISLANDS,
        island: 'A',
        devices: [
            {
                id: 'kiosk',
                name: '셀프체크인 키오스크',
                count: 8,
                ranges: [
                    { start: 6, end: 14 },
                    { start: 16, end: 22 },
                ],
                off: false,
            },
            {
                id: 'bagdrop',
                name: '셀프백드롭',
                count: 6,
                ranges: [
                    { start: 6, end: 14 },
                    { start: 16, end: 21 },
                ],
                off: false,
            },
        ],
    },
    T2: {
        total: 8,
        islands: ISLANDS,
        island: 'A',
        devices: [
            {
                id: 'kiosk',
                name: '셀프체크인 키오스크',
                count: 5,
                ranges: [{ start: 7, end: 21 }],
                off: false,
            },
            {
                id: 'bagdrop',
                name: '셀프백드롭',
                count: 3,
                ranges: [{ start: 7, end: 20 }],
                off: false,
            },
        ],
    },
};

/** 기기 목록에서 초기 편집 상태를 만든다 */
export function toDeviceState(terminal: TerminalKind): DeviceState {
    return Object.fromEntries(
        SELF_CHECKIN[terminal].devices.map((device) => [
            device.id,
            { off: device.off, ranges: device.ranges },
        ]),
    );
}
