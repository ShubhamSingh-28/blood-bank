import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { BLOOD_GROUPS, isEligible } from '../eligibility';

const PublicInventory = () => {
    const [samples, setSamples]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [filterBg, setFilterBg] = useState('ALL');
    const [message, setMessage]   = useState({ text: '', type: '' });
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await api.get('/inventory.php');
                setSamples(res.data.data || []);
            } catch (_) {
                /* swallow */
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleRequest = async (hospitalId, bloodGroup) => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const { data } = await api.post('/requests.php', {
                hospital_id: hospitalId,
                blood_group: bloodGroup,
            });
            showMessage(data.message || (data.success ? 'Request sent!' : 'Request failed'),
                        data.success ? 'success' : 'error');
        } catch (err) {
            showMessage(err.response?.data?.message || 'Request failed', 'error');
        }
    };

    const stats = useMemo(() => {
        const hospitals = new Set(samples.map(s => s.hospital_id));
        const totalUnits = samples.reduce((sum, s) => sum + Number(s.units), 0);
        const groups = new Set(samples.map(s => s.blood_group));
        return { hospitals: hospitals.size, totalUnits, groups: groups.size };
    }, [samples]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return samples.filter(s => {
            if (filterBg !== 'ALL' && s.blood_group !== filterBg) return false;
            if (q && !s.hospital_name.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [samples, search, filterBg]);

    // Group by hospital for card layout
    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach(s => {
            if (!map.has(s.hospital_id)) {
                map.set(s.hospital_id, {
                    hospital_id: s.hospital_id,
                    hospital_name: s.hospital_name,
                    address: s.address,
                    items: [],
                });
            }
            map.get(s.hospital_id).items.push({
                blood_group: s.blood_group,
                units: s.units,
                inventory_id: s.inventory_id,
            });
        });
        return Array.from(map.values());
    }, [filtered]);

    const buttonStateFor = (bg) => {
        if (!user) return { disabled: false, label: 'Login to request', tone: 'primary' };
        if (user.role === 'hospital') return { disabled: true, label: 'Hospitals cannot request', tone: 'muted' };
        if (!isEligible(user.blood_group, bg)) return { disabled: true, label: 'Not compatible', tone: 'muted' };
        return { disabled: false, label: 'Request Sample', tone: 'primary' };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50/40">
            <nav className="w-full bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">♥</div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Blood Bank</h1>
                            <p className="text-xs text-gray-500">Find a compatible sample</p>
                        </div>
                    </Link>
                    <div className="flex gap-2">
                        {user ? (
                            <Link to="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition shadow-sm">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">Login</Link>
                                <Link to="/register/receiver" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition shadow-sm">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Find blood samples, <span className="text-red-600">save a life</span>
                </h2>
                <p className="mt-3 text-gray-600 max-w-2xl">
                    Browse available blood samples from registered hospitals. Receivers can request a compatible blood group with a single click.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 max-w-xl">
                    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Hospitals</p>
                        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{stats.hospitals}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Units</p>
                        <p className="text-2xl font-extrabold text-red-600 mt-0.5">{stats.totalUnits}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Groups</p>
                        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{stats.groups}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-12">
                {message.text && (
                    <div className={`p-3 mb-4 rounded-lg text-sm font-medium ring-1 ${
                        message.type === 'error'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
                    <input
                        type="text"
                        placeholder="Search by hospital name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => setFilterBg('ALL')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ring-1 ${
                                filterBg === 'ALL'
                                    ? 'bg-red-600 text-white ring-red-600'
                                    : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
                            }`}
                        >All</button>
                        {BLOOD_GROUPS.map(bg => (
                            <button
                                key={bg}
                                onClick={() => setFilterBg(bg)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ring-1 ${
                                    filterBg === bg
                                        ? 'bg-red-600 text-white ring-red-600'
                                        : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
                                }`}
                            >{bg}</button>
                        ))}
                    </div>
                </div>

                {user?.role === 'receiver' && (
                    <p className="mb-4 text-sm text-gray-600">
                        You're registered as <span className="font-semibold text-red-600">{user.blood_group}</span>.
                        Only compatible blood groups are clickable.
                    </p>
                )}

                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Loading samples…</div>
                ) : grouped.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
                        <p className="font-medium">No blood samples match your search.</p>
                        <p className="text-sm mt-1">Try clearing the filter or check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {grouped.map(h => (
                            <div key={h.hospital_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{h.hospital_name}</h3>
                                        {h.address && <p className="text-sm text-gray-500 mt-0.5">{h.address}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {h.items.map(item => {
                                        const { disabled, label, tone } = buttonStateFor(item.blood_group);
                                        return (
                                            <div key={item.inventory_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="inline-block bg-red-50 text-red-700 ring-1 ring-red-200 font-bold px-2.5 py-1 rounded-full text-sm min-w-[3rem] text-center">
                                                        {item.blood_group}
                                                    </span>
                                                    <span className="text-sm text-gray-700">
                                                        <span className="font-semibold">{item.units}</span> {item.units === 1 ? 'unit' : 'units'}
                                                    </span>
                                                </div>
                                                <button
                                                    disabled={disabled}
                                                    onClick={() => handleRequest(h.hospital_id, item.blood_group)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                                                        tone === 'primary'
                                                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    }`}
                                                    title={disabled ? label : ''}
                                                >
                                                    {label}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="border-t border-gray-200 bg-white">
                <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-gray-500 text-center">
                    Blood Bank System · Built with React + PHP + MySQL
                </div>
            </footer>
        </div>
    );
};

export default PublicInventory;
