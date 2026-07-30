// API 타입 정의
interface JsonReponse {
    error: boolean;
    errorMessage: string;
}

export interface CounterStatus {
    counter: number;
    airline: string;
    status: 'busy' | 'closed' | 'warning' | 'available';
    waitPeople: number;
    waitTime: number;
    processedPeople: number;
}

export interface FacilityStatus {
    island: string;
    waitPeople: number;
    waitTime: number;
    revenue: number;
    status: 'normal' | 'warning' | 'busy';
    // 추가 필드들
    processedPeople?: number; // 처리인원
    processTime?: number; // 처리시간
    totalRevenue?: number; // 총 매출
    commercialCount?: number; // 상업시설 수
    revenuePerPerson?: number; // 인원대비 매출
    peopleChange?: number; // 매출 인원 증감
    changeRate?: number; // 증감률 (%)
    checkInRate?: number; // 체크인카운터 처리율 (%)
    selfCheckInRate?: number; // 셀프체크인 처리율 (%)
    facilityCode?: string; // 시설 코드 (예: T1-3RD-M01-01)
}

export interface TimeSlotData {
    time: string;
    leftCounter: string;
    rightCounter: string;
    leftProcessed: string;
    rightProcessed: string;
    leftWait: string;
    rightWait: string;
    highlight?: boolean;
}

export interface ChartDataPoint {
    time: string;
    processedPeople: number;
    waitingCurrent: number;
    waitingForecast: number;
    waitingPrevWeek: number;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// 에러 타입
export interface ApiError {
    status: number;
    message: string;
    code?: string;
}

// 사용자 정보 타입
export interface UserInfo extends JsonReponse {
    userId: string; // 유저 key
    userNm: string; // 이름
    deptNm: string; // 부서
}
// 그리드 좌표 타입
export type GridCoordinate = string | null | undefined;

// 시설 타입
export type FacilityType = 'commercial' | 'checkin' | 'security' | 'departure' | 'selfcheckin';

// 터미널 타입
export type Terminal = 'T1' | 'T2';

// 그리드 컬럼 상수 (12개)
export const GRID_COLUMNS = [
    'E1',
    'E2',
    'E3',
    'E4',
    'M1',
    'M2',
    'M3',
    'M4',
    'W1',
    'W2',
    'W3',
    'W4',
] as const;

// 그리드 행 상수 (17개)
export const GRID_ROWS = Array.from({ length: 17 }, (_, i) => String(i + 1).padStart(2, '0'));

export interface FcltType {
    cdntLat: string;
    cdntLng: string;
    fcltGroupCd: string;
    fcltNm: string;
    fcltySn: number;
    tmnlId: string;
}

// 상업시설 위치 정보
export interface CommercialFacilityPosition {
    id: string; // 고유 ID (예: "COMM-001")
    name: string; // 시설명 (예: "면세점 A")
    facilityType: FacilityType; // 시설 타입
    latitude: number; // 위도 (실제 지리 좌표)
    longitude: number; // 경도 (실제 지리 좌표)
    posCoord?: GridCoordinate | null; // 시작 좌표 (예: "M2-05") - 위도/경도에서 자동 계산됨
    color: string; // 렌더링 색상 (예: "#9333ea")
    area?: number; // 면적 (그리드 셀 개수)
    revenue?: number; // 매출
    description?: string; // 설명
    castSimulationCode?: string; // CAST시뮬레이션코드
    adjacentFacilityCode?: string; // 여객시설코드 (위치좌표)
    displayMode?: 'circle' | 'rectangle'; // 표시 방식 (원형 또는 사각형, 기본값: circle)
}

// 시설 타입별 색상 매핑
export const FACILITY_TYPE_COLORS: Record<FacilityType, string> = {
    selfcheckin: '#9CA3AF', // 회색 (셀프체크인)
    checkin: '#F59E0B', // 주황색 (체크인카운터)
    security: '#EF4444', // 빨간색 (보안검색대)
    departure: '#10B981', // 초록색 (출국장)
    commercial: '#9333EA', // 보라색 (상업시설)
};

// 시설 타입별 한글 라벨
export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
    selfcheckin: '셀프체크인',
    checkin: '체크인카운터',
    security: '보안검색대',
    departure: '출국장',
    commercial: '상업시설',
};

