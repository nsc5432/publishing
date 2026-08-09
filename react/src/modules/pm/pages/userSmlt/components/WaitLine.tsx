import type { WaitLineData } from '../types';

interface WaitLineProps {
    line: WaitLineData;
}

/**
 * 대기인원수 꺾은선 오버레이
 */
export function WaitLine({ line }: WaitLineProps) {
    const max = line.max || Math.max(...line.data) || 1;
    const y = (v: number) => 100 - (v / max) * 100;

    const points = line.data.map((v, hour) => `${(hour + 0.5).toFixed(2)},${y(v).toFixed(2)}`);

    const peak = line.data.indexOf(Math.max(...line.data));
    const dots = line.data
        .map((v, hour) => ({ v, hour }))
        .filter(({ hour }) => hour % 2 === 0 || hour === peak);

    const left = (hour: number) => `${(((hour + 0.5) / 24) * 100).toFixed(2)}%`;
    const bottom = (v: number) => `${(100 - y(v)).toFixed(2)}%`;

    return (
        <div className="bchart__line" aria-hidden="true">
            <svg viewBox="0 0 24 100" preserveAspectRatio="none">
                <polyline points={points.join(' ')} />
            </svg>

            {dots.map(({ v, hour }) => (
                <i key={hour} style={{ left: left(hour), bottom: bottom(v) }} />
            ))}

            <span
                className="bchart__peak"
                style={{ left: left(peak), bottom: bottom(line.data[peak]) }}
            >
                최대 {line.data[peak]}
                {line.unit ?? '명'}
            </span>
        </div>
    );
}
