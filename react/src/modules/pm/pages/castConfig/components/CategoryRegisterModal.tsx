import { useState } from 'react';
import type { CastConfigCategoryCloneDto } from '@/types/api.types';
import type { Category } from '../types';

interface CategoryRegisterModalProps {
    source: Category;
    saving: boolean;
    onSubmit: (dto: CastConfigCategoryCloneDto) => void;
    onClose: () => void;
}

export function CategoryRegisterModal({ source, saving, onSubmit, onClose }: CategoryRegisterModalProps) {
    const [name, setName] = useState('');
    const canSubmit = name.trim().length > 0 && !saving;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit({ srcFixAtrbGroupId: source.code, atrbGroupNm: name.trim() });
    };

    return (
        <div className="cast-config-layer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="cast-config-layer" role="dialog" aria-modal="true" aria-labelledby="cast-config-category-register-title">
                <header className="cast-config-layer__header">
                    <h3 id="cast-config-category-register-title">카테고리 복제</h3>
                    <button type="button" className="cast-config-icon-button" aria-label="닫기" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="cast-config-layer__body">
                    <p className="cast-config-layer__lead">선택 카테고리 전체 설정을 복제합니다.</p>

                    <dl className="cast-config-form">
                        <dt>원본 카테고리</dt>
                        <dd className="cast-config-form__source">
                            {source.name} ({source.code})
                        </dd>

                        <dt>카테고리명</dt>
                        <dd>
                            <input type="text" value={name} autoFocus placeholder="신규 카테고리명" onChange={(event) => setName(event.target.value)} />
                        </dd>
                    </dl>
                </div>

                <footer className="cast-config-layer__footer">
                    <button type="button" className="cast-config-primary-button" disabled={!canSubmit} onClick={handleSubmit}>
                        {saving ? '저장 중' : '저장'}
                    </button>
                    <button type="button" className="cast-config-ghost-button" onClick={onClose}>
                        취소
                    </button>
                </footer>
            </section>
        </div>
    );
}
