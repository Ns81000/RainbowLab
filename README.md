<p align="center">
  <img src="frontend/public/favicon.svg" width="100" alt="RainbowLab Logo" />
</p>

<h1 align="center">🌈 RainbowLab</h1>

<p align="center">
  <strong>The Interactive Hash Security Suite</strong>
  <br />
  <em>Understand, visualize, and defend against rainbow table attacks — all in your browser.</em>
</p>

<p align="center">
  <a href="https://github.com/Ns81000/RainbowLab/stargazers">
    <img src="https://img.shields.io/github/stars/Ns81000/RainbowLab?style=for-the-badge&logo=github&color=a78bfa&labelColor=0a0a0f" alt="Stars" />
  </a>
  <a href="https://github.com/Ns81000/RainbowLab/issues">
    <img src="https://img.shields.io/github/issues/Ns81000/RainbowLab?style=for-the-badge&color=f87171&labelColor=0a0a0f" alt="Issues" />
  </a>
  <img src="https://img.shields.io/badge/python-3.10+-60a5fa?style=for-the-badge&logo=python&logoColor=white&labelColor=0a0a0f" alt="Python" />
  <img src="https://img.shields.io/badge/react-18+-22d3ee?style=for-the-badge&logo=react&logoColor=white&labelColor=0a0a0f" alt="React" />
</p>

---

<br />

## 📖 The Story

> *You've heard that "MD5 is broken" — but what does that actually mean?*

Most people learn about password hashing from a paragraph in a textbook. They memorize that "salting is important" and "use bcrypt" without ever **seeing** why. RainbowLab changes that.

This is a **fully interactive, visual laboratory** that lets you:

- 🧪 **Build** a rainbow table with real chains and watch it crack a password live
- 🎬 **Step through** a rainbow chain node-by-node and understand how reduction functions work
- 🔬 **Hash** any text with 8 algorithms simultaneously and compare their security
- ⚔️ **Benchmark** MD5 vs bcrypt vs Argon2 on your own machine — head to head
- 🛡️ **Watch** salting destroy a rainbow table with real math
- 🔐 **Audit** your own code or hash lists for vulnerabilities

Every concept is brought to life with animations, real computations, and interactive elements. No slides. No lectures. Just **learning by doing**.

<br />

---

<br />

## 🚀 One-Command Install

Pick your OS. One command does everything: **clones the repo → installs dependencies → creates a desktop shortcut → launches the app.**

<br />

### 🪟 Windows

Open **Command Prompt** or **PowerShell** and run:

```powershell
curl -fsSL https://raw.githubusercontent.com/Ns81000/RainbowLab/main/install-windows.bat -o %TEMP%\rl-install.bat && %TEMP%\rl-install.bat
```

<details>
<summary>💡 What this does</summary>

1. Downloads the installer to your temp folder
2. Checks for Git, Python 3, and Node.js
3. Clones the repo to `%USERPROFILE%\RainbowLab`
4. Creates a Python virtual environment & installs backend deps
5. Installs frontend Node.js packages (uses `pnpm` if available, else `npm`)
6. Creates a **desktop shortcut** called "RainbowLab" 🌈
7. Launches the app and opens your browser

</details>

<br />

### 🐧 Linux

Open a terminal and run:

```bash
curl -fsSL https://raw.githubusercontent.com/Ns81000/RainbowLab/main/install.sh | bash
```

<details>
<summary>💡 What this does</summary>

1. Checks for Git, Python 3, and Node.js
2. Clones the repo to `~/RainbowLab`
3. Creates venv, installs Python deps, installs Node deps
4. Creates a `.desktop` shortcut on your desktop with the RainbowLab icon
5. Asks if you want to launch immediately

</details>

<br />

### 🍎 macOS

Open Terminal and run:

```bash
curl -fsSL https://raw.githubusercontent.com/Ns81000/RainbowLab/main/install.sh | bash
```

<details>
<summary>💡 What this does</summary>

Same as Linux, but creates a `.command` file on your desktop. Double-click it anytime to launch RainbowLab.

</details>

<br />

### 🖥️ Desktop Shortcut

After installation, you'll find a **RainbowLab** shortcut on your desktop. Double-click it anytime to launch the app — no terminal commands needed!

| OS | Shortcut Type | Location |
|---|---|---|
| Windows | `.lnk` (native shortcut) | `Desktop\RainbowLab.lnk` |
| Linux | `.desktop` (freedesktop) | `Desktop/RainbowLab.desktop` |
| macOS | `.command` (executable) | `Desktop/RainbowLab.command` |

<br />

---

<br />

## 🧩 The Seven Modules

RainbowLab is organized into seven interactive modules, each teaching a different aspect of hash security.

<br />

### 🏠 Home — Mission Control

The landing page is your central command center, featuring:

