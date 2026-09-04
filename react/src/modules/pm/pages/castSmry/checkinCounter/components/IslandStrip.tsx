import { CONGESTION_LABEL, type ChknIslandView } from '../types';

interface IslandStripProps {
    islands: ChknIslandView[];
    /** 조회 시각 (예: 10:30) */
    time: string;
}

/**
 * 아일랜드 칩 줄 — 차트 보기 아래에 두는 그 시각의 내역 요약.
 *
 * 차트는 터미널 전체를 한 줄로 합쳐 보여주므로 "어느 아일랜드가 미는지"가 보이지 않는다.
 * 칩 하나가 아일랜드 1곳이고, 색은 표 보기의 상태 뱃지와 같은 근거(그 시각 혼잡도)를 쓴다.
 */
export function IslandStrip({ islands, time }: IslandStripProps) {
    return (
        <div className="chkn-strip">
            <p className="chkn-strip__caption">
                <strong>{time}</strong> 기준 아일랜드
            </p>

            <ul className="chkn-strip__list">
                {islands.map((island) => (
                    <li
                        key={island.id}
                        className={`chkn-chip chkn-chip--${island.isClosed ? 'off' : island.level}`}
                        title={`${island.title} · ${
                            island.isClosed ? '미운영' : CONGESTION_LABEL[island.level]
                        } · 대기 ${island.wtngPsgCnt}명`}
                    >
                        <b className="chkn-chip__label">{island.island}</b>
                        <span className="chkn-chip__value">
                            {island.isClosed ? '미운영' : `${island.counterCnt}개`}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
