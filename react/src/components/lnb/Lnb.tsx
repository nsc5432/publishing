import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/modules/pm/pages/dashboard/components/PmIcons';
import { useUserInfo } from '@/hooks/useUserInfo';
import { LNB_BOTTOM, LNB_HOME_PATH, LNB_TOP, LNB_USER, type NavItem } from './navItems';
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

interface LnbProps {
    defaultBottom?: string;
    topItems?: NavItem[];
    bottomItems?: NavItem[];
    onSelect?: (id: string) => void;
    /** 세션 사용자 정보를 받기 전까지 쓸 표기 (넘기지 않으면 기본값) */
    user?: { dept: string; name: string };
}

function useActiveTop(items: NavItem[]) {
    const { pathname } = useLocation();
    if (pathname === LNB_HOME_PATH) return items[0]?.id;
    return items.find((item) => {
        const prefix = item.match ?? item.path;
        return prefix && pathname.startsWith(prefix);
    })?.id;
}

export function Lnb({
    defaultBottom = LNB_BOTTOM[0].id,
    topItems = LNB_TOP,
    bottomItems = LNB_BOTTOM,
    onSelect,
    user = LNB_USER,
}: LnbProps) {
    const activeTop = useActiveTop(topItems);
    const [activeBottom, setActiveBottom] = useState(defaultBottom);
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
                    {topItems.map((item) => (
                        <NavButton
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            className={`nav-item${item.id === activeTop ? ' active' : ''}`}
                            onClick={() => handleNavigate(item)}
                        />
                    ))}

                    {bottomItems.length > 0 && (
                        <>
                            <span className="nav-sep" />
                            {bottomItems.map((item) => (
                                <NavButton
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    className={`nav-item${item.id === activeBottom ? ' on' : ''}`}
                                    onClick={() => {
                                        setActiveBottom(item.id);
                                        handleNavigate(item);
                                    }}
                                />
                            ))}
                        </>
                    )}
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
