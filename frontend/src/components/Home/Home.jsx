import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import './Home.css';

const MODULES = [
    {
        path: '/hash-analyzer',
        icon: '🔬',
        title: 'Hash Analyzer',
        tagline: 'What does my password look like as a hash?',
        description: 'Type any text and instantly see hashes across every algorithm — with security ratings, crack time estimates, and rainbow table vulnerability.',
        color: 'var(--accent-cyan)',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    },
    {
        path: '/visualizer',
        icon: '🎬',
        title: 'Rainbow Visualizer',
        tagline: 'How does the attack actually work?',
        description: 'Watch how rainbow tables are built and crack hashes — animated step by step. See chains, reduction functions, and lookups in real time.',
        color: 'var(--accent-purple)',
        gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    },
    {
        path: '/playground',
        icon: '🧪',
        title: 'Cracking Playground',
        tagline: 'Can I actually crack a hash myself?',
        description: 'Build a real rainbow table for a small password space and watch it crack hashes live. Hands-on learning in a safe sandbox.',
        color: 'var(--accent-green)',
        gradient: 'linear-gradient(135deg, #34d399, #059669)',
    },
    {
        path: '/salt-demo',
        icon: '🛡️',
        title: 'Salt & Defense',
        tagline: 'Why does salting fix everything?',
        description: 'See exactly WHY salting destroys rainbow tables. Side-by-side comparisons with real numbers that make the concept viscerally real.',
        color: 'var(--accent-yellow)',
        gradient: 'linear-gradient(135deg, #fbbf24, #d97706)',
    },
    {
        path: '/auditor',
        icon: '🔐',
        title: 'Code Auditor',
        tagline: 'Is MY code vulnerable?',
        description: 'Paste your password hashing code — get an instant security audit. Supports PHP, Python, Node.js, Java, and Ruby.',
        color: 'var(--accent-pink)',
        gradient: 'linear-gradient(135deg, #f472b6, #db2777)',
    },
    {
        path: '/battle-arena',
        icon: '📊',
        title: 'Battle Arena',
        tagline: 'How fast is too fast?',
        description: 'Head-to-head benchmark of every hashing algorithm on your machine. See why slowness IS security.',
        color: 'var(--accent-orange)',
        gradient: 'linear-gradient(135deg, #fb923c, #ea580c)',
    },
];

