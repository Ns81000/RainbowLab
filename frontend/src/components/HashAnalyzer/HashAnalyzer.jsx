import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import './HashAnalyzer.css';

const SEVERITY_CONFIG = {
    critical: { label: 'BROKEN', className: 'badge-critical', icon: '🔴' },
    high: { label: 'WEAK', className: 'badge-high', icon: '🟠' },
    warning: { label: 'CAUTION', className: 'badge-warning', icon: '🟡' },
    safe: { label: 'SECURE', className: 'badge-safe', icon: '🟢' },
    excellent: { label: 'STRONGEST', className: 'badge-excellent', icon: '🔵' },
};

function HashAnalyzer() {
    const [input, setInput] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!input.trim()) {
            setResults(null);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.analyzeHash(input);
                setResults(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [input]);

    const copyHash = (hash, algo) => {
        navigator.clipboard.writeText(hash);
        setCopied(algo);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <span className="page-header-icon">🔬</span>
                <h2>Hash Analyzer</h2>
                <p>Type any text and instantly see its hash across every major algorithm — with security ratings and crack time estimates.</p>
            </div>

            <div className="analyzer-input-section">
                <div className="input-group">
                    <label htmlFor="hash-input">Enter text to hash</label>
                    <input
                        id="hash-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='Try "password123" or any text...'
                        autoFocus
                        className="analyzer-input"
                    />
                </div>

                {input && (
                    <div className="input-meta">
                        <span className="text-muted text-sm">
                            {input.length} characters
                        </span>
                        {loading && <div className="loading-spinner"></div>}
                    </div>
                )}
            </div>

            {error && (
                <div className="error-banner">
                    <span>⚠️</span> {error}
                    <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
                        Make sure the Python backend is running on port 8000
                    </span>
                </div>
            )}

            <AnimatePresence mode="wait">
                {results && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="results-grid">
                            {results.results.map((r, i) => {
                                const sev = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.safe;
                                return (
                                    <motion.div
                                        key={r.algorithm_key}
                                        className="hash-result-card"
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <div className={`severity-stripe severity-${r.severity}`}></div>
                                        <div className="hash-result-header">
                                            <div className="hash-result-title">
                                                <span className="hash-algo-name">{r.algorithm}</span>
                                                <span className="hash-bits">{r.bits}-bit</span>
                                            </div>
                                            <span className={`badge ${sev.className}`}>
                                                {sev.icon} {r.status}
                                            </span>
                                        </div>

                                        <div
                                            className="hash-display hash-clickable"
                                            onClick={() => copyHash(r.hash, r.algorithm_key)}
                                            title="Click to copy"
                                        >
                                            {r.hash}
                                            {copied === r.algorithm_key && (
                                                <span className="copied-badge">Copied!</span>
                                            )}
                                        </div>

                                        <div className="hash-result-meta">
                                            <div className="hash-meta-item">
                                                <span className="hash-meta-label">Crack time</span>
                                                <span className={`hash-meta-value ${r.crack_estimate.seconds < 3600 ? 'text-red' : r.crack_estimate.seconds < 86400 * 30 ? 'text-yellow' : 'text-green'}`}>
                                                    {r.crack_estimate.human_readable}
                                                </span>
                                            </div>
                                            <div className="hash-meta-item">
                                                <span className="hash-meta-label">Rainbow table?</span>
                                                <span className={r.rainbow_vulnerable ? 'text-red' : 'text-green'}>
                                                    {r.rainbow_vulnerable ? '⚠️ Vulnerable' : '✅ Safe'}
                                                </span>
                                            </div>
                                            {r.year_broken && (
                                                <div className="hash-meta-item">
                                                    <span className="hash-meta-label">Broken since</span>
                                                    <span className="text-orange">{r.year_broken}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="hash-description">{r.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!input && !results && (
                <div className="empty-state">
                    <div className="empty-state-icon">🔬</div>
                    <div className="empty-state-text">Start typing to see hashes in real time</div>
                    <div className="empty-state-subtext">
                        All hashes are computed server-side using Python's hashlib
                    </div>
                </div>
            )}
        </div>
    );
}

export default HashAnalyzer;
