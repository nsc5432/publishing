import type { Category } from '../types';

interface CategoryBarProps {
    categories: Category[];
    current: Category | null;
    onSelect: (code: string) => void;
    onRegister: () => void;
    onApplyOper: () => void;
    applying: boolean;
}

export function CategoryBar({ categories, current, onSelect, onRegister, onApplyOper, applying }: CategoryBarProps) {
    return (
        <div className="cast-config-category-bar">
            <label className="cast-config-category-pick">
                <span className="blind">설정 카테고리</span>
                <select value={current?.code ?? ''} onChange={(event) => onSelect(event.target.value)}>
                    {categories.map((category) => (
                        <option key={category.code} value={category.code}>
                            {category.name} ({category.code})
                        </option>
                    ))}
                </select>
            </label>

            {current?.isPreProcess ? (
                <span className="cast-config-category-badge is-pre-prcs">전처리 결과</span>
            ) : current?.isBase ? (
                <span className="cast-config-category-badge is-base">읽기전용</span>
            ) : (
                current && <span className="cast-config-category-badge">{current.confirmed ? '확정' : '미확정'}</span>
            )}

            <span className="cast-config-category-meta">
                {current ? (current.isPreProcess ? `갱신 ${current.modifiedAt}` : `등록 ${current.registeredAt}`) : ''}
            </span>

            <button type="button" className="cast-config-ghost-button" onClick={onRegister}>
                카테고리 등록
            </button>
            <button type="button" className="cast-config-primary-button" disabled={applying || !current || current.isBase} onClick={onApplyOper}>
                운영 반영
            </button>
        </div>
    );
}
