package aoms.pm.cast.domains.queue;

import java.time.LocalDateTime;

/**
 * 학습용 실행 예제. 서버·DB·Spring 없이 main 메서드만으로 계산 결과를 확인할 수 있다.
 *
 * <p>권장 학습 순서: 입력 관측값 → 직접 계산 → 유입·처리율 추정 → 운영조건 변경 → M/M/s.
 * 예제의 수치는 계산 설명을 위해 구성했으며 실제 공항 운영 데이터가 아니다.</p>
 *
 * <p>JDK에서 이 폴더의 소스만 별도 출력 디렉터리에 javac -encoding UTF-8 -d 출력경로로
 * 컴파일한 뒤 java -cp 출력경로 aoms.pm.cast.domains.queue.FacilityQueueExample로 실행한다.
 * 실제 백엔드 프로젝트의 빌드나 서비스 연동을 대신하는 절차는 아니다.</p>
 */
public final class FacilityQueueExample {
    private FacilityQueueExample() { }

    public static void main(String[] args) {
        /*
         * TODO Xovis 실데이터 연계 시 조회 리스트를 보정한 뒤 집계·도메인 객체 생성에 전달한다.
         * - refineOutPaxCntDesk(List<XovisDataDto>)는 ISLAND=L, DESKTYPE=Desk만 보정한다.
         * - 원본 DTO는 보존하고 보정한 사본 리스트를 반환한다.
         * - TERMINAL/ISLAND/DESKNAME/DESKTYPE별로 OCCURTIME을 정렬하고 중복 시점을 검증한다.
         *   배정에 따라 바뀌는 QUEID는 물리적 Desk의 시계열을 나누는 키로 사용하지 않는다.
         * - 연속된 10분 자료의 TOTALPAXCNTDESK 차분을 OUTPAXCNTDESK에 반영한다.
         *   누적값이 0이거나 DESKOPEN=0인 행도 이전값 비교에 포함한다.
         * - 조회 시작 전 10분을 추가 조회해 첫 시점을 계산한 뒤 추가 조회분은 반환에서 제외한다.
         * - 이전값 없음, 누적값 결측, 시점 누락·중복, 누적값 감소는 미산출로 구분한다.
         *   감소분을 0으로 덮지 않고 초기화·정정 여부를 확인한다.
         * - 날짜 변경만으로 기준값을 초기화하지 않는다. 관측 자료는 00:10에 누적값이 초기화됐다.
         * - L 외 행은 그대로 유지한다. B03의 00:00 처리량 이상은 별도 검증 대상으로 남긴다.
         */
        FacilityQueueCalculator calculator = FacilityQueueCalculator.builder()
                .tmnlId("T1")
                .fcltType("CHKN")
                .fcltId("C")
                .queueId("3")
                .intervalStart(LocalDateTime.of(2026, 10, 9, 6, 20))
                .source(QueueDataSource.MANUAL)
                .avgPrcsTimeSec(120.0)
                .avgWtngTimeSec(600.0)
                .avgQueuePsgCnt(30.0)
                .queuePsgCntAtEnd(40)
                .samePassengerPopulation(true)
                .build();

        // Lq=30명, Wq=600초 → lambda=180명/시간. S=120초 → mu=30명/시간/시설.
        // 동일 속도 8개 시설이 이 큐를 공유하고 앞으로도 조건이 일정하다고 가정한다.
        FacilityQueueInput current = FacilityQueueInput.builder()
                .oprServerCnt(8)
                .totServerCnt(10)
                .queuePsgCntAtStart(35)
                .wtngEndPsgCnt(25)
                .prcsPsgCnt(30)
                .busyServerTimeSec(3600.0)
                .availableServerTimeSec(4800.0)
                .littleLawApplicable(true)
                .sharedHomogeneousServers(true)
                .constantRates(true)
                .noAbandonmentOrTransfers(true)
                .build();

        print("평균 체류시간(초), 기대값 720", calculator.getAvgSojournTimeSec());
        print("누적 대기부담(명·초), 기대값 18000", calculator.getQueuePersonSeconds());
        print("대표 처리율(명/시간/시설), 기대값 30", calculator.estimateServiceRatePerHour());
        print("추정 유입률(명/시간), 기대값 180", calculator.estimateArrivalRatePerHour(current));
        print("총 처리능력(명/시간), 기대값 240", calculator.estimateCapacityPerHour(current));
        print("유입 부하 비율, 기대값 0.75", calculator.estimateLoadRatio(current));
        print("실제 가동률, 기대값 0.75", calculator.getObservedUtilization(current));
        print("구간 유입인원(명), 기대값 30", calculator.estimateArrivalPsgCnt(current));
        print("40명에서 10명까지 해소(초), 기대값 1800", calculator.estimateClearTimeSec(current, 10));
        print("지금 줄 선 여객 예상 대기(초), 기대값 615", calculator.estimateNextArrivalWaitSec(current));

        print("10분 목표 필요 총 수, 기대값 12", calculator.estimateRequiredServerCnt(current, 10, 600));
        print("10분 목표 추가 수, 기대값 4", calculator.estimateAdditionalServerCnt(current, 10, 600));
        print("보유 시설로 목표 달성 가능, 기대값 false", calculator.assessCapacityFeasibility(current, 10, 600));

        FacilityQueueInput overloaded = FacilityQueueInput.builder()
                .oprServerCnt(6)
                .arrivalRatePerHour(180.0)
                .sharedHomogeneousServers(true)
                .constantRates(true)
                .build();
        print("처리능력=유입률이면 해소 불가", calculator.estimateClearTimeSec(overloaded, 10));
        print("처리능력=유입률이어도 지금 줄 선 여객 대기(초), 기대값 820", calculator.estimateNextArrivalWaitSec(overloaded));

        print("가정 미확인 시 유입 추정 불가",
                calculator.estimateArrivalRatePerHour(FacilityQueueInput.builder().build()));

        // 이론 비교에는 예제상 별도로 주어진 유입률을 사용한다. 실제 검증에서는 독립 원천이 필요하다.
        // mmSApplicable=true는 소프트웨어가 가정을 검증했다는 뜻이 아니라 호출자가 확인했다는 선언이다.
        FacilityQueueInput mmS = FacilityQueueInput.builder()
                .oprServerCnt(8)
                .arrivalRatePerHour(180.0)
                .sharedHomogeneousServers(true)
                .constantRates(true)
                .mmSApplicable(true)
                .build();
        Computed<ErlangCResult> theory = calculator.analyzeErlangC(mmS);
        if (theory.hasValue()) {
            ErlangCResult result = theory.getValue();
            System.out.println("모형상 대기 발생 확률: " + result.getWaitProbability());
            System.out.println("모형상 평균 대기시간(초): " + result.getModelAvgWtngTimeSec());
            print("모형상 5분 이내 서비스 시작 확률", result.estimateServiceLevel(300));
        } else {
            print("M/M/s 분석 불가", theory);
        }
    }

    private static void print(String label, Computed<?> result) {
        System.out.println(label + ": " + result);
    }
}
