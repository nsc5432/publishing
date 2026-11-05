import { useEffect, useRef } from 'react';
import { T1WhiteIcon, T2WhiteIcon } from '@/components/icons';
import type { TerminalKind } from '../../../types';
import { CountStepper } from '../../../components/CountStepper';
import { TimeBar } from '../../../components/TimeBar';
import { useDockHeight } from '../../../hooks/useDockHeight';
import { ISLAND_BOOTHS } from '../constants';
import type { CheckinIsland } from '../types';
import { assignedBoothCount } from '../view';
import { AirlinePalette } from './AirlinePalette';
import { BoothGrid } from './BoothGrid';

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
    selectedBooths: number[];
    onSelectBooths: (nos: number[]) => void;

    onConfirm: () => void;
    onCancel: () => void;
}

function toGuide(draft: CheckinIsland | null, selectedBoothCount: number, changed: boolean) {
    if (!draft) return '차트의 블록이나 아일랜드 버튼을 눌러 편집할 아일랜드를 고르세요.';
    if (selectedBoothCount > 0) return `선택한 부스 ${selectedBoothCount}대에 배정할 항공사를 고르세요.`;
    if (changed) return `변경한 내용은 적용을 눌러 ${draft.label} 아일랜드에 반영하세요.`;
    return `${draft.label} 아일랜드의 부스를 클릭하거나 끌어서 고르세요.`;
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
    selectedBooths,
    onSelectBooths,
    onConfirm,
    onCancel,
}: CheckinCounterEditDockProps) {
    const dockRef = useRef<HTMLElement>(null);

    const BadgeIcon = terminal === 'T1' ? T1WhiteIcon : T2WhiteIcon;

    useDockHeight(dockRef);

    useEffect(() => {
        if (selectedBooths.length === 0) return;

        const handleOutsidePointerDown = (event: Event) => {
            const target = event.target as Node | null;
            if (target && dockRef.current?.contains(target)) return;

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
        if (disabled || !draft || selectedBooths.length === 0) return;

        const selectedBoothNos = new Set(selectedBooths);
        onPatch({
            booths: draft.booths.map((booth) => (selectedBoothNos.has(booth.no) ? { ...booth, airline } : booth)),
        });
    };

    return (
        <section ref={dockRef} className="dock" aria-label="아일랜드 편집">
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
                        {toGuide(draft, selectedBooths.length, changed)}
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
                                {draft.label} 아일랜드 {assignedBoothCount(draft)}대 / {ISLAND_BOOTHS}대<span className="dsec__hint">끌어서 여러 대 선택</span>
                            </p>

                            <div className="booths">
                                <div className="booths__row">
                                    <span className="booths__side">L</span>
                                    <BoothGrid booths={draft.booths} side="L" selected={selectedBooths} onSelect={onSelectBooths} disabled={disabled} />
                                </div>

                                <span className="booths__spine" aria-hidden="true" />

                                <div className="booths__row">
                                    <span className="booths__side">R</span>
                                    <BoothGrid booths={draft.booths} side="R" selected={selectedBooths} onSelect={onSelectBooths} disabled={disabled} />
                                </div>

                                {!disabled && <AirlinePalette airlines={airlines} count={selectedBooths.length} onPick={assignAirline} />}
                            </div>
                        </section>

                        <section className="dock__col">
                            <p className="dsec__title">
                                운영시간<span className="dsec__hint">1시간 단위</span>
                            </p>
                            <TimeBar disabled={disabled} label="운영시간" ranges={draft.ranges} onChange={(ranges) => onPatch({ ranges })} />
                        </section>

                        <section className="dock__col">
                            <p className="dsec__title">
                                셀프 서비스<span className="dsec__hint">아일랜드별</span>
                            </p>
                            <CountStepper label="셀프체크인 키오스크" value={draft.kiosk} onChange={(kiosk) => onPatch({ kiosk })} disabled={disabled} />
                            <CountStepper label="셀프백드롭" value={draft.bagdrop} onChange={(bagdrop) => onPatch({ bagdrop })} disabled={disabled} />
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
