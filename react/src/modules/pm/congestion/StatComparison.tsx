import type { CongestionStatCmpr } from './types';
import './StatComparison.css';

interface StatComparisonProps {
    comparison: CongestionStatCmpr;
}

export function StatComparison({ comparison }: StatComparisonProps) {
    return (
        <p className="stat__cmpr">
            <span className="stat__cmpr-base">
                {comparison.label} <b>{comparison.value}</b>
            </span>
            {comparison.diff && <span className={`stat__cmpr-diff${comparison.trend ? ` stat__cmpr-diff--${comparison.trend}` : ''}`}>{comparison.diff}</span>}
        </p>
    );
}
