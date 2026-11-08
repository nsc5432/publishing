import { useNavigate } from 'react-router-dom';
import { useSmltScope, type SmltView } from '@/modules/pm/hooks/useSmltScope';

interface SmltViewTabsProps {
    active: SmltView;
    ymd: string;
    tmnlId?: string;
}

const VIEW_TABS: { view: SmltView; label: string }[] = [
    { view: 'dashboard', label: '요약보기' },
    { view: 'terminalMap', label: '맵형태보기' },
    { view: 'checkinCounter', label: '체크인카운터' },
    { view: 'departureHall', label: '출국장' },
];

export function SmltViewTabs({ active, ymd, tmnlId }: SmltViewTabsProps) {
    const navigate = useNavigate();
    const { pathOf } = useSmltScope();

    const handleSelect = (view: SmltView) => {
        if (view === active) return;
        navigate(pathOf(view, { ymd, tmnlId }));
    };

    return (
        <nav className="smlt-view-tabs" aria-label="결과 보기">
            {VIEW_TABS.map(({ view, label }) => (
                <button
                    key={view}
                    type="button"
                    className={`smlt-view-tabs__item${view === active ? ' on' : ''}`}
                    aria-current={view === active ? 'page' : undefined}
                    onClick={() => handleSelect(view)}
                >
                    {label}
                </button>
            ))}
        </nav>
    );
}
