import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import API_BASE_URL from './config/api';

function App() {
  // Auto wake up free-tier cloud backend servers (Render/Railway cold starts)
  useEffect(() => {
    try {
      fetch(`${API_BASE_URL}/health`, { method: 'GET', keepalive: true }).catch(() => {});
    } catch {
      // Ignore warm-up failure
    }
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
