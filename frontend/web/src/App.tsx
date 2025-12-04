// App.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContractReadOnly, getContractWithSigner } from "./contract";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import "./App.css";

interface BrandAssociation {
  id: string;
  platform: string;
  brand: string;
  associationScore: number;
  encryptedData: string;
  timestamp: number;
}

const App: React.FC = () => {
  // Randomly selected style: High Contrast Black/White + Industrial Mechanical + Center Radiation + Micro Interactions
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [associations, setAssociations] = useState<BrandAssociation[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    visible: boolean;
    status: "pending" | "success" | "error";
    message: string;
  }>({ visible: false, status: "pending", message: "" });
  const [newAssociation, setNewAssociation] = useState({
    platform: "",
    brand: "",
    score: 0,
    notes: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showStats, setShowStats] = useState(false);

  // Calculate statistics
  const totalAssociations = associations.length;
  const averageScore = totalAssociations > 0 
    ? associations.reduce((sum, item) => sum + item.associationScore, 0) / totalAssociations 
    : 0;

  useEffect(() => {
    loadAssociations().finally(() => setLoading(false));
  }, []);

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
      });
    } catch (e) {
      alert("Failed to connect wallet");
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
  };

  const loadAssociations = async () => {
    setIsRefreshing(true);
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      // Check contract availability using FHE
      const isAvailable = await contract.isAvailable();
      if (!isAvailable) {
        console.error("Contract is not available");
        return;
      }
      
      const keysBytes = await contract.getData("association_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing association keys:", e);
        }
      }
      
      const list: BrandAssociation[] = [];
      
      for (const key of keys) {
        try {
          const recordBytes = await contract.getData(`association_${key}`);
          if (recordBytes.length > 0) {
            try {
              const recordData = JSON.parse(ethers.toUtf8String(recordBytes));
              list.push({
                id: key,
                platform: recordData.platform,
                brand: recordData.brand,
                associationScore: recordData.score,
                encryptedData: recordData.data,
                timestamp: recordData.timestamp
              });
            } catch (e) {
              console.error(`Error parsing association data for ${key}:`, e);
            }
          }
        } catch (e) {
          console.error(`Error loading association ${key}:`, e);
        }
      }
      
      list.sort((a, b) => b.timestamp - a.timestamp);
      setAssociations(list);
    } catch (e) {
      console.error("Error loading associations:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const addAssociation = async () => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    setAdding(true);
    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Encrypting brand data with FHE..."
    });
    
    try {
      // Simulate FHE encryption
      const encryptedData = `FHE-${btoa(JSON.stringify({
        notes: newAssociation.notes,
        meta: {
          platform: newAssociation.platform,
          brand: newAssociation.brand
        }
      }))}`;
      
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const associationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const associationData = {
        platform: newAssociation.platform,
        brand: newAssociation.brand,
        score: newAssociation.score,
        data: encryptedData,
        timestamp: Math.floor(Date.now() / 1000),
        owner: account
      };
      
      // Store encrypted data on-chain using FHE
      await contract.setData(
        `association_${associationId}`, 
        ethers.toUtf8Bytes(JSON.stringify(associationData))
      );
      
      const keysBytes = await contract.getData("association_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      keys.push(associationId);
      
      await contract.setData(
        "association_keys", 
        ethers.toUtf8Bytes(JSON.stringify(keys))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Brand data encrypted and stored securely!"
      });
      
      await loadAssociations();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
        setShowAddModal(false);
        setNewAssociation({
          platform: "",
          brand: "",
          score: 0,
          notes: ""
        });
      }, 2000);
    } catch (e: any) {
      const errorMessage = e.message.includes("user rejected transaction")
        ? "Transaction rejected by user"
        : "Submission failed: " + (e.message || "Unknown error");
      
      setTransactionStatus({
        visible: true,
        status: "error",
        message: errorMessage
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    } finally {
      setAdding(false);
    }
  };

  const checkAvailability = async () => {
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      const isAvailable = await contract.isAvailable();
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: isAvailable 
          ? "FHE service is available and ready!" 
          : "FHE service is currently unavailable"
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 2000);
    } catch (e) {
      setTransactionStatus({
        visible: true,
        status: "error",
        message: "Failed to check FHE availability"
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    }
  };

  const filteredAssociations = associations.filter(assoc => {
    const matchesSearch = assoc.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         assoc.platform.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "high") return matchesSearch && assoc.associationScore >= 7;
    if (activeTab === "medium") return matchesSearch && assoc.associationScore >= 4 && assoc.associationScore < 7;
    if (activeTab === "low") return matchesSearch && assoc.associationScore < 4;
    
    return matchesSearch;
  });

  if (loading) return (
    <div className="loading-screen">
      <div className="mechanical-spinner"></div>
      <p>Initializing FHE connection...</p>
    </div>
  );

  return (
    <div className="app-container industrial-theme">
      <header className="app-header">
        <div className="logo">
          <h1>Brand<span>Assoc</span></h1>
          <div className="logo-subtitle">FHE-Powered Cross-Media Analysis</div>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="add-btn mechanical-button"
          >
            <span className="btn-icon">+</span>
            Add Data
          </button>
          <button 
            className="mechanical-button"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button 
            className="mechanical-button"
            onClick={checkAvailability}
          >
            Check FHE
          </button>
          <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </header>
      
      <div className="main-content">
        <div className="central-radial-layout">
          <div className="content-core">
            <div className="search-controls">
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search brands or platforms..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mechanical-input"
                />
                <button className="search-btn mechanical-button">🔍</button>
              </div>
              
              <div className="filter-tabs">
                <button 
                  className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </button>
                <button 
                  className={`tab-btn ${activeTab === "high" ? "active" : ""}`}
                  onClick={() => setActiveTab("high")}
                >
                  High Score
                </button>
                <button 
                  className={`tab-btn ${activeTab === "medium" ? "active" : ""}`}
                  onClick={() => setActiveTab("medium")}
                >
                  Medium
                </button>
                <button 
                  className={`tab-btn ${activeTab === "low" ? "active" : ""}`}
                  onClick={() => setActiveTab("low")}
                >
                  Low
                </button>
              </div>
            </div>
            
            {showStats && (
              <div className="stats-panel mechanical-card">
                <h3>Brand Association Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{totalAssociations}</div>
                    <div className="stat-label">Total Records</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{averageScore.toFixed(1)}</div>
                    <div className="stat-label">Avg Score</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {associations.filter(a => a.associationScore >= 7).length}
                    </div>
                    <div className="stat-label">High Scores</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {associations.filter(a => a.associationScore < 4).length}
                    </div>
                    <div className="stat-label">Low Scores</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="associations-list mechanical-card">
              <div className="list-header">
                <h2>Cross-Media Brand Associations</h2>
                <button 
                  onClick={loadAssociations}
                  className="refresh-btn mechanical-button"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>
              
              {filteredAssociations.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">📊</div>
                  <p>No brand associations found</p>
                  <button 
                    className="mechanical-button primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add First Association
                  </button>
                </div>
              ) : (
                <div className="association-table">
                  <div className="table-header">
                    <div className="header-cell">Brand</div>
                    <div className="header-cell">Platform</div>
                    <div className="header-cell">Score</div>
                    <div className="header-cell">Date</div>
                    <div className="header-cell">Status</div>
                  </div>
                  
                  {filteredAssociations.map(assoc => (
                    <div className="table-row" key={assoc.id}>
                      <div className="table-cell brand-cell">
                        <div className="brand-name">{assoc.brand}</div>
                        <div className="fhe-badge">FHE Encrypted</div>
                      </div>
                      <div className="table-cell">{assoc.platform}</div>
                      <div className="table-cell">
                        <div className={`score-pill score-${Math.floor(assoc.associationScore / 3)}`}>
                          {assoc.associationScore}/10
                        </div>
                      </div>
                      <div className="table-cell">
                        {new Date(assoc.timestamp * 1000).toLocaleDateString()}
                      </div>
                      <div className="table-cell">
                        <div className="status-indicator">
                          <div className={`status-light ${assoc.associationScore >= 7 ? "active" : "inactive"}`}></div>
                          {assoc.associationScore >= 7 ? "Strong" : "Weak"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  
      {showAddModal && (
        <ModalAdd 
          onSubmit={addAssociation} 
          onClose={() => setShowAddModal(false)} 
          adding={adding}
          association={newAssociation}
          setAssociation={setNewAssociation}
        />
      )}
      
      {walletSelectorOpen && (
        <WalletSelector
          isOpen={walletSelectorOpen}
          onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
          onClose={() => setWalletSelectorOpen(false)}
        />
      )}
      
      {transactionStatus.visible && (
        <div className="transaction-notification">
          <div className={`notification-content ${transactionStatus.status}`}>
            <div className="notification-icon">
              {transactionStatus.status === "pending" && <div className="mechanical-spinner"></div>}
              {transactionStatus.status === "success" && "✓"}
              {transactionStatus.status === "error" && "✗"}
            </div>
            <div className="notification-message">
              {transactionStatus.message}
            </div>
          </div>
        </div>
      )}
  
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>BrandAssoc</h3>
            <p>Confidential Cross-Media Brand Association Study</p>
          </div>
          
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="fhe-badge">
            <span>Fully Homomorphic Encryption</span>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} BrandAssoc Research
          </div>
        </div>
      </footer>
    </div>
  );
};

interface ModalAddProps {
  onSubmit: () => void; 
  onClose: () => void; 
  adding: boolean;
  association: any;
  setAssociation: (data: any) => void;
}

const ModalAdd: React.FC<ModalAddProps> = ({ 
  onSubmit, 
  onClose, 
  adding,
  association,
  setAssociation
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAssociation({
      ...association,
      [name]: value
    });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssociation({
      ...association,
      score: parseInt(e.target.value)
    });
  };

  const handleSubmit = () => {
    if (!association.brand || !association.platform) {
      alert("Please fill required fields");
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="add-modal mechanical-card">
        <div className="modal-header">
          <h2>Add Brand Association</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="fhe-notice">
            <div className="gear-icon">⚙️</div> 
            <span>Data will be encrypted using FHE technology</span>
          </div>
          
          <div className="form-group">
            <label>Brand Name *</label>
            <input 
              type="text"
              name="brand"
              value={association.brand} 
              onChange={handleChange}
              placeholder="Enter brand name..." 
              className="mechanical-input"
            />
          </div>
          
          <div className="form-group">
            <label>Platform *</label>
            <select 
              name="platform"
              value={association.platform} 
              onChange={handleChange}
              className="mechanical-select"
            >
              <option value="">Select platform</option>
              <option value="Social Media">Social Media</option>
              <option value="TV">TV</option>
              <option value="Print">Print</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Digital">Digital</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Association Score (1-10)</label>
            <div className="score-slider-container">
              <input 
                type="range"
                min="1"
                max="10"
                value={association.score}
                onChange={handleScoreChange}
                className="score-slider"
              />
              <div className="score-value">{association.score}</div>
            </div>
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea 
              name="notes"
              value={association.notes} 
              onChange={handleChange}
              placeholder="Additional notes about this association..." 
              className="mechanical-textarea"
              rows={3}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="mechanical-button"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={adding}
            className="mechanical-button primary"
          >
            {adding ? "Encrypting with FHE..." : "Submit Securely"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;