import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Modal, Msg, dt } from '../ui.jsx';
import StudentForm from './StudentForm.jsx';
import StudentIdCard from './StudentIdCard.jsx';
import StudentPhoto from './StudentPhoto.jsx';

export default function StudentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoVersion, setPhotoVersion] = useState(0);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/students/${id}`);
      setD(data);
      setError('');
    } catch (e) { setError(errMsg(e)); }
  };
  useEffect(() => { load(); }, [id]);

  const toggle = async (item) => {
    try {
      await api.patch(`/requirements/student-requirements/${item.id}`, {
        status: item.status === 'complete' ? 'pending' : 'complete',
      });
      await load();
    } catch (e) { setError(errMsg(e)); }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const form = new FormData();
    form.append('photo', file);
    setUploading(true);
    setPhotoError('');
    try {
      await api.put(`/students/${id}/photo`, form);
      setPhotoVersion((value) => value + 1);
    } catch (err) {
      setPhotoError(errMsg(err));
    } finally {
      setUploading(false);
    }
  };

  if (error && !d) return <><Msg>{error}</Msg><Link to="/students">← Students</Link></>;
  if (!d) return <p>Loading student profile...</p>;
  const s = d.student;
  const canEdit = ['super_admin', 'registrar'].includes(user.role);
  const currentRegistration = d.registrations.find((r) => r.id === d.current_registration_id);
  const requirements = currentRegistration?.requirements || [];

  return (
    <>
      <p><Link to="/students">← Students</Link></p>
      <div className="row">
        <h1 style={{ flex: 1 }}>{s.full_name}</h1>
        <button className="btn brown" onClick={() => document.getElementById('student-id-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
          Student ID card
        </button>
        {canEdit && <button className="btn ghost" onClick={() => setEdit(true)}>Edit</button>}
      </div>
      <Msg>{error}</Msg>
      <StudentIdCard
        student={s}
        registrations={d.registrations}
        academicYear={d.current_academic_year}
        canEdit={canEdit}
        uploading={uploading}
        onEdit={() => setEdit(true)}
        onPhotoChange={uploadPhoto}
      />
      <div className="grid">
        <div className="card student-profile-card">
          <StudentPhoto studentId={s.id} name={s.full_name} className="student-profile-photo" refreshKey={photoVersion} />
          <div className="student-profile-info">
            <h2>Personal and academic details</h2>
            <p><span className="muted">Student code</span><br /><b>{s.student_code}</b></p>
            <p><span className="muted">Class / combination</span><br />{currentRegistration?.class_name || s.class_name || '-'}{currentRegistration?.combination ? ` · ${currentRegistration.combination}` : ''}</p>
            <p><span className="muted">Academic year · registration status</span><br />{d.current_academic_year} · <Badge status={currentRegistration?.status || 'gray'} label={currentRegistration?.status || 'not registered'} /></p>
            <p><span className="muted">Registered on</span><br />{currentRegistration ? dt(currentRegistration.created_at) : 'No registration recorded'}</p>
            <p><span className="muted">Gender · date of birth</span><br />{s.gender} · {dt(s.date_of_birth)}</p>
            <p><span className="muted">Place of birth · previous school</span><br />{s.place_of_birth || '-'} · {s.previous_school || '-'}</p>
            <p><span className="muted">Phone · email</span><br />{s.phone || '-'} · {s.email || '-'}</p>
            <p><span className="muted">Boarding / day status · student status</span><br /><span style={{ textTransform: 'capitalize' }}>{s.boarding_status} · {s.status}</span></p>
            <p><span className="muted">Account</span><br />{s.user_id ? 'Created' : 'Not created'}</p>
            <Msg>{photoError}</Msg>
          </div>
        </div>
        <div className="card">
          <h2>Parent / guardian information</h2>
          {d.parents.map((parent) => (
            <div className="student-history-item" key={parent.id}>
              <b>{parent.full_name}</b> {parent.is_primary ? <Badge status="active" label="primary" /> : null}
              <p>{parent.relationship}</p>
              <p>{parent.phone}{parent.email ? ` · ${parent.email}` : ''}</p>
              {parent.address && <p>{parent.address}</p>}
            </div>
          ))}
          {!d.parents.length && <p className="muted">No parent or guardian information recorded.</p>}
        </div>
        <div className="card">
          <h2>Requirements {currentRegistration && `· ${currentRegistration.year_name} ${currentRegistration.term_name}`}</h2>
          {currentRegistration && (
            <>
              <div className="progress">
                <i style={{ width: `${requirements.length ? (requirements.filter((item) => item.status === 'complete').length / requirements.length) * 100 : 0}%` }} />
              </div>
              <p className="muted">{requirements.filter((item) => item.status === 'complete').length} submitted / complete · {requirements.filter((item) => item.status === 'pending').length} missing</p>
              {requirements.map((item) => (
                <div className="check student-requirement" key={item.id}>
                  <span>{item.name}<br /><small className="muted">{item.category}{item.checked_at ? ` · checked ${dt(item.checked_at)}` : ''}{item.checked_by ? ` by ${item.checked_by}` : ''}{item.note ? ` · ${item.note}` : ''}</small></span>
                  <span>
                    <Badge status={item.status} label={item.status === 'complete' ? 'submitted' : 'missing'} />{' '}
                    <button className="btn ghost sm print-hide" onClick={() => toggle(item)}>{item.status === 'complete' ? 'Undo' : 'Mark done'}</button>
                  </span>
                </div>
              ))}
              {!requirements.length && <p className="muted">No checklist items are recorded for this registration.</p>}
            </>
          )}
          {!currentRegistration && <p className="muted">No registration or requirements checklist recorded.</p>}
        </div>
      </div>

      <section className="card">
        <h2>Permission history</h2>
        {d.permissions.map((permission) => (
          <article className="student-history-item" key={permission.id}>
            <div className="row">
              <b style={{ flex: 1 }}>{permission.permission_number || 'Permission pending'} · {permission.destination}</b>
              <Badge status={permission.status} />
            </div>
            <div className="grid">
              <p><span className="muted">Reason</span><br />{permission.reason}</p>
              <p><span className="muted">Departure · expected return</span><br />{dt(permission.departure_at)} · {dt(permission.expected_return_at)}</p>
              <p><span className="muted">Dean approval</span><br />{permission.dean_name ? `${permission.dean_name}${permission.dean_at ? ` · ${dt(permission.dean_at)}` : ''}` : 'Awaiting Dean approval'}</p>
              <p><span className="muted">Secretary confirmation</span><br />{permission.secretary_name ? `${permission.secretary_name}${permission.reviewed_at ? ` · ${dt(permission.reviewed_at)}` : ''}` : permission.status === 'awaiting_confirmation' ? 'Awaiting Secretary confirmation' : 'Not confirmed'}</p>
              <p><span className="muted">Actual exit · return</span><br />{dt(permission.actual_departure_at) || 'Not recorded'} · {dt(permission.actual_return_at) || 'Not recorded'}</p>
              {permission.review_note && <p><span className="muted">Review note</span><br />{permission.review_note}</p>}
              {permission.dean_note && <p><span className="muted">Dean note</span><br />{permission.dean_note}</p>}
              {permission.additional_info && <p><span className="muted">Additional information</span><br />{permission.additional_info}</p>}
            </div>
          </article>
        ))}
        {!d.permissions.length && <p className="muted">No permission history recorded.</p>}
      </section>

      <section className="card">
        <h2>Registration, arrival and accommodation history</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Academic year / term</th><th>Class</th><th>Registered</th><th>Boarding</th><th>Status</th><th>Arrival and accommodation</th></tr></thead>
            <tbody>
              {d.registrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{registration.year_name} · {registration.term_name}</td>
                  <td>{registration.class_name}{registration.combination ? ` · ${registration.combination}` : ''}</td>
                  <td>{dt(registration.created_at)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{registration.boarding_status}</td>
                  <td><Badge status={registration.status} /></td>
                  <td>{registration.arrived_at
                    ? `${dt(registration.arrived_at)} · ${registration.dormitory || 'No dormitory'} · ${registration.bed_label ? `bed ${registration.bed_label} (${registration.bunk})` : 'no bed'} · ${registration.table_number ? `table ${registration.table_number}` : 'no table'}`
                    : 'Not reported'}</td>
                </tr>
              ))}
              {!d.registrations.length && <tr><td colSpan="6" className="muted">No registrations recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Record history</h2>
        {d.history.map((item, index) => (
          <div className="student-history-item" key={`${item.action}-${item.created_at}-${index}`}>
            <b>{item.action.replaceAll('_', ' ')}</b><br />
            <span className="muted">{dt(item.created_at)} · {item.performed_by || 'System'}</span>
          </div>
        ))}
        {!d.history.length && <p className="muted">No audit history is recorded for this student.</p>}
      </section>

      {edit && (
        <Modal title="Edit student" onClose={() => setEdit(false)}>
          <StudentForm student={s} onDone={() => { setEdit(false); load(); }} />
        </Modal>
      )}
    </>
  );
}
