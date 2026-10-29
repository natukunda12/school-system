import { useState } from 'react';
import api, { errMsg } from '../api';
import { clearLookups, Field, Msg, Select, useForm, useLookups } from '../ui.jsx';

export default function Setup() {
  const L = useLookups();
  const [msg, setMsg] = useState({ type: 'ok', text: '' });
  const [y, yb] = useForm({});
  const [t, tb] = useForm({});
  const [c, cb] = useForm({});
  const [k, kb] = useForm({});

  const run = async (fn, ok) => {
    try { await fn(); clearLookups(); setMsg({ type: 'ok', text: ok + ' Reload the page to see it.' }); }
    catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };

  return (
    <>
      <h1>School setup</h1>
      <Msg type={msg.type}>{msg.text}</Msg>
      <div className="grid">
        <div className="card">
          <h2>Academic years and terms</h2>
          {L.terms.map((x) => (
            <div className="check" key={x.id}>
              <span>{x.year_name} · {x.name} {x.is_current ? <b style={{ color: 'var(--green)' }}>(current)</b> : null}</span>
              {!x.is_current && <button className="btn ghost sm" onClick={() => run(() => api.patch(`/setup/terms/${x.id}/current`), 'Current term changed.')}>Make current</button>}
            </div>
          ))}
        </div>
        <div className="card">
          <h2>Classes</h2>
          <p>{L.classes.map((x) => x.name).join(', ')}</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/setup/classes', c), 'Class added.'); }}>
            <input placeholder="New class name" {...cb('name')} required style={{ width: 150 }} />
            <input placeholder="Level (number)" type="number" {...cb('level')} style={{ width: 130 }} />
            <button className="btn sm">Add</button>
          </form>
          <h2 style={{ marginTop: 14 }}>Combinations</h2>
          <p>{L.combinations.map((x) => x.code).join(', ')}</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/setup/combinations', k), 'Combination added.'); }}>
            <input placeholder="Code (e.g. SOD)" {...kb('code')} required style={{ width: 140 }} />
            <input placeholder="Full name" {...kb('name')} style={{ width: 170 }} />
            <button className="btn sm">Add</button>
          </form>
        </div>
      </div>
      <div className="grid">
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/setup/years', { ...y, is_current: false }), 'Academic year added.'); }}>
          <h2>Add academic year</h2>
          <Field label="Name"><input placeholder="2027" {...yb('name')} required /></Field>
          <Field label="Start date"><input type="date" {...yb('start_date')} required /></Field>
          <Field label="End date"><input type="date" {...yb('end_date')} required /></Field>
          <button className="btn">Add year</button>
        </form>
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api.post('/setup/terms', t), 'Term added.'); }}>
          <h2>Add term</h2>
          <Field label="Academic year"><Select items={L.years} {...tb('academic_year_id')} required /></Field>
          <Field label="Name"><input placeholder="Term 1" {...tb('name')} required /></Field>
          <Field label="Start date"><input type="date" {...tb('start_date')} required /></Field>
          <Field label="End date"><input type="date" {...tb('end_date')} required /></Field>
          <button className="btn">Add term</button>
        </form>
      </div>
    </>
  );
}
