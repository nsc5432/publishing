import { NOTICE_LEVEL, UNKNOWN_NOTICE, toLevelKey, type NoticeItem, type NoticeLevel } from '../types';

interface CongestionNoticeProps {
    level: NoticeLevel | null;
    items?: NoticeItem[];
    message?: string;
}

/** 상단 혼잡 알림 바 */
export function CongestionNotice({ level, items = [], message }: CongestionNoticeProps) {
    const preset = level === null ? UNKNOWN_NOTICE : NOTICE_LEVEL[level];
    const levelKey = toLevelKey(level);

    return (
        <section className={`notice notice--${levelKey}`}>
            <h2 className="notice__badge">
                <i className={`ico ico-notice-${levelKey}`} aria-hidden="true" />
                <span>{preset.label}</span>
            </h2>

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
        </section>
    );
}
