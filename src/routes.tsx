import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/Home';

import Privacy from '@/pages/docs/Privacy';
import Terms from '@/pages/docs/Terms';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
    </Routes>
  );
}