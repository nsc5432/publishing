import './castConfig.css';
import { useCallback, useMemo, useState } from 'react';
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

interface SelectedGroup {
    terminal: TerminalKind;
    groupId: FacilityGroupId;
}

type ModalKind = 'none' | 'clone' | 'history';

function errorMessage(error: unknown, fallback: string): string {
    return (error as ApiError)?.message || fallback;
}

function CastConfig() {
    usePageScope('castConfig');

    const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
    const [categoryCode, setCategoryCode] = useState('');
    const [openModal, setOpenModal] = useState<ModalKind>('none');
    const [pending, setPending] = useState(false);
    const draft = useDatasetDraft();
    const groupsT1 = useCastConfigGroups('T1');
    const groupsT2 = useCastConfigGroups('T2');

    const [categoryReloadToken, setCategoryReloadToken] = useState(0);
    const [dataReloadToken, setDataReloadToken] = useState(0);
    const [historyReloadToken, setHistoryReloadToken] = useState(0);

    const categoryQuery = useMemo(() => ({ reloadToken: categoryReloadToken }), [categoryReloadToken]);
    const fetchedCategories = useCastConfigCategories(categoryQuery);
    const historyQuery = useMemo(() => (openModal === 'history' ? { reloadToken: historyReloadToken } : null), [historyReloadToken, openModal]);
    const fetchedHistory = useCastConfigApplyHistory(historyQuery);
    const currentCategory = fetchedCategories.data.find((category) => category.code === categoryCode) ?? fetchedCategories.data[0] ?? null;
    const terminalGroups = selectedGroup?.terminal === 'T2' ? groupsT2.data : groupsT1.data;
    const selectedGroupInfo = selectedGroup ? (terminalGroups?.find((group) => group.id === selectedGroup.groupId) ?? null) : null;

    useErrorAlert(groupsT1.error, groupsT1.responseSeq);
    useErrorAlert(groupsT2.error, groupsT2.responseSeq);
    useErrorAlert(fetchedCategories.error, fetchedCategories.responseSeq);
    useErrorAlert(fetchedHistory.error, fetchedHistory.responseSeq);

    const confirmDiscard = useCallback(async () => {
        if (draft.totalCount === 0) return true;

        return dialog.confirm({ title: 'Cast 설정', description: '저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 계속하시겠습니까?' }).catch(() => false);
    }, [draft.totalCount]);

    const handleCategorySelect = async (code: string) => {
        if (code === currentCategory?.code) return;
        if (!(await confirmDiscard())) return;

        draft.clearAll();
        setCategoryCode(code);
        setDataReloadToken((token) => token + 1);
    };

    const handleClone = async (dto: CastConfigCategoryCloneDto) => {
        setPending(true);

        try {
            const response = unwrap(await castConfigService.cloneCategory(dto), '카테고리를 복제하지 못했습니다.');
            draft.clearAll();
            setCategoryCode(response.fixAtrbGroupId);
            setCategoryReloadToken((token) => token + 1);
            setDataReloadToken((token) => token + 1);
            setOpenModal('none');
            dialog.alert({ title: '카테고리 복제', description: '전체 Cast 설정을 복제했습니다.' }).catch(() => {});
        } catch (error: unknown) {
            dialog.alert({ title: '카테고리 복제', description: errorMessage(error, '카테고리를 복제하지 못했습니다.') }).catch(() => {});
        } finally {
            setPending(false);
        }
    };

    const handleSave = async () => {
        if (!currentCategory || draft.totalCount === 0 || currentCategory.isBase || currentCategory.isPreProcess) return;

        const messages = draft.validationMessages();
        if (messages.length > 0) {
            dialog.alert({ title: '저장 값 확인', description: messages.join('\n') }).catch(() => {});
            return;
        }

        setPending(true);

        try {
            unwrap(await castConfigService.saveCategorySet(currentCategory.code, draft.saveItems()), '변경사항을 저장하지 못했습니다.');
            const count = draft.totalCount;
            draft.clearAll();
            setDataReloadToken((token) => token + 1);
            dialog.alert({ title: '저장 완료', description: `${count.toLocaleString('ko-KR')}개 변경사항을 저장했습니다.` }).catch(() => {});
        } catch (error: unknown) {
            dialog.alert({ title: '저장 실패', description: errorMessage(error, '변경사항을 저장하지 못했습니다.') }).catch(() => {});
        } finally {
            setPending(false);
        }
    };

    const handleApplyOper = async () => {
        if (!currentCategory || currentCategory.isBase || draft.totalCount > 0) return;

        const ok = await dialog
            .confirm({
                title: '운영 반영',
                description: `${currentCategory.name}(${currentCategory.code})의 T1/T2 전체 Cast 설정을 기준정보에 반영합니다. 계속하시겠습니까?`,
            })
            .catch(() => false);
        if (!ok) return;

        setPending(true);

        try {
            unwrap(await castConfigService.applyCategorySet(currentCategory.code), '기준정보에 반영하지 못했습니다.');
            setDataReloadToken((token) => token + 1);
            setHistoryReloadToken((token) => token + 1);
            dialog.alert({ title: '운영 반영', description: '전체 Cast 설정을 기준정보에 반영했습니다.' }).catch(() => {});
        } catch (error: unknown) {
            dialog.alert({ title: '운영 반영', description: errorMessage(error, '기준정보에 반영하지 못했습니다.') }).catch(() => {});
        } finally {
            setPending(false);
        }
    };

    const handleDownload = async () => {
        if (!currentCategory || draft.totalCount > 0) return;

        setPending(true);

        try {
            const response = unwrap(await castConfigService.getCategorySet(currentCategory.code), '전체 Cast 설정을 불러오지 못했습니다.');
            await downloadCastConfigWorkbook(currentCategory.name, response);
        } catch (error: unknown) {
            dialog.alert({ title: '엑셀저장', description: errorMessage(error, '엑셀 파일을 만들지 못했습니다.') }).catch(() => {});
        } finally {
            setPending(false);
        }
    };

    const handleRevert = async (aplySetSn: number) => {
        const ok = await dialog
            .confirm({ title: '전체 되돌리기', description: '이 반영 세트의 모든 설정을 반영 직전 값으로 복원합니다. 계속하시겠습니까?' })
            .catch(() => false);
        if (!ok) return;

        setPending(true);

        try {
            unwrap(await castConfigService.revertApplySet(aplySetSn), '반영 세트를 되돌리지 못했습니다.');
            setDataReloadToken((token) => token + 1);
            setHistoryReloadToken((token) => token + 1);
        } catch (error: unknown) {
            dialog.alert({ title: '전체 되돌리기', description: errorMessage(error, '반영 세트를 되돌리지 못했습니다.') }).catch(() => {});
        } finally {
            setPending(false);
        }
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
                        pending={pending}
                        onSelect={handleCategorySelect}
                        onClone={() => setOpenModal('clone')}
                        onSave={handleSave}
                        onApplyOper={handleApplyOper}
                        onDownload={handleDownload}
                        onOpenHistory={() => setOpenModal('history')}
                    />

                    <div className="cast-config-scene-row">
                        <FlowDiagram terminal="T1" groups={groupsT1.data ?? []} onOpenGroup={(groupId) => setSelectedGroup({ terminal: 'T1', groupId })} />
                        <FlowDiagram terminal="T2" groups={groupsT2.data ?? []} onOpenGroup={(groupId) => setSelectedGroup({ terminal: 'T2', groupId })} />
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

            {selectedGroupInfo && selectedGroup && currentCategory && (
                <DataConfigModal
                    key={`${selectedGroup.terminal}-${selectedGroupInfo.id}-${currentCategory.code}`}
                    terminal={selectedGroup.terminal}
                    group={selectedGroupInfo}
                    category={currentCategory}
                    draft={draft}
                    reloadToken={dataReloadToken}
                    onClose={() => setSelectedGroup(null)}
                />
            )}

            {openModal === 'clone' && currentCategory && (
                <CategoryRegisterModal source={currentCategory} saving={pending} onSubmit={handleClone} onClose={() => setOpenModal('none')} />
            )}

            {openModal === 'history' && (
                <PreProcessHistoryModal histories={fetchedHistory.data} reverting={pending} onRevert={handleRevert} onClose={() => setOpenModal('none')} />
            )}
        </div>
    );
}

export default CastConfig;
