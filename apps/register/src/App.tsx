import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SlugRedirect from './pages/SlugRedirect';
import EventRegistration from './pages/EventRegistration';
import ThankYou from './pages/ThankYou';
import Verify from './pages/Verify';
import Unsubscribe from './pages/Unsubscribe';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/r/:slug" element={<SlugRedirect />} />
        <Route path="/e/:code" element={<EventRegistration />} />
        <Route path="/e/:code/thank-you" element={<ThankYou />} />
        <Route path="/verify/:token" element={<Verify />} />
        <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
      </Routes>
    </BrowserRouter>
  );
}
