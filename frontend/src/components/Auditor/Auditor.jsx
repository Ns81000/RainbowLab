import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import './Auditor.css';

const SEVERITY_META = {
    CRITICAL: { color: 'var(--accent-red)', bg: 'rgba(248,113,113,0.1)', icon: '🔴', label: 'Critical' },
    HIGH: { color: 'var(--accent-orange)', bg: 'rgba(251,146,60,0.1)', icon: '🟠', label: 'High' },
    MEDIUM: { color: 'var(--accent-yellow)', bg: 'rgba(251,191,36,0.1)', icon: '🟡', label: 'Medium' },
    LOW: { color: 'var(--accent-green)', bg: 'rgba(52,211,153,0.1)', icon: '🟢', label: 'Low' },
};

const CODE_EXAMPLES = {
    php_bad: { label: 'PHP (insecure)', lang: 'php', code: `<?php\n$hashed = md5($password);\n// Store $hashed in database\n$verified = ($hashed === md5($input));` },
    python_bad: { label: 'Python (insecure)', lang: 'python', code: `import hashlib\nhashed = hashlib.md5(password.encode()).hexdigest()\n# Store hashed in database\ndb.save_user(username, hashed)` },
    js_bad: { label: 'Node.js (insecure)', lang: 'javascript', code: `const crypto = require('crypto');\nconst hash = crypto.createHash('md5').update(password).digest('hex');\n// Compare directly\nif (hash === storedHash) { return true; }` },
    python_good: { label: 'Python (secure ✅)', lang: 'python', code: `from argon2 import PasswordHasher\nph = PasswordHasher()\nhashed = ph.hash(password)\nverified = ph.verify(hashed, input_password)` },
    java_bad: { label: 'Java (insecure)', lang: 'java', code: `import java.security.MessageDigest;\nMessageDigest md = MessageDigest.getInstance("MD5");\nbyte[] hash = md.digest(password.getBytes());` },
};

const EXAMPLE_HASHES = `5d41402abc4b2a76b9719d911017c592
d8578edf8458ce06fbc5bb76a58c5ca4
$2b$12$LJ3m4ys3LgWYo1234567890abcdefghijklmnop
$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHQ$hash`;

function ScoreGauge({ score }) {
    const radius = 48;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    const color = score >= 80 ? 'var(--accent-green)' : score >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)';

    return (
        <div className="aud-gauge">
            <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                <circle
                    cx="60" cy="60" r={radius} fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
                />
            </svg>
            <div className="aud-gauge-inner">
                <span className="aud-gauge-val" style={{ color }}>{score}</span>
                <span className="aud-gauge-lbl">/ 100</span>
            </div>
        </div>
    );
}

function CodePreview({ code, vulnerableLines }) {
    const lines = code.split('\n');
    const vulnSet = new Set(vulnerableLines || []);

    return (
        <div className="aud-code-preview">
            {lines.map((line, i) => {
                const lineNum = i + 1;
                const isVuln = vulnSet.has(lineNum);
                return (
                    <div key={i} className={`aud-code-line ${isVuln ? 'vulnerable' : ''}`}>
                        <span className="aud-line-num">{lineNum}</span>
                        <span className="aud-line-content">{line || ' '}</span>
                        {isVuln && <span className="aud-line-flag">⚠️</span>}
                    </div>
                );
            })}
        </div>
    );
}

function SeverityBar({ counts }) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    return (
        <div className="aud-severity-bar">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
                const count = counts[sev] || 0;
                if (count === 0) return null;
                const pct = (count / total) * 100;
                const meta = SEVERITY_META[sev];
                return (
                    <motion.div
                        key={sev}
                        className="aud-severity-segment"
                        style={{ width: `${pct}%`, background: meta.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        title={`${count} ${meta.label}`}
                    />
                );
            })}
        </div>
    );
}

