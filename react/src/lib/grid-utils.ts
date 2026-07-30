import { GRID_COLUMNS, GRID_ROWS, type GridCoordinate, type ParsedCoordinate } from '@/types/api.types';

/**
 * 그리드 좌표 문자열을 파싱하여 열/행 인덱스 반환
 * @param coord - 좌표 문자열 (예: "M2-05")
 * @returns 파싱된 좌표 정보 또는 null (유효하지 않은 경우)
 */
export function parseCoordinate(coord: GridCoordinate): ParsedCoordinate | null {
    const match = coord?.match(/^([EMWH][1-4])-(\d{2})$/);
    if (!match) return null;

    const [, colLabel, rowLabel] = match;
    const col = GRID_COLUMNS.indexOf(colLabel as (typeof GRID_COLUMNS)[number]);
    const row = parseInt(rowLabel, 10) - 1;

    if (col === -1 || row < 0 || row >= GRID_ROWS.length) {
        return null;
    }

    return { col, row, colLabel, rowLabel };
}

/**
 * 열/행 인덱스로부터 그리드 좌표 문자열 생성
 * @param col - 열 인덱스 (0-11)
 * @param row - 행 인덱스 (0-16)
 * @returns 좌표 문자열 (예: "M2-05") 또는 null (유효하지 않은 경우)
 */
export function createCoordinate(col: number, row: number): GridCoordinate | null {
    if (col < 0 || col >= GRID_COLUMNS.length || row < 0 || row >= GRID_ROWS.length) {
        return null;
    }
    return `${GRID_COLUMNS[col]}-${GRID_ROWS[row]}`;
}

/**
 * 픽셀 위치를 그리드 셀 좌표로 변환
 * @param x - 마우스 X 위치 (그리드 컨테이너 기준 상대 좌표)
 * @param y - 마우스 Y 위치 (그리드 컨테이너 기준 상대 좌표)
 * @param gridWidth - 그리드 전체 너비 (픽셀)
 * @param gridHeight - 그리드 전체 높이 (픽셀)
 * @returns 그리드 좌표 또는 null (범위 밖인 경우)
 */
export function pixelToGridCoord(
    x: number,
    y: number,
    gridWidth: number,
    gridHeight: number
): GridCoordinate | null {
    const cellWidth = gridWidth / GRID_COLUMNS.length;
    const cellHeight = gridHeight / GRID_ROWS.length;

    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    return createCoordinate(col, row);
}

/**
 * 그리드 좌표를 픽셀 위치로 변환 (셀의 왼쪽 상단 코너)
 * @param coord - 그리드 좌표 문자열
 * @param gridWidth - 그리드 전체 너비 (픽셀)
 * @param gridHeight - 그리드 전체 높이 (픽셀)
 * @returns { x, y } 픽셀 좌표 또는 null (유효하지 않은 좌표)
 */
export function gridCoordToPixel(
    coord: GridCoordinate,
    gridWidth: number,
    gridHeight: number
): { x: number; y: number } | null {
    const parsed = parseCoordinate(coord);
    if (!parsed) return null;

    const cellWidth = gridWidth / GRID_COLUMNS.length;
    const cellHeight = gridHeight / GRID_ROWS.length;

    return {
        x: parsed.col * cellWidth + cellWidth / 2,
        y: parsed.row * cellHeight + cellHeight / 2,
    };
}

// ============================================================================
// 좌표 변환 시스템 (인천공항 T1 기준)
// ============================================================================
//
// 인천공항 T1 터미널은 원호(arc) 형태로 곡선 배치되어 있어
// 단순 위도/경도 → 열/행 선형 매핑이 불가능합니다.
//
// 본 구현은 10개 실측 캘리브레이션 포인트를 활용한 정밀 매핑을 제공합니다:
// 1. 열(Column) 결정: 아핀 변환 모델 (최소제곱법으로 계산된 계수)
// 2. 행(Row) 결정: 건물 중심선(row-04 기준) + 직교 방향 투영
// 3. 역변환: 중심선 위치 + 직교 방향 오프셋
//
// 정확도: 10개 샘플 중 열 8/10, 행 7/10 정확 매핑
// ============================================================================

