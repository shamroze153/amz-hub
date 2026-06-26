/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Database, 
  HelpCircle, 
  Sparkles, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

import { UserRole, Product, Order, Agent, Seller, HubConfig, BuyerUser } from './types';
import { SimulatedDB, LiveGASClient, getHubConfig, setHubConfig } from './data';

// Components
import Header from './components/Header';
import SystemSettings from './components/SystemSettings';
import BuyerPage from './components/BuyerPage';
import AgentPage from './components/AgentPage';
import SellerPage from './components/SellerPage';
import AdminPage from './components/AdminPage';
import OrderTrackingPage from './components/OrderTrackingPage';
import ParticleBackground from './components/ParticleBackground';
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  // Navigation role state ('buyer' matches homepage catalog)
  const [role, setRole] = useState<UserRole>('buyer');
  
  // Tab index for the buyer spacecraft UI
  const [currentTab, setCurrentTab] = useState<'deals' | 'track' | 'orders' | 'agent' | 'admin' | 'seller'>('deals');

  // Interactive buyer login state persisted in localStorage
  const [buyerSession, setBuyerSession] = useState<BuyerUser | null>(() => {
    const cachedS = localStorage.getItem('hh_buyer_session');
    if (cachedS) {
      try {
        return JSON.parse(cachedS);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLoginBuyer = (buyer: BuyerUser) => {
    setBuyerSession(buyer);
    localStorage.setItem('hh_buyer_session', JSON.stringify(buyer));
  };

  const handleSignOutBuyer = () => {
    setBuyerSession(null);
    localStorage.removeItem('hh_buyer_session');
  };
  
  // Settings overlay control
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<HubConfig>(getHubConfig());

  // Database core state
  const [products, setProducts] = useState<Product[]>(() => SimulatedDB.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => SimulatedDB.getOrders());
  const [agents, setAgents] = useState<Agent[]>(() => SimulatedDB.getAgents());
  const [sellers, setSellers] = useState<Seller[]>(() => SimulatedDB.getSellers());
  const [buyers, setBuyers] = useState<BuyerUser[]>(() => SimulatedDB.getBuyers());

  // Action / load notifications
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');
  const [apiSuccess, setApiSuccess] = useState<string>('');

  // Confirm delete state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'agent' | 'seller' | 'buyer' | 'order';
    id?: string;
    ids?: string[];
    title: string;
    message: string;
  } | null>(null);

  // Live order search pass-through for tracking page
  const [trackOrderId, setTrackOrderId] = useState<string>('');

  // Mapped referring agent from URL query string
  const [activeRefAgent, setActiveRefAgent] = useState<Agent | null>(null);

  // 1. Initial Load Database States
  const loadDatabase = useCallback(async (currentConfig: HubConfig) => {
    setApiError('');

    if (currentConfig.mode === 'live' && currentConfig.backendUrl) {
      try {
        // Attempt syncing to active Google Apps Script Web App
        const res = await LiveGASClient.getAllData(currentConfig);
        if (res && res.products) {
          setProducts(res.products);
          setOrders(res.orders || []);
          setAgents(res.agents || []);
          setSellers(res.sellers || []);
          setBuyers(res.buyers || []);

          // Persist in local cache
          SimulatedDB.saveProducts(res.products);
          SimulatedDB.saveOrders(res.orders || []);
          SimulatedDB.saveAgents(res.agents || []);
          SimulatedDB.saveSellers(res.sellers || []);
          SimulatedDB.saveBuyers(res.buyers || []);

          setApiSuccess('Database fully synced to Google Sheets!');
          setTimeout(() => setApiSuccess(''), 4000);
          return;
        }
      } catch (err: any) {
        // Handle CORS, Network, or script config error gracefully
        console.warn('Apps Script fetch failed, falling back to cached local database:', err);
        setApiError(`Live Sheets Connection Failed: ${err.message || 'CORS Security exception'}. Using Cached Local Database.`);
        setTimeout(() => setApiError(''), 10000);
      }
    }

    // Always keep state synced with cache as fallback
    setProducts(SimulatedDB.getProducts());
    setOrders(SimulatedDB.getOrders());
    setAgents(SimulatedDB.getAgents());
    setSellers(SimulatedDB.getSellers());
    setBuyers(SimulatedDB.getBuyers());
  }, []);

  // Sync when config changes
  useEffect(() => {
    loadDatabase(config);
  }, [config, loadDatabase]);

  // 2. URL Referral Parameter Detection
  useEffect(() => {
    // Check parameters like: ?ref=agent01 or ?refCode=agent01
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('refCode');
    
    if (refCode) {
      // Find matching agent
      const activeAgents = agents.length > 0 ? agents : SimulatedDB.getAgents();
      const matched = activeAgents.find(
        a => a.referralCode.toLowerCase() === refCode.trim().toLowerCase()
      );
      if (matched) {
        if (matched.status === 'Active') {
          setActiveRefAgent(matched);
          // Persist in localStorage to remember referrer on secondary clicks
          localStorage.setItem('hh_referrer', JSON.stringify(matched));
        }
      }
    } else {
      // Look up cached referrer
      const cached = localStorage.getItem('hh_referrer');
      if (cached) {
        try {
          setActiveRefAgent(JSON.parse(cached));
        } catch {
          // Ignore
        }
      }
    }
  }, [agents]);

  // 3. Configurations Settings update
  const handleSaveConfig = (newConfig: HubConfig) => {
    setConfig(newConfig);
    setHubConfig(newConfig);
  };

  // Buyer registration
  const handleRegisterBuyer = async (rawBuyer: Partial<BuyerUser>): Promise<BuyerUser> => {
    setIsLoading(true);
    // Always add to local SimulatedDB first (offline-first & resilient)
    const newBuyer = SimulatedDB.addBuyer(rawBuyer);
    
    if (config.mode === 'live') {
      try {
        const res = await LiveGASClient.addBuyer(config, rawBuyer);
        console.log("Background sync for new buyer completed successfully:", res);
      } catch (err: any) {
        console.warn("Background sync for new buyer failed:", err);
        setApiError(`Google Sheets Sync Notice: Account registered locally, but failed to sync to Google Sheets: ${err.message || ''}. Please verify your Spreadsheet Web App URL in settings.`);
        setTimeout(() => setApiError(''), 15000);
      }
    }
    
    await loadDatabase(config);
    setIsLoading(false);
    return newBuyer;
  };

  // 4. CRUD PROCESS OPERATIONS

  // A. Submit Order (Buyer / Agent flow)
  const handleSubmitOrder = async (orderData: {
    orderId: string;
    productId: string;
    productName: string;
    buyerName: string;
    buyerWhatsApp: string;
    agentName: string;
    agentReferralCode: string;
    screenshotBase64: string;
    fileName: string;
    notes: string;
    paymentMethod?: 'Zelle' | 'CashApp' | 'Venmo' | 'PayPal';
    paymentId?: string;
  }) => {
    // 1. Optimistic Update in Simulated DB (writes to LocalStorage cache immediately)
    const newOrder = SimulatedDB.addOrder({
      id: orderData.orderId,
      productId: orderData.productId,
      productName: orderData.productName,
      buyerName: orderData.buyerName,
      buyerWhatsApp: orderData.buyerWhatsApp,
      agentName: orderData.agentName,
      agentReferralCode: orderData.agentReferralCode,
      screenshotLink: orderData.screenshotBase64, // local render base64
      sellerNotes: orderData.notes,
      paymentMethod: orderData.paymentMethod,
      paymentId: orderData.paymentId
    });

    // 2. Instantly update the orders state so the user sees it immediately
    setOrders(prevOrders => [newOrder, ...prevOrders]);

    // 3. Dispatch background network sync if live
    if (config.mode === 'live') {
      LiveGASClient.addOrder(config, orderData)
        .then(() => {
          console.log("Background sync to Google Sheets completed successfully!");
          loadDatabase(config); // Gently refresh in the background
        })
        .catch((err: any) => {
          console.warn("Background sync to Google Sheets failed:", err);
          setApiError(`Background Sync Notice: ${err.message || 'CORS or spreadsheet communication error.'}`);
          setTimeout(() => setApiError(''), 10000);
        });
    } else {
      loadDatabase(config);
    }
  };

  // A2. Submit Delivery Proof (Buyer/Agent workflow)
  const handleSubmitDeliveryProof = async (orderId: string, deliveryScreenshotUrl: string) => {
    // 1. Optimistic Update
    const updatedOrder = SimulatedDB.submitDeliveryProof(orderId, deliveryScreenshotUrl);
    if (updatedOrder) {
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
    }

    if (config.mode === 'live') {
      LiveGASClient.submitDeliveryProof(config, orderId, deliveryScreenshotUrl)
        .then(() => {
          loadDatabase(config);
        })
        .catch((err: any) => {
          console.warn("Background sync of delivery proof failed:", err);
          setApiError(`Background Sync Notice: Failed to sync delivery proof. ${err.message}`);
          setTimeout(() => setApiError(''), 10000);
        });
    }
  };

  // A3. Edit/Modify Order Details (Buyer workflow)
  const handleUpdateOrderDetails = async (
    orderId: string,
    amazonId: string,
    paymentMethod: 'PayPal' | 'Venmo' | 'Zelle' | 'CashApp',
    paymentId: string
  ) => {
    // 1. Optimistic Update
    const updatedOrder = SimulatedDB.updateOrderDetails(orderId, amazonId, paymentMethod, paymentId);
    if (updatedOrder) {
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
    }

    if (config.mode === 'live') {
      LiveGASClient.updateOrderDetails(config, orderId, amazonId, paymentMethod, paymentId)
        .then(() => {
          loadDatabase(config);
        })
        .catch((err: any) => {
          console.warn("Background sync of order details failed:", err);
          setApiError(`Background Sync Notice: Failed to sync order modifications. ${err.message}`);
          setTimeout(() => setApiError(''), 10000);
        });
    }
  };

  // B. Modify Order Status (Seller workflow)
  const handleUpdateOrderStatus = async (
    orderId: string, 
    status: Order['orderStatus'], 
    notes: string, 
    proof: string
  ) => {
    // 1. Optimistic Update
    const updatedOrder = SimulatedDB.updateOrderStatus(orderId, status, notes, proof);
    if (updatedOrder) {
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
    }

    if (config.mode === 'live') {
      LiveGASClient.updateOrderStatus(config, orderId, status, notes, proof)
        .then(() => {
          loadDatabase(config);
        })
        .catch((err: any) => {
          console.warn("Background sync of order status failed:", err);
          setApiError(`Background Sync Notice: Failed to sync order status update. ${err.message}`);
          setTimeout(() => setApiError(''), 10000);
        });
    }
  };

  // C. Product Actions
  const handleAddProduct = async (product: Partial<Product>) => {
    // 1. Optimistic Update
    const newProduct = SimulatedDB.addProduct(product);
    setProducts(prev => [newProduct, ...prev]);

    // 2. Background Sync if live mode
    if (config.mode === 'live') {
      LiveGASClient.addProduct(config, product)
        .then(() => {
          console.log("Background sync for new product completed successfully!");
          loadDatabase(config);
        })
        .catch((err: any) => {
          console.warn("Background sync for product failed:", err);
          setApiError(`Background Sync Notice: Product creation sync failed. ${err.message || ''}`);
          setTimeout(() => setApiError(''), 10000);
        });
    } else {
      loadDatabase(config);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    setIsLoading(true);
    const updated = SimulatedDB.updateProduct(product);
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    loadDatabase(config);
    setIsLoading(false);
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteTarget({
      type: 'product',
      id,
      title: 'Delete Offer Product',
      message: 'Are you sure you want to delete this product? This will remove it from the homepage catalog and clean up local configurations.'
    });
  };

  const handleBulkDeleteProducts = (ids: string[]) => {
    setDeleteTarget({
      type: 'product',
      ids,
      title: 'Bulk Delete Offer Products',
      message: `Are you sure you want to delete the ${ids.length} selected products? This will remove them from the homepage catalog and clean up local configurations.`
    });
  };

  const handleDeleteAgent = (id: string) => {
    setDeleteTarget({
      type: 'agent',
      id,
      title: 'Delete Agent Profile',
      message: 'Are you sure you want to delete this agent profile? Ensure their code is retracted before proceeding.'
    });
  };

  const handleBulkDeleteAgents = (ids: string[]) => {
    setDeleteTarget({
      type: 'agent',
      ids,
      title: 'Bulk Delete Agent Profiles',
      message: `Are you sure you want to delete the ${ids.length} selected agent profiles? Ensure their codes are retracted before proceeding.`
    });
  };

  const handleDeleteSeller = (id: string) => {
    setDeleteTarget({
      type: 'seller',
      id,
      title: 'Delete Seller Brand',
      message: 'Are you sure you want to delete this brand seller? This will clean up their reference on the portal.'
    });
  };

  const handleBulkDeleteSellers = (ids: string[]) => {
    setDeleteTarget({
      type: 'seller',
      ids,
      title: 'Bulk Delete Seller Brands',
      message: `Are you sure you want to delete the ${ids.length} selected brand sellers? This will clean up their references on the portal.`
    });
  };

  const handleDeleteBuyer = (id: string) => {
    setDeleteTarget({
      type: 'buyer',
      id,
      title: 'Delete Buyer Account',
      message: 'Are you sure you want to delete this Buyer account? The user will no longer be able to log in with this unique name.'
    });
  };

  const handleBulkDeleteBuyers = (ids: string[]) => {
    setDeleteTarget({
      type: 'buyer',
      ids,
      title: 'Bulk Delete Buyer Accounts',
      message: `Are you sure you want to delete the ${ids.length} selected Buyer accounts? The users will no longer be able to log in with these unique names.`
    });
  };

  const handleDeleteOrder = (id: string) => {
    setDeleteTarget({
      type: 'order',
      id,
      title: 'Delete Order Record',
      message: 'Are you sure you want to delete this order record? This is completely irreversible and deletes the transaction ledger history.'
    });
  };

  const handleBulkDeleteOrders = (ids: string[]) => {
    setDeleteTarget({
      type: 'order',
      ids,
      title: 'Bulk Delete Order Records',
      message: `Are you sure you want to delete the ${ids.length} selected order records? This is completely irreversible and deletes the transaction ledger history.`
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, ids } = deleteTarget;
    const targetIds = ids || (id ? [id] : []);
    setDeleteTarget(null);
    if (targetIds.length === 0) return;
    
    setIsLoading(true);

    try {
      if (type === 'product') {
        for (const tid of targetIds) {
          SimulatedDB.deleteProduct(tid);
        }
        setProducts(prev => prev.filter(p => !targetIds.includes(p.id)));
        if (config.mode === 'live') {
          try {
            await LiveGASClient.deleteRecord(config, 'Products', 'Product ID', targetIds);
            setApiSuccess('Selected products deleted from Google Sheets!');
            setTimeout(() => setApiSuccess(''), 4000);
          } catch (err: any) {
            console.warn('Failed to delete products from Google Sheets:', err);
            setApiError(`Failed to delete from Google Sheets: ${err.message || ''}`);
            setTimeout(() => setApiError(''), 10000);
          }
        }
      } else if (type === 'agent') {
        for (const tid of targetIds) {
          SimulatedDB.deleteAgent(tid);
        }
        setAgents(prev => prev.filter(a => !targetIds.includes(a.id)));
        if (config.mode === 'live') {
          try {
            await LiveGASClient.deleteRecord(config, 'Agents', 'Agent ID', targetIds);
            setApiSuccess('Selected agents deleted from Google Sheets!');
            setTimeout(() => setApiSuccess(''), 4000);
          } catch (err: any) {
            console.warn('Failed to delete agents from Google Sheets:', err);
            setApiError(`Failed to delete from Google Sheets: ${err.message || ''}`);
            setTimeout(() => setApiError(''), 10000);
          }
        }
      } else if (type === 'seller') {
        for (const tid of targetIds) {
          SimulatedDB.deleteSeller(tid);
        }
        setSellers(prev => prev.filter(s => !targetIds.includes(s.id)));
        if (config.mode === 'live') {
          try {
            await LiveGASClient.deleteRecord(config, 'Sellers', 'Seller ID', targetIds);
            setApiSuccess('Selected sellers deleted from Google Sheets!');
            setTimeout(() => setApiSuccess(''), 4000);
          } catch (err: any) {
            console.warn('Failed to delete sellers from Google Sheets:', err);
            setApiError(`Failed to delete from Google Sheets: ${err.message || ''}`);
            setTimeout(() => setApiError(''), 10000);
          }
        }
      } else if (type === 'buyer') {
        for (const tid of targetIds) {
          SimulatedDB.deleteBuyer(tid);
        }
        setBuyers(prev => prev.filter(b => !targetIds.includes(b.id)));
        if (config.mode === 'live') {
          try {
            await LiveGASClient.deleteRecord(config, 'Buyers', 'Buyer ID', targetIds);
            setApiSuccess('Selected buyers deleted from Google Sheets!');
            setTimeout(() => setApiSuccess(''), 4000);
          } catch (err: any) {
            console.warn('Failed to delete buyers from Google Sheets:', err);
            setApiError(`Failed to delete from Google Sheets: ${err.message || ''}`);
            setTimeout(() => setApiError(''), 10000);
          }
        }
      } else if (type === 'order') {
        for (const tid of targetIds) {
          SimulatedDB.deleteOrder(tid);
        }
        setOrders(prev => prev.filter(o => !targetIds.includes(o.id)));
        if (config.mode === 'live') {
          try {
            await LiveGASClient.deleteRecord(config, 'Orders', 'Order ID', targetIds);
            setApiSuccess('Selected orders deleted from Google Sheets!');
            setTimeout(() => setApiSuccess(''), 4000);
          } catch (err: any) {
            console.warn('Failed to delete orders from Google Sheets:', err);
            setApiError(`Failed to delete from Google Sheets: ${err.message || ''}`);
            setTimeout(() => setApiError(''), 10000);
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }

    await loadDatabase(config);
    setIsLoading(false);
  };

  // D. Agent Actions
  const handleAddAgent = async (agent: Partial<Agent>) => {
    const newAgent = SimulatedDB.addAgent(agent);
    setAgents(prev => [newAgent, ...prev]);

    if (config.mode === 'live') {
      LiveGASClient.addAgent(config, agent)
        .then(() => {
          console.log("Background sync for new agent completed successfully!");
          loadDatabase(config);
        })
        .catch((err: any) => {
          console.warn("Background sync for agent failed:", err);
          setApiError(`Background Sync Notice: Agent registration sync failed. ${err.message || ''}`);
          setTimeout(() => setApiError(''), 10000);
        });
    } else {
      loadDatabase(config);
    }
  };

  const handleUpdateAgent = async (agent: Agent) => {
    setIsLoading(true);
    const updated = SimulatedDB.updateAgent(agent);
    setAgents(prev => prev.map(a => a.id === agent.id ? updated : a));
    loadDatabase(config);
    setIsLoading(false);
  };

  // E. Seller Actions
  const handleAddSeller = async (seller: Partial<Seller>) => {
    const newSeller = SimulatedDB.addSeller(seller);
    setSellers(prev => [newSeller, ...prev]);

    if (config.mode === 'live') {
      LiveGASClient.addSeller(config, seller)
        .then(() => {
          console.log("Background sync for new seller completed successfully!");
          loadDatabase(config);
        })
        .catch((err: any) => {
          console.warn("Background sync for seller failed:", err);
          setApiError(`Background Sync Notice: Seller creation sync failed. ${err.message || ''}`);
          setTimeout(() => setApiError(''), 10000);
        });
    } else {
      loadDatabase(config);
    }
  };

  const handleUpdateSeller = async (seller: Seller) => {
    setIsLoading(true);
    const updated = SimulatedDB.updateSeller(seller);
    setSellers(prev => prev.map(s => s.id === seller.id ? updated : s));
    loadDatabase(config);
    setIsLoading(false);
  };

  // F. Buyer Actions
  const handleAddBuyer = async (buyer: Partial<BuyerUser>) => {
    const newBuyer = SimulatedDB.addBuyer(buyer);
    setBuyers(prev => [newBuyer, ...prev]);

    if (config.mode === 'live') {
      LiveGASClient.addBuyer(config, buyer)
        .then(() => {
          console.log("Background sync for new buyer completed successfully!");
          loadDatabase(config);
        })
        .catch((err: any) => {
          console.warn("Background sync for buyer failed:", err);
          setApiError(`Background Sync Notice: Buyer registration sync failed. ${err.message || ''}`);
          setTimeout(() => setApiError(''), 10000);
        });
    } else {
      loadDatabase(config);
    }
  };

  const handleUpdateBuyer = async (buyer: BuyerUser) => {
    setIsLoading(true);
    const updated = SimulatedDB.updateBuyer(buyer);
    setBuyers(prev => prev.map(b => b.id === buyer.id ? updated : b));
    loadDatabase(config);
    setIsLoading(false);
  };

  // Track order redirect proxy helper
  const handleTrackOrderRedirect = (orderId: string) => {
    setTrackOrderId(orderId);
    setCurrentTab('track');
  };

  return (
    <div className={`min-h-screen ${role === 'admin' ? 'bg-[#060713] text-slate-100' : 'bg-slate-55/60 text-slate-800'} flex flex-col justify-between relative overflow-x-hidden transition-colors duration-300`}>
      
      {/* 1. Header Navigation block - wrapped in relative z-10 */}
      <div className="relative z-10">
        <Header 
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'admin') {
              setRole('admin');
            } else {
              setRole('buyer');
            }
            setTrackOrderId('');
          }}
          activeRefAgent={activeRefAgent} 
          config={config} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          buyerSession={buyerSession}
          onSignOutBuyer={handleSignOutBuyer}
        />
      </div>

      {/* 2. Top Banner Errors / Successes space-dark notifications */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 space-y-2 relative z-10">
        {role === 'admin' && apiError && (
          <div className="rounded-2xl bg-white border border-orange-200 p-4 text-xs text-orange-850 flex items-start gap-2.5 shadow-md transition-all animate-slideDown">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-orange-600 mt-0.5" />
            <div>
              <p className="font-sans font-bold text-orange-950 mb-0.5">Database Synced Alert</p>
              <span className="font-sans leading-relaxed text-slate-650">{apiError}</span>
            </div>
          </div>
        )}

        {role === 'admin' && apiSuccess && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-850 flex items-center gap-2.5 shadow-md transition-all animate-slideDown">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
            <span className="font-sans font-bold">{apiSuccess}</span>
          </div>
        )}
      </div>

      {/* 3. Main Workspace router based on unified Navigation Roles */}
      <main id="app-main-viewport" className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-5 relative z-10">
        
        {/* Buyer space includes Deals, Track, My Orders and Agent pages */}
        {role === 'buyer' && (
          <BuyerPage 
            products={products} 
            orders={orders}
            agents={agents}
            activeAgent={activeRefAgent} 
            onSubmitOrder={handleSubmitOrder}
            onSubmitDeliveryProof={handleSubmitDeliveryProof}
            onTrackOrder={handleTrackOrderRedirect} 
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            trackOrderId={trackOrderId}
            buyerSession={buyerSession}
            onLoginBuyer={handleLoginBuyer}
            onSignOutBuyer={handleSignOutBuyer}
            buyers={buyers}
            onRegisterBuyer={handleRegisterBuyer}
            onUpdateOrderDetails={handleUpdateOrderDetails}
          />
        )}

        {/* Standard robust Agent backoffice deck */}
        {role === 'agent' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Representative Admin Agent Desk</h4>
                <p className="text-xs text-slate-550">Manage buyer claims, copy affiliate links, and submit fresh order sheets.</p>
              </div>
              <button 
                onClick={() => {
                  setRole('buyer');
                  setCurrentTab('deals');
                }}
                className="rounded-xl bg-white border border-slate-200 text-slate-700 px-4 py-2 text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Return to Site
              </button>
            </div>
            <AgentPage 
              agents={agents} 
              products={products} 
              orders={orders} 
              onSubmitOrder={handleSubmitOrder} 
            />
          </div>
        )}

        {/* Seller fulfillment ledger office */}
        {role === 'seller' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Merchant Fulfillment Office</h4>
                <p className="text-xs text-slate-500">Validate delivery screenshots & change status logs instantly.</p>
              </div>
              <button 
                onClick={() => {
                  setRole('buyer');
                  setCurrentTab('deals');
                }}
                className="rounded-xl bg-white border border-slate-200 text-slate-700 px-4 py-2 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                ← Return to Site
              </button>
            </div>
            <SellerPage 
              sellers={sellers} 
              products={products} 
              orders={orders} 
              onUpdateOrderStatus={handleUpdateOrderStatus} 
            />
          </div>
        )}

        {/* Master power control board (Securely locked out by default under tab router) */}
        {role === 'admin' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">Master Switch Command</p>
                <h4 className="text-lg font-black text-slate-900">Hub Controller Panel</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    await loadDatabase(config);
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                  className="rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>🔄</span>
                  <span>{isLoading ? 'Syncing...' : 'Force Sheet Sync'}</span>
                </button>
                <button 
                  onClick={() => {
                    setRole('buyer');
                    setCurrentTab('deals');
                  }}
                  className="rounded-xl bg-white border border-slate-200 text-slate-705 px-4 py-1.5 text-xs font-bold hover:bg-slate-50 cursor-pointer transition"
                >
                  ← Leave Panel
                </button>
              </div>
            </div>
            <AdminPage 
              products={products}
              orders={orders}
              agents={agents}
              sellers={sellers}
              buyers={buyers}
              
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDeleteProducts={handleBulkDeleteProducts}
              
              onAddAgent={handleAddAgent}
              onUpdateAgent={handleUpdateAgent}
              onDeleteAgent={handleDeleteAgent}
              onBulkDeleteAgents={handleBulkDeleteAgents}
              
              onAddSeller={handleAddSeller}
              onUpdateSeller={handleUpdateSeller}
              onDeleteSeller={handleDeleteSeller}
              onBulkDeleteSellers={handleBulkDeleteSellers}
              onUpdateOrderStatus={handleUpdateOrderStatus}

              onAddBuyer={handleAddBuyer}
              onUpdateBuyer={handleUpdateBuyer}
              onDeleteBuyer={handleDeleteBuyer}
              onBulkDeleteBuyers={handleBulkDeleteBuyers}
              onDeleteOrder={handleDeleteOrder}
              onBulkDeleteOrders={handleBulkDeleteOrders}
            />
          </div>
        )}
      </main>

      {/* 4. Google Sheets Backend Database Settings Popover Overlay */}
      <SystemSettings 
         config={config} 
         isOpen={isSettingsOpen} 
         onClose={() => setIsSettingsOpen(false)} 
         onSave={handleSaveConfig} 
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.title || ''}
        message={deleteTarget?.message || ''}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 5. Stunning Deep Dark Footer (Exactly matching layout in Screenshot 2) */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-[11px] text-slate-500 font-sans relative z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-slate-600 font-bold">
            <span>© 2026 Happiness Hub</span>
            <span className="text-slate-200">•</span>
            <button 
              onClick={() => {
                setRole('buyer');
                setCurrentTab('track');
              }}
              className="hover:text-indigo-600 hover:underline transition cursor-pointer"
            >
              Track Order
            </button>
            <span className="text-slate-200">•</span>
            <button
              onClick={() => {
                setRole('agent');
                setCurrentTab('deals');
              }}
              className="hover:text-indigo-600 hover:underline transition cursor-pointer"
            >
              Agent Login
            </button>
            <span className="text-slate-200">•</span>
            <button
              onClick={() => {
                setRole('seller');
                setCurrentTab('deals');
              }}
              className="hover:text-indigo-600 hover:underline transition cursor-pointer"
            >
              Seller Login
            </button>
            <span className="text-slate-200">•</span>
            <button 
              onClick={() => {
                setRole('admin');
                setCurrentTab('admin');
              }}
              className="hover:text-indigo-600 hover:underline transition cursor-pointer"
            >
              Admin
            </button>
          </div>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed font-normal">
            A frictionless AI-powered cashback distribution channel synchronized automatically to active Google Sheets database structures.
          </p>
        </div>
      </footer>

    </div>
  );
}
