import './facilityMap.css';
import { useEffect, useMemo, useState } from 'react';
import { fcltMapService } from '@/api/pm/services/fcltMap.service';
import { unwrap } from '@/api/pm/result';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { downloadCsv } from '@/lib/csv';
import { dialog } from '@/lib/dialog';
import type { ApiError } from '@/types/api.types';
import { EditBar } from './components/EditBar';
import { FcltDetailPanel } from './components/FcltDetailPanel';
import { FcltMapStage } from './components/FcltMapStage';
import { FcltMapTable } from './components/FcltMapTable';
import { Header } from './components/Header';
import { StatusSummary } from './components/StatusSummary';
import { useFacilityMap, type FacilityMapQuery } from './hooks/useFacilityMapData';
import {
    MAPPING_STATUS_LABEL,
    TERMINAL_LABEL,
    type CastDrafts,
    type FcltMapRow,
    type MappingStatus,
    type StatusFilter,
    type TerminalKind,
} from './types';
import { applyCastDrafts, toDuplicateCastNames, toStatusTiles, withMarkerCounts } from './view';

/** 표에 걸린 조건 — 상태 타일 · 시설그룹 칩 · 도면 구역 · 검색어 */
interface RowFilter {
    status: StatusFilter;
    groupCode: string;
    markerId: string;
    keyword: string;
}

const DEFAULT_FILTER: RowFilter = { status: 'all', groupCode: '', markerId: '', keyword: '' };

const SAVE_FAIL = '매핑을 저장하지 못했습니다.';

/** 저장하지 않은 변경을 두고 화면을 떠나려 할 때 */
const LEAVE_WARNING = '저장하지 않은 변경이 있습니다. 조회하면 변경 내용이 사라집니다.';

const CSV_COLUMNS = [
    '터미널',
    '시설그룹',
    '여객시설코드',
    '여객시설명',
    '여객시설설명',
    'CAST 시뮬레이션명',
    '상태',
    '최종수정',
];

/**
 * 조건에 맞는 행만 남긴다 (네 조건은 AND 로 겹쳐 걸린다).
 *
 * 상태는 **서버가 준 원래 상태**로 거른다. 편집 중인 값으로 걸면
 * 미매핑만 띄워 놓고 고치는 순간 그 행이 목록에서 빠져 나가 글자를 다 칠 수도 없다.
 * 상태 뱃지와 상단 타일은 편집을 따라 움직이되, 목록에서 사라지지는 않는다.
 */
function filterRows(
    rows: FcltMapRow[],
    filter: RowFilter,
    originalStatus: Map<string, MappingStatus>,
): FcltMapRow[] {
    const keyword = filter.keyword.trim().toLowerCase();

    return rows.filter((row) => {
        const status = originalStatus.get(row.code) ?? row.status;
        if (filter.status !== 'all' && status !== filter.status) return false;
        if (filter.groupCode && row.groupCode !== filter.groupCode) return false;
        if (filter.markerId && row.markerId !== filter.markerId) return false;
        if (!keyword) return true;

        return [row.code, row.name, row.castName, row.desc].some((field) =>
            field.toLowerCase().includes(keyword),
        );
    });
}

function toCsvRows(terminal: TerminalKind, rows: FcltMapRow[]): string[][] {
    return rows.map((row) => [
        TERMINAL_LABEL[terminal],
        row.groupName,
        row.code,
        row.name,
        row.desc,
        row.castName,
        MAPPING_STATUS_LABEL[row.status],
        row.modified,
    ]);
}

/**
 * PM 예측관리 / 시설물 매핑.
 *
 * 공항 여객시설과 CAST 시뮬레이션 시설의 매핑을 확인하는 화면이다.
 * 미매핑·미사용처럼 손봐야 할 건이 있는지를 상단 타일과 도면 뱃지로 먼저 보여 주고,
 * 고쳐야 하면 CAST 시뮬레이션명 칸에서 바로 고친다. 나머지 값은 모두 읽기 전용이다.
 *
 * 편집은 모아서 저장한다 — 미매핑 여러 건을 이어서 채우는 게 이 화면의 주된 일이라
 * 한 칸 고칠 때마다 서버를 부르면 흐름이 끊긴다.
 */