/**
 * 캘리브레이션 데이터: row-04 (행 인덱스 3) 위치의 6개 출국장 실측 좌표
 * 건물 중심선(centerline)을 정의하는 앵커 포인트
 */
const CENTERLINE_ANCHORS: [col: number, lat: number, lng: number][] = [
    [0, 37.4471604, 126.4481759],  // E1-04 (출국장6)
    [2, 37.44794488, 126.4490817],  // E3-04 (출국장5)
    [4, 37.44876023, 126.4497998],  // M1-04 (출국장4)
    [7, 37.44989135, 126.4518183],  // M4-04 (출국장3)
    [9, 37.45015237, 126.4529945],  // W2-04 (출국장2)
    [10, 37.45025103, 126.4542537],  // W3-04 (출국장1)
];

/**
 * 아핀 변환 계수 (10개 샘플 기반 최소제곱법으로 계산)
 * col_float = COL_A * (lat - LAT_MEAN) + COL_B * (lng - LNG_MEAN) + COL_C
 */
const LAT_MEAN = 37.448787085;
const LNG_MEAN = 126.45078910;
const COL_A = 1600.2158;
const COL_B = 884.7874;
const COL_C = 5.3000;

/**
 * 행 방향 캘리브레이션 (직교 방향의 per-row 거리)
 * 건물 곡선으로 인해 열 위치에 따라 행 방향이 다름
 * - E1 (col 0): 행 증가 시 주로 경도가 변화
 * - M2 (col 5): 행 증가 시 주로 위도가 변화
 *
 * E1: E1-04 → E1-08 (4행) 실측
 * M2: M2-08 → M2-10 (2행) 실측
 */
const ROW_DIR_E1 = { lat: 0.0000082, lng: 0.0001967 }; // per row at col 0
const ROW_DIR_M2 = { lat: -0.0000806, lng: 0.0000155 }; // per row at col 5+

/**
 * 특정 열에서의 건물 중심선(row-04) 위도/경도를 보간하여 반환
 */
function getCenterlineAt(col: number): { lat: number; lng: number } {
    const c = Math.max(-1, Math.min(12, col));
    const anchors = CENTERLINE_ANCHORS;

    // 앵커 사이 구간 보간
    for (let i = 0; i < anchors.length - 1; i++) {
        if (c >= anchors[i][0] && c <= anchors[i + 1][0]) {
            const t = (c - anchors[i][0]) / (anchors[i + 1][0] - anchors[i][0]);
            return {
                lat: anchors[i][1] + t * (anchors[i + 1][1] - anchors[i][1]),
                lng: anchors[i][2] + t * (anchors[i + 1][2] - anchors[i][2]),
            };
        }
    }

    // 범위 밖: 외삽
    if (c < anchors[0][0]) {
        const sLat = (anchors[1][1] - anchors[0][1]) / (anchors[1][0] - anchors[0][0]);
        const sLng = (anchors[1][2] - anchors[0][2]) / (anchors[1][0] - anchors[0][0]);
        return {
            lat: anchors[0][1] + (c - anchors[0][0]) * sLat,
            lng: anchors[0][2] + (c - anchors[0][0]) * sLng,
        };
    }
    const n = anchors.length;
    const sLat = (anchors[n - 1][1] - anchors[n - 2][1]) / (anchors[n - 1][0] - anchors[n - 2][0]);
    const sLng = (anchors[n - 1][2] - anchors[n - 2][2]) / (anchors[n - 1][0] - anchors[n - 2][0]);
    return {
        lat: anchors[n - 1][1] + (c - anchors[n - 1][0]) * sLat,
        lng: anchors[n - 1][2] + (c - anchors[n - 1][0]) * sLng,
    };
}