// 그리드 셀 메타데이터
export interface GridCell {
    coord: GridCoordinate; // 셀 좌표 (예: "M2-05")
    col: number; // 열 인덱스 (0-11)
    row: number; // 행 인덱스 (0-16)
    colLabel: string; // 열 라벨 (E1-W4)
    rowLabel: string; // 행 라벨 (01-17)
    isEmpty: boolean; // 셀이 비어있는지 여부
    facilityId?: string; // 시설 ID (셀을 차지하는 시설)
}

// 좌표 파싱 결과
export interface ParsedCoordinate {
    col: number; // 열 인덱스 (0-11)
    row: number; // 행 인덱스 (0-16)
    colLabel: string; // 열 라벨 (E1-W4)
    rowLabel: string; // 행 라벨 (01-17)
}

export interface SummaryFlight {
    t1FltCnt: number; // T1 운항수
    t1PsgCnt: number; // T1 여객수
    t1BeforeFltCnt: number; // t1 전일 운항수
    t1BeforePsgCnt: number; // t1 전일 여객수
    t2FltCnt: number; // T2 운항수
    t2PsgCnt: number; // T2 여객수
    t2BeforeFltCnt: number; // t2 전일 운항수
    t2BeforePsgCnt: number; // t2 전일 여객수
}

export interface SmltSmry extends JsonReponse {
    smltId: string;
    ymd: string;
    peakTimeT1: string;
    peakTimeT2: string;
    summaryFlight: SummaryFlight;
    xovisT1Datas: SummaryRsltDto[];
    xovisT2Datas: SummaryRsltDto[];
    castT1Datas: SummaryRsltDto[];
    castT2Datas: SummaryRsltDto[];

    chknT1Datas: SmryChknDto[];
    chknT2Datas: SmryChknDto[];
    depT1Datas: SmryDepDto[];
    depT2Datas: SmryDepDto[];
}

export interface SummaryRsltDto {
    time: String; // HHmm
    wtngPsgCnt: number; // 대기인원
    prcsHr: number; // 처리시간
    wtngHr: number; // 대기시간
}

export interface SmryScDto {
    scNum: string;
    cgnStatus: CongestionStatus;
    wtngPsgCnt: number;
    prcsHr: number;
    wtngHr: number;
}

export interface SmryChknDto {
    island: string;
    cgnStatus: CongestionStatus;
    wtngPsgCnt: number;
    prcsHr: number;
    wtngHr: number;
}

export interface SmryChknAlnDto extends SmryChknDto {
    alnCd: string;
    counterNum: number;
}

export interface SmryChknAlnDtoWrapper {
    [key: string]: SmryChknAlnDto[];
}

export interface SmrySlfchknDto extends SmryChknDto {
    type: 'KIOSK' | 'SBD';
    counterNum: number;
}

export interface SmrySlfchknDtoWrapper {
    [key: string]: SmrySlfchknDto[];
}

export interface SmryDepDto {
    depNum: string;
    cgnStatus: CongestionStatus;
    wtngPsgCnt: number;
    prcsHr: number;
    wtngHr: number;
}

export interface SmryDepDtoWrapper {
    [key: string]: SmryDepDto[];
}

export interface SummaryMapDto {
    scList: SmryScDto[];
    depList: SmryDepDto[];
    chknList: SmryChknDto[];
}

export interface SummaryMapDtoWrapper {
    [key: string]: SummaryMapDto;
}

export interface XovisDto {
    time: string;
    wtngPsgCnt: number;
}

export type CongestionType = 'PEAK_PSG' | 'PEAK_CHKN' | 'PEAK_DEP' | 'PEAK_SC';
export type CongestionStatus = 'FREE' | 'NORMAL' | 'BUSY' | 'VERY_BUSY';
