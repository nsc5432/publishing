/**
 * PM 예측관리 API 타입 정의.
 */

/**
 * 서버가 모든 단건 응답에 함께 실어 보내는 오류 플래그.
 */
export interface JsonResponse {
    error: boolean;
    errorMessage: string;
}

/** 응답 래퍼 (래핑해서 내려주는 API 전용) */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

/** 클라이언트에서 정규화한 에러 (client.ts 응답 인터셉터) */
export interface ApiError {
    status: number;
    message: string;
    code?: string;
}

/** 터미널 구분 */
export type TmnlId = 'T1' | 'T2';

/** 혼잡도 4단계 (여유 / 보통 / 혼잡 / 매우혼잡) */
export type CongestionStatus = 'FREE' | 'NORMAL' | 'BUSY' | 'VERY_BUSY';

/** 시뮬레이션 구분 (일일 / 사용자) */
export type SmltType = 'DAILY' | 'USER';

/** 여객시설 구분 */
export type FcltType = 'CHKN' | 'SLFCHKN' | 'DEP' | 'SC' | 'CMRC';

/** 운영 여부 플래그 (서버 공통 표기) */
export type YnFlag = 'Y' | 'N';

/** 사용자 정보 */
export interface UserInfo extends JsonResponse {
    userId: string; // 유저 key
    userNm: string; // 성명
    deptNm: string; // 부서
}

/* ================= 일일 시뮬레이션 - 요약보기(대시보드) ================= */

/** 조회 조건 기준 정보 — 상단 바(기준일자 / 계산 시각 / 시뮬레이션 버전) */
export interface DsbdBaseInfoDto extends JsonResponse {
    smltId: string; // 조회 기준 시뮬레이션 ID
    ymd: string; // 기준일자 (yyyyMMdd)
    smltType: SmltType; // 화면 우상단 뱃지 (일일 / 사용자)
    lastCalcDt: string; // 마지막 계산 시각 (yyyyMMddHHmmss)
    nextCalcDt: string; // 재계산 예정 시각 (yyyyMMddHHmmss)
    avlTimes: string[]; // 선택 가능한 기준 시각 목록 (HHmm)
}

/** 일일 운항계획 카드 */
export interface FltPlanDto {
    depFltCnt: number; // 출발 운항편
    arrFltCnt: number; // 도착 운항편
    totFltCnt: number; // 총 운항편
    depPsgCnt: number; // 출발 여객
    totPsgCnt: number; // 총 여객
}

/** 시간대별 출발여객 — 막대 1개 (시간 단위) */
export interface HourlyPsgItemDto {
    time: string; // HH
    psgCnt: number; // 출발 여객수 (막대)
    fcstPsgCnt: number; // 예측 여객수 (라인)
}

/** 시간대별 출발여객 — 터미널 1개분 */
export interface HourlyPsgDto {
    tmnlId: TmnlId;
    totPsgCnt: number; // 카드 헤더의 터미널 합계
    maxPsgCnt: number; // Y축 최댓값
    itemList: HourlyPsgItemDto[];
}

/** 요일 속성 카드 */
export interface DowAttrDto {
    dowNm: string; // 예: 주말 전일(금)
    dowType: 'WEEKDAY' | 'WEEKEND' | 'PRE_WEEKEND' | 'HOLIDAY';
    spclNote: string; // 특이점 (예: 공휴일 전일)
}

/** 기상정보 카드 */
export interface WeatherDto {
    wthrCd: string; // 날씨 코드 (아이콘 매핑)
    tmpr: number; // 기온 (℃)
    rainAmt: number; // 강수량 (mm)
    snowAmt: number; // 적설 (mm)
    lowVisStep1Time: string; // 저시정 1단계 (HHmm, 없으면 '')
    lowVisStep2Time: string; // 저시정 2단계 (HHmm, 없으면 '')
}

