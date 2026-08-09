package aoms.pm.cast.domains;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : DepHallLayout.java
 * @Description : 출국장 화면 도면 배치 좌표 (도면 무대 기준 비율 %)
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
 *
 * <b>좌표 테이블이 확인되지 않아(G1) 배치를 코드가 갖는다.</b> {@link MapLayout} 과 같은 이유다.
 * 결과 테이블에서는 혼잡도·지표만 채우고 위치는 여기서 온다.
 *
 * <p>
 * 맵형태보기({@link MapLayout})와 도면이 달라 좌표를 따로 갖는다. 출국장 화면은 T2 도면이
 * 별도로 그려져 있어 아일랜드·출입구 게이트 배치가 T1 과 다르다 (게이트도 12곳뿐이다).
 * </p>
 *
 * <p>
 * 값은 화면(react {@code departureHall/mock.ts})의 배치 상수와 같아야 마커·카드가
 * 도면 위 같은 자리에 얹힌다. 한쪽만 고치면 어긋난다.
 * </p>
 */
public final class DepHallLayout {
	private static final String DEP_MARKER_PREFIX = "dg";
	private static final String GATE_MARKER_PREFIX = "g";

	/** 출국장 마커 — T1 은 6곳 */
	private static final Map<String, double[]> T1_DEP_POINT_MAP = new LinkedHashMap<>();

	/** 출국장 마커 — T2 는 2곳 */
	private static final Map<String, double[]> T2_DEP_POINT_MAP = new LinkedHashMap<>();

	/** 출국장 카드 자리 — 마커와 별개다 (T1 은 무대를 6등분한 자리에 아치를 따라 세운다) */
	private static final Map<String, double[]> T1_CARD_POINT_MAP = new LinkedHashMap<>();

	private static final Map<String, double[]> T2_CARD_POINT_MAP = new LinkedHashMap<>();

	/** 아일랜드 마커 */
	private static final Map<String, double[]> T1_ISLAND_POINT_MAP = new LinkedHashMap<>();

	private static final Map<String, double[]> T2_ISLAND_POINT_MAP = new LinkedHashMap<>();

	/** 출입구 게이트 마커 — T1 은 14곳, T2 는 12곳 */
	private static final Map<String, double[]> T1_GATE_POINT_MAP = new LinkedHashMap<>();

	private static final Map<String, double[]> T2_GATE_POINT_MAP = new LinkedHashMap<>();

	static {
		T1_DEP_POINT_MAP.put("6", new double[] { 16.65, 79.59 });
		T1_DEP_POINT_MAP.put("5", new double[] { 27.16, 69.76 });
		T1_DEP_POINT_MAP.put("4", new double[] { 38.22, 63.50 });
		T1_DEP_POINT_MAP.put("3", new double[] { 61.68, 63.50 });
		T1_DEP_POINT_MAP.put("2", new double[] { 72.69, 69.76 });
		T1_DEP_POINT_MAP.put("1", new double[] { 82.87, 79.59 });

		T2_DEP_POINT_MAP.put("2", new double[] { 36.95, 68.62 });
		T2_DEP_POINT_MAP.put("1", new double[] { 63.05, 68.62 });

		T1_CARD_POINT_MAP.put("6", new double[] { 8.33, 67.50 });
		T1_CARD_POINT_MAP.put("5", new double[] { 25.00, 51.30 });
		T1_CARD_POINT_MAP.put("4", new double[] { 41.67, 45.00 });
		T1_CARD_POINT_MAP.put("3", new double[] { 58.33, 45.00 });
		T1_CARD_POINT_MAP.put("2", new double[] { 75.00, 51.30 });
		T1_CARD_POINT_MAP.put("1", new double[] { 91.67, 67.50 });

		T2_CARD_POINT_MAP.put("2", new double[] { 36.95, 45.00 });
		T2_CARD_POINT_MAP.put("1", new double[] { 63.05, 45.00 });

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

		T2_ISLAND_POINT_MAP.put("N", new double[] { 17.81, 89.63 });
		T2_ISLAND_POINT_MAP.put("M", new double[] { 22.26, 86.83 });
		T2_ISLAND_POINT_MAP.put("L", new double[] { 27.55, 84.94 });
		T2_ISLAND_POINT_MAP.put("K", new double[] { 32.78, 83.05 });
		T2_ISLAND_POINT_MAP.put("J", new double[] { 38.01, 81.70 });
		T2_ISLAND_POINT_MAP.put("H", new double[] { 43.18, 80.34 });
		T2_ISLAND_POINT_MAP.put("G", new double[] { 48.41, 79.80 });
		T2_ISLAND_POINT_MAP.put("F", new double[] { 56.15, 79.80 });
		T2_ISLAND_POINT_MAP.put("E", new double[] { 61.49, 80.34 });
		T2_ISLAND_POINT_MAP.put("D", new double[] { 66.83, 81.24 });
		T2_ISLAND_POINT_MAP.put("C", new double[] { 72.18, 82.96 });
		T2_ISLAND_POINT_MAP.put("B", new double[] { 77.57, 84.76 });
		T2_ISLAND_POINT_MAP.put("A", new double[] { 82.08, 86.83 });

		T1_GATE_POINT_MAP.put("14", new double[] { 21.37, 97.12 });
		T1_GATE_POINT_MAP.put("13", new double[] { 25.21, 92.29 });
		T1_GATE_POINT_MAP.put("12", new double[] { 29.71, 88.27 });
		T1_GATE_POINT_MAP.put("11", new double[] { 33.72, 84.87 });
		T1_GATE_POINT_MAP.put("10", new double[] { 38.50, 82.46 });
		T1_GATE_POINT_MAP.put("9", new double[] { 42.83, 80.85 });
		T1_GATE_POINT_MAP.put("8", new double[] { 47.39, 79.86 });
		T1_GATE_POINT_MAP.put("7", new double[] { 52.40, 79.86 });
		T1_GATE_POINT_MAP.put("6", new double[] { 56.96, 80.85 });
		T1_GATE_POINT_MAP.put("5", new double[] { 61.46, 82.72 });
		T1_GATE_POINT_MAP.put("4", new double[] { 66.27, 85.23 });
		T1_GATE_POINT_MAP.put("3", new double[] { 70.24, 88.53 });
		T1_GATE_POINT_MAP.put("2", new double[] { 74.75, 92.38 });
		T1_GATE_POINT_MAP.put("1", new double[] { 78.53, 97.12 });

		T2_GATE_POINT_MAP.put("12", new double[] { 23.10, 96.39 });
		T2_GATE_POINT_MAP.put("11", new double[] { 27.97, 94.23 });
		T2_GATE_POINT_MAP.put("10", new double[] { 32.86, 92.88 });
		T2_GATE_POINT_MAP.put("9", new double[] { 37.75, 91.34 });
		T2_GATE_POINT_MAP.put("8", new double[] { 42.65, 90.31 });
		T2_GATE_POINT_MAP.put("7", new double[] { 47.55, 90.26 });
		T2_GATE_POINT_MAP.put("6", new double[] { 52.45, 90.26 });
		T2_GATE_POINT_MAP.put("5", new double[] { 57.35, 90.31 });
		T2_GATE_POINT_MAP.put("4", new double[] { 62.25, 91.34 });
		T2_GATE_POINT_MAP.put("3", new double[] { 67.14, 92.88 });
		T2_GATE_POINT_MAP.put("2", new double[] { 72.03, 94.23 });
		T2_GATE_POINT_MAP.put("1", new double[] { 76.90, 96.39 });
	}

