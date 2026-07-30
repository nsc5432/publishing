/** 보안검색대 운영계획 1행 */
export interface SecurityRow {
    id: string;
    /** 시작 시각 (시/분, 2자리 문자열) */
    startHour: string;
    startMin: string;
    /** 종료 시각 (시/분, 2자리 문자열) */
    endHour: string;
    endMin: string;
    /** 운영 검색대 갯수 */
    count: number;
}

/** 출국장 1개 (보안검색대 운영계획을 갖는다) */
export interface SecurityGate {
    /** 출국장 번호 */
    no: number;
    rows: SecurityRow[];
}

/** 터미널 1개분 보안검색대 데이터 */
export interface TerminalSecurity {
    gates: SecurityGate[];
    /** 초기 선택 출국장 번호 — 미선택이면 null */
    selectedGate: number | null;
}

/** 신규 행 입력값 (입력 중에는 빈 문자열을 허용하므로 전부 문자열로 둔다) */
export interface SecurityDraft {
    startHour: string;
    startMin: string;
    endHour: string;
    endMin: string;
    count: string;
}