/** 대시보드 상단 카드 묶음 */
export interface DsbdHeaderDto extends JsonResponse {
    ymd: string; // 기준일자 (yyyyMMdd)
    fltPlan: FltPlanDto;
    hourlyPsgList: HourlyPsgDto[]; // T1 / T2
    dowAttr: DowAttrDto;
    weather: WeatherDto;
}

/** 피크시간 지표 (요약 뷰 하단 3셀과 동일) */
export interface PeakDto {
    ampm: 'AM' | 'PM';
    peakTime: string; // HHmm
    wtngPsgCnt: number; // 총 대기인원 (명)
    maxWtngHr: number; // 최대 대기시간 (분)
    hrlyPrcsPsgCnt: number; // 시간당 처리인원 (명)
}

/** 터미널 패널 요약 */
export interface TmnlSmryDto extends JsonResponse {
    tmnlId: TmnlId;
    fltCnt: number; // 운항편
    fltDiffCnt: number; // 지난주 同요일 대비 운항편 증감
    befFltDiffCnt: number; // 전일 대비 운항편 증감
    psgCnt: number; // 여객
    psgDiffCnt: number; // 지난주 同요일 대비 여객 증감
    befPsgDiffCnt: number; // 전일 대비 여객 증감
    brdgRate: number; // 탑승률 (%)
    peak: PeakDto;
}

/** 퀵 액세스 타일 = 조회 대상 지표 */
export type DsbdCategory = 'PSG' | 'FLT' | 'CHKN' | 'DEP';

/** 시간대별 결과 1행 — 터미널 패널의 차트 / 테이블 뷰 공용 */
export interface DsbdRsltDto {
    time: string; // HHmm
    psgCnt: number; // 여객수
    wtngPsgCnt: number; // 대기인원 (명)
    wtngHr: number; // 대기시간 (분)
    prcsPsgCnt: number; // 처리인원 (명)
    prcsHr: number; // 처리시간 (분)
    prcsRate: number; // 처리율 (%)
    fcstWtngPsgCnt: number; // 예측 대기인원 (차트 점선)
    lastWeekWtngPsgCnt: number; // 지난주 同요일 대기인원 (차트 비교선)
}

/** 게이트 카드의 추천 조치 */
export interface FcltRecommendDto {
    targetNm: string; // 추천 대상 (예: 대한항공 / 보안검색대)
    addCnt: number; // 추가 필요 수량 (개)
    needAssignYn: YnFlag; // Y=배정 필요 / N=소요 표기
}

/** 게이트 카드 하단 칩 1개 (카운터 아일랜드 / 출국장 번호) */
export interface FcltUnitDto {
    unitCd: string; // 칩 라벨 (예: A~N, 1~6)
    cgnStatus: CongestionStatus;
    useYn: YnFlag; // N 이면 미운영(회색) 표기
}

/** 게이트 카드 1장 (캐러셀 한 페이지) */
export interface DsbdFcltCardDto {
    cardId: string;
    fcltType: Extract<FcltType, 'CHKN' | 'DEP'>;
    island: string; // 체크인카운터 아일랜드 (출국장이면 '')
    depNum: string; // 출국장 번호 (체크인카운터면 '')
    fcltNm: string; // 표시명 (예: B / 3번)
    fcltDesc: string; // 부가 표기 (예: 좌측 B4~B8)
    totCnt: number; // 전체 (개)
    oprCnt: number; // 운영 (개)
    wtngPsgCnt: number; // 대기열 / 예상인원 (명)
    hrlyPrcsPsgCnt: number; // 시간당 처리인원 (Pax/Min)
    hrlyPrcsRate: number; // 시간당 처리율 게이지 (0~100)
    cgnClearTime: string; // 혼잡해소 예상 시각 (HHmm)
    cgnClearRate: number; // 혼잡해소 게이지 (0~100)
    cgnStatus: CongestionStatus;
    recommend: FcltRecommendDto;
    unitList: FcltUnitDto[];
}

