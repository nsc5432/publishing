import './dashboard.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lnb } from '@/components/lnb';
import { useErrorAlert } from '@/hooks/useErrorAlert';
import { usePageScope } from '@/hooks/usePageScope';
import type { DsbdCategory, SmltType, TmnlId } from '@/types/api.types';
import { HeaderSummary } from './components/HeaderSummary';
import { TerminalSummary } from './components/TerminalSummary';
import { Topbar } from './components/Topbar';
import { defaultTime, formatDateTime, formatYmd, todayYmd } from '@/lib/format';
import { useBaseInfo } from '@/hooks/useBaseInfo';
import { toSimulationType } from './view';
import {
    useDashboardHeader,
    useTerminalPanel,
    type DashboardQuery,
} from './hooks/useDashboardData';
import { useExecDetail } from './hooks/useExecDetail';
import { useFitToScreen } from './hooks/useFitToScreen';

const USER_SMLT_CONFIG_PATH = '/rui/pm/user-smlt/config';

/** 최초 진입 조회 지표 — Prime Time 타일과 패널 제목이 같은 값에서 출발한다 */
const DEFAULT_CATEGORY: DsbdCategory = 'PSG';

/**
 * PM 예측관리 / 시뮬레이션 결과 조회 — 메인 대시보드.
 *
 * 화면에 들어오면 기준 정보(getBaseInfo)를 먼저 부르고, 거기서 받은
 * 시뮬레이션 ID·기준 시각으로 상단 카드와 두 터미널 패널을 조회한다.
 *
 * 일일 시뮬레이션과 사용자 시뮬레이션이 **같은 화면**을 쓴다. 그냥 들어오면 오늘의 일일
 * 시뮬레이션이고, 모니터링 이력에서 넘어오면 쿼리 파라미터로 볼 시뮬레이션을 지목한다.
 * 사용자 시뮬레이션이면 실행자(부서·성명)와 실행에 쓴 설정 조건으로 가는 길이 함께 붙는다.
 */
