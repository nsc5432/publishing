import { formatCount } from '@/lib/format';
import { toWaitMin } from '../view';
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
 * 칩 하나가 아일랜드 1곳이고, 주 값은 현재 Queue 다.
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
                        } · Queue ${island.queuePsgCnt}명`}
                    >
                        <b className="chkn-chip__label">{island.island}</b>
                        <span className="chkn-chip__value">
                            {island.isClosed ? '미운영' : `${formatCount(island.queuePsgCnt)}명`}
                        </span>
                        <span className="chkn-chip__sub">
                            {island.isClosed
                                ? '-'
                                : `${island.oprBoothCnt}부스 · ${toWaitMin(island.waitSec)}분`}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
