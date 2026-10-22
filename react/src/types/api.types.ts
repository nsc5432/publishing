export interface JsonResponse {
    error: boolean;
    errorMessage: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ApiError {
    status: number;
    message: string;
    code?: string;
}

export type TmnlId = 'T1' | 'T2';

export type CongestionStatus = 'FREE' | 'NORMAL' | 'BUSY' | 'VERY_BUSY';

export type SmltType = 'DAILY' | 'USER';

export type FcltType = 'CHKN' | 'SLFCHKN' | 'DEP' | 'SC' | 'CMRC';

export type YnFlag = 'Y' | 'N';

export interface UserInfo extends JsonResponse {
    userId: string;
    userNm: string;
    deptNm: string;
    roleIdList: string[];
}

/* ================= 일일 시뮬레이션 - 요약보기(대시보드) ================= */

export interface DsbdBaseInfoDto extends JsonResponse {
    smltId: string;
    ymd: string;
    smltType: SmltType;
    lastCalcDt: string;
    nextCalcDt: string;
    avlTimes: string[];
}

export interface FltPlanDto {
    depFltCnt: number;
    arrFltCnt: number;
    totFltCnt: number;
    depPsgCnt: number;
    totPsgCnt: number;
}

export interface HourlyPsgItemDto {
    time: string;
    psgCnt: number;
    fcstPsgCnt: number;
}

export interface HourlyPsgDto {
    tmnlId: TmnlId;
    totPsgCnt: number;
    maxPsgCnt: number;
    itemList: HourlyPsgItemDto[];
}

export interface DowAttrDto {
    dowNm: string;
    dowType: 'WEEKDAY' | 'WEEKEND' | 'PRE_WEEKEND' | 'HOLIDAY';
    spclNote: string;
}

export interface WeatherDto {
    wthrCn: string;
    maxTp: number;
    minTp: number;
    hmdtVl: number;
    wsVl: number;
    rwyAtm: number;
}

export interface DsbdHeaderDto extends JsonResponse {
    ymd: string;
    fltPlan: FltPlanDto;
    hourlyPsgList: HourlyPsgDto[];
    dowAttr: DowAttrDto;
    weather: WeatherDto;
}

export interface PeakDto {
    ampm: 'AM' | 'PM';
    peakTime: string;
    wtngPsgCnt: number;
    maxWtngHr: number;
    hrlyPrcsPsgCnt: number;
}

export interface TmnlSmryDto extends JsonResponse {
    tmnlId: TmnlId;
    fltCnt: number;
    fltDiffCnt: number;
    yesterdayFltDiffCnt: number;
    psgCnt: number;
    psgDiffCnt: number;
    yesterdayPsgDiffCnt: number;
    brdgRate: number;
    cgnStatus: CongestionStatus;
    intrvlMin: number;
    intrvlFltCnt: number;
    intrvlPsgCnt: number;
    intrvlYesterdayFltDiffCnt: number;
    intrvlYesterdayPsgDiffCnt: number;
    peak: PeakDto;
}

export type DsbdCategory = 'PSG' | 'FLT' | 'CHKN' | 'DEP';

export interface DsbdRsltDto {
    time: string;
    psgCnt: number;
    wtngPsgCnt: number | null;
    wtngHr: number;
    prcsPsgCnt: number;
    prcsHr: number;
    prcsRate: number;
    fcstWtngPsgCnt: number;
    lastWeekWtngPsgCnt: number;
}

export interface FcltRecommendDto {
    targetNm: string;
    reqCnt: number | null;
    needAssignYn: YnFlag;
}

export interface FcltUnitDto {
    unitCd: string;
    cgnStatus: CongestionStatus;
    useYn: YnFlag;
}

export interface DsbdFcltCardDto {
    cardId: string;
    fcltType: Extract<FcltType, 'CHKN' | 'DEP'>;
    island: string;
    dptgtNo: string;
    fcltNm: string;
    totCnt: number;
    oprCnt: number;
    wtngPsgCnt: number;
    hrlyPrcsPsgCnt: number;
    hrlyPrcsRate: number;
    cgnClearTime: string;
    cgnClearRate: number;
    cgnStatus: CongestionStatus;
    recommend: FcltRecommendDto;
    unitList: FcltUnitDto[];
}

export type FcltQueueScenarioMode = 'COUNT' | 'TIME';

export type QueueMetricStatus = 'CALCULATED' | 'ESTIMATED' | 'UNAVAILABLE' | 'UNREACHABLE';

export type QueueCalcMethod =
    | 'DIRECT'
    | 'EXTERNAL_INPUT'
    | 'SERVICE_TIME'
    | 'LITTLE_LAW'
    | 'SERVICE_CAPACITY'
    | 'FLOW_BALANCE'
    | 'OBSERVED_FLOW'
    | 'QUEUE_BALANCE'
    | 'ERLANG_C'
    | 'NEXT_ARRIVAL_WAIT';

export type QueueDataSrc = 'CAST' | 'XOVIS';

export interface QueueMetricDto {
    status: QueueMetricStatus;
    method: QueueCalcMethod;
    reason: string;
}

export interface FcltQueueScenarioReq {
    smltId: string;
    ymd: string;
    hhmm: string;
    tmnlId: TmnlId;
    fcltType: Extract<FcltType, 'CHKN' | 'DEP'>;
    unitCd: string;
    mode: FcltQueueScenarioMode;
    oprFcltCnt?: number;
    targetMinutes?: number;
}

export interface FcltQueueClearDto {
    fcltCnt: number | null;
    cgnClearMin: number | null;
    cgnClearDt: string;
    clearMetric: QueueMetricDto;
    nextWtngSec: number | null;
    nextWtngMetric: QueueMetricDto;
    wtngProb: number | null;
    loadRatio: number | null;
    thryWtngSec: number | null;
    thryWtngPsgCnt: number | null;
    erlangMetric: QueueMetricDto;
}

export interface FcltQueueRecommendDto {
    targetMin: number;
    reqCnt: number | null;
    extraCnt: number | null;
    reduceCnt: number | null;
    fluidReqCnt: number | null;
    stableMinCnt: number | null;
    stableAplyYn: YnFlag | null;
    capaAvlYn: YnFlag | null;
    goalMetYn: YnFlag | null;
    reqMetric: QueueMetricDto;
}

export interface FcltQueueScenarioDto extends JsonResponse {
    tmnlId: TmnlId;
    fcltType: Extract<FcltType, 'CHKN' | 'DEP'>;
    unitCd: string;
    fcltNm: string;
    mode: FcltQueueScenarioMode;
    baseDt: string;
    obsBgnDt: string;
    obsEndDt: string;
    dataSrc: QueueDataSrc;
    wtngPsgCnt: number | null;
    targetQueueCnt: number;
    oprFcltCnt: number | null;
    totCnt: number | null;
    totCntRsn: string;
    arvlRate: number | null;
    srvcRate: number | null;
    arvlMetric: QueueMetricDto;
    srvcMetric: QueueMetricDto;
    dfltTargetMin: number;
    minTargetMin: number;
    maxTargetMin: number;
    asmpList: string[];
    current: FcltQueueClearDto;
    scenario: FcltQueueClearDto | null;
    totScenario: FcltQueueClearDto | null;
    recommend: FcltQueueRecommendDto | null;
}

/* ================= 일일 시뮬레이션 - 맵형태보기 ================= */

export interface MapSmryDto {
    fltCnt: number;
    psgCnt: number;
}

export interface MapNoticeItemDto {
    fcltNm: string;
    fcltCd: string;
    boothCnt: number;
    reqCnt: number | null;
    cgnClearMin: number | null;
}

export interface MapNoticeDto {
    cgnStatus: CongestionStatus;
    itemList: MapNoticeItemDto[];
}

export interface MapOperCardDto {
    dptgtNo: string;
    oprRate: number;
    oprBgnTime: string;
    oprEndTime: string;
    oprHr: number;
    useYn: YnFlag;
}

export interface MapMarkerDto {
    markerId: string;
    label: string;
    cdntX: number;
    cdntY: number;
}

export interface MapCgnStatDto {
    wtngPsgCnt: number;
    wtngHr: number;
    prcsPsgCnt: number;
    prcsHr: number;
}

export interface MapUnitRsltDto {
    unitCd: string;
    cgnStatus: CongestionStatus;
    stat: MapCgnStatDto;
}

export interface MapChknRsltDto extends MapUnitRsltDto {
    prcsRate: number;
    avgQueuePsgCnt: number;
    maxQueuePsgCnt: number;
    oprBoothCnt: number;
    reqCnt: number | null;
    cgnClearMin: number | null;
}

export interface SmltMapSlotDto {
    hhmm: string;
    notice: MapNoticeDto;
    chknRsltList: MapChknRsltDto[];
    dptgtRsltList: MapUnitRsltDto[];
}

export interface MapSalesDto {
    totAmt: number;
    storeCnt: number;
    amtPerPsg: number;
    psgDiffCnt: number;
    diffRate: number;
    cmprYear: string;
}

export interface MapFcltItemDto {
    fcltType: FcltType;
    fcltNm: string;
    prcsRateYn: YnFlag;
}

export interface MapChknInfoDto {
    island: string;
    fcltCd: string;
    fcltList: MapFcltItemDto[];
    sales: MapSalesDto | null;
}

export interface SmltMapDto extends JsonResponse {
    smltId: string;
    tmnlId: TmnlId;
    summary: MapSmryDto;
    operCardList: MapOperCardDto[];
    dptgtMarkerList: MapMarkerDto[];
    chknMarkerList: MapMarkerDto[];
    gateMarkerList: MapMarkerDto[];
    chknInfoList: MapChknInfoDto[];
    slotList: SmltMapSlotDto[];
}

/* ================= 일일 시뮬레이션 - 출국장 ================= */

export interface DepHallGateDto {
    dptgtNo: string;
    dptgtNm: string;
    cdntX: number;
    cdntY: number;
    boothCnt: number;
    oprBgnTime: string;
    oprEndTime: string;
    useYn: YnFlag;
}

export interface DepHallSlotDto {
    hhmm: string;
    notice: MapNoticeDto;
    dptgtRsltList: MapUnitRsltDto[];
    chknRsltList: MapUnitRsltDto[];
}

export interface DepHallDto extends JsonResponse {
    smltId: string;
    tmnlId: TmnlId;
    gateList: DepHallGateDto[];
    dptgtMarkerList: MapMarkerDto[];
    chknMarkerList: MapMarkerDto[];
    gateMarkerList: MapMarkerDto[];
    slotList: DepHallSlotDto[];
}

/* ================= 일일 시뮬레이션 - 체크인카운터 ================= */

export interface ChknCounterIslandDto {
    island: string;
    fcltNm: string;
    totCnt: number;
    counterCnt: number;
    kioskCnt: number;
    bagDropCnt: number;
    alnCdList: string[];
    oprTimeList: OprTimeDto[];
    useYn: YnFlag;
}

export interface ChknCounterRsrcDto {
    hour: number;
    counterCnt: number;
    kioskCnt: number;
    bagDropCnt: number;
    wtngPsgCnt: number;
    prcsPsgCnt: number;
    utilRate: number;
}

export interface ChknCounterSlotDto {
    hhmm: string;
    notice: MapNoticeDto;
    chknRsltList: MapChknRsltDto[];
}

export interface ChknCounterDto extends JsonResponse {
    smltId: string;
    tmnlId: TmnlId;
    totCnt: number;
    oprIslandCnt: number;
    peakCounterCnt: number;
    totKioskCnt: number;
    totBagDropCnt: number;
    waitMaxCnt: number;
    islandList: ChknCounterIslandDto[];
    rsrcList: ChknCounterRsrcDto[];
    slotList: ChknCounterSlotDto[];
    kpi: SmltKpiDto;
}

/* ================= 사용자 시뮬레이션 ================= */

export interface UserSmltInfoDto extends JsonResponse {
    ymd: string;
    saveDt: string;
    smltFlfmtSttsCd: SmltExecStatus | '';
}

export interface OprTimeDto {
    operBgngHour: number;
    operEndHour: number;
}

/* --------- 운항편/여객수 탭 --------- */

export interface FltPsgChartItemDto {
    time: string;
    cnt: number;
}

export interface FltPsgChartDto {
    totCnt: number;
    maxCnt: number;
    itemList: FltPsgChartItemDto[];
}

export interface FltPsgHourDto {
    bgnTime: string;
    endTime: string;
    psgCnt: number;
}

export interface UserSmltFltPsgDto extends JsonResponse {
    tmnlId: TmnlId;
    fltCnt: number;
    psgCnt: number;
    peakTime: string;
    ajmtRt: number;
    fltChart: FltPsgChartDto;
    psgChart: FltPsgChartDto;
    hourList: FltPsgHourDto[];
}

export interface UserSmltFltPsgSaveReq {
    ymd: string;
    tmnlId: TmnlId;
    ajmtRt: number;
}

/* --------- 조회 결과 공용 (체크인 카운터 / 출국장) --------- */

export interface WaitPsgDto {
    hour: number;
    waitPsgCnt: number;
}

export interface SmltKpiDto {
    avgWaitMin: number;
    p95WaitMin: number;
    maxQueuePsgCnt: number;
    utilRate: number;
}

/* --------- 체크인 카운터 탭 (셀프체크인/백드롭 흡수) --------- */

export interface ChknBoothDto {
    boothNo: number;
    alnCd: string;
    cstmAltmntYn: YnFlag;
}

export interface ChknIslandDto {
    island: string;
    boothCnt: number;
    kioskCnt: number;
    bagDropCnt: number;
    oprTimeList: OprTimeDto[];
    boothList: ChknBoothDto[];
}

export interface UserSmltChknDto extends JsonResponse {
    tmnlId: TmnlId;
    totCnt: number;
    peakCounterCnt: number;
    totKioskCnt: number;
    totBagDropCnt: number;
    waitMaxCnt: number;
    islandCdList: string[];
    alnCdList: string[];
    islandList: ChknIslandDto[];
    waitList: WaitPsgDto[];
    kpi: SmltKpiDto;
}

export interface UserSmltChknSaveReq {
    ymd: string;
    tmnlId: TmnlId;
    islandList: Array<Pick<ChknIslandDto, 'island' | 'oprTimeList' | 'boothList' | 'kioskCnt' | 'bagDropCnt'>>;
}

/* --------- 출국장 탭 (보안 검색대 흡수) --------- */

export interface UserSmltDepItemDto {
    dptgtNo: string;
    dptgtNm: string;
    oprYn: YnFlag;
    scshCntom: number;
    gnrlSrchCntom: number;
    smartPassSrchCntom: number;
    oprTimeList: OprTimeDto[];
}

export interface UserSmltDepDto extends JsonResponse {
    tmnlId: TmnlId;
    peakScshCntom: number;
    waitMaxCnt: number;
    dptgtList: UserSmltDepItemDto[];
    waitList: WaitPsgDto[];
    kpi: SmltKpiDto;
}

export interface UserSmltDepSaveReq {
    ymd: string;
    tmnlId: TmnlId;
    dptgtList: Array<Pick<UserSmltDepItemDto, 'dptgtNo' | 'oprYn' | 'oprTimeList' | 'gnrlSrchCntom' | 'smartPassSrchCntom' | 'scshCntom'>>;
}

/* --------- 지도 보기 / 시뮬레이션 실행 --------- */

export interface UserSmltFcltMapDto extends JsonResponse {
    tmnlId: TmnlId;
    fcltType: FcltType;
    island: string;
    markerList: MapMarkerDto[];
}

export interface UserSmltQuery {
    ymd: string;
    smltId?: string;
}

export interface UserSmltExecReq {
    ymd: string;
    fltPsgList: UserSmltFltPsgSaveReq[];
    chknList: UserSmltChknSaveReq[];
    depList: UserSmltDepSaveReq[];
}

export interface UserSmltExecDto extends JsonResponse {
    smltId: string;
    smltReqId: string;
    smltFlfmtSttsCd: SmltExecStatus;
    smltFlfmtBgngDt: string;
}

/* ================= 시뮬레이션 모니터링 ================= */

export type SmltExecStatus = 'WAITING' | 'DONE' | 'RUNNING' | 'FAILED';

export interface SmltExecSmryDto extends JsonResponse {
    totCnt: number;
    doneCnt: number;
    runningCnt: number;
    avgExecMin: number;
    avgExecSec: number;
}

export interface SmltCastExecDto {
    rowNum: number;
    smltId: string;
    smltType: SmltType;
    rgtrId: string;
    deptNm: string;
    userNm: string;
    smltFlfmtBgngDt: string;
    smltFlfmtEndDt: string;
    execMin: number;
    smltFlfmtSttsCd: SmltExecStatus;
}

export interface SmltExecListDto extends JsonResponse {
    stdList: SmltCastExecDto[];
    userList: SmltCastExecDto[];
}

export interface SmltExecDetailDto extends JsonResponse {
    smltId: string;
    smltType: SmltType;
    ymd: string;
    tmnlId: TmnlId;
    deptNm: string;
    userNm: string;
    smltFlfmtBgngDt: string;
    smltFlfmtEndDt: string;
    execMin: number;
    smltFlfmtSttsCd: SmltExecStatus;
}

/* ================= 시설물 매핑 ================= */

export interface FcltMapItemDto {
    psgFcltCd: string;
    upPsgFcltCd: string;
    upPsgFcltNm: string;
    psgFcltNm: string;
    psgFcltExpln: string;
    smltFcltNm: string;
    tmnlId: TmnlId;
    fcltType: FcltType;
    island: string;
    sortSeq: number;
    useYn: YnFlag;
    lastMdfrId: string;
    lastMdfcnDt: string;
}

export interface FcltMapListDto extends JsonResponse {
    tmnlId: TmnlId;
    itemList: FcltMapItemDto[];
    markerList: MapMarkerDto[];
}

export interface FcltMapSaveItemDto {
    psgFcltCd: string;
    smltFcltNm: string;
}

/* ================= Cast 설정 ================= */

export interface CastConfigGroupListDto extends JsonResponse {
    tmnlId: TmnlId;
    groupList: CastConfigGroupDto[];
}

export interface CastConfigGroupDto {
    groupId: string;
    groupNm: string;
    groupNmEn: string;
    groupDesc: string;
    datasetList: CastConfigDatasetSummaryDto[];
}

export interface CastConfigDatasetSummaryDto {
    sheetNm: string;
    rowCnt: number;
}

export type CastConfigColumnType = 'TEXT' | 'NUMBER' | 'SELECT' | 'TIME' | 'READONLY';

export type CastConfigValidationKind = 'SUM' | 'CUMULATIVE';

export interface CastConfigCategoryDto {
    fixAtrbGroupId: string;
    atrbGroupNm: string;
    baseYn: YnFlag;
    prePrcsYn: YnFlag;
    cfmtnYn: YnFlag;
    groupPrcsSttsCd: string;
    frstRegDt: string;
    lastMdfcnDt: string;
}

export interface CastConfigCategoryListDto extends JsonResponse {
    totalCnt: number;
    categoryList: CastConfigCategoryDto[];
}

export interface CastConfigCategorySaveDto {
    fixAtrbGroupId: string;
    atrbGroupNm: string;
    frstRegDt: string;
    sheetNmList: string[];
}

export interface CastConfigCategoryCloneDto {
    srcFixAtrbGroupId: string;
    atrbGroupNm: string;
}

export interface CastConfigCategoryCloneResultDto extends JsonResponse {
    fixAtrbGroupId: string;
}

export interface CastConfigOptionDto {
    code: string;
    label: string;
    shapeColumnList: string[];
}

export interface CastConfigColumnDto {
    column: string;
    label: string;
    type: CastConfigColumnType;
    optionList: CastConfigOptionDto[];
    mergeYn: YnFlag;
}

export interface CastConfigValidationDto {
    kind: CastConfigValidationKind;
    column: string;
    groupColumn: string;
    target: number;
}

export interface CastConfigDatasetDto extends JsonResponse {
    sheetNm: string;
    dimension: string;
    columnList: CastConfigColumnDto[];
    rowList: CastConfigGridRowDto[];
    shapeColumn: string;
    validation: CastConfigValidationDto | null;
}

export interface CastConfigGridRowDto {
    rowNo: number;
    atrbCd: string;
    cellList: CastConfigGridCellDto[];
}

export interface CastConfigGridCellDto {
    column: string;
    value: string;
    formula: string;
    editableYn: YnFlag;
}

export interface CastConfigSaveItemDto {
    fixAtrbGroupId: string;
    sheetNm: string;
    rowNo: number;
    column: string;
    value: string;
}

export interface CastConfigSetSaveItemDto {
    tmnlId: TmnlId;
    groupId: string;
    sheetNm: string;
    rowNo: number;
    column: string;
    value: string;
}

export interface CastConfigSetDatasetDto {
    tmnlId: TmnlId | '';
    groupId: string;
    groupNm: string;
    dataset: CastConfigDatasetDto;
}

export interface CastConfigSetDto extends JsonResponse {
    fixAtrbGroupId: string;
    datasetList: CastConfigSetDatasetDto[];
}

export interface CastConfigAplyHstryDto {
    aplySn: number;
    srcFixAtrbGroupId: string;
    tgtFixAtrbGroupId: string;
    tmnlId: string;
    tblNm: string;
    sheetNm: string;
    aplyRowCnt: number;
    cnclYn: YnFlag;
    revertableYn: YnFlag;
    frstRegDt: string;
    frstRgtrId: string;
}

export interface CastConfigAplyHstryListDto extends JsonResponse {
    totalCnt: number;
    hstryList: CastConfigAplyHstryDto[];
}

export interface CastConfigAplySetDetailDto {
    aplySn: number;
    tmnlId: string;
    sheetNm: string;
    aplyRowCnt: number;
}

export interface CastConfigAplySetHstryDto {
    aplySetSn: number;
    srcFixAtrbGroupId: string;
    tgtFixAtrbGroupId: string;
    aplyRowCnt: number;
    cnclYn: YnFlag;
    revertableYn: YnFlag;
    frstRegDt: string;
    frstRgtrId: string;
    detailList: CastConfigAplySetDetailDto[];
}

export interface CastConfigAplySetHstryListDto extends JsonResponse {
    totalCnt: number;
    hstryList: CastConfigAplySetHstryDto[];
}