function Auditor() {
    const [mode, setMode] = useState('code');
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('');
    const [hashes, setHashes] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedFinding, setExpandedFinding] = useState(null);

    const auditCode = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setError(null);
        setResults(null);
        setExpandedFinding(null);
        try {
            const data = await api.auditCode(code, language || undefined);
            setResults({ type: 'code', data });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const auditHashes = async () => {
        if (!hashes.trim()) return;
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const data = await api.auditHashes(hashes);
            setResults({ type: 'hashes', data });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadExample = (key) => {
        const ex = CODE_EXAMPLES[key];
        setCode(ex.code);
        setLanguage(ex.lang);
        setMode('code');
        setResults(null);
    };

    const riskColor = (risk) => {
        if (risk?.includes('CRITICAL')) return 'var(--accent-red)';
        if (risk?.includes('HIGH')) return 'var(--accent-orange)';
        if (risk?.includes('MODERATE') || risk?.includes('NEEDS')) return 'var(--accent-yellow)';
        return 'var(--accent-green)';
    };

    const hashRiskClass = (risk) => {
        if (risk === 'CRITICAL') return 'critical';
        if (risk === 'HIGH' || risk === 'MODERATE') return 'warning';
        if (risk === 'LOW' || risk === 'SAFE') return 'safe';
        return 'info';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <span className="page-header-icon">🔐</span>
                <h2>Password Security Auditor</h2>
                <p>Audit your hashing code or hash lists — get a security score, line-by-line analysis, and actionable fixes.</p>
            </div>

            <div className="aud-mode-tabs">
                <button className={`aud-tab ${mode === 'code' ? 'active' : ''}`}
                    onClick={() => { setMode('code'); setResults(null); }}>
                    <span>📝</span> Code Audit
                </button>
                <button className={`aud-tab ${mode === 'hashes' ? 'active' : ''}`}
                    onClick={() => { setMode('hashes'); setResults(null); }}>
                    <span>#️⃣</span> Hash List Audit
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'code' && (
                    <motion.div key="code" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                        <div className="card mb-4">
                            <div className="card-header">
                                <span className="icon">📝</span>
                                <h3>Paste Your Hashing Code</h3>
                            </div>

                            <div className="aud-examples-wrap">
                                <span className="text-muted text-sm">Quick examples:</span>
                                <div className="aud-example-chips">
                                    {Object.entries(CODE_EXAMPLES).map(([key, ex]) => (
                                        <button key={key}
                                            className={`aud-chip ${code === ex.code ? 'active' : ''}`}
                                            onClick={() => loadExample(key)}>
                                            {ex.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="aud-editor-row">
                                <div className="aud-editor-main">
                                    <div className="input-group">
                                        <label>Code Snippet</label>
                                        <textarea
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="Paste your password hashing code here..."
                                            className="font-mono aud-textarea"
                                            rows="10"
                                            spellCheck="false"
                                        />
                                    </div>
                                </div>
                                <div className="aud-editor-sidebar">
                                    <div className="input-group">
                                        <label>Language</label>
                                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                            <option value="">Auto-detect</option>
                                            <option value="php">PHP</option>
                                            <option value="python">Python</option>
                                            <option value="javascript">JavaScript</option>
                                            <option value="java">Java</option>
                                            <option value="ruby">Ruby</option>
                                        </select>
                                    </div>
                                    <div className="aud-info-box">
                                        <h4>What we check</h4>
                                        <ul>
                                            <li>Weak hash functions (MD5, SHA-1)</li>
                                            <li>Fast hash misuse (SHA-256)</li>
                                            <li>Missing salt / pepper</li>
                                            <li>Hardcoded passwords</li>
                                            <li>Plaintext comparisons</li>
                                            <li>Low PBKDF2 iterations</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button className="btn btn-primary w-full mt-4" onClick={auditCode}
                                disabled={loading || !code.trim()}>
                                {loading ? <><div className="loading-spinner"></div> Scanning...</> : '🔍 Run Security Audit'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {mode === 'hashes' && (
                    <motion.div key="hashes" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                        <div className="card mb-4">
                            <div className="card-header">
                                <span className="icon">#️⃣</span>
                                <h3>Paste Hash List</h3>
                            </div>

                            <div className="aud-hash-layout">
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>Hashes (one per line)</label>
                                    <textarea
                                        value={hashes}
                                        onChange={(e) => setHashes(e.target.value)}
                                        placeholder={EXAMPLE_HASHES}
                                        className="font-mono aud-textarea"
                                        rows="8"
                                        spellCheck="false"
                                    />
                                </div>
                                <div className="aud-hash-tips">
                                    <h4>Supported Formats</h4>
                                    <div className="aud-format-list">
                                        <div className="aud-format"><span className="text-red">●</span> MD5 (32 hex)</div>
                                        <div className="aud-format"><span className="text-red">●</span> SHA-1 (40 hex)</div>
                                        <div className="aud-format"><span className="text-orange">●</span> SHA-256 (64 hex)</div>
                                        <div className="aud-format"><span className="text-yellow">●</span> SHA-512 (128 hex)</div>
                                        <div className="aud-format"><span className="text-green">●</span> bcrypt ($2b$...)</div>
                                        <div className="aud-format"><span className="text-green">●</span> Argon2 ($argon2...)</div>
                                        <div className="aud-format"><span className="text-yellow">●</span> PBKDF2</div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm w-full mt-4"
                                        onClick={() => setHashes(EXAMPLE_HASHES)}>
                                        Load Example Hashes
                                    </button>
                                </div>
                            </div>

                            <button className="btn btn-primary w-full mt-4" onClick={auditHashes}
                                disabled={loading || !hashes.trim()}>
                                {loading ? <><div className="loading-spinner"></div> Analyzing...</> : '🔍 Audit Hashes'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <div className="error-banner"><span>⚠️</span> {error}</div>}

            <AnimatePresence>
                {results?.type === 'code' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="aud-dashboard">
                            <div className="aud-score-card">
                                <ScoreGauge score={results.data.security_score} />
                                <div className="aud-score-label">Security Score</div>
                                <div className="aud-risk-tag" style={{ color: riskColor(results.data.overall_risk), borderColor: riskColor(results.data.overall_risk) }}>
                                    {results.data.overall_risk}
                                </div>
                            </div>

                            <div className="aud-dashboard-stats">
                                <div className="aud-dash-stat">
                                    <span className="aud-dash-val">{results.data.detected_language}</span>
                                    <span className="aud-dash-lbl">Language</span>
                                </div>
                                <div className="aud-dash-stat">
                                    <span className="aud-dash-val">{results.data.total_lines}</span>
                                    <span className="aud-dash-lbl">Lines Scanned</span>
                                </div>
                                <div className="aud-dash-stat">
                                    <span className="aud-dash-val" style={{ color: results.data.findings_count > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                        {results.data.findings_count}
                                    </span>
                                    <span className="aud-dash-lbl">Issues Found</span>
                                </div>
                                <div className="aud-dash-stat">
                                    <span className={`aud-dash-val ${results.data.has_salt ? 'text-green' : 'text-red'}`}>
                                        {results.data.has_salt ? '✅' : '❌'}
                                    </span>
                                    <span className="aud-dash-lbl">Salt</span>
                                </div>
                                <div className="aud-dash-stat">
                                    <span className={`aud-dash-val ${results.data.has_pepper ? 'text-green' : 'text-yellow'}`}>
                                        {results.data.has_pepper ? '✅' : '⚡'}
                                    </span>
                                    <span className="aud-dash-lbl">Pepper</span>
                                </div>
                            </div>

                            {results.data.severity_counts && (
                                <div className="aud-severity-section">
                                    <SeverityBar counts={results.data.severity_counts} />
                                    <div className="aud-severity-chips">
                                        {Object.entries(results.data.severity_counts).map(([sev, count]) => {
                                            if (count === 0) return null;
                                            const meta = SEVERITY_META[sev];
                                            return (
                                                <span key={sev} className="aud-sev-chip" style={{ background: meta.bg, color: meta.color }}>
                                                    {meta.icon} {count} {meta.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {results.data.vulnerable_lines?.length > 0 && (
                            <div className="card mb-4">
                                <div className="card-header">
                                    <span className="icon">📄</span>
                                    <h3>Your Code — Vulnerability Highlights</h3>
                                </div>
                                <CodePreview code={code} vulnerableLines={results.data.vulnerable_lines} />
                            </div>
                        )}

                        <div className="aud-findings-list">
                            {results.data.findings.map((finding, i) => {
                                const meta = SEVERITY_META[finding.severity] || SEVERITY_META.MEDIUM;
                                const isExpanded = expandedFinding === i;

                                return (
                                    <motion.div
                                        key={i}
                                        className={`aud-finding ${isExpanded ? 'expanded' : ''}`}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        style={{ '--finding-color': meta.color }}
                                    >
                                        <div className="aud-finding-bar" style={{ background: meta.color }}></div>
                                        <div className="aud-finding-body" onClick={() => setExpandedFinding(isExpanded ? null : i)}>
                                            <div className="aud-finding-top">
                                                <span className="aud-finding-icon">{meta.icon}</span>
                                                <span className="aud-finding-sev" style={{ color: meta.color }}>{finding.severity}</span>
                                                <h4 className="aud-finding-title">{finding.title}</h4>
                                                {finding.lines?.length > 0 && (
                                                    <span className="aud-finding-lines">
                                                        Line{finding.lines.length > 1 ? 's' : ''} {finding.lines.join(', ')}
                                                    </span>
                                                )}
                                                <span className="aud-finding-toggle">{isExpanded ? '▲' : '▼'}</span>
                                            </div>
                                            <p className="aud-finding-desc">{finding.description}</p>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        className="aud-finding-details"
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {finding.code_snippets?.length > 0 && (
                                                            <div className="aud-finding-snippets">
                                                                <span className="aud-snippet-label">⚠️ Vulnerable Code</span>
                                                                {finding.code_snippets.map((s, j) => (
                                                                    <div key={j} className="aud-snippet">
                                                                        <span className="aud-snippet-ln">{s.line_number}</span>
                                                                        <code>{s.code}</code>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {finding.fix && (
                                                            <div className="aud-finding-fix">
                                                                <span className="aud-fix-label">✅ Recommended Fix</span>
                                                                <pre className="code-block">{finding.fix}</pre>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {results.data.findings_count === 0 && (
                            <motion.div className="aud-all-clear" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <span>🛡️</span>
                                <h3>All Clear!</h3>
                                <p>No password hashing vulnerabilities detected in your code.</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {results?.type === 'hashes' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="aud-hash-overview">
                            <div className="aud-hash-risk-badge" style={{ borderColor: riskColor(results.data.overall_risk) }}>
                                <span className="aud-hash-risk-label">Overall</span>
                                <span style={{ color: riskColor(results.data.overall_risk), fontSize: '1.1rem', fontWeight: 800 }}>
                                    {results.data.overall_risk}
                                </span>
                            </div>
                            <div className="aud-hash-stats">
                                <div><strong>{results.data.total_hashes}</strong> <span className="text-muted">analyzed</span></div>
                                <div><strong className="text-red">{results.data.critical_count}</strong> <span className="text-muted">critical</span></div>
                                <div><strong className="text-green">{results.data.safe_count}</strong> <span className="text-muted">secure</span></div>
                            </div>
                        </div>

                        <div className="aud-hash-cards">
                            {results.data.results.map((r, i) => (
                                <motion.div
                                    key={i}
                                    className={`aud-hash-card risk-${hashRiskClass(r.risk)}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="aud-hash-card-top">
                                        <code className="aud-hash-val">{r.hash}</code>
                                        <span className={`badge badge-${hashRiskClass(r.risk)}`}>{r.risk}</span>
                                    </div>
                                    <div className="aud-hash-card-meta">
                                        <div><span className="text-muted">Format:</span> <strong>{r.format}</strong></div>
                                        <div>
                                            <span className="text-muted">Salt:</span>
                                            <strong className={r.has_salt ? 'text-green' : 'text-red'}>
                                                {r.has_salt ? ' Yes ✅' : r.has_salt === false ? ' No ❌' : ' Unknown'}
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-muted">Rainbow Vuln:</span>
                                            <strong className={r.rainbow_vulnerable ? 'text-red' : 'text-green'}>
                                                {r.rainbow_vulnerable ? ' Yes ⚠️' : r.rainbow_vulnerable === false ? ' No ✅' : ' ?'}
                                            </strong>
                                        </div>
                                        {r.time_to_crack && (
                                            <div><span className="text-muted">Crack time:</span> <strong>{r.time_to_crack}</strong></div>
                                        )}
                                    </div>
                                    <p className="aud-hash-note">{r.note}</p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="aud-hash-recommendation">
                            <span>💡</span>
                            <p>{results.data.recommendation}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!results && !loading && (
                <div className="empty-state">
                    <div className="empty-state-icon">🔐</div>
                    <div className="empty-state-text">
                        {mode === 'code' ? 'Paste your password hashing code to audit' : 'Paste a list of hashes to analyze'}
                    </div>
                    <div className="empty-state-subtext">
                        Supports PHP, Python, Node.js, Java, and Ruby
                    </div>
                </div>
            )}
        </div>
    );
}

export default Auditor;
