import type { TmnlId, UserSmltChknDto, UserSmltChknSaveReq } from '@/types/api.types';
import { BLOCK_COLORS } from '../../types';
import { EMPTY_WAIT_LINE, toKpis, toWaitLine } from '../../view';
import type { CheckinIsland, TerminalCheckinCounter } from './types';

/**
 * 체크인 카운터 DTO → 화면 뷰 모델.
 *
 * 블럭 색은 서버가 모르는 화면 표기라 내려온 순서대로 돌려 쓴다.
 */

function toIslands(dto: UserSmltChknDto): CheckinIsland[] {
    return dto.islandList.map((island, i) => ({
        label: island.island,
        color: BLOCK_COLORS[i % BLOCK_COLORS.length],
        ranges: island.oprTimeList.map((time) => ({ start: time.bgnHour, end: time.endHour })),
        booths: island.boothList.map((booth) => ({ no: booth.boothNo, airline: booth.alnCd })),
        kiosk: island.kioskCnt,
        bagdrop: island.bagDropCnt,
    }));
}

export function toCheckinCounter(dto: UserSmltChknDto): TerminalCheckinCounter {
    return {
        total: dto.totCnt,
        airlines: dto.alnCdList,
        islandCodes: dto.islandCdList,
        islands: toIslands(dto),
        wait: toWaitLine(dto.waitList, dto.waitMaxCnt),
        kpis: toKpis(dto.kpi),
    };
}

/**
 * 저장 요청 — 아일랜드 1개분이 아니라 터미널 1개분 전체를 보낸다.
 * 화면에서 지운 아일랜드는 목록에서 빠지는 것으로 삭제를 알린다.
 */
export function toSaveReq(
    smltId: string,
    tmnlId: TmnlId,
    islands: CheckinIsland[],
): UserSmltChknSaveReq {
    return {
        smltId,
        tmnlId,
        islandList: islands.map((island) => ({
            island: island.label,
            oprTimeList: island.ranges.map((range) => ({
                bgnHour: range.start,
                endHour: range.end,
            })),
            boothList: island.booths.map((booth) => ({
                boothNo: booth.no,
                alnCd: booth.airline,
                // Custom 배정은 원천 미확보라 항상 N 이다
                customYn: 'N' as const,
            })),
            kioskCnt: island.kiosk,
            bagDropCnt: island.bagdrop,
        })),
    };
}

/** 아직 응답이 없을 때 그릴 빈 패널 (골격은 그대로 두고 값만 비운다) */
export const EMPTY_CHECKIN_COUNTER: TerminalCheckinCounter = {
    total: 0,
    airlines: [],
    islandCodes: [],
    islands: [],
    wait: EMPTY_WAIT_LINE,
    kpis: [],
};
