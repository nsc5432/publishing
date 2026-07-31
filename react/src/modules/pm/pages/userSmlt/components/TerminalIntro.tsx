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
 * 사용자 시뮬레이션 도입 화면 (시안: 3_사용자시뮬레이션_도입.png).
 * 어느 터미널로 시뮬레이션할지 고르는 진입 단계다.
 *
 * 카드 배경의 터미널 도형은 배경 데코(BgDeco)와 같은 SVG 를 CSS 배경으로 깐다.
 * assets 의 T1WhiteIcon / T2WhiteIcon 은 흰색 고정 fill 이라 밝은 카드 위에서
 * 보이지 않으므로 색이 들어 있는 t1-blue / t2-teal-full 쪽을 쓴다 (userSmlt.css).
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
