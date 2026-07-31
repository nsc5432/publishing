import { useEffect, useRef, useState } from 'react';
// PM 화면 공용 아이콘 세트 (레일 아이콘은 전 화면이 동일하다)
import { Icon, type IconName } from '@/modules/pm/pages/dashboard/components/PmIcons';
import { LNB_BOTTOM, LNB_HOME_PATH, LNB_TOP, LNB_USER, type NavItem } from './navItems';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavButtonProps {
    icon: IconName;
    /** 접힘: 마우스 오버 툴팁 / 펼침: 버튼 안 텍스트 */
    label: string;
    className: string;
    onClick?: () => void;
}

/**
 * 레일 아이콘 버튼.
 * 접힘 상태에서는 아이콘만 보이므로 메뉴명을 툴팁으로 덧붙이고,
 * 펼침 상태에서는 툴팁 대신 .nav-label 이 드러난다 (전환은 common.css).
 * title 속성 대신 요소로 그려 노출 시점과 디자인을 제어하고,
 * 스크린리더에는 aria-label 로 같은 이름을 전달한다.
 */
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
    /** 하단 그룹 초기 활성 메뉴 id — 화면마다 다르다 (요약보기: summary / 맵: map) */
    defaultBottom?: string;
    /** 메뉴 구성을 바꿔야 할 때만 전달 (기본값: 공용 메뉴) */
    topItems?: NavItem[];
    /** 빈 배열을 넘기면 구분선과 함께 하단 그룹을 그리지 않는다 */
    bottomItems?: NavItem[];
    /** 메뉴 클릭 (라우팅 연동 지점) */
    onSelect?: (id: string) => void;
    /** 펼침 상태에서 하단에 노출되는 사용자 */
    user?: { dept: string; name: string };
}

/**
 * 현재 경로에 해당하는 상단 메뉴 id.
 * 활성 표시를 화면별 Props(초기값)로 두면 화면을 옮길 때마다 레일이 새로 그려지면서
 * 표시가 풀리거나 엉뚱한 곳에 남는다. 경로가 곧 활성 메뉴이므로 경로에서 끌어온다.
 */
function useActiveTop(items: NavItem[]) {
    const { pathname } = useLocation();
    // '/rui/pm' 진입 시에는 대시보드가 열리므로 첫 메뉴를 활성으로 본다.
    if (pathname === LNB_HOME_PATH) return items[0]?.id;
    return items.find((item) => {
        const prefix = item.match ?? item.path;
        return prefix && pathname.startsWith(prefix);
    })?.id;
}

/**
 * 좌측 사이드바 네비게이션 레일 — 전 화면 공용.
 * 상단(강조 배경)은 현재 경로를, 하단(아이콘 색 강조)은 화면 안에서의 보기 선택을 뜻한다.
 * 맨 아래 버튼은 레일을 펼치는 토글이며, 펼친 뒤에는 사용자 정보를 함께 보여준다.
 */
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

    // 펼친 패널은 본문을 덮으므로 바깥 클릭 / ESC 로 닫을 수 있어야 한다.
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
        // 아직 화면이 없는 메뉴는 빈 화면으로 나가지 않도록 이동을 막는다.
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

                {/* 맨 아래 = 레일 펼침/접힘 토글 (로그아웃 아님) */}
                <button
                    type="button"
                    className="nav-item nav-toggle"
                    aria-expanded={open}
                    aria-label={open ? 'LNB 닫기' : 'LNB 열기'}
                    onClick={() => setOpen((v) => !v)}
                >
                    <Icon name="logout" />
                    <span className="nav-user" aria-hidden="true">
                        <span className="nav-user__dept">{user.dept}</span>
                        <strong className="nav-user__name">{user.name}</strong>
                    </span>
                    <span className="nav-tip" aria-hidden="true">
                        {open ? 'LNB 닫기' : 'LNB 열기'}
                    </span>
                </button>
            </div>
        </nav>
    );
}
