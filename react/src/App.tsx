import { lazy, Suspense } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { LoadingBar } from './components/ui/loading-bar';
import { DialogProvider } from './components/ui/dialog-provider';


const DashboardPage = lazy(() => import('./modules/pm/pages/dashboard/Dashboard'));
const TerminalMapPage = lazy(() => import('./modules/pm/pages/terminalMap/TerminalMap'));
const UserSmltConfigPage = lazy(() => import('./modules/pm/pages/userSmlt/UserSmltConfig'));

const PmLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden select-none">
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    )
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
                            <Route path="/rui/pm/daily-smlt/dashboard" element={<DashboardPage />} />
                            <Route path="/rui/pm/daily-smlt/terminalMap" element={<TerminalMapPage />} />
                            <Route path="/rui/pm/user-smlt/config" element={<UserSmltConfigPage />} />
                        </Route>
                    </Routes>
                </DialogProvider>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
