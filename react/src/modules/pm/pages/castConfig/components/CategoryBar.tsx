import { formatCount } from '@/lib/format';
import type { Category } from '../types';

interface CategoryBarProps {
    categories: Category[];
    current: Category | null;
    changeCount: number;
    busy: boolean;
    onSelect: (code: string) => void;
    onClone: () => void;
    onSave: () => void;
    onApplyOper: () => void;
    onDownload: () => void;
    onOpenHistory: () => void;
}

export function CategoryBar({ categories, current, changeCount, busy, onSelect, onClone, onSave, onApplyOper, onDownload, onOpenHistory }: CategoryBarProps) {
    const hasDrafts = changeCount > 0;
    const persistedActionDisabled = busy || hasDrafts || !current;

    return (
        <div className="cast-config-category-bar is-page-toolbar">
            <label className="cast-config-category-pick">
                <span className="blind">설정 카테고리</span>
                <select value={current?.code ?? ''} disabled={busy} onChange={(event) => onSelect(event.target.value)}>
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
                <span className="cast-config-category-badge is-base">운영 기준</span>
            ) : (
                current && <span className="cast-config-category-badge">{current.confirmed ? '확정' : '미확정'}</span>
            )}

            <span className="cast-config-category-meta">
                {current ? (current.isPreProcess ? `갱신 ${current.modifiedAt}` : `등록 ${current.registeredAt}`) : ''}
                {hasDrafts && <strong> · 변경 {formatCount(changeCount)}건</strong>}
            </span>

            <div className="cast-config-category-actions">
                <button
                    type="button"
                    className="cast-config-primary-button is-clone"
                    disabled={persistedActionDisabled}
                    title={hasDrafts ? '변경 내용을 먼저 저장해 주세요.' : undefined}
                    onClick={onClone}
                >
                    복제
                </button>
                <button
                    type="button"
                    className="cast-config-primary-button is-save"
                    disabled={busy || !hasDrafts || !current || current.isBase || current.isPreProcess}
                    onClick={onSave}
                >
                    저장
                </button>
                <button
                    type="button"
                    className="cast-config-primary-button is-apply"
                    disabled={persistedActionDisabled || current?.isBase}
                    title={hasDrafts ? '변경 내용을 먼저 저장해 주세요.' : undefined}
                    onClick={onApplyOper}
                >
                    운영 반영
                </button>
                <button
                    type="button"
                    className="cast-config-ghost-button"
                    disabled={persistedActionDisabled}
                    title={hasDrafts ? '변경 내용을 먼저 저장해 주세요.' : undefined}
                    onClick={onDownload}
                >
                    엑셀저장
                </button>
                <button type="button" className="cast-config-ghost-button" disabled={busy} onClick={onOpenHistory}>
                    반영 이력
                </button>
            </div>
        </div>
    );
}
