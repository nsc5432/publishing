import type { SummaryInfoCell } from '@/modules/pm/summary';
import { NOTICE_LEVEL, UNKNOWN_NOTICE, toLevelKey, type NoticeItem, type NoticeLevel } from '../types';

interface CongestionNoticeProps {
    level: NoticeLevel | null;
    items?: NoticeItem[];
    message?: string;
    summaryInfo: SummaryInfoCell[];
}

/** 상단 혼잡 알림 바 */
export function CongestionNotice({ level, items = [], message, summaryInfo }: CongestionNoticeProps) {
    const preset = level === null ? UNKNOWN_NOTICE : NOTICE_LEVEL[level];
    const levelKey = toLevelKey(level);

    return (
        <section className={`notice notice--${levelKey}`}>
            <h2 className="notice__badge">
                <i className={`ico ico-notice-${levelKey}`} aria-hidden="true" />
                <span>{preset.label}</span>
            </h2>

            <div className="notice__content">
                {items.length > 0 ? (
                    <ul className="notice__list">
                        {items.map((item) => (
                            <li key={item.id}>
                                {item.facility} {item.code} <em>({item.desc})</em>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="notice__message">{message ?? preset.message}</p>
                )}
            </div>

            <div className="notice__summary" aria-label="랜드사이드 요약정보">
                <h3 className="notice__summary-title">
                    랜드사이드<br />요약정보
                </h3>
                <dl className="notice__metrics">
                    {summaryInfo.map((cell) => (
                        <div className="notice__metric" key={cell.label}>
                            <dt>{cell.label.replace('\n', ' ')}</dt>
                            <dd>
                                <b>{cell.value}</b>
                                <span>{cell.unit}</span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
