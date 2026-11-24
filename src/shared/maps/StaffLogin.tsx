import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { loginStaff, registerAgent, setStaffToken } from './listingsApi.js';
import './staffLogin.css';

export default function StaffLogin({ role }: { role: 'agent' | 'admin' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAgent = role === 'agent';

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const user = isSignup && isAgent ? await registerAgent(name, email, password) : await loginStaff(email, password);
      if (user.role !== role) { setStaffToken(null); throw new Error(`This account does not have the ${role} role.`); }
      navigate(isSignup ? '/agent/dashboard' : location.pathname === '/staff/login' ? `/${role}` : location.pathname, { replace: true });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue. Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <main className={`staff-login${isAgent ? ' staff-login--agent' : ''}`}>
      {isAgent && <section className="staff-login__story">
        <Link className="staff-login__brand" to="/"><img src="/logo/Stylized%20House%20with%20Sweeping%20Lane.png" alt="" /> homelane</Link>
        <div className="staff-login__story-copy"><span className="staff-login__eyebrow"><span /> HOMELANE FOR AGENTS</span><h1>Good work<br />starts with a<br /><em>good workspace.</em></h1><p>Keep your listings organized, follow up with buyers, and stay on top of every viewing.</p>
          <div className="staff-login__benefits"><span><Building2 size={18} /> Manage your listings</span><span><Mail size={18} /> Keep buyer conversations moving</span><span><BadgeCheck size={18} /> See every next step clearly</span></div>
        </div>
        <span className="staff-login__story-foot">A better place to do your best work.</span>
      </section>}
      <section className="staff-login__form-side">
        <Link className="staff-login__back" to="/"><ArrowLeft size={16} /> Back to Homelane</Link>
        <form className="staff-login__card" onSubmit={submit}>
          {!isAgent && <p className="staff-login__eyebrow">HOMELANE · ADMIN</p>}
          <div className="staff-login__card-icon"><KeyRound size={21} /></div>
          <span className="staff-login__welcome">{isSignup ? 'JOIN HOMELANE' : isAgent ? 'WELCOME BACK' : 'ADMINISTRATOR'}</span>
          <h2>{isSignup ? 'Create your agent account' : isAgent ? 'Sign in to your workspace' : 'Admin sign in'}</h2>
          <p className="staff-login__intro">{isSignup ? 'Set up your details and start managing your property business.' : isAgent ? 'Your listings, conversations, and viewings are all in one place.' : 'Sign in to manage reviews and platform settings.'}</p>
          {isSignup && <label className="staff-login__field"><span>Your name</span><span className="staff-login__input"><UserRound size={17} /><input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Santos" minLength={2} maxLength={120} required /></span></label>}
          <label className="staff-login__field"><span>Email address</span><span className="staff-login__input"><Mail size={17} /><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></span></label>
          <label className="staff-login__field"><span>Password{isSignup && <small>At least 10 characters</small>}</span><span className="staff-login__input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={isSignup ? 10 : undefined} placeholder={isSignup ? 'Create a strong password' : 'Enter your password'} required /><button className="staff-login__toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {error && <p className="staff-login__error" role="alert">{error}</p>}
          <button className="staff-login__submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'} {!busy && <ArrowRight size={17} />}</button>
          {isAgent && <p className="staff-login__switch">{isSignup ? 'Already have an account?' : 'New to Homelane?'} <button type="button" onClick={() => { setIsSignup((current) => !current); setError(''); }}>{isSignup ? 'Sign in' : 'Create an agent account'}</button></p>}
          {!isAgent && <p className="staff-login__admin-note">Admin accounts are provisioned by your Homelane administrator.</p>}
        </form>
        <p className="staff-login__secure"><LockKeyhole size={13} /> Your workspace is private and secure</p>
      </section>
    </main>
  );
}
