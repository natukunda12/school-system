import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth.jsx';
import { Modal, Msg, Select, useLookups } from '../ui.jsx';
import StudentForm from './StudentForm.jsx';

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const L = useLookups();
  const [q, setQ] = useState({ search: '', class_id: '', boarding_status: '', page: 1 });
  const [data, setData] = useState({ rows: [], total: 0, limit: 20 });
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState('');
  const canEdit = ['super_admin', 'registrar'].includes(user.role);

  const load = () => api.get('/students', { params: q }).then((r) => setData(r.data));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);
  const set = (k, v) => setQ((s) => ({ ...s, [k]: v, page: k === 'page' ? v : 1 }));
  const pages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <>
      <div className="row">
        <h1 style={{ flex: 1 }}>Students <span className="muted">({data.total})</span></h1>
        <button className="btn brown" onClick={() => navigate('/scan-student')}>Scan student QR</button>
        {canEdit && <button className="btn" onClick={() => setAdding(true)}>+ Register student</button>}
      </div>
      <Msg type="ok">{done}</Msg>
      <div className="row">
        <input placeholder="Search name or Student ID" value={q.search} onChange={(e) => set('search', e.target.value)} style={{ minWidth: 240 }} />
        <Select items={L.classes} placeholder="All classes" value={q.class_id} onChange={(e) => set('class_id', e.target.value)} />
        <select value={q.boarding_status} onChange={(e) => set('boarding_status', e.target.value)}>
          <option value="">Boarding and day</option><option value="boarding">Boarding</option><option value="day">Day</option>
        </select>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Student ID</th><th>Name</th><th>Class</th><th>Combination</th><th>Boarding</th><th>Status</th></tr></thead>
          <tbody>
            {data.rows.map((s) => (
              <tr key={s.id}>
                <td><Link to={`/students/${s.id}`}>{s.student_code}</Link></td>
                <td>{s.full_name}</td><td>{s.class_name}</td><td>{s.combination}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.boarding_status}</td><td style={{ textTransform: 'capitalize' }}>{s.status}</td>
              </tr>
            ))}
            {!data.rows.length && <tr><td colSpan="6" className="muted">No students found</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="row">
        <button className="btn ghost sm" disabled={q.page <= 1} onClick={() => set('page', q.page - 1)}>Previous</button>
        <span className="muted">Page {q.page} of {pages}</span>
        <button className="btn ghost sm" disabled={q.page >= pages} onClick={() => set('page', q.page + 1)}>Next</button>
      </div>
      {adding && (
        <Modal title="Register a new student" onClose={() => setAdding(false)}>
          <StudentForm onDone={(r) => { setAdding(false); setDone(`Student registered. Student ID: ${r.student_code}`); load(); }} />
        </Modal>
      )}
    </>
  );
}
