import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { BLOOD_GROUPS } from '../eligibility';

const StatusBadge = ({ status }) => {
    const styles = {
        pending:  'bg-amber-100 text-amber-700 ring-amber-200',
        approved: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        rejected: 'bg-rose-100 text-rose-700 ring-rose-200',
    };
    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ring-1 ${styles[status] || 'bg-gray-100 text-gray-700 ring-gray-200'}`}>
            {status}
        </span>
    );
};

const BloodChip = ({ group }) => (
    <span className="inline-block bg-red-50 text-red-700 ring-1 ring-red-200 font-bold px-2.5 py-1 rounded-full text-sm">{group}</span>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
    const [inventory, setInventory] = useState([]);
    const [requests, setRequests]   = useState([]);
    const [newInventory, setNewInventory] = useState({ blood_group: '', units: '' });
    const [feedback, setFeedback]   = useState({ text: '', type: '' });
    const [loading, setLoading]     = useState(true);

    const showFeedback = (text, type = 'success') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (user.role === 'hospital') {
                const invRes = await api.get('/inventory.php?mine=1');
                setInventory(invRes.data.data || []);
            }
            const reqRes = await api.get('/requests.php');
            setRequests(reqRes.data.data || []);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('user');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateInventory = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/inventory.php', {
                blood_group: newInventory.blood_group,
                units: parseInt(newInventory.units, 10),
            });
            if (data.success) {
                showFeedback('Inventory updated');
                setNewInventory({ blood_group: '', units: '' });
                fetchData();
            } else {
                showFeedback(data.message || 'Failed to update', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Failed to update', 'error');
        }
    };

    const handleRequestAction = async (id, status) => {
        try {
            const { data } = await api.put('/requests.php', { id, status });
            if (data.success) {
                showFeedback(data.message);
                fetchData();
            } else {
                showFeedback(data.message || 'Action failed', 'error');
            }
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Action failed', 'error');
        }
    };

    const handleLogout = async () => {
        try { await api.post('/logout.php'); } catch (_) { /* ignore */ }
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    const totalUnits = inventory.reduce((sum, i) => sum + Number(i.units), 0);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
            <nav className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">♥</div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                            <p className="text-xs text-gray-500 capitalize">{user.role} account</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">Browse Samples</Link>
                        <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition shadow-sm">Logout</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
                {feedback.text && (
                    <div className={`p-3 rounded-lg text-sm font-medium ring-1 ${
                        feedback.type === 'error'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    }`}>
                        {feedback.text}
                    </div>
                )}

                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{user.email}{user.address ? ` · ${user.address}` : ''}</p>
                    </div>
                    <div className="flex gap-3">
                        {user.role === 'receiver' && user.blood_group && (
                            <div className="bg-red-50 ring-1 ring-red-200 rounded-xl px-4 py-3 text-center min-w-[120px]">
                                <p className="text-xs text-red-700 uppercase font-semibold tracking-wider">Blood Group</p>
                                <p className="text-2xl font-extrabold text-red-600 mt-0.5">{user.blood_group}</p>
                            </div>
                        )}
                        {user.role === 'hospital' && (
                            <>
                                <div className="bg-gray-50 ring-1 ring-gray-200 rounded-xl px-4 py-3 text-center min-w-[110px]">
                                    <p className="text-xs text-gray-600 uppercase font-semibold tracking-wider">Total Units</p>
                                    <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalUnits}</p>
                                </div>
                                <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl px-4 py-3 text-center min-w-[110px]">
                                    <p className="text-xs text-amber-700 uppercase font-semibold tracking-wider">Pending</p>
                                    <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</p>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {user.role === 'hospital' && (
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Manage Blood Inventory</h3>
                        <form onSubmit={handleUpdateInventory} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-6">
                            <select
                                className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-sm"
                                value={newInventory.blood_group}
                                onChange={(e) => setNewInventory({ ...newInventory, blood_group: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select Blood Group</option>
                                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                            <input
                                type="number"
                                min="1"
                                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-sm"
                                placeholder="Units to add"
                                value={newInventory.units}
                                onChange={(e) => setNewInventory({ ...newInventory, units: e.target.value })}
                                required
                            />
                            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition text-sm">
                                Add Units
                            </button>
                        </form>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                                    <tr>
                                        <th className="p-3">Blood Group</th>
                                        <th className="p-3 text-center">Available Units</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {inventory.length > 0 ? inventory.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="p-3"><BloodChip group={item.blood_group} /></td>
                                            <td className="p-3 text-center font-semibold text-lg">{item.units}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="2" className="p-6 text-center text-gray-400 text-sm">No inventory added yet. Add your first blood group above.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        {user.role === 'hospital' ? 'Incoming Requests' : 'My Requests'}
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                                <tr>
                                    <th className="p-3">{user.role === 'hospital' ? 'Receiver' : 'Hospital'}</th>
                                    <th className="p-3 text-center">Blood Group</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3 text-center">Date</th>
                                    {user.role === 'hospital' && <th className="p-3 text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={user.role === 'hospital' ? 5 : 4} className="p-6 text-center text-gray-400 text-sm">Loading…</td></tr>
                                ) : requests.length > 0 ? requests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-900">
                                            {user.role === 'hospital' ? req.receiver_name : req.hospital_name}
                                            {user.role === 'hospital' && req.receiver_email && (
                                                <p className="text-xs text-gray-500 mt-0.5">{req.receiver_email}</p>
                                            )}
                                        </td>
                                        <td className="p-3 text-center"><BloodChip group={req.blood_group} /></td>
                                        <td className="p-3 text-center"><StatusBadge status={req.status} /></td>
                                        <td className="p-3 text-center text-xs text-gray-500">
                                            {req.request_date ? new Date(req.request_date.replace(' ', 'T')).toLocaleDateString() : '—'}
                                        </td>
                                        {user.role === 'hospital' && (
                                            <td className="p-3 text-center">
                                                {req.status === 'pending' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition" onClick={() => handleRequestAction(req.id, 'approved')}>Approve</button>
                                                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold transition" onClick={() => handleRequestAction(req.id, 'rejected')}>Reject</button>
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs italic">Closed</span>}
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr><td colSpan={user.role === 'hospital' ? 5 : 4} className="p-6 text-center text-gray-400 text-sm">No requests yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
