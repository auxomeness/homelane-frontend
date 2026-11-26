import { useState } from 'react';
import { useNavigate } from 'react-router';
import { House, Info, UserRound } from 'lucide-react';
import LoginModal from '../login/LoginModal';
import './signup.css';

type AccountType = 'buyer' | 'agent';

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>('buyer');
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <main className="signup-page">
      <div className="signup-shell">
        <header className="signup-header">
          <a className="signup-brand" href="/" aria-label="Homelane home"><span className="signup-brand__mark" />HOMELANE</a>
          <button className="signup-header__signin" type="button" onClick={() => setLoginOpen(true)}>Sign in</button>
        </header>

        <section className="signup-content">
          <h1>Create your account</h1>
          <p className="signup-subtitle">Pick how you will use HOMELANE.</p>

          <div className="signup-roles" aria-label="Choose account type">
            <button type="button" className={`signup-role${accountType === 'buyer' ? ' is-selected' : ''}`} aria-pressed={accountType === 'buyer'} onClick={() => setAccountType('buyer')}>
              <UserRound size={22} /><strong>I am a buyer</strong><span>Search and save homes</span>
            </button>
            <button type="button" className={`signup-role${accountType === 'agent' ? ' is-selected' : ''}`} aria-pressed={accountType === 'agent'} onClick={() => setAccountType('agent')}>
              <House size={22} /><strong>I am an agent</strong><span>List and sell homes</span>
            </button>
          </div>

          <form className="signup-form" onSubmit={(event) => { event.preventDefault(); }}>
            <label htmlFor="signup-name">Full name</label>
            <input id="signup-name" name="name" placeholder="Your full name" autoComplete="name" required />
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" name="email" type="email" placeholder="you@email.com" autoComplete="email" required />
            <label htmlFor="signup-password">Password</label>
            <input id="signup-password" name="password" type="password" placeholder="At least 8 characters" minLength={8} autoComplete="new-password" required />
            <p className="signup-hint">At least 8 characters</p>
            <p className="signup-terms">By continuing you accept the terms and privacy notice.</p>
            <button className="signup-submit" type="submit">Create account</button>
          </form>

          <p className="signup-existing">Already have an account? <button type="button" onClick={() => setLoginOpen(true)}>Sign in</button></p>
          {accountType === 'agent' && <aside className="signup-notice"><Info size={17} /><span>Agents are reviewed by an admin before they can publish listings.</span></aside>}
        </section>
      </div>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
