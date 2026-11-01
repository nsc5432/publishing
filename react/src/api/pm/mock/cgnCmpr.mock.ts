import type { MapCgnCmprDto, MapCgnStatDto, MapUnitRsltDto } from '@/types/api.types';

/** 터미널 비교 기준 — 서버와 같이 운영 부스 0 이고 처리 0 인 시설은 평균에서 뺀다 */
export function mockCgnCmpr(rsltList: (MapUnitRsltDto & { oprBoothCnt?: number })[]): MapCgnCmprDto {
    const included = rsltList.filter(({ stat, oprBoothCnt = 0 }) => oprBoothCnt > 0 || stat.prcsPsgCnt > 0);
    const prcsSum = included.reduce((sum, { stat }) => sum + stat.prcsPsgCnt, 0);
    const weightedSum = (pick: (stat: MapCgnStatDto) => number) => included.reduce((sum, { stat }) => sum + pick(stat) * stat.prcsPsgCnt, 0);

    return {
        unitCnt: included.length,
        totWtngPsgCnt: rsltList.reduce((sum, { stat }) => sum + stat.wtngPsgCnt, 0),
        avgPrcsPsgCnt: included.length === 0 ? null : prcsSum / included.length,
        avgWtngHr: prcsSum === 0 ? null : weightedSum((stat) => stat.wtngHr) / prcsSum,
        avgPrcsHr: prcsSum === 0 ? null : weightedSum((stat) => stat.prcsHr) / prcsSum,
    };
}
