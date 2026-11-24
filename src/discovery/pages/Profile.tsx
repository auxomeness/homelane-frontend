import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { clearBuyerSession, getBuyerProfile, getSavedListings, updateBuyerProfile, unsaveListing, type BuyerProfile, type SavedListing } from '../buyerApi.js';
import StateMessage from '../shared/StateMessage.js';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [saved, setSaved] = useState<SavedListing[]>([]);
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => {
    Promise.all([getBuyerProfile(), getSavedListings()]).then(([user, listings]) => { setProfile(user); setName(user.name); setEmail(user.email); setSaved(listings); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const user = await updateBuyerProfile({ name, email }); setProfile(user); setNotice('Profile updated.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update profile.'); }
    finally { setBusy(false); }
  };
  const removeSaved = async (id: string) => {
    try { await unsaveListing(id); setSaved((items) => items.filter((item) => item.id !== id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to remove saved home.'); }
  };
  const signOut = () => { clearBuyerSession(); navigate('/auth/login', { replace: true }); };
  return <main className="discovery-page profile-page">
    <h1 className="discovery-title">Your account</h1>
    {loading ? <StateMessage title="Loading your account…" text="Your profile and saved homes are loading." kind="loading" /> : <>
      {error && <p className="auth-login__error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      <form className="profile-form" onSubmit={save}>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required /></label>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
        <button type="button" onClick={signOut}>Sign out</button>
      </form>
      {profile && <p className="profile-page__account">Signed in as {profile.email}</p>}
      <section className="saved-homes"><h2>Saved homes</h2>
        {!saved.length ? <StateMessage title="No saved homes yet." text="Save a property while browsing and it will appear here." /> : <div className="property-list-grid">{saved.map((home) => <article className="property-list-card" key={home.id}>
          {home.photos[0] ? <img src={home.photos[0]} alt={home.title} /> : <div className="property-list-card__image">⌂</div>}
          <div><span>{home.propertyType}</span><h3>{home.title}</h3><p>{home.location}</p><strong>₱ {Number(home.price).toLocaleString('en-PH')}</strong>
            <div className="saved-homes__actions"><Link to={`/discovery/map?selected=${encodeURIComponent(home.id)}`}>View on map</Link><button type="button" onClick={() => void removeSaved(home.id)}>Remove</button></div>
          </div>
        </article>)}</div>}
      </section>
    </>}
  </main>;
}
