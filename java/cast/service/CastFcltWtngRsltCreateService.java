package aoms.pm.cast.service;

public interface CastFcltWtngRsltCreateService {
	/**
	 * 원천 수신 실행 · 모델의 체크인 / 출국장 10분 대기 결과를 저장 단위(터미널 · 시설유형)마다 한 번 만든다.
	 * 계산 · DB 실패는 호출자에게 전파하며 원천 저장과 모든 대기 결과를 함께 롤백한다.
	 */
	void createInitialResult(String smltId, int smltMdlSn, String loginIpAddr);
}
