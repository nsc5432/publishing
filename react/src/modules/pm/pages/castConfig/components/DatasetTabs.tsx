import type { DatasetTab } from '../types';

interface DatasetTabsProps {
    tabs: DatasetTab[];
    activeIndex: number;
    onSelect: (index: number) => void;
}

export function DatasetTabs({ tabs, activeIndex, onSelect }: DatasetTabsProps) {
    return (
        <div className="cast-config-dataset-tabs" role="tablist" aria-label="원본 시트">
            {tabs.map((tab, index) => (
                <button
                    key={tab.sheetName}
                    type="button"
                    className="cast-config-dataset-tab"
                    role="tab"
                    aria-selected={index === activeIndex}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onClick={() => onSelect(index)}
                >
                    {tab.sheetName} <small>({tab.rowCount.toLocaleString('ko-KR')})</small>
                </button>
            ))}
        </div>
    );
}
