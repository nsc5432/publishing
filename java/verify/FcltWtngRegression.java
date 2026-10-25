package aoms.pm.cast.verify;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.queue.QueueWaitWindow;
import aoms.pm.cast.domains.wtng.FcltQueueClearance;
import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngSec;
import aoms.pm.cast.dto.PsgPrcsGradeRawDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

public final class FcltWtngRegression {
    private static final LocalDate BASE = LocalDate.of(2026, 10, 24);
    private static final LocalDateTime EVAL = BASE.atTime(10, 0);
    private static int checks;

    public static void main(String[] args) {
        checkBoundary(1200, CongestionStatus.NORMAL);
        checkBoundary(2400, CongestionStatus.BUSY);
        checkBoundary(3600, CongestionStatus.VERY_BUSY);
        checkBoundary(1199, CongestionStatus.FREE);
        checkBoundary(2401, CongestionStatus.BUSY);
        checkPsgGroupValidity();
        checkLegacyWindow();
        System.out.println("PASS " + checks + " facility waiting regression checks");
    }

    private static void checkBoundary(int waitSec, CongestionStatus expectedGrade) {
        for (FcltType type : List.of(FcltType.CHKN, FcltType.DEP)) {
            List<FcltWtngSec> rows = new ArrayList<>();

            for (int index = 0; index < 3; index++) {
                rows.add(row(EVAL.minusMinutes(30 - index * 10L), 0, 0, 1, 1, waitSec, true, type));
            }

            FcltWtngDay day = day(type, rows);
            FcltQueueClearance clearance = day.clearanceOf("A", EVAL);
            String context = type + " wait=" + waitSec;

            equal((double) waitSec, day.avgWtngSecOf("A", EVAL).getValue(), context + " observed average");
            equal(expectedGrade, day.gradeOf("A", EVAL).getValue(), context + " grade");
            equal(3.0, day.waitWindowOf("A", EVAL).observedPrcsPsgCnt(), context + " processed total");
            equal((double) waitSec, day.sourceOf("A", EVAL).getAvgWtngSec(), context + " source average");
            equal((double) waitSec, clearance.getObservedWait().getValue(), context + " popup average");
            equal((double) waitSec, clearance.clearOf(1, 0).getFcstWtngSec().getValue(), context + " forecast at zero");

            if (waitSec == 2400) {
                equal(false, Objects.equals(0.0, clearance.clearOf(1, 30).getClearSec().getValue()), context + " not already cleared");
            }
        }
    }

    private static void checkPsgGroupValidity() {
        FcltWtngDay unobserved = day(FcltType.CHKN, queueRows(false, 0, 8, 10));
        equal(3600.0, unobserved.avgWtngSecOf("A", EVAL).getValue(), "older unobserved row does not invalidate observed average");
        unavailable(unobserved, "older unobserved arrivals");
        unavailable(day(FcltType.CHKN, queueRows(true, null, 8, 10)), "unknown beginning queue");
        unavailable(day(FcltType.CHKN, queueRows(true, 0, null, 10)), "unknown ending queue");
        unavailable(day(FcltType.CHKN, queueRows(true, 0, 8, null)), "unknown arrivals");

        FcltWtngDay observed = day(FcltType.CHKN, queueRows(true, 0, 8, 10));
        equal(5.0, observed.waitWindowOf("A", EVAL).queuePsgCnt(), "observed older row restores five passengers");
        equal(true, observed.recommendOf("A", EVAL).getReqCnt() != null, "observed older row supports recommendation");
        equal(true, observed.clearanceOf("A", EVAL).clearOf(1, 30).getClearSec().hasValue(), "observed older row supports clearance");

        List<FcltWtngSec> emptyQueue = new ArrayList<>();
        emptyQueue.add(row(EVAL.minusMinutes(40), 0, 3, 5, 2, 7200, false));

        for (int index = 0; index < 3; index++) {
            emptyQueue.add(row(EVAL.minusMinutes(30 - index * 10L), 3 - index, 2 - index, 0, 1, 1200, true));
        }

        FcltWtngDay empty = day(FcltType.CHKN, emptyQueue);
        equal(0.0, empty.waitWindowOf("A", EVAL).queuePsgCnt(), "confirmed empty queue needs no older history");
        equal(true, empty.recommendOf("A", EVAL).getReqCnt() != null, "empty queue supports recommendation");
    }

