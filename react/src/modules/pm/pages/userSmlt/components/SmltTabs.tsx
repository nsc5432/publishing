import { Fragment } from 'react';
import { CheckWhiteIcon } from '@/components/icons';
import { SMLT_TAB_LABEL, SMLT_TABS, type SmltTabKey } from '../types';

interface SmltTabsProps {
    activeTab: SmltTabKey;
    onTabChange: (tab: SmltTabKey) => void;
}

export function SmltTabs({ activeTab, onTabChange }: SmltTabsProps) {
    const activeIndex = SMLT_TABS.indexOf(activeTab);
    const nextTab: SmltTabKey | undefined = SMLT_TABS[activeIndex + 1];

    return (
        <div className="steps">
            <nav className="tabs" aria-label="시뮬레이션 조건 설정 단계">
                {SMLT_TABS.map((tab, index) => {
                    const done = index < activeIndex;
                    const active = index === activeIndex;
                    const state = done ? ' is-done' : active ? ' is-active' : '';

                    return (
                        <Fragment key={tab}>
                            {index > 0 && <span className="tabs__sep" aria-hidden="true" />}

                            <button
                                type="button"
                                className={`tabs__item${state}`}
                                aria-current={active ? 'step' : undefined}
                                onClick={() => onTabChange(tab)}
                            >
                                <span className="tabs__no" aria-hidden="true">
                                    {done ? <CheckWhiteIcon /> : index + 1}
                                </span>
                                {SMLT_TAB_LABEL[tab]}
                            </button>
                        </Fragment>
                    );
                })}
            </nav>

            {/* 마지막 단계(출국장)에서는 넘어갈 곳이 없다 — 이후는 GNB 의 시뮬레이션 실행 */}
            {nextTab && (
                <button
                    type="button"
                    className="tabs__next"
                    title={`다음 단계 — ${SMLT_TAB_LABEL[nextTab]}`}
                    onClick={() => onTabChange(nextTab)}
                >
                    다음 단계
                </button>
            )}
        </div>
    );
}
