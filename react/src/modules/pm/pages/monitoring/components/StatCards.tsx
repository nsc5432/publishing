import { Icon } from '@/modules/pm/pages/dashboard/components/PmIcons';
import type { StatCard } from '../types';

interface StatCardsProps {
    cards: StatCard[];
}

export function StatCards({ cards }: StatCardsProps) {
    return (
        <div className="kpi">
            {cards.map((card) => (
                <div className="kpi__card" key={card.id}>
                    <span className="kpi__ico" aria-hidden="true">
                        <Icon name={card.icon} />
                    </span>

                    <div className="kpi__body">
                        <span className="kpi__label">{card.label}</span>
                        <p className={`kpi__value kpi__value--${card.tone ?? 'blue'}`}>
                            {card.values.map((v) => (
                                <span key={v.unit}>
                                    <strong>{v.value}</strong>
                                    <em>{v.unit}</em>
                                </span>
                            ))}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
