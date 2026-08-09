package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * TN_PM_SMLT_RSLT_DTL 집계 1행 — 대시보드·맵형태보기가 함께 쓰는 조회 원형.
 *
 * <p>
 * unitCd 는 시설코드에서 잘라낸 화면 묶음 단위다. 자리수 규칙은 실데이터로 확인했다 (G11 해소).
 * </p>
 *
 * <pre>
 * CC  T1CCG29   → T1CC + 아일랜드(G) + 부스(29)          아일랜드 = SUBSTR(cd, -3, 1)
 * CC  T1CCDZ01  → T1CC + D(국내선) + 아일랜드(Z) + 부스   아일랜드 = SUBSTR(cd, -3, 1)
 * CK  T1CKIM01  → T1CKI + 아일랜드(M) + 기기번호          아일랜드 = SUBSTR(cd, -3, 1)
 * SBD T1SBDG01  → T1SBD + 아일랜드(G) + 기기번호          아일랜드 = SUBSTR(cd, -3, 1)
 * LGT T1L5NY19  → T1L + 출국장(5) + 속성2 + 레인(19)      출국장   = SUBSTR(cd, 4, 1)
 * SC  T1SC5_14  → T1SC + 출국장(5) + _ + 레인(14)         출국장   = SUBSTR(cd, 5, 1)
 * </pre>
 */
@Getter
@Setter
public class SmltRsltRawDto {
	private String time; // 결과 시각 HHmm
	private String upPsgFcltCd; // 상위시설코드 (CC / CK / SBD / LGT / SC ...)
	private String psgFcltCd; // 여객시설코드
	private String psgFcltNm; // 여객시설명
	private String unitCd; // 화면 묶음 단위 (아일랜드 문자 또는 출국장 번호)
	private int wtngPsgCnt; // 대기여객수 (명)
	private int trnstPsgCnt; // 통과여객수 (명) — 화면의 처리인원
	private int wtngHr; // 평균대기시간 (초)
	private int prcsHr; // 평균처리시간 (초)
}
