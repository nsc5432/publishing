import { NoticeWarnIcon } from '@/components/icons';
import { NOTICE_LEVEL, type NoticeItem, type NoticeLevel } from '../types';

interface CongestionNoticeProps {
    level: NoticeLevel;
    items?: NoticeItem[];
    message?: string;
}

/** 상단 혼잡 알림 바 — 조치가 필요한 출국장만 모아 보여준다 */
export function CongestionNotice({ level, items = [], message }: CongestionNoticeProps) {
    const preset = NOTICE_LEVEL[level];

    return (
        <section className={`notice notice--${level}`}>
            <h2 className="notice__badge">
                <NoticeWarnIcon className="notice__ico" aria-hidden="true" focusable="false" />
                <span>{preset.label}</span>
            </h2>

            {items.length > 0 ? (
                <ul className="notice__list">
                    {items.map((item) => (
                        <li key={item.id}>
                            {item.facility} <em>({item.desc})</em>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="notice__message">{message ?? preset.message}</p>
            )}
        </section>
    );
}
