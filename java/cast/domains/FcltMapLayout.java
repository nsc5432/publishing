package aoms.pm.cast.domains;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : FcltMapLayout.java
 * @Description : 시설물 매핑 화면 도면 배치 좌표 (도면 무대 기준 비율 %)
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * <b>좌표 테이블이 확인되지 않아(G1) 배치를 코드가 갖는다.</b> {@link MapLayout} 과 같은 이유다.
 *
 * <p>
 * 맵형태보기({@link MapLayout})·출국장({@link DepHallLayout})과 <b>도면 그림이 다르다.</b>
 * 이 화면은 시설 배치를 눈으로 확인하는 자리라 도면을 옅게 깔지 않고 그대로 보여 준다.
 * 그래서 흐림 필터가 들어간 그림 대신 필터가 없는 판을 쓴다 —
 * {@code terminal1-plan-solid.svg} · {@code terminal2-plan-solid.svg}.
 * 그림이 다르면 같은 아일랜드라도 자리가 달라지므로 좌표도 여기서 따로 갖는다.
 * </p>
 *
 * <p>
 * 값은 화면(react {@code api/pm/mock/fcltMap.mock.ts})의 배치 상수와 같아야
 * 마커가 도면 위 같은 자리에 얹힌다. 한쪽만 고치면 어긋난다.
 * </p>
 */
public final class FcltMapLayout {
	private static final String DPTGT_MARKER_PREFIX = "dg";

	/** 출국장 마커 — T1 은 6곳 */
	private static final Map<String, double[]> T1_DEP_POINT_MAP = new LinkedHashMap<>();

	/** 출국장 마커 — T2 는 2곳 */
	private static final Map<String, double[]> T2_DEP_POINT_MAP = new LinkedHashMap<>();

	/** 아일랜드 마커 — T1 (A~N 13곳, I 는 쓰지 않는다) */
	private static final Map<String, double[]> T1_ISLAND_POINT_MAP = new LinkedHashMap<>();

	/** 아일랜드 마커 — T2 (A~N 13곳) */
	private static final Map<String, double[]> T2_ISLAND_POINT_MAP = new LinkedHashMap<>();

	static {
		T1_DEP_POINT_MAP.put("1", new double[] { 82.87, 79.59 });
		T1_DEP_POINT_MAP.put("2", new double[] { 72.69, 69.76 });
		T1_DEP_POINT_MAP.put("3", new double[] { 61.68, 63.50 });
		T1_DEP_POINT_MAP.put("4", new double[] { 38.22, 63.50 });
		T1_DEP_POINT_MAP.put("5", new double[] { 27.16, 69.76 });
		T1_DEP_POINT_MAP.put("6", new double[] { 16.65, 79.59 });

		// T2 는 아일랜드 열 위쪽, 터미널 본동 안
		T2_DEP_POINT_MAP.put("1", new double[] { 62.00, 30.00 });
		T2_DEP_POINT_MAP.put("2", new double[] { 38.00, 30.00 });

		// T1 은 맵형태보기와 건물 윤곽이 거의 같아 같은 값으로 도면 위에 얹힌다
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

		// T2 는 콘코스가 가로로 곧다. 아래 가장자리(가운데 y≒43.8%, 양끝 y≒53%) 안쪽에 둔다
		T2_ISLAND_POINT_MAP.put("N", new double[] { 17.00, 46.00 });
		T2_ISLAND_POINT_MAP.put("M", new double[] { 22.50, 42.50 });
		T2_ISLAND_POINT_MAP.put("L", new double[] { 28.00, 40.50 });
		T2_ISLAND_POINT_MAP.put("K", new double[] { 33.50, 39.50 });
		T2_ISLAND_POINT_MAP.put("J", new double[] { 39.00, 39.00 });
		T2_ISLAND_POINT_MAP.put("H", new double[] { 44.50, 38.80 });
		T2_ISLAND_POINT_MAP.put("G", new double[] { 50.00, 38.80 });
		T2_ISLAND_POINT_MAP.put("F", new double[] { 55.50, 38.80 });
		T2_ISLAND_POINT_MAP.put("E", new double[] { 61.00, 39.00 });
		T2_ISLAND_POINT_MAP.put("D", new double[] { 66.50, 39.50 });
		T2_ISLAND_POINT_MAP.put("C", new double[] { 72.00, 40.50 });
		T2_ISLAND_POINT_MAP.put("B", new double[] { 77.50, 42.50 });
		T2_ISLAND_POINT_MAP.put("A", new double[] { 83.00, 46.00 });
	}

	private FcltMapLayout() {
	}

	/** 그 터미널이 도면에 그리는 출국장 번호 (배치 순서대로) */
	public static List<String> dptgtNoList(TerminalKind tmnlId) {
		return new ArrayList<>(dptgtPointMap(tmnlId).keySet());
	}

	/** 그 터미널이 도면에 그리는 아일랜드 문자 (배치 순서대로) */
	public static List<String> islandCdList(TerminalKind tmnlId) {
		return new ArrayList<>(islandPointMap(tmnlId).keySet());
	}

	/** 출국장 마커 1개 */
	public static MapMarkerDto dptgtMarker(TerminalKind tmnlId, String dptgtNo) {
		return marker(DPTGT_MARKER_PREFIX + dptgtNo, dptgtNo, dptgtPointMap(tmnlId).get(dptgtNo));
	}

	/** 아일랜드 마커 1개 */
	public static MapMarkerDto chknMarker(TerminalKind tmnlId, String island) {
		return marker(island, island, islandPointMap(tmnlId).get(island));
	}

	private static Map<String, double[]> dptgtPointMap(TerminalKind tmnlId) {
		return tmnlId == TerminalKind.T1 ? T1_DEP_POINT_MAP : T2_DEP_POINT_MAP;
	}

	private static Map<String, double[]> islandPointMap(TerminalKind tmnlId) {
		return tmnlId == TerminalKind.T1 ? T1_ISLAND_POINT_MAP : T2_ISLAND_POINT_MAP;
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
