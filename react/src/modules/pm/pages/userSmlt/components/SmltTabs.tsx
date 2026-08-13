import { Fragment } from 'react';
import { CheckWhiteIcon } from '@/components/icons';
import { SMLT_TAB_LABEL, SMLT_TABS, type SmltTabKey } from '../types';

interface SmltTabsProps {
    activeTab: SmltTabKey;
    onTabChange: (tab: SmltTabKey) => void;
}

/**
 * 시뮬레이션 대상 단계 3개 (운항편/여객수 → 체크인 카운터 → 출국장).
 *
 * GNB 가운데에 얹히는 스테퍼 — 번호와 셰브론으로 순서를 보이고,
 * 지나온 단계는 체크(is-done), 현재 단계는 흰 알약(is-active)으로 구분한다.
 * 단계 건너뛰기는 막지 않는다 (어느 단계든 눌러서 이동할 수 있다).
 *
 * 스테퍼는 "지금 어디인지"만 말해 줄 뿐 다음 단계로 넘어가려면 눌러야 한다는 게
 * 읽히지 않는다. 그래서 오른쪽에 다음 단계 버튼을 붙여 진행 방향을 드러낸다.
 */
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