/* ================= 일일 시뮬레이션 - 맵형태보기 ================= */

/** 헤더 우측 요약 (운항 / 여객) */
export interface MapSmryDto {
    fltCnt: number;
    psgCnt: number;
}

/** 상단 혼잡 알림 항목 */
export interface MapNoticeItemDto {
    fcltNm: string; // 시설명 (예: 체크인카운터)
    fcltCd: string; // 시설 코드 (예: M11)
    boothCnt: number; // 조치 부스 수
}

/** 상단 혼잡 알림 */
export interface MapNoticeDto {
    cgnStatus: CongestionStatus; // 알림 단계
    itemList: MapNoticeItemDto[];
}

/** 운영시간 도넛 카드 (출국장 1곳당 1개) */
export interface MapOperCardDto {
    depNum: string; // 출국장 번호
    oprRate: number; // 도넛 게이지 (0~100)
    oprBgnTime: string; // 운영 시작 (HHmm)
    oprEndTime: string; // 운영 종료 (HHmm)
    oprHr: number; // 하루 운영 시간
    useYn: YnFlag; // N 이면 미운영(흐림) 표기
}

/**
 * 도면 마커 1개 — 좌표는 도면 무대 기준 비율(%).
 * 자리·표시 문구는 하루 내내 그대로다. 시각에 따라 움직이는 혼잡도는 슬롯이 갖는다.
 */
export interface MapMarkerDto {
    markerId: string; // 예: dg3 / M / g14
    label: string; // 표시 문구
    cdntX: number; // 가로 비율 (0~100)
    cdntY: number; // 세로 비율 (0~100)
}

/** 혼잡 현황 지표 4종 — 아일랜드 상세 / 출국장 미니 팝업 공용 */
export interface MapCgnStatDto {
    wtngPsgCnt: number; // 대기인원 (명)
    wtngHr: number; // 대기시간 (초)
    prcsPsgCnt: number; // 처리인원 (명)
    prcsHr: number; // 처리시간 (초)
}

/**
 * 묶음 단위(아일랜드 · 출국장) 1곳의 한 시각 상태.
 * 마커 색과 상세 팝업이 이 한 건을 나눠 쓴다.
 */
export interface MapUnitRsltDto {
    unitCd: string; // 아일랜드 문자(A~N) 또는 출국장 번호(1~6)
    cgnStatus: CongestionStatus;
    stat: MapCgnStatDto;
}

/** 아일랜드는 상세 팝업에 처리율이 더 붙는다 */
export interface MapChknRsltDto extends MapUnitRsltDto {
    prcsRate: number; // 처리율 (%)
}

/** 맵형태보기 30분 슬롯 1칸 */
export interface SmltMapSlotDto {
    hhmm: string; // 슬롯 시각 (HHmm, 30분 단위)
    notice: MapNoticeDto; // 상단 혼잡 알림
    chknRsltList: MapChknRsltDto[]; // 아일랜드 A~N
    depRsltList: MapUnitRsltDto[]; // 출국장 (T1 6 / T2 2)
}

/** 아일랜드 상세 팝업의 매출 */
export interface MapSalesDto {
    totAmt: number; // 총 매출 (원)
    storeCnt: number; // 상업시설 수
    amtPerPsg: number; // 인원대비 매출 (원)
    psgDiffCnt: number; // 매출 인원 증감 (명)
    diffRate: number; // 증감률 (%)
    cmprYear: string; // 비교 기준 (예: 2023)
}

/** 아일랜드 상세 팝업의 시설 목록 항목 — 시각과 무관한 구성이다 */
export interface MapFcltItemDto {
    fcltType: FcltType;
    fcltNm: string;
    prcsRateYn: YnFlag; // N 이면 처리율을 쓰지 않는다 (상업시설)
}