    private static void unavailable(FcltWtngDay day, String context) {
        equal(null, day.recommendOf("A", EVAL).getReqCnt(), context + " recommendation unavailable");
        equal(false, day.clearanceOf("A", EVAL).clearOf(1, 30).getClearSec().hasValue(), context + " clearance unavailable");
    }

    private static void checkLegacyWindow() {
        double[] processed = new double[30];
        double[] waits = new double[30];
        Arrays.fill(processed, 1);
        Arrays.fill(waits, 60);
        QueueWaitWindow window = new QueueWaitWindow(processed, waits, null, List.of(), null);
        equal(30.0, window.observedPrcsPsgCnt(), "legacy constructor processed total");
        equal(60.0, window.observedAvgWtngSec().getValue(), "legacy constructor average");
    }

    private static List<FcltWtngSec> queueRows(boolean observed, Integer beginning, Integer ending, Integer arrivals) {
        List<FcltWtngSec> rows = new ArrayList<>();
        rows.add(row(EVAL.minusMinutes(40), beginning, ending, arrivals, 2, 7200, observed));

        for (int index = 0; index < 3; index++) {
            rows.add(row(EVAL.minusMinutes(30 - index * 10L), 8 - index, 7 - index, 0, 1, 3600, true));
        }

        return rows;
    }

    private static FcltWtngSec row(LocalDateTime start, Integer beginning, Integer ending, Integer arrivals,
            int processed, double waitSecSum, boolean observed) {
        return row(start, beginning, ending, arrivals, processed, waitSecSum, observed, FcltType.CHKN);
    }

    private static FcltWtngSec row(LocalDateTime start, Integer beginning, Integer ending, Integer arrivals,
            int processed, double waitSecSum, boolean observed, FcltType type) {
        int samples = type == FcltType.CHKN ? 10 : 1;

        return FcltWtngSec.builder()
                .unitCd("A")
                .secBgngDt(start)
                .bgngWtngPsgCnt(beginning)
                .endWtngPsgCnt(ending)
                .arrPsgCnt(arrivals)
                .prcsPsgCnt(processed)
                .wtngPsecSum(waitSecSum)
                .wtngVldPsgCnt(processed)
                .prcsPsecSum(processed * 60.0)
                .prcsVldPsgCnt(processed)
                .wtngPsgCntSum(ending == null ? 0 : (long) ending * samples)
                .wtngNocs(samples)
                .maxWtngPsgCnt(ending == null ? 0 : ending)
                .bgngOperCntom(1)
                .endOperCntom(1)
                .prcsCpct(type == FcltType.CHKN ? 10L : null)
                .prcsVldOperCntomSum(type == FcltType.CHKN ? 10L : null)
                .obsrvn(observed)
                .obsrvnMntCnt(observed ? 10 : 0)
                .build();
    }

    private static FcltWtngDay day(FcltType type, List<FcltWtngSec> rows) {
        List<PsgPrcsGradeRawDto> grades = new ArrayList<>();
        String group = type == FcltType.CHKN ? "02" : "04";

        for (int index = 0; index < 4; index++) {
            PsgPrcsGradeRawDto grade = new PsgPrcsGradeRawDto();
            grade.setFcltGroupCd(group);
            grade.setPsgPrcsGrdCd("0" + (index + 1));
            grade.setMinVl(index * 20);
            grade.setMaxVl(index == 3 ? 9999 : index * 20 + 19);
            grades.add(grade);
        }

        return new FcltWtngDay(TerminalKind.T1, type, BASE, Map.of("A", rows), new CgnGradeScale(group, grades, "regression"));
    }

    private static void equal(Object expected, Object actual, String context) {
        if (!Objects.equals(expected, actual)) {
            throw new AssertionError(context + ": expected=" + expected + ", actual=" + actual);
        }

        checks++;
    }
}
