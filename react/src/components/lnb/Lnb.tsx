import { useState } from 'react';
// PM 화면 공용 아이콘 세트 (레일 아이콘은 전 화면이 동일하다)
import { Icon, type IconName } from '@/modules/pm/dashboard/components/PmIcons';
import { LNB_BOTTOM, LNB_LOGOUT, LNB_TOP, type NavItem } from './navItems';

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

interface LnbProps {
    /** 상단 그룹 초기 활성 메뉴 id (예: chart) */
    defaultTop?: string;
    /** 하단 그룹 초기 활성 메뉴 id — 화면마다 다르다 (대시보드: grid / 맵: map) */
    defaultBottom?: string;
    /** 메뉴 구성을 바꿔야 할 때만 전달 (기본값: 공용 메뉴) */
    topItems?: NavItem[];
    bottomItems?: NavItem[];
    /** 메뉴 클릭 (라우팅 연동 지점) */
    onSelect?: (id: string) => void;
    /** 로그아웃 클릭 */
    onLogout?: () => void;
}

/**
 * 좌측 사이드바 네비게이션 레일 — 전 화면 공용.
 * 상단(강조 배경)과 하단(아이콘 색 강조) 그룹은 각각 하나만 활성이며,
 * 활성 상태는 내부에서 관리하고 초기값만 Props 로 받는다.
 */
export function Lnb({
    defaultTop = LNB_TOP[0].id,
    defaultBottom = LNB_BOTTOM[0].id,
    topItems = LNB_TOP,
    bottomItems = LNB_BOTTOM,
    onSelect,
    onLogout,
}: LnbProps) {
    const [activeTop, setActiveTop] = useState(defaultTop);
    const [activeBottom, setActiveBottom] = useState(defaultBottom);

    return (
        <nav className="sidebar">
            <div className="sidebar-inner">
                <div className="nav-list">
                    {topItems.map((item) => (
                        <NavButton
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            className={`nav-item${item.id === activeTop ? ' active' : ''}`}
                            onClick={() => {
                                setActiveTop(item.id);
                                onSelect?.(item.id);
                            }}
                        />
                    ))}
                    <span className="nav-sep" />
                    {bottomItems.map((item) => (
                        <NavButton
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            className={`nav-item${item.id === activeBottom ? ' on' : ''}`}
                            onClick={() => {
                                setActiveBottom(item.id);
                                onSelect?.(item.id);
                            }}
                        />
                    ))}
                </div>
                <NavButton
                    icon={LNB_LOGOUT.icon}
                    label={LNB_LOGOUT.label}
                    className="nav-item logout"
                    onClick={onLogout}
                />
            </div>
        </nav>
    );
}
