import React, { useState } from 'react';
import { 
  Network, 
  Settings, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  User, 
  Database, 
  Layers, 
  RefreshCw, 
  GitFork,
  HelpCircle,
  Hash,
  AlertCircle
} from 'lucide-react';

// Recursive Component to render tree nodes with connector lines
function TreeNode({ label, treeObj }) {
  const children = Object.keys(treeObj);
  return (
    <div className="tree-node">
      <div className="tree-node-content">
        <span className="node-bullet">↳</span>
        <span className="node-label">{label}</span>
      </div>
      {children.length > 0 && (
        <div className="tree-children">
          {children.map(childLabel => (
            <TreeNode 
              key={childLabel} 
              label={childLabel} 
              treeObj={treeObj[childLabel]} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Tree view wrapping root node
function TreeView({ rootLabel, treeData }) {
  const rootTree = treeData[rootLabel];
  if (!rootTree) return <div className="empty-state">Empty Tree</div>;
  return (
    <div className="tree-container">
      <TreeNode label={rootLabel} treeObj={rootTree} />
    </div>
  );
}

export default function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:5000/bfhl');
  const [inputData, setInputData] = useState(
    JSON.stringify({
      data: [
        "A->B", "A->C", "B->D", "C->E", "E->F",
        "X->Y", "Y->Z", "Z->X",
        "P->Q", "Q->R",
        "G->H", "G->H", "G->I",
        "hello", "1->2", "A->"
      ]
    }, null, 2)
  );
  
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to pre-fill test cases
  const prefillTestCase = (type) => {
    setError(null);
    let payload = {};
    
    switch(type) {
      case 'default':
        payload = {
          data: [
            "A->B", "A->C", "B->D", "C->E", "E->F",
            "X->Y", "Y->Z", "Z->X",
            "P->Q", "Q->R",
            "G->H", "G->H", "G->I",
            "hello", "1->2", "A->"
          ]
        };
        break;
      case 'cycles':
        payload = {
          data: ["A->B", "B->C", "C->A", "X->Y", "Y->X"]
        };
        break;
      case 'diamonds':
        payload = {
          data: ["A->C", "B->C", "C->D", "B->E"]
        };
        break;
      case 'clean':
        payload = {
          data: ["M->N", "N->O", "O->P", "Q->R", "R->S"]
        };
        break;
      case 'invalid':
        payload = {
          data: ["hello", "1->2", "A->A", "B->", "->C", "AB->C", "A-B"]
        };
        break;
      default:
        payload = { data: [] };
    }
    
    setInputData(JSON.stringify(payload, null, 2));
  };

  // Parses raw text into a strict array of strings
  const parseInput = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // 1. Try JSON parsing
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.data)) {
        return parsed.data;
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // JSON parsing failed, proceed with text split
    }

    // 2. Comma or newline separated fallback
    return trimmed
      .split(/[,\n]/)
      .map(item => {
        // Strip out brackets, quotes, braces and trim whitespace
        return item
          .replace(/[\[\]"'{}]/g, '')
          .trim();
      })
      .filter(item => item.length > 0);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const parsedArray = parseInput(inputData);

    if (parsedArray.length === 0) {
      setError("Input cannot be empty. Please provide an array of nodes.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: parsedArray })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API error (HTTP ${res.status})`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setError(
        err.message === 'Failed to fetch' 
          ? `Could not connect to the API server at: ${apiUrl}. Please make sure your backend is running and CORS is enabled.`
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Capitalize name generated from user_id
  const formatName = (userId) => {
    if (!userId) return "Developer";
    return userId
      .split('_')
      .filter(part => isNaN(Number(part)))
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">B</div>
          <div className="brand-text">
            <h1>Graph Hierarchy Analyzer</h1>
            <p>Chitkara Full Stack Engineering Challenge</p>
          </div>
        </div>

        {/* API URL Config */}
        <div className="api-settings">
          <Settings size={14} className="text-muted" />
          <label htmlFor="api-url-input">API Endpoint:</label>
          <input 
            id="api-url-input"
            type="text" 
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:5000/bfhl"
          />
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="dashboard-grid">
        {/* Left Control Panel */}
        <section className="glass-panel">
          <h2 className="panel-title">
            <Database size={18} />
            Input Configuration
          </h2>

          <form onSubmit={handleSubmit} className="form-group">
            <label htmlFor="nodes-input">Enter Node Edges (JSON or CSV list):</label>
            <textarea
              id="nodes-input"
              className="input-textarea"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='{\n  "data": ["A->B", "A->C"]\n}'
            />
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Run Analysis
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setInputData('')}
                title="Clear input field"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </form>

          {/* Quick Pre-fill Helpers */}
          <div className="example-hints">
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Load Test Cases:
            </p>
            <p>
              💡 <span className="quick-link" onClick={() => prefillTestCase('default')}>Example payload</span> (from instructions)
            </p>
            <p>
              🔄 <span className="quick-link" onClick={() => prefillTestCase('cycles')}>Pure Cycles</span> (cyclic graph group detection)
            </p>
            <p>
              💎 <span className="quick-link" onClick={() => prefillTestCase('diamonds')}>Diamonds</span> (multi-parent edge resolution)
            </p>
            <p>
              🌲 <span className="quick-link" onClick={() => prefillTestCase('clean')}>Clean Trees</span> (simple hierarchical paths)
            </p>
            <p>
              ⚠️ <span className="quick-link" onClick={() => prefillTestCase('invalid')}>Invalid Entries</span> (formatting test cases)
            </p>
          </div>

          {/* Quick Error Display in panel */}
          {error && (
            <div className="error-alert">
              <AlertTriangle size={18} />
              <div>{error}</div>
            </div>
          )}
        </section>

        {/* Right Output Panel */}
        <section className="glass-panel" style={{ minHeight: '500px', flex: 1 }}>
          <h2 className="panel-title">
            <Network size={18} />
            Analysis Results
          </h2>

          {/* Empty State */}
          {!response && !isLoading && !error && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'var(--text-muted)',
              gap: '1rem',
              padding: '4rem 1rem',
              textAlign: 'center'
            }}>
              <Network size={48} strokeWidth={1} style={{ color: 'var(--primary-glow)' }} />
              <div>
                <h3 style={{ color: '#fff', marginBottom: '0.25rem' }}>No data processed yet</h3>
                <p style={{ maxWidth: '340px', fontSize: '0.85rem' }}>
                  Configure your node list on the left and click <strong>Run Analysis</strong> to fetch results from the API.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Connecting to backend API at {new URL(apiUrl).origin}...
              </p>
            </div>
          )}

          {/* Response Results Display */}
          {response && !isLoading && (
            <div className="results-panels">
              
              {/* Identity & Status */}
              <div className="identity-section">
                <div className="identity-card">
                  <div className="avatar">
                    <User size={22} />
                  </div>
                  <div className="identity-details">
                    <div className="identity-name">{formatName(response.user_id)}</div>
                    <div className="identity-meta">
                      <span>Roll Number: <strong>{response.college_roll_number}</strong></span>
                      <span className="meta-divider"></span>
                      <span>Email: <strong>{response.email_id}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="summary-grid">
                  <div className="summary-card trees">
                    <div className="summary-icon">
                      <GitFork size={18} />
                    </div>
                    <div className="summary-val">{response.summary.total_trees}</div>
                    <div className="summary-label">Trees</div>
                  </div>

                  <div className="summary-card cycles">
                    <div className="summary-icon">
                      <RefreshCw size={18} />
                    </div>
                    <div className="summary-val">{response.summary.total_cycles}</div>
                    <div className="summary-label">Cycles</div>
                  </div>

                  <div className="summary-card largest">
                    <div className="summary-icon">
                      <Layers size={18} />
                    </div>
                    <div className="summary-val">{response.summary.largest_tree_root || 'N/A'}</div>
                    <div className="summary-label">Largest Root</div>
                  </div>
                </div>
              </div>

              {/* Hierarchies Viewer */}
              <div className="hierarchies-section">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Processed Hierarchies</h3>
                {response.hierarchies.length === 0 ? (
                  <div className="empty-state">No structures constructed from the given input.</div>
                ) : (
                  <div className="hierarchies-grid">
                    {response.hierarchies.map((hierarchy, index) => {
                      const isCycle = !!hierarchy.has_cycle;
                      return (
                        <div 
                          key={`${hierarchy.root}-${index}`} 
                          className={`hierarchy-card ${isCycle ? 'cyclic-group' : 'tree-group'}`}
                        >
                          <div className="card-header">
                            <div className="card-title">
                              <Network size={16} style={{ color: isCycle ? 'var(--danger)' : 'var(--success)' }} />
                              Root Label: <strong>{hierarchy.root}</strong>
                            </div>
                            <span className={`badge ${isCycle ? 'badge-danger' : 'badge-success'}`}>
                              {isCycle ? 'Cycle Group' : `Tree (Depth: ${hierarchy.depth})`}
                            </span>
                          </div>

                          {isCycle ? (
                            <div className="cyclic-notice">
                              <div className="cyclic-notice-title">
                                <AlertCircle size={14} />
                                Cycle Detected
                              </div>
                              <p>
                                This component contains one or more cyclical loops. Standard tree rendering is disabled for safety.
                              </p>
                            </div>
                          ) : (
                            <TreeView rootLabel={hierarchy.root} treeData={hierarchy.tree} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Anomalies Logging Section */}
              <div className="anomalies-section">
                
                {/* Invalid Entries */}
                <div className="anomaly-card">
                  <div className="anomaly-title invalid-title">
                    <AlertTriangle size={15} />
                    Invalid Entries ({response.invalid_entries.length})
                  </div>
                  {response.invalid_entries.length === 0 ? (
                    <div className="empty-state">No invalid entries detected.</div>
                  ) : (
                    <div className="tags-list">
                      {response.invalid_entries.map((entry, idx) => (
                        <span key={`inv-${idx}`} className="tag-badge invalid" title="Expected pattern X->Y (e.g. A->B)">
                          {entry}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duplicate Edges */}
                <div className="anomaly-card">
                  <div className="anomaly-title duplicate-title">
                    <Layers size={15} />
                    Duplicate Edges ({response.duplicate_edges.length})
                  </div>
                  {response.duplicate_edges.length === 0 ? (
                    <div className="empty-state">No duplicates detected.</div>
                  ) : (
                    <div className="tags-list">
                      {response.duplicate_edges.map((edge, idx) => (
                        <span key={`dup-${idx}`} className="tag-badge duplicate" title="Repeated occurrences of this edge were skipped">
                          {edge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Graph Hierarchy Analyzer. Crafted for Bajaj Round 1 Submission.</p>
      </footer>
    </div>
  );
}
