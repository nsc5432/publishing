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
import { MAPPING_STATUS_LABEL, TERMINAL_LABEL, type CastDrafts, type FcltMapRow, type MappingStatus, type StatusFilter, type TerminalKind } from './types';
import { applyCastDrafts, toDuplicateCastNames, toStatusTiles, withMarkerCounts } from './view';

interface RowFilter {
    status: StatusFilter;
    groupCode: string;
    markerId: string;
    keyword: string;
}

const DEFAULT_FILTER: RowFilter = { status: 'all', groupCode: '', markerId: '', keyword: '' };

const SAVE_FAIL = '매핑을 저장하지 못했습니다.';

const LEAVE_WARNING = '저장하지 않은 변경이 있습니다. 조회하면 변경 내용이 사라집니다.';

const CSV_COLUMNS = ['터미널', '시설그룹', '여객시설코드', '여객시설명', '여객시설설명', 'CAST 시뮬레이션명', '상태', '최종수정'];

function filterRows(rows: FcltMapRow[], filter: RowFilter, originalStatus: Map<string, MappingStatus>): FcltMapRow[] {
    const keyword = filter.keyword.trim().toLowerCase();

    return rows.filter((row) => {
        const status = originalStatus.get(row.code) ?? row.status;
        if (filter.status !== 'all' && status !== filter.status) return false;
        if (filter.groupCode && row.groupCode !== filter.groupCode) return false;
        if (filter.markerId && row.markerId !== filter.markerId) return false;
        if (!keyword) return true;

        return [row.code, row.name, row.castName, row.desc].some((field) => field.toLowerCase().includes(keyword));
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

function FacilityMap() {
    usePageScope('facilityMap');

    const [terminal, setTerminal] = useState<TerminalKind>('T1');
    const [query, setQuery] = useState<FacilityMapQuery>({ terminal: 'T1' });
    const [filter, setFilter] = useState<RowFilter>(DEFAULT_FILTER);
    const [selectedCode, setSelectedCode] = useState('');
    const [drafts, setDrafts] = useState<CastDrafts>({});

    const { data, error, token } = useFacilityMap(query);

    const editedRows = useMemo(() => applyCastDrafts(data?.rows ?? [], drafts), [data, drafts]);

    const dirtyCodes = useMemo(() => new Set(Object.keys(drafts)), [drafts]);
    const duplicateNames = useMemo(() => toDuplicateCastNames(editedRows), [editedRows]);

    const tiles = useMemo(() => toStatusTiles(editedRows), [editedRows]);
    const markers = useMemo(() => withMarkerCounts(data?.markers ?? [], editedRows), [data, editedRows]);

    const originalStatus = useMemo(() => new Map((data?.rows ?? []).map((row) => [row.code, row.status])), [data]);

    const facetRows = useMemo(() => filterRows(editedRows, { ...filter, groupCode: '' }, originalStatus), [editedRows, filter, originalStatus]);
    const rows = useMemo(() => (filter.groupCode ? facetRows.filter((row) => row.groupCode === filter.groupCode) : facetRows), [facetRows, filter.groupCode]);
    const groups = useMemo(
        () =>
            (data?.groups ?? []).map((group) => ({
                ...group,
                count: facetRows.filter((row) => row.groupCode === group.code).length,
            })),
        [data, facetRows],
    );

    const selectedRow = rows.find((row) => row.code === selectedCode);
    const activeMarker = markers.find((marker) => marker.id === filter.markerId);
    const markerName = activeMarker ? (activeMarker.kind === 'depGate' ? `출국장 ${activeMarker.label}` : `${activeMarker.label} 아일랜드`) : '';
    const markerNote = markerName ? `도면에서 고른 ${markerName}의 시설만 보고 있습니다.` : '';

    useErrorAlert(error, token);

    useEffect(() => {
        if (dirtyCodes.size === 0) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirtyCodes]);

    const runSearch = () => {
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
            .then((confirmed) => {
                if (confirmed) runSearch();
            })
            .catch(() => {});
    };

    const handleCastChange = (code: string, castName: string) => {
        const originalCastName = data?.rows.find((row) => row.code === code)?.castName ?? '';

        setDrafts((previousDrafts) => {
            if (castName !== originalCastName) return { ...previousDrafts, [code]: castName };
            if (previousDrafts[code] === undefined) return previousDrafts;

            const remainingDrafts = { ...previousDrafts };
            delete remainingDrafts[code];
            return remainingDrafts;
        });
    };

    const handleRevert = () => {
        dialog
            .confirm({
                title: '되돌리기',
                description: `저장하지 않은 변경 ${dirtyCodes.size}건을 모두 버립니다.`,
            })
            .then((confirmed) => {
                if (confirmed) setDrafts({});
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
                setQuery({ terminal: query.terminal });
                return dialog.alert({
                    title: '저장 완료',
                    description: `매핑 ${itemList.length}건을 저장했습니다.`,
                });
            })
            .catch((error: ApiError) => {
                dialog.alert({ title: '저장 실패', description: error?.message || SAVE_FAIL }).catch(() => {});
            });
    };

    const handleMarkerClick = (markerId: string) =>
        setFilter((previousFilter) => ({
            ...previousFilter,
            markerId: previousFilter.markerId === markerId ? '' : markerId,
        }));

    const handleStatusChange = (status: StatusFilter) => setFilter((previousFilter) => ({ ...previousFilter, status }));

    const handleGroupChange = (groupCode: string) => setFilter((previousFilter) => ({ ...previousFilter, groupCode }));

    const handleKeywordChange = (keyword: string) => setFilter((previousFilter) => ({ ...previousFilter, keyword }));

    const handleExcel = () => {
        if (rows.length === 0) {
            dialog.alert({ title: '엑셀저장', description: '저장할 목록이 없습니다.' }).catch(() => {});
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
                    <StatusSummary tiles={tiles} active={filter.status} onSelect={handleStatusChange} />

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

                            <EditBar dirtyCount={dirtyCodes.size} duplicateCount={duplicateNames.size} onRevert={handleRevert} onSave={handleSave} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default FacilityMap;
