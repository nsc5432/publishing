import TerminalMap from '@/modules/pm/terminalMap/TerminalMap';
import Dashboard from './modules/pm/dashboard/Dashboard';

/** 라우터 도입 전까지 화면 하나만 렌더한다. (대시보드: @/modules/pm/dashboard/Dashboard) */
function App() {
    return <Dashboard />;
}

export default App;
