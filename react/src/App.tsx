import Dashboard from '@/modules/pm/dashboard/Dashboard';
// import TerminalMap from '@/modules/pm/terminalMap/TerminalMap';
// import UserSmltConfig from '@/modules/pm/userSmlt/UserSmltConfig';
/**
 * 라우터 도입 전까지 화면 하나만 렌더한다.
 * 다른 화면을 보려면 아래 import 를 교체한다.
 * - 대시보드: @/modules/pm/dashboard/Dashboard
 * - 터미널 맵: @/modules/pm/terminalMap/TerminalMap
 * - 사용자 시뮬레이션: @/modules/pm/userSmlt/UserSmltConfig
 */
function App() {
    return <Dashboard />;
}

export default App;
