import { SearchIcon } from '@/components/icons';
import { TERMINAL_LABEL, TERMINALS, type TerminalKind } from '../types';

interface HeaderProps {
    terminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
    onSearch: () => void;
}

/** 상단 헤더 — 타이틀 / 조회 조건(터미널) */
export function Header({ terminal, onTerminalChange, onSearch }: HeaderProps) {
    return (
        <header className="header">
            <h1 className="header__title">
                PM 예측관리 / <strong>시설물 매핑</strong>
            </h1>

            <div className="search-bar">
                <div className="search-bar__field">
                    <span className="search-bar__label">터미널선택</span>
                    <div className="radio-group">
                        {TERMINALS.map((terminalKind) => (
                            <span className="radio" key={terminalKind}>
                                <input
                                    type="radio"
                                    id={`term-${terminalKind}`}
                                    name="terminal"
                                    checked={terminal === terminalKind}
                                    onChange={() => onTerminalChange(terminalKind)}
                                />
                                <label htmlFor={`term-${terminalKind}`}>
                                    {TERMINAL_LABEL[terminalKind]}
                                </label>
                            </span>
                        ))}
                    </div>
                </div>

                <button type="button" className="btn-search" onClick={onSearch}>
                    <SearchIcon aria-hidden="true" />
                    <span className="blind">조회</span>
                </button>
            </div>

            {/* 고칠 수 있는 값이 한 칸뿐이라는 사실을 화면이 먼저 말해 준다. */}
            <p className="header__note">
                CAST 시뮬레이션명만 수정할 수 있습니다. 나머지 값은 조회 전용입니다.
            </p>
        </header>
    );
}
