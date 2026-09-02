-- 운항편 샘플링 쿼리 (sampling-query.sql 기반, 날짜 파라미터화)
SELECT
    FLTSH_ID,
    TMNL_ID,
    DDLN_FLTNM,
    GD_SE_YMD,
    PREDC_HM,
    P_TIME_SECTION,
    ACTL_YMD,
	ACTL_HM,
    CON_SE_CD,
    (SELECT COM_CD_NM FROM CAOWN.TC_CA_COM_CD WHERE COM_CD_SE_CD = 'CA257' AND COM_CD = CON_SE_CD) CON_SE_NM,
    GD_BDPSG_CNT,
    CK_BDPSG_CNT,
    DG_BDPSG_CNT,
    BG_BDPSG_CNT,
    CK_ERR || '%' AS CK_ERR,
    DG_ERR || '%' AS DG_ERR,
    BG_ERR || '%' AS BG_ERR
FROM (
    SELECT
        GD.FLTSH_ID,
        GD.TMNL_ID,
        GD.DDLN_FLTNM,
        GD.GD_SE_YMD,
        GD.PREDC_HM,
        GD.P_TIME_SECTION,
        GD.ACTL_YMD,
        GD.ACTL_HM,
        GD.CON_SE_CD,
        GD.GD_BDPSG_CNT,
        CK.CK_BDPSG_CNT,
        DG.DG_BDPSG_CNT,
        BG.BG_BDPSG_CNT,
        ROUND(ABS(GD.GD_BDPSG_CNT - CK.CK_BDPSG_CNT) / GD.GD_BDPSG_CNT * 100) AS CK_ERR,
        ROUND(ABS(GD.GD_BDPSG_CNT - DG.DG_BDPSG_CNT) / GD.GD_BDPSG_CNT * 100) AS DG_ERR,
        ROUND(ABS(GD.GD_BDPSG_CNT - BG.BG_BDPSG_CNT) / GD.GD_BDPSG_CNT * 100) AS BG_ERR
    FROM (
        SELECT
            GD.FLTSH_ID,
            GD.TMNL_ID,
            GD.DDLN_FLTNM,
            GD.GD_SE_YMD,
            GD.PREDC_HM,
            GD.CON_SE_CD,
            GD.GD_BDPSG_CNT,
            GD.ACTL_YMD,
            GD.ACTL_HM,
            P.P_TIME_SECTION
        FROM (
            SELECT
                FLTSH_ID,
                CASE
                    WHEN TMNL_ID IN ('P01', 'P02')
                    THEN 'T1'
                    ELSE 'T2'
                END as TMNL_ID,
                DDLN_FLTNM,
                GD_SE_YMD,
                PREDC_HM,
                B.STATS_CON_SE_CD AS CON_SE_CD,
                PFR_BRDG_TNOPE AS GD_BDPSG_CNT,
                NVL(ACTL_YMD, GD_SE_YMD) AS ACTL_YMD,
                NVL(ACTL_HM, PREDC_HM) AS ACTL_HM
            FROM PMOWN.TN_GO_GD_DATA_2602 A
                LEFT OUTER JOIN GOOWN.TN_GO_ARPT_STATS_CON_SE B
                ON (A.ARPT_CD = B.ARPT_CD AND B.CON_APLCN_SE_CD = '4')
            WHERE GD_SE_YMD = ?
            AND A.ARR_DEP_SE_CD = 'D'
            AND A.CSHR_STTS_CD != 'SL'
            AND A.PSG_CGO_SE_CD = 'Y'
            AND A.ARCFT_USE_SE_CD IN ('0', '1')
            AND A.GD_FLT_PRPS_CD IN ('00', '05')
            AND A.FRY_YN NOT IN ('Y')
            AND A.DOM_INTL_SE_CD NOT IN ('D')
            AND A.DLY_RSN_CD NOT IN ('2', '3')
        ) GD
        LEFT JOIN (
            SELECT 'T1' TMNL_SE_CD, ENV_PSTN_NM AS P_TIME_SECTION, ENVAL_BGNG_VL, ENVAL_END_VL
            FROM PMOWN.TN_PM_BDPSG_ANCE_VRBL
            WHERE ENV_VRBL_NM = 'DEP_MOVE_TIME'
            AND ENVAL_SN = 1

            UNION ALL

            SELECT 'T2' TMNL_SE_CD, BDPSG_ANCE_FCLT_SE_CD, ENVAL_BGNG_VL, ENVAL_END_VL
            FROM PMOWN.TN_PM_BDPSG_ANCE_ENV_VRBL
            WHERE BDPSG_ANCE_SE_CD = 'D2'
            AND TMNL_ID = 'P03'
            AND ENVAL_SN = 1
        ) P
        ON GD.TMNL_ID = P.TMNL_SE_CD
        AND SUBSTR(GD.PREDC_HM, 1, 2) * 60 + SUBSTR(GD.PREDC_HM, 3, 2) BETWEEN ENVAL_BGNG_VL AND ENVAL_END_VL
    ) GD INNER JOIN (
        SELECT FLTSH_ID, ALN_CD, FLTNM, ALN_CD || FLTNM AS DDLN_FLTNM, COUNT(*) CK_BDPSG_CNT
        FROM PMOWN.TN_PM_BDPS_ISSU_INFO
        WHERE CHKN_SE_CD IN ('CK', 'SCI')
        AND BDPS_ISSU_YMD = ?
        AND FLTSH_ID IS NOT NULL
        GROUP BY FLTSH_ID, ALN_CD, FLTNM
    ) CK
    ON GD.FLTSH_ID = CK.FLTSH_ID
    INNER JOIN (
        SELECT FLTSH_ID, ALN_CD, FLTNM, ALN_CD || FLTNM AS DDLN_FLTNM, COUNT(*) BG_BDPSG_CNT
        FROM PMOWN.TN_PM_BDPS_ISSU_INFO
        WHERE CHKN_SE_CD IN ('BG')
        AND BDPS_ISSU_YMD = ?
        AND FLTSH_ID IS NOT NULL
        GROUP BY FLTSH_ID, ALN_CD, FLTNM
    ) BG
    ON GD.FLTSH_ID = BG.FLTSH_ID
    INNER JOIN (
        SELECT FLTSH_ID, ALN_CD, FLTNM, ALN_CD || FLTNM AS DDLN_FLTNM, COUNT(*) DG_BDPSG_CNT
        FROM PMOWN.TN_PM_PSG_SHOW_INFO
        WHERE DPTGT_ETRY_YMD = ?
        AND FLTSH_ID IS NOT NULL
        GROUP BY FLTSH_ID, ALN_CD, FLTNM
    ) DG
    ON GD.FLTSH_ID = DG.FLTSH_ID
    ORDER BY CK_ERR + BG_ERR + DG_ERR
)
WHERE GD_BDPSG_CNT > 0
AND CK_ERR < 30
AND DG_ERR < 30
AND BG_ERR < 30
