import type { SecurityDraft, SecurityRow } from '../types';

interface SecurityTableProps {
    rows: SecurityRow[];
    /** 체크된 행 id 목록 */
    checked: string[];
    onCheckedChange: (checked: string[]) => void;
    /** 신규 입력 행 */
    draft: SecurityDraft;
    onDraftChange: (draft: SecurityDraft) => void;
    /** 출국장 미선택이거나 비활성 터미널이면 입력을 잠근다 */
    disabled: boolean;
}

/** 자리별 상한 — 시는 23, 분은 59 (원본 script.js 는 둘 다 59 로 잘랐다) */
const MAX: Record<keyof Omit<SecurityDraft, 'count'>, number> = {
    startHour: 23,
    startMin: 59,
    endHour: 23,
    endMin: 59,
};

/** 숫자만 두 자리까지 남긴다 */
const digits = (value: string) => value.replace(/\D/g, '').slice(0, 2);

/** 포커스가 빠질 때 상한으로 자르고 두 자리로 채운다 */
const normalize = (value: string, max: number) =>
    value ? String(Math.min(max, Number(value))).padStart(2, '0') : value;

export function SecurityTable({
    rows,
    checked,
    onCheckedChange,
    draft,
    onDraftChange,
    disabled,
}: SecurityTableProps) {
    const toggle = (id: string) => {
        onCheckedChange(
            checked.includes(id) ? checked.filter((it) => it !== id) : [...checked, id],
        );
    };

    /** 신규 행의 시/분 입력 1칸 */
    const timeInput = (field: keyof typeof MAX, label: string) => (
        <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            aria-label={label}
            value={draft[field]}
            disabled={disabled}
            onChange={(e) => onDraftChange({ ...draft, [field]: digits(e.target.value) })}
            onBlur={() => onDraftChange({ ...draft, [field]: normalize(draft[field], MAX[field]) })}
        />
    );

    return (
        <div className="sec-table scroll-area">
            <table>
                <colgroup>
                    <col className="col-sel" />
                    <col />
                    <col className="col-cnt" />
                </colgroup>
                <thead>
                    <tr>
                        <th scope="col">선택</th>
                        <th scope="col">운영시간</th>
                        <th scope="col">갯수</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="is-new">
                        <td />
                        <td>
                            <div className="time-input">
                                {timeInput('startHour', '시작 시')}
                                <span>시</span>
                                {timeInput('startMin', '시작 분')}
                                <span>분</span>
                                <em>~</em>
                                {timeInput('endHour', '종료 시')}
                                <span>시</span>
                                {timeInput('endMin', '종료 분')}
                                <span>분</span>
                            </div>
                        </td>
                        <td>
                            <div className="count-input">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={2}
                                    aria-label="갯수"
                                    value={draft.count}
                                    disabled={disabled}
                                    onChange={(e) =>
                                        onDraftChange({ ...draft, count: digits(e.target.value) })
                                    }
                                />
                                <span>개</span>
                            </div>
                        </td>
                    </tr>

                    {rows.length === 0 ? (
                        <tr className="is-empty">
                            <td colSpan={3}>
                                {disabled
                                    ? '출국장을 선택하면 보안검색대 운영계획이 표시됩니다.'
                                    : '등록된 운영계획이 없습니다.'}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            aria-label={`${row.startHour}시 행 선택`}
                                            checked={checked.includes(row.id)}
                                            disabled={disabled}
                                            onChange={() => toggle(row.id)}
                                        />
                                        <span className="checkbox__mark" />
                                    </label>
                                </td>
                                <td>
                                    <div className="time-input">
                                        <b>{row.startHour}</b>
                                        <span>시</span>
                                        <b>{row.startMin}</b>
                                        <span>분</span>
                                        <em>~</em>
                                        <b>{row.endHour}</b>
                                        <span>시</span>
                                        <b>{row.endMin}</b>
                                        <span>분</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="count-input">
                                        <b>{row.count}</b>
                                        <span>개</span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
