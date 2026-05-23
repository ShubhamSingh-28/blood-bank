import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [inventory, setInventory] = useState([]);
    const [requests, setRequests] = useState([]);
    const [newInventory, setNewInventory] = useState({ blood_group: '', units: '' });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        try {
            const invRes = await axios.get(`http://localhost/blood-bank-system/server/api/inventory.php?hospital_id=${user.id}`);
            setInventory(invRes.data.data || []);
            const reqRes = await axios.get(`http://localhost/blood-bank-system/server/api/requests.php?user_id=${user.id}&role=${user.role}`);
            setRequests(reqRes.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateInventory = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost/blood-bank-system/server/api/inventory.php', {
            hospital_id: user.id,
            ...newInventory
        });
        setNewInventory({ blood_group: '', units: '' });
        fetchData();
    };

    const handleRequestAction = async (id, status) => {
        await axios.put('http://localhost/blood-bank-system/server/api/requests.php', { id, status });
        fetchData();
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <nav className="w-full bg-red-600 text-white p-4 shadow-md flex justify-between items-center fixed top-0 z-10 px-8">
                <h1 className="text-2xl font-bold tracking-wide">Dashboard ({user.role === 'hospital' ? 'Hospital' : 'Receiver'})</h1>
                <div className="flex gap-4">
                    <Link to="/">
                        <button className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-semibold transition shadow">Public Inventory</button>
                    </Link>
                    <button onClick={handleLogout} className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition shadow">Logout</button>
                </div>
            </nav>
            <main className="mt-24 w-full max-w-5xl flex flex-col gap-8 p-4">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Welcome, {user.name}!</h2>
                        <p className="text-gray-500 mt-1">{user.email} | {user.address}</p>
                    </div>
                    {user.role === 'receiver' && (
                        <div className="text-right">
                            <p className="text-sm text-gray-500 uppercase tracking-wide">Blood Group</p>
                            <p className="text-3xl font-bold text-red-500">{user.blood_group}</p>
                        </div>
                    )}
                </div>
                
                {user.role === 'hospital' && (
                    <section className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Manage Blood Inventory</h3>
                        <form onSubmit={handleUpdateInventory} className="flex gap-4 mb-6">
                            <select 
                                className="flex-1 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-400 focus:outline-none"
                                value={newInventory.blood_group}
                                onChange={(e) => setNewInventory({...newInventory, blood_group: e.target.value})} 
                                required
                            >
                                <option value="" disabled>Select Blood Group</option>
                                <option value="A+">A+</option><option value="A-">A-</option>
                                <option value="B+">B+</option><option value="B-">B-</option>
                                <option value="O+">O+</option><option value="O-">O-</option>
                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                            </select>
                            <input 
                                type="number" 
                                className="flex-1 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-400 focus:outline-none"
                                placeholder="Units to Add" 
                                value={newInventory.units}
                                min="1"
                                onChange={(e) => setNewInventory({...newInventory, units: e.target.value})} 
                                required 
                            />
                            <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded shadow transition">Add Units</button>
                        </form>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="p-3 border-b">Blood Group</th>
                                        <th className="p-3 border-b text-center">Total Units</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {inventory.length > 0 ? inventory.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-semibold text-gray-800">
                                                <span className="inline-block bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full">{item.blood_group}</span>
                                            </td>
                                            <td className="p-3 text-center text-lg">{item.units}</td>
                                        </tr>
                                    )) : <tr><td colSpan="2" className="p-4 text-center text-gray-500">No inventory added yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <section className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{user.role === 'hospital' ? 'Received Blood Requests' : 'My Blood Requests'}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="p-3 border-b">{user.role === 'hospital' ? 'Receiver Name' : 'Hospital Name'}</th>
                                    <th className="p-3 border-b text-center">Blood Group</th>
                                    <th className="p-3 border-b text-center">Status</th>
                                    {user.role === 'hospital' && <th className="p-3 border-b text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {requests.length > 0 ? requests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{user.role === 'hospital' ? req.receiver_name : req.hospital_name}</td>
                                        <td className="p-3 text-center">
                                            <span className="inline-block bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full">{req.blood_group}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold tracking-wide
                                                ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                  req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                  'bg-red-100 text-red-700'}`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </td>
                                        {user.role === 'hospital' && (
                                            <td className="p-3 text-center">
                                                {req.status === 'pending' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow text-sm font-medium transition" onClick={() => handleRequestAction(req.id, 'approved')}>Approve</button>
                                                        <button className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded shadow text-sm font-medium transition" onClick={() => handleRequestAction(req.id, 'rejected')}>Reject</button>
                                                    </div>
                                                ) : <span className="text-gray-400 italic">Action Taken</span>}
                                            </td>
                                        )}
                                    </tr>
                                )) : <tr><td colSpan={user.role === 'hospital' ? 4 : 3} className="p-4 text-center text-gray-500">No requests found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
