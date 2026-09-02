# step5 설정 파일: 카테고리 코드 목록 및 DB 저장 태스크 정의

#  전체 카테고리 참조 (PSG_ATRB_CD -> 설명)
PSG_ATRB_CATEGORIES = {
    "01010000": "Passport_PassportIndividualInternational",
    "02010000": "CATLocation_PassportIndividualInternational",
    "02020000": "CATLocation_PassportIndividualDomestic",
    "03010000": "TravelClass_FSC",
    "03020000": "TravelClass_LCC",
    "04010000": "Bags_DepartingInternationalPassengers",
    "04020000": "Bags_DepartingDomesticPassengers",
    "04030000": "Bags_CAT",
    "04040000": "Bags_ArrivingPassengers",
    "05010000": "EntryTime_Before10am",
    "05020000": "EntryTime_10amto11am",
    "05030000": "EntryTime_11amto12pm",
    "05040000": "EntryTime_12pmto1pm",
    "05050000": "EntryTime_After1pm",
    "06010000": "EP_Int",
    "06020000": "EP_Dom",
    "07010000": "SecurityType",
    "08010000": "EmigrationType_KoreanPassengers",
    "08020000": "EmigrationType_ForeignPassengers",
    "09010000": "CustomsType_ArrivingPassengers",
    "10010000": "TransferDeskAvailable_Airlines",
    "11010000": "Transfer_CKIN",
    "12010000": "ConnectionLoc_T1Arrivals",
    "12020000": "ConnectionLoc_ConcourseArrivals",
    "12030000": "ConnectionLoc_T2Arrivals",
    "13010000": "CheckInReportingTime_STDBefore10am",
    "13020000": "CheckInReportingTime_STDAfter10am",
    "14100000": "GateReportingTime_International",
    "14200000": "GateReportingTime_Domestic",
    "15010000": "SecurityReportingTime_Before10am",
    "15020000": "SecurityReportingTime_10amto11am",
    "15030000": "SecurityReportingTime_11amto12pm",
    "15040000": "SecurityReportingTime_12pmto1pm",
    "15050000": "SecurityReportingTime_After1pm",
    "15060000": "SecurityReportingTime_Domestic",
    "16010000": "Security_HandBagRed",
    "17010000": "DistributionfromCKINtoDG_T1_A",
    "17020000": "DistributionfromCKINtoDG_T1_B",
    "17030000": "DistributionfromCKINtoDG_T1_C",
    "17040000": "DistributionfromCKINtoDG_T1_D",
    "17050000": "DistributionfromCKINtoDG_T1_E",
    "17060000": "DistributionfromCKINtoDG_T1_F",
    "17070000": "DistributionfromCKINtoDG_T1_G",
    "17080000": "DistributionfromCKINtoDG_T1_H",
    "17090000": "DistributionfromCKINtoDG_T1_J",
    "17100000": "DistributionfromCKINtoDG_T1_K",
    "17110000": "DistributionfromCKINtoDG_T1_L",
    "17120000": "DistributionfromCKINtoDG_T1_M",
    "17130000": "DistributionfromCKINtoDG_T1_N",
    "17140000": "DistributionfromCKINtoDG_T1_CAT",
    "17150000": "DistributionfromCKINtoDG_T1_ONLINE",
    "17160000": "DistributionfromCKINtoDG_T2_A",
    "17170000": "DistributionfromCKINtoDG_T2_B",
    "17180000": "DistributionfromCKINtoDG_T2_C",
    "17190000": "DistributionfromCKINtoDG_T2_D",
    "17200000": "DistributionfromCKINtoDG_T2_E",
    "17210000": "DistributionfromCKINtoDG_T2_F",
    "17220000": "DistributionfromCKINtoDG_T2_G",
    "17230000": "DistributionfromCKINtoDG_T2_H",
    "17240000": "DistributionfromCKINtoDG_T2_J",
    "17250000": "DistributionfromCKINtoDG_T2_K",
    "17260000": "DistributionfromCKINtoDG_T2_L",
    "17270000": "DistributionfromCKINtoDG_T2_M",
    "17280000": "DistributionfromCKINtoDG_T2_N",
    "17290000": "DistributionfromCKINtoDG_T2_CAT",
    "17300000": "DistributionfromCKINtoDG_T2_ONLINE",
    "18010000": "EmigrationType_KoreanPassengers",
    "18020000": "EmigrationType_ForeignPassengers",
    "19010000": "SideDoor_CAT",
    "19020000": "SideDoor_NoCAT",
    "20010000": "FacialRecognition",
}

