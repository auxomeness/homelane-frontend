import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { submitAgentApplication } from './agentsApi.js';
import './agentApplicationPage.css';

export default function AgentApplicationPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const certificate = data.get('certificate');
    const password = String(data.get('password') ?? '');
    if (new TextEncoder().encode(password).length > 72) {
      setError('Use a password of at most 72 UTF-8 bytes.');
      return;
    }
    if (!(certificate instanceof File) || !certificate.size || certificate.size > 5 * 1024 * 1024 ||
      !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(certificate.type)) {
      setError('Attach a PDF, JPEG, PNG, or WebP certificate up to 5 MB.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await submitAgentApplication({
        fullName: String(data.get('fullName') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        mobileNumber: String(data.get('mobileNumber') ?? '').trim(),
        city: String(data.get('city') ?? '').trim(),
        licenseNumber: String(data.get('licenseNumber') ?? '').trim(),
        licenseExpiry: String(data.get('licenseExpiry') ?? ''),
        password,
        certificate,
      });
      setSubmitted(true);
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit application.');
    } finally {
      setSaving(false);
    }
  };

  return <main className="agent-application-page">
    <section className="agent-application-card">
      <p className="agent-application-eyebrow">HOMELANE · AGENT APPLICATION</p>
      {submitted ? <>
        <h1>Application submitted</h1>
        <p>Your profile and certificate are in the admin review queue. Your agent login will become available after approval.</p>
        <Link to="/agent">Go to agent sign in</Link>
      </> : <>
        <h1>Apply to become an agent</h1>
        <p>Submit your profile and license certificate for review. Use a password you will use to sign in after approval.</p>
        <form onSubmit={submit}>
          <label>Full name<input name="fullName" minLength={2} maxLength={100} autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" maxLength={254} autoComplete="email" required /></label>
          <label>Mobile number<input name="mobileNumber" type="tel" minLength={7} maxLength={25} autoComplete="tel" required /></label>
          <label>City<input name="city" minLength={2} maxLength={100} autoComplete="address-level2" required /></label>
          <label>License number<input name="licenseNumber" minLength={3} maxLength={60} required /></label>
          <label>License expiry<input name="licenseExpiry" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
          <label>License certificate (PDF or image, up to 5 MB)
            <input name="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" required />
          </label>
          <label>Password (at least 12 characters)
            <input name="password" type="password" minLength={12} maxLength={72} autoComplete="new-password" required />
          </label>
          {error && <p className="agent-application-error" role="alert">{error}</p>}
          <button type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit application'}</button>
        </form>
        <p>Already approved? <Link to="/agent">Agent sign in</Link></p>
      </>}
    </section>
  </main>;
}
