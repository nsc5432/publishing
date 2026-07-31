import type { ReactNode } from 'react';

/**
 * index.html 의 인라인 `ICONS` 객체를 그대로 이식한 아이콘 세트.
 * 원본과 동일하게 `<i data-ic="name">` 래퍼로 감싸 dashboard.css 의
 * 사이즈 헬퍼(.i-26, .i-plane-lg, .qtile > i > svg 등)가 그대로 적용되도록 한다.
 */
export type IconName =
    | 'calendar'
    | 'search'
    | 'clock'
    | 'chart'
    | 'user'
    | 'monitor'
    | 'pin'
    | 'grid'
    | 'map'
    | 'pass'
    | 'luggage'
    | 'planeline'
    | 'logout'
    | 'plane'
    | 'people'
    | 'pax'
    | 'ticket'
    | 'gate'
    | 'plus'
    | 'chevL'
    | 'chevR'
    | 'weather'
    | 'layers'
    | 'checkCircle'
    | 'spinner'
    | 'planeDep';

const LINE = {
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

const ICONS: Record<IconName, ReactNode> = {
    calendar: (
        <svg viewBox="0 0 24 24" {...LINE} width={19} height={19}>
            <rect x="3" y="4.5" width="18" height="17" rx="3" />
            <path d="M16 2.5v4M8 2.5v4M3 10h18" />
        </svg>
    ),
    search: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            width={17}
            height={17}
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    ),
    clock: (
        <svg viewBox="0 0 24 24" {...LINE} width={19} height={19}>
            <circle cx="12" cy="12" r="9.2" />
            <path d="M12 6.6V12l3.4 2.2" />
        </svg>
    ),
    /* 시뮬레이션 모니터링 KPI — 전체 수행 / 완료 / 진행중 */
    layers: (
        <svg viewBox="0 0 24 24" {...LINE} width={19} height={19}>
            <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
            <path d="m3 12 9 4.5L21 12" />
            <path d="m3 16.5 9 4.5 9-4.5" />
        </svg>
    ),
    checkCircle: (
        <svg viewBox="0 0 24 24" {...LINE} width={19} height={19}>
            <circle cx="12" cy="12" r="9.2" />
            <path d="m8 12.2 2.8 2.8L16 9.8" />
        </svg>
    ),
    /* 진행중 : 점선 원호 (계산이 도는 중임을 나타낸다) */
    spinner: (
        <svg viewBox="0 0 24 24" {...LINE} width={19} height={19} strokeDasharray="3 3.2">
            <circle cx="12" cy="12" r="8.4" />
        </svg>
    ),
    chart: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            width={24}
            height={24}
        >
            <path d="M3 3v18h18" />
            <path d="m7 15 3-4 4 3 5-7" />
        </svg>
    ),
    user: (
        <svg viewBox="0 0 24 24" {...LINE} width={23} height={23}>
            <circle cx="12" cy="8" r="3.4" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
    ),
    monitor: (
        <svg viewBox="0 0 24 24" {...LINE} width={23} height={23}>
            <rect x="2.5" y="4.5" width="19" height="13" rx="2.4" />
            <path d="M8 20.5h8" />
        </svg>
    ),
    pin: (
        <svg viewBox="0 0 24 24" {...LINE} width={23} height={23}>
            <path d="M12 21.5s7-6.2 7-11.3A7 7 0 0 0 5 10.2c0 5.1 7 11.3 7 11.3z" />
            <circle cx="12" cy="10" r="2.6" />
        </svg>
    ),
    grid: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={23} height={23}>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
            <rect x="13.5" y="3" width="7.5" height="4.6" rx="1.4" />
            <rect x="13.5" y="10.6" width="7.5" height="10.4" rx="1.6" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
        </svg>
    ),
    map: (
        <svg viewBox="0 0 24 24" {...LINE} width={23} height={23}>
            <path d="M9 3 3 5.6v15L9 18l6 3 6-2.6v-15L15 6 9 3z" />
            <path d="M9 3v15M15 6v15" />
        </svg>
    ),
    pass: (
        <svg viewBox="0 0 24 24" {...LINE} width={23} height={23}>
            <rect x="2.5" y="5.5" width="19" height="13" rx="2.4" />
            <path
                d="M7 14.5h5.5l5-4.6-1.9-.6-2.6 1.9-3.4-1.1-1.2.5 1.8 1.4-2 .8-1-.6-1 .4 1.8 1.9z"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    ),
    luggage: (
        <svg viewBox="0 0 24 24" {...LINE} width={23} height={23}>
            <rect x="4.5" y="7" width="15" height="13.5" rx="2.4" />
            <path d="M9 7V4.6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 4.6V7M10 11.5v5M14 11.5v5" />
        </svg>
    ),
    planeline: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
            <path d="M21.5 12.4c0 .6-.5 1.1-1.1 1.1h-5.6l-2.7 5.7c-.2.3-.5.5-.9.5H9.4l1.8-6.2H7l-1.5 2.2c-.2.3-.5.4-.9.4H3.1l1.4-3.7-1.4-3.7h2.5c.4 0 .7.2.9.5L8 11.4h3.2L9.4 5.2h1.8c.4 0 .7.2.9.5l2.7 5.6h5.6c.6 0 1.1.5 1.1 1.1z" />
        </svg>
    ),
    logout: (
        <svg viewBox="0 0 24 24" {...LINE} width={23} height={23}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
    ),
    plane: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <g transform="rotate(90 12 12)">
                <path d="M21.6 16.3v-1.9l-7.9-4.9V3.1c0-.85-.7-1.55-1.55-1.55h-.3c-.85 0-1.55.7-1.55 1.55v6.4l-7.9 4.9v1.9l7.9-2.5v5.6l-2.1 1.55v1.5l3.8-1.05 3.8 1.05v-1.5l-2.1-1.55v-5.6l7.9 2.5z" />
            </g>
        </svg>
    ),
    /* 출국장 메뉴용 — plane 과 같은 도형을 시안처럼 비스듬히 눕힌 것 */
    planeDep: (
        <svg viewBox="0 0 24 24" fill="currentColor" width={23} height={23}>
            <g transform="rotate(45 12 12)">
                <path d="M21.6 16.3v-1.9l-7.9-4.9V3.1c0-.85-.7-1.55-1.55-1.55h-.3c-.85 0-1.55.7-1.55 1.55v6.4l-7.9 4.9v1.9l7.9-2.5v5.6l-2.1 1.55v1.5l3.8-1.05 3.8 1.05v-1.5l-2.1-1.55v-5.6l7.9 2.5z" />
            </g>
        </svg>
    ),
    people: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
    ),
    pax: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="15.1" cy="3.2" r="2.5" />
            <path d="M14.2 6.6c-.5 0-1 .2-1.3.6l-2.6 3 2.6 2.9.5 8.3h2.1l-.5-9.2-2-2.5 2.3-1.7 1.9 3.1 3.3.7.4-2-2.5-.6-2.2-3.2c-.4-.6-1-.9-1.6-.9-.1 0-.2 0-.4.1z" />
            <path d="m11.2 14.1-2 3.9-3.1 3.8h2.6l3.3-3.4z" />
            <rect x="1.4" y="12.6" width="5.4" height="8.6" rx="1.1" />
            <path
                d="M3.1 12.5v-.9c0-.5.4-.9.9-.9h.4c.5 0 .9.4.9.9v.9"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
            />
        </svg>
    ),
    ticket: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 8.2C2 7 3 6 4.2 6h15.6C21 6 22 7 22 8.2v1.3a.6.6 0 0 1-.5.6 2 2 0 0 0 0 3.8c.3 0 .5.3.5.6v1.3c0 1.2-1 2.2-2.2 2.2H4.2A2.2 2.2 0 0 1 2 15.8v-1.3c0-.3.2-.6.5-.6a2 2 0 0 0 0-3.8.6.6 0 0 1-.5-.6V8.2zM11.3 8v1.4h1.4V8h-1.4zm0 2.9v1.4h1.4v-1.4h-1.4zm0 2.8v1.4h1.4v-1.4h-1.4zm0 2.9V18h1.4v-1.4h-1.4z"
            />
        </svg>
    ),
    gate: (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.6 20.5V6.6C2.6 5.7 3.3 5 4.2 5h15.6c.9 0 1.6.7 1.6 1.6v13.9h-3.2V8.2H5.8v12.3H2.6z" />
            <path
                d="M12 20V11.6M12 10.2l-3.4 3.4M12 10.2l3.4 3.4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    plus: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    ),
    chevL: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 5 8 12l7 7" />
        </svg>
    ),
    chevR: (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 5 7 7-7 7" />
        </svg>
    ),
    weather: (
        <svg viewBox="0 0 64 48" width={64} height={48}>
            <defs>
                <radialGradient id="wsun" cx=".38" cy=".32" r=".75">
                    <stop offset="0" stopColor="#ffe680" />
                    <stop offset=".55" stopColor="#ffc21f" />
                    <stop offset="1" stopColor="#f79c1b" />
                </radialGradient>
                <linearGradient id="wcl1" x1="0" y1="0" x2=".3" y2="1">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" stopColor="#cfe2fa" />
                </linearGradient>
                <linearGradient id="wcl2" x1=".2" y1="0" x2=".6" y2="1">
                    <stop offset="0" stopColor="#e9f3ff" />
                    <stop offset="1" stopColor="#a9caf3" />
                </linearGradient>
            </defs>
            <g stroke="#ffc21f" strokeWidth={3} strokeLinecap="round">
                <path d="M17 1.5v3.4M17 29.6V33M2.5 17.5h3.4M28.1 17.5h3.4M6.7 7.2l2.4 2.4M24.9 25.4l2.4 2.4M27.3 7.2l-2.4 2.4M9.1 25.4l-2.4 2.4" />
            </g>
            <circle cx="17" cy="17.5" r="9.6" fill="url(#wsun)" />
            <path
                d="M42.4 47.5H26c-5.4 0-9.8-4.1-9.8-9.2s4.4-9.2 9.8-9.2c.6 0 1.2 0 1.7.1C29.6 23.6 35.2 19.6 41.8 19.6c8.2 0 14.9 6.2 14.9 13.9 0 .7 0 1.3-.1 1.9 3.4 1 5.9 3.9 5.9 7.3 0 2.6-1.5 4.9-3.7 6.2-1.1.6-2.3.6-3.6.6H42.4z"
                fill="url(#wcl2)"
            />
            <path
                d="M39.6 45.4H25.1c-4.8 0-8.6-3.6-8.6-8s3.9-8 8.6-8c.5 0 1 0 1.5.1 1.8-4.9 6.7-8.4 12.5-8.4 7.2 0 13.1 5.4 13.1 12.2 0 .6 0 1.2-.1 1.7 3 .9 5.2 3.4 5.2 6.4 0 2.3-1.3 4.3-3.3 5.4-.9.5-2 .6-3.1.6h-11.3z"
                fill="url(#wcl1)"
            />
        </svg>
    ),
};

interface IconProps {
    name: IconName;
    className?: string;
}

export function Icon({ name, className }: IconProps) {
    return (
        <i data-ic={name} className={className}>
            {ICONS[name]}
        </i>
    );
}
