import { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import HashAnalyzer from './components/HashAnalyzer/HashAnalyzer';
import Visualizer from './components/Visualizer/Visualizer';
import Playground from './components/Playground/Playground';
import SaltDemo from './components/SaltDemo/SaltDemo';
import Auditor from './components/Auditor/Auditor';
import BattleArena from './components/BattleArena/BattleArena';
import Home from './components/Home/Home';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠', section: 'overview' },
  { path: '/hash-analyzer', label: 'Hash Analyzer', icon: '🔬', section: 'modules' },
  { path: '/visualizer', label: 'Rainbow Visualizer', icon: '🎬', section: 'modules' },
  { path: '/playground', label: 'Cracking Playground', icon: '🧪', section: 'modules' },
  { path: '/salt-demo', label: 'Salt & Defense', icon: '🛡️', section: 'modules' },
  { path: '/auditor', label: 'Code Auditor', icon: '🔐', section: 'modules' },
  { path: '/battle-arena', label: 'Battle Arena', icon: '📊', section: 'modules' },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const grouped = {};
  NAV_ITEMS.forEach((item) => {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  });

  const sectionLabels = {
    overview: 'Overview',
    modules: 'Modules',
  };

  return (
    <div className="app-layout">
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🌈</div>
            <div>
              <h1>RainbowLab</h1>
              <span>Hash Security Suite</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section-label">{sectionLabels[section]}</div>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="https://github.com/Ns81000/RainbowLab" target="_blank" rel="noopener noreferrer" className="sidebar-github-link">
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hash-analyzer" element={<HashAnalyzer />} />
          <Route path="/visualizer" element={<Visualizer />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/salt-demo" element={<SaltDemo />} />
          <Route path="/auditor" element={<Auditor />} />
          <Route path="/battle-arena" element={<BattleArena />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
