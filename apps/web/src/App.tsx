import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Providers } from './components/providers';
import { Toaster } from './components/ui/sonner';

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </Providers>
  );
}
