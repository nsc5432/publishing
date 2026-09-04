package aoms.pm.cast.enums;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import lombok.Getter;

@Getter
public enum CastConfigGroup {
	CHECKIN("checkin", "체크인 영역", "Check-in Facility Group", "여객 체크인 관련 고정속성", roots("01", "02", "03", "04", "13"), true),
	DEPARTURE("departure", "출국장 영역", "Departure Hall Facility Group", "여객 발생·이동 관련 고정속성", roots("05", "06", "17"), false),
	SECURITY("security", "시큐리티 영역", "Security Facility Group", "보안검색 관련 고정속성", roots("07", "15", "16"), false),
	BORDER("border", "출입국심사 영역", "Border Control Facility Group", "출입국·세관 관련 고정속성", roots("08", "09", "18", "19", "20"), false),
	GATE("gate", "게이트 영역", "Gate Facility Group", "환승·게이트 관련 고정속성", roots("10", "11", "12", "14"), false);

	private final String groupId;
	private final String groupNm;
	private final String groupNmEn;
	private final String groupDesc;
	private final Map<CastConfigSheet, Set<String>> rootCdMap;

	CastConfigGroup(
			String groupId,
			String groupNm,
			String groupNmEn,
			String groupDesc,
			Set<String> rootCdSet,
			boolean cknctType
	) {
		this.groupId = groupId;
		this.groupNm = groupNm;
		this.groupNmEn = groupNmEn;
		this.groupDesc = groupDesc;
		Map<CastConfigSheet, Set<String>> filters = new EnumMap<>(CastConfigSheet.class);
		filters.put(CastConfigSheet.PSG_ATRB, rootCdSet);
		filters.put(CastConfigSheet.SHOW_UP_ATRB, rootCdSet);
		filters.put(CastConfigSheet.SRVC_ATRB, rootCdSet);

		if (cknctType) {
			// 항공사 단위라 걸러 낼 상위코드가 없다. 빈 Set 이 곧 "필터 없음"이다
			filters.put(CastConfigSheet.CKNCT_TYPE_ATRB, Set.of());
		}

		this.rootCdMap = Collections.unmodifiableMap(filters);
	}

	public boolean supports(CastConfigSheet sheet) {
		return rootCdMap.containsKey(sheet);
	}

	public Set<String> getRootCdSet(CastConfigSheet sheet) {
		return rootCdMap.getOrDefault(sheet, Set.of());
	}

	public static CastConfigGroup fromGroupId(String groupId) {
		return Arrays.stream(values())
				.filter(group -> group.groupId.equals(groupId))
				.findFirst()
				.orElse(null);
	}

	private static Set<String> roots(String... roots) {
		return Set.of(roots);
	}
}