/** 아일랜드 상세 팝업에서 하루 내내 같은 부분 (시설 구성 · 매출) */
export interface MapChknInfoDto {
    island: string; // 아일랜드 (예: M)
    fcltCd: string; // 시설 코드 (예: T1-3RD-M01-01)
    fcltList: MapFcltItemDto[];
    sales: MapSalesDto;
}

/**
 * 맵형태보기 본문 — 하루치를 한 번에 내려준다.
 *
 * 타임라인을 옮기면 화면은 slotList 에서 자리만 바꿔 읽는다 (재조회하지 않는다).
 * 마커 자리 · 운영시간 카드 · 헤더 요약처럼 시각과 무관한 값은 슬롯 밖에 한 벌만 둔다.
 */
export interface SmltMapDto extends JsonResponse {
    smltId: string;
    tmnlId: TmnlId;
    summary: MapSmryDto;
    operCardList: MapOperCardDto[];
    depMarkerList: MapMarkerDto[]; // 출국장 (T1 6 / T2 2)
    chknMarkerList: MapMarkerDto[]; // 아일랜드 A~N
    gateMarkerList: MapMarkerDto[]; // 출입구 게이트 1~14
    chknInfoList: MapChknInfoDto[]; // 아일랜드 상세 팝업 고정 정보
    slotList: SmltMapSlotDto[]; // 00:00~24:00 (30분, 49칸)
}

/* ================= 일일 시뮬레이션 - 출국장 ================= */

/**
 * 출국장 카드 1장 (= 도면 위 출국장 1곳) — 하루 내내 그대로인 부분.
 * 좌표는 마커와 같은 도면 무대 기준 비율(%)이다. 혼잡도·지표는 슬롯이 갖는다.
 */
export interface DepHallGateDto {
    depNum: string; // 출국장 번호 (예: 3)
    depNm: string; // 표시명 (예: 출국장 3)
    cdntX: number; // 카드 자리 — 가로 비율 (0~100)
    cdntY: number; // 카드 자리 — 세로 비율 (0~100)
    boothCnt: number; // 운영 중인 부스 수
    oprBgnTime: string; // 운영 시작 (HHmm)
    oprEndTime: string; // 운영 종료 (HHmm)
    useYn: YnFlag; // N 이면 미운영
}

/** 출국장 화면 30분 슬롯 1칸 */
export interface DepHallSlotDto {
    hhmm: string; // 슬롯 시각 (HHmm, 30분 단위)
    notice: MapNoticeDto; // 상단 혼잡 알림 (출국장만)
    depRsltList: MapUnitRsltDto[]; // 출국장 카드 · 마커 (gateList 와 같은 단위)
    chknRsltList: MapUnitRsltDto[]; // 아일랜드 마커 색만 맞춘다
}

/**
 * 출국장 화면 본문 — 하루치를 한 번에 내려준다.
 *
 * 맵·표 보기는 slotList 에서 한 칸을 읽고, 차트 보기는 슬롯 전체를 훑어 추이를 그린다.
 * 세 보기가 같은 한 건을 나눠 쓰므로 타임라인·보기 전환은 재조회를 부르지 않는다.
 */
export interface DepHallDto extends JsonResponse {
    smltId: string;
    tmnlId: TmnlId;
    gateList: DepHallGateDto[]; // 출국장 카드 (T1 6 / T2 2)
    depMarkerList: MapMarkerDto[]; // 출국장 마커
    chknMarkerList: MapMarkerDto[]; // 아일랜드 마커 A~N
    gateMarkerList: MapMarkerDto[]; // 출입구 게이트 마커
    slotList: DepHallSlotDto[]; // 04:00~24:00 (30분, 41칸)
}

/* ================= 일일 시뮬레이션 - 체크인카운터 ================= */

/**
 * 아일랜드 1곳 — 하루 내내 그대로인 부분(자원 구성 · 운영시간).
 *
 * 셀프체크인/백드롭은 따로 내려주지 않는다. 한 아일랜드가 가진 자원의 종류일 뿐이라
 * 유인 카운터와 같은 자리에 담는다 (화면도 한 메뉴로 합쳐져 있다).
 */
