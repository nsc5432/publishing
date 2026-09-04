import './castConfig.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { castConfigService } from '@/api/pm/services/castConfig.service';
import { unwrap } from '@/api/pm/result';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import { dialog } from '@/lib/dialog';
import { downloadCastConfigWorkbook } from '@/lib/xlsx';
import type { ApiError, CastConfigCategoryCloneDto } from '@/types/api.types';
import { CategoryBar } from './components/CategoryBar';
import { CategoryRegisterModal } from './components/CategoryRegisterModal';
import { DataConfigModal } from './components/DataConfigModal';
import { FlowDiagram } from './components/FlowDiagram';
import { Header } from './components/Header';
import { PreProcessHistoryModal } from './components/PreProcessHistoryModal';
import { useCastConfigApplyHistory } from './hooks/useCastConfigApplyHistory';
import { useCastConfigCategories } from './hooks/useCastConfigCategories';
import { useCastConfigGroups } from './hooks/useCastConfigGroups';
import { useDatasetDraft } from './hooks/useDatasetDraft';
import type { FacilityGroupId, TerminalKind } from './types';

interface ActiveGroup {
    terminal: TerminalKind;
    groupId: FacilityGroupId;
}

type Layer = 'none' | 'clone' | 'history';

const T1_QUERY = { terminal: 'T1' as TerminalKind };
const T2_QUERY = { terminal: 'T2' as TerminalKind };
const DISCARD_WARNING = '저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 계속하시겠습니까?';

function errorMessage(error: unknown, fallback: string): string {
    return (error as ApiError)?.message || fallback;
}

