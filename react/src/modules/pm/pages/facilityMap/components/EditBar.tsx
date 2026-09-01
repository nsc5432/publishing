interface EditBarProps {
    /** 아직 저장하지 않은 건수 */
    dirtyCount: number;
    /** 1:1 이 깨진 CAST명 개수 — 0 이 아니면 저장을 막는다 */
    duplicateCount: number;
    onRevert: () => void;
    onSave: () => void;
}

/**
 * 표 하단 편집 바.
 *
 * 저장 버튼은 바꾼 게 없어도 자리를 지킨다 — 나타났다 사라지면
 * "이 화면에서 고칠 수 있다"는 사실 자체를 모른 채 지나간다.
 */
export function EditBar({ dirtyCount, duplicateCount, onRevert, onSave }: EditBarProps) {
    const isDirty = dirtyCount > 0;

    return (
        <div className="editbar">
            <p className={`editbar__status${isDirty ? ' is-dirty' : ''}`}>
                {duplicateCount > 0
                    ? `CAST명이 겹칩니다 (${duplicateCount}건) — 한 시설에 하나씩만 매핑 할 수 있습니다`
                    : isDirty
                      ? `저장하지 않은 변경 ${dirtyCount}건`
                      : 'CAST 시뮬레이션명 칸을 눌러 바로 고칠 수 있습니다'}
            </p>

            <div className="editbar__btns">
                <button type="button" className="btn-revert" disabled={!isDirty} onClick={onRevert}>
                    되돌리기
                </button>
                <button type="button" className="btn-save" disabled={!isDirty || duplicateCount > 0} onClick={onSave}>
                    저장{isDirty ? ` (${dirtyCount})` : ''}
                </button>
            </div>
        </div>
    );
}
