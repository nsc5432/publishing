import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TerminalKind } from '../../../types';
import { CountStepper } from '../../../components/CountStepper';
import { TimeBar } from '../../../components/TimeBar';
import type { CheckinIsland } from '../types';
import { assignedBoothCount } from '../view';
import { AirlinePopover } from './AirlinePopover';
import { BoothGrid } from './BoothGrid';

interface EditDockProps {
    terminal: TerminalKind;
    codes: string[];
    islands: CheckinIsland[];
    selected: string[];
    onSelect: (label: string) => void;

    draft: CheckinIsland | null;
    onPatch: (next: Partial<CheckinIsland>) => void;

    airlines: string[];
    selectedBooths: number[];
    onSelectBooths: (nos: number[]) => void;

    onConfirm: () => void;
    onCancel: () => void;
}

interface PopoverPos {
    x: number;
    y: number;
}

export function EditDock({
    terminal,
    codes,
    islands,
    selected,
    onSelect,
    draft,
    onPatch,
    airlines,
    selectedBooths,
    onSelectBooths,
    onConfirm,
    onCancel,
}: EditDockProps) {
    const boothsRef = useRef<HTMLDivElement>(null);
    const [popover, setPopover] = useState<PopoverPos | null>(null);

    const anchorBooth = selectedBooths.length > 0 ? selectedBooths[Math.floor(selectedBooths.length / 2)] : null;

    useLayoutEffect(() => {
        const boothContainer = boothsRef.current;
        const anchorCell = anchorBooth === null ? null : boothContainer?.querySelector<HTMLElement>(`[data-booth-no="${anchorBooth}"]`);

        setPopover(
            anchorCell
                ? {
                      x: anchorCell.offsetLeft + anchorCell.offsetWidth / 2,
                      y: anchorCell.offsetTop + anchorCell.offsetHeight,
                  }
                : null,
        );
    }, [anchorBooth]);

    useEffect(() => {
        if (selectedBooths.length === 0) return;

        const handleOutsidePointerDown = (event: Event) => {
            const target = event.target as Node | null;
            if (target && boothsRef.current?.contains(target)) return;

            onSelectBooths([]);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onSelectBooths([]);
        };

        document.addEventListener('pointerdown', handleOutsidePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handleOutsidePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedBooths, onSelectBooths]);

    const assignAirline = (airline: string) => {
        if (!draft || selectedBooths.length === 0) return;

        const selectedBoothNos = new Set(selectedBooths);
        onPatch({
            booths: draft.booths.map((booth) => (selectedBoothNos.has(booth.no) ? { ...booth, airline } : booth)),
        });
        onSelectBooths([]);
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
                                className={`isle${island ? ' is-on' : ''}${selected.includes(code) ? ' is-sel' : ''}`}
                                style={island ? { background: `var(--${island.color})` } : undefined}
                                aria-pressed={selected.includes(code)}
                                onClick={() => onSelect(code)}
                            >
                                {code}
                            </button>
                        );
                    })}
                </div>
            </div>

            {draft === null ? (
                <p className="dock__empty">편집할 아일랜드를 위의 차트에서 선택해주세요.</p>
            ) : (
                <>
                    <div className="dock__cols">
                        <section className="dock__col">
                            <p className="dsec__title">
                                {draft.label} 아일랜드 {assignedBoothCount(draft)}석<span className="dsec__hint">끌어서 여러 석 선택</span>
                            </p>

                            <div className="booths" ref={boothsRef}>
                                <div className="booths__row">
                                    <span className="booths__side">L</span>
                                    <BoothGrid booths={draft.booths} side="L" selected={selectedBooths} onSelect={onSelectBooths} />
                                </div>

                                <span className="booths__spine" aria-hidden="true" />

                                <div className="booths__row">
                                    <span className="booths__side">R</span>
                                    <BoothGrid booths={draft.booths} side="R" selected={selectedBooths} onSelect={onSelectBooths} />
                                </div>

                                {popover && <AirlinePopover airlines={airlines} count={selectedBooths.length} pos={popover} onPick={assignAirline} />}
                            </div>
                        </section>

                        <section className="dock__col">
                            <p className="dsec__title">
                                운영시간<span className="dsec__hint">1시간 단위</span>
                            </p>
                            <TimeBar label="운영시간" ranges={draft.ranges} onChange={(ranges) => onPatch({ ranges })} />
                        </section>

                        <section className="dock__col">
                            <p className="dsec__title">
                                셀프 서비스<span className="dsec__hint">아일랜드별</span>
                            </p>
                            <CountStepper label="셀프체크인 키오스크" value={draft.kiosk} onChange={(kiosk) => onPatch({ kiosk })} />
                            <CountStepper label="셀프백드롭" value={draft.bagdrop} onChange={(bagdrop) => onPatch({ bagdrop })} />
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
