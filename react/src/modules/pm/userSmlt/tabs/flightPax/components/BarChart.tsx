import type { CSSProperties } from 'react';
import type { ChartData } from '../types';

interface BarChartProps {
    data: ChartData;
}

/**
 * 막대 차트 — 차트 라이브러리 없이 CSS 그리드로만 그린다.
 * 막대 높이는 --h 커스텀 프로퍼티로만 넘기고 나머지는 flightPax.css 가 처리한다.
 */
export function BarChart({ data }: BarChartProps) {
    return (
        <div className="chart">
            <div className="chart__head">
                <h3 className="chart__title">{data.title}</h3>
                <p className="chart__total">
                    전체(누적) <strong>{data.total}</strong> {data.unit}
                </p>
            </div>

            <div className="chart__body">
                <div className="chart__axis">
                    {data.axis.map((tick) => (
                        <span key={tick}>{tick}</span>
                    ))}
                </div>
                <div className="chart__plot">
                    <div className="chart__bars">
                        {data.bars.map((bar) => (
                            <span
                                key={bar.label}
                                className="bar"
                                style={{ '--h': `${bar.ratio}%` } as CSSProperties}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="chart__scale">
                {data.bars.map((bar) => (
                    <span key={bar.label}>{bar.label}</span>
                ))}
            </div>
        </div>
    );
}
