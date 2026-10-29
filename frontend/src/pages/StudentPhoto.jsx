import { useEffect, useState } from 'react';
import api from '../api';

export default function StudentPhoto({ studentId, name, className = '', refreshKey = 0 }) {
  const [imageUrl, setImageUrl] = useState('');
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    setImageUrl('');
    setMissing(false);
    setError('');
    api.get(`/students/${studentId}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setImageUrl(objectUrl);
      })
      .catch((e) => {
        if (!active) return;
        if (e.response?.status === 404) setMissing(true);
        else setError('Photo could not be loaded');
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [studentId, refreshKey]);

  return imageUrl
    ? <img className={className} src={imageUrl} alt={`Photo of ${name}`} />
    : <div className={`${className} student-photo-placeholder`} role="img" aria-label={`${name} photo`}>
      {error || (missing ? 'PHOTO' : 'Loading photo...')}
    </div>;
}
