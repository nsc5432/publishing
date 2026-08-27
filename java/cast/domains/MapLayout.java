package aoms.pm.cast.domains;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : MapLayout.java
 * @Description : 도면 마커 배치 좌표 (도면 무대 기준 비율 %)
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class MapLayout {
	private static final String DPTGT_MARKER_PREFIX = "dg";
	private static final String GATE_MARKER_PREFIX = "g";

	/** 출국장 마커 — T1 은 6곳 */
	private static final Map<String, double[]> T1_DEP_POINT_MAP = new LinkedHashMap<>();

	/** 출국장 마커 — T2 는 T1 의 가운데 두 자리만 쓴다 */
	private static final Map<String, double[]> T2_DEP_POINT_MAP = new LinkedHashMap<>();

	/** 아일랜드 마커 — T1 (A~N 13곳, I 는 쓰지 않는다) */
	private static final Map<String, double[]> T1_ISLAND_POINT_MAP = new LinkedHashMap<>();

	/**
	 * 아일랜드 마커 — T2 (A~N 13곳).
	 * T2 도면의 콘코스는 T1 아치보다 낮고 완만해 좌표를 따로 잡는다.
	 */
	private static final Map<String, double[]> T2_ISLAND_POINT_MAP = new LinkedHashMap<>();

	/** 출입구 게이트 마커 — 두 터미널 공통 배치 */
	private static final Map<String, double[]> GATE_POINT_MAP = new LinkedHashMap<>();

	static {
		T1_DEP_POINT_MAP.put("1", new double[] { 82.87, 79.59 });
		T1_DEP_POINT_MAP.put("2", new double[] { 72.69, 69.76 });
		T1_DEP_POINT_MAP.put("3", new double[] { 61.68, 63.50 });
		T1_DEP_POINT_MAP.put("4", new double[] { 38.22, 63.50 });
		T1_DEP_POINT_MAP.put("5", new double[] { 27.16, 69.76 });
		T1_DEP_POINT_MAP.put("6", new double[] { 16.65, 79.59 });

		T2_DEP_POINT_MAP.put("1", new double[] { 61.68, 63.50 });
		T2_DEP_POINT_MAP.put("2", new double[] { 38.22, 63.50 });

		T1_ISLAND_POINT_MAP.put("N", new double[] { 19.21, 90.68 });
		T1_ISLAND_POINT_MAP.put("M", new double[] { 22.93, 87.19 });
		T1_ISLAND_POINT_MAP.put("L", new double[] { 27.16, 82.46 });
		T1_ISLAND_POINT_MAP.put("K", new double[] { 31.94, 78.79 });
		T1_ISLAND_POINT_MAP.put("J", new double[] { 36.55, 76.02 });
		T1_ISLAND_POINT_MAP.put("H", new double[] { 41.94, 74.23 });
		T1_ISLAND_POINT_MAP.put("G", new double[] { 53.18, 73.34 });
		T1_ISLAND_POINT_MAP.put("F", new double[] { 58.12, 74.23 });
		T1_ISLAND_POINT_MAP.put("E", new double[] { 63.07, 76.02 });
		T1_ISLAND_POINT_MAP.put("D", new double[] { 67.91, 78.52 });
		T1_ISLAND_POINT_MAP.put("C", new double[] { 72.80, 82.19 });
		T1_ISLAND_POINT_MAP.put("B", new double[] { 77.14, 86.30 });
		T1_ISLAND_POINT_MAP.put("A", new double[] { 80.75, 90.68 });

		// T2 도면의 콘코스 띠(가운데 y≒78%, 양끝 y≒90%)를 따라 x 19~81% 에 균등 배치.
		// T1 아치는 가운데가 y≒73% 라 5%p 쯤 위로 떠서 맞지 않는다.
		T2_ISLAND_POINT_MAP.put("N", new double[] { 19.00, 89.80 });
		T2_ISLAND_POINT_MAP.put("M", new double[] { 24.20, 85.50 });
		T2_ISLAND_POINT_MAP.put("L", new double[] { 29.30, 82.40 });
		T2_ISLAND_POINT_MAP.put("K", new double[] { 34.50, 80.10 });
		T2_ISLAND_POINT_MAP.put("J", new double[] { 39.70, 78.90 });
		T2_ISLAND_POINT_MAP.put("H", new double[] { 44.80, 78.20 });
		T2_ISLAND_POINT_MAP.put("G", new double[] { 50.00, 78.00 });
		T2_ISLAND_POINT_MAP.put("F", new double[] { 55.20, 78.20 });
		T2_ISLAND_POINT_MAP.put("E", new double[] { 60.30, 78.90 });
		T2_ISLAND_POINT_MAP.put("D", new double[] { 65.50, 80.20 });
		T2_ISLAND_POINT_MAP.put("C", new double[] { 70.70, 82.30 });
		T2_ISLAND_POINT_MAP.put("B", new double[] { 75.80, 85.40 });
		T2_ISLAND_POINT_MAP.put("A", new double[] { 81.00, 89.50 });

		GATE_POINT_MAP.put("14", new double[] { 21.37, 97.12 });
		GATE_POINT_MAP.put("13", new double[] { 25.21, 92.29 });
		GATE_POINT_MAP.put("12", new double[] { 29.71, 88.27 });
		GATE_POINT_MAP.put("11", new double[] { 33.72, 84.87 });
		GATE_POINT_MAP.put("10", new double[] { 38.50, 82.46 });
		GATE_POINT_MAP.put("9", new double[] { 42.83, 80.85 });
		GATE_POINT_MAP.put("8", new double[] { 47.39, 79.86 });
		GATE_POINT_MAP.put("7", new double[] { 52.40, 79.86 });
		GATE_POINT_MAP.put("6", new double[] { 56.96, 80.85 });
		GATE_POINT_MAP.put("5", new double[] { 61.46, 82.72 });
		GATE_POINT_MAP.put("4", new double[] { 66.27, 85.23 });
		GATE_POINT_MAP.put("3", new double[] { 70.24, 88.53 });
		GATE_POINT_MAP.put("2", new double[] { 74.75, 92.38 });
		GATE_POINT_MAP.put("1", new double[] { 78.53, 97.12 });
	}

	private MapLayout() {
	}

	/** 그 터미널이 도면에 그리는 출국장 번호 (배치 순서대로) */
	public static List<String> dptgtNoList(TerminalKind tmnlId) {
		return new ArrayList<>(dptgtPointMap(tmnlId).keySet());
	}

	/** 그 터미널이 도면에 그리는 아일랜드 문자 (배치 순서대로) */
	public static List<String> islandCdList(TerminalKind tmnlId) {
		return new ArrayList<>(islandPointMap(tmnlId).keySet());
	}

	/** 출국장 마커 1개. 자리·표시 문구만 준다 (혼잡도는 슬롯이 갖는다) */
	public static MapMarkerDto dptgtMarker(TerminalKind tmnlId, String dptgtNo) {
		double[] point = dptgtPointMap(tmnlId).get(dptgtNo);

		return toMarker(DPTGT_MARKER_PREFIX + dptgtNo, dptgtNo, point);
	}

	/** 아일랜드 마커 1개. 자리·표시 문구만 준다 (혼잡도는 슬롯이 갖는다) */
	public static MapMarkerDto chknMarker(TerminalKind tmnlId, String islandCd) {
		return toMarker(islandCd, islandCd, islandPointMap(tmnlId).get(islandCd));
	}

	/** 출입구 게이트 마커 전체. 게이트는 혼잡도를 내려주지 않는다 */
	public static List<MapMarkerDto> gateMarkerList() {
		List<MapMarkerDto> result = new ArrayList<>();

		for (Map.Entry<String, double[]> entry : GATE_POINT_MAP.entrySet()) {
			result.add(toMarker(GATE_MARKER_PREFIX + entry.getKey(), entry.getKey(), entry.getValue()));
		}

		return result;
	}

	private static Map<String, double[]> dptgtPointMap(TerminalKind tmnlId) {
		return tmnlId == TerminalKind.T1 ? T1_DEP_POINT_MAP : T2_DEP_POINT_MAP;
	}

	private static Map<String, double[]> islandPointMap(TerminalKind tmnlId) {
		return tmnlId == TerminalKind.T1 ? T1_ISLAND_POINT_MAP : T2_ISLAND_POINT_MAP;
	}

	// 배치에 없는 식별자는 도면 밖(0,0)이 아니라 좌표 없는 마커로 내려 화면이 걸러내게 둔다
	private static MapMarkerDto toMarker(String markerId, String label, double[] point) {
		MapMarkerDto result = new MapMarkerDto().withMarkerId(markerId).withLabel(label);

		if (point != null) {
			result.withCdntX(point[0]).withCdntY(point[1]);
		}

		return result;
	}
}
