import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, openPdf } from '../api';
import { Badge, Msg, Select, useLookups } from '../ui.jsx';

export default function Arrivals() {
  const L = useLookups();
  const [termId, setTermId] = useState('');
  const [q, setQ] = useState({ search: '', status: '', boarding_status: '' });
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState(new Set());
  const [msgs, setMsgs] = useState([]);
  const [updatingRequirements, setUpdatingRequirements] = useState(new Set());

  const say = (type, text) => setMsgs((m) => [{ type, text }, ...m].slice(0, 4));
  const load = () => api.get('/arrivals', { params: { term_id: termId || undefined, ...q } })
    .then((r) => setRows(r.data.rows))
    .catch((e) => say('error', errMsg(e)));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [termId, q]);

  const place = (a) => (a.bed_label ? `${a.dormitory}, bed ${a.bed_label} (${a.bunk}), table ${a.table_number ?? '-'}` : 'no bed');
  const report = async (row) => {
    try {
      const { data } = await api.post('/arrivals/report', { registration_id: row.registration_id });
      say('ok', `${row.full_name}: ${data.boarding ? place(data.arrival) : 'arrived (day student)'}`);
      data.warnings.forEach((w) => say('info', `${row.full_name}: ${w}`));
      load();
    } catch (e) { say('error', `${row.full_name}: ${errMsg(e)}`); }
  };
  const assign = async (row) => {
    try {
      const { data } = await api.post(`/arrivals/${row.arrival_id}/assign`);
      say('ok', `${row.full_name}: ${place(data.arrival)}`);
      data.warnings.forEach((w) => say('info', `${row.full_name}: ${w}`));
      load();
    } catch (e) { say('error', errMsg(e)); }
  };
  const updateRequirement = async (row, item) => {
    setUpdatingRequirements((current) => new Set(current).add(item.id));
    try {
      await api.patch(`/requirements/student-requirements/${item.id}`, {
        status: item.status === 'complete' ? 'pending' : 'complete',
      });
      load();
    } catch (e) {
      say('error', `${row.full_name}: ${errMsg(e)}`);
    } finally {
      setUpdatingRequirements((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };
  const printCard = (row) => openPdf(`/arrivals/${row.registration_id}/card`)
    .catch((e) => say('error', `${row.full_name}: ${errMsg(e)}`));
  const bulk = async () => {
    try {
      const { data } = await api.post('/arrivals/report-bulk', { registration_ids: [...sel] });
      say('ok', `${data.reported} students reported as arrived`);
      data.problems.forEach((p) => say('info', p.message));
      setSel(new Set());
      load();
    } catch (e) { say('error', errMsg(e)); }
  };
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const waiting = rows.filter((r) => !r.arrival_id);

  return (
    <>
      <h1>Arrivals</h1>
      <p className="muted">The checklist shows every requirement for each approved registration; mark items done as they are received. When a student reports to school, click "Report arrival". Boarding students are automatically assigned an available bunk bed and refectory table. Returning students keep their previous bed and table when still free.</p>
      {msgs.map((m, i) => <Msg key={i} type={m.type}>{m.text}</Msg>)}
      <div className="row">
        <Select items={L.terms.map((t) => ({ id: t.id, name: `${t.year_name} ${t.name}${t.is_current ? ' (current)' : ''}` }))} placeholder="Current term" value={termId} onChange={(e) => setTermId(e.target.value)} />
        <input placeholder="Search name or Student ID" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} style={{ minWidth: 220 }} />
        <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}>
          <option value="">All</option><option value="waiting">Not arrived yet</option><option value="arrived">Arrived</option><option value="missing">Arrived without bed or table</option>
        </select>
        <select value={q.boarding_status} onChange={(e) => setQ({ ...q, boarding_status: e.target.value })}>
          <option value="">Boarding and day</option><option value="boarding">Boarding</option><option value="day">Day</option>
        </select>
        <button className="btn" disabled={!sel.size} onClick={bulk}>Report arrival for selected ({sel.size})</button>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" checked={waiting.length > 0 && sel.size === waiting.length} onChange={(e) => setSel(e.target.checked ? new Set(waiting.map((r) => r.registration_id)) : new Set())} /></th>
              <th>Student</th><th>Class</th><th>Type</th><th>Arrival</th><th>Dormitory and bed</th><th>Table</th><th>Requirements</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.registration_id}>
                <td>{!r.arrival_id && <input type="checkbox" checked={sel.has(r.registration_id)} onChange={() => toggle(r.registration_id)} />}</td>
                <td><Link to={`/students/${r.student_id}`}>{r.full_name}</Link><br /><span className="muted">{r.student_code} · {r.gender}</span></td>
                <td>{r.class_name}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.boarding_status}</td>
                <td>{r.arrival_id ? <><Badge status="arrived" /><div className="muted">{String(r.arrived_at).slice(0, 16)}</div></> : <Badge status="waiting" label="not yet" />}</td>
                <td>{r.bed_label ? <><b>{r.bed_label}</b> · {r.bunk}<div className="muted">{r.dormitory}</div></> : '-'}</td>
                <td>{r.table_number ? `Table ${r.table_number}` : '-'}</td>
                <td style={{ minWidth: 210 }}>
                  {r.requirements?.length ? r.requirements.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Badge status={item.status} />
                      <span>{item.name} <span className="muted">({item.category})</span></span>
                      <button
                        className="btn ghost sm"
                        disabled={updatingRequirements.has(item.id)}
                        onClick={() => updateRequirement(r, item)}
                      >
                        {item.status === 'complete' ? 'Undo' : 'Mark done'}
                      </button>
                    </div>
                  )) : <span className="muted">No requirements</span>}
                </td>
                <td>
                  {!r.arrival_id && <button className="btn sm" onClick={() => report(r)}>Report arrival</button>}
                  {r.arrival_id && r.boarding_status === 'boarding' && (!r.bed_label || !r.table_number) && <button className="btn brown sm" onClick={() => assign(r)}>Assign bed/table</button>}
                  {r.arrival_id && <> <button className="btn ghost sm" onClick={() => printCard(r)}>Print arrival card</button></>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="9" className="muted">No approved registrations for this term</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
