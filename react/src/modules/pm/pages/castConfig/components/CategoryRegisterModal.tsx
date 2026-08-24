import { useState } from 'react';
import { PillSelect } from '@/components/ui/pill-select';
import { HOUR_OPTIONS, MINUTE_OPTIONS, toDateInputValue, toYmd, todayYmd } from '@/lib/format';
import type { CastConfigCategorySaveDto } from '@/types/api.types';

interface CategoryRegisterModalProps {
    sheetNames: string[];
    saving: boolean;
    onSubmit: (dto: CastConfigCategorySaveDto) => void;
    onClose: () => void;
}

export function CategoryRegisterModal({ sheetNames, saving, onSubmit, onClose }: CategoryRegisterModalProps) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [date, setDate] = useState(toDateInputValue(todayYmd()));
    const [hour, setHour] = useState('09');
    const [minute, setMinute] = useState('00');
    const [sheets, setSheets] = useState<string[]>(sheetNames);

    const canSubmit = name.trim().length > 0 && code.trim().length > 0 && sheets.length > 0 && !saving;

    const toggleSheet = (sheetName: string) => {
        setSheets((previous) =>
            previous.includes(sheetName) ? previous.filter((item) => item !== sheetName) : [...previous, sheetName],
        );
    };

    const handleSubmit = () => {
        if (!canSubmit) return;

        onSubmit({
            fixAtrbGroupId: code.trim(),
            atrbGroupNm: name.trim(),
            frstRegDt: `${toYmd(date)}${hour}${minute}00`,
            sheetNmList: sheets,
        });
    };

    return (
        <div className="cast-config-layer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="cast-config-layer" role="dialog" aria-modal="true" aria-labelledby="cast-config-category-register-title">
                <header className="cast-config-layer__header">
                    <h3 id="cast-config-category-register-title">카테고리 등록</h3>
                    <button type="button" className="cast-config-icon-button" aria-label="닫기" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="cast-config-layer__body">
                    <p className="cast-config-layer__lead">• 프로그램 정보</p>

                    <dl className="cast-config-form">
                        <dt>카테고리명</dt>
                        <dd>
                            <input
                                type="text"
                                value={name}
                                placeholder="추석명절 설정 정보"
                                onChange={(event) => setName(event.target.value)}
                            />
                        </dd>

                        <dt>카테고리코드</dt>
                        <dd>
                            <input type="text" value={code} placeholder="010" onChange={(event) => setCode(event.target.value)} />
                        </dd>

                        <dt>등록일시</dt>
                        <dd className="cast-config-form__datetime">
                            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                            <PillSelect value={hour} options={HOUR_OPTIONS} unit="시" onChange={setHour} />
                            <PillSelect value={minute} options={MINUTE_OPTIONS} unit="분" onChange={setMinute} />
                        </dd>

                        <dt>등록정보</dt>
                        <dd className="cast-config-form__checks">
                            {sheetNames.map((sheetName) => (
                                <label key={sheetName}>
                                    <input type="checkbox" checked={sheets.includes(sheetName)} onChange={() => toggleSheet(sheetName)} />
                                    {sheetName}
                                </label>
                            ))}
                        </dd>
                    </dl>
                </div>

                <footer className="cast-config-layer__footer">
                    <button type="button" className="cast-config-primary-button" disabled={!canSubmit} onClick={handleSubmit}>
                        {saving ? '저장 중' : '설정저장'}
                    </button>
                    <button type="button" className="cast-config-ghost-button" onClick={onClose}>
                        취소
                    </button>
                </footer>
            </section>
        </div>
    );
}