- **Module Cards:** Quick access to all 6 interactive labs.
- **Learning Journey:** An interactive timeline guiding you from basic concepts to advanced defense.
- **Deep Dive:** Detailed breakdowns of what each module teaches and the key insights you'll gain.

<br />

### 1. 🔬 Hash Analyzer — *"What does my password look like?"*

Type any text and **instantly** see it hashed across 8 algorithms — MD5, SHA-1, SHA-256, SHA-512, SHA-3 (256), SHA-3 (512), BLAKE2b, and NTLM.

**What you'll learn:**
- Every algorithm produces a fixed-length output regardless of input size
- Broken algorithms (MD5, SHA-1) are flagged red with the year they were compromised
- Crack time estimates adapt to your password's actual character complexity
- Click any hash to copy it — handy for cross-referencing

**Key insight:** *Two passwords that differ by one letter produce completely different hashes. This is the avalanche effect.*

<br />

### 2. 🎬 Rainbow Visualizer — *"How does the attack actually work?"*

Step through a real rainbow chain, node by node. Watch a password get hashed, then reduced, then hashed again — building the chain that makes rainbow tables possible.

**What you'll learn:**
- How reduction functions convert hashes back into "password-like" strings
- Why different reduction functions at each step prevent chain collisions
- The space-time tradeoff: one chain represents thousands of hash→password pairs
- How a chain endpoint is enough to recover any password in that chain

**How it works:** The left panel shows the animated chain as a vertical pipeline with glowing nodes. The right panel narrates each step as you click through. Each node shows the actual intermediate value.

<br />

### 3. 🧪 Live Cracking Playground — *"Can I actually crack a hash?"*

A three-phase wizard that walks you through the full lifecycle of a rainbow table attack:

| Phase | What You Do |
|---|---|
| **Build** 🔨 | Configure charset, chain length, number of chains — then generate a real rainbow table. Watch the coverage gauge fill up as your table covers more of the keyspace. |
| **Target** 🎯 | Enter a password (or click a quick-test chip like `cat`, `dog`, `hello`). The app hashes it live. |
| **Crack!** 💥 | Hit the button and watch a terminal-style animation as the app searches the table. Success? The password reveals character by character. Failure? You get tips to improve your table. |

**Key insight:** *With just 5,000 chains of length 200, you cover ~55% of the lowercase 1-3 character keyspace. Scale matters.*

<br />

### 4. 🛡️ Salt & Defense Demonstrator — *"Why does salting fix everything?"*

Enter one password and see it hashed **six different ways** — from completely broken to bulletproof:

```
Raw MD5          →  🔴 Cracked in 0.2 seconds
MD5 + Salt       →  🟡 Not in rainbow table, but fast
SHA-256 (raw)    →  🟠 5 seconds on a GPU
SHA-256 + Salt   →  🟡 Not in rainbow table
bcrypt (cost=10) →  🟢 26 years for 8-char password
Argon2id         →  🟢 178 years for 8-char password
```

The **math section** shows why:
- Without salt: a 4.3 GB rainbow table cracks ALL passwords
- With 128-bit salt: you'd need **18,446,744,073 TB** of tables — *more storage than exists on Earth*

**Key insight:** *Salting doesn't make individual hashes harder to crack — it makes precomputed tables useless, forcing attackers to brute-force each password individually.*

<br />

### 5. 🔐 Code Auditor — *"Is MY code vulnerable?"*

Paste your password hashing code (PHP, Python, Node.js, Java, Ruby) and get an instant security audit:

- **Security Score:** 0-100 quantified grade
- **Line-by-line analysis:** Vulnerable lines highlighted in your code
- **Severity breakdown:** CRITICAL → HIGH → MEDIUM → LOW with a visual bar
- **Fix suggestions:** Exact code you should use instead
- **Salt/Pepper detection:** Whether your code salts and peppers passwords

You can also paste a list of hashes, and the auditor will identify their format, flag insecure ones, and estimate how long each would take to crack.

<br />

### 6. ⚔️ Algorithm Battle Arena — *"How fast is too fast?"*

Run a real benchmark on your machine. Nine algorithms go head-to-head:

| Algorithm | Typical Speed | Rating |
|---|---|---|
| MD5 | ~890M/sec | 🔴 Dead |
| SHA-1 | ~420M/sec | 🔴 Dead |
| SHA-256 | ~180M/sec | 🟡 Weak for passwords |
| SHA-512 | ~80M/sec | 🟡 Weak for passwords |
| SHA-3 | ~120M/sec | 🟡 Moderate |
| BLAKE2b | ~200M/sec | 🟡 Moderate |
| bcrypt (10) | ~3/sec | 🟢 Good |
| bcrypt (12) | ~0.8/sec | 🟢 Better |
| **Argon2id** | **~2/sec** | **🟢 Best** |

Three visualization modes: animated speed bars, bar chart, and full data table.

**Key insight:** *MD5 is 400 million times faster than Argon2. That's exactly why MD5 is dangerous — attackers can try 400 million passwords per second.*

