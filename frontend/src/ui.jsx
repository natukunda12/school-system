import { useEffect, useState } from 'react';
import api from './api';

const COLORS = {
  approved: 'green', complete: 'green', active: 'green', valid: 'green',
  pending: 'brown', awaiting_confirmation: 'brown', returned: 'brown', arrived: 'green', waiting: 'gray',
  rejected: 'red', expired: 'gray', suspended: 'red',
};
export const PERM_LABEL = { pending: 'waiting for Dean', awaiting_confirmation: 'waiting for Secretary' };
export const Badge = ({ status, label }) => <span className={`badge ${COLORS[status] || 'gray'}`}>{label || status}</span>;

export const Msg = ({ type = 'error', children }) => (children ? <div className={`msg ${type}`}>{children}</div> : null);

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);

export function useForm(initial) {
  const [v, setV] = useState(initial);
  const bind = (name) => ({ value: v[name] ?? '', onChange: (e) => setV((s) => ({ ...s, [name]: e.target.value })) });
  return [v, bind, setV];
}

let cache = null;
export function useLookups() {
  const [data, setData] = useState(cache || { years: [], terms: [], classes: [], combinations: [] });
  useEffect(() => {
    api.get('/setup/lookups').then((r) => { cache = r.data; setData(r.data); });
  }, []);
  return { ...data, currentTerm: data.terms.find((t) => t.is_current) };
}
export const clearLookups = () => { cache = null; };

export const Select = ({ items, valueKey = 'id', labelKey = 'name', placeholder = 'Select...', ...rest }) => (
  <select {...rest}>
    <option value="">{placeholder}</option>
    {items.map((i) => <option key={i[valueKey]} value={i[valueKey]}>{i[labelKey]}</option>)}
  </select>
);

export const dt = (s) => (s ? String(s).slice(0, 16).replace('T', ' ') : '');
