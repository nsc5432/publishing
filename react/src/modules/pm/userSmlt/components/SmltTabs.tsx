import { SMLT_TAB_LABEL, SMLT_TABS, type SmltTabKey } from '../types';

interface SmltTabsProps {
    activeTab: SmltTabKey;
    onTabChange: (tab: SmltTabKey) => void;
}

/** 시뮬레이션 대상 탭 5개 (운항편/여객수 · 체크인 카운터 · 셀프체크인/백드롭 · 출국장 · 보안 검색대) */
export function SmltTabs({ activeTab, onTabChange }: SmltTabsProps) {
    return (
        <nav className="tabs">
            {SMLT_TABS.map((tab) => (
                <button
                    key={tab}
                    type="button"
                    className={`tabs__item${tab === activeTab ? ' is-active' : ''}`}
                    aria-pressed={tab === activeTab}
                    onClick={() => onTabChange(tab)}
                >
                    {SMLT_TAB_LABEL[tab]}
                </button>
            ))}
        </nav>
    );
}
