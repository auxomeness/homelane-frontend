import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { loginAccount, setAccountToken } from './listingsApi.js';
import './accountLogin.css';

export default function AccountLogin({ role }: { role: 'agent' | 'admin' }) {
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState(''); 
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate(); 
  const location = useLocation();
  
  const submit = async (event: FormEvent) => {
    event.preventDefault(); 
    setBusy(true); 
    setError('');
    
    try { 
      const user = await loginAccount(email, password); 
      
      if (user.role !== role) { 
        setAccountToken(null); 
        
        throw new Error(`This account does not have the ${role} role.`);
      }
      
      navigate(location.pathname, { replace: true });
    }
    
    catch (reason) { 
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.'); 
    }

    finally { setBusy(false); }
  };

  return (
  <main className="account-login">
    <form onSubmit={submit}>
      <p className="account-login__eyebrow">HOMELANE · {role.toUpperCase()}</p>
      
      <h1>{role === 'admin' ? 'Admin sign in' : 'Agent sign in'}</h1>
      <p>Sign in to manage shared property listings.</p>
      
      <label>Email
        <input 
          type="email" 
          autoComplete="username" 
          value={email} 
          onChange={(event) => setEmail(event.target.value)}
          required />
      </label>
      
      <label>Password
        <input 
          type="password" 
          autoComplete="current-password" 
          value={password} 
          onChange={(event) => setPassword(event.target.value)} 
          required />
      </label>
      
      {error && <p className="account-login-error" role="alert">{error}</p>}
      
      <button type="submit" disabled={busy}> {
      busy 
      ? 
      'Signing in…' : 'Sign in'
      }
      </button>
    </form>
  </main>
    );
}
