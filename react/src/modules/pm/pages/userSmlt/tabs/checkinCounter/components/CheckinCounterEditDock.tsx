import { useEffect, useRef } from 'react';
import { T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import type { TerminalKind } from '../../../types';
import { CountStepper } from '../../../components/CountStepper';
import { useDockHeight } from '../../../hooks/useDockHeight';
import { ISLAND_BOOTHS } from '../constants';
import type { CellRange, CheckinIsland } from '../types';
import { assignedBoothCount, cellCount, paintBooths } from '../view';
import { AirlinePalette } from './AirlinePalette';
import { BoothMatrix } from './BoothMatrix';

interface CheckinCounterEditDockProps {
    disabled: boolean;
    terminal: TerminalKind;
    codes: string[];
    islands: CheckinIsland[];
    selected: string[];
    onSelect: (label: string) => void;

    draft: CheckinIsland | null;
    changed: boolean;
    onPatch: (next: Partial<CheckinIsland>) => void;

    airlines: string[];
    selection: CellRange | null;
    onSelectCells: (range: CellRange | null) => void;

    onConfirm: () => void;
    onCancel: () => void;
}

function toGuide(draft: CheckinIsland | null, selection: CellRange | null, changed: boolean) {
    if (!draft) return '차트의 블록이나 아일랜드 버튼을 눌러 편집할 아일랜드를 고르세요.';
    if (selection) {
        const booths = selection.boothFrom === selection.boothTo ? `${selection.boothFrom}번` : `${selection.boothFrom}~${selection.boothTo}번`;
        return `${booths} 부스 ${selection.hourFrom}~${selection.hourTo + 1}시(${cellCount(selection)}칸)에 배정할 항공사를 고르세요.`;
    }
    if (changed) return `변경한 내용은 적용을 눌러 ${draft.label} 아일랜드에 반영하세요.`;
    return `${draft.label} 아일랜드의 부스 × 시간 칸을 클릭하거나 끌어서 고르세요.`;
}

export function CheckinCounterEditDock({
    terminal,
    disabled,
    codes,
    islands,
    selected,
    onSelect,
    draft,
    changed,
    onPatch,
    airlines,
    selection,
    onSelectCells,
    onConfirm,
    onCancel,
}: CheckinCounterEditDockProps) {
    const dockRef = useRef<HTMLElement>(null);

    const BadgeIcon = terminal === 'T1' ? T1WhiteIcon : T2WhiteIcon;

    useDockHeight(dockRef);

    useEffect(() => {
        if (!selection) return;

        const handleOutsidePointerDown = (event: Event) => {
            const target = event.target as Node | null;
            if (target && dockRef.current?.contains(target)) return;

            onSelectCells(null);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onSelectCells(null);
        };

        document.addEventListener('pointerdown', handleOutsidePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handleOutsidePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selection, onSelectCells]);

    const assignAirline = (airline: string) => {
        if (disabled || !draft || !selection) return;

        onPatch({ booths: paintBooths(draft.booths, selection, airline) });
    };

    return (
        <section ref={dockRef} className="dock" data-editor="checkin" aria-label="아일랜드 편집">
            <div className="dock__head">
                <span className="dock__tmnl" data-terminal={terminal} role="img" aria-label={terminal}>
                    <BadgeIcon aria-hidden="true" />
                </span>
                <div className="isles" role="group" aria-label="아일랜드 선택">
                    {codes.map((code) => {
                        const island = islands.find((it) => it.label === code);

                        return (
                            <button
                                key={code}
                                type="button"
                                className={`isle${island ? ' is-on' : ''}${selected.includes(code) ? ' is-sel' : ''}`}
                                aria-pressed={selected.includes(code)}
                                onClick={() => onSelect(code)}
                            >
                                <i
                                    className="gatepick__dot"
                                    style={island ? { background: `var(--${island.color})` } : undefined}
                                    aria-hidden="true"
                                />
                                {code}
                            </button>
                        );
                    })}
                </div>
                {!disabled && (
                    <p className="dock__guide" role="status">
                        {toGuide(draft, selection, changed)}
                    </p>
                )}
            </div>

            {draft === null ? (
                <p className="dock__empty">편집할 아일랜드를 위의 차트에서 선택해주세요.</p>
            ) : (
                <>
                    <div className="dock__cols">
                        <section className="dock__col">
                            <p className="dsec__title">
                                {draft.label} 아일랜드 {assignedBoothCount(draft)}대 / {ISLAND_BOOTHS}대
                                <span className="dsec__hint">부스 × 시간(1시간) 칸을 끌어서 선택 · 머리글을 누르면 줄 전체</span>
                            </p>

                            <BoothMatrix booths={draft.booths} airlines={airlines} selection={selection} onSelect={onSelectCells} disabled={disabled} />

                            {!disabled && <AirlinePalette airlines={airlines} count={cellCount(selection)} onPick={assignAirline} />}
                        </section>

                        <section className="dock__col">
                            <p className="dsec__title">
                                셀프 서비스<span className="dsec__hint">아일랜드별</span>
                            </p>
                            <CountStepper label="셀프체크인 키오스크" value={draft.kiosk} onChange={(kiosk) => onPatch({ kiosk })} disabled={disabled} />
                            <CountStepper label="셀프백드롭" value={draft.bagdrop} onChange={(bagdrop) => onPatch({ bagdrop })} disabled={disabled} />
                            <p className="dock__note">키오스크 · 셀프백드롭의 운영시간과 항공사는 일일 시뮬레이션 정책을 따릅니다.</p>
                        </section>
                    </div>

                    <div className="dock__foot">
                        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={!changed}>
                            취소
                        </button>
                        <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={disabled || !changed}>
                            적용
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
