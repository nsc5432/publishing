import { CONGESTION_LABEL, type DepGateCard } from '../types';

interface DepTableViewProps {
    cards: DepGateCard[];
    /** 조회 시각 (예: 10:30) */
    time: string;
}

/** 지표는 카드와 같은 순서(대기인원 · 대기시간 · 처리인원 · 처리시간)로 읽는다 */
const STAT_COLS = ['대기인원', '대기시간', '처리인원', '처리시간'];

/**
 * 표 보기 — 맵 보기의 카드를 그대로 행으로 편 것.
 * 값의 출처가 같으므로 타임라인을 옮기면 두 보기가 함께 바뀐다.
 */
export function DepTableView({ cards, time }: DepTableViewProps) {
    // 도면은 배치 순(왼쪽부터)이지만 표는 출국장 번호 순으로 읽는다
    const rows = [...cards].sort((left, right) => Number(left.depNum) - Number(right.depNum));

    return (
        <div className="dep-table">
            <p className="dep-table__caption">
                <strong>{time}</strong> 기준 출국장별 혼잡 현황
            </p>

            <div className="dep-table__scroll scroll-area">
                <table className="tbl">
                    <caption className="blind">출국장별 혼잡 현황</caption>
                    <colgroup>
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '10%' }} />
                        {STAT_COLS.map((col) => (
                            <col key={col} />
                        ))}
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '16%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col">출국장</th>
                            <th scope="col">상태</th>
                            {STAT_COLS.map((col) => (
                                <th scope="col" key={col}>
                                    {col}
                                </th>
                            ))}
                            <th scope="col">운영 부스</th>
                            <th scope="col">운영 시간</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((card) => (
                            <tr key={card.id}>
                                <th scope="row">{card.title}</th>
                                <td>
                                    <span className={`state-badge state-badge--${card.level}`}>
                                        {CONGESTION_LABEL[card.level]}
                                    </span>
                                </td>
                                {card.stats.map((stat) => (
                                    <td key={stat.icon}>
                                        <span
                                            className={stat.isHighlighted ? 'is-point' : undefined}
                                        >
                                            {stat.value}
                                        </span>
                                        <em>{stat.unit}</em>
                                    </td>
                                ))}
                                <td>{card.boothCnt}개</td>
                                <td>{card.operTime}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
