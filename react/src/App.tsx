import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { LoadingBar } from './components/ui/loading-bar';
import { DialogProvider } from './components/ui/dialog-provider';
import { AccessGuard } from './modules/pm/auth/AccessGuard';

const loadDashboard = () => import('./modules/pm/pages/castSmry/dashboard/Dashboard');
const loadTerminalMap = () => import('./modules/pm/pages/castSmry/terminalMap/TerminalMap');
const loadDepartureHall = () => import('./modules/pm/pages/castSmry/departureHall/DepartureHall');
const loadCheckinCounter = () => import('./modules/pm/pages/castSmry/checkinCounter/CheckinCounter');
const loadUserSmltConfig = () => import('./modules/pm/pages/userSmlt/UserSmltConfig');
const loadMonitoring = () => import('./modules/pm/pages/monitoring/Monitoring');
const loadFacilityMap = () => import('./modules/pm/pages/facilityMap/FacilityMap');
const loadCastConfig = () => import('./modules/pm/pages/castConfig/CastConfig');

const DashboardPage = lazy(loadDashboard);
const TerminalMapPage = lazy(loadTerminalMap);
const DepartureHallPage = lazy(loadDepartureHall);
const CheckinCounterPage = lazy(loadCheckinCounter);
const UserSmltConfigPage = lazy(loadUserSmltConfig);
const MonitoringPage = lazy(loadMonitoring);
const FacilityMapPage = lazy(loadFacilityMap);
const CastConfigPage = lazy(loadCastConfig);

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
            void loadCastConfig();
        };

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
                <AccessGuard>
                    <Outlet />
                </AccessGuard>
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
                            <Route path="/rui/pm/daily-smlt/dashboard" element={<DashboardPage />} />
                            <Route path="/rui/pm/daily-smlt/terminalMap" element={<TerminalMapPage />} />
                            <Route path="/rui/pm/daily-smlt/departureHall" element={<DepartureHallPage />} />
                            <Route path="/rui/pm/daily-smlt/checkinCounter" element={<CheckinCounterPage />} />
                            <Route path="/rui/pm/user-smlt/config" element={<UserSmltConfigPage />} />
                            {/* 일일 경로와 같은 컴포넌트라 key 가 없으면 모드를 오갈 때 상태가 그대로 남는다 */}
                            <Route path="/rui/pm/user-smlt/dashboard" element={<DashboardPage key="user" />} />
                            <Route path="/rui/pm/user-smlt/terminalMap" element={<TerminalMapPage key="user" />} />
                            <Route path="/rui/pm/user-smlt/departureHall" element={<DepartureHallPage key="user" />} />
                            <Route path="/rui/pm/user-smlt/checkinCounter" element={<CheckinCounterPage key="user" />} />
                            <Route path="/rui/pm/smlt-monitoring" element={<MonitoringPage />} />
                            <Route path="/rui/pm/fclt-map" element={<FacilityMapPage />} />
                            <Route path="/rui/pm/cast-config" element={<CastConfigPage />} />
                        </Route>
                    </Routes>
                </DialogProvider>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
