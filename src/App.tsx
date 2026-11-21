import { useState } from 'react';
import { useNavigate } from 'react-router';
import LoginModal from './visitor/components/login/LoginModal';
import './app.css';

export default function App() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <main className="landing-page">
      <section className="landing-card" aria-label="Homelane welcome">
        <h1>HOMELANE</h1>
        <button type="button" onClick={() => setLoginOpen(true)}>Log in</button>
        <button type="button" onClick={() => navigate('/signup')}>Sign up</button>
        <button className="landing-visitor" type="button" onClick={() => navigate('/visitor')}>Enter as Visitor</button>
      </section>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
