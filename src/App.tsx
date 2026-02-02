import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ImportPage } from './pages/ImportPage';
import { OverviewPage } from './pages/OverviewPage';
import { ReviewPage } from './pages/ReviewPage';
import './styles/global.css';

// 与 vite.config 中 base 一致，用于子路径部署（如 GitHub Pages）
const basename = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/review/:albumId" element={<ReviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
