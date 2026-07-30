import { MapWhiteIcon } from '@/components/icons';

interface SummaryMapButtonProps {
    onClick: () => void;
    disabled: boolean;
}

/** 요약 바 우측의 지도 보기 버튼 — 체크인 카운터 / 셀프체크인·백드롭 / 출국장 탭 공용. */
export function SummaryMapButton({ onClick, disabled }: SummaryMapButtonProps) {
    return (
        <button
            type="button"
            className="summary__map"
            aria-label="지도 보기"
            disabled={disabled}
            onClick={onClick}
        >
            <MapWhiteIcon aria-hidden="true" />
        </button>
    );
}