<br />

---

<br />

## 🏗️ Architecture

```
RainbowLab/
├── backend/                  # Python FastAPI server
│   ├── app.py                # Main app + CORS config
│   ├── requirements.txt      # Python dependencies
│   └── modules/
│       ├── hash_analyzer.py  # 8-algorithm hash computation
│       ├── rainbow_core.py   # Chain generation, table building, cracking
│       ├── salt_demo.py      # Salt comparison demonstrations
│       ├── benchmark.py      # CPU/GPU speed benchmarks
│       └── code_auditor.py   # Static analysis for hashing vulnerabilities
│
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx           # Router + sidebar navigation
│   │   ├── api.js            # API client 
│   │   ├── index.css         # Design system (dark theme, all tokens)
│   │   └── components/
│   │       ├── Home/         # Landing page
│   │       ├── HashAnalyzer/ # Real-time multi-algorithm hashing
│   │       ├── Visualizer/   # Rainbow chain step-through
│   │       ├── Playground/   # 3-phase cracking wizard
│   │       ├── SaltDemo/     # Salt defense demonstration
│   │       ├── Auditor/      # Code & hash security auditor
│   │       └── BattleArena/  # Algorithm benchmarking
│   └── public/
│       └── favicon.svg       # Rainbow gradient icon
│
├── start.ps1                 # Windows launcher (PowerShell)
├── start.sh                  # Linux/macOS launcher (Bash)
├── start.bat                 # Windows launcher (CMD fallback)
├── install-windows.bat       # One-command Windows installer
└── install.sh                # One-command Linux/macOS installer
```

<br />

### API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/hash/analyze` | Hash text with all 8 algorithms |
| `POST` | `/api/hash/identify` | Identify hash format by length |
| `POST` | `/api/rainbow/visualize-chain` | Generate a single chain step-by-step |
| `POST` | `/api/rainbow/generate-table` | Build a complete rainbow table |
| `POST` | `/api/rainbow/crack` | Look up a hash in the cached table |
| `POST` | `/api/salt/demonstrate` | Compare 6 hashing methods side by side |
| `POST` | `/api/salt/iteration-demo` | Show iteration/cost impact on speed |
| `POST` | `/api/audit/code` | Static analysis on hashing code |
| `POST` | `/api/audit/hashes` | Analyze a list of hashes |
| `POST` | `/api/benchmark/run` | Benchmark all algorithms |

<br />

---

<br />

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Framer Motion, Recharts |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **Hashing** | hashlib, bcrypt, argon2-cffi |
| **Styling** | Vanilla CSS with custom design tokens |
| **Fonts** | Inter + JetBrains Mono (Google Fonts) |

<br />

---

<br />

## 📋 Prerequisites

Before installing, make sure you have:

| Requirement | Version | Check |
|---|---|---|
| **Git** | any | `git --version` |
| **Python** | 3.10+ | `python --version` |
| **Node.js** | 18+ | `node --version` |
| **pnpm** *(optional)* | 8+ | `pnpm --version` |

<br />

---

<br />

## 🧑‍💻 Manual Setup (if you prefer)

```bash
# Clone
git clone https://github.com/Ns81000/RainbowLab.git
cd RainbowLab

# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate.bat     # Windows
pip install -r requirements.txt

# Frontend
cd ../frontend
pnpm install                    # or: npm install

# Launch (from project root)
cd ..
bash start.sh                   # Linux/macOS
# powershell start.ps1          # Windows
```

<br />

---

<br />

## 🌟 Why RainbowLab?

| Feature | Other Tools | RainbowLab |
|---|---|---|
| Rainbow table explanation | Static diagrams | **Interactive, animated chain visualization** |
| Cracking demo | "Trust me it's fast" | **Actually crack a hash live in your browser** |
| Benchmark | Links to external data | **Run on YOUR machine, see YOUR numbers** |
| Salt explanation | "Salt adds randomness" | **See the exact math that makes tables impossible** |
| Code auditing | Separate linting tools | **Paste code, get instant security score** |
| Accessibility | CLI-only or academic papers | **Beautiful dark-themed web UI anyone can use** |

<br />

---

<br />

## 🤝 Contributing

Contributions are welcome! Whether it's:

- 🐛 Bug reports
- 💡 Feature suggestions
- 🎨 UI improvements
- 📚 Adding more vulnerability patterns to the auditor
- 🌍 Internationalization

Please open an issue first to discuss what you'd like to change.

<br />

---

<br />

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

<br />

---

<p align="center">
  Made with 💜 by <a href="https://github.com/Ns81000">Ns81000</a>
  <br />
  <br />
  <a href="https://github.com/Ns81000/RainbowLab">
    <img src="https://img.shields.io/badge/⭐_Star_on_GitHub-a78bfa?style=for-the-badge&logo=github&logoColor=white" alt="Star on GitHub" />
  </a>
</p>
