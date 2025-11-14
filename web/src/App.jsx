import { Routes, Route } from 'react-router-dom';
import LoginRegisterPage from './components/LoginRegisterPage';
import DashboardPage from './components/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginRegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;
