import React, { useState } from 'react';
import { db } from '../services/db';

interface AuthPageProps {
    onLogin: (username: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isHuman, setIsHuman] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!username.trim() || !password.trim()) {
            setError('Username and password are required');
            return;
        }

        if (!isHuman) {
            setError('Please confirm you are not an Automaton');
            return;
        }

        setIsLoading(true);

        try {
            if (isLogin) {
                const result = await db.login(username, password);
                if (result.success) {
                    onLogin(username);
                } else {
                    setError(result.message || 'Login failed');
                }
            } else {
                const result = await db.register(username, password);
                if (result.success) {
                    setSuccess('Registration successful! Please login.');
                    setIsLogin(true);
                    setPassword('');
                    setIsHuman(false);
                } else {
                    setError(result.message || 'Registration failed');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-linear-to-r from-yellow-500 to-orange-600 rounded-2xl blur opacity-10"></div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500">
                        {isLogin ? 'Helldiver Login' : 'Enlistment'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500 text-white placeholder-gray-500 transition-colors"
                                placeholder="Enter your callsign"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500 text-white placeholder-gray-500 transition-colors"
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* Automaton Captcha */}
                        <div className="flex items-center p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-yellow-500/50 transition-colors cursor-pointer" onClick={() => setIsHuman(!isHuman)}>
                            <div className={`w-6 h-6 rounded border flex items-center justify-center mr-3 transition-colors ${isHuman ? 'bg-yellow-500 border-yellow-500' : 'border-gray-500'}`}>
                                {isHuman && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-gray-300 select-none">I'm not an Automaton</span>
                        </div>

                        {error && <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                        {success && <div className="text-green-500 text-sm text-center bg-green-500/10 p-2 rounded border border-green-500/20">{success}</div>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-3 px-8 rounded-lg shadow-lg transform transition hover:scale-[1.02] duration-200 flex items-center justify-center ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {isLogin ? 'Login' : 'Register'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setSuccess('');
                            }}
                            className="text-gray-400 hover:text-yellow-400 text-sm transition-colors"
                        >
                            {isLogin ? "Need an account? Enlist here" : "Already enlisted? Login here"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
