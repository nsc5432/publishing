import type { TerminalKind } from '../../../types';
import { CountStepper } from '../../../components/CountStepper';
import { TimeBar } from '../../../components/TimeBar';
import { SIDE_BOOTHS } from '../constants';
import type { CheckinIsland } from '../types';
import { assignedBoothCount } from '../view';
import { BoothGrid } from './BoothGrid';

interface EditDockProps {
    /** 편집 대상 터미널 — 도크는 늘 활성 터미널을 본다 */
    terminal: TerminalKind;
    /** 칩 줄에 깔 전체 아일랜드 문자 (TerminalCheckinCounter.islandCodes) */
    codes: string[];
    /** 편집 상태의 아일랜드 목록 — 여기 없는 code 는 미운영(점선 회색) */
    islands: CheckinIsland[];
    /** 선택된 아일랜드 문자 — BlockChart 의 selected 와 같은 배열을 쓴다 */
    selected: string[];
    /** 칩 클릭 · 미운영 칩이면 신규로 연다. additive = Ctrl/Cmd */
    onSelect: (label: string, additive: boolean) => void;

    /** 단일 선택일 때의 편집 대상. 다중 선택이면 null (칩 줄만 활성) */
    draft: CheckinIsland | null;
    onPatch: (next: Partial<CheckinIsland>) => void;

    /** 부스에 배정할 수 있는 항공사 코드 (TerminalCheckinCounter.airlines) */
    airlines: string[];
    /** 선택된 부스 번호 — 항공사 칩을 누르면 이 부스에 배정된다 */
    selectedBooth: number | null;
    onSelectBooth: (no: number | null) => void;

    onConfirm: () => void;
    /** 고르던 아일랜드를 놓는다 — 도크는 닫히지 않고 칩 줄만 남는다 */
    onCancel: () => void;
}

/**
 * 체크인 카운터 편집 도크 — 우측 드로어를 대신해 차트 아래에 늘 떠 있다.
 *
 * 아일랜드 1개는 좌우 18석씩 36석이라 380px 드로어에 들어가지 않는다.
 * 가로로 펴고, 하루 종일 닫혀 화면(차트)에 없는 아일랜드는 맨 윗줄 칩이 붙잡는다.
 */
export function EditDock({
    terminal,
    codes,
    islands,
    selected,
    onSelect,
    draft,
    onPatch,
    airlines,
    selectedBooth,
    onSelectBooth,
    onConfirm,
    onCancel,
}: EditDockProps) {
    /** 선택한 부스에 항공사를 배정한다 — 부스를 먼저 골라야 한다 */
    const assign = (airline: string) => {
        if (!draft || selectedBooth === null) return;

        onPatch({
            booths: draft.booths.map((booth) =>
                booth.no === selectedBooth ? { ...booth, airline } : booth,
            ),
        });
    };

    return (
        <section className="dock" aria-label="아일랜드 편집">
            <div className="dock__head">
                <span className="dock__tmnl">{terminal}</span>

                <div className="isles">
                    {codes.map((code) => {
                        // 편집 목록에 없는 문자 = 하루 종일 미운영 (점선 회색 칩)
                        const island = islands.find((it) => it.label === code);

                        return (
                            <button
                                key={code}
                                type="button"
                                className={`isle${island ? ' is-on' : ''}${
                                    selected.includes(code) ? ' is-sel' : ''
                                }`}
                                style={
                                    island ? { background: `var(--${island.color})` } : undefined
                                }
                                aria-pressed={selected.includes(code)}
                                onClick={(event) => onSelect(code, event.ctrlKey || event.metaKey)}
                            >
                                {code}
                            </button>
                        );
                    })}
                </div>

                <p className="dock__hint">회색 칩을 누르면 그 아일랜드를 새로 엽니다</p>
            </div>

            {draft === null ? (
                <p className="dock__empty">
                    위 칩에서 아일랜드를 하나 고르면 부스 배정 · 운영시간 · 셀프 서비스를
                    편집합니다.
                </p>
            ) : (
                <>
                    <div className="dock__cols">
                        <section className="dock__col">
                            <p className="dsec__title">
                                부스 배정
                                <span className="dsec__hint">
                                    아일랜드 {draft.label} · L/R 각 {SIDE_BOOTHS}석 고정 · 배정{' '}
                                    {assignedBoothCount(draft)}석 · 셀을 고르고 항공사를 누릅니다
                                </span>
                            </p>

                            <div className="booths">
                                <div className="booths__row">
                                    <span className="booths__side">L</span>
                                    <BoothGrid
                                        booths={draft.booths}
                                        side="L"
                                        selected={selectedBooth}
                                        onSelect={(no) =>
                                            onSelectBooth(selectedBooth === no ? null : no)
                                        }
                                    />
                                </div>

                                <span className="booths__spine" aria-hidden="true" />

                                <div className="booths__row">
                                    <span className="booths__side">R</span>
                                    <BoothGrid
                                        booths={draft.booths}
                                        side="R"
                                        selected={selectedBooth}
                                        onSelect={(no) =>
                                            onSelectBooth(selectedBooth === no ? null : no)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="airchips">
                                {airlines.map((airline) => (
                                    <button
                                        key={airline}
                                        type="button"
                                        className="airchip"
                                        disabled={selectedBooth === null}
                                        onClick={() => assign(airline)}
                                    >
                                        {airline}
                                    </button>
                                ))}
                                {/* 36석이 늘 열려 있어 잘못 누른 자리를 되돌릴 길이 있어야 한다 */}
                                <button
                                    type="button"
                                    className="airchip airchip--ghost"
                                    disabled={selectedBooth === null}
                                    onClick={() => assign('')}
                                >
                                    미배정
                                </button>
                                <button
                                    type="button"
                                    className="airchip airchip--ghost"
                                    onClick={() => console.log('[Custom 항공사 추가]')}
                                >
                                    + Custom
                                </button>
                            </div>
                        </section>

                        <section className="dock__col">
                            <p className="dsec__title">
                                운영시간<span className="dsec__hint">1시간 단위</span>
                            </p>
                            <TimeBar
                                label="운영시간"
                                ranges={draft.ranges}
                                onChange={(ranges) => onPatch({ ranges })}
                            />
                        </section>

                        <section className="dock__col">
                            <p className="dsec__title">
                                셀프 서비스<span className="dsec__hint">아일랜드별</span>
                            </p>
                            <CountStepper
                                label="셀프체크인 키오스크"
                                value={draft.kiosk}
                                onChange={(kiosk) => onPatch({ kiosk })}
                            />
                            <CountStepper
                                label="셀프백드롭"
                                value={draft.bagdrop}
                                onChange={(bagdrop) => onPatch({ bagdrop })}
                            />
                        </section>
                    </div>

                    <div className="dock__foot">
                        <button type="button" className="btn btn--ghost" onClick={onCancel}>
                            취소
                        </button>
                        <button type="button" className="btn btn--primary" onClick={onConfirm}>
                            변경
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
