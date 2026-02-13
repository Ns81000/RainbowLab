import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import './SaltDemo.css';

const RATING_CONFIG = {
    critical: { bg: 'rgba(248, 113, 113, 0.08)', border: 'rgba(248, 113, 113, 0.2)', color: 'var(--accent-red)' },
    high: { bg: 'rgba(251, 146, 60, 0.08)', border: 'rgba(251, 146, 60, 0.2)', color: 'var(--accent-orange)' },
    warning: { bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.2)', color: 'var(--accent-yellow)' },
    moderate: { bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.2)', color: 'var(--accent-yellow)' },
    safe: { bg: 'rgba(52, 211, 153, 0.08)', border: 'rgba(52, 211, 153, 0.2)', color: 'var(--accent-green)' },
    excellent: { bg: 'rgba(96, 165, 250, 0.08)', border: 'rgba(96, 165, 250, 0.2)', color: 'var(--accent-blue)' },
};

function SaltDemo() {
    const [password, setPassword] = useState('hello');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const demonstrate = async () => {
        if (!password.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await api.demonstrateSalt(password);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <span className="page-header-icon">🛡️</span>
                <h2>Salt & Defense Demonstrator</h2>
                <p>See exactly WHY salting destroys rainbow tables — with real hashes, real timing, and real math.</p>
            </div>

            <div className="card mb-4">
                <div className="flex gap-3 items-center">
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Password to demonstrate</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder='Try "hello" or "password123"'
                        />
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={demonstrate} disabled={loading}
                        style={{ alignSelf: 'flex-end' }}>
                        {loading ? <><div className="loading-spinner"></div> Running...</> : '🧪 Demonstrate'}
                    </button>
                </div>
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
                        <div className="salt-comparison-grid">
                            {results.comparisons.map((comp, i) => {
                                const cfg = RATING_CONFIG[comp.rating] || RATING_CONFIG.warning;
                                return (
                                    <motion.div
                                        key={comp.method}
                                        className="salt-comparison-card"
                                        style={{ borderColor: cfg.border, background: cfg.bg }}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                    >
                                        <div className="salt-card-header">
                                            <span className="salt-card-icon">{comp.icon}</span>
                                            <h4>{comp.method}</h4>
                                            <span className={`badge ${comp.rainbow_vulnerable ? 'badge-critical' : 'badge-safe'}`}>
                                                {comp.rainbow_vulnerable ? '⚠️ VULNERABLE' : '✅ PROTECTED'}
                                            </span>
                                        </div>

                                        {comp.salt && comp.salt !== 'embedded' && (
                                            <div className="salt-field">
                                                <span className="salt-field-label">Salt</span>
                                                <span className="font-mono text-sm text-purple">{comp.salt}</span>
                                            </div>
                                        )}

                                        <div className="hash-display" style={{ fontSize: '0.72rem' }}>
                                            {comp.hash}
                                        </div>

                                        <div className="salt-meta">
                                            <div>
                                                <span className="text-muted text-xs">Crack Time</span>
                                                <div className="text-sm font-bold" style={{ color: cfg.color }}>
                                                    {comp.crack_time}
                                                </div>
                                            </div>
                                            {comp.actual_time_ms !== undefined && (
                                                <div>
                                                    <span className="text-muted text-xs">Actual hash time</span>
                                                    <div className="text-sm font-mono">{comp.actual_time_ms}ms</div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {results.rainbow_table_math && (
                            <motion.div
                                className="card mt-4"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="card-header">
                                    <span className="icon">🤯</span>
                                    <h3>The Math That Kills Rainbow Tables</h3>
                                </div>
                                <div className="math-comparison">
                                    <div className="math-side bad">
                                        <h4>Without Salt</h4>
                                        <div className="math-value text-red">
                                            {results.rainbow_table_math.standard_table_size_gb} GB
                                        </div>
                                        <p>One table cracks ALL passwords using this algorithm</p>
                                    </div>
                                    <div className="math-vs">VS</div>
                                    <div className="math-side good">
                                        <h4>With 128-bit Salt</h4>
                                        <div className="math-value text-green">
                                            {Number(results.rainbow_table_math.with_salt_size_tb).toLocaleString()} TB
                                        </div>
                                        <p>Need a separate table for every possible salt value = IMPOSSIBLE</p>
                                    </div>
                                </div>
                                <p className="text-center text-muted text-sm mt-4">
                                    {results.rainbow_table_math.conclusion}
                                </p>
                            </motion.div>
                        )}

                        <motion.div
                            className="card mt-4"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="card-header">
                                <span className="icon">📈</span>
                                <h3>The Defense Progression</h3>
                            </div>
                            <div className="defense-progression">
                                {results.comparisons.map((comp, i) => {
                                    const cfg = RATING_CONFIG[comp.rating] || RATING_CONFIG.warning;
                                    const width = comp.rainbow_vulnerable ? 10 + i * 5 : 40 + i * 12;
                                    return (
                                        <div key={comp.method} className="defense-bar-row">
                                            <span className="defense-bar-label">{comp.method}</span>
                                            <div className="defense-bar-track">
                                                <motion.div
                                                    className="defense-bar-fill"
                                                    style={{ background: cfg.color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(width, 100)}%` }}
                                                    transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }}
                                                />
                                            </div>
                                            <span className="defense-bar-value" style={{ color: cfg.color }}>
                                                {comp.icon}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!results && !loading && (
                <div className="empty-state">
                    <div className="empty-state-icon">🛡️</div>
                    <div className="empty-state-text">Enter a password and click Demonstrate</div>
                    <div className="empty-state-subtext">
                        Watch the same password hashed 6 different ways — from broken to bulletproof
                    </div>
                </div>
            )}
        </div>
    );
}

export default SaltDemo;
