import { useEffect, useRef } from 'react';
import { CounterConIcon, PlusIcon, SelfCheckinIcon } from '@/components/icons';
import { CONGESTION_LABEL, type FacilityKind, type IslandDetail } from '../types';

interface IslandModalProps {
    detail: IslandDetail;
    onClose: () => void;
    onDetailClick?: () => void;
}

/** 시설 유형 아이콘 (상업시설은 assets/svg 에 대응 아이콘이 없어 마스크 아이콘 사용) */
function FacilityIcon({ kind }: { kind: FacilityKind }) {
    if (kind === 'counter') return <CounterConIcon className="facility__ico" aria-hidden="true" />;
    if (kind === 'selfcheck') return <SelfCheckinIcon className="facility__ico" aria-hidden="true" />;
    return <i className="ico ico-store" aria-hidden="true" />;
}

/** 아일랜드 상세 팝업 (시안: 일일-맵형태 조회T1-팝업.png) */
export function IslandModal({ detail, onClose, onDetailClick }: IslandModalProps) {
    const closeRef = useRef<HTMLButtonElement>(null);
    // 리렌더(타임라인 재생 등)마다 포커스가 튀지 않도록 콜백은 ref 로 참조한다
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    // 열릴 때 닫기 버튼으로 포커스 이동, ESC 로 닫기 (main.js 동작 이식)
    useEffect(() => {
        const lastFocused = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            lastFocused?.focus();
        };
    }, []);

    return (
        <div className="modal">
            <button type="button" className="modal__dim" onClick={onClose}>
                <span className="blind">닫기</span>
            </button>

            <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="popupIslandTitle">
                <div className="modal__head">
                    <h2 className="modal__title" id="popupIslandTitle">
                        {detail.title} <span>({detail.code})</span>
                    </h2>
                    <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
                        <i className="ico ico-close" aria-hidden="true" />
                        <span className="blind">닫기</span>
                    </button>
                </div>

                <div className="modal__body">
                    {/* 시설 유형 */}
                    <ul className="facility">
                        {detail.facilities.map((facility) => (
                            <li className="facility__item" key={facility.kind}>
                                <FacilityIcon kind={facility.kind} />
                                <strong className="facility__name">{facility.name}</strong>
                                {facility.rate && (
                                    <span className="facility__rate">{facility.rate}</span>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* 시설 혼잡 현황 */}
                    <div className={`sec-head sec-head--${detail.level}`}>
                        <h3 className="sec-head__title">시설 혼잡 현황</h3>
                        <span className={`state-badge state-badge--${detail.level}`}>
                            {CONGESTION_LABEL[detail.level]}
                        </span>
                    </div>

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

                    {/* 매출 정보 */}
                    <table className="tbl-sales">
                        <caption className="blind">상업시설 매출 정보</caption>
                        <colgroup>
                            <col style={{ width: 112 }} />
                            <col />
                            <col style={{ width: 112 }} />
                            <col style={{ width: 86 }} />
                        </colgroup>
                        <tbody>
                            <tr>
                                <th scope="row">총 매출</th>
                                <td>{detail.sales.total}</td>
                                <th scope="row">상업시설 수</th>
                                <td>{detail.sales.storeCount}</td>
                            </tr>
                            <tr>
                                <th scope="row">인원대비 매출</th>
                                <td colSpan={3}>{detail.sales.perPax}</td>
                            </tr>
                            <tr>
                                <th scope="row">매출 인원 증감</th>
                                <td colSpan={3}>
                                    {detail.sales.paxDelta}
                                    <span
                                        className={`rate rate--${detail.sales.rateUp ? 'up' : 'down'}`}
                                    >
                                        {detail.sales.rate}
                                    </span>
                                    <span className="rate__base">{detail.sales.rateBase}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="modal__foot">
                    <button type="button" className="btn-detail" onClick={onDetailClick}>
                        <PlusIcon aria-hidden="true" />
                        상세보기
                    </button>
                </div>
            </div>
        </div>
    );
}
