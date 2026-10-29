import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Field, Modal, Msg, Select, useForm, useLookups } from '../ui.jsx';

const TYPES = { all: 'All students', new: 'New students', returning: 'Returning students' };
const BOARD = { all: 'Boarding and day', boarding: 'Boarding only', day: 'Day only' };

function RuleForm({ rule, onDone }) {
  const L = useLookups();
  const [f, bind] = useForm(rule || { category: 'item', applies_to_type: 'all', applies_to_boarding: 'all', is_active: 1 });
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...f, term_id: f.term_id || null, class_id: f.class_id || null, is_active: Number(f.is_active) };
      rule ? await api.put(`/requirements/${rule.id}`, body) : await api.post('/requirements', body);
      onDone();
    } catch (err) { setError(errMsg(err)); }
  };
  return (
    <form onSubmit={save}>
      <Msg>{error}</Msg>
      <div className="form-grid">
        <Field label="Name"><input {...bind('name')} required placeholder="Mattress" /></Field>
        <Field label="Kind"><select {...bind('category')}><option value="item">Item</option><option value="document">Document</option></select></Field>
        <Field label="Who needs it"><select {...bind('applies_to_type')}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Boarding"><select {...bind('applies_to_boarding')}>{Object.entries(BOARD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Only in term (optional)"><Select items={L.terms.map((t) => ({ id: t.id, name: `${t.year_name} ${t.name}` }))} {...bind('term_id')} placeholder="Every term" /></Field>
        <Field label="Only for class (optional)"><Select items={L.classes} {...bind('class_id')} placeholder="Every class" /></Field>
        <Field label="Status"><select {...bind('is_active')}><option value={1}>Active</option><option value={0}>Inactive</option></select></Field>
      </div>
      <button className="btn">Save</button>
    </form>
  );
}

export default function Requirements() {
  const { user } = useAuth();
  const L = useLookups();
  const canEdit = ['super_admin', 'registrar'].includes(user.role);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => api.get('/requirements').then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const sync = async () => {
    if (!L.currentTerm) return setMsg('Set a current term first');
    const { data } = await api.post('/requirements/sync', { term_id: L.currentTerm.id });
    setMsg(data.message);
  };

  return (
    <>
      <div className="row">
        <h1 style={{ flex: 1 }}>Requirements</h1>
        {canEdit && <button className="btn ghost" onClick={sync}>Refresh checklists for current term</button>}
        {canEdit && <button className="btn" onClick={() => setEditing({})}>+ Add requirement</button>}
      </div>
      <Msg type="info">{msg}</Msg>
      <p className="muted">Rules decide which students get which item in their checklist. After you add or change a rule, press "Refresh checklists" to update students already registered.</p>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Kind</th><th>Who</th><th>Boarding</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td><td style={{ textTransform: 'capitalize' }}>{r.category}</td>
                <td>{TYPES[r.applies_to_type]}</td><td>{BOARD[r.applies_to_boarding]}</td>
                <td><Badge status={r.is_active ? 'active' : 'expired'} /></td>
                <td>{canEdit && <button className="btn ghost sm" onClick={() => setEditing(r)}>Edit</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <Modal title={editing.id ? 'Edit requirement' : 'New requirement'} onClose={() => setEditing(null)}>
          <RuleForm rule={editing.id ? editing : null} onDone={() => { setEditing(null); load(); }} />
        </Modal>
      )}
    </>
  );
}
