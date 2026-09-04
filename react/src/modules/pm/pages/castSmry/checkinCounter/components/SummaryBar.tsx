import { NoticeWarnIcon } from '@/components/icons';
import { NOTICE_LEVEL, type ChknKpi, type ChknSummaryItem, type NoticeData } from '../types';

interface SummaryBarProps {
    summary: ChknSummaryItem[];
    kpis: ChknKpi[];
    notice: NoticeData;
}

/**
 * 요약 바 — 배치한 자원(왼쪽) · 그 결과(오른쪽) · 그 시각 혼잡 알림(아래).
 *
 * 자원과 결과를 한 줄에 붙여 둔 이유는 화면이 답하려는 질문이 둘의 관계이기 때문이다
 * ("이만큼 열어서 이만큼 기다린다"). 알림만 타임라인을 따라 바뀐다.
 */
export function SummaryBar({ summary, kpis, notice }: SummaryBarProps) {
    const preset = NOTICE_LEVEL[notice.level];

    return (
        <section className="chkn-summary">
            <div className="chkn-summary__row">
                <ul className="chkn-summary__list">
                    {summary.map((item) => (
                        <li key={item.id} className="chkn-summary__item">
                            <span className="chkn-summary__label">{item.label}</span>
                            <strong
                                className={`chkn-summary__value${item.isAccent ? ' is-accent' : ''}`}
                            >
                                {item.value}
                                <em>{item.unit}</em>
                            </strong>
                        </li>
                    ))}
                </ul>

                <ul className="chkn-kpi">
                    {kpis.map((kpi) => (
                        <li key={kpi.id} className="chkn-kpi__item">
                            <span className="chkn-kpi__label">{kpi.label}</span>
                            <strong className="chkn-kpi__value">
                                {kpi.value}
                                <em>{kpi.unit}</em>
                            </strong>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={`chkn-notice chkn-notice--${notice.level}`}>
                <h2 className="chkn-notice__badge">
                    <NoticeWarnIcon
                        className="chkn-notice__ico"
                        aria-hidden="true"
                        focusable="false"
                    />
                    <span>{preset.label}</span>
                </h2>

                {notice.items.length > 0 ? (
                    <ul className="chkn-notice__list">
                        {notice.items.map((item) => (
                            <li key={item.id}>
                                {item.facility} <em>({item.desc})</em>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="chkn-notice__message">{preset.message}</p>
                )}
            </div>
        </section>
    );
}
