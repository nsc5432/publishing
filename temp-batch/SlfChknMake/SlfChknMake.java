package batch;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SlfChknMake {

    private static final Pattern YMD_PATTERN = Pattern.compile("\\d{8}");
    private static final DateTimeFormatter YMD_FORMATTER = DateTimeFormatter
            .ofPattern("uuuuMMdd")
            .withResolverStyle(ResolverStyle.STRICT);

    private final SlfChknOperPlcyMapper slfChknOperPlcyMapper;

    @Transactional(rollbackFor = Exception.class)
    public void make(String ymd) {
        validateYmd(ymd);

        int overlengthCount = slfChknOperPlcyMapper.countOverlengthIstrId(ymd);
        if (overlengthCount > 0) {
            throw new IllegalStateException(
                    "CHKN_ISTR_NO exceeds 10 characters for PSG_TRNSP_YMD: " + ymd);
        }

        slfChknOperPlcyMapper.upsert(ymd);
        slfChknOperPlcyMapper.deleteMissing(ymd);
    }

    private static void validateYmd(String ymd) {
        if (ymd == null || !YMD_PATTERN.matcher(ymd).matches()) {
            throw new IllegalArgumentException("ymd must be a valid yyyyMMdd value: " + ymd);
        }

        try {
            LocalDate.parse(ymd, YMD_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("ymd must be a valid yyyyMMdd value: " + ymd,
                    exception);
        }
    }
}
