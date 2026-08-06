import type { WaitLineData } from '../types';

interface WaitLineProps {
    line: WaitLineData;
}

/**
 * 대기인원수 꺾은선 오버레이 — 블럭 차트 위에 겹쳐 그린다.
 * (design-renewal/mock.js 의 waitLine() 이식)
 *
 * 선은 종횡비가 찌그러진 viewBox(24 × 100) 를 쓰므로 non-scaling-stroke 로 굵기를 고정하고,
 * 점은 SVG 원을 쓰면 타원이 되므로 HTML(<i>) 로 얹는다.
 */
export function WaitLine({ line }: WaitLineProps) {
    const max = line.max || Math.max(...line.data) || 1;
    const y = (v: number) => 100 - (v / max) * 100;

    const points = line.data.map((v, hour) => `${(hour + 0.5).toFixed(2)},${y(v).toFixed(2)}`);

    // 점은 2시간 간격 + 피크에만 찍는다. 24개를 다 찍으면 블럭을 덮는다.
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
