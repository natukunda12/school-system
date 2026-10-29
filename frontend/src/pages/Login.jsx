import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import api, { errMsg } from '../api';
import { Field, Msg, useForm } from '../ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [f, bind] = useForm({});
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(f.username, f.password);
        nav(location.state?.from || '/', { replace: true });
      } else {
        if (f.password !== f.confirm) throw { response: { data: { message: 'Passwords do not match' } } };
        const { data } = await api.post('/auth/student-account', { student_code: f.student_code, phone: f.phone, password: f.password });
        setCreated(data.username);
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="row" style={{ marginBottom: 16 }}>
          <div className="logo">🎓</div>
          <div>
            <h3>College Mont Sion</h3>
            <div className="muted">School Management System</div>
          </div>
        </div>

        {created ? (
          <>
            <Msg type="ok">Account created! Your username is:</Msg>
            <h2 style={{ textAlign: 'center' }}>{created}</h2>
            <p className="muted">Write it down. You need it to log in.</p>
            <button className="btn" style={{ width: '100%' }} onClick={() => { setCreated(null); setMode('login'); }}>Go to login</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <Msg>{error}</Msg>
            {mode === 'login' ? (
              <>
                <Field label="Username"><input {...bind('username')} required autoFocus /></Field>
                <Field label="Password"><input type="password" {...bind('password')} required /></Field>
              </>
            ) : (
              <>
                <p className="muted">Use the Student ID given by the school and the phone number registered for you or your parent.</p>
                <Field label="Student ID"><input {...bind('student_code')} placeholder="STU-2026-0001" required /></Field>
                <Field label="Registered phone number"><input {...bind('phone')} required /></Field>
                <Field label="Choose a password (min 8 characters)"><input type="password" {...bind('password')} minLength={8} required /></Field>
                <Field label="Confirm password"><input type="password" {...bind('confirm')} required /></Field>
              </>
            )}
            <button className="btn" style={{ width: '100%' }} disabled={busy}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
            <p className="muted" style={{ textAlign: 'center', marginTop: 14 }}>
              {mode === 'login' ? 'New student? ' : 'Already have an account? '}
              <a href="#" onClick={(e) => { e.preventDefault(); setError(''); setMode(mode === 'login' ? 'account' : 'login'); }}>
                {mode === 'login' ? 'Create your account' : 'Sign in'}
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
