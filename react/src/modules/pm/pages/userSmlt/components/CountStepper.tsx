interface CountStepperProps {
    label: string;
    /** 라벨 아래 보조 문구 (예: 피크 시간대 기준) */
    sub?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
}

/**
 * 라벨 + 증감 스테퍼 한 줄 — 드로어의 셀프 서비스 / 검색대 구성 공용.
 */
export function CountStepper({
    label,
    sub,
    value,
    onChange,
    min = 0,
    max = 99,
    disabled = false,
}: CountStepperProps) {
    const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

    return (
        <div className="drow">
            <p className="drow__label">
                {label}
                {sub && <small>{sub}</small>}
            </p>

            <div className="stepper">
                <button
                    type="button"
                    className="stepper__btn"
                    disabled={disabled || value <= min}
                    onClick={() => step(-1)}
                >
                    −<span className="blind">{`${label} 감소`}</span>
                </button>
                <span className="stepper__value">{value}</span>
                <button
                    type="button"
                    className="stepper__btn"
                    disabled={disabled || value >= max}
                    onClick={() => step(1)}
                >
                    +<span className="blind">{`${label} 증가`}</span>
                </button>
            </div>
        </div>
    );
}