function FacilityMap() {
    usePageScope('facilityMap');

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    // 조회 버튼으로 확정된 조건 — 최초 진입은 T1 으로 한 번 조회한다.
    const [query, setQuery] = useState<FacilityMapQuery>({ terminal: 'T1' });
    const [filter, setFilter] = useState<RowFilter>(DEFAULT_FILTER);
    const [selectedCode, setSelectedCode] = useState('');
    const [drafts, setDrafts] = useState<CastDrafts>({});

    const { data, error, token } = useFacilityMap(query);

    // 서버가 준 행 위에 편집 중인 CAST명을 얹는다 (원본은 data.rows 에 그대로 남는다).
    const editedRows = useMemo(() => applyCastDrafts(data?.rows ?? [], drafts), [data, drafts]);

    const dirtyCodes = useMemo(() => new Set(Object.keys(drafts)), [drafts]);
    const duplicateNames = useMemo(() => toDuplicateCastNames(editedRows), [editedRows]);

    // 상단 타일·도면 뱃지도 편집 결과를 따라간다 — 미매핑을 하나 채우면 그 자리에서 3 → 2 가 된다.
    const tiles = useMemo(() => toStatusTiles(editedRows), [editedRows]);
    const markers = useMemo(
        () => withMarkerCounts(data?.markers ?? [], editedRows),
        [data, editedRows],
    );

    // 상태 필터의 기준 — 편집 전 상태 (filterRows 주석 참고)
    const originalStatus = useMemo(
        () => new Map((data?.rows ?? []).map((row) => [row.code, row.status])),
        [data],
    );

    // 시설그룹만 빼고 건 필터 — 그룹 칩의 건수는 "지금 조건에서 몇 건인지"여야 한다.
    // 전체 총계를 그대로 두면 "미매핑 3건"인데 칩은 "체크인카운터 26" 이라 서로 어긋나 보인다.
    const facetRows = useMemo(
        () => filterRows(editedRows, { ...filter, groupCode: '' }, originalStatus),
        [editedRows, filter, originalStatus],
    );
    const rows = useMemo(
        () =>
            filter.groupCode
                ? facetRows.filter((row) => row.groupCode === filter.groupCode)
                : facetRows,
        [facetRows, filter.groupCode],
    );
    // 칩 목록 자체는 전체 기준으로 고정한다 — 건수 0 이라고 사라지면 칩이 움직여 누르기 어렵다.
    const groups = useMemo(
        () =>
            (data?.groups ?? []).map((group) => ({
                ...group,
                count: facetRows.filter((row) => row.groupCode === group.code).length,
            })),
        [data, facetRows],
    );

    // 고른 행이 필터 밖으로 밀려나면 상세도 함께 비운다.
    const selectedRow = rows.find((row) => row.code === selectedCode);
    // 마커 id 는 출국장이 dg3 처럼 내부 표기라 그대로 보여 주지 않는다.
    const activeMarker = markers.find((marker) => marker.id === filter.markerId);
    const markerName = activeMarker
        ? activeMarker.kind === 'depGate'
            ? `출국장 ${activeMarker.label}`
            : `${activeMarker.label} 아일랜드`
        : '';
    const markerNote = markerName ? `도면에서 고른 ${markerName}의 시설만 보고 있습니다.` : '';

    useErrorAlert(error, token);

    // 저장하지 않고 탭을 닫거나 새로고침하면 브라우저가 한 번 물어보게 한다.
    useEffect(() => {
        if (dirtyCodes.size === 0) return;

        const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirtyCodes]);

    /** 조회 — 서버에서 다시 받으므로 편집 중이던 값은 버려진다 */
    const runSearch = () => {
        // 조건이 그대로여도 다시 조회해야 하므로 새 객체를 넘긴다 (useFetched 는 참조로 비교한다).
        setQuery({ terminal });
        setFilter(DEFAULT_FILTER);
        setSelectedCode('');
        setDrafts({});
    };

    const handleSearch = () => {
        if (dirtyCodes.size === 0) {
            runSearch();
            return;
        }

        dialog
            .confirm({ title: '조회', description: LEAVE_WARNING })
            .then((ok) => {
                if (ok) runSearch();
            })
            .catch(() => {});
    };

    /**
     * CAST명 편집 — 원래 값으로 되돌아오면 초안에서 아예 뺀다.
     * 그래야 "변경 3건"이 실제로 바뀐 건수와 어긋나지 않는다.
     */
    const handleCastChange = (code: string, castName: string) => {
        const original = data?.rows.find((row) => row.code === code)?.castName ?? '';

        setDrafts((prev) => {
            if (castName !== original) return { ...prev, [code]: castName };
            if (prev[code] === undefined) return prev;

            const rest = { ...prev };
            delete rest[code];
            return rest;
        });
    };

    const handleRevert = () => {
        dialog
            .confirm({
                title: '되돌리기',
                description: `저장하지 않은 변경 ${dirtyCodes.size}건을 모두 버립니다.`,
            })
            .then((ok) => {
                if (ok) setDrafts({});
            })
            .catch(() => {});
    };

    const handleSave = () => {
        const itemList = Object.entries(drafts).map(([psgFcltCd, smltFcltNm]) => ({
            psgFcltCd,
            smltFcltNm: smltFcltNm.trim(),
        }));
        if (itemList.length === 0) return;

        fcltMapService
            .saveFcltMapList(query.terminal, itemList)
            .then((dto) => unwrap(dto, SAVE_FAIL))
            .then(() => {
                setDrafts({});
                // 저장한 값이 실제로 반영됐는지는 서버가 준 목록으로 다시 확인한다.
                setQuery({ terminal: query.terminal });
                return dialog.alert({
                    title: '저장 완료',
                    description: `매핑 ${itemList.length}건을 저장했습니다.`,
                });
            })
            .catch((err: ApiError) => {
                dialog
                    .alert({ title: '저장 실패', description: err?.message || SAVE_FAIL })
                    .catch(() => {});
            });
    };

    // 같은 마커를 다시 누르면 구역 선택을 푼다.
    const handleMarkerClick = (markerId: string) =>
        setFilter((prev) => ({ ...prev, markerId: prev.markerId === markerId ? '' : markerId }));

    const handleStatusChange = (status: StatusFilter) => setFilter((prev) => ({ ...prev, status }));

    const handleGroupChange = (groupCode: string) => setFilter((prev) => ({ ...prev, groupCode }));

    const handleKeywordChange = (keyword: string) => setFilter((prev) => ({ ...prev, keyword }));

    const handleExcel = () => {
        if (rows.length === 0) {
            dialog
                .alert({ title: '엑셀저장', description: '저장할 목록이 없습니다.' })
                .catch(() => {});
            return;
        }

        downloadCsv(`시설물매핑_${query.terminal}.csv`, CSV_COLUMNS, toCsvRows(query.terminal, rows));
    };

    return (
        <div className="wrap">
            <Header terminal={terminal} onTerminalChange={setTerminal} onSearch={handleSearch} />

            <div className="body">
                <Lnb />

                <main className="container">
                    <StatusSummary
                        tiles={tiles}
                        active={filter.status}
                        onSelect={handleStatusChange}
                    />

                    <div className="panels">
                        {/* 왼쪽 열 : 도면(비율 고정) + 상세(남은 높이) */}
                        <div className="side">
                            <FcltMapStage
                                terminal={query.terminal}
                                stageAspect={data?.stageAspect ?? ''}
                                markers={markers}
                                activeMarkerId={filter.markerId}
                                onMarkerClick={handleMarkerClick}
                            />

                            <FcltDetailPanel row={selectedRow} />
                        </div>

                        <div className="listcol">
                            <FcltMapTable
                                rows={rows}
                                groups={groups}
                                groupCode={filter.groupCode}
                                keyword={filter.keyword}
                                selectedCode={selectedCode}
                                markerNote={markerNote}
                                dirtyCodes={dirtyCodes}
                                duplicateNames={duplicateNames}
                                onGroupChange={handleGroupChange}
                                onKeywordChange={handleKeywordChange}
                                onSelect={(row) => setSelectedCode(row.code)}
                                onCastChange={handleCastChange}
                                onExcel={handleExcel}
                            />

                            <EditBar
                                dirtyCount={dirtyCodes.size}
                                duplicateCount={duplicateNames.size}
                                onRevert={handleRevert}
                                onSave={handleSave}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default FacilityMap;
