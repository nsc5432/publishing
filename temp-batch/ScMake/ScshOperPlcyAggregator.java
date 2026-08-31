package batch;

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

public final class ScshOperPlcyAggregator {

    private static final String SCSH_FCLT_TYPE_CD = "SC";
    private static final String FCLT_ALOT_YN = "Y";
    private static final Pattern DPTGT_NO_PATTERN = Pattern.compile("^0*([1-9]\\d*)$");
    private static final Map<String, Integer> MAX_DPTGT_NO_BY_TMNL_ID = Map.of("P01", 6, "P03", 2);
    private static final int CRT_DT_LENGTH = 12;

    public static List<ScshOperPlcyDto> aggregate(List<ScshWtngRawDto> rows) {
        Map<String, ScshOperPlcyDto> grouped = new LinkedHashMap<>();
        Map<String, Set<String>> allocatedFcltSet = new HashMap<>();

        for (ScshWtngRawDto row : rows) {
            if (!isScshFclt(row)) {
                continue;
            }

            String operYmd = row.getPsgFlowDataCrtDt().substring(0, 8);
            int operHour = Integer.parseInt(row.getPsgFlowDataCrtDt().substring(8, 10));
            String dptgtNo = toDptgtNo(row.getChknIslCd());
            String key = String.join("|", operYmd, Integer.toString(operHour), row.getTmnlId(),
                    dptgtNo);

            grouped.computeIfAbsent(key, k -> {
                ScshOperPlcyDto dto = new ScshOperPlcyDto();
                dto.setOperYmd(operYmd);
                dto.setOperHour(operHour);
                dto.setTmnlId(row.getTmnlId());
                dto.setDptgtNo(dptgtNo);
                return dto;
            });

            if (FCLT_ALOT_YN.equals(row.getFcltAlotYn())) {
                allocatedFcltSet.computeIfAbsent(key, k -> new HashSet<>()).add(row.getFcltNm());
            }
        }

        List<ScshOperPlcyDto> result = new ArrayList<>();
        for (Map.Entry<String, ScshOperPlcyDto> entry : grouped.entrySet()) {
            ScshOperPlcyDto dto = entry.getValue();
            dto.setScshOperCntom(allocatedFcltSet.getOrDefault(entry.getKey(), Set.of()).size());
            result.add(dto);
        }
        result.sort(Comparator.comparing(ScshOperPlcyDto::getOperYmd)
                .thenComparingInt(ScshOperPlcyDto::getOperHour)
                .thenComparing(ScshOperPlcyDto::getTmnlId)
                .thenComparing(ScshOperPlcyDto::getDptgtNo));
        return result;
    }

    public static String toDptgtNo(String chknIslCd) {
        if (chknIslCd == null) {
            return null;
        }
        Matcher matcher = DPTGT_NO_PATTERN.matcher(chknIslCd.trim());
        return matcher.matches() ? matcher.group(1) : null;
    }

    private static boolean isScshFclt(ScshWtngRawDto row) {
        if (!SCSH_FCLT_TYPE_CD.equals(row.getFcltTypeCd()) || row.getFcltNm() == null) {
            return false;
        }
        if (row.getPsgFlowDataCrtDt() == null || row.getPsgFlowDataCrtDt().length() < CRT_DT_LENGTH) {
            return false;
        }

        String dptgtNo = toDptgtNo(row.getChknIslCd());
        Integer maxDptgtNo = MAX_DPTGT_NO_BY_TMNL_ID.get(row.getTmnlId());
        return dptgtNo != null && maxDptgtNo != null && Integer.parseInt(dptgtNo) <= maxDptgtNo;
    }

    private ScshOperPlcyAggregator() {
    }
}
