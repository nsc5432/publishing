import { formatCount } from '@/lib/format';
import { CONGESTION_LABEL, type ChknIslandView } from '../types';

interface IslandTableProps {
    islands: ChknIslandView[];
    /** 조회 시각 (예: 10:30) */
    time: string;
}

/**
 * 표 보기 — 타임라인이 가리키는 시각의 아일랜드별 자원과 결과.
 * 차트가 하루 흐름이라면 표는 그 한 칸의 내역이다. 값의 출처가 같으므로
 * 타임라인을 옮기면 두 보기가 함께 바뀐다.
 */
export function IslandTable({ islands, time }: IslandTableProps) {
    return (
        <div className="chkn-table">
            <p className="chkn-table__caption">
                <strong>{time}</strong> 기준 아일랜드별 자원 운영 · 혼잡 현황
            </p>

            <div className="chkn-table__scroll scroll-area">
                <table className="tbl">
                    <caption className="blind">아일랜드별 자원 운영 · 혼잡 현황</caption>
                    <colgroup>
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '8%' }} />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col style={{ width: '13%' }} />
                        <col style={{ width: '12%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col">아일랜드</th>
                            <th scope="col">상태</th>
                            <th scope="col">유인 카운터</th>
                            <th scope="col">셀프체크인</th>
                            <th scope="col">셀프백드롭</th>
                            <th scope="col">대기인원</th>
                            <th scope="col">대기시간</th>
                            <th scope="col">처리인원</th>
                            <th scope="col">처리율</th>
                            <th scope="col">운영 시간</th>
                            <th scope="col">항공사</th>
                        </tr>
                    </thead>
                    <tbody>
                        {islands.map((island) => (
                            <tr key={island.id} className={island.isClosed ? 'is-off' : undefined}>
                                <th scope="row">{island.title}</th>
                                <td>
                                    {island.isClosed ? (
                                        <span className="state-badge state-badge--off">미운영</span>
                                    ) : (
                                        <span className={`state-badge state-badge--${island.level}`}>
                                            {CONGESTION_LABEL[island.level]}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    {formatCount(island.counterCnt)}
                                    <em>개</em>
                                </td>
                                <td>
                                    {formatCount(island.kioskCnt)}
                                    <em>대</em>
                                </td>
                                <td>
                                    {formatCount(island.bagDropCnt)}
                                    <em>대</em>
                                </td>
                                <td>
                                    <span className="is-point">
                                        {formatCount(island.wtngPsgCnt)}
                                    </span>
                                    <em>명</em>
                                </td>
                                <td>
                                    <span className="is-point">{formatCount(island.wtngHr)}</span>
                                    <em>초</em>
                                </td>
                                <td>
                                    {formatCount(island.prcsPsgCnt)}
                                    <em>명</em>
                                </td>
                                <td>
                                    {island.prcsRate}
                                    <em>%</em>
                                </td>
                                <td>{island.operTime}</td>
                                <td>{island.airlines}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
