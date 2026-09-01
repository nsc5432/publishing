import { FCLT_TYPE_LABEL, MAPPING_STATUS_LABEL, type FcltGroup, type FcltMapRow } from '../types';

interface FcltMapTableProps {
    rows: FcltMapRow[];
    groups: FcltGroup[];
    /** 선택된 시설그룹 ('' = 전체) */
    groupCode: string;
    keyword: string;
    /** 선택된 행의 여객시설코드 ('' = 선택 없음) */
    selectedCode: string;
    /** 도면에서 구역을 골라 목록이 좁혀져 있으면 그 사실을 표에도 알린다 */
    markerNote: string;
    /** 아직 저장하지 않은 여객시설코드 */
    dirtyCodes: Set<string>;
    /** 두 시설이 나눠 쓰고 있는 CAST명 — 1:1 이 깨진 값 */
    duplicateNames: Set<string>;
    onGroupChange: (groupCode: string) => void;
    onKeywordChange: (keyword: string) => void;
    onSelect: (row: FcltMapRow) => void;
    onCastChange: (code: string, castName: string) => void;
    onExcel: () => void;
}

const COLUMNS = ['시설그룹', '여객시설코드', '여객시설명', 'CAST 시뮬레이션명', '상태'];

/**
 * 매핑 대조 표.
 *
 * 여객시설(좌) → 시뮬레이션시설(우) 을 한 행에 나란히 둔다. 두 값을 떨어뜨려 놓으면
 * 매핑이 맞는지 보려고 눈이 왔다 갔다 해야 한다.
 *
 * 고칠 수 있는 값은 CAST 시뮬레이션명 한 칸뿐이다. 그 칸은 평소 글자처럼 보이다가
 * 손을 얹으면 입력칸으로 드러난다 — 표를 훑을 때는 조용하고, 고칠 때는 바로 고쳐진다.
 */
export function FcltMapTable({
    rows,
    groups,
    groupCode,
    keyword,
    selectedCode,
    markerNote,
    dirtyCodes,
    duplicateNames,
    onGroupChange,
    onKeywordChange,
    onSelect,
    onCastChange,
    onExcel,
}: FcltMapTableProps) {
    return (
        <section className="list">
            <div className="list__head">
                <div className="chips" role="group" aria-label="시설그룹 선택">
                    <button
                        type="button"
                        className={`chip${groupCode === '' ? ' is-active' : ''}`}
                        aria-pressed={groupCode === ''}
                        onClick={() => onGroupChange('')}
                    >
                        전체
                    </button>
                    {groups.map((group) => (
                        <button
                            key={group.code}
                            type="button"
                            className={`chip${group.code === groupCode ? ' is-active' : ''}`}
                            aria-pressed={group.code === groupCode}
                            // 지금 조건에서 한 건도 없는 그룹은 눌러 봐야 빈 표만 나온다
                            disabled={group.count === 0 && group.code !== groupCode}
                            onClick={() => onGroupChange(group.code)}
                        >
                            {group.name}
                            <em className="chip__count">{group.count}</em>
                        </button>
                    ))}
                </div>

                <div className="list__tools">
                    <label className="blind" htmlFor="fcltKeyword">
                        시설명/코드 검색
                    </label>
                    <input
                        type="search"
                        id="fcltKeyword"
                        className="list__search"
                        placeholder="시설명/코드 검색"
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                    />
                    <button type="button" className="btn-excel" onClick={onExcel}>
                        엑셀저장
                    </button>
                </div>
            </div>

            {markerNote && <p className="list__note">{markerNote}</p>}

            <div className="tbl">
                <div className="tbl__head">
                    {COLUMNS.map((col) => (
                        <div key={col}>{col}</div>
                    ))}
                </div>

                <div className="tbl__body scroll-area">
                    {rows.map((row) => {
                        const isDirty = dirtyCodes.has(row.code);
                        const isDuplicate = !!row.castName && duplicateNames.has(row.castName);

                        return (
                            <div key={row.code} className={`tbl__row${row.code === selectedCode ? ' is-selected' : ''}`} onClick={() => onSelect(row)}>
                                <div className="tbl__group">
                                    <i className={`dot dot--${row.fcltType.toLowerCase()}`} aria-hidden="true" />
                                    <span title={FCLT_TYPE_LABEL[row.fcltType]}>{row.groupName}</span>
                                </div>
                                <div className="tbl__code">{row.code}</div>
                                <div className="tbl__name" title={row.desc}>
                                    {row.name}
                                </div>

                                <div className={`tbl__cast${isDirty ? ' is-dirty' : ''}${isDuplicate ? ' is-duplicate' : ''}`}>
                                    <label className="blind" htmlFor={`cast-${row.code}`}>
                                        {row.name} CAST 시뮬레이션명
                                    </label>
                                    <input
                                        type="text"
                                        id={`cast-${row.code}`}
                                        className="cast-input"
                                        value={row.castName}
                                        placeholder="매핑 없음"
                                        maxLength={100}
                                        title={isDuplicate ? '다른 시설이 이미 쓰고 있는 이름입니다' : undefined}
                                        onChange={(e) => onCastChange(row.code, e.target.value)}
                                        onFocus={() => onSelect(row)}
                                    />
                                    {isDirty && (
                                        <span className="cast-flag" aria-label="저장 전">
                                            ●
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className={`state state--${row.status}`}>{MAPPING_STATUS_LABEL[row.status]}</span>
                                </div>
                            </div>
                        );
                    })}

                    {rows.length === 0 && <p className="tbl__empty">조건에 해당하는 시설이 없습니다.</p>}
                </div>
            </div>
        </section>
    );
}
