package aoms.pm.cast.domains.wtng;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @Classname : FcltWtngScope.java
 * @Description : 저장 단위 (실행/모델/터미널/시설유형) 의 기대 시설/범위와 10분 통계
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class FcltWtngScope {
	private final List<String> unitCdList;
	private final LocalDateTime rangeStart;
	private final LocalDateTime rangeEnd;
	private final Map<String, List<FcltWtngSec>> secMap;

	public FcltWtngScope(List<String> unitCdList, LocalDateTime rangeStart, LocalDateTime rangeEnd, Map<String, List<FcltWtngSec>> secMap) {
		this.unitCdList = new ArrayList<>(unitCdList);
		this.rangeStart = rangeStart;
		this.rangeEnd = rangeEnd;
		this.secMap = new LinkedHashMap<>(secMap);
	}

	public List<String> getUnitCdList() {
		return Collections.unmodifiableList(unitCdList);
	}

	public LocalDateTime getRangeStart() {
		return rangeStart;
	}

	public LocalDateTime getRangeEnd() {
		return rangeEnd;
	}

	public Map<String, List<FcltWtngSec>> getSecMap() {
		return Collections.unmodifiableMap(secMap);
	}

	/** 기대 시설마다 범위 안의 10분 행이 빠짐없이 있는지. 완전하면 null */
	public String findGapOf(Map<String, List<FcltWtngSec>> candidate) {
		return FcltWtngSecs.findGap(candidate, unitCdList, rangeStart, rangeEnd);
	}

	public boolean hasSameRange(FcltWtngScope other) {
		return unitCdList.size() == other.unitCdList.size()
				&& unitCdList.containsAll(other.unitCdList)
				&& rangeStart.equals(other.rangeStart)
				&& rangeEnd.equals(other.rangeEnd);
	}
}
