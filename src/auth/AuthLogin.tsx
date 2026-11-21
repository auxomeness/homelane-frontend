import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import './authLogin.css';

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export default function AuthLogin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mode = params.get('mode') === 'login' || params.get('mode') === 'signup' ? params.get('mode')! : null;
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/discovery', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-login">
      {!mode ? (
        <section className="auth-login__chooser" aria-labelledby="auth-login-title">
          <h1 id="auth-login-title">HOMELANE</h1>
          <div className="auth-login__choices">
            <Link className="auth-login__primary" to="/auth/login?mode=login">Log in</Link>
            <Link className="auth-login__primary" to="/auth/login?mode=signup">Signup</Link>
            <Link className="auth-login__visitor" to="/visitor">Enter as Visitor</Link>
          </div>
        </section>
      ) : (
        <section className="auth-login__form-wrap" aria-labelledby="auth-form-title">
          <Link className="auth-login__back" to="/auth/login">HOMELANE</Link>
          <h1 id="auth-form-title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p>{isSignup ? 'Save homes and connect with agents.' : 'Log in to continue to Homelane.'}</p>
          <form onSubmit={submit}>
            {isSignup && <label>Name<input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></label>}
            <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={isSignup ? 10 : undefined} maxLength={128} required /></label>
            {error && <p className="auth-login__error" role="alert">{error}</p>}
            <button className="auth-login__primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}</button>
          </form>
          <Link className="auth-login__visitor" to="/visitor">Enter as Visitor</Link>
        </section>
      )}
    </main>
  );
}
