import { lazy, Suspense } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { LoadingBar } from './components/ui/loading-bar';
import { DialogProvider } from './components/ui/dialog-provider';

const DashboardPage = lazy(() => import('./modules/pm/pages/dashboard/Dashboard'));
const TerminalMapPage = lazy(() => import('./modules/pm/pages/terminalMap/TerminalMap'));
const UserSmltConfigPage = lazy(() => import('./modules/pm/pages/userSmlt/UserSmltConfig'));

/**
 * PM 화면 공통 셸.
 *
 * 화면들이 "한 화면에 꽉 차게" 짜여 있어(.wrap / .body 가 flex:1 로 남은 높이를 먹는다)
 * 셸이 높이를 그대로 흘려보내 줘야 한다. 여기서 flex 사슬이 한 번이라도 끊기면
 * 안쪽 높이가 전부 auto 로 풀려 하단 버튼이 화면 밖으로 밀려난다.
 */
const PmLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden select-none">
            {/* 화면이 최소 너비(맵 형태 조회 = 1440px)보다 좁으면 가로로 스크롤한다.
                세로는 각 화면이 한 화면에 맞추므로 잠근다. */}
            <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-x-auto overflow-y-hidden">
                <Outlet />
            </div>
        </div>
    );
};

function App() {
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
                                path="/rui/pm/user-smlt/config"
                                element={<UserSmltConfigPage />}
                            />
                        </Route>
                    </Routes>
                </DialogProvider>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
