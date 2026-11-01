import { formatCount } from '@/lib/format';
import { toWaitMin } from '../view';
import { toLevelKey, toLevelLabel, type ChknIslandView } from '../types';

interface IslandStatusListProps {
    islands: ChknIslandView[];
}

/**
 * 아일랜드 칩 줄
 */
export function IslandStatusList({ islands }: IslandStatusListProps) {
    return (
        <div className="chkn-strip">
            <ul className="chkn-strip__list">
                {islands.map((island) => (
                    <li
                        key={island.id}
                        className={`chkn-chip chkn-chip--${island.isClosed ? 'off' : toLevelKey(island.level)}`}
                        title={`${island.title} / ${island.isClosed ? '미운영' : toLevelLabel(island.level)} / Queue ${island.queuePsgCnt}명`}
                    >
                        <b className="chkn-chip__label">{island.island}</b>
                        <span className="chkn-chip__value">{island.isClosed ? '미운영' : `${formatCount(island.queuePsgCnt)}명`}</span>
                        <span className="chkn-chip__sub">
                            <span>운영 부스: {island.isClosed ? '-' : `${island.oprBoothCnt}개`}</span>
                            <span>대기시간: {island.isClosed ? '-' : `${toWaitMin(island.waitSec)}분`}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
