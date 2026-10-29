import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Msg, dt } from '../ui.jsx';

export default function Verify() {
  const { token } = useParams();
  const { user } = useAuth();
  const staffRoles = ['super_admin', 'registrar', 'staff', 'dean_of_discipline', 'secretary'];
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const check = async (type = 'verify') => {
    try {
      const { data } = await api.get(`/permissions/verify/${token}`, { params: { type } });
      setD(data);
      if (type !== 'verify') setNote(type === 'exit' ? 'Exit recorded' : 'Return recorded');
    } catch (e) { setError(errMsg(e)); }
  };
  useEffect(() => { check(); }, [token]);

  if (!staffRoles.includes(user.role)) return <Msg>Only authorized staff can view scanned permission cards.</Msg>;
  if (error) return <><Msg>{error}</Msg><Link to="/permissions">← Back</Link></>;
  if (!d) return <p>Checking...</p>;
  return (
    <>
      <div className={`verify-box ${d.valid ? 'ok' : 'bad'}`}>
        <h1 style={{ color: d.valid ? 'var(--green-dark)' : 'var(--red)' }}>{d.valid ? '✓ PERMISSION VALID' : '✗ NOT VALID'}</h1>
        <div className="muted" style={{ textTransform: 'capitalize' }}>Status: {d.status}</div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Student information</h2>
        <div className="grid">
          <p><span className="muted">Name · Student ID</span><br /><b>{d.student.full_name}</b> · {d.student.student_code}</p>
          <p><span className="muted">Gender · Date of birth</span><br />{d.student.gender} · {dt(d.student.date_of_birth)}</p>
          <p><span className="muted">Place of birth</span><br />{d.student.place_of_birth || '-'}</p>
          <p><span className="muted">Class · Combination</span><br />{d.student.class_name || '-'}{d.student.combination ? ` · ${d.student.combination}` : ''}</p>
          <p><span className="muted">Boarding · Student status</span><br /><span style={{ textTransform: 'capitalize' }}>{d.student.boarding_status} · {d.student.status}</span></p>
          <p><span className="muted">Phone · Email</span><br />{d.student.phone || '-'} · {d.student.email || '-'}</p>
          <p><span className="muted">Previous school</span><br />{d.student.previous_school || '-'}</p>
        </div>
      </div>
      <div className="card">
        <h2>Parent / guardian</h2>
        {d.parents.map((parent, index) => (
          <p key={`${parent.full_name}-${index}`}>
            <b>{parent.full_name}</b> · {parent.relationship}{parent.is_primary ? ' (primary)' : ''}
            <br />{parent.phone}{parent.email ? ` · ${parent.email}` : ''}
            {parent.address && <><br />{parent.address}</>}
          </p>
        ))}
        {!d.parents.length && <p className="muted">No parent or guardian information recorded.</p>}
      </div>
      <div className="card">
        <h2>Permission details</h2>
        <div className="grid">
          <p><span className="muted">Permission number</span><br />{d.permission_number}</p>
          <p><span className="muted">Destination</span><br />{d.destination}</p>
          <p><span className="muted">Reason</span><br />{d.reason}</p>
          <p><span className="muted">Departure</span><br />{dt(d.departure_at)}</p>
          <p><span className="muted">Expected return</span><br />{dt(d.expected_return_at)}</p>
          <p><span className="muted">Dean · Secretary</span><br />{d.dean_name || '-'} · {d.approver || '-'}</p>
          {d.additional_info && <p><span className="muted">Additional information</span><br />{d.additional_info}</p>}
        </div>
        <Msg type="ok">{note}</Msg>
        {d.valid && (
          <div className="row">
            <button className="btn" onClick={() => check('exit')}>Record exit</button>
            <button className="btn brown" onClick={() => check('return')}>Record return</button>
          </div>
        )}
      </div>
      <div className="card">
        <h2>Registration history and requirements</h2>
        {d.registrations.map((registration) => (
          <div key={registration.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
            <b>{registration.year_name} {registration.term_name}</b> · {registration.class_name}
            {registration.combination ? ` (${registration.combination})` : ''}
            <div className="muted">
              {registration.student_type} · {registration.boarding_status} · {registration.status}
            </div>
            <p>
              <span className="muted">Arrival / accommodation: </span>
              {registration.arrived_at
                ? `${dt(registration.arrived_at)} · ${registration.dormitory || 'No dormitory'} · ${registration.bed_label ? `bed ${registration.bed_label} (${registration.bunk})` : 'no bed'} · ${registration.table_number ? `table ${registration.table_number}` : 'no table'}`
                : 'Not reported'}
            </p>
            {registration.requirements.length ? registration.requirements.map((requirement) => (
              <div className="check" key={`${registration.id}-${requirement.name}`}>
                <span>{requirement.name} <span className="muted">({requirement.category})</span></span>
                <span><Badge status={requirement.status} />{requirement.note ? ` · ${requirement.note}` : ''}</span>
              </div>
            )) : <p className="muted">No requirements recorded for this registration.</p>}
          </div>
        ))}
        {!d.registrations.length && <p className="muted">No registration history recorded.</p>}
      </div>
    </>
  );
}
