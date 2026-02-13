import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../../api';
import './BattleArena.css';

const ALGO_COLORS = {
    'MD5': '#f87171',
    'SHA-1': '#fb923c',
    'SHA-256': '#fbbf24',
    'SHA-512': '#e2e830',
    'SHA-3 (256)': '#34d399',
    'BLAKE2b': '#22d3ee',
    'bcrypt (cost=10)': '#60a5fa',
    'bcrypt (cost=12)': '#818cf8',
    'Argon2id': '#a78bfa',
};

function BattleArena() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('benchmark_test_123');
    const [iterations, setIterations] = useState(1000);
    const [view, setView] = useState('speed');

    const runBenchmark = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.runBenchmark(password, iterations);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getChartData = () => {
        if (!results) return [];
        return results.results
            .filter((r) => !r.error)
            .map((r) => ({
                name: r.algorithm,
                speed: r.hashes_per_sec,
                time: r.time_per_hash_us,
                gpu: r.estimated_gpu_per_sec,
                color: ALGO_COLORS[r.algorithm] || '#a78bfa',
            }));
    };

    const formatNumber = (n) => {
        if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toFixed(1);
    };

    const maxSpeed = results
        ? Math.max(...results.results.filter((r) => !r.error).map((r) => r.hashes_per_sec))
        : 1;

    return (
        <div className="page-container">
            <div className="page-header">
                <span className="page-header-icon">📊</span>
                <h2>Algorithm Battle Arena</h2>
                <p>Head-to-head benchmark of every hashing algorithm — run on your machine. See why "slow" equals "secure" for passwords.</p>
            </div>

            <div className="card mb-4">
                <div className="card-header">
                    <span className="icon">⚙️</span>
                    <h3>Benchmark Configuration</h3>
                </div>
                <div className="arena-config">
                    <div className="input-group">
                        <label>Test Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Iterations (fast algos): {iterations}</label>
                        <input type="range" min="100" max="10000" step="100"
                            value={iterations}
                            onChange={(e) => setIterations(Number(e.target.value))} />
                    </div>
                </div>
                <button className="btn btn-primary btn-lg w-full mt-4" onClick={runBenchmark} disabled={loading}>
                    {loading ? (
                        <><div className="loading-spinner"></div> Running benchmark (this takes a few seconds)...</>
                    ) : '⚔️ Run Benchmark'}
                </button>
            </div>

            {error && (
                <div className="error-banner"><span>⚠️</span> {error}</div>
            )}

            <AnimatePresence>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="arena-tabs mb-4">
                            <button className={`arena-tab ${view === 'speed' ? 'active' : ''}`}
                                onClick={() => setView('speed')}>⚡ Hash Speed</button>
                            <button className={`arena-tab ${view === 'chart' ? 'active' : ''}`}
                                onClick={() => setView('chart')}>📊 Visual Chart</button>
                            <button className={`arena-tab ${view === 'table' ? 'active' : ''}`}
                                onClick={() => setView('table')}>📋 Full Table</button>
                        </div>

                        {view === 'speed' && (
                            <div className="speed-bars">
                                {results.results.filter((r) => !r.error).map((r, i) => {
                                    const pct = (r.hashes_per_sec / maxSpeed) * 100;
                                    const color = ALGO_COLORS[r.algorithm] || '#a78bfa';
                                    return (
                                        <motion.div
                                            key={r.algorithm}
                                            className="speed-bar-row"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                        >
                                            <div className="speed-bar-info">
                                                <span className="speed-bar-name">{r.algorithm}</span>
                                                <span className="speed-bar-rating">{r.rating}</span>
                                            </div>
                                            <div className="speed-bar-track">
                                                <motion.div
                                                    className="speed-bar-fill"
                                                    style={{ background: color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max(pct, 0.5)}%` }}
                                                    transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: 'easeOut' }}
                                                />
                                            </div>
                                            <span className="speed-bar-value font-mono" style={{ color }}>
                                                {formatNumber(r.hashes_per_sec)}/s
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {view === 'chart' && (
                            <div className="chart-container card">
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={getChartData()} layout="vertical"
                                        margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
                                        <XAxis type="number" tick={{ fill: '#9d9db8', fontSize: 12 }}
                                            tickFormatter={formatNumber} />
                                        <YAxis type="category" dataKey="name"
                                            tick={{ fill: '#9d9db8', fontSize: 12 }}
                                            width={100} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '8px',
                                                color: '#e8e8f0',
                                                fontSize: '0.85rem',
                                            }}
                                            formatter={(value) => [formatNumber(value) + '/sec', 'Hash Speed']}
                                        />
                                        <Bar dataKey="speed" radius={[0, 4, 4, 0]}>
                                            {getChartData().map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {view === 'table' && (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Algorithm</th>
                                            <th>Hashes/sec</th>
                                            <th>GPU Estimate</th>
                                            <th>Time/Hash</th>
                                            <th>Crack Time (8-char)</th>
                                            <th>Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.results.filter((r) => !r.error).map((r, i) => (
                                            <tr key={i}>
                                                <td className="font-bold">{r.algorithm}</td>
                                                <td className="font-mono">{formatNumber(r.hashes_per_sec)}</td>
                                                <td className="font-mono">{formatNumber(r.estimated_gpu_per_sec)}</td>
                                                <td className="font-mono">{r.time_per_hash_us}µs</td>
                                                <td className="font-bold"
                                                    style={{ color: ALGO_COLORS[r.algorithm] }}>
                                                    {r.crack_time_8char}
                                                </td>
                                                <td>{r.rating}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <motion.div
                            className="card mt-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="card-header">
                                <span className="icon">💡</span>
                                <h3>Key Takeaway</h3>
                            </div>
                            <p className="arena-takeaway">
                                Notice how MD5 is <strong className="text-red">astronomically faster</strong> than bcrypt or Argon2?
                                That's <em>exactly the problem</em>. For password hashing, <strong className="text-green">slowness IS the security feature</strong>.
                                A hash function that takes 300ms per attempt means a brute-force attack would take
                                <strong className="text-purple"> centuries</strong> instead of minutes.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!results && !loading && (
                <div className="empty-state">
                    <div className="empty-state-icon">⚔️</div>
                    <div className="empty-state-text">Hit "Run Benchmark" to test all algorithms on your machine</div>
                    <div className="empty-state-subtext">
                        Results will show exactly why fast hashing is dangerous for passwords
                    </div>
                </div>
            )}
        </div>
    );
}

export default BattleArena;
