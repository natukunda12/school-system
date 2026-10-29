import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Msg } from '../ui.jsx';

const Bars = ({ title, items }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="card">
      <h2>{title}</h2>
      {items.length === 0 && <div className="muted">No data yet</div>}
      {items.map((i) => (
        <div className="bar" key={i.label}>
          <span className="l">{i.label}</span>
          <span className="t"><i style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <b>{i.value}</b>
        </div>
      ))}
    </div>
  );
};

const count = (list, label) => list.find((x) => x.label === label)?.value || 0;

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/summary').then((r) => setD(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/reports/pending-requirements').then((r) => setPending(r.data)).catch(() => {});
  }, []);

  if (error) return <Msg>{error}</Msg>;
  if (!d) return <p>Loading...</p>;
  const done = d.requirements.complete, todo = d.requirements.pending, all = done + todo;
  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">{d.term ? `Current term: ${d.term.name}` : 'No current term set. Go to School setup.'}</p>
      <div className="grid" style={{ marginBottom: 16 }}>
        <div className="stat g"><span className="muted">Active students</span><b>{d.total}</b></div>
        <div className="stat b"><span className="muted">Pending registrations</span><b>{count(d.registrations, 'pending')}</b></div>
        <div className="stat g"><span className="muted">Pending requirements</span><b>{todo}</b></div>
        <div className="stat b"><span className="muted">Pending permissions</span><b>{count(d.permissions, 'pending') + count(d.permissions, 'awaiting_confirmation')}</b></div>
      </div>
      <div className="card">
        <h2>Requirement completion ({done} of {all})</h2>
        <div className="progress"><i style={{ width: `${all ? (done / all) * 100 : 0}%` }} /></div>
      </div>
      <div className="grid">
        <Bars title="Students by class" items={d.byClass} />
        <Bars title="Students by combination" items={d.byCombination} />
        <Bars title="Boarding and day" items={d.byBoarding} />
        <Bars title="New and returning (this term)" items={d.regTypes} />
        <Bars title="Registration status" items={d.registrations} />
        <Bars title="Permission requests" items={d.permissions} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Students with incomplete requirements</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student ID</th><th>Name</th><th>Class</th><th>Missing</th></tr></thead>
            <tbody>
              {pending.slice(0, 15).map((p) => (
                <tr key={p.student_code}><td>{p.student_code}</td><td>{p.full_name}</td><td>{p.class_name}</td><td>{p.missing}</td></tr>
              ))}
              {pending.length === 0 && <tr><td colSpan="4" className="muted">Nothing pending</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
