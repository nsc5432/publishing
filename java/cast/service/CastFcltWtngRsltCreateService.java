package aoms.pm.cast.service;

import java.util.List;

public interface CastFcltWtngRsltCreateService {
	/**
	 * 원천 수신이 커밋된 실행 · 모델의 체크인 / 출국장 10분 대기 결과를 저장 단위(터미널 · 시설유형)마다 한 번 만든다.
	 * 예상 가능한 계산 · DB 실패는 그 저장 단위만 롤백하고 사유로 돌려준다. 원천 저장 결과는 바꾸지 않는다.
	 * @return 저장하지 못한 저장 단위의 사유. 모두 저장했으면 빈 목록
	 */
	List<String> createInitialResult(String smltId, int smltMdlSn);
}
