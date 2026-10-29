import axios from 'axios';



const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});


api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.clear();
      location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong. Is the server running?';

export async function downloadFile(path, filename, params) {
  const r = await api.get(path, { responseType: 'blob', params });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function openPdf(path) {
  const tab = window.open('', '_blank');
  if (!tab) throw new Error('Allow pop-ups to open and print the card');
  try {
    const r = await api.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    tab.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    tab.close();
    throw e;
  }
}

export default api;
