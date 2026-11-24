import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, CalendarDays, Eye, EyeOff, KeyRound, LockKeyhole, Mail, MapPin, UserRound } from 'lucide-react';
// Reuses the agent sign-in layout so buyers and agents share one look.
import '../shared/maps/staffLogin.css';
import './authLogin.css';

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export default function AuthLogin() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // /auth/login shows the buyer sign in form. /auth/login?mode=signup shows the buyer sign up form.
  const isSignup = params.get('mode') === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/buyers/${isSignup ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? 'Unable to sign in. Please try again.');
      sessionStorage.setItem('homelane.buyer-token.v1', result.token);
      const requestedPath = (location.state as { from?: unknown } | null)?.from;
      navigate(typeof requestedPath === 'string' && requestedPath.startsWith('/discovery') ? requestedPath : '/discovery', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="staff-login staff-login--agent auth-login-buyer">
      <section className="staff-login__story">
        <Link className="staff-login__brand" to="/"><img src="/logo/Stylized%20House%20with%20Sweeping%20Lane.png" alt="" /> homelane</Link>
        <div className="staff-login__story-copy">
          <span className="staff-login__eyebrow"><span /> HOMELANE FOR BUYERS</span>
          <h1>Your next home<br />starts with a<br /><em>good search.</em></h1>
          <p>Browse homes on the map, save the ones you like, and talk to agents when you are ready.</p>
          <div className="staff-login__benefits">
            <span><MapPin size={18} /> Explore homes on the map</span>
            <span><Mail size={18} /> Message agents directly</span>
            <span><CalendarDays size={18} /> Request viewings with ease</span>
          </div>
        </div>
        <span className="staff-login__story-foot">Finding your place, one step at a time.</span>
      </section>
      <section className="staff-login__form-side">
        <Link className="staff-login__back" to="/"><ArrowLeft size={16} /> Back to Homelane</Link>
        <form className="staff-login__card" onSubmit={submit}>
          <div className="staff-login__card-icon"><KeyRound size={21} /></div>
          <span className="staff-login__welcome">{isSignup ? 'JOIN HOMELANE' : 'WELCOME BACK'}</span>
          <h2>{isSignup ? 'Create your buyer account' : 'Sign in to find your home'}</h2>
          <p className="staff-login__intro">{isSignup ? 'Save homes and connect with agents.' : 'Your saved homes, messages, and viewings are waiting for you.'}</p>
          {isSignup && <label className="staff-login__field"><span>Your name</span><span className="staff-login__input"><UserRound size={17} /><input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Santos" minLength={2} maxLength={120} required /></span></label>}
          <label className="staff-login__field"><span>Email address</span><span className="staff-login__input"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></span></label>
          <label className="staff-login__field"><span>Password{isSignup && <small>At least 10 characters</small>}</span><span className="staff-login__input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={isSignup ? 10 : undefined} maxLength={128} placeholder={isSignup ? 'Create a strong password' : 'Enter your password'} required /><button className="staff-login__toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <Eye size={17} /> : <EyeOff size={17} />}</button></span></label>
          {error && <p className="staff-login__error" role="alert">{error}</p>}
          <button className="staff-login__submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'} {!busy && <ArrowRight size={17} />}</button>
          <p className="staff-login__switch">{isSignup ? 'Already have an account?' : 'New to Homelane?'} <Link to={isSignup ? '/auth/login' : '/auth/login?mode=signup'} onClick={() => setError('')}>{isSignup ? 'Sign in' : 'Create a buyer account'}</Link></p>
          <p className="staff-login__switch">Just looking around? <Link to="/visitor">Enter as Visitor</Link></p>
        </form>
        <p className="staff-login__secure"><LockKeyhole size={13} /> Your account is private and secure</p>
      </section>
    </main>
  );
}
