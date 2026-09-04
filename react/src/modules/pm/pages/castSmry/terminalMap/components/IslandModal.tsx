import { CounterConIcon, PlusIcon, SelfCheckinIcon } from '@/components/icons';
import { useModalDismiss } from '../hooks/useModalDismiss';
import {
    CONGESTION_LABEL,
    type FacilityKind,
    type IslandDetail,
    type IslandSales,
} from '../types';

interface IslandModalProps {
    detail: IslandDetail;
    onClose: () => void;
    onDetailClick?: () => void;
}

function FacilityIcon({ kind }: { kind: FacilityKind }) {
    if (kind === 'counter') return <CounterConIcon className="facility__ico" aria-hidden="true" />;
    if (kind === 'selfcheck') return <SelfCheckinIcon className="facility__ico" aria-hidden="true" />;
    return <i className="ico ico-store" aria-hidden="true" />;
}

export function IslandModal({ detail, onClose, onDetailClick }: IslandModalProps) {
    const closeRef = useModalDismiss(onClose);

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

                    {detail.sales && <SalesTable sales={detail.sales} />}
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

function SalesTable({ sales }: { sales: IslandSales }) {
    return (
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
                    <td>{sales.total}</td>
                    <th scope="row">상업시설 수</th>
                    <td>{sales.storeCount}</td>
                </tr>
                <tr>
                    <th scope="row">인원대비 매출</th>
                    <td colSpan={3}>{sales.perPax}</td>
                </tr>
                <tr>
                    <th scope="row">매출 인원 증감</th>
                    <td colSpan={3}>
                        {sales.paxDelta}
                        <span className={`rate rate--${sales.rateUp ? 'up' : 'down'}`}>
                            {sales.rate}
                        </span>
                        <span className="rate__base">{sales.rateBase}</span>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}
