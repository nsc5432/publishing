import type { CSSProperties } from 'react';
import type { OperCard } from '../types';

interface OperCardsProps {
    cards: OperCard[];
}

/** 운영시간 도넛 (0시/6시/12시/18시 눈금 + 운영시간 표기) */
function Donut({ card }: { card: OperCard }) {
    return (
        <div className="donut">
            <svg className="donut__chart" viewBox="0 0 120 120" aria-hidden="true">
                <circle className="donut__track" cx="60" cy="60" r="52" />
                <circle
                    className="donut__value"
                    cx="60"
                    cy="60"
                    r="52"
                    style={{ '--rate': card.rate } as CSSProperties}
                />
            </svg>
            <span className="donut__mark donut__mark--t">0시</span>
            <span className="donut__mark donut__mark--r">6시</span>
            <span className="donut__mark donut__mark--b">12시</span>
            <span className="donut__mark donut__mark--l">18시</span>
            <div className="donut__info">
                <strong className="donut__time">{card.time}</strong>
                <span className="donut__desc">{card.desc}</span>
            </div>
        </div>
    );
}

/**
 * 맵 상단 운영시간 카드 — 출국장 1곳당 1칸.
 * 칸 수가 터미널마다 다르므로(T1: 7칸 / T2: 2칸) 열 개수를 CSS 변수로 넘겨
 * 카드가 늘어나지 않고 가운데 정렬되도록 한다.
 */
export function OperCards({ cards }: OperCardsProps) {
    const cols = { '--oper-cols': cards.length } as CSSProperties;

    return (
        <div className="oper-cards" style={cols}>
            {cards.map((card) =>
                card.empty ? (
                    <div key={card.id} className="oper-card oper-card--empty" aria-hidden="true" />
                ) : (
                    <div key={card.id} className={`oper-card${card.dim ? ' is-dim' : ''}`}>
                        <Donut card={card} />
                    </div>
                ),
            )}
        </div>
    );
}
