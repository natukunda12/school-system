import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Badge, Field, Msg, useForm } from '../ui.jsx';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [f, bind, setF] = useForm({ role: 'registrar' });
  const [msg, setMsg] = useState({ type: 'ok', text: '' });
  const load = () => api.get('/users').then((r) => setRows(r.data));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/users', f); setF({ role: 'registrar' }); setMsg({ type: 'ok', text: 'User created' }); load(); }
    catch (err) { setMsg({ type: 'error', text: errMsg(err) }); }
  };
  const toggle = (u) => api.patch(`/users/${u.id}`, { is_active: !u.is_active }).then(load).catch((e) => setMsg({ type: 'error', text: errMsg(e) }));
  const reset = async (u) => {
    const p = window.prompt(`New password for ${u.username} (min 8 characters):`);
    if (!p) return;
    try { await api.patch(`/users/${u.id}`, { password: p }); setMsg({ type: 'ok', text: 'Password changed' }); }
    catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
  };

  return (
    <>
      <h1>Users</h1>
      <Msg type={msg.type}>{msg.text}</Msg>
      <form className="card" onSubmit={add}>
        <h2>Add administrator, registrar, Dean of Discipline, Security office or staff</h2>
        <div className="form-grid">
          <Field label="Full name"><input {...bind('full_name')} required /></Field>
          <Field label="Username"><input {...bind('username')} required /></Field>
          <Field label="Password (min 8)"><input type="password" {...bind('password')} minLength={8} required /></Field>
          <Field label="Role">
            <select {...bind('role')}>
              <option value="super_admin">Super administrator</option><option value="registrar">Register / administrator</option><option value="staff">Authorized staff</option><option value="dean_of_discipline">Dean of Discipline</option><option value="secretary">Security office</option>
            </select>
          </Field>
          <Field label="Email"><input type="email" {...bind('email')} /></Field>
          <Field label="Phone"><input {...bind('phone')} /></Field>
        </div>
        <button className="btn">Create user</button>
      </form>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td><td>{u.username}</td><td>{u.role.replaceAll('_', ' ')}</td>
                <td><Badge status={u.is_active ? 'active' : 'suspended'} /></td>
                <td>
                  <button className="btn ghost sm" onClick={() => toggle(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>{' '}
                  <button className="btn ghost sm" onClick={() => reset(u)}>Reset password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
