const API_BASE = 'http://localhost:8000/api';

async function request(path, data = null) {
    const options = {
        method: data ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(`${API_BASE}${path}`, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'API request failed');
    }
    return res.json();
}

export const api = {
    analyzeHash: (text) => request('/hash/analyze', { text }),
    identifyHash: (hash_value) => request('/hash/identify', { hash_value }),

    visualizeChain: (params) => request('/rainbow/visualize-chain', params),
    generateTable: (params) => request('/rainbow/generate-table', params),
    crackHash: (params) => request('/rainbow/crack', params),

    demonstrateSalt: (password) => request('/salt/demonstrate', { password }),
    iterationDemo: (password, iterations) => request('/salt/iteration-demo', { password, iterations }),

    auditCode: (code, language) => request('/audit/code', { code, language }),
    auditHashes: (hashes) => request('/audit/hashes', { hashes }),

    runBenchmark: (test_password, iterations) => request('/benchmark/run', { test_password, iterations }),
};