PSG_ATRB_TABLE = "PMOWN.TN_PM_SMLT_PSG_ATRB"
SHOW_UP_TABLE = "PMOWN.TN_PM_SMLT_SHOW_UP_ATRB"
CKIN_TYPE_TABLE = "PMOWN.TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC"

PRE_PRCS_GROUP_ID = "999"
PRE_PRCS_GROUPS = [PRE_PRCS_GROUP_ID]

#  출국장이용분포(dep-usage) 아일랜드 -> 코드 매핑
DEP_USAGE_BASE_CODE = "17010000"   # T1: A=17010000, Z=17140000
DEP_USAGE_T2_BASE_CODE = "17160000"  # T2: A=17160000, Z=17290000
ISLAND_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "Z"]

#  체크포인트(분)
CHECKPOINTS_ENTRY = [270, 210, 180, 150, 120, 90, 60, 40]   # 발생시각 / 보안 리포팅 공통
CHECKPOINTS_SECURITY = [270, 210, 180, 150, 120, 90, 60, 40]
CHECKPOINTS_CHECKIN = [300, 240, 180, 150, 120, 90, 60, 30]
CHECKPOINTS_GATE = [60, 45, 30, 20, 10]

# PERIOD ↔ STD 시간대 코드
GEN_CODES = {"P1": "05010000", "P2": "05020000", "P3": "05030000", "P4": "05040000", "P5": "05050000"}
SECURITY_CODES = {"P1": "15010000", "P2": "15020000", "P3": "15030000", "P4": "15040000", "P5": "15050000"}
PERIODS = ["P1", "P2", "P3", "P4", "P5"]


#  태스크 빌더
def _cumulative_per_period(read_tmpl: str, code_map: dict, checkpoints: list[int]) -> list[dict]:
    """터미널 x PERIOD별 단일 코드 누적 태스크 (gen / dg 공통)."""
    tasks = []
    for suffix, gid in [("t1", PRE_PRCS_GROUP_ID), ("t2", PRE_PRCS_GROUP_ID)]:
        for period in PERIODS:
            code = code_map[period]
            tasks.append({
                "description": f"{PSG_ATRB_CATEGORIES[code]} ({suffix})",
                "name": f"{code}-{suffix}",
                "read_file": read_tmpl.format(t=suffix),
                "filter": {"PERIOD": period},
                "table": SHOW_UP_TABLE,
                "transform": "cumulative_percent",
                "psg_atrb_cd": code,
                "fix_group_ids": [gid],
                "checkpoints": checkpoints,
            })
    return tasks


def _checkin_reporting_tasks() -> list[dict]:
    """체크인 리포팅: P1 -> 13010000(STD < 1000), P2~P5 평균 -> 13020000(STD >= 1000)."""
    tasks = []
    for suffix, gid in [("t1", PRE_PRCS_GROUP_ID), ("t2", PRE_PRCS_GROUP_ID)]:
        tasks.append({
            "description": f"CheckInReportingTime_STDBefore10am ({suffix})",
            "name": f"13010000-{suffix}",
            "read_file": f"step4-ck-{suffix}-rate.csv",
            "filter": {"PERIOD": "P1"},
            "table": SHOW_UP_TABLE,
            "transform": "cumulative_percent",
            "psg_atrb_cd": "13010000",
            "fix_group_ids": [gid],
            "checkpoints": CHECKPOINTS_CHECKIN,
        })
        tasks.append({
            "description": f"CheckInReportingTime_STDAfter10am ({suffix})",
            "name": f"13020000-{suffix}",
            "read_file": f"step4-ck-{suffix}-rate.csv",
            "table": SHOW_UP_TABLE,
            "transform": "cumulative_percent",
            "psg_atrb_cd": "13020000",
            "fix_group_ids": [gid],
            "agg_periods": ["P2", "P3", "P4", "P5"],
            "checkpoints": CHECKPOINTS_CHECKIN,
        })
    return tasks


