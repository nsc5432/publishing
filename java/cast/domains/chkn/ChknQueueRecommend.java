package aoms.pm.cast.domains.chkn;

/**
 * @Classname : ChknQueueRecommend.java
 * @Description : 공용 Queue 궤적으로 구한 부스 추천 — 산정할 수 없으면 값이 null 이다
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 04. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class ChknQueueRecommend {
	public static final ChknQueueRecommend NONE = new ChknQueueRecommend(null, null);

	private final Integer reqCnt;
	private final Integer cgnClearMin;

	ChknQueueRecommend(Integer reqCnt, Integer cgnClearMin) {
		this.reqCnt = reqCnt;
		this.cgnClearMin = cgnClearMin;
	}

	/** 피크를 NORMAL 이하로 만드는 총 소요 부스 수 (현재 운영분 포함) */
	public Integer getReqCnt() {
		return reqCnt;
	}

	/** 추천 부스를 적용했을 때 NORMAL 이하가 되는 경과 분 */
	public Integer getCgnClearMin() {
		return cgnClearMin;
	}
}
