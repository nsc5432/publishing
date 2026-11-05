import type { CongestionStatCmpr } from './types';
import './StatComparison.css';

interface StatComparisonProps {
    comparison: CongestionStatCmpr;
}

const ARROW = { up: '▲', down: '▼' } as const;

export function StatComparison({ comparison }: StatComparisonProps) {
    return (
        <p className="stat__cmpr">
            <span className={`stat__chip stat__chip--${comparison.tone}`} title={comparison.title} aria-label={comparison.title}>
                {comparison.arrow && (
                    <span className="stat__chip-arrow" aria-hidden="true">
                        {ARROW[comparison.arrow]}
                    </span>
                )}
                {comparison.text}
            </span>
        </p>
    );
}
