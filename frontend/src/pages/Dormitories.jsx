import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Field, Msg, useForm } from '../ui.jsx';

function BedGrid({ dormId }) {
  const [beds, setBeds] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setBeds(null);
    setError('');
    api.get(`/accommodation/dormitories/${dormId}/beds`)
      .then((r) => setBeds(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [dormId]);
  if (error) return <Msg>{error}</Msg>;
  if (!beds) return <p>Loading...</p>;
  const bunks = {};
  beds.forEach((b) => { (bunks[b.bed_number] ||= {})[b.position] = b; });
  const slot = (b, label) => (
    <div className={`slot ${b?.full_name ? 'taken' : 'free'}`}>
      <b>{label}</b> {b?.full_name ? <>{b.full_name} <span className="muted">{b.student_code}</span></> : 'free'}
    </div>
  );
  return (
    <div className="bunks">
      {Object.entries(bunks).map(([n, v]) => (
        <div className="bunk" key={n}>
          <b>Bed {n}</b>
          {slot(v.B, `${n}B upper`)}
          {slot(v.A, `${n}A lower`)}
        </div>
      ))}
    </div>
  );
}

export default function Dormitories() {
  const { user } = useAuth();
  const canEdit = ['super_admin', 'registrar'].includes(user.role);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);
  const [f, bind, setF] = useForm({ gender: 'Male', bunks: 10 });
  const [msg, setMsg] = useState({ type: 'ok', text: '' });
  const load = () => api.get('/accommodation/dormitories').then((r) => setRows(r.data));
  useEffect(() => { load().catch((e) => setMsg({ type: 'error', text: errMsg(e) })); }, []);

  const run = async (fn, ok) => {
    try { await fn(); await load(); setMsg({ type: 'ok', text: ok }); } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };
  const add = (e) => { e.preventDefault(); run(() => api.post('/accommodation/dormitories', f).then(() => setF({ gender: 'Male', bunks: 10 })), 'Dormitory created'); };
  const addBunks = (d) => {
    const n = window.prompt('How many bunks to add? (each bunk has an A lower bed and a B upper bed)', '5');
    if (n) run(() => api.post(`/accommodation/dormitories/${d.id}/bunks`, { add: n }), 'Beds added');
  };

  return (
    <>
      <h1>Dormitories</h1>
      <p className="muted">Each bunk has two beds: A is the lower bunk and B is the upper bunk (for example 1A and 1B). Boys and girls always stay in separate dormitories. Occupancy is for the current term.</p>
      <Msg type={msg.type}>{msg.text}</Msg>
      {canEdit && (
        <form className="card" onSubmit={add}>
          <h2>Add a dormitory</h2>
          <div className="form-grid">
            <Field label="Name"><input {...bind('name')} placeholder="Boys Dorm 1" required /></Field>
            <Field label="For"><select {...bind('gender')}><option value="Male">Boys</option><option value="Female">Girls</option></select></Field>
            <Field label="Number of bunks (2 beds each)"><input type="number" min="1" max="300" {...bind('bunks')} required /></Field>
          </div>
          <button className="btn">Create dormitory</button>
        </form>
      )}
      <div className="grid">
        {rows.map((d) => (
          <div className="card" key={d.id} style={{ opacity: d.is_active ? 1 : 0.6 }}>
            <h2>{d.name} <span className="badge brown">{d.gender === 'Male' ? 'boys' : 'girls'}</span></h2>
            <p>{d.occupied} of {d.beds} beds taken</p>
            <div className="progress"><i style={{ width: `${d.beds ? (d.occupied / d.beds) * 100 : 0}%` }} /></div>
            <div className="row">
              <button className="btn ghost sm" onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? 'Hide beds' : 'View beds'}</button>
              {canEdit && <button className="btn ghost sm" onClick={() => addBunks(d)}>+ Add bunks</button>}
              {canEdit && <button className="btn ghost sm" onClick={() => run(() => api.patch(`/accommodation/dormitories/${d.id}`, { is_active: !d.is_active }), 'Updated')}>{d.is_active ? 'Deactivate' : 'Activate'}</button>}
            </div>
          </div>
        ))}
        {!rows.length && <p className="muted">No dormitories yet</p>}
      </div>
      {open && <div className="card"><h2>{rows.find((d) => d.id === open)?.name}: beds</h2><BedGrid dormId={open} /></div>}
    </>
  );
}
