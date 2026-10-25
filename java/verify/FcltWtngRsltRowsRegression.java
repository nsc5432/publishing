package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import aoms.pm.cast.domains.wtng.FcltWtngSec;
import aoms.pm.cast.dto.FcltWtngRsltDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

public final class FcltWtngRsltRowsRegression {
    private static final LocalDateTime START = LocalDateTime.of(2026, 10, 26, 10, 0);
    private static int checks;

    public static void main(String[] args) {
        for (FcltType type : List.of(FcltType.CHKN, FcltType.DEP)) {
            FcltWtngRsltDto row = rows(type, 61, 120).get(0);
            equal(new BigDecimal("61"), row.getWtngPsecSum(), type + " integer wait sum");
            equal(new BigDecimal("120"), row.getPrcsPsecSum(), type + " integer processing sum");
            equal(null, FcltWtngRsltRows.findInvalidRow(List.of(row)), type + " valid row");
            FcltWtngSec restored = FcltWtngRsltRows.toSecMap(List.of(row)).get("A").get(0);
            equal(61.0, restored.getWtngPsecSum(), type + " wait round trip");
            equal(120.0, restored.getPrcsPsecSum(), type + " processing round trip");
            equal(30.5, restored.getWtngPsecSum() / restored.getWtngVldPsgCnt(), type + " fractional average preserved");
        }

        FcltWtngRsltDto zero = rows(FcltType.CHKN, 0, 0).get(0);
        equal(BigDecimal.ZERO, zero.getWtngPsecSum(), "zero wait sum");
        equal(BigDecimal.ZERO, zero.getPrcsPsecSum(), "zero processing sum");
        rejected(0.5, 120, "fractional wait rejected before insert");
        rejected(61, 0.5, "fractional processing rejected before insert");
        rejected(Double.NaN, 120, "NaN wait rejected");
        rejected(61, Double.POSITIVE_INFINITY, "infinite processing rejected");

        FcltWtngRsltDto stored = rows(FcltType.CHKN, 61, 120).get(0);
        stored.setWtngPsecSum(new BigDecimal("61.000000"));
        stored.setPrcsPsecSum(new BigDecimal("120.000000"));
        equal(null, FcltWtngRsltRows.findInvalidRow(List.of(stored)), "trailing zeros are integral");
        stored.setWtngPsecSum(new BigDecimal("61.000001"));
        equal(true, FcltWtngRsltRows.findInvalidRow(List.of(stored)) != null, "fractional stored wait rejected");
        stored.setWtngPsecSum(new BigDecimal("61"));
        stored.setPrcsPsecSum(new BigDecimal("120.000001"));
        equal(true, FcltWtngRsltRows.findInvalidRow(List.of(stored)) != null, "fractional stored processing rejected");
        checkMetricRange();
        System.out.println("PASS " + checks + " integer time sum regression checks");
    }

    private static void checkMetricRange() {
        long max = 999_999_999_999L;
        long over = max + 1;
        FcltWtngRsltDto boundary = rows(FcltType.CHKN, metricSec(max, max, max, max, max)).get(0);
        equal(BigDecimal.valueOf(max), boundary.getWtngPsecSum(), "maximum wait sum");
        equal(BigDecimal.valueOf(max), boundary.getPrcsPsecSum(), "maximum processing sum");
        equal(max, boundary.getWtngPsgCntSum(), "maximum queue sum");
        equal(max, boundary.getPrcsCpct(), "maximum capacity");
        equal(max, boundary.getPrcsVldOperCntomSum(), "maximum operating sum");
        equal(null, FcltWtngRsltRows.findInvalidRow(List.of(boundary)), "12-digit boundary accepted");

        for (int field = 0; field < 5; field++) {
            FcltWtngSec sec = metricSec(field == 0 ? over : max, field == 1 ? over : max,
                    field == 2 ? over : max, field == 3 ? over : max, field == 4 ? over : max);
            try {
                rows(FcltType.CHKN, sec);
                throw new AssertionError("13-digit source metric accepted: " + field);
            } catch (IllegalStateException expected) {
                checks++;
            }

            FcltWtngRsltDto stored = rows(FcltType.CHKN, metricSec(max, max, max, max, max)).get(0);
            switch (field) {
                case 0: stored.setWtngPsecSum(BigDecimal.valueOf(over)); break;
                case 1: stored.setPrcsPsecSum(BigDecimal.valueOf(over)); break;
                case 2: stored.setWtngPsgCntSum(over); break;
                case 3: stored.setPrcsCpct(over); break;
                case 4: stored.setPrcsVldOperCntomSum(over); break;
                default: throw new AssertionError(field);
            }
            equal(true, FcltWtngRsltRows.findInvalidRow(List.of(stored)) != null, "13-digit stored metric rejected: " + field);
        }
    }

    private static FcltWtngSec metricSec(double waitSum, double processingSum, long queueSum, long capacity, long operatingSum) {
        return FcltWtngSec.builder()
                .unitCd("A")
                .secBgngDt(START)
                .wtngPsecSum(waitSum)
                .prcsPsecSum(processingSum)
                .wtngPsgCntSum(queueSum)
                .prcsCpct(capacity)
                .prcsVldOperCntomSum(operatingSum)
                .obsrvn(true)
                .build();
    }

    private static List<FcltWtngRsltDto> rows(FcltType type, double waitSum, double processingSum) {
        FcltWtngSec sec = FcltWtngSec.builder()
                .unitCd("A")
                .secBgngDt(START)
                .prcsPsgCnt(2)
                .wtngPsecSum(waitSum)
                .wtngVldPsgCnt(2)
                .prcsPsecSum(processingSum)
                .prcsVldPsgCnt(2)
                .obsrvn(true)
                .build();
        return rows(type, sec);
    }

    private static List<FcltWtngRsltDto> rows(FcltType type, FcltWtngSec sec) {
        return FcltWtngRsltRows.toRowList("1", 1, TerminalKind.T1, type, Map.of("A", List.of(sec)));
    }

    private static void rejected(double waitSum, double processingSum, String context) {
        try {
            rows(FcltType.CHKN, waitSum, processingSum);
        } catch (IllegalStateException expected) {
            checks++;
            return;
        }
        throw new AssertionError(context);
    }

    private static void equal(Object expected, Object actual, String context) {
        checks++;
        if (!Objects.equals(expected, actual)) {
            throw new AssertionError(context + ": expected=" + expected + ", actual=" + actual);
        }
    }
}
