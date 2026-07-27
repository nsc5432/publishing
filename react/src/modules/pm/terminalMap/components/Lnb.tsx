import { useState } from 'react';
// PM 화면 공용 아이콘 세트 (대시보드와 동일한 레일이라 아이콘을 재사용한다)
import { Icon, type IconName } from '@/modules/pm/dashboard/components/PmIcons';
import { DEFAULT_NAV_BOTTOM, DEFAULT_NAV_TOP, LNB_BOTTOM, LNB_LOGOUT, LNB_TOP } from '../mock';

interface NavButtonProps {
    icon: IconName;
    /** 마우스 오버 / 포커스 시 노출되는 메뉴명 */
    label: string;
    className: string;
    onClick?: () => void;
}

/**
 * 레일 아이콘 버튼.
 * 아이콘만 있는 메뉴라 메뉴명을 툴팁으로 덧붙인다.
 * title 속성 대신 요소로 그려 노출 시점과 디자인을 제어하고,
 * 스크린리더에는 aria-label 로 같은 이름을 전달한다.
 */
function NavButton({ icon, label, className, onClick }: NavButtonProps) {
    return (
        <button type="button" className={className} onClick={onClick} aria-label={label}>
            <Icon name={icon} />
            <span className="nav-tip" aria-hidden="true">
                {label}
            </span>
        </button>
    );
}

/** 좌측 사이드바 네비게이션 레일 (시안: 일일-맵형태 조회T1.png) */
export function Lnb() {
    // 상단(강조 배경)과 하단(텍스트 강조) 그룹은 각각 하나만 활성.
    const [activeTop, setActiveTop] = useState(DEFAULT_NAV_TOP);
    const [activeBottom, setActiveBottom] = useState(DEFAULT_NAV_BOTTOM);

    return (
        <nav className="sidebar">
            <div className="sidebar-inner">
                <div className="nav-list">
                    {LNB_TOP.map((item) => (
                        <NavButton
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            className={`nav-item${item.id === activeTop ? ' active' : ''}`}
                            onClick={() => setActiveTop(item.id)}
                        />
                    ))}
                    <span className="nav-sep" />
                    {LNB_BOTTOM.map((item) => (
                        <NavButton
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            className={`nav-item${item.id === activeBottom ? ' on' : ''}`}
                            onClick={() => setActiveBottom(item.id)}
                        />
                    ))}
                </div>
                <NavButton
                    icon={LNB_LOGOUT.icon}
                    label={LNB_LOGOUT.label}
                    className="nav-item logout"
                />
            </div>
        </nav>
    );
}
