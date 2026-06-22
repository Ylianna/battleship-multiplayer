import { Shield } from 'lucide-react';

interface LoginScreenProps {
    usernameInput: string;
    setUsernameInput: (val: string) => void;
    onLogin: () => void;
}

export function LoginScreen({ usernameInput, setUsernameInput, onLogin }: LoginScreenProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md text-center">
                <div className="inline-flex p-4 bg-indigo-500/10 rounded-full text-indigo-400 mb-4">
                    <Shield size={48} />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">BATTLESHIP</h1>
                <p className="text-slate-400 mb-6">Multiplayer Gaming Platform</p>
                <input
                    type="text"
                    placeholder="Enter your identifier (e.g. John)"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-4"
                />
                <button onClick={onLogin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/30">
                    Launch Platform
                </button>
            </div>
        </div>
    );
}