const DEEP_DIVES = [
    {
        id: 'hash-analyzer',
        icon: '🔬',
        number: '01',
        title: 'Hash Analyzer',
        color: '#06b6d4',
        question: 'What does my password look like as a hash?',
        intro: 'Imagine you have a magic one-way blender. You put in a word — say "hello" — and out comes a fixed-size string of random-looking characters. That\'s what a hash function does.',
        details: [
            { label: 'What you do', text: 'Type any text — a password, a sentence, even a single letter. Results appear instantly as you type, no button needed.' },
            { label: '8 algorithms at once', text: 'See your input hashed by MD5, SHA-1, SHA-256, SHA-512, SHA-3(256), SHA-3(512), BLAKE2b, and NTLM — all at the same time.' },
            { label: 'Security ratings', text: 'Each algorithm shows a colored badge: 🔴 BROKEN (MD5, SHA-1) means attackers can crack it in seconds. 🟢 SECURE means it\'s still safe.' },
            { label: 'Crack time', text: 'For every hash, you see how long it would take an attacker with a modern GPU to find your original password. "< 1 second" to "Effectively infinite".' },
            { label: 'Click to copy', text: 'Click on any hash to copy it to your clipboard. Use it in the Cracking Playground to test if it can be cracked.' },
        ],
        insight: 'Change just ONE letter in your password, and every single hash changes completely. This is called the "avalanche effect" — it\'s what makes hashes useful for security.',
        path: '/hash-analyzer',
    },
    {
        id: 'visualizer',
        icon: '🎬',
        number: '02',
        title: 'Rainbow Visualizer',
        color: '#a78bfa',
        question: 'How does the attack actually work?',
        intro: 'A rainbow table isn\'t just a giant list of password→hash pairs. That would take too much space. Instead, it\'s built from chains — clever sequences that compress millions of pairs into a small table.',
        details: [
            { label: 'Step-by-step chain', text: 'Click "Next" to walk through a chain one node at a time. Watch: password → hash → reduce → new password → hash → reduce... each step is animated and narrated.' },
            { label: 'Reduction functions', text: 'The secret sauce. A reduction function takes a hash and converts it back into a password-like string. It\'s NOT decrypting — it\'s creating a new guess based on the hash digits.' },
            { label: 'Why different reductions?', text: 'Each step in the chain uses a different reduction function (R₁, R₂, R₃...). This prevents different chains from colliding and covering the same passwords.' },
            { label: 'Space-time tradeoff', text: 'You only store the FIRST and LAST values of each chain. To crack a hash, you recompute parts of the chain. This trades computation time for massive storage savings.' },
        ],
        insight: 'A single chain of length 1,000 covers 1,000 different passwords — but you only store 2 values (start + end). That\'s a 500x compression ratio!',
        path: '/visualizer',
    },
    {
        id: 'playground',
        icon: '🧪',
        number: '03',
        title: 'Cracking Playground',
        color: '#34d399',
        question: 'Can I actually crack a hash myself?',
        intro: 'This is where theory becomes real. You build an actual rainbow table, pick a target password, and try to crack it — all in your browser.',
        details: [
            { label: 'Phase 1: Build 🔨', text: 'Choose your settings — charset (lowercase letters), max password length, chain count, and chain length. Click "Generate" and watch a live coverage gauge show how much of the password space your table covers.' },
            { label: 'Phase 2: Target 🎯', text: 'Enter a password to crack, or click quick-test buttons like "cat", "dog", or "hi". The app hashes it in real time so you can see the hash you\'re about to attack.' },
            { label: 'Phase 3: Crack! 💥', text: 'Hit the button and watch a terminal-style animation scroll through the lookup process. If found, the password reveals character by character with a dramatic animation.' },
            { label: 'Coverage matters', text: 'The gauge shows estimated coverage. With 5,000 chains of length 200, you cover ~55% of all 1-3 character lowercase passwords. More chains = more coverage = higher success rate.' },
        ],
        insight: 'If the crack fails, you get specific tips: "Try increasing chain count" or "Try a shorter password". This teaches you intuitively what factors affect rainbow table success.',
        path: '/playground',
    },
    {
        id: 'salt-demo',
        icon: '🛡️',
        number: '04',
        title: 'Salt & Defense',
        color: '#fbbf24',
        question: 'Why does salting fix everything?',
        intro: 'Salting is the #1 defense against rainbow tables. But WHY? Most explanations just say "it adds randomness." This module shows you the actual math — and it\'s mind-blowing.',
        details: [
            { label: 'Same password, 6 methods', text: 'Enter one password and see it hashed 6 different ways: Raw MD5 (broken in 0.2s), MD5+Salt, SHA-256, SHA-256+Salt, bcrypt, and Argon2id (takes 178 years).' },
            { label: 'Side-by-side comparison', text: 'Each method shows the actual hash output, whether it\'s in rainbow tables, estimated crack time, and the real time it took your CPU to compute it.' },
            { label: 'The math that kills tables', text: 'Without salt: a 4.3 GB table cracks ALL passwords. With a 128-bit salt: you\'d need 18,446,744,073 TB — more storage than exists on planet Earth.' },
            { label: 'Defense progression bar', text: 'An animated bar chart shows security improving from MD5 (tiny red bar) to Argon2 (full green bar). The visual makes the security gap viscerally obvious.' },
        ],
        insight: 'Salt doesn\'t make individual hashes harder to crack. It makes precomputed tables useless — forcing attackers to brute-force each password one by one.',
        path: '/salt-demo',
    },
    {
        id: 'auditor',
        icon: '🔐',
        number: '05',
        title: 'Code Auditor',
        color: '#f472b6',
        question: 'Is MY code vulnerable right now?',
        intro: 'You\'ve learned how attacks work and how to defend. Now test your own code. Paste real code from your project and get an instant security grade.',
        details: [
            { label: 'Security score 0-100', text: 'A circular gauge shows your code\'s security score. Below 50 means critical issues were found. Each vulnerability type deducts points based on severity.' },
            { label: 'Line-by-line highlights', text: 'Your code is displayed with line numbers. Vulnerable lines glow red with ⚠️ flags, so you can see exactly WHERE the problem is.' },
            { label: 'Severity breakdown', text: 'A visual bar and chips show: 🔴 CRITICAL (MD5 use), 🟠 HIGH (no salt), 🟡 MEDIUM (no pepper), 🟢 LOW (bcrypt instead of Argon2).' },
            { label: 'Exact fix code', text: 'Each finding includes a ready-to-paste code replacement. Expand any finding to see the vulnerable snippet vs. the recommended fix side by side.' },
            { label: 'Hash list audit', text: 'Switch to "Hash List" mode, paste exported hashes, and see each one identified: format, salt status, rainbow vulnerability, and estimated crack time.' },
        ],
        insight: 'The auditor supports PHP, Python, JavaScript, Java, and Ruby. It catches weak hash algorithms, missing salt, missing pepper, hardcoded passwords, and plaintext comparisons.',
        path: '/auditor',
    },
    {
        id: 'battle-arena',
        icon: '⚔️',
        number: '06',
        title: 'Algorithm Battle Arena',
        color: '#fb923c',
        question: 'How fast is too fast for a hash?',
        intro: 'Speed is the enemy of password security. This module benchmarks every hashing algorithm on YOUR machine, head-to-head, so you can see the difference yourself.',
        details: [
            { label: '9 algorithms tested', text: 'MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE2b, bcrypt (cost 10), bcrypt (cost 12), and Argon2id — all benchmarked with real computations.' },
            { label: 'GPU estimates', text: 'For every algorithm, you see estimated GPU speed. MD5 on a GPU? ~890 BILLION per second. Argon2id on a GPU? Still just ~20 per second.' },
            { label: 'Three views', text: '⚡ Speed Bars (animated horizontal bars), 📊 Chart (Recharts bar chart), and 📋 Table (full data with crack time for 8-char passwords).' },
            { label: 'Crack time for 8-char', text: 'See how long each algorithm would take to brute-force an 8-character mixed password. MD5: minutes. Argon2: centuries.' },
        ],
        insight: 'MD5 is ~400 MILLION times faster than Argon2. That\'s the entire point — for passwords, slowness is the security feature. A function that takes 300ms per attempt means brute-force takes centuries.',
        path: '/battle-arena',
    },
];

