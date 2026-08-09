import { TERMINALS, type TerminalKind } from '../types';

/** 카드 안에 크게 들어가는 표기 (T1 → Terminal1) */
const INTRO_LABEL: Record<TerminalKind, string> = {
    T1: 'Terminal1',
    T2: 'Terminal2',
};

interface TerminalIntroProps {
    /** 카드 선택 → 해당 터미널로 시뮬레이션 설정 화면 진입 */
    onSelect: (terminal: TerminalKind) => void;
}

/**
 * 사용자 시뮬레이션 도입 화면
 */
export function TerminalIntro({ onSelect }: TerminalIntroProps) {
    return (
        <div className="intro">
            {TERMINALS.map((terminal) => (
                <button
                    key={terminal}
                    type="button"
                    className={`intro__card intro__card--${terminal.toLowerCase()}`}
                    onClick={() => onSelect(terminal)}
                >
                    <span className="intro__label">{INTRO_LABEL[terminal]}</span>
                </button>
            ))}
        </div>
    );
}
