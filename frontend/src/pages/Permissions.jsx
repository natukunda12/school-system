import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg, openPdf } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Field, Modal, Msg, PERM_LABEL, dt, useForm } from '../ui.jsx';

const TABS = [
  ['pending', 'Waiting for Dean'], ['awaiting_confirmation', 'Waiting for Secretary'],
  ['approved', 'Approved'], ['rejected', 'Rejected'], ['returned', 'Returned'], ['expired', 'Expired'],
];

function DirectForm({ onDone }) {
  const [f, bind] = useForm({});
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/permissions/direct', f); onDone(); } catch (err) { setError(errMsg(err)); }
  };
  return (
    <form onSubmit={submit}>
      <Msg>{error}</Msg>
      <div className="form-grid">
        <Field label="Student ID"><input {...bind('student_code')} placeholder="STU-2026-0001" required /></Field>
        <Field label="Destination"><input {...bind('destination')} required /></Field>
        <Field label="Reason"><input {...bind('reason')} required /></Field>
        <Field label="Departure"><input type="datetime-local" {...bind('departure_at')} required /></Field>
        <Field label="Expected return"><input type="datetime-local" {...bind('expected_return_at')} required /></Field>
      </div>
      <Field label="Additional information (optional)"><textarea rows="2" {...bind('additional_info')} /></Field>
      <button className="btn">Send to Secretary</button>
    </form>
  );
}

export default function Permissions() {
  const { user } = useAuth();
  const nav = useNavigate();
  const isDean = ['super_admin', 'dean_of_discipline'].includes(user.role);
  const isSec = ['super_admin', 'secretary'].includes(user.role);
  const [status, setStatus] = useState(user.role === 'secretary' ? 'awaiting_confirmation' : 'pending');
  const [rows, setRows] = useState([]);
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState({ type: 'error', text: '' });
  const [creating, setCreating] = useState(false);

  const load = () => api.get('/permissions', { params: { status } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [status]);

  const act = async (id, step, decision) => {
    let note = '';
    if (decision !== 'approve' && decision !== 'confirm') {
      note = window.prompt(decision === 'reject' ? 'Reason for rejecting (optional):' : 'What should be corrected?') || '';
    }
    try {
      const { data } = await api.patch(`/permissions/${id}/${step}`, { decision, note });
      setMsg({ type: 'ok', text: data.message + (data.permission_number ? ` (${data.permission_number})` : '') });
      load();
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };
  const verify = (e) => {
    e.preventDefault();
    const t = token.trim().split('/').pop();
    if (t) nav(`/verify/${t}`);
  };
  const printCard = (row) => openPdf(`/permissions/${row.id}/card`)
    .catch((e) => setMsg({ type: 'error', text: errMsg(e) }));

  return (
    <>
      <div className="row">
        <h1 style={{ flex: 1 }}>Permissions</h1>
        {isDean && <button className="btn" onClick={() => setCreating(true)}>+ Create permission</button>}
      </div>
      <div className="flow">
        <span className="step">1. Student requests, or the Dean of Discipline creates</span>→
        <span className="step">2. Dean of Discipline approves</span>→
        <span className="step">3. Secretary confirms</span>→
        <span className="step">4. Card with QR code is issued</span>
      </div>
      <Msg type={msg.type}>{msg.text}</Msg>
      <form className="row" onSubmit={verify}>
        <input placeholder="Paste scanned QR link or code to verify" value={token} onChange={(e) => setToken(e.target.value)} style={{ flex: 1, minWidth: 240 }} />
        <button className="btn brown">Verify card</button>
      </form>
      <div className="tabs">
        {TABS.map(([k, label]) => <button key={k} className={`btn ${status === k ? '' : 'ghost'} sm`} onClick={() => setStatus(k)}>{label}</button>)}
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Destination and reason</th><th>Leaves</th><th>Returns</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}<br /><span className="muted">{r.student_code} · {r.class_name}</span></td>
                <td>{r.destination}<br /><span className="muted">{r.reason}</span></td>
                <td>{dt(r.departure_at)}</td><td>{dt(r.expected_return_at)}</td>
                <td>
                  <Badge status={r.status} label={PERM_LABEL[r.status]} />
                  {r.dean_name && <div className="muted">Dean: {r.dean_name}</div>}
                  {r.reviewer && ['approved', 'rejected'].includes(r.status) && <div className="muted">Secretary: {r.reviewer}</div>}
                  {r.permission_number && <div className="muted">{r.permission_number}</div>}
                </td>
                <td>
                  {r.status === 'pending' && isDean && (
                    <>
                      <button className="btn sm" onClick={() => act(r.id, 'dean', 'approve')}>Approve</button>{' '}
                      <button className="btn red sm" onClick={() => act(r.id, 'dean', 'reject')}>Reject</button>{' '}
                      <button className="btn ghost sm" onClick={() => act(r.id, 'dean', 'return')}>Return</button>
                    </>
                  )}
                  {r.status === 'awaiting_confirmation' && isSec && (
                    <>
                      <button className="btn sm" onClick={() => act(r.id, 'confirm', 'confirm')}>Confirm</button>{' '}
                      <button className="btn red sm" onClick={() => act(r.id, 'confirm', 'reject')}>Reject</button>{' '}
                      <button className="btn ghost sm" onClick={() => act(r.id, 'confirm', 'return')}>Return</button>
                    </>
                  )}
                  {r.permission_number && <button className="btn ghost sm" onClick={() => printCard(r)}>Print permission card</button>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="6" className="muted">Nothing here</td></tr>}
          </tbody>
        </table>
      </div>
      {creating && (
        <Modal title="Create a permission for a student" onClose={() => setCreating(false)}>
          <DirectForm onDone={() => { setCreating(false); setStatus('awaiting_confirmation'); setMsg({ type: 'ok', text: 'Sent to the Secretary for confirmation' }); load(); }} />
        </Modal>
      )}
    </>
  );
}
