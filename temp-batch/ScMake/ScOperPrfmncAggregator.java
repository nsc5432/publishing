package batch;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 여객대기정보(ScWtngRawDto)의 보안검색대 행을 보안검색대운영실적(TOT_DT·TMNL_ID·DEP_NUM
 * 시간당 운영 대수) 단위로 집계한다.
 *
 * <p>
 * 원천에 운영 대수를 담은 컬럼은 없다. 레인 1개가 1행이므로 활동 흔적이 있는 레인을 세어 유추한다 —
 * 대기라인길이가 0보다 크거나 일일누적여객수가 직전 스냅샷보다 늘었으면 그 레인은 그때 열려 있었다고
 * 본다. 시설사용여부(FCLT_USE_YN)를 쓰지 않는 이유는 실운영 데이터에서 채워지는지 확인되지 않아서다.
 * </p>
 *
 * <p>
 * 누적값을 직전 스냅샷과 비교하므로 <b>대상 구간과 그 직전 스냅샷이 이어진 목록</b>을 넘겨야 한다.
 * 하루치를 통째로 넘기는 것이 정상 사용법이고, 한 시간분만 넘기면 그 시간 첫 스냅샷의 증가를 판정할
 * 수 없어 운영 대수가 실제보다 적게 나온다. 목록의 순서는 상관없다 — 레인별로 다시 정렬한다.
 * </p>
 */
public final class ScOperPrfmncAggregator {

    private static final String SC_FCLT_TYPE_CD = "SC";
    private static final Pattern DEP_NUM_PATTERN = Pattern.compile("^0*([1-9]\\d*)$");
    private static final Map<String, Integer> MAX_DEP_NUM_BY_TMNL_ID = Map.of("P01", 6, "P03", 2);
    private static final int CRT_DT_LENGTH = 12;
    private static final int YMD_LENGTH = 8;

    public static List<ScOperPrfmncDto> aggregate(List<ScWtngRawDto> rows) {
        Map<String, List<ScWtngRawDto>> laneRows = new LinkedHashMap<>();
        for (ScWtngRawDto row : rows) {
            if (!isScLane(row)) {
                continue;
            }
            laneRows.computeIfAbsent(String.join("|", row.getTmnlId(), row.getFcltNm()),
                    k -> new ArrayList<>()).add(row);
        }

        Map<String, ScOperPrfmncDto> grouped = new LinkedHashMap<>();
        Map<String, Set<String>> operLaneSet = new HashMap<>();
        Map<String, Set<String>> obsvLaneSet = new HashMap<>();

        for (List<ScWtngRawDto> snapshots : laneRows.values()) {
            snapshots.sort(Comparator.comparing(ScWtngRawDto::getPsgFlowDataCrtDt));

            ScWtngRawDto prev = null;
            for (ScWtngRawDto row : snapshots) {
                LocalDateTime totDt = toHourBucket(row.getPsgFlowDataCrtDt());
                String depNum = toDepNum(row.getChknIslCd());
                String key = String.join("|", totDt.toString(), row.getTmnlId(), depNum);

                ScOperPrfmncDto dto = grouped.computeIfAbsent(key, k -> {
                    ScOperPrfmncDto d = new ScOperPrfmncDto();
                    d.setTotDt(totDt);
                    d.setTmnlId(row.getTmnlId());
                    d.setDepNum(depNum);
                    return d;
                });
                dto.setWtngPsgCnt(Math.max(dto.getWtngPsgCnt(), row.getWtngLineLen()));

                obsvLaneSet.computeIfAbsent(key, k -> new HashSet<>()).add(row.getFcltNm());
                if (isActive(row, prev)) {
                    operLaneSet.computeIfAbsent(key, k -> new HashSet<>()).add(row.getFcltNm());
                }
                prev = row;
            }
        }

        List<ScOperPrfmncDto> result = new ArrayList<>();
        for (Map.Entry<String, ScOperPrfmncDto> entry : grouped.entrySet()) {
            ScOperPrfmncDto dto = entry.getValue();
            dto.setScObsvCnt(obsvLaneSet.getOrDefault(entry.getKey(), Set.of()).size());
            dto.setScOperCnt(operLaneSet.getOrDefault(entry.getKey(), Set.of()).size());
            result.add(dto);
        }
        result.sort(Comparator.comparing(ScOperPrfmncDto::getTotDt)
                .thenComparing(ScOperPrfmncDto::getTmnlId)
                .thenComparing(ScOperPrfmncDto::getDepNum));
        return result;
    }

    /** prev 는 같은 레인의 직전 스냅샷이다. 하루 첫 행이면 null 을 넘긴다. */
    public static boolean isActive(ScWtngRawDto curr, ScWtngRawDto prev) {
        if (curr.getWtngLineLen() > 0) {
            return true;
        }
        if (prev == null || !isSameYmd(prev.getPsgFlowDataCrtDt(), curr.getPsgFlowDataCrtDt())) {
            return false;
        }
        return curr.getDalyAcmlPsgCnt() > prev.getDalyAcmlPsgCnt();
    }

    /** 원천의 제로패딩('04')을 다른 테이블과 같은 무패딩('4')으로 맞춘다. 숫자가 아니면 null. */
    public static String toDepNum(String chknIslCd) {
        if (chknIslCd == null) {
            return null;
        }
        Matcher matcher = DEP_NUM_PATTERN.matcher(chknIslCd.trim());
        return matcher.matches() ? matcher.group(1) : null;
    }

    public static LocalDateTime toHourBucket(String psgFlowDataCrtDt) {
        int year = Integer.parseInt(psgFlowDataCrtDt.substring(0, 4));
        int month = Integer.parseInt(psgFlowDataCrtDt.substring(4, 6));
        int day = Integer.parseInt(psgFlowDataCrtDt.substring(6, 8));
        int hour = Integer.parseInt(psgFlowDataCrtDt.substring(8, 10));
        return LocalDateTime.of(year, month, day, hour, 0, 0);
    }

    private static boolean isScLane(ScWtngRawDto row) {
        if (!SC_FCLT_TYPE_CD.equals(row.getFcltTypeCd()) || row.getFcltNm() == null) {
            return false;
        }
        if (row.getPsgFlowDataCrtDt() == null || row.getPsgFlowDataCrtDt().length() < CRT_DT_LENGTH) {
            return false;
        }

        String depNum = toDepNum(row.getChknIslCd());
        Integer maxDepNum = MAX_DEP_NUM_BY_TMNL_ID.get(row.getTmnlId());
        return depNum != null && maxDepNum != null && Integer.parseInt(depNum) <= maxDepNum;
    }

    private static boolean isSameYmd(String left, String right) {
        return left != null && right != null && left.length() >= YMD_LENGTH
                && right.regionMatches(0, left, 0, YMD_LENGTH);
    }

    private ScOperPrfmncAggregator() {
    }
}