function Dashboard() {
    usePageScope('dashboard');
    const navigate = useNavigate();

    // 모니터링에서 넘어왔다면 볼 시뮬레이션이 지목돼 있다 (없으면 그날의 일일 시뮬레이션).
    const [params, setParams] = useSearchParams();
    const targetSmltId = params.get('smltId') ?? '';
    const targetSmltType = (params.get('smltType') as SmltType | null) ?? null;
    const targetTmnlId = (params.get('tmnlId') as TmnlId | null) ?? null;

    // 기준일자 — 지목된 시뮬레이션이 있으면 그 일자로, 아니면 오늘.
    // 달력에서 날짜를 바꾸면 기준 정보부터 다시 받는다.
    const [ymd, setYmd] = useState(() => params.get('ymd') || todayYmd());
    const { data: baseInfo, error: baseError } = useBaseInfo(ymd, targetSmltId);

    // 파라미터가 알려 준 구분을 먼저 믿는다 — 기준 정보를 받기 전에도 제목·뱃지가 흔들리지 않는다.
    const simulationType = toSimulationType(targetSmltType ?? baseInfo?.smltType ?? 'DAILY');
    const isUserSmlt = simulationType === 'user';

    // 실행자 정보는 사용자 시뮬레이션에만 있다.
    const { data: execDetail } = useExecDetail(isUserSmlt ? targetSmltId : '');

    // 상단 바에서 고르는 중인 시각 (아직 조회하지 않은 값)
    const [draftTime, setDraftTime] = useState('');
    // 조회 버튼으로 확정된 조건 — 실제 데이터 조회는 이 값만 따른다
    const [query, setQuery] = useState<DashboardQuery | null>(null);
    const [category, setCategory] = useState<DsbdCategory>(DEFAULT_CATEGORY);
    // Prime Time 타일을 눌러 고른 지표만 담는다 — Top Bar 검색으로 조회하면 비운다 (패널 제목 문구용).
    // 최초 진입은 타일도 기본값이 눌린 상태라 제목 문구도 같이 세워 둔다.
    const [primeCategory, setPrimeCategory] = useState<DsbdCategory | null>(DEFAULT_CATEGORY);

    // 기준 정보를 받으면 가장 늦은 시각으로 첫 조회까지 끝낸다.
    useEffect(() => {
        if (!baseInfo) return;

        const hhmm = defaultTime(baseInfo.avlTimes);
        setDraftTime(hhmm);
        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm });
    }, [baseInfo]);

    const { data: header, error: headerError } = useDashboardHeader(query);
    const { data: terminal1View, error: t1Error } = useTerminalPanel(query, 'T1', category);
    const { data: terminal2View, error: t2Error } = useTerminalPanel(query, 'T2', category);

    // 조회가 여러 갈래라 먼저 걸린 사유 하나만 알린다 (같은 실패로 알럿이 겹치지 않게).
    const error = baseError || headerError || t1Error || t2Error;

    useErrorAlert(error);

    useFitToScreen();

    // 기준 정보를 받기 전에는 빈 값이라, 한쪽만 고를 때 나머지는 00 으로 채운다.
    const hour = draftTime.slice(0, 2);
    const minute = draftTime.slice(2, 4);

    // 달력을 비우면(입력값이 지워지면) 직전 기준일자를 그대로 둔다.
    // 날짜를 바꾸면 지목된 시뮬레이션과 일자가 어긋나므로, 파라미터를 비워
    // 그날의 일일 시뮬레이션으로 되돌아간다.
    const handleDateChange = useCallback(
        (nextYmd: string) => {
            if (nextYmd.length !== 8) return;

            setYmd(nextYmd);
            setPrimeCategory(null);
            setParams({}, { replace: true });
        },
        [setParams],
    );

    const handleSearch = useCallback(() => {
        if (!baseInfo || !draftTime) return;

        setQuery({ smltId: baseInfo.smltId, ymd: baseInfo.ymd, hhmm: draftTime });
        setPrimeCategory(null);
    }, [baseInfo, draftTime]);

    const handleCategoryChange = useCallback((nextCategory: DsbdCategory) => {
        setCategory(nextCategory);
        setPrimeCategory(nextCategory);
    }, []);

    /** 실행에 쓴 설정 조건 — 사용자 시뮬레이션 조건설정 화면을 조회 전용으로 연다 */
    const handleViewConfig = useCallback(() => {
        const query = new URLSearchParams({
            mode: 'view',
            smltId: targetSmltId,
            ymd: baseInfo?.ymd || ymd,
        });

        // 실행은 터미널 단위라 어느 쪽 설정인지 함께 넘긴다 (없으면 양쪽 다 편다).
        const tmnlId = targetTmnlId ?? execDetail?.tmnlId;
        if (tmnlId) query.set('tmnlId', tmnlId);

        navigate(`${USER_SMLT_CONFIG_PATH}?${query.toString()}`);
    }, [navigate, targetSmltId, targetTmnlId, execDetail, baseInfo, ymd]);

    // 실행자는 사용자 시뮬레이션이면서 이력을 받아 왔을 때만 띄운다.
    const executor = useMemo(
        () => (execDetail ? { dept: execDetail.deptNm, name: execDetail.userNm } : undefined),
        [execDetail],
    );

    return (
        <>
            <Topbar
                simulationType={simulationType}
                baseYmd={ymd}
                hour={hour}
                minute={minute}
                lastCalc={formatDateTime(baseInfo?.lastCalcDt ?? '')}
                nextCalc={formatDateTime(baseInfo?.nextCalcDt ?? '')}
                executor={executor}
                onViewConfig={isUserSmlt && targetSmltId ? handleViewConfig : undefined}
                onDateChange={handleDateChange}
                onHourChange={(nextHour) => setDraftTime(nextHour + (minute || '00'))}
                onMinuteChange={(nextMinute) => setDraftTime((hour || '00') + nextMinute)}
                onSearch={handleSearch}
            />
            <Lnb />

            <div className="app">
                <HeaderSummary
                    planDate={formatYmd(header?.ymd ?? baseInfo?.ymd ?? '', '-')}
                    header={header}
                    category={category}
                    onCategoryChange={handleCategoryChange}
                >
                    <section className="row row--panels">
                        <TerminalSummary
                            terminal="T1"
                            data={terminal1View}
                            titleCategory={primeCategory}
                        />
                        <TerminalSummary
                            terminal="T2"
                            data={terminal2View}
                            titleCategory={primeCategory}
                        />
                    </section>
                </HeaderSummary>
            </div>
        </>
    );
}

export default Dashboard;
