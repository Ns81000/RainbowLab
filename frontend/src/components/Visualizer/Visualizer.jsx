import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import './Visualizer.css';

const RAINBOW_COLORS = [
    '#f87171', '#fb923c', '#fbbf24', '#34d399',
    '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
];

const NARRATION = {
    start: (step) => ({
        title: 'Chain Start Point',
        body: `Every chain begins with a plaintext password. In a real rainbow table, thousands of chains start with different random passwords — but each chain only stores this starting point and its final endpoint.`,
        highlight: `Starting password: "${step.password}"`,
    }),
    hash: (step, index) => ({
        title: `Hash Function Applied`,
        body: `The current password is fed into the ${step.hash_type?.toUpperCase() || 'hash'} function. This is a one-way transformation — you CANNOT reverse it to get the password back. This is the same function used when websites store your password.`,
        highlight: `Password → ${step.hash?.substring(0, 24)}...`,
    }),
    reduce: (step) => ({
        title: `Reduction Function R${step.reduction_index}`,
        body: `This is the clever trick. A reduction function converts a hash back into a valid password candidate. Each step uses a DIFFERENT reduction function (shown in different colors) — this prevents chains from merging and is why it's called a "rainbow" table.`,
        highlight: `Hash → "${step.password}"`,
    }),
};

function getNarration(steps, index) {
    const step = steps[index];
    const prev = index > 0 ? steps[index - 1] : null;
    const base = NARRATION[step.type]?.(step, index);
    if (!base) return null;

    if (step.type === 'hash' && prev?.password) {
        base.highlight = `"${prev.password}" → ${step.hash?.substring(0, 24)}...`;
    } else if (step.type === 'reduce' && prev?.hash) {
        base.highlight = `${prev.hash.substring(0, 16)}... → "${step.password}"`;
    }
    return base;
}

