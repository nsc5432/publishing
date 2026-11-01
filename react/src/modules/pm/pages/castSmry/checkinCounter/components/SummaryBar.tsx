import { NoticeWarnIcon } from '@/components/icons';
import { NOTICE_LEVEL, UNKNOWN_NOTICE, toLevelKey, type ChknKpi, type ChknSummaryItem, type NoticeData } from '../types';

interface SummaryBarProps {
    summary: ChknSummaryItem[];
    kpis: ChknKpi[];
    notice: NoticeData;
}

/**
 * 체크인카운터 요약 바
 */
export function SummaryBar({ summary, kpis, notice }: SummaryBarProps) {
    const preset = notice.level === null ? UNKNOWN_NOTICE : NOTICE_LEVEL[notice.level];

    return (
        <section className="chkn-summary">
            <div className="chkn-summary__row">
                <ul className="chkn-summary__list">
                    {summary.map((item) => (
                        <li key={item.id} className="chkn-summary__item">
                            <span className="chkn-summary__label">{item.label}</span>
                            <strong className={`chkn-summary__value${item.isAccent ? ' is-accent' : ''}`}>
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
                            {kpi.note && <span className="chkn-kpi__note">{kpi.note}</span>}
                        </li>
                    ))}
                </ul>
            </div>

            <div className={`chkn-notice chkn-notice--${toLevelKey(notice.level)}`}>
                <h2 className="chkn-notice__badge">
                    <NoticeWarnIcon className="chkn-notice__ico" aria-hidden="true" focusable="false" />
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