	private DepHallLayout() {
	}

	/** 그 터미널이 도면에 그리는 출국장 번호 (배치 순서대로) */
	public static List<String> depNumList(TerminalKind tmnlId) {
		return new ArrayList<>(depPointMap(tmnlId).keySet());
	}

	/** 출국장 마커 1개. 혼잡도는 호출부가 채운다 */
	public static MapMarkerDto depMarker(TerminalKind tmnlId, String depNum) {
		return marker(DEP_MARKER_PREFIX + depNum, depNum, depPointMap(tmnlId).get(depNum));
	}

	/** 출국장 카드 자리 {x, y}. 배치에 없으면 null */
	public static double[] cardPoint(TerminalKind tmnlId, String depNum) {
		return (tmnlId == TerminalKind.T1 ? T1_CARD_POINT_MAP : T2_CARD_POINT_MAP).get(depNum);
	}

	/** 아일랜드 마커 전체. 혼잡도는 호출부가 채운다 */
	public static List<MapMarkerDto> islandMarkerList(TerminalKind tmnlId) {
		return markerList(tmnlId == TerminalKind.T1 ? T1_ISLAND_POINT_MAP : T2_ISLAND_POINT_MAP, "");
	}

	/** 출입구 게이트 마커 전체. 게이트는 혼잡도를 내려주지 않는다 */
	public static List<MapMarkerDto> gateMarkerList(TerminalKind tmnlId) {
		return markerList(tmnlId == TerminalKind.T1 ? T1_GATE_POINT_MAP : T2_GATE_POINT_MAP,
				GATE_MARKER_PREFIX);
	}

	private static Map<String, double[]> depPointMap(TerminalKind tmnlId) {
		return tmnlId == TerminalKind.T1 ? T1_DEP_POINT_MAP : T2_DEP_POINT_MAP;
	}

	private static List<MapMarkerDto> markerList(Map<String, double[]> pointMap, String prefix) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (Map.Entry<String, double[]> entry : pointMap.entrySet()) {
			result.add(marker(prefix + entry.getKey(), entry.getKey(), entry.getValue()));
		}

		return result;
	}

	// 배치에 없는 식별자는 도면 밖(0,0)이 아니라 좌표 없는 마커로 내려 화면이 걸러내게 둔다
	private static MapMarkerDto marker(String markerId, String label, double[] point) {
		MapMarkerDto result = new MapMarkerDto().withMarkerId(markerId).withLabel(label);

		if (point != null) {
			result.withCdntX(point[0]).withCdntY(point[1]);
		}

		return result;
	}
}
