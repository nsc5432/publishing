import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent,
    type PointerEvent as ReactPointerEvent,
} from 'react';
import { useDragScroll } from '../../../hooks/useDragScroll';

/** 이만큼 넘게 끌었으면 칩을 고른 게 아니라 레일을 민 것이다 */
const DRAG_SLOP = 4;

interface AirlinePopoverProps {
    airlines: string[];
    /** 선택된 부스 수 */
    count: number;
    /** `.booths` 기준 좌표 — 선택 끝 칸의 가로 중앙·하단 */
    pos: { x: number; y: number };
    onPick: (airline: string) => void;
}

export function AirlinePopover({ airlines, count, pos, onPick }: AirlinePopoverProps) {
    const [railEl, setRailEl] = useState<HTMLDivElement | null>(null);
    const downX = useRef(0);
    const rail = useDragScroll(railEl);
    const { sync } = rail;

    useEffect(() => {
        sync();
    }, [sync, airlines]);

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        downX.current = e.clientX;
        rail.onPointerDown(e);
    };

    /*
     * 레일에 포인터 캡처가 걸려 있으면 pointerup 이 레일로 되돌려져 칩에는 click 이 오지 않는다.
     * 그래서 손을 뗀 자리를 좌표로 되짚는다. 민 거리가 크면 칩을 고른 게 아니라 레일을 민 것이다.
     */
    const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (Math.abs(e.clientX - downX.current) > DRAG_SLOP) return;

        const chip = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>('[data-airline]');
        if (!chip) return;

        onPick(chip.dataset.airline ?? '');
    };

    // 마우스는 위 pointerup 경로가 처리했다. 키보드로 눌린 클릭만 받는다
    const handleClick = (e: MouseEvent<HTMLButtonElement>, airline: string) => {
        if (e.detail !== 0) return;

        onPick(airline);
    };

    return (
        <div className="airpop" style={{ '--x': `${pos.x}px`, '--y': `${pos.y}px` } as CSSProperties}>
            <p className="airpop__head">{count}석 선택 · 항공사 배정</p>

            <div
                className={`airpop__rail${rail.scrollable ? ' is-scrollable' : ''}${
                    rail.atStart ? '' : ' is-scrolled'
                }${rail.atEnd ? ' is-end' : ''}`}
            >
                <div
                    ref={setRailEl}
                    className={`airpop__list${rail.dragging ? ' is-dragging' : ''}`}
                    onScroll={rail.sync}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    {airlines.map((airline) => (
                        <button
                            key={airline}
                            type="button"
                            data-airline={airline}
                            className="airchip"
                            onClick={(e) => handleClick(e, airline)}
                        >
                            {airline}
                        </button>
                    ))}
                    <button
                        type="button"
                        data-airline=""
                        className="airchip airchip--ghost"
                        onClick={(e) => handleClick(e, '')}
                    >
                        미배정
                    </button>
                </div>
                <span className="airpop__grip" aria-hidden="true" />
            </div>
        </div>
    );
}