function Visualizer() {
    const [startPassword, setStartPassword] = useState('cat');
    const [chainLength, setChainLength] = useState(5);
    const [hashType, setHashType] = useState('md5');
    const [chain, setChain] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1200);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showStorageHint, setShowStorageHint] = useState(false);
    const intervalRef = useRef(null);
    const scrollRef = useRef(null);

    const generateChain = async () => {
        setLoading(true);
        setError(null);
        setIsPlaying(false);
        setCurrentStep(0);
        setShowStorageHint(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        try {
            const data = await api.visualizeChain({
                start_password: startPassword,
                hash_type: hashType,
                chain_length: chainLength,
                charset: 'lowercase',
                max_length: 4,
            });
            setChain(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isPlaying || !chain) return;

        intervalRef.current = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev >= chain.steps.length - 1) {
                    setIsPlaying(false);
                    setShowStorageHint(true);
                    clearInterval(intervalRef.current);
                    return prev;
                }
                return prev + 1;
            });
        }, speed);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, speed, chain]);

    useEffect(() => {
        if (chain && scrollRef.current) {
            const activeNode = scrollRef.current.querySelector('.viz-node.is-active');
            if (activeNode) {
                activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentStep]);

    const stepForward = () => {
        if (chain && currentStep < chain.steps.length - 1) {
            setCurrentStep((p) => p + 1);
        }
    };

    const stepBackward = () => {
        if (currentStep > 0) setCurrentStep((p) => p - 1);
    };

    const reset = () => {
        setCurrentStep(0);
        setIsPlaying(false);
        setShowStorageHint(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const currentNarration = useMemo(() => {
        if (!chain || !chain.steps[currentStep]) return null;
        return getNarration(chain.steps, currentStep);
    }, [chain, currentStep]);

    const getNodeColor = (step) => {
        if (step.type === 'start') return 'var(--accent-purple)';
        if (step.type === 'hash') return 'var(--accent-cyan)';
        return RAINBOW_COLORS[step.reduction_index % RAINBOW_COLORS.length];
    };

    const progressPct = chain ? ((currentStep + 1) / chain.steps.length) * 100 : 0;
    const isComplete = chain && currentStep >= chain.steps.length - 1;

    return (
        <div className="page-container">
            <div className="page-header">
                <span className="page-header-icon">🔗</span>
                <h2>Rainbow Table Visualizer</h2>
                <p>Watch how rainbow table chains are built — step by step. Understand the brilliant (and dangerous) space-time tradeoff.</p>
            </div>

            <div className="card mb-4">
                <div className="card-header">
                    <span className="icon">⚙️</span>
                    <h3>Chain Configuration</h3>
                </div>
                <div className="viz-config">
                    <div className="input-group">
                        <label>Starting Password</label>
                        <input
                            value={startPassword}
                            onChange={(e) => setStartPassword(e.target.value)}
                            placeholder='e.g., "cat", "hello", "test"'
                            maxLength={6}
                        />
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
                        <label>
                            Chain Length: <strong>{chainLength}</strong>
                            <span className="text-muted text-xs"> ({chainLength * 2 + 1} steps)</span>
                        </label>
                        <input
                            type="range"
                            min="3"
                            max="12"
                            value={chainLength}
                            onChange={(e) => setChainLength(Number(e.target.value))}
                        />
                    </div>
                    <div className="input-group">
                        <label>
                            Animation Speed: <strong>{speed < 500 ? 'Fast' : speed < 1000 ? 'Normal' : 'Slow'}</strong>
                        </label>
                        <input
                            type="range"
                            min="200"
                            max="2000"
                            step="100"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                        />
                    </div>
                </div>
                <button className="btn btn-primary btn-lg w-full mt-4" onClick={generateChain} disabled={loading}>
                    {loading ? (
                        <><div className="loading-spinner"></div> Generating...</>
                    ) : '🔗 Generate & Visualize Chain'}
                </button>
            </div>

            {error && (
                <div className="error-banner"><span>⚠️</span> {error}</div>
            )}

            <AnimatePresence>
                {chain && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="viz-workspace"
                    >
                        <div className="viz-toolbar">
                            <div className="viz-controls-row">
                                <button className="viz-ctrl-btn" onClick={reset} title="Reset">
                                    <span>⟲</span>
                                </button>
                                <button className="viz-ctrl-btn" onClick={stepBackward} disabled={currentStep === 0} title="Previous step">
                                    <span>◀</span>
                                </button>
                                <button
                                    className={`viz-ctrl-btn viz-play-btn ${isPlaying ? 'playing' : ''}`}
                                    onClick={() => {
                                        if (isComplete) { reset(); setTimeout(() => setIsPlaying(true), 50); }
                                        else setIsPlaying(!isPlaying);
                                    }}
                                    title={isPlaying ? 'Pause' : 'Play'}
                                >
                                    <span>{isPlaying ? '⏸' : isComplete ? '⟲' : '▶'}</span>
                                </button>
                                <button className="viz-ctrl-btn" onClick={stepForward} disabled={isComplete} title="Next step">
                                    <span>▶</span>
                                </button>
                            </div>
                            <div className="viz-progress-wrap">
                                <div className="viz-progress-track">
                                    <motion.div
                                        className="viz-progress-fill"
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <span className="viz-step-label">
                                    Step {currentStep + 1} / {chain.steps.length}
                                </span>
                            </div>
                        </div>

                        <div className="viz-main-layout">
                            <div className="viz-chain-panel" ref={scrollRef}>
                                <div className="viz-chain-track">
                                    {chain.steps.map((step, i) => {
                                        const isActive = i === currentStep;
                                        const isVisible = i <= currentStep;
                                        const isStored = (i === 0 || i === chain.steps.length - 1);
                                        const color = getNodeColor(step);

                                        return (
                                            <div key={i} className="viz-node-group">
                                                {i > 0 && (
                                                    <div className={`viz-pipe ${isVisible ? 'visible' : ''}`}>
                                                        <div className="viz-pipe-line" style={{ borderColor: isVisible ? color : undefined }}></div>
                                                        <motion.div
                                                            className="viz-pipe-label"
                                                            style={{ color: isVisible ? color : undefined }}
                                                            animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                                            transition={{ duration: 0.5 }}
                                                        >
                                                            {step.type === 'hash' ? 'H( )' : `R${step.reduction_index}`}
                                                        </motion.div>
                                                        {isActive && (
                                                            <motion.div
                                                                className="viz-pipe-particle"
                                                                style={{ background: color }}
                                                                initial={{ top: 0, opacity: 1 }}
                                                                animate={{ top: '100%', opacity: 0 }}
                                                                transition={{ duration: speed / 1000 * 0.6, ease: 'easeIn' }}
                                                            />
                                                        )}
                                                    </div>
                                                )}

                                                <motion.div
                                                    className={`viz-node ${step.type} ${isActive ? 'is-active' : ''} ${isVisible ? 'is-visible' : ''} ${isStored && showStorageHint ? 'is-stored' : ''}`}
                                                    style={{
                                                        '--node-color': color,
                                                        borderColor: isActive ? color : undefined,
                                                    }}
                                                    animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                                                    transition={{ duration: 0.4 }}
                                                    onClick={() => { if (isVisible) setCurrentStep(i); }}
                                                >
                                                    {isStored && showStorageHint && (
                                                        <div className="viz-stored-badge">💾 STORED</div>
                                                    )}
                                                    <div className="viz-node-header">
                                                        <span className="viz-node-icon">
                                                            {step.type === 'start' ? '🔑' : step.type === 'hash' ? '🔒' : '🌈'}
                                                        </span>
                                                        <span className="viz-node-type" style={{ color }}>
                                                            {step.type === 'start' ? 'Password (Start)' :
                                                                step.type === 'hash' ? 'Hash Output' :
                                                                    `Reduction R${step.reduction_index}`}
                                                        </span>
                                                        <span className="viz-node-step">#{i + 1}</span>
                                                    </div>
                                                    <div className={`viz-node-value ${step.type === 'hash' ? 'hash-val' : 'pass-val'}`}>
                                                        {step.password || (step.hash ? step.hash : '')}
                                                    </div>
                                                    {step.type === 'reduce' && (
                                                        <div className="viz-node-detail" style={{ color }}>
                                                            Color = unique function preventing chain merges
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </div>
                                        );
                                    })}

                                    {!showStorageHint && !isComplete && chain.steps.length > 0 && (
                                        <div className="viz-chain-fade-hint">
                                            Keep stepping to see the full chain →
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="viz-side-panel">
                                <AnimatePresence mode="wait">
                                    {currentNarration && (
                                        <motion.div
                                            key={currentStep}
                                            className="viz-narration"
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -12 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="viz-narration-step">
                                                Step {currentStep + 1}
                                            </div>
                                            <h4 className="viz-narration-title">
                                                {currentNarration.title}
                                            </h4>
                                            <p className="viz-narration-body">
                                                {currentNarration.body}
                                            </p>
                                            <div className="viz-narration-highlight">
                                                <code>{currentNarration.highlight}</code>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="viz-legend">
                                    <h4>Legend</h4>
                                    <div className="viz-legend-item">
                                        <span className="viz-legend-dot" style={{ background: 'var(--accent-purple)' }}></span>
                                        <span>🔑 Plaintext Password</span>
                                    </div>
                                    <div className="viz-legend-item">
                                        <span className="viz-legend-dot" style={{ background: 'var(--accent-cyan)' }}></span>
                                        <span>🔒 Hash (one-way)</span>
                                    </div>
                                    <div className="viz-legend-item">
                                        <span className="viz-legend-dot" style={{ background: RAINBOW_COLORS[0] }}></span>
                                        <span className="viz-legend-dot" style={{ background: RAINBOW_COLORS[1] }}></span>
                                        <span className="viz-legend-dot" style={{ background: RAINBOW_COLORS[2] }}></span>
                                        <span>🌈 Reduction Functions</span>
                                    </div>
                                </div>

                                <div className="viz-chain-summary">
                                    <h4>Chain Info</h4>
                                    <div className="viz-summary-row">
                                        <span>Start</span>
                                        <code className="text-purple">{chain.start}</code>
                                    </div>
                                    <div className="viz-summary-row">
                                        <span>End</span>
                                        <code className="text-green">{chain.end}</code>
                                    </div>
                                    <div className="viz-summary-row">
                                        <span>Length</span>
                                        <code>{chain.chain_length}</code>
                                    </div>
                                    <div className="viz-summary-row">
                                        <span>Algorithm</span>
                                        <code>{hashType.toUpperCase()}</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showStorageHint && (
                                <motion.div
                                    className="viz-storage-reveal"
                                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="viz-storage-header">
                                        <span>💡</span>
                                        <h3>The Key Insight: Only Store Start & End</h3>
                                    </div>
                                    <div className="viz-storage-body">
                                        <div className="viz-storage-equation">
                                            <div className="viz-store-box stored">
                                                <span className="viz-store-label">Stored</span>
                                                <code>{chain.start}</code>
                                            </div>
                                            <div className="viz-store-middle">
                                                <div className="viz-store-dots">
                                                    {Array.from({ length: Math.min(chain.chain_length, 8) }).map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className="viz-store-dot"
                                                            style={{
                                                                background: RAINBOW_COLORS[i % RAINBOW_COLORS.length],
                                                                animationDelay: `${i * 0.1}s`,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="viz-store-arrow-label">
                                                    {chain.chain_length * 2} steps (discarded — regenerated on lookup)
                                                </span>
                                            </div>
                                            <div className="viz-store-box stored">
                                                <span className="viz-store-label">Stored</span>
                                                <code>{chain.end}</code>
                                            </div>
                                        </div>
                                        <p className="viz-storage-explanation">
                                            A rainbow table with <strong>10 million</strong> chains of length <strong>10,000</strong> covers
                                            <strong> 100 billion</strong> password-hash pairs — but only stores <strong>20 million</strong> values.
                                            That's the space-time tradeoff that makes rainbow tables so powerful... and so dangerous.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="viz-how-it-works mt-4">
                            <div className="card">
                                <div className="card-header">
                                    <span className="icon">🧠</span>
                                    <h3>How Rainbow Tables Actually Work</h3>
                                </div>
                                <div className="viz-explainer-grid">
                                    <div className="viz-explainer-card">
                                        <div className="viz-explainer-num">1</div>
                                        <h4>Build Chains</h4>
                                        <p>Start with a password, hash it, reduce it to a new password, repeat.
                                            Each chain covers thousands of password-hash pairs.</p>
                                    </div>
                                    <div className="viz-explainer-card">
                                        <div className="viz-explainer-num">2</div>
                                        <h4>Store Only Endpoints</h4>
                                        <p>Only the first and last passwords in each chain are saved.
                                            The middle steps can be re-computed when needed.</p>
                                    </div>
                                    <div className="viz-explainer-card">
                                        <div className="viz-explainer-num">3</div>
                                        <h4>Lookup a Hash</h4>
                                        <p>To crack a hash, apply reduction functions from each position.
                                            If you hit a stored endpoint, regenerate that chain to find the password.</p>
                                    </div>
                                    <div className="viz-explainer-card">
                                        <div className="viz-explainer-num">4</div>
                                        <h4>Why "Rainbow"?</h4>
                                        <p>Each column uses a DIFFERENT reduction function (shown in different colors).
                                            This prevents chains from merging — unlike older Hellman tables.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!chain && !loading && (
                <div className="empty-state">
                    <div className="empty-state-icon">🔗</div>
                    <div className="empty-state-text">Configure your chain and hit Generate</div>
                    <div className="empty-state-subtext">
                        The animation will build a real hash chain step-by-step with live narration
                    </div>
                </div>
            )}
        </div>
    );
}

export default Visualizer;
