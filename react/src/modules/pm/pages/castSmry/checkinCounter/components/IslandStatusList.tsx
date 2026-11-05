import { Fragment } from 'react';
import { Icon } from '@/components/icons/InlineIcon';
import { formatCount } from '@/lib/format';
import { toWaitMin } from '../view';
import { toLevelKey, toLevelLabel, type ChknIslandView } from '../types';

interface IslandStatusListProps {
    islands: ChknIslandView[];
}

function toTipRows(island: ChknIslandView): [string, string][] {
    const closed = island.isClosed;
    return [
        ['아일랜드', island.title],
        ['혼잡도', closed ? '미운영' : toLevelLabel(island.level)],
        ['Queue', closed ? '-' : `${formatCount(island.queuePsgCnt)}명`],
        ['운영 부스', closed ? '-' : `${island.oprBoothCnt}개`],
        ['대기시간', closed ? '-' : `${toWaitMin(island.waitSec)}분`],
    ];
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
                    >
                        <b className="chkn-chip__label">{island.island}</b>
                        <span className="chkn-chip__value">{island.isClosed ? '미운영' : `${formatCount(island.queuePsgCnt)}명`}</span>
                        <span className="chkn-chip__sub">
                            <span>
                                <Icon name="booth" />
                                {island.isClosed ? '-' : `${island.oprBoothCnt}개`}
                            </span>
                            <span>
                                <Icon name="clock" />
                                {island.isClosed ? '-' : `${toWaitMin(island.waitSec)}분`}
                            </span>
                        </span>
                        <span className="chkn-chip__tip" role="tooltip">
                            {toTipRows(island).map(([label, value]) => (
                                <Fragment key={label}>
                                    <span>{label}</span>
                                    <b>{value}</b>
                                </Fragment>
                            ))}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
