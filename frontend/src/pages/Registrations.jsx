import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Field, Msg, Select, useForm, useLookups } from '../ui.jsx';

export default function Registrations() {
  const { user } = useAuth();
  const L = useLookups();
  const canEdit = ['super_admin', 'registrar'].includes(user.role);
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [f, bind, setF] = useForm({ boarding_status: '' });
  const [msg, setMsg] = useState({ type: 'ok', text: '' });

  const load = () => api.get('/registrations', { params: { status } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [status]);
  useEffect(() => { if (L.currentTerm && !f.term_id) setF((s) => ({ ...s, term_id: L.currentTerm.id })); }, [L.currentTerm]);

  const review = async (id, st) => {
    try { await api.patch(`/registrations/${id}/review`, { status: st }); load(); }
    catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };
  const registerReturning = async (e) => {
    e.preventDefault();
    try {
      await api.post('/registrations', { student_code: f.student_code.trim(), term_id: f.term_id, class_id: f.class_id || undefined, combination_id: f.combination_id || undefined, boarding_status: f.boarding_status || undefined });
      setMsg({ type: 'ok', text: `${f.student_code} registered successfully` });
      setF((s) => ({ ...s, student_code: '' }));
      load();
    } catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };

  return (
    <>
      <h1>Registration</h1>
      <Msg type={msg.type}>{msg.text}</Msg>
      {canEdit && (
        <div className="card">
          <h2>Register a returning student for a term</h2>
          <p className="muted">Use the existing Student ID. Leave class, combination and boarding empty to keep the current ones. New students are registered from the Students page.</p>
          <form onSubmit={registerReturning}>
            <div className="form-grid">
              <Field label="Student ID"><input {...bind('student_code')} placeholder="STU-2026-0001" required /></Field>
              <Field label="Term"><Select items={L.terms.map((t) => ({ id: t.id, name: `${t.year_name} ${t.name}` }))} {...bind('term_id')} required /></Field>
              <Field label="New class (optional)"><Select items={L.classes} {...bind('class_id')} /></Field>
              <Field label="Combination (optional)"><Select items={L.combinations} labelKey="code" {...bind('combination_id')} /></Field>
              <Field label="Boarding (optional)">
                <select {...bind('boarding_status')}><option value="">Keep current</option><option value="day">Day</option><option value="boarding">Boarding</option></select>
              </Field>
            </div>
            <button className="btn">Register</button>
          </form>
        </div>
      )}
      <div className="row">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} className={`btn ${status === s ? '' : 'ghost'} sm`} onClick={() => setStatus(s)} style={{ textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Term</th><th>Class</th><th>Type</th><th>Boarding</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link to={`/students/${r.student_id}`}>{r.full_name}</Link><br /><span className="muted">{r.student_code}</span></td>
                <td>{r.term_name}</td><td>{r.class_name} {r.combination}</td><td>{r.student_type}</td><td>{r.boarding_status}</td>
                <td><Badge status={r.status} /></td>
                <td>
                  {canEdit && r.status === 'pending' && (
                    <>
                      <button className="btn sm" onClick={() => review(r.id, 'approved')}>Approve</button>{' '}
                      <button className="btn red sm" onClick={() => review(r.id, 'rejected')}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="7" className="muted">Nothing here</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
