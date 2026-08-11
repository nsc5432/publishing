import { SearchIcon } from '@/components/icons';
import { TERMINAL_LABEL, TERMINALS, type HeaderSummary, type TerminalKind } from '../types';

interface HeaderProps {
    baseDate: string;
    terminal: TerminalKind;
    onTerminalChange: (terminal: TerminalKind) => void;
    summary: HeaderSummary;
    onSearch: () => void;
}

/** 상단 헤더 — 타이틀 / 조회 조건(기준일자·터미널) / 운항·여객 요약 */
export function Header({ baseDate, terminal, onTerminalChange, summary, onSearch }: HeaderProps) {
    return (
        <header className="header">
            <h1 className="header__title">
                PM 예측관리 / <strong>일일 시뮬레이션 결과 조회</strong>
            </h1>

            <div className="search-bar">
                <div className="search-bar__field">
                    <label className="search-bar__label" htmlFor="baseDate">
                        기준일자
                    </label>
                    <span className="input-date">
                        <i className="ico ico-calendar" aria-hidden="true" />
                        <input
                            type="text"
                            id="baseDate"
                            className="input-date__input"
                            value={baseDate}
                            readOnly
                        />
                    </span>
                </div>

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

            <dl className="header__summary">
                <div className="header__summary-item">
                    <dt>운항</dt>
                    <dd>{summary.flight}</dd>
                </div>
                <div className="header__summary-item">
                    <dt>여객</dt>
                    <dd>{summary.pax}</dd>
                </div>
            </dl>
        </header>
    );
}
