import { PlusIcon } from '@/components/icons';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { CONGESTION_LABEL, type FacilityDetail } from '../types';

interface FacilityMiniModalProps {
    detail: FacilityDetail;
    onClose: () => void;
    onDetailClick?: () => void;
}

/**
 * 시설 혼잡 현황 미니 팝업 (시안: 2_맵_시설_클릭시.png).
 *
 * 아일랜드 상세 팝업(IslandModal)에서 시설 유형 / 매출 테이블을 덜어내고
 * 제목 + 상태 뱃지 + 지표 4개 + 상세보기만 남긴 축약본이다.
 * 껍데기(.modal*) 와 지표(.stat) 스타일은 상세 팝업과 그대로 공유한다.
 */
export function FacilityMiniModal({ detail, onClose, onDetailClick }: FacilityMiniModalProps) {
    const closeRef = useModalDismiss(onClose);

    return (
        <div className="modal modal--mini">
            <button type="button" className="modal__dim" onClick={onClose}>
                <span className="blind">닫기</span>
            </button>

            <div
                className="modal__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="popupFacilityTitle"
            >
                <div className="modal__head">
                    <h2 className="modal__title" id="popupFacilityTitle">
                        {detail.title} 시설 혼잡 현황
                    </h2>

                    <div className="modal__head-right">
                        <span className={`state-badge state-badge--${detail.level}`}>
                            {CONGESTION_LABEL[detail.level]}
                        </span>
                        <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
                            <i className="ico ico-close" aria-hidden="true" />
                            <span className="blind">닫기</span>
                        </button>
                    </div>
                </div>

                <div className="modal__body">
                    <ul className="stat">
                        {detail.stats.map((stat) => (
                            <li className="stat__item" key={stat.ico}>
                                <i className={`ico ico-${stat.ico}`} aria-hidden="true" />
                                <span className="stat__label">{stat.label}</span>
                                <strong className={`stat__value${stat.point ? ' is-point' : ''}`}>
                                    {stat.value}
                                    <em>{stat.unit}</em>
                                </strong>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="modal__foot">
                    <button
                        type="button"
                        className="btn-detail btn-detail--round"
                        onClick={onDetailClick}
                    >
                        <PlusIcon aria-hidden="true" />
                        상세보기
                    </button>
                </div>
            </div>
        </div>
    );
}
