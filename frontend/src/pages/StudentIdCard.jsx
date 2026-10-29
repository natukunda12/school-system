import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Msg, dt } from '../ui.jsx';
import StudentPhoto from './StudentPhoto.jsx';

export default function StudentIdCard({ student, registrations, academicYear, onEdit, onPhotoChange, canEdit, uploading }) {
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');
  const registration = registrations.find((item) => item.status === 'approved') || registrations[0];
  const issueDate = new Date().toLocaleDateString();

  useEffect(() => {
    let active = true;
    let objectUrl;
    api.get(`/students/${student.id}/qr`, { responseType: 'blob' })
      .then(({ data }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setQrUrl(objectUrl);
      })
      .catch((e) => { if (active) setError(errMsg(e)); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [student.id]);

  return (
    <section className="card">
      <div className="row print-hide">
        <h2 style={{ flex: 1 }}>Digital student identity card</h2>
        {canEdit && (
          <>
            <label className="btn ghost sm student-card-photo-button">
              {uploading ? 'Uploading photo...' : 'Change photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhotoChange} disabled={uploading} />
            </label>
            <button className="btn ghost sm" onClick={onEdit}>Edit identity</button>
          </>
        )}
        <button className="btn ghost sm" onClick={() => window.print()} disabled={!qrUrl}>Print ID card</button>
      </div>
      <Msg>{error}</Msg>
      <div id="student-id-card" className="student-id-card">
        <header className="student-id-header">
          <div className="student-id-logo"><img src="/unilak.jpg" alt="School Logo" /></div>
          <div className="student-id-title">
            <h3>STUDENT IDENTITY CARD</h3>
            <b>ACADEMIC YEAR {academicYear}</b>
          </div>
          <div className="student-id-logo"><img src="/apadem.png" alt="APADEM Logo" /></div>
        </header>
        <div className="student-id-main">
          <StudentPhoto studentId={student.id} name={student.full_name} className="student-id-photo" />
          <div className="student-id-details">
            <h2>{student.full_name}</h2>
            <p><b>Student code:</b> {student.student_code}</p>
            <p><b>Class / level:</b> {registration?.class_name || student.class_name || '-'}{registration?.combination ? ` · ${registration.combination}` : ''}</p>
           <p><b>school:</b> college mont sion/unlak</p>
            <p><b>Registered:</b> {registration ? dt(registration.created_at) : '-'}</p>
            <p><b>Issued:</b> {issueDate} <span className="id-card-separator">·</span> <b>Expires:</b> Not set</p>
          </div>
          <div className="student-id-qr">
            {qrUrl ? <img src={qrUrl} alt={`Secure verification QR code for ${student.full_name}`} /> : <span className="muted">Loading QR code...</span>}
            <b>SCAN TO VERIFY STUDENT</b>
          </div>
        </div>
      </div>
    
    </section>
  );
}
