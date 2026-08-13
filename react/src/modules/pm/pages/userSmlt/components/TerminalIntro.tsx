import { useState } from 'react';
import { CheckWhiteIcon } from '@/components/icons';
import { NO_TERMINAL, TERMINALS, type TerminalEnabled, type TerminalKind } from '../types';

/** 카드 안에 크게 들어가는 표기 (T1 → Terminal1) */
const INTRO_LABEL: Record<TerminalKind, string> = {
    T1: 'Terminal1',
    T2: 'Terminal2',
};

interface TerminalIntroProps {
    /** 고른 터미널로 시뮬레이션 설정 화면 진입 — 1개 또는 2개 */
    onStart: (enabled: TerminalEnabled) => void;
}

/**
 * 사용자 시뮬레이션 도입 화면.
 *
 * 카드는 라디오가 아니라 체크다 — 한 터미널만 시뮬레이션할 수도, 두 터미널을 함께
 * 돌릴 수도 있다. 여기서 고르지 못했더라도 설정 화면의 패널 스위치로 다시 켜고 끈다.
 */
export function TerminalIntro({ onStart }: TerminalIntroProps) {
    const [picked, setPicked] = useState<TerminalEnabled>(NO_TERMINAL);

    const pickedCount = TERMINALS.filter((terminal) => picked[terminal]).length;

    const toggle = (terminal: TerminalKind) => {
        setPicked((prev) => ({ ...prev, [terminal]: !prev[terminal] }));
    };

    return (
        <div className="intro">
            <div className="intro__cards">
                {TERMINALS.map((terminal) => {
                    const on = picked[terminal];

                    return (
                        <button
                            key={terminal}
                            type="button"
                            className={`intro__card intro__card--${terminal.toLowerCase()}${on ? ' is-on' : ''}`}
                            aria-pressed={on}
                            onClick={() => toggle(terminal)}
                        >
                            <span className="intro__check" aria-hidden="true">
                                {on && <CheckWhiteIcon />}
                            </span>
                            <span className="intro__label">{INTRO_LABEL[terminal]}</span>
                        </button>
                    );
                })}
            </div>

            <div className="intro__foot">
                <p className="intro__hint">
                    시뮬레이션할 터미널을 고르세요. 1개만 고르면 그 터미널만, 2개를 고르면 두
                    터미널을 함께 설정합니다.
                </p>
                <button
                    type="button"
                    className="btn btn--primary intro__start"
                    disabled={pickedCount === 0}
                    onClick={() => onStart(picked)}
                >
                    {pickedCount === 0 ? '터미널을 선택하세요' : `선택한 ${pickedCount}개로 시작`}
                </button>
            </div>
        </div>
    );
}
