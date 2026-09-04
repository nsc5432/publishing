import type { ComponentType, SVGProps } from 'react';
import { ChartIcon, TableIcon } from '@/components/icons';
import { VIEW_LABEL, type ViewMode } from '../types';

interface ViewSwitchProps {
    view: ViewMode;
    onChange: (view: ViewMode) => void;
}

const VIEWS: Array<{ id: ViewMode; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = [
    { id: 'chart', Icon: ChartIcon },
    { id: 'table', Icon: TableIcon },
];

/** 우상단 보기 전환 (차트 / 표) — 출국장 화면과 같은 자리·같은 조작이다 */
export function ViewSwitch({ view, onChange }: ViewSwitchProps) {
    return (
        <div className="view-switch" role="group" aria-label="보기 전환">
            {VIEWS.map(({ id, Icon }) => (
                <button
                    key={id}
                    type="button"
                    className={`view-switch__btn${id === view ? ' is-on' : ''}`}
                    aria-pressed={id === view}
                    onClick={() => onChange(id)}
                >
                    <Icon aria-hidden="true" focusable="false" />
                    <span className="blind">{VIEW_LABEL[id]}</span>
                </button>
            ))}
        </div>
    );
}