#  DB 저장 태스크 목록
# 공통 필드:
#   description: 로그 출력용 설명
#   name: CSV 출력 파일명 식별자 (step5-{name}.csv)
#   read_file: data/{period}/ 기준 CSV 파일명
#   table: 저장 대상 테이블명
#   transform: raw / cumulative_percent / island_dg / ckin_type
#   fix_group_ids: 동일값을 저장할 FIX_ATRB_GROUP_ID 목록
# raw 전용:
#   psg_atrb_cd
#   category_col + category_order(선택: 행 선택/정렬), filter(선택)
# cumulative_percent 전용:
#   psg_atrb_cd, checkpoints, filter(단일 PERIOD) 또는 agg_periods(여러 PERIOD 평균)
UPLOAD_TASKS = [
    #  단순 비율 (TN_PM_SMLT_PSG_ATRB, raw x 100)
    {
        "description": "국적",
        "name": "01010000",
        "read_file": "step4-nationality-rate.csv",
        "table": PSG_ATRB_TABLE,
        "transform": "raw",
        "psg_atrb_cd": "01010000",
        "fix_group_ids": PRE_PRCS_GROUPS,
        "category_col": "NATIONALITY",
        "category_order": ["KOR", "FOREIGN"],
    },
    {
        "description": "출발지",
        "name": "02010000",
        "read_file": "step4-departure-location-rate.csv",
        "table": PSG_ATRB_TABLE,
        "transform": "raw",
        "psg_atrb_cd": "02010000",
        "fix_group_ids": PRE_PRCS_GROUPS,
        "category_col": "LOCATION",
        "category_order": ["NON_CITY_AIRPORT", "CITY_AIRPORT"],
    },
    {
        "description": "수하물 갯수",
        "name": "04010000",
        "read_file": "step4-bsm-rate.csv",
        "table": PSG_ATRB_TABLE,
        "transform": "raw",
        "psg_atrb_cd": "04010000",
        "fix_group_ids": PRE_PRCS_GROUPS,
    },
    {
        "description": "출국심사 내국인",
        "name": "18010000",
        "read_file": "step4-emigration-rate.csv",
        "filter": {"NATIONALITY": "KOR"},
        "table": PSG_ATRB_TABLE,
        "transform": "raw",
        "psg_atrb_cd": "18010000",
        "fix_group_ids": PRE_PRCS_GROUPS,
        "category_col": "EMIGRATION_MODE",
        "category_order": ["MANUAL", "AUTO"],
    },
    {
        "description": "출국심사 외국인",
        "name": "18020000",
        "read_file": "step4-emigration-rate.csv",
        "filter": {"NATIONALITY": "FOREIGN"},
        "table": PSG_ATRB_TABLE,
        "transform": "raw",
        "psg_atrb_cd": "18020000",
        "fix_group_ids": PRE_PRCS_GROUPS,
        "category_col": "EMIGRATION_MODE",
        "category_order": ["MANUAL", "AUTO"],
    },
    {
        "description": "출국장이용분포",
        "name": "dep-usage",
        "read_file": "step4-dep-usage-rate.csv",
        "table": PSG_ATRB_TABLE,
        "transform": "island_dg",
    },
    {
        "description": "체크인유형",
        "name": "checkin-type",
        "read_file": "step4-checkin-type.csv",
        "table": CKIN_TYPE_TABLE,
        "transform": "ckin_type",
        "fix_group_ids": PRE_PRCS_GROUPS,
    },
    # 시계열 누적 (TN_PM_SMLT_SHOW_UP_ATRB, cumulative_percent)
    # 게이트 리포팅: bg-rate(터미널 미분리) -> 양 그룹 동일, P1~P5 평균
    {
        "description": "게이트 리포팅",
        "name": "14100000",
        "read_file": "step4-bg-rate.csv",
        "table": SHOW_UP_TABLE,
        "transform": "cumulative_percent",
        "psg_atrb_cd": "14100000",
        "fix_group_ids": PRE_PRCS_GROUPS,
        "agg_periods": PERIODS,
        "checkpoints": CHECKPOINTS_GATE,
    },
]

# 발생시각 (EntryTime): gen-t1/t2 x P1~P5 -> 05010000~05050000
UPLOAD_TASKS += _cumulative_per_period("step4-gen-{t}-rate.csv", GEN_CODES, CHECKPOINTS_ENTRY)
# 체크인 리포팅 (CheckInReportingTime): ck-t1/t2 -> 13010000 / 13020000
UPLOAD_TASKS += _checkin_reporting_tasks()
# 보안 리포팅 (SecurityReportingTime): dg-t1/t2 x P1~P5 -> 15010000~15050000
UPLOAD_TASKS += _cumulative_per_period("step4-dg-{t}-rate.csv", SECURITY_CODES, CHECKPOINTS_SECURITY)
