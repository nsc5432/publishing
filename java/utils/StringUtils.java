package aoms.pm.utils;

import java.util.function.Predicate;
import java.util.regex.Pattern;

public class StringUtils {
	private StringUtils() {
		throw new UnsupportedOperationException("StringUtils Class is Utility class.");
	}
	
	public static String concat(String ...strings) {
		StringBuilder sb = new StringBuilder();
		
		for (String str : strings) {
			sb.append(str == null ? "" : str);
		}
		
		return sb.length() == 0 ? null : sb.toString();
	}
	
	public static String removeTrailingZeros(String str) {
		if (str == null || !str.contains(".")) {
			return str;
		}
		
		int i = str.length() - 1;
		while (i >= 0 && str.charAt(i) == '0') {
			i--;
		}
		
		// 마지막이 '.' 으로 끝나면 점까지 제거
		if (i >= 0 && str.charAt(i) == '.') {
			i--;
		}
		
		return str.substring(0, i + 1);
	}
	
	public static boolean isMatchPatternLike(String pattern, String target) { 
        if (pattern == null) {
            return false;
        }
        
		// SQL 문의 Like 와 같은 역할
		String regex = "^" + pattern.replace("_", ".").replace("%", ".*");
		Predicate<String> pred = s -> Pattern.compile(regex).matcher(s).find();
		return pred.test(target);
	}
}
