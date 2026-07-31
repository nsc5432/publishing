import { useEffect, useRef, useState } from 'react';

interface PillSelectProps {
    value: string;
    options: string[];
    /** 값 뒤에 붙는 단위 (예: 시 / 분) */
    unit: string;
    onChange: (value: string) => void;
}

/**
 * 조회 조건의 시/분 선택 드롭다운 pill — 화면 공용.
 * (대시보드 상단 기준일자 / 시뮬레이션 모니터링 시작·종료일시)
 *
 * 스타일은 common.css 4-3 절에 스코프 없이 두어 어느 화면에서든 같게 보인다.
 */
export function PillSelect({ value, options, unit, onChange }: PillSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    return (
        // 목록을 버튼 안에 넣으면 button 안의 button 이 되어 유효하지 않은 마크업이 된다.
        // 감싸는 요소를 두고 버튼과 목록을 형제로 둔다 (위치 기준도 이 요소).
        <div ref={ref} className="pill">
            <button
                type="button"
                className={`pill-sm${open ? ' open' : ''}`}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                {value}
                <span className="caret">▾</span>
                <span className="unit">{unit}</span>
            </button>

            {open && (
                <div className="pill-menu">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={opt === value ? 'sel' : undefined}
                            onClick={() => {
                                onChange(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
