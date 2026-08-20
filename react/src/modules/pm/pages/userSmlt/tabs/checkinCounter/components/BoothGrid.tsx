import { useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { Booth, BoothSide } from '../types';

interface BoothGridProps {
    booths: Booth[];
    /** 선택된 부스 번호 — 항공사 칩을 누르면 이 부스들에 한꺼번에 배정된다 */
    selected: number[];
    onSelect: (nos: number[]) => void;
    /** 넘기면 그 면의 부스만 한 줄(스트립)로 편다. 없으면 전부 3열 그리드 */
    side?: BoothSide;
    disabled?: boolean;
}

interface DragRange {
    anchor: number;
    head: number;
}

function toRange({ anchor, head }: DragRange, booths: Booth[]): number[] {
    const from = Math.min(anchor, head);
    const to = Math.max(anchor, head);

    return booths.filter((booth) => booth.no >= from && booth.no <= to).map((booth) => booth.no);
}

/**
 * 부스 ↔ 항공사 배정 그리드.
 *
 * 드로어에서는 3열 그리드로, 도크에서는 면(L/R)마다 18칸짜리 가로 스트립으로 쓴다.
 * 끌면 시작한 칸부터 지나온 칸까지가 범위로 잡힌다 — 이 그리드 안에서만이라
 * 반대 면에서 새로 끌면 이전 선택은 풀린다.
 */
export function BoothGrid({ booths, selected, onSelect, side, disabled = false }: BoothGridProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<DragRange | null>(null);

    const visibleBooths = side ? booths.filter((booth) => booth.side === side) : booths;

    const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>, no: number) => {
        if (disabled || e.button !== 0) return;

        rootRef.current?.setPointerCapture(e.pointerId);
        setDrag({ anchor: no, head: no });
        onSelect([no]);
    };

    // 캡처를 걸면 자식의 pointerenter 가 죽어 좌표로 칸을 되짚는다
    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag) return;

        const cell = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>('[data-booth-no]');
        if (!cell || !rootRef.current?.contains(cell)) return;

        const head = Number(cell.dataset.boothNo);
        if (head === drag.head) return;

        const next = { ...drag, head };
        setDrag(next);
        onSelect(toRange(next, visibleBooths));
    };

    const handlePointerUp = () => {
        if (!drag) return;

        // 끌지 않고 단독 선택돼 있던 칸을 다시 눌렀다 = 해제
        if (drag.anchor === drag.head && selected.length === 1 && selected[0] === drag.anchor) {
            onSelect([]);
        }

        setDrag(null);
    };

    // 마우스는 위 pointer 경로가 이미 처리했다. 키보드로 눌린 클릭만 받는다
    const handleClick = (e: MouseEvent<HTMLButtonElement>, no: number) => {
        if (e.detail !== 0) return;

        onSelect(selected.length === 1 && selected[0] === no ? [] : [no]);
    };

    return (
        <div
            ref={rootRef}
            className={`boothgrid${side ? ' boothgrid--strip' : ''}${drag ? ' is-dragging' : ''}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {visibleBooths.map((booth) => (
                <button
                    key={booth.no}
                    type="button"
                    data-booth-no={booth.no}
                    className={`bcell${booth.airline ? '' : ' bcell--empty'}${
                        selected.includes(booth.no) ? ' is-sel' : ''
                    }`}
                    aria-pressed={selected.includes(booth.no)}
                    disabled={disabled}
                    onPointerDown={(e) => handlePointerDown(e, booth.no)}
                    onClick={(e) => handleClick(e, booth.no)}
                >
                    <i className="bcell__no">{booth.no}</i>
                    {booth.airline || '미배정'}
                </button>
            ))}
        </div>
    );
}
