import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field, Msg } from '../ui.jsx';

function studentToken(value) {
  const raw = value.trim();
  if (/^[a-f0-9]{64}$/i.test(raw)) return raw;
  try {
    return new URL(raw, window.location.origin).pathname.match(/^\/student-scan\/([a-f0-9]{64})\/?$/i)?.[1] || null;
  } catch {
    return null;
  }
}

export default function StudentQrScanner() {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [manualValue, setManualValue] = useState('');
  const [error, setError] = useState('');

  const openStudent = (value) => {
    const token = studentToken(value);
    if (!token) {
      setError('That is not a valid student ID QR code. Scan a school-issued card or paste its QR link.');
      return;
    }
    navigate(`/student-scan/${token}`);
  };

  useEffect(() => {
    let active = true;
    let stream;
    let timer;

    const start = async () => {
      if (!window.isSecureContext) {
        setError('Camera scanning requires HTTPS or localhost. You can paste the student card QR link below instead.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof window.BarcodeDetector === 'undefined') {
        setError('This browser does not support in-app QR scanning. Use recent Chrome or Edge, or paste the student card QR link below.');
        return;
      }
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const scan = async () => {
          if (!active) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length) {
              openStudent(codes[0].rawValue);
              return;
            }
          } catch {
            if (active) setError('Unable to read the QR code. Improve the lighting or paste the student card QR link below.');
            return;
          }
          timer = window.setTimeout(scan, 250);
        };
        scan();
      } catch (e) {
        if (active) setError(`Could not access the camera: ${e.message}. Check camera permission or paste the student card QR link below.`);
      }
    };

    start();
    return () => {
      active = false;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    openStudent(manualValue);
  };

  return (
    <>
      <p><Link to="/students">← Students</Link></p>
      <div className="row"><h1>Scan student identity card</h1></div>
      <p className="muted">Point the camera at the student's QR code. Staff login is required before profile details are shown.</p>
      <div className="card scanner-card">
        <Msg>{error}</Msg>
        <video ref={videoRef} className="qr-scanner-video" muted playsInline />
        <form onSubmit={submit} style={{ marginTop: 16 }}>
          <Field label="Or paste the QR code link or its 64-character token">
            <input value={manualValue} onChange={(e) => setManualValue(e.target.value)} placeholder="https://school.example.com/student-scan/..." />
          </Field>
          <button className="btn" disabled={!manualValue.trim()}>Open student profile</button>
        </form>
      </div>
    </>
  );
}
