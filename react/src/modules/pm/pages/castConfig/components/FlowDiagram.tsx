import { Fragment, useState } from 'react';
import t1Blue from '@/assets/svg/t1-blue.svg';
import t2Teal from '@/assets/svg/t2-teal-full.svg';
import { TERMINAL_LABEL, type FacilityGroup, type FacilityGroupId, type TerminalKind } from '../types';

interface FlowDiagramProps {
    terminal: TerminalKind;
    groups: FacilityGroup[];
    onOpenGroup: (groupId: FacilityGroupId) => void;
}

const NODE_ICON: Record<FacilityGroupId, string> = {
    checkin: 'CI',
    departure: 'DH',
    security: 'SC',
    border: 'BC',
    gate: 'GT',
};

const NODE_CAPTION: Record<FacilityGroupId, string> = {
    checkin: 'Counter · Kiosk · Bag Drop',
    departure: 'Departure Hall',
    security: 'Security Control',
    border: 'Border Control',
    gate: 'Gate & Quarantine',
};

const TERMINAL_ICON: Record<TerminalKind, string> = {
    T1: t1Blue,
    T2: t2Teal,
};

function isConnectorActive(activeGroup: FacilityGroupId | null, currentGroup: FacilityGroupId, previousGroup?: FacilityGroupId): boolean {
    return activeGroup === currentGroup || activeGroup === previousGroup;
}

export function FlowDiagram({ terminal, groups, onOpenGroup }: FlowDiagramProps) {
    const [activeGroup, setActiveGroup] = useState<FacilityGroupId | null>(null);
    const terminalIcon = TERMINAL_ICON[terminal];

    return (
        <section className="cast-config-scene" aria-labelledby={`cast-config-flow-title-${terminal}`}>
            <header className="cast-config-scene__head">
                <div className="cast-config-scene__terminal">
                    <img src={terminalIcon} alt="" className="cast-config-scene__terminal-icon" />
                    <h2 id={`cast-config-flow-title-${terminal}`}>{TERMINAL_LABEL[terminal]}</h2>
                </div>
            </header>

            <div className="cast-config-flow-scroll">
                <div className="cast-config-flow-track">
                    <span className="cast-config-flow-entry" aria-hidden="true">
                        <img src={terminalIcon} alt="" className="cast-config-flow-entry__icon" />
                    </span>
                    {groups.map((group, index) => {
                        const previousGroup = groups[index - 1]?.id;
                        const connectorActive = isConnectorActive(activeGroup, group.id, previousGroup);

                        return (
                            <Fragment key={group.id}>
                                <span className={`cast-config-connector${connectorActive ? ' is-active' : ''}`} aria-hidden="true" />
                                <button
                                    type="button"
                                    className={`cast-config-flow-node${activeGroup === group.id ? ' is-active' : ''}`}
                                    data-group={group.id}
                                    onMouseEnter={() => setActiveGroup(group.id)}
                                    onMouseLeave={() => setActiveGroup(null)}
                                    onFocus={() => setActiveGroup(group.id)}
                                    onBlur={() => setActiveGroup(null)}
                                    onClick={() => onOpenGroup(group.id)}
                                >
                                    <span className="cast-config-node-icon">{NODE_ICON[group.id]}</span>
                                    <span className="cast-config-node-copy">
                                        <strong>{group.label}</strong>
                                        <small>{NODE_CAPTION[group.id]}</small>
                                    </span>
                                    <span className="cast-config-tooltip">{group.description}</span>
                                </button>
                            </Fragment>
                        );
                    })}
                    <span className={`cast-config-connector${activeGroup === 'gate' ? ' is-active' : ''}`} aria-hidden="true" />
                    <span className="cast-config-flow-exit" aria-hidden="true">
                        AIR
                    </span>
                </div>
            </div>
        </section>
    );
}
