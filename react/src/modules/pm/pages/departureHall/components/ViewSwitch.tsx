import type { ComponentType, SVGProps } from 'react';
import { ChartIcon, MapIcon, TableIcon } from '@/components/icons';
import type { ViewMode } from '../types';

interface ViewSwitchProps {
    view: ViewMode;
    onChange: (view: ViewMode) => void;
}

const VIEWS: Array<{ id: ViewMode; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> =
    [
        { id: 'map', label: '맵 보기', Icon: MapIcon },
        { id: 'table', label: '표 보기', Icon: TableIcon },
        { id: 'chart', label: '차트 보기', Icon: ChartIcon },
    ];

/** 우상단 보기 전환 (맵 / 표 / 차트) */
export function ViewSwitch({ view, onChange }: ViewSwitchProps) {
    return (
        <div className="view-switch" role="group" aria-label="보기 전환">
            {VIEWS.map(({ id, label, Icon }) => (
                <button
                    key={id}
                    type="button"
                    className={`view-switch__btn${id === view ? ' is-on' : ''}`}
                    aria-pressed={id === view}
                    onClick={() => onChange(id)}
                >
                    <Icon aria-hidden="true" focusable="false" />
                    <span className="blind">{label}</span>
                </button>
            ))}
        </div>
    );
}
