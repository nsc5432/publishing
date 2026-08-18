import { Icon } from '@/components/icons/InlineIcon';
import type { StatCard, StatusFilter } from '../types';

interface StatCardsProps {
    cards: StatCard[];
    activeFilter: StatusFilter;
    onFilterChange: (filter: StatusFilter) => void;
}

/** 필터로 이어지는 카드만 매핑한다 — 평균 수행시간은 상태값이 없어 제외 */
const CARD_FILTER: Partial<Record<string, StatusFilter>> = {
    total: 'all',
    done: 'done',
    running: 'running',
};

export function StatCards({ cards, activeFilter, onFilterChange }: StatCardsProps) {
    return (
        <div className="kpi">
            {cards.map((card) => {
                const filter = CARD_FILTER[card.id];
                const isClickable = filter !== undefined;
                const isActive = isClickable && activeFilter === filter;

                return (
                    <button
                        type="button"
                        className={`kpi__card${isClickable ? ' kpi__card--clickable' : ''}${isActive ? ' is-active' : ''}`}
                        key={card.id}
                        disabled={!isClickable}
                        aria-pressed={isClickable ? isActive : undefined}
                        onClick={() => filter && onFilterChange(filter)}
                    >
                        <span className="kpi__ico" aria-hidden="true">
                            <Icon name={card.icon} />
                        </span>

                        <div className="kpi__body">
                            <span className="kpi__label">{card.label}</span>
                            <p className={`kpi__value kpi__value--${card.tone ?? 'blue'}`}>
                                {card.values.map((metric) => (
                                    <span key={metric.unit}>
                                        <strong>{metric.value}</strong>
                                        <em>{metric.unit}</em>
                                    </span>
                                ))}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
