import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Category } from '../types';
import { Pagination } from './Pagination';

interface CategoryManagerModalProps {
    categories: Category[];
    currentCode: string;
    onSelect: (code: string) => void;
    onClose: () => void;
}

interface Filter {
    code: string;
    name: string;
}

const PAGE_SIZE = 5;
const EMPTY_FILTER: Filter = { code: '', name: '' };
const TBL_COLS = '56px 1fr 2.4fr 1.6fr 72px';

function filterCategories(categories: Category[], filter: Filter): Category[] {
    const code = filter.code.trim().toLocaleLowerCase('ko-KR');
    const name = filter.name.trim().toLocaleLowerCase('ko-KR');

    return categories.filter(
        (category) =>
            (!code || category.code.toLocaleLowerCase('ko-KR').includes(code)) &&
            (!name || category.name.toLocaleLowerCase('ko-KR').includes(name)),
    );
}

export function CategoryManagerModal({ categories, currentCode, onSelect, onClose }: CategoryManagerModalProps) {
    const [draft, setDraft] = useState<Filter>(EMPTY_FILTER);
    const [filter, setFilter] = useState<Filter>(EMPTY_FILTER);
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => filterCategories(categories, filter), [categories, filter]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = () => {
        setFilter(draft);
        setPage(1);
    };

    return (
        <div className="cast-config-layer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="cast-config-layer is-wide" role="dialog" aria-modal="true" aria-labelledby="cast-config-category-manage-title">
                <header className="cast-config-layer__header">
                    <h3 id="cast-config-category-manage-title">카테고리 관리</h3>
                    <button type="button" className="cast-config-icon-button" aria-label="닫기" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="cast-config-layer__body">
                    <p className="cast-config-layer__lead">• 카테고리 검색</p>
                    <p className="cast-config-layer__hint">카테고리명을 선택하시면 자동으로 적용됩니다.</p>

                    <div className="cast-config-category-search">
                        <label>
                            카테고리 코드
                            <input type="search" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
                        </label>
                        <label>
                            카테고리명
                            <input type="search" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                        </label>
                        <button type="button" className="cast-config-ghost-button" onClick={handleSearch}>
                            검색
                        </button>
                    </div>

                    <p className="cast-config-layer__lead">• 카테고리 목록</p>

                    <div className="cast-config-category-table" style={{ '--cat-cols': TBL_COLS } as CSSProperties}>
                        <div className="cast-config-category-table__head">
                            <div>No</div>
                            <div>카테고리 코드</div>
                            <div>카테고리명</div>
                            <div>등록일시</div>
                            <div>선택</div>
                        </div>

                        {pageRows.map((category, index) => (
                            <div className="cast-config-category-table__row" key={category.code}>
                                <div>{filtered.length - ((currentPage - 1) * PAGE_SIZE + index)}</div>
                                <div>{category.code}</div>
                                <div>{category.name}</div>
                                <div>{category.registeredAt}</div>
                                <div>
                                    <button
                                        type="button"
                                        className="cast-config-ghost-button is-compact"
                                        disabled={category.code === currentCode}
                                        onClick={() => onSelect(category.code)}
                                    >
                                        선택
                                    </button>
                                </div>
                            </div>
                        ))}

                        {pageRows.length === 0 && <p className="cast-config-category-table__empty">검색 조건과 일치하는 카테고리가 없습니다.</p>}
                    </div>
                </div>

                <footer className="cast-config-layer__footer is-center">
                    <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                </footer>
            </section>
        </div>
    );
}
