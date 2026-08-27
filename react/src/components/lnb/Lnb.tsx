import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@/components/icons/InlineIcon';
import { useUserInfo } from '@/hooks/useUserInfo';
import { LNB_HOME_PATH, LNB_TOP, LNB_USER, type NavItem } from './navItems';

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

function NavFlyout({ items, activeId, onSelect }: NavFlyoutProps) {
    return (
        <div className="nav-flyout">
            <div className="nav-flyout__list">
                {items.map((item) => (
                    <button key={item.id} type="button" className={`nav-flyout__item${item.id === activeId ? ' on' : ''}`} onClick={() => onSelect(item)}>
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
    user?: { dept: string; name: string };
}

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

    const userInfo = useUserInfo();
    const displayUser = userInfo ? { dept: userInfo.deptNm, name: userInfo.userNm } : user;

    useEffect(() => {
        if (!open) return;

        const handleDocumentMouseDown = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) setOpen(false);
        };
        const handleDocumentKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handleDocumentMouseDown);
        document.addEventListener('keydown', handleDocumentKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleDocumentMouseDown);
            document.removeEventListener('keydown', handleDocumentKeyDown);
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
                                <NavFlyout items={item.children} activeId={toActiveId(item.children, pathname)} onSelect={handleNavigate} />
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
