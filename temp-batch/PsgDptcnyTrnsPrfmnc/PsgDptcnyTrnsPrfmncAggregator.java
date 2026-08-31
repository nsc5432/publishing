package batch;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PsgDptcnyTrnsPrfmncAggregator {

    private static final Pattern TRNST_ISTR_ID_PATTERN = Pattern.compile("^ICN([12])D(\\d{3})");
    private static final Map<String, String> TMNL_ID_BY_DIGIT = Map.of("1", "P01", "2", "P03");
    private static final Map<String, Integer> MAX_DPTGT_NO_BY_TMNL_ID = Map.of("P01", 6, "P03", 2);

    public static List<PsgDptcnyTrnsPrfmncDto> aggregate(List<PsgShowInfoDto> rows) {
        Map<String, PsgDptcnyTrnsPrfmncDto> grouped = new LinkedHashMap<>();

        for (PsgShowInfoDto row : rows) {
            if (row.getDptgtEtryYmd() == null || row.getDptgtEtryHm() == null) {
                continue;
            }

            String trnstIstrId = row.getTrnstIstrId();
            Matcher matcher = trnstIstrId == null ? null : TRNST_ISTR_ID_PATTERN.matcher(trnstIstrId);
            if (matcher == null || !matcher.find()) {
                continue;
            }

            String tmnlId = TMNL_ID_BY_DIGIT.get(matcher.group(1));
            int dptgtNo = Integer.parseInt(matcher.group(2));
            if (dptgtNo < 1 || dptgtNo > MAX_DPTGT_NO_BY_TMNL_ID.get(tmnlId)) {
                continue;
            }

            String psgFcltCd = "D" + dptgtNo;
            String totYmd = row.getDptgtEtryYmd();
            String totTm = row.getDptgtEtryHm().substring(0, 2);
            String totMnt = "00";
            String key = String.join("|", totYmd, totTm, totMnt, tmnlId, psgFcltCd,
                    row.getFltnm());

            PsgDptcnyTrnsPrfmncDto dto = grouped.computeIfAbsent(key, k -> {
                PsgDptcnyTrnsPrfmncDto d = new PsgDptcnyTrnsPrfmncDto();
                d.setTotYmd(totYmd);
                d.setTotTm(totTm);
                d.setTotMnt(totMnt);
                d.setTmnlId(tmnlId);
                d.setPsgFcltCd(psgFcltCd);
                d.setFltnm(row.getFltnm());
                return d;
            });
            dto.setBdpsgPrcsCnt(dto.getBdpsgPrcsCnt() + 1);
        }

        return new ArrayList<>(grouped.values());
    }

    private PsgDptcnyTrnsPrfmncAggregator() {
    }
}