function CastConfig() {
    usePageScope('castConfig');

    const [active, setActive] = useState<ActiveGroup | null>(null);
    const [categoryCode, setCategoryCode] = useState('');
    const [categoryReloadToken, setCategoryReloadToken] = useState(0);
    const [dataReloadToken, setDataReloadToken] = useState(0);
    const [historyReloadToken, setHistoryReloadToken] = useState(0);
    const [layer, setLayer] = useState<Layer>('none');
    const [busy, setBusy] = useState(false);
    const draft = useDatasetDraft();
    const groupsT1 = useCastConfigGroups(T1_QUERY);
    const groupsT2 = useCastConfigGroups(T2_QUERY);
    const categoryQuery = useMemo(() => ({ reloadToken: categoryReloadToken }), [categoryReloadToken]);
    const fetchedCategories = useCastConfigCategories(categoryQuery);
    const historyQuery = useMemo(() => (layer === 'history' ? { reloadToken: historyReloadToken } : null), [historyReloadToken, layer]);
    const fetchedHistory = useCastConfigApplyHistory(historyQuery);
    const currentCategory = fetchedCategories.data.find((category) => category.code === categoryCode) ?? fetchedCategories.data[0] ?? null;
    const activeGroups = active?.terminal === 'T2' ? groupsT2.data : groupsT1.data;
    const activeGroup = active ? (activeGroups?.find((group) => group.id === active.groupId) ?? null) : null;

    useErrorAlert(groupsT1.error, groupsT1.token);
    useErrorAlert(groupsT2.error, groupsT2.token);
    useErrorAlert(fetchedCategories.error, fetchedCategories.token);
    useErrorAlert(fetchedHistory.error, fetchedHistory.token);

    useEffect(() => {
        if (draft.totalCount === 0) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [draft.totalCount]);

    const confirmDiscard = useCallback(async () => {
        if (draft.totalCount === 0) return true;
        return dialog.confirm({ title: 'Cast 설정', description: DISCARD_WARNING }).catch(() => false);
    }, [draft.totalCount]);

    const handleCategorySelect = (code: string) => {
        if (code === currentCategory?.code) return;

        confirmDiscard()
            .then((ok) => {
                if (!ok) return;
                draft.clearAll();
                setCategoryCode(code);
                setDataReloadToken((token) => token + 1);
            })
            .catch(() => {});
    };

    const handleClone = (dto: CastConfigCategoryCloneDto) => {
        setBusy(true);
        castConfigService
            .cloneCategory(dto)
            .then((response) => unwrap(response, '카테고리를 복제하지 못했습니다.'))
            .then((response) => {
                draft.clearAll();
                setCategoryCode(response.fixAtrbGroupId);
                setCategoryReloadToken((token) => token + 1);
                setDataReloadToken((token) => token + 1);
                setLayer('none');
                dialog.alert({ title: '카테고리 복제', description: '전체 Cast 설정을 복제했습니다.' }).catch(() => {});
            })
            .catch((error: unknown) => {
                dialog.alert({ title: '카테고리 복제', description: errorMessage(error, '카테고리를 복제하지 못했습니다.') }).catch(() => {});
            })
            .finally(() => setBusy(false));
    };

    const handleSave = () => {
        if (!currentCategory || draft.totalCount === 0 || currentCategory.isBase || currentCategory.isPreProcess) return;

        const messages = draft.validationMessages();
        if (messages.length > 0) {
            dialog.alert({ title: '저장 값 확인', description: messages.join('\n') }).catch(() => {});
            return;
        }

        setBusy(true);
        castConfigService
            .saveCategorySet(currentCategory.code, draft.saveItems())
            .then((response) => unwrap(response, '변경사항을 저장하지 못했습니다.'))
            .then(() => {
                const count = draft.totalCount;
                draft.clearAll();
                setDataReloadToken((token) => token + 1);
                dialog.alert({ title: '저장 완료', description: `${count.toLocaleString('ko-KR')}개 변경사항을 저장했습니다.` }).catch(() => {});
            })
            .catch((error: unknown) => {
                dialog.alert({ title: '저장 실패', description: errorMessage(error, '변경사항을 저장하지 못했습니다.') }).catch(() => {});
            })
            .finally(() => setBusy(false));
    };

    const handleApplyOper = () => {
        if (!currentCategory || currentCategory.isBase || draft.totalCount > 0) return;

        dialog
            .confirm({
                title: '운영 반영',
                description: `${currentCategory.name}(${currentCategory.code})의 T1·T2 전체 Cast 설정을 기준정보에 반영합니다. 계속하시겠습니까?`,
            })
            .then((ok) => {
                if (!ok) return;

                setBusy(true);
                return castConfigService
                    .applyCategorySet(currentCategory.code)
                    .then((response) => unwrap(response, '기준정보에 반영하지 못했습니다.'))
                    .then(() => {
                        setDataReloadToken((token) => token + 1);
                        setHistoryReloadToken((token) => token + 1);
                        dialog.alert({ title: '운영 반영', description: '전체 Cast 설정을 기준정보에 반영했습니다.' }).catch(() => {});
                    })
                    .catch((error: unknown) => {
                        dialog.alert({ title: '운영 반영', description: errorMessage(error, '기준정보에 반영하지 못했습니다.') }).catch(() => {});
                    })
                    .finally(() => setBusy(false));
            })
            .catch(() => {});
    };

    const handleDownload = () => {
        if (!currentCategory || draft.totalCount > 0) return;

        setBusy(true);
        castConfigService
            .getCategorySet(currentCategory.code)
            .then((response) => unwrap(response, '전체 Cast 설정을 불러오지 못했습니다.'))
            .then((response) => downloadCastConfigWorkbook(currentCategory.name, response))
            .catch((error: unknown) => {
                dialog.alert({ title: '엑셀저장', description: errorMessage(error, '엑셀 파일을 만들지 못했습니다.') }).catch(() => {});
            })
            .finally(() => setBusy(false));
    };

    const handleRevert = (aplySetSn: number) => {
        dialog
            .confirm({ title: '전체 되돌리기', description: '이 반영 세트의 모든 설정을 반영 직전 값으로 복원합니다. 계속하시겠습니까?' })
            .then((ok) => {
                if (!ok) return;

                setBusy(true);
                return castConfigService
                    .revertApplySet(aplySetSn)
                    .then((response) => unwrap(response, '반영 세트를 되돌리지 못했습니다.'))
                    .then(() => {
                        setDataReloadToken((token) => token + 1);
                        setHistoryReloadToken((token) => token + 1);
                    })
                    .catch((error: unknown) => {
                        dialog.alert({ title: '전체 되돌리기', description: errorMessage(error, '반영 세트를 되돌리지 못했습니다.') }).catch(() => {});
                    })
                    .finally(() => setBusy(false));
            })
            .catch(() => {});
    };

    return (
        <div className="wrap">
            <Header />

            <div className="body">
                <Lnb onBeforeNavigate={confirmDiscard} />

                <main className="cast-config-container">
                    <div className="cast-config-intro">
                        <div>
                            <span className="cast-config-intro__eyebrow">Cast 설정</span>
                            <h2>여객 동선별 데이터 연결 항목</h2>
                        </div>
                    </div>

                    <CategoryBar
                        categories={fetchedCategories.data}
                        current={currentCategory}
                        changeCount={draft.totalCount}
                        busy={busy}
                        onSelect={handleCategorySelect}
                        onClone={() => setLayer('clone')}
                        onSave={handleSave}
                        onApplyOper={handleApplyOper}
                        onDownload={handleDownload}
                        onOpenHistory={() => setLayer('history')}
                    />

                    <div className="cast-config-scene-row">
                        <FlowDiagram terminal="T1" groups={groupsT1.data ?? []} onOpenGroup={(groupId) => setActive({ terminal: 'T1', groupId })} />
                        <FlowDiagram terminal="T2" groups={groupsT2.data ?? []} onOpenGroup={(groupId) => setActive({ terminal: 'T2', groupId })} />
                    </div>

                    <aside className="cast-config-legend" aria-label="시설그룹 색상 안내">
                        <span>
                            <i className="is-checkin" />
                            체크인
                        </span>
                        <span>
                            <i className="is-departure" />
                            출국장
                        </span>
                        <span>
                            <i className="is-security" />
                            시큐리티
                        </span>
                        <span>
                            <i className="is-border" />
                            출입국심사
                        </span>
                        <span>
                            <i className="is-gate" />
                            게이트
                        </span>
                    </aside>
                </main>
            </div>

            {activeGroup && active && currentCategory && (
                <DataConfigModal
                    key={`${active.terminal}-${activeGroup.id}-${currentCategory.code}`}
                    terminal={active.terminal}
                    group={activeGroup}
                    category={currentCategory}
                    draft={draft}
                    reloadToken={dataReloadToken}
                    onClose={() => setActive(null)}
                />
            )}

            {layer === 'clone' && currentCategory && (
                <CategoryRegisterModal source={currentCategory} saving={busy} onSubmit={handleClone} onClose={() => setLayer('none')} />
            )}

            {layer === 'history' && (
                <PreProcessHistoryModal histories={fetchedHistory.data} reverting={busy} onRevert={handleRevert} onClose={() => setLayer('none')} />
            )}
        </div>
    );
}

export default CastConfig;
