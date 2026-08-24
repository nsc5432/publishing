package aoms.pm.utils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DateUtils {
	private static final String YYYY_MM_DD = "yyyyMMdd";
	private DateUtils() {
		throw new UnsupportedOperationException("DateUtils Class is Utility class.");
	}
	
	public static LocalDate strToDate(String strDate) {
		return LocalDate.parse(strDate, DateTimeFormatter.ofPattern(YYYY_MM_DD));
	}
	
	public static String dateToStr(LocalDate date) {
		return date.format(DateTimeFormatter.ofPattern(YYYY_MM_DD));
	}
	
	public static String dateToStr(LocalDateTime dateTime) {
		return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
	}
	
	public static LocalDate strToLocalDate(String yyyyMMdd) {
		int yyyy = Integer.parseInt(yyyyMMdd.substring(0, 4));
		int mm = Integer.parseInt(yyyyMMdd.substring(4, 6));
		int dd = Integer.parseInt(yyyyMMdd.substring(6, 8));
		return LocalDate.of(yyyy, mm, dd);
	}
	
	public static LocalTime strToLocalTime(String hhMi) {
		int hh = Integer.parseInt(hhMi.substring(0, 2));
		int mi = Integer.parseInt(hhMi.substring(2, 4));
		return LocalTime.of(hh, mi);
	}
	
	public static LocalDateTime strToLocalDateTime(String strDate) {
		return LocalDateTime.of(strToLocalDate(strDate.substring(0, 8)), strToLocalTime(strDate.substring(8)));
	}
	
	public static long diffMinutes(String yyyyMMddhh24mi1, String yyyyMMddhh24mi2) {
		return Duration.between(strToLocalDateTime(yyyyMMddhh24mi1), strToLocalDateTime(yyyyMMddhh24mi2)).toMinutes();
	}

	public static String generateEsbDateandtime() {
		String r = "";
		
		try {
			Thread.sleep(10); // 키값이 시간이므로 Unique Constraint 방지
			r = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss.SSS"));
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			log.error("작업이 중단되었습니다.", e);
		}
		
		return r;
	}
	
	public static String timeFormat(String time) {
		return time.substring(0, 2) + ":" + time.substring(2);
	}
	
	public static String toKoreanShortDate(String yyyyMMdd) {
    	DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern(YYYY_MM_DD);
    	DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("MM.dd(E)");
    	LocalDate date = LocalDate.parse(yyyyMMdd, inputFormatter);
    	return date.format(outputFormatter);
    }
}
