import { useEffect, useState } from 'react';
import api, { errMsg, openPdf } from '../api';
import { Badge, Field, Modal, Msg, PERM_LABEL, Select, dt, useForm, useLookups } from '../ui.jsx';

function PermissionForm({ onDone }) {
  const [f, bind] = useForm({});
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/permissions', f); onDone(); } catch (err) { setError(errMsg(err)); }
  };
  return (
    <form onSubmit={submit}>
      <Msg>{error}</Msg>
      <div className="form-grid">
        <Field label="Destination"><input {...bind('destination')} required /></Field>
        <Field label="Reason for leaving"><input {...bind('reason')} required /></Field>
        <Field label="Departure"><input type="datetime-local" {...bind('departure_at')} required /></Field>
        <Field label="Expected return"><input type="datetime-local" {...bind('expected_return_at')} required /></Field>
      </div>
      <Field label="Additional information (optional)"><textarea rows="2" {...bind('additional_info')} /></Field>
      <button className="btn">Send request</button>
    </form>
  );
}

export default function StudentHome() {
  const L = useLookups();
  const [o, setO] = useState(null);
  const [perms, setPerms] = useState([]);
  const [asking, setAsking] = useState(false);
  const [term, setTerm] = useState('');
  const [msg, setMsg] = useState({ type: 'ok', text: '' });

  const load = () => {
    api.get('/students/me/overview').then((r) => setO(r.data)).catch((e) => setMsg({ type: 'error', text: errMsg(e) }));
    api.get('/permissions/mine').then((r) => setPerms(r.data));
  };
  useEffect(() => { load(); }, []);

  const register = async () => {
    try { await api.post('/registrations/self', { term_id: term }); setMsg({ type: 'ok', text: 'Registration sent. Wait for the school to approve it.' }); load(); }
    catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };

  if (!o) return <Msg type={msg.type}>{msg.text || 'Loading...'}</Msg>;
  const s = o.student;
  const done = o.requirements.filter((r) => r.status === 'complete').length;
  const latest = o.registrations[0];
  return (
    <>
      <h1>Welcome, {s.full_name}</h1>
      <p className="muted">{s.student_code} · {s.class_name} {s.combination} · <span style={{ textTransform: 'capitalize' }}>{s.boarding_status}</span></p>
      <Msg type={msg.type}>{msg.text}</Msg>
      <div className="grid">
        <div className="card">
          <h2>My registration</h2>
          {latest ? <p>{latest.year_name} {latest.term_name}: <Badge status={latest.status} /></p> : <p className="muted">Not registered yet</p>}
          <div className="row">
            <Select items={L.terms.map((t) => ({ id: t.id, name: `${t.year_name} ${t.name}` }))} placeholder="Choose term" value={term} onChange={(e) => setTerm(e.target.value)} />
            <button className="btn sm" disabled={!term} onClick={register}>Register for this term</button>
          </div>
        </div>
        <div className="card">
          <h2>My bed and refectory table</h2>
          {o.arrival ? (
            o.arrival.bed_label || o.arrival.table_number ? (
              <>
                <p><span className="muted">Dormitory</span><br /><b>{o.arrival.dormitory || '-'}</b></p>
                <p><span className="muted">Bed</span><br /><b>{o.arrival.bed_label || '-'}</b> {o.arrival.bunk && `(${o.arrival.bunk})`}</p>
                <p><span className="muted">Refectory table</span><br /><b>{o.arrival.table_number ? `Table ${o.arrival.table_number}` : '-'}</b></p>
              </>
            ) : <p className="muted">You are marked as arrived. Day students do not get a bed or table.</p>
          ) : <p className="muted">Shown here after the school reports your arrival.</p>}
        </div>
        <div className="card">
          <h2>My requirements ({done} of {o.requirements.length})</h2>
          <div className="progress"><i style={{ width: `${o.requirements.length ? (done / o.requirements.length) * 100 : 0}%` }} /></div>
          {o.requirements.map((r) => (
            <div className="check" key={r.id}><span>{r.name}</span><Badge status={r.status} /></div>
          ))}
          {!o.requirements.length && <p className="muted">No requirements yet</p>}
        </div>
      </div>
      <div className="card">
        <div className="row">
          <h2 style={{ flex: 1, margin: 0 }}>My permission requests</h2>
          <button className="btn" onClick={() => setAsking(true)}>+ New request</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Destination</th><th>Leaves</th><th>Returns</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {perms.map((p) => (
                <tr key={p.id}>
                  <td>{p.destination}<br /><span className="muted">{p.reason}</span></td>
                  <td>{dt(p.departure_at)}</td><td>{dt(p.expected_return_at)}</td>
                  <td><Badge status={p.status} label={PERM_LABEL[p.status]} />{p.review_note && <div className="muted">{p.review_note}</div>}</td>
                  <td>{p.permission_number && p.status === 'approved' && <button className="btn sm" onClick={() => openPdf(`/permissions/${p.id}/card`).catch((e) => setMsg({ type: 'error', text: errMsg(e) }))}>Print permission card</button>}</td>
                </tr>
              ))}
              {!perms.length && <tr><td colSpan="5" className="muted">No requests yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {asking && (
        <Modal title="Request permission to leave school" onClose={() => setAsking(false)}>
          <PermissionForm onDone={() => { setAsking(false); setMsg({ type: 'ok', text: 'Request sent' }); load(); }} />
        </Modal>
      )}
    </>
  );
}
