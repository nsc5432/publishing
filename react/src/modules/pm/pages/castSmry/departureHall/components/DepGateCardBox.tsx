import type { ComponentType, SVGProps } from 'react';
import { toStagePosition } from '@/lib/chart';
import { PersonIcon, TimeIcon } from '@/components/icons';
import { StatComparison } from '@/modules/pm/congestion/StatComparison';
import { toLevelKey, toLevelLabel, type DepGateCard, type StatIcon } from '../types';

interface StatGroup {
    key: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    icons: StatIcon[];
}

const STAT_GROUPS: StatGroup[] = [
    { key: 'people', Icon: PersonIcon, icons: ['wait-people', 'done-people'] },
    { key: 'time', Icon: TimeIcon, icons: ['wait-time', 'done-time'] },
];

interface DepGateCardBoxProps {
    card: DepGateCard;
    /** 도면 위 자리 (무대 기준 비율) 지정 여부 — 표/차트 보기에서는 흐름에 맡긴다 */
    floating?: boolean;
    /** 짝이 되는 도면 마커에 마우스를 올린 상태 */
    active?: boolean;
}

/**
 * 출국장 카드
 */
export function DepGateCardBox({ card, floating = true, active = false }: DepGateCardBoxProps) {
    const floatStyle = floating ? toStagePosition(card.x, card.y) : undefined;

    return (
        <article className={`dep-card${floating ? ' dep-card--float' : ''}${card.isClosed ? ' is-off' : ''}${active ? ' is-active' : ''}`} style={floatStyle}>
            <div className="dep-card__head">
                <h3 className="dep-card__title">{card.title}</h3>
                <span className={`state-badge state-badge--${toLevelKey(card.level)}`}>{toLevelLabel(card.level)}</span>
            </div>

            <div className="dep-stat">
                {STAT_GROUPS.map(({ key, Icon, icons }) => (
                    <div className="dep-stat__col" key={key}>
                        <Icon className="dep-stat__ico" aria-hidden="true" focusable="false" />
                        <ul className="dep-stat__list">
                            {card.stats
                                .filter((stat) => icons.includes(stat.icon))
                                .map((stat) => (
                                    <li className="dep-stat__item" key={stat.icon}>
                                        <span className="dep-stat__label">{stat.label}</span>
                                        <strong className={`dep-stat__value${stat.isHighlighted ? ' is-point' : ''}`}>
                                            {stat.value}
                                            <em>{stat.unit}</em>
                                        </strong>
                                        <StatComparison comparison={stat.cmpr} />
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>
        </article>
    );
}