const JOURNEY_STEPS = [
    { step: '1', icon: '🔬', label: 'See the hash', desc: 'Type a password, see what algorithms do to it', color: '#06b6d4' },
    { step: '2', icon: '🎬', label: 'Understand the chain', desc: 'Walk through how rainbow tables compress data', color: '#a78bfa' },
    { step: '3', icon: '🧪', label: 'Crack a hash', desc: 'Build a table and break a password live', color: '#34d399' },
    { step: '4', icon: '🛡️', label: 'See the fix', desc: 'Watch salting make rainbow tables useless', color: '#fbbf24' },
    { step: '5', icon: '🔐', label: 'Audit your code', desc: 'Test if your own code is vulnerable', color: '#f472b6' },
    { step: '6', icon: '⚔️', label: 'Compare speed', desc: 'See why MD5 is 400M× faster than Argon2', color: '#fb923c' },
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } };

function Home() {
    const [expandedModule, setExpandedModule] = useState(null);

    return (
        <div className="page-container home-page">
            {/* ── HERO ── */}
            <motion.div className="hero-section" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="hero-badge">
                    <span className="rainbow-bg hero-badge-dot"></span>
                    Open Source • Educational • Free
                </div>
                <h1 className="hero-title">
                    <span className="hero-rainbow">🌈</span>
                    <span>Rainbow</span>
                    <span className="hero-lab">Lab</span>
                </h1>
                <p className="hero-subtitle">
                    The world's most complete interactive suite for understanding,
                    demonstrating, and defending against rainbow table attacks.
                </p>
                <div className="hero-stats">
                    <div className="hero-stat">
                        <span className="hero-stat-value">6</span>
                        <span className="hero-stat-label">Modules</span>
                    </div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat">
                        <span className="hero-stat-value">8+</span>
                        <span className="hero-stat-label">Hash Algorithms</span>
                    </div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat">
                        <span className="hero-stat-value">100%</span>
                        <span className="hero-stat-label">Educational</span>
                    </div>
                </div>
            </motion.div>

            {/* ── MODULE CARDS GRID ── */}
            <motion.div className="modules-grid" variants={containerVariants} initial="hidden" animate="visible">
                {MODULES.map((mod) => (
                    <motion.div key={mod.path} variants={itemVariants}>
                        <Link to={mod.path} className="module-card">
                            <div className="module-card-glow" style={{ background: mod.gradient }}></div>
                            <div className="module-card-icon">{mod.icon}</div>
                            <h3 className="module-card-title">{mod.title}</h3>
                            <p className="module-card-tagline" style={{ color: mod.color }}>{mod.tagline}</p>
                            <p className="module-card-desc">{mod.description}</p>
                            <div className="module-card-arrow" style={{ color: mod.color }}>Explore →</div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── LEARNING JOURNEY ── */}
            <motion.div className="journey-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="section-header">
                    <span className="section-num">📍</span>
                    <div>
                        <h2>Your Learning Journey</h2>
                        <p>Follow this path from "What is a hash?" to "My code is now secure." Each module builds on the previous one.</p>
                    </div>
                </div>
                <div className="journey-timeline">
                    {JOURNEY_STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            className="journey-node"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.08 }}
                        >
                            <div className="journey-connector" style={{ background: step.color }}></div>
                            <div className="journey-dot" style={{ borderColor: step.color, boxShadow: `0 0 12px ${step.color}44` }}>
                                <span>{step.icon}</span>
                            </div>
                            <div className="journey-content">
                                <span className="journey-step-num" style={{ color: step.color }}>Step {step.step}</span>
                                <h4>{step.label}</h4>
                                <p>{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── DEEP DIVE MODULES ── */}
            <motion.div className="deepdive-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <div className="section-header">
                    <span className="section-num">🔍</span>
                    <div>
                        <h2>Deep Dive: Every Module Explained</h2>
                        <p>Click any module below for a detailed, plain-English explanation of what it does, how to use it, and what you'll learn.</p>
                    </div>
                </div>

                <div className="deepdive-list">
                    {DEEP_DIVES.map((mod, idx) => {
                        const isExpanded = expandedModule === mod.id;
                        return (
                            <motion.div
                                key={mod.id}
                                className={`deepdive-card ${isExpanded ? 'expanded' : ''}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + idx * 0.06 }}
                                style={{ '--dd-color': mod.color }}
                            >
                                <div className="deepdive-header" onClick={() => setExpandedModule(isExpanded ? null : mod.id)}>
                                    <div className="deepdive-number" style={{ color: mod.color }}>{mod.number}</div>
                                    <span className="deepdive-icon">{mod.icon}</span>
                                    <div className="deepdive-header-text">
                                        <h3>{mod.title}</h3>
                                        <p className="deepdive-question">"{mod.question}"</p>
                                    </div>
                                    <span className="deepdive-toggle">{isExpanded ? '▲' : '▼'}</span>
                                </div>

                                {isExpanded && (
                                    <motion.div
                                        className="deepdive-body"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <p className="deepdive-intro">{mod.intro}</p>

                                        <div className="deepdive-details">
                                            {mod.details.map((d, j) => (
                                                <div key={j} className="deepdive-detail">
                                                    <div className="dd-detail-dot" style={{ background: mod.color }}></div>
                                                    <div>
                                                        <strong>{d.label}</strong>
                                                        <p>{d.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="deepdive-insight" style={{ borderColor: mod.color + '33', background: mod.color + '08' }}>
                                            <span className="dd-insight-icon">💡</span>
                                            <div>
                                                <strong style={{ color: mod.color }}>Key Insight</strong>
                                                <p>{mod.insight}</p>
                                            </div>
                                        </div>

                                        <Link to={mod.path} className="deepdive-cta" style={{ background: mod.color + '18', color: mod.color, borderColor: mod.color + '33' }}>
                                            Try {mod.title} →
                                        </Link>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── WHO IS THIS FOR ── */}
            <motion.div className="home-bottom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}>
                <div className="why-section">
                    <h2>Who Is This For?</h2>
                    <div className="why-grid">
                        <div className="why-item">
                            <span className="why-icon">👨‍🎓</span>
                            <h4>Students</h4>
                            <p>Finally, an interactive explanation of rainbow tables that makes sense. See it, build it, break it.</p>
                        </div>
                        <div className="why-item">
                            <span className="why-icon">👩‍💻</span>
                            <h4>Developers</h4>
                            <p>Audit your own password hashing code and get actionable fixes. Know exactly where your vulnerabilities are.</p>
                        </div>
                        <div className="why-item">
                            <span className="why-icon">🔐</span>
                            <h4>Security Pros</h4>
                            <p>Perfect teaching tool for clients. Don't just explain the risk — demonstrate it live in their browser.</p>
                        </div>
                        <div className="why-item">
                            <span className="why-icon">📚</span>
                            <h4>Educators</h4>
                            <p>Use it in your cryptography class. Visual, interactive learning = 10x better retention than slides.</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default Home;
