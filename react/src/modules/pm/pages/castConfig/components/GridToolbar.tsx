import { SearchIcon } from '@/components/icons';

interface GridToolbarProps {
    query: string;
    rowCount: number;
    dimension: string;
    changeCount: number;
    onQueryChange: (query: string) => void;
}

export function GridToolbar({ query, rowCount, dimension, changeCount, onQueryChange }: GridToolbarProps) {
    return (
        <div className="cast-config-grid-toolbar">
            <label className="cast-config-search-wrap">
                <span className="blind">현재 데이터 검색</span>
                <SearchIcon aria-hidden="true" />
                <input
                    className="cast-config-search-input"
                    type="search"
                    value={query}
                    placeholder="현재 시트에서 검색"
                    onChange={(event) => onQueryChange(event.target.value)}
                />
            </label>
            <div className="cast-config-grid-meta">
                <span>
                    {rowCount.toLocaleString('ko-KR')}개 행{dimension ? ` · ${dimension}` : ''}
                </span>
                <span className="cast-config-change-pill">변경 {changeCount.toLocaleString('ko-KR')}</span>
            </div>
        </div>
    );
}
