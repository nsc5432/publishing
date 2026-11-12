package aoms.pm.cast.verify;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.chkn.ChknQueueCalculator;
import aoms.pm.cast.domains.chkn.ChknQueueInterval;
import aoms.pm.cast.domains.chkn.ChknQueueSeries;
import aoms.pm.cast.domains.chkn.ChknQueueTrajectory;
import aoms.pm.cast.domains.chkn.ChknWtngSecBuilder;
import aoms.pm.cast.domains.dsbd.DepQueueDay;
import aoms.pm.cast.domains.dsbd.DepWtngSecBuilder;
import aoms.pm.cast.domains.queue.QueueWaitWindow;
import aoms.pm.cast.domains.wtng.FcltQueueClearance;
import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngSec;
import aoms.pm.cast.domains.wtng.FcltWtngSecs;
import aoms.pm.cast.dto.PsgPrcsGradeRawDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
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
        checkEndDt(BASE.atTime(10, 10));
        checkEndDt(BASE.atStartOfDay());
        checkEndDt(BASE.atTime(23, 0));
        checkBuilders();
        System.out.println("PASS " + checks + " facility waiting regression checks");
    }

    private static void checkBoundary(int waitSec, CongestionStatus expectedGrade) {
        for (FcltType type : List.of(FcltType.CHKN, FcltType.DEP, FcltType.SC)) {
            List<FcltWtngSec> rows = new ArrayList<>();
            rows.add(row(EVAL.minusMinutes(30), 0, 0, 0, true, type));

            for (int index = 0; index < 3; index++) {
                rows.add(row(EVAL.minusMinutes(20 - index * 10L), 0, 1, waitSec, true, type));
            }

            FcltWtngDay day = day(type, rows);
            FcltQueueClearance clearance = day.clearanceOf("A", EVAL);
            String context = type + " wait=" + waitSec;

            equal((double) waitSec, day.avgWtngSecOf("A", EVAL).getValue(), context + " observed average");
            equal(expectedGrade, day.gradeOf("A", EVAL).getValue(), context + " grade");
            equal(1.0, day.waitWindowOf("A", EVAL).observedPrcsPsgCnt(), context + " processed total");
            equal((double) waitSec, day.sourceOf("A", EVAL).getAvgWtngSec(), context + " source average");
            equal((double) waitSec, clearance.getObservedWait().getValue(), context + " popup average");
            equal((double) waitSec, clearance.clearOf(1, 0).getFcstWtngSec().getValue(), context + " forecast at zero");

            if (waitSec == 2400) {
                equal(false, Objects.equals(0.0, clearance.clearOf(1, 30).getClearSec().getValue()), context + " not already cleared");
            }
        }
    }

    private static void checkPsgGroupValidity() {
        FcltWtngDay unobserved = day(FcltType.CHKN, queueRows(false, 0, 8));
        equal(3600.0, unobserved.avgWtngSecOf("A", EVAL).getValue(), "older unobserved row does not invalidate observed average");
        unavailable(unobserved, "older unobserved arrivals");
        unavailable(day(FcltType.CHKN, queueRows(true, null, 8)), "unknown beginning queue");
        unavailable(day(FcltType.CHKN, queueRows(true, 0, null)), "unknown ending queue");

        FcltWtngDay observed = day(FcltType.CHKN, queueRows(true, 0, 8));
        equal(5.0, observed.waitWindowOf("A", EVAL).queuePsgCnt(), "observed older row restores five passengers");
        equal(true, observed.recommendOf("A", EVAL).getReqCnt() != null, "observed older row supports recommendation");
        equal(true, observed.clearanceOf("A", EVAL).clearOf(1, 30).getClearSec().hasValue(), "observed older row supports clearance");

        List<FcltWtngSec> emptyQueue = new ArrayList<>();
        emptyQueue.add(row(EVAL.minusMinutes(30), 3, 2, 7200, false));

        for (int index = 0; index < 3; index++) {
            emptyQueue.add(row(EVAL.minusMinutes(20 - index * 10L), 2 - index, 1, 1200, true));
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
        double[] processed = new double[QueueWaitWindow.WINDOW_MIN];
        double[] waits = new double[QueueWaitWindow.WINDOW_MIN];
        Arrays.fill(processed, 1);
        Arrays.fill(waits, 60);
        QueueWaitWindow window = new QueueWaitWindow(processed, waits, null, List.of(), null);
        equal((double) QueueWaitWindow.WINDOW_MIN, window.observedPrcsPsgCnt(), "legacy constructor processed total");
        equal(60.0, window.observedAvgWtngSec().getValue(), "legacy constructor average");
    }

    private static void checkEndDt(LocalDateTime eval) {
        for (FcltType type : List.of(FcltType.CHKN, FcltType.DEP, FcltType.SC)) {
            List<FcltWtngSec> rows = new ArrayList<>();

            for (int index = -2; index <= 7; index++) {
                int processed = (index + 3) * 10;
                rows.add(row(eval.plusMinutes(index * 10L), index + 3, processed, processed * 60.0, true, type));
            }

            FcltWtngDay day = day(type, rows);
            String context = type + " eval=" + eval;

            equal(3, day.windowSlotOf("A", eval).getCurrentQueue(), context + " snapshot queue");
            equal(30, day.windowSlotOf("A", eval).getPrcsPsgCnt(), context + " preceding ten-minute processing");
            equal(30.0, day.waitWindowOf("A", eval).observedPrcsPsgCnt(), context + " observed processing");
            equal(60.0, day.avgWtngSecOf("A", eval).getValue(), context + " observed wait");
            equal(3, day.intrvlOf(eval, eval.plusHours(1)).getWtngPsgCnt(), context + " summary snapshot");
            equal(30, day.intrvlOf(eval, eval.plusHours(1)).getIntvPrcsPsgCnt(), context + " summary ten-minute processing");
            equal(31, day.intrvlOf(eval, eval.plusHours(1)).getIntvArvlPsgCnt(), context + " summary ten-minute arrivals");
            equal(390, day.intrvlOf(eval, eval.plusHours(1)).getPrcsPsgCnt(), context + " next-hour processing");
            equal(396, day.arvlPsgCntOf("A", eval, 60), context + " next-hour arrivals");
            equal(150, day.slotOf("A", eval, 30).getPrcsPsgCnt(), context + " thirty-minute processing");
            equal(6, day.slotOf("A", eval, 30).getCurrentQueue(), context + " thirty-minute ending queue");
            equal(150.0, day.cmprOf(List.of("A"), eval, 30).getAvgPrcsPsgCnt(), context + " comparison processing");
            equal(3.0, day.waitWindowOf("A", eval).queuePsgCnt(), context + " reconstructed queue");

            Map<String, List<FcltWtngSec>> scope = Map.of("A", rows.subList(3, 6));
            equal(null, FcltWtngSecs.findGap(scope, List.of("A"), eval, eval.plusMinutes(30)), context + " complete scope");
            equal(true, FcltWtngSecs.findGap(Map.of("A", rows.subList(2, 5)), List.of("A"), eval, eval.plusMinutes(30)) != null,
                    context + " start-based scope rejected");
            equal(true, day(type, List.of(rows.get(1))).hasResult("A", eval), context + " beginning snapshot present");
            equal(false, day(type, List.of(rows.get(0))).hasResult("A", eval), context + " older snapshot excluded");
            equal(false, day(type, List.of(rows.get(3))).hasResult("A", eval), context + " future snapshot excluded");
        }
    }

    private static void checkBuilders() {
        LocalDateTime midnight = BASE.atStartOfDay();
        LocalDateTime end = BASE.atTime(10, 10);
        ChknQueueSeries series = ChknQueueCalculator.calculate("A", List.of(
                new ChknQueueInterval(-10, 10, 10, 10, BigDecimal.valueOf(60), 1),
                new ChknQueueInterval(600, 10, 20, 20, BigDecimal.valueOf(60), 2),
                new ChknQueueInterval(1430, 10, 30, 10, BigDecimal.valueOf(60), 1)),
                new int[1440], BigDecimal.valueOf(60), -10);
        boolean[] covered = new boolean[1450];
        Arrays.fill(covered, true);
        ChknQueueTrajectory trajectory = new ChknQueueTrajectory(TerminalKind.T1, BASE, -10, covered, Map.of("A", series));
        List<FcltWtngSec> chknRows = ChknWtngSecBuilder.build(trajectory).get("A");
        FcltWtngSec chkn = chknRows.stream().filter(sec -> end.equals(sec.getSecEndDt())).findFirst().orElseThrow();

        equal(midnight, chknRows.get(0).getSecEndDt(), "CHKN preceding-day interval ends at midnight");
        equal(midnight.plusDays(1), chknRows.get(chknRows.size() - 1).getSecEndDt(), "CHKN last interval ends next midnight");
        equal(20, chkn.getEndWtngPsgCnt(), "CHKN 10:10 ending queue");
        equal(20, chkn.getPrcsPsgCnt(), "CHKN 10:10 preceding interval processing");
        equal(null, FcltWtngSecs.findGap(Map.of("A", chknRows), List.of("A"),
                ChknWtngSecBuilder.rangeStartOf(BASE, -10), ChknWtngSecBuilder.rangeEndOf(BASE)), "CHKN complete ending range");

        for (FcltType type : List.of(FcltType.DEP, FcltType.SC)) {
            DepQueueDay source = new DepQueueDay(TerminalKind.T1, List.of(
                    raw(end.minusMinutes(10), 2, 5), raw(end, 7, 11), raw(midnight.plusDays(1), 9, 13)),
                    type == FcltType.SC ? Map.of("A", 4) : Map.of());
            LocalDateTime rangeStart = DepWtngSecBuilder.rangeStartOf(BASE, source.firstResultDt());
            LocalDateTime rangeEnd = DepWtngSecBuilder.rangeEndOf(BASE);
            Map<String, List<FcltWtngSec>> secMap = DepWtngSecBuilder.build(source, List.of("A"), rangeStart, rangeEnd);
            List<FcltWtngSec> rows = secMap.get("A");
            FcltWtngSec dep = rows.stream().filter(sec -> end.equals(sec.getSecEndDt())).findFirst().orElseThrow();

            equal(7, dep.getEndWtngPsgCnt(), type + " raw 10:10 queue retained");
            equal(11, dep.getPrcsPsgCnt(), type + " raw 10:10 processing retained");
            equal(660.0, dep.getWtngPsecSum(), type + " raw 10:10 wait sum retained");
            equal(true, dep.isObsrvn(), type + " both raw boundaries observed");
            equal(type == FcltType.SC ? 4 : null, dep.getEndOperCntom(), type + " operating count retained");
            equal(midnight.plusDays(1), rows.get(rows.size() - 1).getSecEndDt(), type + " next-midnight snapshot retained");
            equal(9, rows.get(rows.size() - 1).getEndWtngPsgCnt(), type + " next-midnight queue retained");
            equal(null, FcltWtngSecs.findGap(secMap, List.of("A"), rangeStart, rangeEnd), type + " complete ending range");
        }
    }

    private static SmltRsltRawDto raw(LocalDateTime end, int queue, int processed) {
        SmltRsltRawDto result = new SmltRsltRawDto();
        result.setUnitCd("A");
        result.setSmltActlDt(end);
        result.setWtngPsgCnt(queue);
        result.setTrnstPsgCnt(processed);
        result.setWtngSecSum(processed * 60.0);
        result.setPrcsHr(60);
        return result;
    }

    private static List<FcltWtngSec> queueRows(boolean observed, Integer beginning, Integer ending) {
        List<FcltWtngSec> rows = new ArrayList<>();

        if (beginning != null) {
            rows.add(row(EVAL.minusMinutes(40), beginning, 0, 0, observed));
        }

        rows.add(row(EVAL.minusMinutes(30), ending, 2, 7200, observed));

        for (int index = 0; index < 3; index++) {
            rows.add(row(EVAL.minusMinutes(20 - index * 10L), 7 - index, 1, 3600, true));
        }

        return rows;
    }

    private static FcltWtngSec row(LocalDateTime end, Integer ending,
            int processed, double waitSecSum, boolean observed) {
        return row(end, ending, processed, waitSecSum, observed, FcltType.CHKN);
    }

    private static FcltWtngSec row(LocalDateTime end, Integer ending,
            int processed, double waitSecSum, boolean observed, FcltType type) {
        int samples = type == FcltType.CHKN ? 10 : 1;

        return FcltWtngSec.builder()
                .unitCd("A")
                .secEndDt(end)
                .endWtngPsgCnt(ending)
                .prcsPsgCnt(processed)
                .wtngPsecSum(waitSecSum)
                .wtngVldPsgCnt(processed)
                .prcsPsecSum(processed * 60.0)
                .prcsVldPsgCnt(processed)
                .wtngPsgCntSum(ending == null ? 0 : (long) ending * samples)
                .wtngNocs(samples)
                .maxWtngPsgCnt(ending == null ? 0 : ending)
                .endOperCntom(1)
                .prcsCpct(type == FcltType.CHKN ? 10L : null)
                .prcsVldOperCntomSum(type == FcltType.CHKN ? 10L : null)
                .obsrvn(observed)
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
