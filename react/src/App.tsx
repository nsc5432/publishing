import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { LoadingBar } from './components/ui/loading-bar';
import { DialogProvider } from './components/ui/dialog-provider';

const loadDashboard = () => import('./modules/pm/pages/dashboard/Dashboard');
const loadTerminalMap = () => import('./modules/pm/pages/terminalMap/TerminalMap');
const loadDepartureHall = () => import('./modules/pm/pages/departureHall/DepartureHall');
const loadCheckinCounter = () => import('./modules/pm/pages/checkinCounter/CheckinCounter');
const loadUserSmltConfig = () => import('./modules/pm/pages/userSmlt/UserSmltConfig');
const loadMonitoring = () => import('./modules/pm/pages/monitoring/Monitoring');
const loadFacilityMap = () => import('./modules/pm/pages/facilityMap/FacilityMap');

const DashboardPage = lazy(loadDashboard);
const TerminalMapPage = lazy(loadTerminalMap);
const DepartureHallPage = lazy(loadDepartureHall);
const CheckinCounterPage = lazy(loadCheckinCounter);
const UserSmltConfigPage = lazy(loadUserSmltConfig);
const MonitoringPage = lazy(loadMonitoring);
const FacilityMapPage = lazy(loadFacilityMap);

/**
 * 첫 화면을 그린 뒤 나머지 화면 청크를 미리 받아 둔다.
 *
 * LNB 는 화면 사이를 수시로 오가는 메뉴인데, 청크를 그때 처음 받으면 Suspense 가
 * 잠깐 빈 화면을 그려서 전환이 깜빡인 것처럼 보인다. 미리 받아 두면 메뉴 클릭이
 * 곧바로 다음 화면으로 이어진다(이미 받은 청크는 재요청하지 않는다).
 * 첫 화면 렌더와 경쟁하지 않도록 유휴 시점으로 미룬다.
 */
function usePreloadPages() {
    useEffect(() => {
        const warm = () => {
            void loadDashboard();
            void loadTerminalMap();
            void loadDepartureHall();
            void loadCheckinCounter();
            void loadUserSmltConfig();
            void loadMonitoring();
            void loadFacilityMap();
        };

        // requestIdleCallback 미지원 브라우저(Safari 등)는 짧은 타이머로 대체한다.
        if (typeof window.requestIdleCallback === 'function') {
            const id = window.requestIdleCallback(warm, { timeout: 2000 });
            return () => window.cancelIdleCallback(id);
        }
        const id = window.setTimeout(warm, 300);
        return () => window.clearTimeout(id);
    }, []);
}

const PmLayout = () => {
    return (
        <div className="pm-shell">
            <div className="pm-shell__body">
                <Outlet />
            </div>
        </div>
    );
};

function App() {
    usePreloadPages();

    return (
        <BrowserRouter>
            <Suspense>
                <DialogProvider>
                    <LoadingBar />
                    <Routes>
                        <Route element={<PmLayout />}>
                            <Route path="/rui/pm" element={<DashboardPage />} />
                            <Route
                                path="/rui/pm/daily-smlt/dashboard"
                                element={<DashboardPage />}
                            />
                            <Route
                                path="/rui/pm/daily-smlt/terminalMap"
                                element={<TerminalMapPage />}
                            />
                            <Route
                                path="/rui/pm/daily-smlt/departureHall"
                                element={<DepartureHallPage />}
                            />
                            <Route
                                path="/rui/pm/daily-smlt/checkinCounter"
                                element={<CheckinCounterPage />}
                            />
                            <Route
                                path="/rui/pm/user-smlt/config"
                                element={<UserSmltConfigPage />}
                            />
                            <Route path="/rui/pm/smlt-monitoring" element={<MonitoringPage />} />
                            <Route path="/rui/pm/fclt-map" element={<FacilityMapPage />} />
                        </Route>
                    </Routes>
                </DialogProvider>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
