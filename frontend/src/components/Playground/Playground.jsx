import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import './Playground.css';

const PHASES = [
    { key: 'build', label: 'Build Table', icon: '🏗️' },
    { key: 'target', label: 'Set Target', icon: '🎯' },
    { key: 'crack', label: 'Crack!', icon: '💥' },
];

const CHARSET_INFO = {
    lowercase: { label: 'Lowercase [a-z]', size: 26 },
    digits: { label: 'Digits [0-9]', size: 10 },
    lowercase_digits: { label: 'Lowercase + Digits', size: 36 },
    alphanumeric: { label: 'Alphanumeric [a-zA-Z0-9]', size: 62 },
};

function Playground() {
    const [phase, setPhase] = useState(0);
    const [charset, setCharset] = useState('lowercase');
    const [maxLength, setMaxLength] = useState(4);
    const [hashType, setHashType] = useState('md5');
    const [chainLength, setChainLength] = useState(100);
    const [chainCount, setChainCount] = useState(500);
    const [hashToCrack, setHashToCrack] = useState('');
    const [passwordToCrack, setPasswordToCrack] = useState('');

    const [tableInfo, setTableInfo] = useState(null);
    const [crackResult, setCrackResult] = useState(null);
    const [generatingTable, setGeneratingTable] = useState(false);
    const [cracking, setCracking] = useState(false);
    const [crackingPhase, setCrackingPhase] = useState('');
    const [error, setError] = useState(null);
    const crackTimerRef = useRef(null);
    const [elapsed, setElapsed] = useState(0);

    const charsetSize = CHARSET_INFO[charset]?.size || 26;
    let totalKeyspace = 0;
    for (let i = 1; i <= maxLength; i++) totalKeyspace += Math.pow(charsetSize, i);
    const coverage = Math.min((chainCount * chainLength / totalKeyspace * 100), 100);

    const generateTable = async () => {
        setGeneratingTable(true);
        setError(null);
        setCrackResult(null);
        try {
            const data = await api.generateTable({
                charset, max_length: maxLength, hash_type: hashType,
                chain_length: chainLength, chain_count: chainCount,
            });
            setTableInfo(data);
            setPhase(1);
        } catch (err) {
            setError(err.message);
        } finally {
            setGeneratingTable(false);
        }
    };

    const generateTestHash = async () => {
        if (!passwordToCrack.trim()) return;
        try {
            const data = await api.analyzeHash(passwordToCrack.trim());
            const match = data.results.find((r) => r.algorithm_key === hashType);
            if (match) setHashToCrack(match.hash);
        } catch { }
    };

    const crackHash = async () => {
        if (!hashToCrack.trim()) return;
        setPhase(2);
        setCracking(true);
        setError(null);
        setCrackResult(null);
        setElapsed(0);
        setCrackingPhase('Generating rainbow table...');

        const startTime = Date.now();
        crackTimerRef.current = setInterval(() => {
            setElapsed(((Date.now() - startTime) / 1000).toFixed(2));
        }, 50);

        setTimeout(() => setCrackingPhase('Searching chains...'), 800);
        setTimeout(() => setCrackingPhase('Applying reduction functions...'), 1600);

        try {
            const data = await api.crackHash({
                hash_to_crack: hashToCrack.trim(),
                hash_type: hashType,
                charset,
                max_length: maxLength,
                chain_length: chainLength,
                chain_count: chainCount,
            });
            setCrackResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setCracking(false);
            setCrackingPhase('');
            if (crackTimerRef.current) clearInterval(crackTimerRef.current);
        }
    };

    useEffect(() => {
        return () => { if (crackTimerRef.current) clearInterval(crackTimerRef.current); };
    }, []);

    const resetAll = () => {
        setPhase(0);
        setTableInfo(null);
        setCrackResult(null);
        setHashToCrack('');
        setPasswordToCrack('');
        setError(null);
        setElapsed(0);
    };

    const quickTests = [
        { label: 'cat', pw: 'cat' },
        { label: 'ab', pw: 'ab' },
        { label: 'test', pw: 'test' },
        { label: 'zz', pw: 'zz' },
        { label: 'hello', pw: 'hello' },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <span className="page-header-icon">🧪</span>
                <h2>Live Cracking Playground</h2>
                <p>Build a real rainbow table, pick a target, and watch it crack in real time.</p>
            </div>

            <div className="pg-phase-bar">
                {PHASES.map((p, i) => (
                    <div
                        key={p.key}
                        className={`pg-phase-step ${i <= phase ? 'active' : ''} ${i === phase ? 'current' : ''}`}
                        onClick={() => { if (i <= phase || (i === 1 && tableInfo)) setPhase(i); }}
                    >
                        <span className="pg-phase-num">{i < phase ? '✓' : p.icon}</span>
                        <span className="pg-phase-label">{p.label}</span>
                        {i < PHASES.length - 1 && <div className={`pg-phase-connector ${i < phase ? 'done' : ''}`} />}
                    </div>
                ))}
            </div>

            <div className="pg-sandbox-notice">
                <span>🎓</span>
                <p><strong>Educational Sandbox</strong> — max {maxLength}-char passwords, {charsetSize} characters = <strong>{totalKeyspace.toLocaleString()}</strong> combinations. Cannot crack real-world passwords.</p>
            </div>

            <AnimatePresence mode="wait">
                {phase === 0 && (
                    <motion.div key="build" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                        <div className="pg-build-layout">
                            <div className="card pg-config-card">
                                <div className="card-header">
                                    <span className="icon">⚙️</span>
                                    <h3>Table Configuration</h3>
                                </div>

                                <div className="input-group">
                                    <label>Character Set</label>
                                    <select value={charset} onChange={(e) => setCharset(e.target.value)}>
                                        {Object.entries(CHARSET_INFO).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label} ({v.size} chars)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Hash Algorithm</label>
                                    <select value={hashType} onChange={(e) => setHashType(e.target.value)}>
                                        <option value="md5">MD5</option>
                                        <option value="sha1">SHA-1</option>
                                        <option value="sha256">SHA-256</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Max Password Length: <strong>{maxLength}</strong></label>
                                    <input type="range" min="2" max="5" value={maxLength}
                                        onChange={(e) => setMaxLength(Number(e.target.value))} />
                                </div>

                                <div className="input-group">
                                    <label>Chain Length: <strong>{chainLength}</strong></label>
                                    <input type="range" min="10" max="500" step="10" value={chainLength}
                                        onChange={(e) => setChainLength(Number(e.target.value))} />
                                </div>

                                <div className="input-group">
                                    <label>Chain Count: <strong>{chainCount}</strong></label>
                                    <input type="range" min="50" max="2000" step="50" value={chainCount}
                                        onChange={(e) => setChainCount(Number(e.target.value))} />
                                </div>

                                <button className="btn btn-primary w-full mt-4" onClick={generateTable} disabled={generatingTable}>
                                    {generatingTable ? (
                                        <><div className="loading-spinner"></div> Generating...</>
                                    ) : '🏗️ Build Rainbow Table'}
                                </button>
                            </div>

                            <div className="pg-preview-panel">
                                <div className="pg-gauge-card">
                                    <h4>Coverage Estimate</h4>
                                    <div className="pg-gauge">
                                        <svg viewBox="0 0 120 120" className="pg-gauge-svg">
                                            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                                            <circle
                                                cx="60" cy="60" r="52" fill="none"
                                                stroke={coverage > 70 ? 'var(--accent-green)' : coverage > 30 ? 'var(--accent-yellow)' : 'var(--accent-red)'}
                                                strokeWidth="8" strokeLinecap="round"
                                                strokeDasharray={`${coverage * 3.267} 326.7`}
                                                transform="rotate(-90 60 60)"
                                                style={{ transition: 'all 0.5s ease' }}
                                            />
                                        </svg>
                                        <div className="pg-gauge-value">{coverage.toFixed(1)}%</div>
                                    </div>
                                    <p className="pg-gauge-sub">of {totalKeyspace.toLocaleString()} passwords covered</p>
                                </div>

                                <div className="pg-stats-grid">
                                    <div className="pg-stat-item">
                                        <span className="pg-stat-val">{chainCount.toLocaleString()}</span>
                                        <span className="pg-stat-lbl">Chains</span>
                                    </div>
                                    <div className="pg-stat-item">
                                        <span className="pg-stat-val">{chainLength}</span>
                                        <span className="pg-stat-lbl">Chain Length</span>
                                    </div>
                                    <div className="pg-stat-item">
                                        <span className="pg-stat-val">{(chainCount * chainLength).toLocaleString()}</span>
                                        <span className="pg-stat-lbl">Pairs Covered</span>
                                    </div>
                                    <div className="pg-stat-item">
                                        <span className="pg-stat-val">{hashType.toUpperCase()}</span>
                                        <span className="pg-stat-lbl">Algorithm</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {phase === 1 && (
                    <motion.div key="target" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                        <div className="pg-target-layout">
                            <div className="card pg-target-card">
                                <div className="card-header">
                                    <span className="icon">🎯</span>
                                    <h3>Choose Your Target</h3>
                                </div>

                                <div className="pg-target-section">
                                    <h4>Quick Test Passwords</h4>
                                    <div className="pg-quick-chips">
                                        {quickTests.map((t) => (
                                            <button
                                                key={t.pw}
                                                className={`pg-chip ${passwordToCrack === t.pw ? 'active' : ''}`}
                                                onClick={() => { setPasswordToCrack(t.pw); }}
                                            >
                                                🔑 {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pg-target-divider">
                                    <span>or enter your own</span>
                                </div>

                                <div className="input-group">
                                    <label>Password to Test</label>
                                    <div className="pg-hash-input-row">
                                        <input value={passwordToCrack}
                                            onChange={(e) => setPasswordToCrack(e.target.value)}
                                            placeholder={`Type a short password (max ${maxLength} chars)`}
                                            maxLength={maxLength}
                                        />
                                        <button className="btn btn-secondary" onClick={generateTestHash}
                                            disabled={!passwordToCrack.trim()}>
                                            # Hash It
                                        </button>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Hash to Crack</label>
                                    <input value={hashToCrack}
                                        onChange={(e) => setHashToCrack(e.target.value)}
                                        placeholder="Enter or generate a hash above..."
                                        className="font-mono pg-hash-display-input"
                                    />
                                </div>

                                <div className="pg-target-actions">
                                    <button className="btn btn-secondary" onClick={() => setPhase(0)}>
                                        ← Back to Config
                                    </button>
                                    <button className="btn btn-danger btn-lg" onClick={crackHash}
                                        disabled={!hashToCrack.trim()}>
                                        💥 Crack It!
                                    </button>
                                </div>
                            </div>

                            {tableInfo && (
                                <div className="pg-table-preview">
                                    <div className="card">
                                        <div className="card-header">
                                            <span className="icon">📊</span>
                                            <h3>Table Preview</h3>
                                        </div>
                                        <div className="pg-table-stats-row">
                                            <div className="pg-table-mini-stat">
                                                <span className="text-cyan font-mono">{tableInfo.generation_time}s</span>
                                                <span className="text-muted text-xs">Build Time</span>
                                            </div>
                                            <div className="pg-table-mini-stat">
                                                <span className="text-green font-mono">{tableInfo.estimated_coverage}%</span>
                                                <span className="text-muted text-xs">Coverage</span>
                                            </div>
                                            <div className="pg-table-mini-stat">
                                                <span className="font-mono">{tableInfo.table_size}</span>
                                                <span className="text-muted text-xs">Chains</span>
                                            </div>
                                        </div>
                                        <div className="pg-chain-sample">
                                            <div className="pg-chain-sample-header">
                                                <span>Start</span>
                                                <span>→</span>
                                                <span>End</span>
                                            </div>
                                            {tableInfo.table?.slice(0, 8).map((row, i) => (
                                                <div key={i} className="pg-chain-sample-row">
                                                    <code className="text-purple">{row.start}</code>
                                                    <span className="pg-chain-arrow">⟶</span>
                                                    <code className="text-green">{row.end}</code>
                                                </div>
                                            ))}
                                            {tableInfo.table_size > 8 && (
                                                <div className="pg-chain-sample-more">
                                                    ...and {(tableInfo.table_size - 8).toLocaleString()} more chains
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {phase === 2 && (
                    <motion.div key="crack" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        {cracking && (
                            <div className="pg-cracking-terminal">
                                <div className="pg-term-header">
                                    <div className="pg-term-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                    <span className="pg-term-title">RainbowLab Cracker</span>
                                    <span className="pg-term-elapsed">{elapsed}s</span>
                                </div>
                                <div className="pg-term-body">
                                    <div className="pg-term-line">
                                        <span className="pg-term-prompt">$</span>
                                        <span>rainbow-crack --hash {hashToCrack.substring(0, 24)}...</span>
                                    </div>
                                    <div className="pg-term-line">
                                        <span className="pg-term-prompt">$</span>
                                        <span>Algorithm: {hashType.toUpperCase()} | Chains: {chainCount} | Length: {chainLength}</span>
                                    </div>
                                    <div className="pg-term-line active">
                                        <span className="pg-term-prompt">&gt;</span>
                                        <span className="pg-term-blink">{crackingPhase}</span>
                                    </div>
                                    <div className="pg-term-scanner">
                                        <div className="pg-term-scanner-line"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {crackResult && (
                                <motion.div
                                    className={`pg-result-card ${crackResult.found ? 'found' : 'notfound'}`}
                                    initial={{ opacity: 0, y: 30, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                                >
                                    {crackResult.found ? (
                                        <>
                                            <div className="pg-result-badge found">
                                                <span>🔓</span> PASSWORD CRACKED
                                            </div>
                                            <div className="pg-result-password">
                                                {crackResult.password.split('').map((c, i) => (
                                                    <motion.span
                                                        key={i}
                                                        className="pg-result-char"
                                                        initial={{ opacity: 0, y: 20, rotateX: 90 }}
                                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                                        transition={{ delay: i * 0.1, duration: 0.4 }}
                                                    >
                                                        {c}
                                                    </motion.span>
                                                ))}
                                            </div>
                                            <div className="pg-result-hash font-mono">{hashToCrack}</div>

                                            <div className="pg-result-stats">
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val text-cyan">{crackResult.total_time}s</div>
                                                    <div className="pg-result-stat-lbl">Total Time</div>
                                                </div>
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val text-purple">{crackResult.lookup_time}s</div>
                                                    <div className="pg-result-stat-lbl">Lookup Time</div>
                                                </div>
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val text-yellow">{crackResult.chains_searched?.toLocaleString()}</div>
                                                    <div className="pg-result-stat-lbl">Chains Searched</div>
                                                </div>
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val text-green">#{crackResult.chain_index}</div>
                                                    <div className="pg-result-stat-lbl">Chain Found In</div>
                                                </div>
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val text-orange">{crackResult.step_in_chain}</div>
                                                    <div className="pg-result-stat-lbl">Step in Chain</div>
                                                </div>
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val">{crackResult.total_chains}</div>
                                                    <div className="pg-result-stat-lbl">Total Chains</div>
                                                </div>
                                            </div>

                                            <div className="pg-result-insight">
                                                <span>💡</span>
                                                <p>
                                                    This password was found at <strong>step {crackResult.step_in_chain}</strong> of <strong>chain #{crackResult.chain_index}</strong>.
                                                    The lookup scanned {crackResult.chains_searched?.toLocaleString()} chain endpoints before finding a match,
                                                    then regenerated the matching chain to recover the password.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="pg-result-badge notfound">
                                                <span>🔒</span> NOT FOUND
                                            </div>
                                            <p className="pg-result-miss-text">
                                                The hash wasn't covered by this rainbow table.
                                            </p>
                                            <div className="pg-result-stats">
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val text-cyan">{crackResult.total_time}s</div>
                                                    <div className="pg-result-stat-lbl">Total Time</div>
                                                </div>
                                                <div className="pg-result-stat">
                                                    <div className="pg-result-stat-val text-yellow">{crackResult.chains_searched?.toLocaleString()}</div>
                                                    <div className="pg-result-stat-lbl">Chains Searched</div>
                                                </div>
                                            </div>
                                            <div className="pg-result-tips">
                                                <h4>How to improve success rate:</h4>
                                                <div className="pg-tip">↑ Increase <strong>Chain Count</strong> — more chains = more starting points</div>
                                                <div className="pg-tip">↑ Increase <strong>Chain Length</strong> — each chain covers more passwords</div>
                                                <div className="pg-tip">↓ Decrease <strong>Password Length</strong> — smaller keyspace = easier to cover</div>
                                            </div>
                                        </>
                                    )}

                                    <div className="pg-result-actions mt-4">
                                        <button className="btn btn-secondary" onClick={() => setPhase(1)}>
                                            🎯 Try Another Hash
                                        </button>
                                        <button className="btn btn-primary" onClick={resetAll}>
                                            🔄 Start Over
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="error-banner mt-4">
                    <span>⚠️</span> {error}
                </div>
            )}
        </div>
    );
}

export default Playground;
