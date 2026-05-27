import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const RegisterHospital = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'hospital', address: ''
    });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/register.php', formData);
            if (data.success) navigate('/login');
            else setError(data.message || 'Registration failed');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-red-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-red-200">+</div>
                <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">Register as Hospital</h2>
                <p className="mt-2 text-sm text-gray-500">List your blood inventory and respond to requests</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl shadow-red-100/50 rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} required rows="2" className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                        </div>

                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition">
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
                        <p>Already have an account? <Link to="/login" className="font-medium text-red-600 hover:text-red-500">Login</Link></p>
                        <p>Are you a Receiver? <Link to="/register/receiver" className="font-medium text-red-600 hover:text-red-500">Register here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterHospital;
