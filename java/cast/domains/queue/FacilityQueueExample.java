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
        // 식별 단위는 'T1 체크인 C 아일랜드의 Queue 3'이다. 다른 큐는 별도 객체로 만든다.
        // 종료 시각을 생략하면 시작부터 10분이다. 평균 인원과 종료 스냅샷은 다른 필드에 넣는다.
        FacilityQueueMetrics metrics = FacilityQueueMetrics.builder()
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

        // 유입률을 별도로 주지 않았으므로 Little's Law를 명시적으로 허용한다.
        // Lq=30명, Wq=600초 → lambda=180명/시간. S=120초 → mu=30명/시간/시설.
        // 동일 속도 8개 시설이 이 큐를 공유하고 앞으로도 조건이 일정하다고 가정한다.
        FacilityQueueContext current = FacilityQueueContext.builder()
                .oprServerCnt(8)
                .totServerCnt(10)
                .queuePsgCntAtStart(35)
                .serviceStartPsgCnt(25)
                .prcsPsgCnt(30)
                .busyServerTimeSec(3600.0)
                .availableServerTimeSec(4800.0)
                .littleLawApplicable(true)
                .sharedHomogeneousServers(true)
                .constantRates(true)
                .noAbandonmentOrTransfers(true)
                .build();

        print("평균 체류시간(초), 기대값 720", metrics.getAvgSojournTimeSec());
        print("누적 대기부담(명·초), 기대값 18000", metrics.getQueuePersonSeconds());
        print("대표 처리율(명/시간/시설), 기대값 30", metrics.estimateServiceRatePerHour());
        print("추정 유입률(명/시간), 기대값 180", metrics.estimateArrivalRatePerHour(current));
        print("총 처리능력(명/시간), 기대값 240", metrics.estimateCapacityPerHour(current));
        print("유입 부하 비율, 기대값 0.75", metrics.estimateLoadRatio(current));
        print("실제 가동률, 기대값 0.75", metrics.getObservedUtilization(current));
        print("구간 유입인원(명), 기대값 30", metrics.estimateArrivalPsgCnt(current));
        print("40명에서 10명까지 해소(초), 기대값 1800", metrics.estimateClearTimeSec(current, 10));

        // 10분 안에 40→10명으로 줄이려면 총 12개, 현재 8개보다 추가 4개가 필요하다.
        // 최대 10개만 배정할 수 있으므로 해당 목표의 실현 가능성은 false이다.
        print("10분 목표 필요 총 수, 기대값 12", metrics.estimateRequiredServerCnt(current, 10, 600));
        print("10분 목표 추가 수, 기대값 4", metrics.estimateAdditionalServerCnt(current, 10, 600));
        print("보유 시설로 목표 달성 가능, 기대값 false", metrics.assessCapacityFeasibility(current, 10, 600));

        // 같은 관측값에 시설 6개 조건을 적용하면 C=lambda=180이라 현재 큐가 줄지 않는다.
        FacilityQueueContext overloaded = FacilityQueueContext.builder()
                .oprServerCnt(6)
                .arrivalRatePerHour(180.0)
                .sharedHomogeneousServers(true)
                .constantRates(true)
                .build();
        print("처리능력=유입률이면 해소 불가", metrics.estimateClearTimeSec(overloaded, 10));

        // 모형 가정을 확인하지 않으면 플래그는 기본 false이며 추정값을 임의로 만들지 않는다.
        print("가정 미확인 시 유입 추정 불가",
                metrics.estimateArrivalRatePerHour(FacilityQueueContext.builder().build()));

        // 이론 비교에는 예제상 별도로 주어진 유입률을 사용한다. 실제 검증에서는 독립 원천이 필요하다.
        // mmSApplicable=true는 소프트웨어가 가정을 검증했다는 뜻이 아니라 호출자가 확인했다는 선언이다.
        FacilityQueueContext mmS = FacilityQueueContext.builder()
                .oprServerCnt(8)
                .arrivalRatePerHour(180.0)
                .sharedHomogeneousServers(true)
                .constantRates(true)
                .mmSApplicable(true)
                .build();
        MetricResult<ErlangCResult> theory = metrics.analyzeErlangC(mmS);
        if (theory.hasValue()) {
            ErlangCResult result = theory.getValue();
            System.out.println("모형상 대기 발생 확률: " + result.getWaitProbability());
            System.out.println("모형상 평균 대기시간(초): " + result.getTheoreticalAvgWtngTimeSec());
            print("모형상 5분 이내 서비스 시작 확률", result.estimateServiceLevel(300));
        } else {
            print("M/M/s 분석 불가", theory);
        }
    }

    /** 숫자뿐 아니라 상태·방법·사유도 출력해 직접 계산과 추정을 구분하며 읽는다. */
    private static void print(String label, MetricResult<?> result) {
        System.out.println(label + ": " + result);
    }
}
