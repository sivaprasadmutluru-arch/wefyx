import { useEffect, useState } from 'react';
import { get, send } from './api';

export default function EmployeeApprovals({ registrationType = 'employee' }) {
  const type = registrationType === 'vendor' ? 'vendor' : 'employee';
  const label = type === 'vendor' ? 'Vendor' : 'Employee';
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(null);
  useEffect(() => {
    let active = true;
    get(`/${type}-registrations`).then(data => { if (active) setRows(data); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [type]);
  async function approve(user) {
    setApproving(user.id);
    setError('');
    try {
      await send(`/${type}-registrations/${user.id}/approve`, 'PATCH', {});
      setRows(current => current.filter(row => row.id !== user.id));
    } catch (e) { setError(e.message); }
    finally { setApproving(null); }
  }
  return <section className="card m-5 p-5">
    <h2 className="font-bold">{label} registration approvals</h2>
    <p className="mt-1 text-sm text-slate-500">Registrations remain pending until approved here.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {rows.map(user => <div key={user.id} className="mt-3 flex items-center justify-between gap-4 border-t pt-3">
      <div><b>{user.name}</b><p className="text-sm text-slate-500">{user.email} · {user.organization}</p></div>
      <button disabled={approving !== null} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={() => approve(user)}>{approving === user.id ? 'Approving…' : `Approve ${type}`}</button>
    </div>)}
    {!rows.length && !error && <p className="mt-3 text-sm text-slate-500">No pending {type} registrations.</p>}
  </section>;
}
