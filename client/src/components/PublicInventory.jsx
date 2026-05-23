import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const checkEligibility = (receiverBg, sampleBg) => {
    if (!receiverBg) return false;
    const rules = {
        'O-': ['O-'],
        'O+': ['O+', 'O-'],
        'A-': ['A-', 'O-'],
        'A+': ['A+', 'A-', 'O+', 'O-'],
        'B-': ['B-', 'O-'],
        'B+': ['B+', 'B-', 'O+', 'O-'],
        'AB-': ['AB-', 'A-', 'B-', 'O-'],
        'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    };
    return rules[receiverBg]?.includes(sampleBg);
};

const PublicInventory = () => {
    const [samples, setSamples] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await axios.get('http://localhost/blood-bank-system/server/api/inventory.php');
                setSamples(res.data.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchInventory();
    }, []);

    const handleRequest = async (hospitalId, bloodGroup) => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'hospital') {
            setMessage({ text: 'Hospitals cannot request blood.', type: 'error' });
            return;
        }
        if (!checkEligibility(user.blood_group, bloodGroup)) {
            setMessage({ text: 'You are not eligible for this blood group.', type: 'error' });
            return;
        }

        try {
            const res = await axios.post('http://localhost/blood-bank-system/server/api/requests.php', {
                receiver_id: user.id,
                hospital_id: hospitalId,
                blood_group: bloodGroup
            });
            console.log(res);
            
            if (res.data.success) {
                setMessage({ text: 'Request sent successfully!', type: 'success' });
            } else {
                setMessage({ text: res.data.message || 'Request failed', type: 'error' });
            }
        } catch (err) {
            console.log(err);
            
            setMessage({ text: err?.data?.message || 'Request failed', type: 'error' });
        }
        
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <nav className="w-full bg-red-600 text-white p-4 shadow-md flex justify-between items-center fixed top-0 z-10 px-8">
                <h1 className="text-2xl font-bold tracking-wide">Available Blood Samples</h1>
                <div>
                    {user ? (
                        <Link to="/dashboard">
                            <button className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition shadow">Dashboard</button>
                        </Link>
                    ) : (
                        <Link to="/login">
                            <button className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition shadow">Login / Register</button>
                        </Link>
                    )}
                </div>
            </nav>
            <main className="mt-24 w-full max-w-5xl p-6 bg-white rounded-lg shadow-xl border border-gray-100">
                {message.text && (
                    <div className={`p-4 mb-6 rounded-md font-medium text-center ${message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}
                
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-4 border-b">Hospital Name</th>
                                <th className="p-4 border-b">Address</th>
                                <th className="p-4 border-b text-center">Blood Group</th>
                                <th className="p-4 border-b text-center">Units Available</th>
                                <th className="p-4 border-b text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {samples.length > 0 ? samples.map(sample => (
                                <tr key={`${sample.hospital_id}-${sample.blood_group}`} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium text-gray-900">{sample.hospital_name}</td>
                                    <td className="p-4 text-gray-600">{sample.address}</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-block bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full">{sample.blood_group}</span>
                                    </td>
                                    <td className="p-4 text-center font-semibold">{sample.units}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded shadow transition transform active:scale-95"
                                            onClick={() => handleRequest(sample.hospital_id, sample.blood_group)}
                                        >
                                            Request Sample
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No blood samples available at the moment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default PublicInventory;