export interface ChknCounterIslandDto {
    island: string; // 아일랜드 문자 (A~N, I 제외)
    fcltNm: string; // 표시명 (예: 아일랜드 A)
    totCnt: number; // 보유 카운터 수 (개)
    counterCnt: number; // 유인 체크인카운터 운영 대수 (개)
    kioskCnt: number; // 셀프체크인 키오스크 대수 (대)
    bagDropCnt: number; // 셀프백드롭 대수 (대)
    alnCdList: string[]; // 배정 항공사 코드
    oprTimeList: OprTimeDto[]; // 운영 시간 구간
    useYn: YnFlag; // N 이면 미운영 (그날 배정이 없다)
}

/**
 * 시간대별 자원 운영 1시간분 — 자원 활용 차트의 막대 1개.
 * 대기인원을 같은 행에 실어 보내므로 차트가 축 두 개를 한 벌의 값으로 그린다.
 */
export interface ChknCounterRsrcDto {
    hour: number; // 0~23
    counterCnt: number; // 그 시간에 열린 유인 카운터 (개)
    kioskCnt: number; // 그 시간에 열린 키오스크 (대)
    bagDropCnt: number; // 그 시간에 열린 셀프백드롭 (대)
    wtngPsgCnt: number; // 대기인원 (명) — 꺾은선
    prcsPsgCnt: number; // 처리인원 (명)
    utilRate: number; // 자원 활용률 (%) = 운영 카운터 / 전체 카운터
}

/** 체크인카운터 화면 30분 슬롯 1칸 */
export interface ChknCounterSlotDto {
    hhmm: string; // 슬롯 시각 (HHmm, 30분 단위)
    notice: MapNoticeDto; // 상단 혼잡 알림 (아일랜드만)
    chknRsltList: MapChknRsltDto[]; // 아일랜드별 그 시각 상태 (islandList 와 같은 단위)
}

/**
 * 체크인카운터 화면 본문 — 하루치를 한 번에 내려준다.
 *
 * 차트 보기는 rsrcList(24시간)를 훑고, 표 보기는 타임라인이 가리키는 슬롯 한 칸을 읽는다.
 * 출국장 화면과 같은 규칙이라 타임라인 · 보기 전환은 재조회를 부르지 않는다.
 */
export interface ChknCounterDto extends JsonResponse {
    smltId: string;
    tmnlId: TmnlId;
    totCnt: number; // 전체 카운터 (개)
    oprIslandCnt: number; // 운영 아일랜드 (개)
    peakCounterCnt: number; // 피크 카운터 (시간대별 운영 카운터의 최댓값)
    totKioskCnt: number; // 키오스크 합계 (대)
    totBagDropCnt: number; // 셀프백드롭 합계 (대)
    waitMaxCnt: number; // 꺾은선 우측 축 최댓값 (명)
    islandList: ChknCounterIslandDto[]; // 아일랜드 (A~N)
    rsrcList: ChknCounterRsrcDto[]; // 시간대별 자원 (24개)
    slotList: ChknCounterSlotDto[]; // 00:00~24:00 (30분, 49칸)
    kpi: SmltKpiDto;
}

/* ================= 사용자 시뮬레이션 ================= */

/** 조건 설정 진입 정보 */
export interface UserSmltInfoDto extends JsonResponse {
    smltId: string; // 편집 대상 사용자 시뮬레이션 ID
    ymd: string; // 기준일자 (yyyyMMdd)
    saveDt: string; // 마지막 저장 시각 (yyyyMMddHHmmss, 없으면 '')
    execStatus: SmltExecStatus | ''; // 직전 수행 상태 (미수행이면 '')
}

/** 운영 시간 구간 (시 단위) */
export interface OprTimeDto {
    bgnHour: number; // 0~24
    endHour: number; // 0~24
}

/* --------- 운항편/여객수 탭 --------- */

