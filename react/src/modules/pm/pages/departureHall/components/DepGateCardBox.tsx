import type { ComponentType, CSSProperties, SVGProps } from 'react';
import { DonePeopleIcon, DoneTimeIcon, WaitPeopleIcon, WaitTimeIcon } from '@/components/icons';
import { CONGESTION_LABEL, type DepGateCard, type StatIcon } from '../types';

const STAT_ICON: Record<StatIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
    'wait-people': WaitPeopleIcon,
    'wait-time': WaitTimeIcon,
    'done-people': DonePeopleIcon,
    'done-time': DoneTimeIcon,
};

interface DepGateCardBoxProps {
    card: DepGateCard;
    /** 도면 위 자리 (무대 기준 비율) 지정 여부 — 표/차트 보기에서는 흐름에 맡긴다 */
    floating?: boolean;
    /** 짝이 되는 도면 마커에 마우스를 올린 상태 */
    active?: boolean;
}

/**
 * 출국장 카드 1장 — 혼잡 상태 뱃지 + 지표 4종.
 * 도면 위에 떠 있을 때는 마커와 같은 무대 좌표(--x / --y)로 자리를 잡는다.
 */
export function DepGateCardBox({ card, floating = true, active = false }: DepGateCardBoxProps) {
    const style = floating
        ? ({ '--x': `${card.x}%`, '--y': `${card.y}%` } as CSSProperties)
        : undefined;

    return (
        <article
            className={`dep-card${floating ? ' dep-card--float' : ''}${card.off ? ' is-off' : ''}${
                active ? ' is-active' : ''
            }`}
            style={style}
        >
            <div className="dep-card__head">
                <h3 className="dep-card__title">{card.title}</h3>
                <span className={`state-badge state-badge--${card.level}`}>
                    {CONGESTION_LABEL[card.level]}
                </span>
            </div>

            <ul className="dep-stat">
                {card.stats.map((stat) => {
                    const Icon = STAT_ICON[stat.ico];

                    return (
                        <li className="dep-stat__item" key={stat.ico}>
                            <Icon className="dep-stat__ico" aria-hidden="true" focusable="false" />
                            <span className="dep-stat__label">{stat.label}</span>
                            <strong
                                className={`dep-stat__value${stat.point ? ' is-point' : ''}`}
                            >
                                {stat.value}
                                <em>{stat.unit}</em>
                            </strong>
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}
