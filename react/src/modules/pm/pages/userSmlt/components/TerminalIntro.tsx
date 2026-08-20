import { useState } from 'react';
import { CheckWhiteIcon } from '@/components/icons';
import { HeaderInfoCards } from '@/modules/pm/components/HeaderInfoCards';
import { formatYmd } from '@/lib/format';
import { useIntroHeader } from '../hooks/useIntroHeader';
import { NO_TERMINAL, TERMINALS, type TerminalEnabled, type TerminalKind } from '../types';

const INTRO_LABEL: Record<TerminalKind, string> = {
    T1: 'Terminal1',
    T2: 'Terminal2',
};

interface TerminalIntroProps {
    ymd: string;
    onStart: (enabled: TerminalEnabled) => void;
}

export function TerminalIntro({ ymd, onStart }: TerminalIntroProps) {
    const [picked, setPicked] = useState<TerminalEnabled>(NO_TERMINAL);
    const { data: header } = useIntroHeader(ymd);

    const pickedCount = TERMINALS.filter((terminal) => picked[terminal]).length;

    const toggle = (terminal: TerminalKind) => {
        setPicked((prev) => ({ ...prev, [terminal]: !prev[terminal] }));
    };

    return (
        <div className="intro">
            <div className="intro__header">
                <HeaderInfoCards planDate={formatYmd(ymd, '-')} header={header} />
            </div>

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
                    시뮬레이션할 터미널을 고르세요. 1개만 고르면 그 터미널만, 2개를 고르면 두 터미널을 함께 설정합니다.
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