/** 막대 1개 (2시간 단위) */
export interface FltPsgChartItemDto {
    time: string; // HH
    cnt: number;
}

/** 막대 차트 1개 (운항편 수 / 여객 수) */
export interface FltPsgChartDto {
    totCnt: number; // 누적 값
    maxCnt: number; // Y축 최댓값
    itemList: FltPsgChartItemDto[];
}

/** 시간대별 수정 1행 */
export interface FltPsgHourDto {
    bgnTime: string; // HHmm
    endTime: string; // HHmm
    adjRate: number; // 수정 비율 (%)
    psgCnt: number; // 승객 수 (명)
}

/** 운항편/여객수 탭 — 터미널 1개분 */
export interface UserSmltFltPsgDto extends JsonResponse {
    tmnlId: TmnlId;
    fltCnt: number; // 요약: 운항편
    psgCnt: number; // 요약: 여객
    peakTime: string; // 요약: 피크 (HHmm)
    adjType: 'RATIO' | 'HOURLY'; // 수정 방식
    adjRate: number; // 전체 비율 (%)
    fltChart: FltPsgChartDto;
    psgChart: FltPsgChartDto;
    hourList: FltPsgHourDto[];
}

/** 운항편/여객수 저장 요청 */
export interface UserSmltFltPsgSaveReq {
    smltId: string;
    tmnlId: TmnlId;
    adjType: 'RATIO' | 'HOURLY';
    adjRate: number; // 전체 비율 (%) — adjType=RATIO 일 때 사용
    hourList: Array<Pick<FltPsgHourDto, 'bgnTime' | 'endTime' | 'adjRate'>>;
}

/* --------- 조회 결과 공용 (체크인 카운터 · 출국장) --------- */

/** 시간대별 대기인원 1점 — 꺾은선 (24개 고정) */
export interface WaitPsgDto {
    hour: number; // 0~23
    waitPsgCnt: number; // 대기인원 (명)
}

/**
 * 패널 헤드 결과 지표 4종.
 * 직전 시뮬레이션 결과에서 만든다. 미수행이면 전부 0 이다.
 */
export interface SmltKpiDto {
    avgWaitMin: number; // 평균대기 (분)
    p95WaitMin: number; // P95대기 (분) — 결과 상세 행 분포의 95백분위 근사
    maxQueuePsgCnt: number; // 최대 큐인원 (명)
    utilRate: number; // 가동률 (%) — 운영 시설·시간 합 / (전체 시설 수 × 24)
}

/* --------- 체크인 카운터 탭 (셀프체크인/백드롭 흡수) --------- */

/** 부스 1석 — 드로어 자원 배정 그리드의 셀 1개 */
export interface ChknBoothDto {
    boothNo: number; // 아일랜드 안의 부스 번호 (1부터)
    alnCd: string; // 배정 항공사 코드 — 미배정이면 ''
    customYn: YnFlag; // Custom 배정 여부 — 원천 미확보라 항상 N
}

/** 아일랜드 1개 = 블럭 차트 항목 1개 */
export interface ChknIslandDto {
    island: string; // 아일랜드 문자 (A~N, I 제외)
    boothCnt: number; // 운영 부스 수 — 블럭 수 = ceil(boothCnt / 4)
    kioskCnt: number; // 셀프체크인 키오스크 대수 (구 6.4)
    bagDropCnt: number; // 셀프백드롭 대수 (구 6.4)
    oprTimeList: OprTimeDto[]; // 아일랜드 운영 시간 구간
    boothList: ChknBoothDto[]; // 부스별 항공사 배정
}

