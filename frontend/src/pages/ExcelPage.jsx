import { useState } from 'react';
import api, { downloadFile, errMsg } from '../api';
import { Msg, Select, useLookups } from '../ui.jsx';

function ImportBox({ type, title, help }) {
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [msg, setMsg] = useState({ type: 'error', text: '' });
  const [busy, setBusy] = useState(false);

  const preview = async () => {
    setMsg({ text: '' }); setRes(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      setRes((await api.post(`/excel/import/${type}/preview`, fd)).data);
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    setBusy(false);
  };
  const confirm = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/excel/import/${res.batch_id}/confirm`);
      setMsg({ type: 'ok', text: type === 'new' ? `${data.created} students added.` : `${data.updated} students updated.` });
      setRes(null); setFile(null);
    } catch (e) { setMsg({ type: 'error', text: errMsg(e) }); }
    setBusy(false);
  };
  const cancel = async () => { await api.post(`/excel/import/${res.batch_id}/cancel`); setRes(null); };

  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="muted">{help}</p>
      <Msg type={msg.type}>{msg.text}</Msg>
      <div className="row">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { setFile(e.target.files[0]); setRes(null); }} />
        <button className="btn" disabled={!file || busy} onClick={preview}>Check file</button>
      </div>
      {res && (
        <>
          <Msg type={res.error_rows ? 'info' : 'ok'}>
            {res.total} rows read: {res.valid} ready{type === 'update' ? ` (${res.unchanged} with no changes)` : ''}, {res.error_rows} with errors. Rows with errors are skipped. Fix them in Excel and upload again.
          </Msg>
          {res.errors.length > 0 && (
            <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
              <table>
                <thead><tr><th>Excel row</th><th>Column</th><th>Problem</th></tr></thead>
                <tbody>{res.errors.map((e, i) => <tr key={i}><td>{e.row}</td><td>{e.field}</td><td>{e.message}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {res.preview.length > 0 && (
            <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
              <table>
                <thead><tr><th>Row</th><th>{type === 'new' ? 'Student' : 'Student ID'}</th><th>{type === 'new' ? 'Class' : 'Changes (before → after)'}</th></tr></thead>
                <tbody>
                  {res.preview.map((p) => (
                    <tr key={p.row}>
                      <td>{p.row}</td>
                      <td>{type === 'new' ? p.data.full_name : p.data.student_code}</td>
                      <td>{type === 'new' ? `${p.data.class} ${p.data.combination}` : (p.changes.length ? p.changes.map((c) => `${c.field}: ${c.from || '(empty)'} → ${c.to}`).join('; ') : 'No changes')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="row">
            <button className="btn" disabled={busy || res.valid === 0} onClick={confirm}>Confirm and save {res.valid} rows</button>
            <button className="btn ghost" onClick={cancel}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ExcelPage() {
  const L = useLookups();
  const [f, setF] = useState({ class_id: '', combination_id: '', boarding_status: '', student_type: '', incomplete: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <>
      <h1>Excel</h1>
      <div className="card">
        <h2>1. Download the template</h2>
        <p className="muted">Fill the template and keep the column names as they are. Dates use YYYY-MM-DD. Leave student_code empty for new students and the system will create it. Either phone or parent_phone is required, because it is used when the student creates an account.</p>
        <button className="btn brown" onClick={() => downloadFile('/excel/template', 'students_template.xlsx')}>Download template</button>
      </div>
      <ImportBox type="new" title="2. Import new students" help="Checks every row, finds duplicates and unknown classes, and shows a preview before anything is saved." />
      <ImportBox type="update" title="3. Update existing students" help="Uses student_code to find each student. Only filled cells are changed (for example a new class for the whole school). You can export students, edit the file and upload it here." />
      <div className="card">
        <h2>4. Export to Excel</h2>
        <div className="row">
          <Select items={L.classes} placeholder="All classes" value={f.class_id} onChange={set('class_id')} />
          <Select items={L.combinations} labelKey="code" placeholder="All combinations" value={f.combination_id} onChange={set('combination_id')} />
          <select value={f.boarding_status} onChange={set('boarding_status')}><option value="">Boarding and day</option><option value="boarding">Boarding</option><option value="day">Day</option></select>
          <select value={f.student_type} onChange={set('student_type')}><option value="">New and returning</option><option value="new">New (current term)</option><option value="returning">Returning (current term)</option></select>
          <select value={f.incomplete} onChange={set('incomplete')}><option value="">All requirement states</option><option value="1">Incomplete requirements only</option></select>
        </div>
        <div className="row">
          <button className="btn" onClick={() => downloadFile('/excel/export/students', 'students.xlsx', f)}>Export students</button>
          <button className="btn ghost" onClick={() => downloadFile('/excel/export/permissions', 'permissions.xlsx')}>Export permissions</button>
        </div>
      </div>
    </>
  );
}