/**
 * 특정 열에서의 건물 접선 방향 단위벡터 계산
 */
function getTangentAt(col: number): { dlat: number; dlng: number } {
    const d = 0.5;
    const p1 = getCenterlineAt(Math.max(0, col - d));
    const p2 = getCenterlineAt(Math.min(11, col + d));
    const dlat = p2.lat - p1.lat;
    const dlng = p2.lng - p1.lng;
    const len = Math.sqrt(dlat * dlat + dlng * dlng);
    if (len === 0) return { dlat: 0, dlng: 1 };
    return { dlat: dlat / len, dlng: dlng / len };
}

/**
 * 특정 열에서의 직교(행 증가) 방향의 per-row 거리
 * 열 위치에 따라 E1 ↔ M2 캘리브레이션 사이에서 보간
 */
function getPerRowPerpDist(col: number): number {
    const t = getTangentAt(col);
    // 직교 방향: (-t.dlng, t.dlat)

    // 열에 따른 per-row 방향 보간
    const ratio = Math.max(0, Math.min(1, col / 5));
    const dir = {
        lat: ROW_DIR_E1.lat + ratio * (ROW_DIR_M2.lat - ROW_DIR_E1.lat),
        lng: ROW_DIR_E1.lng + ratio * (ROW_DIR_M2.lng - ROW_DIR_E1.lng),
    };

    // per-row 방향을 접선의 직교 방향에 투영
    return dir.lat * (-t.dlng) + dir.lng * t.dlat;
}

/**
 * 위도/경도 좌표를 그리드 좌표로 변환
 * 인천공항 T1 터미널의 곡선 형태를 고려한 정밀 매핑
 *
 * 그리드 구조:
 * - 열 (Columns): E1, E2, E3, E4, M1, M2, M3, M4, W1, W2, W3, W4 (0-11)
 * - 행 (Rows): 01-17 (인덱스 0-16)
 *
 * @param latitude - 위도
 * @param longitude - 경도
 * @returns 그리드 좌표 (예: "M2-05") 또는 null (범위를 벗어난 경우)
 */
export function latLngToGridCoord(latitude: number, longitude: number): GridCoordinate | null {
    const result = latLngToGridFloat(latitude, longitude);
    if (!result) return null;

    const col = Math.max(0, Math.min(GRID_COLUMNS.length - 1, Math.floor(result.col)));
    const row = Math.max(0, Math.min(GRID_ROWS.length - 1, Math.floor(result.row)));

    return createCoordinate(col, row);
}

/**
 * 위도/경도 → 그리드 부동소수점 좌표 (내부용)
 * 열/행을 실수값으로 반환 (정수 부분 = 셀 인덱스, 소수 부분 = 셀 내 위치)
 */
function latLngToGridFloat(
    latitude: number,
    longitude: number,
): { col: number; row: number } | null {
    // 열: 아핀 변환 (초기 추정)
    const colFloat = COL_A * (latitude - LAT_MEAN) + COL_B * (longitude - LNG_MEAN) + COL_C;

    // 범위 검사 (여유 마진 포함)
    if (colFloat < -2 || colFloat > 14) {
        console.warn(`좌표가 공항 범위를 벗어났습니다: (${latitude}, ${longitude})`);
        return null;
    }

    let col = Math.max(0, Math.min(11.99, colFloat));

    // 행 계산 함수 (col에 의존하므로 반복 사용)
    const computeRow = (c: number) => {
        const center = getCenterlineAt(c);
        const tangent = getTangentAt(c);
        const dlat = latitude - center.lat;
        const dlng = longitude - center.lng;
        const perpDist = dlat * (-tangent.dlng) + dlng * tangent.dlat;
        const perRowDist = getPerRowPerpDist(c);
        return perRowDist !== 0 ? 3.5 + perpDist / perRowDist : 3.5;
    };

    let row = computeRow(col);

    // Newton 보정: gridIndexToLatLng의 정확한 역변환을 위해
    // 아핀 추정 → 순방향 계산 → 잔차 보정 (1-2회 반복)
    for (let i = 0; i < 2; i++) {
        const test = gridIndexToLatLng(col, row);
        const dLat = latitude - test.latitude;
        const dLng = longitude - test.longitude;
        // 아핀 계수로 잔차 보정
        col += COL_A * dLat + COL_B * dLng;
        col = Math.max(0, Math.min(11.99, col));
        row = computeRow(col);
        row = Math.max(0, Math.min(16.99, row));
    }

    return { col, row };
}