/** 체크인 카운터 탭 — 터미널 1개분 전체 (아일랜드 단위가 아니다) */
export interface UserSmltChknDto extends JsonResponse {
    tmnlId: TmnlId;
    totCnt: number; // 요약: 전체 카운터 수 (보유 대수)
    peakCounterCnt: number; // 요약: 피크 카운터 (시간대별 운영 부스 합의 최댓값)
    totKioskCnt: number; // 하단 셀프 서비스 바 합계
    totBagDropCnt: number; // 하단 셀프 서비스 바 합계
    waitMaxCnt: number; // 꺾은선 우측 축 최댓값
    islandCdList: string[]; // + 추가 에서 고를 수 있는 아일랜드 문자
    alnCdList: string[]; // 드로어 칩의 배정 가능 항공사 코드
    islandList: ChknIslandDto[]; // 배정이 있는 아일랜드만
    waitList: WaitPsgDto[]; // 시간대별 대기인원 (24개)
    kpi: SmltKpiDto;
}

/** 체크인 카운터 저장 요청 — 아일랜드 1개분이 아니라 터미널 1개분 전체 */
export interface UserSmltChknSaveReq {
    smltId: string;
    tmnlId: TmnlId;
    islandList: Array<
        Pick<ChknIslandDto, 'island' | 'oprTimeList' | 'boothList' | 'kioskCnt' | 'bagDropCnt'>
    >;
}

/* --------- 출국장 탭 (보안 검색대 흡수) --------- */

/**
 * 보안검색대 운영계획 1행.
 * 리뉴얼 타임바·블럭 차트가 1시간 단위라 분(bgnMin/endMin)이 사라지고 시(0~24) 정수가 됐다.
 */
export interface ScPlanDto {
    planSn: number; // 행 일련번호 (신규 행은 0)
    bgnHour: number; // 0~24
    endHour: number; // 0~24
    scCnt: number; // 그 구간 검색대 갯수
}

/** 출국장 1개 = 주 블럭 차트 항목 1개 */
export interface UserSmltDepItemDto {
    depNum: string; // 출국장 번호
    depNm: string; // 표시명 (예: 출국장 1)
    oprYn: YnFlag; // N = 미사용 (차트에서 빠지고 미운영 칩으로 내려간다)
    scCnt: number; // 검색대 대수(피크 기준) — 보조 차트 블럭 수 = ceil(scCnt / 4)
    normalCnt: number; // 일반 검색대 대수 — 원천 미확보라 항상 0
    smartPassCnt: number; // 스마트패스 검색대 대수 — 원천 미확보라 항상 0
    oprTimeList: OprTimeDto[]; // 출국장 운영 시간 구간
    planList: ScPlanDto[]; // 보안검색대 운영계획 — 현재는 구간 1개만 내려온다
}

/** 출국장 탭 — 터미널 1개분 */
export interface UserSmltDepDto extends JsonResponse {
    tmnlId: TmnlId;
    peakScCnt: number; // 요약: 피크 검색대 (시간대별 검색대 합의 최댓값)
    waitMaxCnt: number; // 꺾은선 우측 축 최댓값
    depList: UserSmltDepItemDto[];
    waitList: WaitPsgDto[]; // 시간대별 대기인원 (24개)
    kpi: SmltKpiDto;
}

/** 출국장 저장 요청 — 구 saveScPlanInfo 를 흡수한다 */
export interface UserSmltDepSaveReq {
    smltId: string;
    tmnlId: TmnlId;
    depList: Array<
        Pick<
            UserSmltDepItemDto,
            'depNum' | 'oprYn' | 'oprTimeList' | 'normalCnt' | 'smartPassCnt' | 'scCnt' | 'planList'
        >
    >;
}

/* --------- 지도 보기 / 시뮬레이션 실행 --------- */

/** 요약 바의 지도 보기 — 시설 배치 마커 */
export interface UserSmltFcltMapDto extends JsonResponse {
    tmnlId: TmnlId;
    fcltType: FcltType;
    island: string; // 아일랜드 단위 시설이 아니면 ''
    markerList: MapMarkerDto[];
}

