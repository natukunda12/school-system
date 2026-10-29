import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Field, Msg, useForm } from '../ui.jsx';

export default function Refectory() {
  const { user } = useAuth();
  const canEdit = ['super_admin', 'registrar'].includes(user.role);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);
  const [students, setStudents] = useState([]);
  const [f, bind] = useForm({ count: 10, capacity: 10 });
  const [msg, setMsg] = useState({ type: 'ok', text: '' });
  const load = () => api.get('/accommodation/tables').then((r) => setRows(r.data));
  useEffect(() => { load().catch((e) => setMsg({ type: 'error', text: errMsg(e) })); }, []);

  const run = async (fn, ok) => {
    try { await fn(); await load(); setMsg({ type: 'ok', text: ok }); } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };
  const view = async (t) => {
    if (open === t.id) return setOpen(null);
    try {
      setStudents((await api.get(`/accommodation/tables/${t.id}/students`)).data);
      setOpen(t.id);
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };
  const capacity = (t) => {
    const c = window.prompt(`Seats at Table ${t.number}:`, t.capacity);
    if (c) run(() => api.patch(`/accommodation/tables/${t.id}`, { capacity: c }), 'Capacity changed');
  };

  return (
    <>
      <h1>Refectory</h1>
      <p className="muted">Boarding students get a table automatically when their arrival is reported. Counts are for the current term.</p>
      <Msg type={msg.type}>{msg.text}</Msg>
      {canEdit && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/accommodation/tables', f), 'Tables created'); }}>
          <h2>Add tables</h2>
          <div className="form-grid">
            <Field label="How many tables"><input type="number" min="1" max="200" {...bind('count')} required /></Field>
            <Field label="Students per table"><input type="number" min="1" max="50" {...bind('capacity')} required /></Field>
          </div>
          <button className="btn">Create tables</button>
        </form>
      )}
      <div className="grid">
        {rows.map((t) => (
          <div className="card" key={t.id} style={{ opacity: t.is_active ? 1 : 0.6 }}>
            <h2>Table {t.number}</h2>
            <p>{t.occupied} of {t.capacity} seats taken</p>
            <div className="progress"><i style={{ width: `${(t.occupied / t.capacity) * 100}%` }} /></div>
            <div className="row">
              <button className="btn ghost sm" onClick={() => view(t)}>{open === t.id ? 'Hide' : 'Students'}</button>
              {canEdit && <button className="btn ghost sm" onClick={() => capacity(t)}>Seats</button>}
              {canEdit && <button className="btn ghost sm" onClick={() => run(() => api.patch(`/accommodation/tables/${t.id}`, { is_active: !t.is_active }), 'Updated')}>{t.is_active ? 'Deactivate' : 'Activate'}</button>}
            </div>
            {open === t.id && (
              <div>
                {students.map((s) => <div className="check" key={s.student_code}><span>{s.full_name}</span><span className="muted">{s.class_name}</span></div>)}
                {!students.length && <p className="muted">Nobody yet</p>}
              </div>
            )}
          </div>
        ))}
        {!rows.length && <p className="muted">No tables yet</p>}
      </div>
    </>
  );
}
