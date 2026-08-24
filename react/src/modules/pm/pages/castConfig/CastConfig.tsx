import './castConfig.css';
import { useState } from 'react';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { DataConfigModal } from './components/DataConfigModal';
import { FlowDiagram } from './components/FlowDiagram';
import { Header } from './components/Header';
import { useCastConfigGroups } from './hooks/useCastConfigGroups';
import type { FacilityGroupId, TerminalKind } from './types';

interface ActiveGroup {
    terminal: TerminalKind;
    groupId: FacilityGroupId;
}

const T1_QUERY = { terminal: 'T1' as TerminalKind };
const T2_QUERY = { terminal: 'T2' as TerminalKind };

function CastConfig() {
    usePageScope('castConfig');

    const [active, setActive] = useState<ActiveGroup | null>(null);
    const groupsT1 = useCastConfigGroups(T1_QUERY);
    const groupsT2 = useCastConfigGroups(T2_QUERY);
    const activeGroups = active?.terminal === 'T2' ? groupsT2.data : groupsT1.data;
    const activeGroup = active ? (activeGroups?.find((group) => group.id === active.groupId) ?? null) : null;

    useErrorAlert(groupsT1.error, groupsT1.token);
    useErrorAlert(groupsT2.error, groupsT2.token);

    return (
        <div className="wrap">
            <Header />

            <div className="body">
                <Lnb />

                <main className="cast-config-container">
                    <div className="cast-config-intro">
                        <div>
                            <span className="cast-config-intro__eyebrow">Cast 설정</span>
                            <h2>여객 동선별 데이터 연계 항목</h2>
                        </div>
                    </div>

                    <div className="cast-config-scene-row">
                        <FlowDiagram terminal="T1" groups={groupsT1.data ?? []} onOpenGroup={(groupId) => setActive({ terminal: 'T1', groupId })} />
                        <FlowDiagram terminal="T2" groups={groupsT2.data ?? []} onOpenGroup={(groupId) => setActive({ terminal: 'T2', groupId })} />
                    </div>

                    <aside className="cast-config-legend" aria-label="시설그룹 색상 안내">
                        <span>
                            <i className="is-checkin" />
                            체크인
                        </span>
                        <span>
                            <i className="is-departure" />
                            출국장
                        </span>
                        <span>
                            <i className="is-security" />
                            시큐리티
                        </span>
                        <span>
                            <i className="is-border" />
                            출입국심사
                        </span>
                        <span>
                            <i className="is-gate" />
                            게이트
                        </span>
                    </aside>
                </main>
            </div>

            {activeGroup && active && (
                <DataConfigModal key={`${active.terminal}-${activeGroup.id}`} terminal={active.terminal} group={activeGroup} onClose={() => setActive(null)} />
            )}
        </div>
    );
}

export default CastConfig;
