import { Fragment, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/icons/InlineIcon';
import { useUserInfo } from '@/hooks/useUserInfo';
import { LNB_HOME_PATH, LNB_TOP, LNB_USER, type NavItem } from './navItems';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavButtonProps {
    icon: IconName;
    label: string;
    className: string;
    onClick?: () => void;
}

function NavButton({ icon, label, className, onClick }: NavButtonProps) {
    return (
        <button type="button" className={className} onClick={onClick} aria-label={label}>
            <Icon name={icon} />
            <span className="nav-label" aria-hidden="true">
                {label}
            </span>
            <span className="nav-tip" aria-hidden="true">
                {label}
            </span>
        </button>
    );
}

interface NavFlyoutProps {
    items: NavItem[];
    activeId?: string;
    onSelect: (item: NavItem) => void;
}

/**
 * 하위 메뉴 플라이아웃 — 상위 아이콘 오른쪽으로 아이콘 + 메뉴명을 한 줄로 늘어놓는다.
 *
 * 여닫는 상태를 두지 않고 CSS hover(:hover / :focus-within)로만 보인다.
 * 레일과 목록 사이 여백은 .nav-flyout 의 padding 이라 마우스가 지나가도 hover 가 끊기지 않는다.
 */
function NavFlyout({ items, activeId, onSelect }: NavFlyoutProps) {
    return (
        <div className="nav-flyout">
            <div className="nav-flyout__list">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`nav-flyout__item${item.id === activeId ? ' on' : ''}`}
                        onClick={() => onSelect(item)}
                    >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

interface LnbProps {
    topItems?: NavItem[];
    onSelect?: (id: string) => void;
    /** 세션 사용자 정보를 받기 전까지 쓸 표기 (넘기지 않으면 기본값) */
    user?: { dept: string; name: string };
}

/** 현재 경로에 해당하는 메뉴 id (홈은 첫 메뉴를 고른 것으로 본다) */
function toActiveId(items: NavItem[], pathname: string): string | undefined {
    if (pathname === LNB_HOME_PATH) return items[0]?.id;
    return items.find((item) => {
        const prefix = item.match ?? item.path;
        return prefix && pathname.startsWith(prefix);
    })?.id;
}

export function Lnb({ topItems = LNB_TOP, onSelect, user = LNB_USER }: LnbProps) {
    const { pathname } = useLocation();
    const activeTop = toActiveId(topItems, pathname);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const navRef = useRef<HTMLElement>(null);

    // 세션에서 받은 부서/성명. 못 받으면 넘겨받은 기본 표기를 그대로 쓴다.
    const userInfo = useUserInfo();
    const displayUser = userInfo ? { dept: userInfo.deptNm, name: userInfo.userNm } : user;

    useEffect(() => {
        if (!open) return;

        const onDown = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const handleNavigate = (item: NavItem) => {
        onSelect?.(item.id);
        if (item.path) navigate(item.path);
    };

    return (
        <nav ref={navRef} className={`sidebar${open ? ' is-open' : ''}`}>
            <div className="sidebar-inner">
                <div className="nav-list">
                    {topItems.map((item) => {
                        const button = (
                            <NavButton
                                icon={item.icon}
                                label={item.label}
                                className={`nav-item${item.id === activeTop ? ' active' : ''}`}
                                onClick={() => handleNavigate(item)}
                            />
                        );

                        if (!item.children) return <Fragment key={item.id}>{button}</Fragment>;

                        return (
                            <div key={item.id} className="nav-group">
                                {button}
                                <NavFlyout
                                    items={item.children}
                                    activeId={toActiveId(item.children, pathname)}
                                    onSelect={handleNavigate}
                                />
                            </div>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="nav-item nav-toggle"
                    aria-expanded={open}
                    aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
                    onClick={() => setOpen((v) => !v)}
                >
                    <Icon name="logout" />
                    <span className="nav-user" aria-hidden="true">
                        <span className="nav-user__dept">{displayUser.dept}</span>
                        <strong className="nav-user__name">{displayUser.name}</strong>
                    </span>
                    <span className="nav-tip" aria-hidden="true">
                        {open ? '메뉴 닫기' : '메뉴 열기'}
                    </span>
                </button>
            </div>
        </nav>
    );
}
