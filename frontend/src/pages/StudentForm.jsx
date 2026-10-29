import { useState } from 'react';
import api, { errMsg } from '../api';
import { Field, Msg, Select, useForm, useLookups } from '../ui.jsx';

// Used to create a new student (and optionally register for the current term) or to edit one.
export default function StudentForm({ student, onDone }) {
  const L = useLookups();
  const editing = !!student;
  const [f, bind] = useForm(
    student
      ? { ...student, class_id: student.current_class_id || '', combination_id: student.current_combination_id || '' }
      : { gender: 'Male', boarding_status: 'day', register_now: true }
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = { ...f };
      if (!editing && f.register_now !== false && L.currentTerm) body.term_id = L.currentTerm.id;
      const { data } = editing ? await api.put(`/students/${student.id}`, body) : await api.post('/students', body);
      onDone(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Msg>{error}</Msg>
      <div className="form-grid">
        <Field label="Full name"><input {...bind('full_name')} required /></Field>
        <Field label="Gender">
          <select {...bind('gender')}><option>Male</option><option>Female</option></select>
        </Field>
        <Field label="Date of birth"><input type="date" {...bind('date_of_birth')} required /></Field>
        <Field label="Place of birth"><input {...bind('place_of_birth')} /></Field>
        <Field label="Class"><Select items={L.classes} {...bind('class_id')} required /></Field>
        <Field label="Combination"><Select items={L.combinations} labelKey="code" {...bind('combination_id')} /></Field>
        <Field label="Boarding or day">
          <select {...bind('boarding_status')}><option value="day">Day</option><option value="boarding">Boarding</option></select>
        </Field>
        <Field label="Student phone"><input {...bind('phone')} /></Field>
        <Field label="Email"><input type="email" {...bind('email')} /></Field>
        <Field label="Previous school"><input {...bind('previous_school')} /></Field>
        {!editing && (
          <>
            <Field label="Parent/guardian name"><input {...bind('parent_name')} /></Field>
            <Field label="Parent/guardian phone"><input {...bind('parent_phone')} /></Field>
          </>
        )}
      </div>
      {!editing && L.currentTerm && (
        <label className="row">
          <input type="checkbox" checked={f.register_now !== false} onChange={(e) => bind('register_now').onChange({ target: { value: e.target.checked } })} />
          Register for {L.currentTerm.name} now (creates the requirements checklist)
        </label>
      )}
      <button className="btn" disabled={busy}>{editing ? 'Save changes' : 'Register student'}</button>
    </form>
  );
}
