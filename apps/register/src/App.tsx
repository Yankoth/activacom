import { BrowserRouter, Routes, Route } from 'react-router-dom';

function SlugRedirect() {
  return <div>Redirect by slug</div>;
}

function EventRegistration() {
  return <div>Registration form</div>;
}

function ThankYou() {
  return <div>Thank you</div>;
}

function Verify() {
  return <div>Verification</div>;
}

function Unsubscribe() {
  return <div>Unsubscribe</div>;
}

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