/**
 * 그리드 좌표를 위도/경도로 역변환 (셀의 중앙점)
 * @param coord - 그리드 좌표 (예: "M2-05")
 * @returns { latitude, longitude } 또는 null (유효하지 않은 좌표)
 */
export function gridCoordToLatLng(
    coord: GridCoordinate,
): { latitude: number; longitude: number } | null {
    const parsed = parseCoordinate(coord);
    if (!parsed) return null;

    return gridIndexToLatLng(parsed.col + 0.5, parsed.row + 0.5);
}

/**
 * 그리드 인덱스를 위도/경도로 역변환
 * @param col - 열 인덱스 (0-11 가능)
 * @param row - 행 인덱스 (0-16 가능)
 * @returns { latitude, longitude }
 */
export function gridIndexToLatLng(
    col: number,
    row: number,
): { latitude: number; longitude: number } {
    const center = getCenterlineAt(col);
    const tangent = getTangentAt(col);
    const perRowDist = getPerRowPerpDist(col);

    const rowOffset = row - 3.5; // centerline row center 기준 오프셋
    const perpMag = rowOffset * perRowDist;

    // 직교 방향: (-tangent.dlng, tangent.dlat)
    return {
        latitude: center.lat + perpMag * (-tangent.dlng),
        longitude: center.lng + perpMag * tangent.dlat,
    };
}

/**
 * 위도/경도를 그리드 셀 내부의 상대적 위치로 변환
 * @param latitude - 위도
 * @param longitude - 경도
 * @returns { coord, offsetX, offsetY } - 그리드 좌표와 셀 내부 오프셋 (0-1 범위의 비율)
 */
export function latLngToPixelPosition(
    latitude: number,
    longitude: number,
): { coord: GridCoordinate; offsetX: number; offsetY: number } | null {
    const result = latLngToGridFloat(latitude, longitude);
    if (!result) return null;

    const col = Math.floor(Math.max(0, Math.min(GRID_COLUMNS.length - 1, result.col)));
    const row = Math.floor(Math.max(0, Math.min(GRID_ROWS.length - 1, result.row)));

    const coord = createCoordinate(col, row);
    if (!coord) return null;

    // 셀 내부 오프셋 (0-1)
    const offsetX = Math.max(0, Math.min(1, result.col - col));
    const offsetY = Math.max(0, Math.min(1, result.row - row));

    return { coord, offsetX, offsetY };
}

/**
 * 픽셀 좌표를 위도/경도로 변환
 * 그리드 영역 내 픽셀 위치 → 실제 지리 좌표
 *
 * @param x - X 픽셀 위치 (그리드 컨테이너 기준, 헤더 제외)
 * @param y - Y 픽셀 위치 (그리드 컨테이너 기준, 헤더 제외)
 * @param gridWidth - 그리드 전체 너비 (픽셀, 헤더 제외)
 * @param gridHeight - 그리드 전체 높이 (픽셀, 헤더 제외)
 * @returns { latitude, longitude } 또는 null (범위 밖)
 */
