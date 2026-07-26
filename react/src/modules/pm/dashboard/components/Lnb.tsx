import { useState } from 'react';
import { Icon } from './PmIcons';
import { DEFAULT_NAV_BOTTOM, DEFAULT_NAV_TOP, LNB_BOTTOM, LNB_TOP } from '../mock';

/** 좌측 사이드바 네비게이션 레일 (Lnb.png) */
export function Lnb() {
    // 상단(강조 배경)과 하단(텍스트 강조) 그룹은 각각 하나만 활성.
    const [activeTop, setActiveTop] = useState(DEFAULT_NAV_TOP);
    const [activeBottom, setActiveBottom] = useState(DEFAULT_NAV_BOTTOM);

    return (
        <nav className="sidebar">
            <div className="sidebar-inner">
                <div className="nav-list">
                    {LNB_TOP.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={`nav-item${item.id === activeTop ? ' active' : ''}`}
                            onClick={() => setActiveTop(item.id)}
                        >
                            <Icon name={item.icon} />
                        </button>
                    ))}
                    <span className="nav-sep" />
                    {LNB_BOTTOM.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={`nav-item${item.id === activeBottom ? ' on' : ''}`}
                            onClick={() => setActiveBottom(item.id)}
                        >
                            <Icon name={item.icon} />
                        </button>
                    ))}
                </div>
                <button type="button" className="nav-item logout">
                    <Icon name="logout" />
                </button>
            </div>
        </nav>
    );
}
