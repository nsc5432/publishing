package batch;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 여객출현정보(PsgShowInfoDto) 원본 행을 여객출국환승실적(TOT_DT·TMNL_ID·PSG_FCLT_CD·FLTNM
 * 시간당 탑승객처리수) 단위로 집계한다.
 *
 * <p>
 * PSG_FCLT_CD는 TRNST_ISTR_ID 앞부분(ICN + 터미널숫자 + D + 출국장번호 3자리)에서 뽑는다.
 * 제1터미널(P01)은 D1~D6, 제2터미널(P03)은 D1~D2만 유효하고, 그 외 패턴(예: ICN1DF05DK01)이거나
 * 출국장 미진입(DPTGT_ETRY_YMD/HM 없음) 행은 집계에서 뺀다.
 * </p>
 */
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
            LocalDateTime totDt = toHourBucket(row.getDptgtEtryYmd(), row.getDptgtEtryHm());
            String key = String.join("|", totDt.toString(), tmnlId, psgFcltCd, row.getFltnm());

            PsgDptcnyTrnsPrfmncDto dto = grouped.computeIfAbsent(key, k -> {
                PsgDptcnyTrnsPrfmncDto d = new PsgDptcnyTrnsPrfmncDto();
                d.setTotDt(totDt);
                d.setTmnlId(tmnlId);
                d.setPsgFcltCd(psgFcltCd);
                d.setFltnm(row.getFltnm());
                return d;
            });
            dto.setBdpsgPrcsCnt(dto.getBdpsgPrcsCnt() + 1);
        }

        return new ArrayList<>(grouped.values());
    }

    private static LocalDateTime toHourBucket(String ymd, String hm) {
        int year = Integer.parseInt(ymd.substring(0, 4));
        int month = Integer.parseInt(ymd.substring(4, 6));
        int day = Integer.parseInt(ymd.substring(6, 8));
        int hour = Integer.parseInt(hm.substring(0, 2));
        return LocalDateTime.of(year, month, day, hour, 0, 0);
    }

    private PsgDptcnyTrnsPrfmncAggregator() {
    }
}