/** 시뮬레이션 실행 결과 */
export interface UserSmltExecDto extends JsonResponse {
    smltId: string;
    execSn: number; // 수행 일련번호
    execStatus: SmltExecStatus;
    bgnDt: string; // 시작일시 (yyyyMMddHHmmss)
}

/* ================= 시뮬레이션 모니터링 ================= */

/** 수행 상태 */
export type SmltExecStatus = 'DONE' | 'RUNNING';

/** 상단 KPI 카드 4종 */
export interface SmltExecSmryDto extends JsonResponse {
    totCnt: number; // 전체 수행 (건)
    doneCnt: number; // 완료 (건)
    runningCnt: number; // 진행중 (건)
    avgExecMin: number; // 평균 수행시간 (분)
    avgExecSec: number; // 평균 수행시간 (초)
}

/** 시뮬레이션 이력 1행 */
export interface SmltCastExecDto {
    rowNum: number; // No
    smltId: string;
    smltType: SmltType;
    deptNm: string; // 부서
    userNm: string; // 성명
    bgnDt: string; // 시작일시 (yyyyMMddHHmmss)
    endDt: string; // 종료일시 (yyyyMMddHHmmss, 진행중이면 '')
    execMin: number; // 소요시간 (분)
    execStatus: SmltExecStatus;
}

/** 표준 / 사용자 이력을 한 번에 내려준다 (화면이 좌우로 나란히 보여준다) */
export interface SmltExecListDto extends JsonResponse {
    stdList: SmltCastExecDto[]; // 표준 시뮬레이션
    userList: SmltCastExecDto[]; // 사용자 시뮬레이션
}

/** 이력 1건의 결과 보기 */
export interface SmltExecDetailDto extends JsonResponse {
    smltId: string;
    smltType: SmltType;
    ymd: string; // 시뮬레이션 기준일자 (yyyyMMdd)
    tmnlId: TmnlId;
    deptNm: string;
    userNm: string;
    bgnDt: string;
    endDt: string;
    execMin: number;
    execStatus: SmltExecStatus;
}

/* ================= 시설물 매핑 ================= */

/**
 * 시설물 매핑 1건 — TN_PM_SMLT_PSG_FCLT 한 행.
 *
 * 공항 여객시설(psgFcltCd/psgFcltNm)과 CAST 시뮬레이션 시설(smltFcltNm)의 대응이
 * 이 화면이 확인하려는 대상이다. smltFcltNm 이 비어 있으면 미매핑이다.
 */
export interface FcltMapItemDto {
    psgFcltCd: string; // 여객시설코드 (PK)
    upPsgFcltCd: string; // 상위여객시설코드 (시설그룹)
    upPsgFcltNm: string; // 상위여객시설명 (그룹 표시명)
    psgFcltNm: string; // 여객시설명
    psgFcltExpln: string; // 여객시설설명
    smltFcltNm: string; // 시뮬레이션시설명 (CAST) — '' 이면 미매핑
    tmnlId: TmnlId;
    fcltType: FcltType; // 도면 마커 색 / 범례 구분
    island: string; // 아일랜드(A~N) · 출국장번호 — 도면 마커 연결용, 없으면 ''
    sortSeq: number;
    useYn: YnFlag;
    lastMdfrId: string; // 최종수정자
    lastMdfcnDt: string; // 최종수정일시 (yyyyMMddHHmmss)
}

/** 시설물 매핑 목록 (터미널 단위 전량) */
export interface FcltMapListDto extends JsonResponse {
    tmnlId: TmnlId;
    itemList: FcltMapItemDto[];
    markerList: MapMarkerDto[]; // 도면 마커 (아일랜드 / 출국장 단위)
}

/** 시설물 매핑 저장 항목 — 바뀐 시설만 보낸다 (저장 응답은 공통 JsonResponse) */
export interface FcltMapSaveItemDto {
    psgFcltCd: string; // 여객시설코드 (PK)
    smltFcltNm: string; // 새 시뮬레이션시설명 ('' = 매핑 해제)
}