export function pixelToLatLng(
    x: number,
    y: number,
    gridWidth: number,
    gridHeight: number,
): { latitude: number; longitude: number } | null {
    if (gridWidth <= 0 || gridHeight <= 0) return null;

    // 픽셀 → 그리드 부동소수점 인덱스
    const col = (x / gridWidth) * GRID_COLUMNS.length;
    const row = (y / gridHeight) * GRID_ROWS.length;

    if (col < 0 || col > GRID_COLUMNS.length || row < 0 || row > GRID_ROWS.length) {
        return null;
    }

    return gridIndexToLatLng(col, row);
}

/**
 * 좌표 캘리브레이션 검증 함수
 * 10개 실측 샘플이 올바른 그리드 좌표로 변환되는지 검증
 */
export function verifyCoordinateAccuracy(): {
    total: number;
    colCorrect: number;
    rowCorrect: number;
    bothCorrect: number;
    results: Array<{
        name: string;
        expected: { col: number; row: number };
        predicted: { col: number; row: number };
        colOk: boolean;
        rowOk: boolean;
    }>;
} {
    const samples = [
        { name: '출국장1 (W3-04)', lat: 37.45025103, lng: 126.4542537, col: 10, row: 3 },
        { name: '출국장2 (W2-04)', lat: 37.45015237, lng: 126.4529945, col: 9, row: 3 },
        { name: '출국장3 (M4-04)', lat: 37.44989135, lng: 126.4518183, col: 7, row: 3 },
        { name: '출국장4 (M1-04)', lat: 37.44876023, lng: 126.4497998, col: 4, row: 3 },
        { name: '출국장5 (E3-04)', lat: 37.44794488, lng: 126.4490817, col: 2, row: 3 },
        { name: '출국장6 (E1-04)', lat: 37.4471604, lng: 126.4481759, col: 0, row: 3 },
        { name: '파스쿠찌 (M2-08)', lat: 37.44897152, lng: 126.4506541, col: 5, row: 7 },
        { name: 'CU (M2-10)', lat: 37.44881024, lng: 126.450685, col: 5, row: 9 },
        { name: '셔틀버스 (M3-16)', lat: 37.44873571, lng: 126.4514655, col: 6, row: 15 },
        { name: 'AED (E1-08)', lat: 37.44719312, lng: 126.4489625, col: 0, row: 7 },
    ];

    let colCorrect = 0;
    let rowCorrect = 0;
    let bothCorrect = 0;
    const results = [];

    for (const s of samples) {
        const gridFloat = latLngToGridFloat(s.lat, s.lng);
        const pCol = gridFloat ? Math.floor(Math.max(0, Math.min(11, gridFloat.col))) : -1;
        const pRow = gridFloat ? Math.floor(Math.max(0, Math.min(16, gridFloat.row))) : -1;
        const colOk = pCol === s.col;
        const rowOk = pRow === s.row;
        if (colOk) colCorrect++;
        if (rowOk) rowCorrect++;
        if (colOk && rowOk) bothCorrect++;
        results.push({
            name: s.name,
            expected: { col: s.col, row: s.row },
            predicted: { col: pCol, row: pRow },
            colOk,
            rowOk,
        });
    }

    return { total: samples.length, colCorrect, rowCorrect, bothCorrect, results };
}

/**
 * 좌표 검증 결과를 콘솔에 출력
 */
export function printCalibrationResults(): void {
    const { total, colCorrect, rowCorrect, bothCorrect, results } = verifyCoordinateAccuracy();
    console.group('좌표 캘리브레이션 검증 결과');
    console.log(`전체: ${total}개 | 열 정확: ${colCorrect}/${total} | 행 정확: ${rowCorrect}/${total} | 모두 정확: ${bothCorrect}/${total}`);
    for (const r of results) {
        const status = r.colOk && r.rowOk ? '✅' : r.colOk || r.rowOk ? '⚠️' : '❌';
        console.log(
            `${status} ${r.name}: 예상(${r.expected.col},${r.expected.row}) → 결과(${r.predicted.col},${r.predicted.row})`,
        );
    }
    console.groupEnd();
}
