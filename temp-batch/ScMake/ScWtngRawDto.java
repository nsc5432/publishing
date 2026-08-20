package batch;

import lombok.Getter;
import lombok.Setter;

/**
 * TN_PM_PSG_WTNG_INFO(여객대기정보) 중 보안검색대(FCLT_TYPE_CD='SC') 원본 1행.
 * PK: psgFlowDataCrtDt, tmnlId, chknIslCd, fcltNm, fcltTypeCd
 *
 * <p>
 * 10분 간격 순간값이고 레인 1개가 1행이다. SC 행에서 chknIslCd 는 체크인아일랜드가 아니라
 * 출국장번호(01~04)이고, fcltNm 이 레인 식별자(T1_DG4_Lane03)다.
 * </p>
 */
@Getter
@Setter
public class ScWtngRawDto {
    private String psgFlowDataCrtDt; // 여객흐름자료생성일시 yyyyMMddHHmm
    private String tmnlId; // 터미널아이디 (P01/P03)
    private String chknIslCd; // SC 행에서는 출국장번호 (01~04)
    private String fcltNm; // 시설명 = 레인 식별자 (예: T1_DG4_Lane03)
    private String fcltTypeCd; // 시설유형코드 (SC)

    private int wtngLineLen; // 대기라인길이 = 대기인원 (명)
    private int dalyAcmlPsgCnt; // 일일누적여객수 (명) — 자정에 리셋되는 단조증가값
}
