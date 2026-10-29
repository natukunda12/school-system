import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Msg } from '../ui.jsx';

export default function StudentQrLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!/^[a-f0-9]{64}$/i.test(token || '')) {
      setError('This student ID QR code is invalid.');
      return () => { active = false; };
    }
    api.get(`/students/scan/${token}`)
      .then(({ data }) => {
        if (active) navigate(`/students/${data.student_id}`, { replace: true });
      })
      .catch((e) => { if (active) setError(errMsg(e)); });
    return () => { active = false; };
  }, [navigate, token]);

  return (
    <div className="card">
      {error ? (
        <>
          <Msg>{error}</Msg>
          <Link to="/students">Return to students</Link>
        </>
      ) : <p>Verifying student identity QR code...</p>}
    </div>
  );
}
