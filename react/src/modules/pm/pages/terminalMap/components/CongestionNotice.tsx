import { NOTICE_LEVEL, type NoticeItem, type NoticeLevel } from '../types';

interface CongestionNoticeProps {
    /** 혼잡 단계 (여유 / 보통 / 혼잡 / 매우혼잡) — 아이콘·뱃지 문구·강조색을 결정한다 */
    level: NoticeLevel;
    /** 조치가 필요한 시설 목록. 비어 있으면 단계별 안내 문구를 대신 노출한다 */
    items?: NoticeItem[];
    /** 목록이 비었을 때 노출할 문구 (미지정 시 NOTICE_LEVEL 의 기본 문구) */
    message?: string;
}

/** 상단 혼잡 알림 바 */
export function CongestionNotice({ level, items = [], message }: CongestionNoticeProps) {
    const preset = NOTICE_LEVEL[level];

    return (
        <section className={`notice notice--${level}`}>
            <h2 className="notice__badge">
                <i className={`ico ico-notice-${level}`} aria-hidden="true" />
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
