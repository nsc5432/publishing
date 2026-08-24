import { useRef } from 'react';
import { SearchIcon } from '@/components/icons';
import { formatCount } from '@/lib/format';

interface GridToolbarProps {
    sheetName: string;
    query: string;
    rowCount: number;
    dimension: string;
    sheetChangeCount: number;
    totalChangeCount: number;
    readOnly: boolean;
    onQueryChange: (query: string) => void;
    onDownload: () => void;
    onUpload: (file: File) => void;
    onApplyDefault: () => void;
    onReset: () => void;
}

const BASE_HINT = '> 기준정보는 기본값이므로 변경할 수 없습니다.';

export function GridToolbar({
    sheetName,
    query,
    rowCount,
    dimension,
    sheetChangeCount,
    totalChangeCount,
    readOnly,
    onQueryChange,
    onDownload,
    onUpload,
    onApplyDefault,
    onReset,
}: GridToolbarProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <div className="cast-config-grid-head">
            <div className="cast-config-grid-title">
                <h3>• {sheetName || '시트 없음'} 상세</h3>
                {readOnly && <span className="cast-config-grid-hint">{BASE_HINT}</span>}
            </div>

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
                        {formatCount(rowCount)}개 행{dimension ? ` · ${dimension}` : ''}
                    </span>
                    <span className="cast-config-change-pill">
                        변경 이 시트 {formatCount(sheetChangeCount)} · 전체 {formatCount(totalChangeCount)}
                    </span>
                </div>

                <div className="cast-config-grid-actions">
                    <button type="button" className="cast-config-ghost-button" onClick={onDownload}>
                        엑셀저장
                    </button>
                    <button type="button" className="cast-config-ghost-button" disabled={readOnly} onClick={() => fileRef.current?.click()}>
                        엑셀업로드
                    </button>
                    <button type="button" className="cast-config-ghost-button" disabled={readOnly} onClick={onApplyDefault}>
                        디폴트속성적용
                    </button>
                    <button type="button" className="cast-config-ghost-button" disabled={readOnly} onClick={onReset}>
                        초기화
                    </button>

                    <input
                        ref={fileRef}
                        type="file"
                        className="blind"
                        accept=".xlsx,.xls"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (file) onUpload(file);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
