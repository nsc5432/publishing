import { FCLT_TYPE_LABEL, MAPPING_STATUS_LABEL, type FcltMapRow } from '../types';

interface FcltDetailPanelProps {
    /** 선택된 행 — 고른 것이 없으면 넘기지 않는다 */
    row?: FcltMapRow;
}

/**
 * 매핑 상세 — 도면 아래, 고른 시설 한 건의 전문.
 *
 * 여객시설 → 시뮬레이션시설을 위아래로 세워 둔다. 표에서는 한 줄로 훑고,
 * 여기서는 한 건을 확인하는 자리라 코드·설명·최종수정까지 펼쳐 보여 준다.
 */
export function FcltDetailPanel({ row }: FcltDetailPanelProps) {
    return (
        <section className="detail">
            <h2 className="detail__title">매핑 상세</h2>

            {row ? (
                <div className="detail__body">
                    <div className="detail__side">
                        <span className="detail__tag">여객시설</span>
                        <strong className="detail__name">{row.name}</strong>
                        <span className="detail__code">{row.code}</span>
                    </div>

                    <div className="detail__arrow" aria-hidden="true">
                        ↓
                    </div>

                    <div className="detail__side">
                        <span className="detail__tag">CAST 시뮬레이션</span>
                        <strong className={`detail__cast${row.castName ? '' : ' is-empty'}`}>
                            {row.castName || '매핑 없음'}
                        </strong>
                        <span className={`state state--${row.status}`}>
                            {MAPPING_STATUS_LABEL[row.status]}
                        </span>
                    </div>

                    <dl className="detail__meta">
                        <dt>시설유형</dt>
                        <dd>{FCLT_TYPE_LABEL[row.fcltType]}</dd>
                        <dt>설명</dt>
                        <dd>{row.desc || '-'}</dd>
                        <dt>최종수정</dt>
                        <dd>{row.modified}</dd>
                    </dl>
                </div>
            ) : (
                <p className="detail__empty">목록에서 시설을 고르면 매핑 상세를 볼 수 있습니다.</p>
            )}
        </section>
    );
}
