/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Plus, 
  Edit3, 
  TrendingUp, 
  Store, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Activity, 
  UserPlus, 
  Briefcase,
  ExternalLink,
  ChevronDown,
  X,
  AlertCircle,
  Check,
  CheckCircle,
  FileSpreadsheet,
  Sparkles,
  Lock,
  Unlock,
  Send,
  Terminal,
  Copy,
  RefreshCw,
  Upload
} from 'lucide-react';
import { Product, Order, Agent, Seller, BuyerUser } from '../types';

interface AdminPageProps {
  products: Product[];
  orders: Order[];
  agents: Agent[];
  sellers: Seller[];
  buyers: BuyerUser[];
  
  // Products CRUD
  onAddProduct: (prod: Partial<Product>) => Promise<any>;
  onUpdateProduct: (prod: Product) => Promise<any>;
  onDeleteProduct: (id: string) => Promise<any> | void;
  onBulkDeleteProducts?: (ids: string[]) => void;
  
  // Agents CRUD
  onAddAgent: (agent: Partial<Agent>) => Promise<any>;
  onUpdateAgent: (agent: Agent) => Promise<any>;
  onDeleteAgent: (id: string) => Promise<any> | void;
  onBulkDeleteAgents?: (ids: string[]) => void;
  
  // Sellers CRUD
  onAddSeller: (seller: Partial<Seller>) => Promise<any>;
  onUpdateSeller: (seller: Seller) => Promise<any>;
  onDeleteSeller: (id: string) => Promise<any> | void;
  onBulkDeleteSellers?: (ids: string[]) => void;
  onUpdateOrderStatus?: (orderId: string, status: Order['orderStatus'], notes: string, proof: string) => Promise<any> | void;

  // Buyers CRUD
  onAddBuyer: (buyer: Partial<BuyerUser>) => Promise<any>;
  onUpdateBuyer: (buyer: BuyerUser) => Promise<any>;
  onDeleteBuyer: (id: string) => Promise<any> | void;
  onBulkDeleteBuyers?: (ids: string[]) => void;

  // Orders CRUD
  onDeleteOrder?: (id: string) => Promise<any> | void;
  onBulkDeleteOrders?: (ids: string[]) => void;
}

export default function AdminPage({
  products,
  orders,
  agents,
  sellers,
  buyers = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onBulkDeleteAgents,
  onAddSeller,
  onUpdateSeller,
  onDeleteSeller,
  onBulkDeleteSellers,
  onUpdateOrderStatus,
  onAddBuyer,
  onUpdateBuyer,
  onDeleteBuyer,
  onBulkDeleteBuyers,
  onDeleteOrder,
  onBulkDeleteOrders
}: AdminPageProps) {
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'agents' | 'sellers' | 'orders' | 'buyers' | 'copilot'>('analytics');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => sessionStorage.getItem('admin_session_unlocked') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // AI Copilot state
  const [copilotMessages, setCopilotMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Welcome to the Happiness Hub Operations Command. I'm your AI Copilot—trained to analyze referral networks, draft high-conversion WhatsApp copy, list insights, or query the live sheets and simulated portfolios. How can I facilitate your work today?" }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // Dynamic Insights state
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Drafting modal state
  const [draftModal, setDraftModal] = useState<{ isOpen: boolean; type: string; context: any; draftResult?: string; loading?: boolean }>({ isOpen: false, type: '', context: null });
  const [draftCustomNotes, setDraftCustomNotes] = useState('');

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, orders, agents, sellers })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.insights)) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.warn("Failed to load Gemini insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked && insights.length === 0) {
      fetchInsights();
    }
  }, [isUnlocked, products, orders, agents, sellers]);

  const handleCopilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || isCopilotLoading) return;

    const userMsg = copilotInput.trim();
    setCopilotMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setCopilotInput('');
    setIsCopilotLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...copilotMessages, { role: 'user', content: userMsg }],
          systemData: { products, orders, agents, sellers }
        })
      });
      const data = await response.json();
      if (data.ok) {
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error from AI Server: ${data.error || 'Connection failed'}` }]);
      }
    } catch (err: any) {
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Network Failure: ${err.message || 'Error executing request'}` }]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const openDraftModal = (type: string, context: any) => {
    setDraftModal({ isOpen: true, type, context, draftResult: '', loading: false });
    setDraftCustomNotes('');
  };

  const openStatusModal = (o: Order, initialStatus: Order['orderStatus']) => {
    setRefundModal({ isOpen: true, order: o });
    setSelectedStatus(initialStatus);
    setRefundNotes(o.sellerNotes || '');
    setRefundScreenshot(o.cashbackProof || '');
    setRefundScreenshotName(o.cashbackProof ? (o.cashbackProof.startsWith('data:') ? 'pasted_image.png' : 'screenshot_link.png') : '');
  };

  const handleDraftSubmit = async () => {
    setDraftModal(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/gemini/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: draftModal.type,
          context: draftModal.context,
          details: draftCustomNotes
        })
      });
      const data = await response.json();
      if (data.ok) {
        setDraftModal(prev => ({ ...prev, draftResult: data.draft }));
      } else {
        setDraftModal(prev => ({ ...prev, draftResult: `⚠️ Error drafting template: ${data.error}` }));
      }
    } catch (err: any) {
      setDraftModal(prev => ({ ...prev, draftResult: `⚠️ Communications error: ${err.message}` }));
    } finally {
      setDraftModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Modal forms states
  const [productModal, setProductModal] = useState<{ isOpen: boolean; data?: Product }>({ isOpen: false });
  const [agentModal, setAgentModal] = useState<{ isOpen: boolean; data?: Agent }>({ isOpen: false });
  const [sellerModal, setSellerModal] = useState<{ isOpen: boolean; data?: Seller }>({ isOpen: false });
  const [buyerModal, setBuyerModal] = useState<{ isOpen: boolean; data?: BuyerUser }>({ isOpen: false });

  // Add/Edit Form temporary states
  // - Product
  const [pName, setPName] = useState('');
  const [pImage, setPImage] = useState('');
  const [pLink, setPLink] = useState('');
  const [pCashback, setPCashback] = useState('');
  const [pSeller, setPSeller] = useState('');
  const[pCat, setPCat] = useState('');
  const [pDeadline, setPDeadline] = useState('');
  const [pStatus, setPStatus] = useState<'Active' | 'Paused' | 'Out of Stock'>('Active');
  
  // - Agent
  const [aName, setAName] = useState('');
  const [aCode, setACode] = useState('');
  const [aWhatsApp, setAWhatsApp] = useState('');
  const [aStatus, setAStatus] = useState<'Active' | 'Inactive'>('Active');

  // - Seller
  const [sName, setSName] = useState('');
  const [sWhatsApp, setSWhatsApp] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sStatus, setSStatus] = useState<'Active' | 'Inactive'>('Active');

  // - Buyer
  const [bUsername, setBUsername] = useState('');
  const [bName, setBName] = useState('');
  const [bWhatsApp, setBWhatsApp] = useState('');
  const [bPaymentMethod, setBPaymentMethod] = useState<'PayPal' | 'Venmo' | 'Zelle' | 'CashApp'>('PayPal');
  const [bPaymentId, setBPaymentId] = useState('');
  const [bStatus, setBStatus] = useState<'Active' | 'Inactive'>('Active');

  const [formError, setFormError] = useState('');
  const [productDragActive, setProductDragActive] = useState(false);
  const productImageInputRef = React.useRef<HTMLInputElement>(null);

  // Unified order status editor & payout modal states
  const [refundModal, setRefundModal] = useState<{ isOpen: boolean; order?: Order }>({ isOpen: false });
  const [selectedStatus, setSelectedStatus] = useState<Order['orderStatus']>('Refunded');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundScreenshot, setRefundScreenshot] = useState('');
  const [refundScreenshotName, setRefundScreenshotName] = useState('');
  const [refundDragActive, setRefundDragActive] = useState(false);
  const refundImageInputRef = React.useRef<HTMLInputElement>(null);

  // Global paste handler to support cropped clipboard screenshots (Ctrl + V)
  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!refundModal.isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              if (file.size > 3 * 1024 * 1024) {
                alert('Screenshot is too large. Please upload/paste an image under 3MB.');
                return;
              }
              setRefundScreenshotName(file.name || `pasted_screenshot_${Date.now()}.png`);
              const reader = new FileReader();
              reader.onloadend = () => {
                setRefundScreenshot(reader.result as string);
              };
              reader.readAsDataURL(file);
              // Stop propagation so we don't accidentally paste text into inputs
              e.preventDefault();
              break;
            }
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [refundModal.isOpen]);

  const handleRefundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Screenshot is too large. Please upload an image under 3MB.');
        return;
      }
      setRefundScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefundScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefundDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setRefundDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Screenshot is too large. Please upload an image under 3MB.');
        return;
      }
      setRefundScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefundScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModal.order) return;
    try {
      if ((selectedStatus === 'Refunded' || selectedStatus === 'Cashback Sent') && !refundScreenshot) {
        alert('Please provide a payout or refund screenshot proof! Just paste (Ctrl+V) or drag and drop a screenshot.');
        return;
      }
      onUpdateOrderStatus?.(refundModal.order.id, selectedStatus, refundNotes, refundScreenshot);
      setRefundModal({ isOpen: false });
      setRefundNotes('');
      setRefundScreenshot('');
      setRefundScreenshotName('');
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // CALCULATE KPI METRICS
  const kpi = useMemo(() => {
    const totalOrders = orders.length;
    const totalAgents = agents.length;
    const totalProducts = products.length;
    
    // Total Cashback completed
    const completedOrders = orders.filter(o => o.orderStatus === 'Cashback Sent');
    const totalDisbursed = completedOrders.reduce((sum, o) => {
      // Find product cashback amount
      const p = products.find(prod => prod.id === o.productId);
      return sum + (p ? p.cashbackAmount : 10);
    }, 0);

    return {
      totalOrders,
      totalAgents,
      totalProducts,
      totalDisbursed
    };
  }, [orders, agents, products]);

  // CATEGORIES LIST (STATIC HELPERS)
  const productCategories = ['Electronics', 'Kitchen & Home', 'Fashion', 'Lifestyle', 'Book Readers', 'Sports', 'Other'];

  // OPEN MODALS
  const openProductForm = (prod?: Product) => {
    setProductModal({ isOpen: true, data: prod });
    setFormError('');
    if (prod) {
      setPName(prod.name);
      setPImage(prod.imageUrl);
      setPLink(prod.amazonLink);
      setPCashback(String(prod.cashbackAmount));
      setPSeller(prod.sellerName);
      setPCat(prod.category);
      setPDeadline(prod.deadline);
      setPStatus(prod.status);
    } else {
      setPName('');
      setPImage('');
      setPLink('');
      setPCashback('');
      setPSeller(sellers[0]?.name || '');
      setPCat('Electronics');
      setPDeadline('');
      setPStatus('Active');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!pName || !pLink || !pCashback || !pSeller) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const payload: Partial<Product> = {
      name: pName,
      imageUrl: pImage || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600',
      amazonLink: pLink,
      cashbackAmount: Number(pCashback),
      sellerName: pSeller,
      category: pCat,
      deadline: pDeadline,
      status: pStatus
    };

    try {
      if (productModal.data) {
        // Edit mode
        await onUpdateProduct({ ...productModal.data, ...payload } as Product);
      } else {
        // Add mode
        await onAddProduct(payload);
      }
      setProductModal({ isOpen: false });
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const openAgentForm = (agent?: Agent) => {
    setAgentModal({ isOpen: true, data: agent });
    setFormError('');
    if (agent) {
      setAName(agent.name);
      setACode(agent.referralCode);
      setAWhatsApp(agent.whatsApp);
      setAStatus(agent.status);
    } else {
      setAName('');
      setACode('');
      setAWhatsApp('');
      setAStatus('Active');
    }
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!aName || !aCode || !aWhatsApp) {
      setFormError('Please fill in all fields.');
      return;
    }

    const payload: Partial<Agent> = {
      name: aName,
      referralCode: aCode.trim().toLowerCase(),
      whatsApp: aWhatsApp,
      status: aStatus
    };

    // Check unique referral codes unless editing existing same
    if (!agentModal.data) {
      const codeExists = agents.some(a => a.referralCode.toLowerCase() === payload.referralCode?.toLowerCase());
      if (codeExists) {
        setFormError('Referral Code is already taken by another agent!');
        return;
      }
    }

    try {
      if (agentModal.data) {
        await onUpdateAgent({ ...agentModal.data, ...payload } as Agent);
      } else {
        await onAddAgent(payload);
      }
      setAgentModal({ isOpen: false });
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const openSellerForm = (sel?: Seller) => {
    setSellerModal({ isOpen: true, data: sel });
    setFormError('');
    if (sel) {
      setSName(sel.name);
      setSWhatsApp(sel.whatsApp);
      setSEmail(sel.email);
      setSStatus(sel.status);
    } else {
      setSName('');
      setSWhatsApp('');
      setSEmail('');
      setSStatus('Active');
    }
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!sName || !sWhatsApp || !sEmail) {
      setFormError('Please fill in all fields.');
      return;
    }

    const payload: Partial<Seller> = {
      name: sName,
      whatsApp: sWhatsApp,
      email: sEmail,
      status: sStatus
    };

    try {
      if (sellerModal.data) {
        await onUpdateSeller({ ...sellerModal.data, ...payload } as Seller);
      } else {
        await onAddSeller(payload);
      }
      setSellerModal({ isOpen: false });
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const openBuyerForm = (buy?: BuyerUser) => {
    setBuyerModal({ isOpen: true, data: buy });
    setFormError('');
    if (buy) {
      setBUsername(buy.username);
      setBName(buy.name);
      setBWhatsApp(buy.whatsApp || '');
      setBPaymentMethod(buy.paymentMethod || 'PayPal');
      setBPaymentId(buy.paymentId || '');
      setBStatus(buy.status || 'Active');
    } else {
      setBUsername('');
      setBName('');
      setBWhatsApp('');
      setBPaymentMethod('PayPal');
      setBPaymentId('');
      setBStatus('Active');
    }
  };

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const usernameClean = bUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!usernameClean || !bName.trim() || !bWhatsApp.trim() || !bPaymentId.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }

    // Check unique sign-in name unless editing existing same
    if (!buyerModal.data) {
      const exists = buyers.some(b => b.username.toLowerCase() === usernameClean);
      if (exists) {
        setFormError(`The Sign-In Name "${bUsername}" is already taken by another registered buyer.`);
        return;
      }
    }

    const payload: Partial<BuyerUser> = {
      username: usernameClean,
      name: bName.trim(),
      whatsApp: bWhatsApp.trim(),
      paymentMethod: bPaymentMethod,
      paymentId: bPaymentId.trim(),
      status: bStatus
    };

    try {
      if (buyerModal.data) {
        await onUpdateBuyer({ ...buyerModal.data, ...payload } as BuyerUser);
      } else {
        await onAddBuyer(payload);
      }
      setBuyerModal({ isOpen: false });
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'Ordered': 'bg-blue-100 text-blue-800 border-blue-200',
    'Delivered': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Cashback Sent': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Refunded': 'bg-teal-100 text-teal-800 border-teal-200',
    'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
    'PayPal Issue': 'bg-purple-100 text-purple-800 border-purple-200',
    'Need More Info': 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const tabsConfig = [
    { id: 'analytics', name: 'Performance Stats', icon: Activity },
    { id: 'products', name: 'Products Database', icon: ShoppingBag },
    { id: 'agents', name: 'Agents Network', icon: Users },
    { id: 'orders', name: 'All Orders Ledger', icon: FileSpreadsheet },
    { id: 'buyers', name: 'Buyers Ledger', icon: Users },
    { id: 'copilot', name: 'AI Copilot Terminal', icon: Sparkles },
  ];

  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-md w-full my-12 animate-fadeIn font-sans px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-[2.2rem] shadow-2xl p-8 space-y-6 relative overflow-hidden text-slate-100">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Terminal className="h-32 w-32 text-indigo-500" />
          </div>

          <div className="space-y-2 text-center relative z-10">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white font-sans uppercase text-center">Happiness Hub Secure Terminal</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto text-center">
              You are accessing administrative capabilities. Please input the secondary passcode to unlock the ledgers, operations panel, and AI controls.
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (passwordInput === '5566') {
              setIsUnlocked(true);
              sessionStorage.setItem('admin_session_unlocked', 'true');
            } else {
              setUnlockError('Access Denied. Passcode is invalid.');
              setTimeout(() => setUnlockError(''), 4000);
            }
          }} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter Admin Passcode"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full text-center tracking-widest text-lg bg-slate-950/65 border border-slate-800 rounded-xl px-4 py-3 placeholder:text-xs placeholder:text-slate-500 placeholder:tracking-normal focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-bold text-white shadow-inner"
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-indigo-400/80 font-bold font-mono">SECURE LOGIN</span>
                <span className="text-[10px] text-slate-500 font-medium">AUTHORIZED ONLY</span>
              </div>
            </div>

            {unlockError && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-red-400 text-center text-xs font-semibold">
                {unlockError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-xs shadow-lg shadow-indigo-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Unlock className="h-4 w-4" />
              ACCESS SYSTEMS
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-workspace" className="space-y-8 pb-16 font-sans text-slate-200">
      
      {/* Console title banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20 mb-2 font-mono">
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
            System Status: Connected to Google Sheet Tab
          </div>
          <h3 className="font-sans text-xl font-bold text-white font-sans">DealFlow Backoffice Console</h3>
          <p className="font-sans text-xs text-slate-400">Add campaign deals, register referral codes, and handle buyer cashbacks.</p>
        </div>

        {/* Console view tabs */}
        <div className="flex flex-wrap gap-1 rounded-2xl bg-[#090a16] border border-slate-800 p-1.5 font-sans text-xs font-semibold text-slate-400">
          {tabsConfig.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-605 text-white shadow-lg shadow-indigo-600/15 font-bold ring-1 ring-indigo-500/20' 
                    : 'text-slate-450 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white animate-pulse' : 'text-slate-500'}`} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Block */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl shadow-lg shadow-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300 flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-sans text-xs text-slate-400">Cashback Disbursed</span>
            <span className="block font-sans text-lg font-extrabold text-[#1bc2ff] mt-0.5 font-mono">${kpi.totalDisbursed.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl shadow-lg shadow-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300 flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-sans text-xs text-slate-400">Ledger Submissions</span>
            <span className="block font-sans text-lg font-extrabold text-white mt-0.5 font-mono">{kpi.totalOrders} Orders</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl shadow-lg shadow-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300 flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-405 border border-amber-500/20">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-sans text-xs text-slate-400">Campaign Deals</span>
            <span className="block font-sans text-lg font-extrabold text-white mt-0.5 font-mono">{kpi.totalProducts} Items</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl shadow-lg shadow-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300 flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-405 border border-rose-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-sans text-xs text-slate-400">Connected Agents</span>
            <span className="block font-sans text-lg font-extrabold text-white mt-0.5 font-mono">{kpi.totalAgents} Members</span>
          </div>
        </div>
      </div>

      {/* RENDER SPACE CHANNELS */}
      
      {/* Tab 1: Analytics and Performance Stats */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Dynamic AI Insights Engine Widget */}
          <div className="col-span-1 lg:col-span-12 bg-gradient-to-r from-indigo-50/70 to-purple-50/40 border border-indigo-100 rounded-3xl p-6 shadow-2xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Sparkles className="h-24 w-24 text-indigo-755" />
            </div>

            <div className="space-y-2 max-w-4xl relative z-10 font-sans">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/10 px-3 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-650/15">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                Operations Intelligence Engine (Gemini AI Powered)
              </div>
              <h4 className="text-sm font-bold text-slate-850">Active Strategic Playbook</h4>
              <p className="text-xs text-slate-500 leading-normal font-normal">
                AI analyzes active sheets database records to check pending cashback risks, dealer merchant commissions, and affiliate growth steps.
              </p>

              {/* Insights content display */}
              <div className="pt-2">
                {insightsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold animate-pulse my-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                    Calculating operational suggestions from ledger databases...
                  </div>
                ) : insights.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-3xs flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-semibold">
                        <span className="text-sm shrink-0">
                          {insight.startsWith('⚠️') ? '⚠️' : insight.startsWith('💡') ? '💡' : insight.startsWith('🎯') ? '🎯' : '💡'}
                        </span>
                        <div>
                          <p className="whitespace-pre-line text-slate-700">
                            {insight.replace(/^[⚠️💡🎯]\s*/, '')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">
                    Operational data loaded. Click 'Regenerate Playbook' to compile live analysis.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={fetchInsights}
              disabled={insightsLoading}
              className="rounded-xl bg-white border border-slate-205 hover:border-slate-300 text-slate-700 hover:text-slate-950 px-4 py-2 text-xs font-bold shadow-3xs flex items-center gap-1.5 shrink-0 transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${insightsLoading ? 'animate-spin text-indigo-600' : ''}`} />
              Regenerate Playbook
            </button>
          </div>
          
          {/* Agent leaderboard stats */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h4 className="font-sans text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-500" />
                Referral Agent Performance Leaderboard
              </h4>
              <p className="font-sans text-xs text-slate-500">Commission rates are paid proportionally to referred transactions.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full table-auto text-left font-sans text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Agent Details</th>
                    <th className="px-4 py-2.5">Referral ID</th>
                    <th className="px-4 py-2.5">WhatsApp Contact</th>
                    <th className="px-4 py-2.5 text-center">Sales volume</th>
                    <th className="px-4 py-2.5">Total Commission</th>
                    <th className="px-4 py-2.5">Profile Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{agent.name}</td>
                      <td className="px-4 py-3 font-mono text-purple-600 bg-purple-50 rounded text-[11px] font-bold inline-block my-2">{agent.referralCode}</td>
                      <td className="px-4 py-3">{agent.whatsApp}</td>
                      {/* Calculate true volume from orders dynamically to stay synchronous */}
                      <td className="px-4 py-3 text-center text-slate-900 font-bold">
                        {orders.filter(o => o.agentReferralCode.toLowerCase() === agent.referralCode.toLowerCase()).length}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">${agent.commission.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block border rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          agent.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity audit logger */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="font-sans text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-indigo-600" />
              Recent Transaction Log
            </h4>
            
            <div className="divide-y divide-slate-100 text-xs">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-2.5 flex justify-between gap-3 font-sans">
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-800 truncate max-w-[200px]" title={ord.productName}>
                      {ord.buyerName} ordered {ord.productName}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400">Amazon ID: {ord.id}</span>
                  </div>
                  <span className={`inline-block shrink-0 border rounded-full h-fit px-2 py-0.5 text-[9px] font-bold ${statusColors[ord.orderStatus]}`}>
                    {ord.orderStatus}
                  </span>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-center py-6 text-slate-400">No activity registered today</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Products Database CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fadeIn">
          {productModal.isOpen ? (
            <div className="space-y-6 bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800 animate-fadeIn text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">Operations Database Portal</span>
                  <h4 className="text-xl font-sans font-black text-white">
                    {productModal.data ? '⚡ Modify Active Product Offer' : '🚀 Register New Cashback Deal'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-2xl font-light">
                    Configure your deal specifications, custom affiliate references, dealer info and imagery. Every field will automatically sync back to your live Google Sheets and local storage index.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setProductModal({ isOpen: false })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-sans text-xs font-bold text-slate-200 transition-all cursor-pointer border border-slate-700 hover:text-white shrink-0"
                >
                  <span>← Back to Products List</span>
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* LEFT PANEL: Basic & Linking Specifications */}
                  <div className="space-y-5 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/60 shadow-lg text-left">
                    <h5 className="text-xs font-extrabold text-[#1bc2ff] tracking-wider uppercase font-mono border-b border-slate-800/80 pb-2">1. Primary Information & Affiliate Links</h5>
                    
                    <div className="space-y-2 text-left">
                      <label className="block font-bold text-slate-300 text-xs text-left">Product Display Name <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Anker Soundcore Space Q45 Headphones" 
                        value={pName} 
                        onChange={(e) => setPName(e.target.value)} 
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium placeholder:text-slate-650 transition" 
                      />
                      <span className="text-[10px] text-slate-500 block text-left">Provide the precise item title as it should appear in the Amazon store.</span>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="block font-bold text-slate-300 text-xs text-left">Amazon Affiliate or Direct Link URL <span className="text-rose-550">*</span></label>
                      <input 
                        type="url" 
                        required 
                        placeholder="https://www.amazon.com/dp/B0B1HL44P9" 
                        value={pLink} 
                        onChange={(e) => setPLink(e.target.value)} 
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium placeholder:text-slate-655 transition" 
                      />
                      <span className="text-[10px] text-slate-505 block text-left">The destination affiliate URL which users will use to purchase on Amazon.</span>
                    </div>

                    <div className="bg-indigo-950/20 border border-indigo-500/20 p-5 rounded-2xl space-y-2 text-[11px] text-slate-405 text-left">
                      <h6 className="font-bold text-zinc-300 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Auto-Generated Tracking Code</h6>
                      <p className="leading-relaxed font-normal">
                        Each live buyer referral will append its designated agent referral tag to this link. Ensure there are no session parameters that override user clicks.
                      </p>
                    </div>
                  </div>

                  {/* RIGHT PANEL: Financial, Category, Vendor & Photo Specifications */}
                  <div className="space-y-5 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/60 shadow-lg text-left">
                    <h5 className="text-xs font-extrabold text-[#1bc2ff] tracking-wider uppercase font-mono border-b border-slate-800/80 pb-2">2. Financials, Categories & Visual Assets</h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 text-left">
                        <label className="block font-bold text-slate-300 text-xs text-left">Cashback Rebate ($ Amount) <span className="text-rose-500">*</span></label>
                        <input 
                          type="number" 
                          required 
                          min="1" 
                          step="0.01" 
                          placeholder="e.g. 15.00" 
                          value={pCashback} 
                          onChange={(e) => setPCashback(e.target.value)} 
                          className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold font-mono transition" 
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="block font-bold text-slate-300 text-xs text-left">Tax / Deal Category</label>
                        <select 
                          value={pCat} 
                          onChange={(e) => setPCat(e.target.value)} 
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium transition"
                        >
                          {productCategories.map(c => <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-transparent">
                      <div className="space-y-2 text-left bg-transparent">
                        <label className="block font-bold text-slate-300 text-xs text-left">Seller Brand Owner <span className="text-rose-500">*</span></label>
                        <input 
                          type="text"
                          value={pSeller} 
                          onChange={(e) => setPSeller(e.target.value)} 
                          placeholder="e.g. AnkerDirect US, Logitech Depot"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold transition"
                          required
                        />
                      </div>

                      <div className="space-y-2 text-left bg-transparent">
                        <label className="block font-bold text-slate-300 text-xs text-left">Display / Listing Status</label>
                        <select 
                          value={pStatus} 
                          onChange={(e) => setPStatus(e.target.value as any)} 
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-505 focus:ring-1 focus:ring-indigo-505 font-medium transition"
                        >
                          <option value="Active" className="bg-slate-950 text-white">Active (Visible)</option>
                          <option value="Paused" className="bg-slate-955 text-white">Paused (Unlisted)</option>
                          <option value="Out of Stock" className="bg-slate-955 text-white">Out of Stock</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="block font-bold text-slate-300 text-xs text-left">Optional Campaign End Date</label>
                      <input 
                        type="date" 
                        value={pDeadline} 
                        onChange={(e) => setPDeadline(e.target.value)} 
                        className="w-full rounded-xl border border-slate-800 bg-[#090b16] px-4 py-3 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                      />
                    </div>

                    {/* Drag & Drop uploader zone */}
                    <div className="space-y-2 pt-2 text-left bg-transparent">
                      <label className="block font-bold text-slate-300 text-xs text-left">Product Image / Media Asset</label>
                      
                      <div 
                        onDragEnter={(e) => { e.preventDefault(); setProductDragActive(true); }}
                        onDragOver={(e) => { e.preventDefault(); setProductDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setProductDragActive(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setProductDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = () => {
                                setPImage(reader.result as string);
                              };
                            }
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                          productDragActive 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : pImage 
                              ? 'border-emerald-500/40 bg-emerald-500/5' 
                              : 'border-slate-800 hover:border-indigo-505 bg-slate-950/40 hover:bg-slate-950/80 cursor-pointer'
                        }`}
                      >
                        {pImage ? (
                          <div className="flex items-center gap-4 text-left">
                            <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-800 bg-neutral-950">
                              <img 
                                src={pImage} 
                                alt="Uploaded product" 
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-white text-xs">Image Loaded Successfully!</span>
                              <span className="block text-[10px] text-slate-400 truncate">Embedded Base64 data encoded</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setPImage('')}
                              className="rounded-lg bg-red-500/15 hover:bg-red-500/30 text-rose-450 px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-2">
                            <Upload className="h-6 w-6 mx-auto text-indigo-400" />
                            <p className="text-xs text-slate-300 font-semibold font-sans">
                              Drag & drop product image layout, or{' '}
                              <button 
                                type="button" 
                                onClick={() => productImageInputRef.current?.click()}
                                className="text-[#1bc2ff] font-extrabold hover:underline cursor-pointer"
                              >
                                browse local files
                              </button>
                            </p>
                            <p className="text-[10px] text-slate-500 text-center">PNG, JPG, JPEG formats welcome</p>
                          </div>
                        )}
                        <input 
                          type="file"
                          ref={productImageInputRef}
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              if (file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = () => {
                                  setPImage(reader.result as string);
                                };
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </div>

                      <div className="pt-2 bg-transparent text-left">
                        <span className="block text-[10px] text-slate-450 font-bold mb-1">... Or paste external web image URL directly:</span>
                        <input 
                          type="url" 
                          placeholder="Paste a direct image URL (https://...)" 
                          value={pImage.startsWith('data:image/') ? '' : pImage} 
                          onChange={(e) => setPImage(e.target.value)} 
                          className="w-full rounded-xl border border-slate-800 bg-[#090b16] px-4 py-2.5 text-white text-xs focus:outline-none focus:border-indigo-500" 
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {formError && (
                  <div className="text-rose-455 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-2 text-xs text-left">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-850 text-xs">
                  <button 
                    type="button" 
                    onClick={() => setProductModal({ isOpen: false })} 
                    className="rounded-xl px-5 py-3 font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition cursor-pointer"
                  >
                    Cancel Changes
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-6 py-3 shadow-lg shadow-indigo-650/20 transition cursor-pointer"
                  >
                    🚀 Save Deal & Sync Google Sheet
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-3 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-sans text-sm font-bold text-white">Products Listing Inventory</h4>
                    <p className="font-sans text-xs text-slate-400">Edit, activate, pause, or configure Amazon dealer link offers</p>
                  </div>
                  <button
                    onClick={() => openProductForm()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-sans text-xs font-bold text-white px-4 py-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-indigo-650/15 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product Offer
                  </button>
                </div>

                {products.length > 0 && (
                  <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/80 rounded-2xl px-4 py-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-bold select-none">
                      <input 
                        type="checkbox" 
                        checked={products.length > 0 && selectedIds.length === products.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(products.map(p => p.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                      <span>Select All ({products.length} Products)</span>
                    </label>
                    
                    {selectedIds.length > 0 && onBulkDeleteProducts && (
                      <button
                        onClick={() => onBulkDeleteProducts(selectedIds)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold hover:bg-rose-500/25 transition text-xs cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Bulk Delete ({selectedIds.length})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {products.map(prod => (
                  <div key={prod.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 shadow-md flex gap-3 hover:border-indigo-500/30 transition-all text-left relative group">
                    <div className="flex items-start pt-1 shrink-0">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(prod.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, prod.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== prod.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer shrink-0"
                      />
                    </div>
                    <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-slate-800 flex items-center justify-center">
                      <img 
                        src={prod.imageUrl} 
                        alt={prod.name} 
                        className="h-full w-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 font-sans text-xs leading-none">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-slate-950 px-2 py-0.5 text-[9px] text-[#1bc2ff] font-extrabold uppercase border border-slate-800">{prod.category}</span>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                          prod.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-550/20' 
                            : prod.status === 'Paused'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-550/20'
                              : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}>{prod.status}</span>
                      </div>
                      <h5 className="font-extrabold text-slate-100 text-xs truncate pt-1 leading-normal" title={prod.name}>{prod.name}</h5>
                      <p className="text-[11px] text-slate-400">Cashback Amount: <strong className="text-emerald-400">${prod.cashbackAmount.toFixed(2)}</strong></p>
                      <p className="text-[11px] text-indigo-400 font-semibold truncate leading-normal">Seller Account: {prod.sellerName}</p>

                      <div className="flex items-center justify-between pt-2">
                        <a href={prod.amazonLink} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-slate-500 hover:text-white text-[10px] font-bold hover:underline">
                          Link <ExternalLink className="h-2.5 w-2.5" />
                        </a>

                        <div className="flex gap-2">
                          <button onClick={() => openProductForm(prod)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition cursor-pointer" title="Edit Offer">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => onDeleteProduct(prod.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition cursor-pointer" title="Delete Offer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

             {/* Tab 3: Agents Network CRUD */}
      {activeTab === 'agents' && (
        <div className="space-y-6 animate-fadeIn font-sans text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-sans text-sm font-bold text-white">Affiliate Agents Registry</h4>
              <p className="font-sans text-xs text-slate-400 font-normal">Manage the agents permitted to register referred cashback sales</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && onBulkDeleteAgents && (
                <button
                  onClick={() => onBulkDeleteAgents(selectedIds)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-sans text-xs font-bold px-4 py-2 hover:bg-rose-500/25 transition-all shadow-md cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => openAgentForm()}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-sans text-xs font-bold text-white px-4 py-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md shadow-indigo-650/15"
              >
                <UserPlus className="h-4 w-4" />
                Add Agent Affiliate
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left min-w-max">
                <thead className="bg-[#090b16] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={agents.length > 0 && selectedIds.length === agents.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(agents.map(a => a.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-4">Agent ID</th>
                    <th className="px-5 py-4">Sales Agent Name</th>
                    <th className="px-5 py-4">WhatsApp</th>
                    <th className="px-5 py-4">Referral Code</th>
                    <th className="px-5 py-4">Total Referrals</th>
                    <th className="px-5 py-4">Earned Margin</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                  {agents.map(a => (
                    <tr key={a.id} className={`hover:bg-slate-800/30 transition-colors ${selectedIds.includes(a.id) ? 'bg-indigo-950/20' : ''}`}>
                      <td className="px-5 py-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, a.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== a.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-[10px]">{a.id}</td>
                      <td className="px-5 py-4 font-extrabold text-[#1bc2ff]">{a.name}</td>
                      <td className="px-5 py-4">{a.whatsApp}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded text-[11px]">
                          {a.referralCode}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-200">{orders.filter(o => o.agentReferralCode.toLowerCase() === a.referralCode.toLowerCase()).length}</td>
                      <td className="px-5 py-4 text-emerald-400 font-bold">${a.commission.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button onClick={() => openDraftModal('agent_recruitment', a)} className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/25 p-1.5 rounded-lg transition cursor-pointer" title="AI Outreach & WhatsApp Template">
                            <Sparkles className="h-4 w-4" />
                          </button>
                          <button onClick={() => openAgentForm(a)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800/50 rounded-lg transition cursor-pointer" title="Edit Agent">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => onDeleteAgent(a.id)} className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800/50 rounded-lg transition cursor-pointer" title="Delete Agent">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Sellers Portfolio CRUD */}
      {activeTab === 'sellers' && (
        <div className="space-y-6 animate-fadeIn font-sans text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-sans text-sm font-bold text-white">Dealer Merchants & Sellers</h4>
              <p className="font-sans text-xs text-slate-400 font-normal">Add, track, and assign promotional products back to business brands</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && onBulkDeleteSellers && (
                <button
                  onClick={() => onBulkDeleteSellers(selectedIds)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-sans text-xs font-bold px-4 py-2 hover:bg-rose-500/25 transition-all shadow-md cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => openSellerForm()}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-sans text-xs font-bold text-white px-4 py-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md shadow-indigo-650/15"
              >
                <Plus className="h-4 w-4" />
                Add Brand Seller
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left min-w-max">
                <thead className="bg-[#090b16] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={sellers.length > 0 && selectedIds.length === sellers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(sellers.map(s => s.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-4">Seller ID</th>
                    <th className="px-5 py-4">Merchant Name</th>
                    <th className="px-5 py-4">WhatsApp Hotline</th>
                    <th className="px-5 py-4">Email Address</th>
                    <th className="px-5 py-4 text-center">Linked Products</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                  {sellers.map(s => (
                    <tr key={s.id} className={`hover:bg-slate-800/30 transition-colors ${selectedIds.includes(s.id) ? 'bg-indigo-950/20' : ''}`}>
                      <td className="px-5 py-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, s.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== s.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-[10px]">{s.id}</td>
                      <td className="px-5 py-4 font-extrabold text-[#1bc2ff]">{s.name}</td>
                      <td className="px-5 py-4">{s.whatsApp}</td>
                      <td className="px-5 py-4 text-slate-405 font-mono">{s.email}</td>
                      <td className="px-5 py-4 text-center font-bold text-slate-200">
                        {products.filter(p => p.sellerName.toLowerCase() === s.name.toLowerCase()).length}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button onClick={() => openSellerForm(s)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800/50 rounded-lg transition cursor-pointer" title="Edit Seller">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => onDeleteSeller(s.id)} className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800/50 rounded-lg transition cursor-pointer" title="Delete Seller">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Buyers Ledger CRUD */}
      {activeTab === 'buyers' && (
        <div className="space-y-6 animate-fadeIn font-sans text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-sans text-sm font-bold text-white">Buyer Customer Accounts Database</h4>
              <p className="font-sans text-xs text-slate-400 font-normal">Generate secure, unique sign-in names, audit and view payout preferences for cashback users</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && onBulkDeleteBuyers && (
                <button
                  onClick={() => onBulkDeleteBuyers(selectedIds)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-sans text-xs font-bold px-4 py-2 hover:bg-rose-500/25 transition-all shadow-md cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => openBuyerForm()}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 font-sans text-xs font-bold text-white px-4 py-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md shadow-indigo-650/15"
              >
                <Plus className="h-4 w-4" />
                Create Buyer Accounts
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Registered Buyers</p>
                <h5 className="text-xl font-extrabold text-white mt-1">{buyers.length}</h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg">💡</div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Credentials</p>
                <h5 className="text-xl font-extrabold text-emerald-400 mt-1">
                  {buyers.filter(b => b.status === 'Active').length}
                </h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-lg">✅</div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Zelle/PayPal Handles</p>
                <h5 className="text-xl font-extrabold text-indigo-400 mt-1">
                  {buyers.filter(b => b.paymentMethod === 'Zelle' || b.paymentMethod === 'PayPal').length}
                </h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg">⚡</div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CashApp/Venmo Handles</p>
                <h5 className="text-xl font-extrabold text-purple-400 mt-1">
                  {buyers.filter(b => b.paymentMethod === 'CashApp' || b.paymentMethod === 'Venmo').length}
                </h5>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-lg">📱</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left min-w-max">
                <thead className="bg-[#090b16] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="px-5 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={buyers.length > 0 && selectedIds.length === buyers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(buyers.map(b => b.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-4">Buyer ID</th>
                    <th className="px-5 py-4">Unique Login Name</th>
                    <th className="px-5 py-4">FullName</th>
                    <th className="px-5 py-4">WhatsApp No</th>
                    <th className="px-5 py-4">Payout Detail</th>
                    <th className="px-5 py-4 text-center">Cashback Orders</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                  {buyers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-slate-500 font-sans">
                        No registered buyer accounts found. Create one above to get started!
                      </td>
                    </tr>
                  ) : (
                    buyers.map(b => {
                      const countOrders = orders.filter(o => {
                        const orderWhatsAppClean = (o.buyerWhatsApp || '').trim().replace(/\D/g, '');
                        const sessionWhatsAppClean = (b.whatsApp || '').trim().replace(/\D/g, '');
                        return (
                          (o.buyerName || '').trim().toLowerCase() === (b.name || '').trim().toLowerCase() ||
                          (sessionWhatsAppClean && orderWhatsAppClean === sessionWhatsAppClean) ||
                          (o.paymentId || '').trim().toLowerCase() === (b.paymentId || '').trim().toLowerCase()
                        );
                      }).length;

                      return (
                        <tr key={b.id || b.username} className={`hover:bg-slate-800/30 transition-colors font-sans ${selectedIds.includes(b.id) ? 'bg-indigo-950/20' : ''}`}>
                          <td className="px-5 py-4 w-10">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(b.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(prev => [...prev, b.id]);
                                } else {
                                  setSelectedIds(prev => prev.filter(id => id !== b.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-700 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-mono text-[10px]">{b.id || 'N/A'}</td>
                          <td className="px-5 py-4 font-mono text-indigo-400 font-bold">@{b.username}</td>
                          <td className="px-5 py-4 font-bold text-white">{b.name}</td>
                          <td className="px-5 py-4 text-slate-300 font-mono">{b.whatsApp}</td>
                          <td className="px-5 py-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 mr-2 text-slate-300">
                              {b.paymentMethod}
                            </span>
                            <span className="font-mono text-slate-400 text-xs">{b.paymentId}</span>
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-indigo-400 text-sm">
                            {countOrders}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}>{b.status || 'Active'}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2 text-slate-400">
                              <button onClick={() => openBuyerForm(b)} className="hover:text-white p-1.5 hover:bg-slate-800/50 rounded-lg transition cursor-pointer" title="Edit Buyer">
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button onClick={() => onDeleteBuyer(b.id)} className="hover:text-rose-400 p-1.5 hover:bg-slate-800/50 rounded-lg transition cursor-pointer" title="Delete Buyer">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: All Orders Ledger */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fadeIn font-sans text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1c1d3c] pb-3">
            <div>
              <h4 className="font-sans text-sm font-bold text-white">Global Customer Ledger Spreadsheet</h4>
              <p className="font-sans text-xs text-slate-400">Live view of every order registered in your active Sheets database</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && onBulkDeleteOrders && (
                <button
                  onClick={() => onBulkDeleteOrders(selectedIds)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-sans text-xs font-bold px-4 py-2 hover:bg-rose-500/25 transition-all shadow-md cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete ({selectedIds.length})
                </button>
              )}
              <a 
                href="https://docs.google.com/spreadsheets/d/1gWmKluPLT4-w_I_6mvzYeTt_70cCUdg61LaH-AVI4HY/edit?gid=1144607957#gid=1144607957"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 text-xs transition duration-200 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <span>📊 Open Live Spreadsheet</span>
              </a>
            </div>
          </div>

          <div className="bg-[#0f1026]/90 border border-[#191b35] rounded-3xl overflow-x-auto shadow-2xl backdrop-blur-md">
            <table className="w-full table-auto text-left border-collapse">
              <thead className="bg-[#090a16] border-b border-[#1c1d3c] text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={orders.length > 0 && selectedIds.length === orders.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(orders.map(o => o.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-750 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-4">Order ID & Date</th>
                  <th className="px-5 py-4">Product Details</th>
                  <th className="px-5 py-4">Buyer Contact</th>
                  <th className="px-5 py-4">Referring Agent</th>
                  <th className="px-5 py-4 text-center">Purchase & Delivery Proofs</th>
                  <th className="px-5 py-4 text-center">Receipt Status</th>
                  <th className="px-5 py-4">Transaction notes</th>
                  <th className="px-5 py-4 text-center">Actions Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181932] text-slate-200">
                {orders.map(o => (
                  <tr key={o.id} className={`hover:bg-[#14152f]/50 transition-colors ${selectedIds.includes(o.id) ? 'bg-indigo-950/20' : ''}`}>
                    <td className="px-5 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(o.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, o.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== o.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-750 text-indigo-650 focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="block font-mono font-bold text-[#1bc2ff]">{o.id}</span>
                      <span className="block text-[9.5px] text-slate-450 mt-1 font-sans">{new Date(o.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5 max-w-[180px]">
                        <span className="block font-bold text-slate-100 truncate" title={o.productName}>{o.productName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="block font-extrabold text-slate-100">{o.buyerName}</span>
                      <span className="block text-[10px] text-indigo-400 mt-0.5">{o.buyerWhatsApp}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold block text-slate-200">{o.agentName}</span>
                      <span className="font-mono text-[9px] text-[#ff4fa3] bg-[#ff4fa3]/10 border border-[#ff4fa3]/20 px-1.5 py-0.5 rounded leading-none mt-1 inline-block">?ref={o.agentReferralCode}</span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        {/* Purchase Proof Thumbnail */}
                        <div className="text-center">
                          <span className="block text-[8px] uppercase font-mono text-slate-400 mb-1">Purchase</span>
                          {o.screenshotLink ? (
                            <a 
                              href={o.screenshotLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="group relative inline-block h-10 w-10 rounded-lg overflow-hidden border border-slate-700 bg-neutral-950 transition-all hover:border-indigo-500 hover:scale-105"
                              title="Click to view full Purchase Proof image"
                            >
                              <img 
                                src={o.screenshotLink} 
                                alt="Purchase proof" 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="h-3 w-3 text-white" />
                              </div>
                            </a>
                          ) : (
                            <span className="text-[9px] text-slate-500 block h-10 w-10 flex items-center justify-center border border-dashed border-slate-800 rounded-lg">None</span>
                          )}
                        </div>

                        {/* Delivery Proof Thumbnail */}
                        <div className="text-center">
                          <span className="block text-[8px] uppercase font-mono text-slate-400 mb-1">Delivery</span>
                          {o.deliveryScreenshotUrl ? (
                            <a 
                              href={o.deliveryScreenshotUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="group relative inline-block h-10 w-10 rounded-lg overflow-hidden border border-slate-700 bg-neutral-950 transition-all hover:border-indigo-500 hover:scale-105"
                              title="Click to view full Delivery Proof image"
                            >
                              <img 
                                src={o.deliveryScreenshotUrl} 
                                alt="Delivery proof" 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="h-3 w-3 text-white" />
                              </div>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500 block h-10 w-10 flex items-center justify-center border border-dashed border-slate-800 rounded-lg">None</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[o.orderStatus]}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5 leading-tight max-w-[170px]">
                        {o.sellerNotes ? (
                          <span className="block text-[10.5px] text-amber-400 italic font-medium">" {o.sellerNotes} "</span>
                        ) : (
                          <span className="block text-[10.5px] text-slate-500">No notes recorded</span>
                        )}
                        {o.cashbackProof ? (
                          <div className="inline-block font-mono text-[9px] font-bold text-[#00e5a0] bg-[#00e5a0]/10 border border-[#00e5a0]/20 px-1.5 py-0.5 rounded">
                            ID: {o.cashbackProof}
                          </div>
                        ) : (
                          o.paymentMethod && (
                            <div className="text-[9.5px] text-slate-400">
                              Method: <strong className="text-indigo-300">{o.paymentMethod}</strong> (ID: <span className="font-mono text-slate-300">{o.paymentId || 'N/A'}</span>)
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {o.orderStatus === 'Pending' && (
                          <button
                            onClick={() => openStatusModal(o, 'Ordered')}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-black px-2.5 py-1.5 rounded-xl text-[10px] uppercase shadow-lg shadow-purple-600/15 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                            title="Approve Shipment"
                          >
                            <span>🚚</span>
                            <span>Approve Shipment</span>
                          </button>
                        )}
                        {o.orderStatus === 'Ordered' && (
                          <button
                            onClick={() => openStatusModal(o, 'Delivered')}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-black px-2.5 py-1.5 rounded-xl text-[10px] uppercase shadow-lg shadow-amber-600/15 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                            title="Approve Delivery"
                          >
                            <span>📦</span>
                            <span>Approve Delivery</span>
                          </button>
                        )}
                        {o.orderStatus === 'Delivered' && (
                          <button
                            onClick={() => openStatusModal(o, 'Cashback Sent')}
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-[10px] uppercase shadow-lg shadow-emerald-500/15 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                            title="Disburse Cashback"
                          >
                            <span>💸</span>
                            <span>Complete Cashback</span>
                          </button>
                        )}
                        {o.orderStatus === 'Cashback Sent' && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-emerald-400 font-extrabold text-[10px]">
                            <span>✅ Verified & Paid</span>
                          </div>
                        )}
                        {o.orderStatus === 'Refunded' && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 border border-teal-500/20 px-2 py-1 text-teal-400 font-extrabold text-[10px]">
                            <span>🔄 Refunded</span>
                          </div>
                        )}
                        {o.orderStatus === 'Rejected' && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-1 text-rose-450 font-extrabold text-[10px]">
                            <span>❌ Order Flagged</span>
                          </div>
                        )}
                        
                        {/* More Action Tools */}
                        {o.orderStatus !== 'Refunded' && (
                          <button
                            onClick={() => openStatusModal(o, 'Refunded')}
                            className="bg-teal-600 hover:bg-teal-500 text-white font-black px-2.5 py-1.5 rounded-xl text-[10px] uppercase shadow-lg shadow-teal-600/15 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                            title="Issue Refund & Upload Proof"
                          >
                            <span>🔄 Refund</span>
                          </button>
                        )}
                        {o.orderStatus !== 'Cashback Sent' && o.orderStatus !== 'Rejected' && o.orderStatus !== 'Refunded' && (
                          <button
                            onClick={() => openStatusModal(o, 'Rejected')}
                            className="text-slate-450 hover:text-rose-450 p-1.5 rounded-lg hover:bg-[#1a1c38] transition cursor-pointer"
                            title="Reject or Flag issue with this order"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        
                        {/* General Edit/Settings Button to edit notes/screenshots at any stage */}
                        <button
                          onClick={() => openStatusModal(o, o.orderStatus)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                          title="Edit Order Notes/Screenshots"
                        >
                          <span>⚙️</span>
                        </button>
                        <button 
                          onClick={() => openDraftModal('cashback_status_alert', o)} 
                          className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-505/20 p-1.5 rounded-lg transition shrink-0 cursor-pointer" 
                          title="Generate AI Custom WhatsApp Status Ping"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                        </button>
                        {onDeleteOrder && (
                          <button 
                            onClick={() => onDeleteOrder(o.id)} 
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1.5 rounded-lg transition shrink-0 cursor-pointer border border-rose-900/10" 
                            title="Delete Order Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-500">
                      No active orders found in Google Sheets database ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: AI Copilot Terminal */}
      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans animate-fadeIn">
          {/* Chat Window */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[2.2rem] shadow-xl overflow-hidden flex flex-col h-[520px] relative">
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Operations Intelligence Terminal
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </h4>
                  <p className="text-[10.5px] text-slate-400">Powered by Gemini 3.5 Flash • Active State Synced</p>
                </div>
              </div>
              <button 
                onClick={() => setCopilotMessages([
                  { role: 'assistant', content: "Welcome to the Happiness Hub Operations Command. I'm your AI Copilot—trained to analyze referral networks, draft high-conversion WhatsApp copy, list insights, or query the live sheets and simulated portfolios. How can I facilitate your work today?" }
                ])}
                className="text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-705 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border border-slate-700"
              >
                Clear Chats
              </button>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
              {copilotMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                  <div className={`max-w-[85%] rounded-[1.3rem] p-4 text-[11.5px] leading-relaxed border ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                      : 'bg-slate-950/85 text-slate-205 border-slate-800'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="whitespace-pre-line prose prose-invert max-w-none text-slate-205">
                        {msg.content}
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isCopilotLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-slate-950/80 border border-slate-850 text-slate-400 max-w-[85%] rounded-2xl p-4 flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span>Copilot formulating strategy based on active lists...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleCopilotSubmit} className="bg-slate-950 p-4 border-t border-slate-850 flex gap-2">
              <input
                type="text"
                placeholder="Ask anything (e.g. 'rank topmost productive agents', 'draft a promotional template', 'payout backlog check')"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                disabled={isCopilotLoading}
                className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 font-medium"
              />
              <button
                type="submit"
                disabled={isCopilotLoading || !copilotInput.trim()}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 flex items-center justify-center transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Quick Tasks Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-[2.2rem] p-6 shadow-xs space-y-4 font-sans">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tactical Presets</h4>
              </div>
              <p className="text-[11px] text-slate-550 leading-normal font-normal">
                Trigger immediate business intelligence analysis from the Gemini AI engine:
              </p>

              <div className="space-y-2 pt-1 font-sans">
                {[
                  { label: "📊 Perform comprehensive database audit", query: "Can you run a comprehensive operational dashboard audit? Rank the top performing affiliate agents by volume, calculate our average cashback percentage, identify any potential processing concerns where cashback is pending, and outline 3 critical immediate strategies." },
                  { label: "📢 Draft agent recruitment WhatsApp model", query: "Draft an engaging, motivational WhatsApp broadcast outreach to recruit new cashback affiliate agents. Emphasize that we have premium products ready for cashback and they can earn generous commissions immediately!" },
                  { label: "🤝 Optimize agent growth rates", query: "Look at our list of agents and analyze their progress. Who represents our most stable referral vector and how should we align our cash incentives to scale things up by 50% this month?" },
                  { label: "⚠️ Identify backlog blocks & pending orders", query: "Audit all order transactions in our ledger. Tell me if there are pending, delivered, or PayPal status backlogs that require urgent communication to the buyer or seller." }
                ].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCopilotInput(opt.query);
                    }}
                    disabled={isCopilotLoading}
                    className="w-full text-left bg-slate-50 border border-slate-150 hover:border-indigo-150 hover:bg-indigo-50/20 p-3 rounded-2xl text-[11px] text-slate-650 hover:text-indigo-700 font-semibold transition flex items-start gap-2 group cursor-pointer"
                  >
                    <span className="shrink-0 text-indigo-505 group-hover:scale-110 transition mt-0.5">•</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Registers State summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.2rem] p-6 shadow-xs space-y-3.5 text-slate-150 font-sans">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Live State registers
              </h5>
              <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>PRODUCTS:</span>
                  <span className="text-emerald-400 font-bold">{products.length} DEALS</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>ORDERS:</span>
                  <span className="text-emerald-400 font-bold">{orders.length} ITEMS</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span>ACTIVE AGENTS:</span>
                  <span className="text-emerald-400 font-bold">{agents.filter(a => a.status === 'Active').length} REG</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>SELLERS:</span>
                  <span className="text-emerald-400 font-bold">{sellers.length} BRAND</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal now handled full-subpage inside activeTab */}

      {/* Agent Form Modal */}
      {agentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans text-xs backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[2.2rem] bg-white shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">{agentModal.data ? 'Modify Agent' : 'Register New Agent'}</h3>
              <button onClick={() => setAgentModal({ isOpen: false })} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAgentSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Agent Full Name <span className="text-red-500">*</span></label>
                <input type="text" required placeholder="e.g. Sarah Connor" value={aName} onChange={(e) => setAName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Referral Code <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder="e.g. agent01" disabled={!!agentModal.data} value={aCode} onChange={(e) => setACode(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none disabled:bg-slate-50 font-bold" />
                  <p className="text-[10px] text-slate-400">Must be unique, letters/numbers only</p>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">WhatsApp <span className="text-red-500">*</span></label>
                  <input type="tel" required placeholder="e.g. +1 (555) 111-2222" value={aWhatsApp} onChange={(e) => setAWhatsApp(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Account status</label>
                <select value={aStatus} onChange={(e) => setAStatus(e.target.value as any)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-805 focus:outline-none focus:border-indigo-500 bg-white font-medium">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {formError && (
                <div className="text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg flex items-start gap-1">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setAgentModal({ isOpen: false })} className="rounded-lg px-4 py-2 border font-semibold text-slate-650 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 py-2 shadow-xs transition-all shadow-indigo-600/10">Sync Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller Form Modal */}
      {sellerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans text-xs backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[2.2rem] bg-white shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">{sellerModal.data ? 'Modify Brand Seller' : 'Register New Brand Seller'}</h3>
              <button onClick={() => setSellerModal({ isOpen: false })} className="p-1 rounded-lg text-slate-405 hover:bg-slate-100 hover:text-slate-600 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSellerSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-705">Seller Brand Name <span className="text-red-500">*</span></label>
                <input type="text" required placeholder="e.g. Logitech Depot" value={sName} onChange={(e) => setSName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-505 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-705">WhatsApp Hotline <span className="text-red-500">*</span></label>
                  <input type="tel" required placeholder="e.g. +1 (555) 777-6666" value={sWhatsApp} onChange={(e) => setSWhatsApp(e.target.value)} className="w-full rounded-lg border border-slate-202 px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-505 font-medium" />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-705">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" required placeholder="deals@logitech.com" value={sEmail} onChange={(e) => setSEmail(e.target.value)} className="w-full rounded-lg border border-slate-202 px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-505 font-medium" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-707">Account status</label>
                <select value={sStatus} onChange={(e) => setSStatus(e.target.value as any)} className="w-full rounded-lg border border-slate-202 px-3 py-2 text-slate-805 focus:outline-none focus:border-indigo-505 bg-white font-medium">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {formError && (
                <div className="text-red-656 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-start gap-1 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-505" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setSellerModal({ isOpen: false })} className="rounded-lg px-4 py-2 border font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-indigo-650 hover:bg-indigo-705 text-white font-bold px-5 py-2 shadow-xs transition-all shadow-indigo-600/10">Sync Seller</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active AI Outreach Generator Modal */}
      {draftModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans text-xs backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-[2.2rem] bg-white shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-650">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Dynamic AI Outreach Drafter</h3>
                  <p className="text-[10px] text-slate-400">One-click WhatsApp campaign generator</p>
                </div>
              </div>
              <button onClick={() => setDraftModal({ isOpen: false, type: '', context: null })} className="p-1 rounded-lg text-slate-450 hover:bg-slate-105 hover:text-slate-650 transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1.5 leading-relaxed text-slate-650 text-[11px]">
                <p className="font-bold text-slate-800 uppercase text-[9px] tracking-wider">Item System Reference Context:</p>
                <pre className="font-mono text-[10px] tracking-tight bg-white p-2.5 rounded-xl border max-h-24 overflow-y-auto w-full text-slate-600">
                  {JSON.stringify(draftModal.context, null, 2)}
                </pre>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-705">Outreach Intent / Specific Notes:</label>
                <textarea
                  placeholder="e.g. Give them high congratulations or tell them about review rules nicely."
                  value={draftCustomNotes}
                  onChange={(e) => setDraftCustomNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-205 px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-505 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              {draftModal.draftResult ? (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block font-bold text-slate-705 flex items-center justify-between">
                    <span>Generated Outreach Copy:</span>
                    <button
                      onClick={() => {
                        if (draftModal.draftResult) {
                          navigator.clipboard.writeText(draftModal.draftResult);
                          alert('Copied outreach text template to your clipboard!');
                        }
                      }}
                      className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" /> Copy Output
                    </button>
                  </label>
                  <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl max-h-48 overflow-y-auto font-sans leading-relaxed text-slate-800 font-medium whitespace-pre-line text-[11px]">
                    {draftModal.draftResult}
                  </div>
                </div>
              ) : null}

              {draftModal.loading && (
                <div className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-xl flex items-center gap-2.5 text-xs text-indigo-755 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>Gemini drafting high-conversion outreach copy...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setDraftModal({ isOpen: false, type: '', context: null })} className="rounded-lg px-4 py-2 border font-semibold text-slate-650 hover:bg-slate-50 transition">Cancel</button>
              <button
                type="button"
                onClick={handleDraftSubmit}
                disabled={draftModal.loading}
                className="rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 py-2 shadow-xs transition-all shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-white" />
                Generate Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unique Buyer Credential Generator Modal Form */}
      {buyerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 font-sans text-xs backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-[2.2rem] bg-white shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {buyerModal.data ? '⚙️ Edit Buyer Account' : '👤 Create Unique Buyer Account'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Define login credentials and payout preferences</p>
              </div>
              <button onClick={() => setBuyerModal({ isOpen: false })} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBuyerSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Unique Sign-In Name <span className="text-rose-500">*</span></label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-indigo-500 font-bold font-mono">@</span>
                  <input
                    type="text"
                    required
                    disabled={!!buyerModal.data}
                    placeholder="e.g. alexwright12"
                    value={bUsername}
                    onChange={(e) => setBUsername(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 pl-8 pr-3.5 py-2 text-slate-800 bg-white focus:outline-none focus:border-indigo-500 font-mono font-bold disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Values are lowercase, case-insensitive, and spaces are automatically stripped.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Buyer Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander Wright"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-slate-800 focus:outline-none focus:border-indigo-505 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">WhatsApp Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +14155551234"
                    value={bWhatsApp}
                    onChange={(e) => setBWhatsApp(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-707">Account Status</label>
                  <select
                    value={bStatus}
                    onChange={(e) => setBStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white font-medium"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 space-y-3">
                <p className="text-[10px] font-bold text-indigo-950 uppercase tracking-wide">Refund / Payout Channels</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Method</label>
                    <select
                      value={bPaymentMethod}
                      onChange={(e) => setBPaymentMethod(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white font-semibold text-[11px]"
                    >
                      <option value="PayPal">PayPal</option>
                      <option value="Venmo">Venmo</option>
                      <option value="Zelle">Zelle</option>
                      <option value="CashApp">CashApp</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Payout Handle / ID</label>
                    <input
                      type="text"
                      required
                      placeholder="PayPal Email or Username"
                      value={bPaymentId}
                      onChange={(e) => setBPaymentId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-medium text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-start gap-1 font-medium text-[11px]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setBuyerModal({ isOpen: false })} className="rounded-lg px-4 py-2 border font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 py-2 shadow-sm transition-all shadow-indigo-600/10">
                  {buyerModal.data ? 'Update Credentials' : 'Create Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Order Status & Cashback Payout Center */}
      {refundModal.isOpen && refundModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 font-sans text-xs backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-[1.5rem] sm:rounded-[2rem] bg-slate-900 shadow-3xl border border-slate-800 animate-scaleUp text-slate-100 text-left overflow-hidden">
            
            {/* Header (Pinned) */}
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-[#00e5a0] font-mono tracking-widest bg-[#00e5a0]/10 px-2 py-0.5 rounded-full border border-[#00e5a0]/20">
                  Operations & Bookkeeping Control
                </span>
                <h3 className="text-xs sm:text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
                  <span>⚙️</span> Status & Payout Control
                </h3>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Order ID: <span className="font-mono text-slate-300 font-bold">{refundModal.order.id}</span>
                </p>
              </div>
              <button 
                onClick={() => setRefundModal({ isOpen: false })} 
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="flex flex-col flex-1 overflow-hidden">
              
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                
                {/* Target Buyer Details Card */}
                <div className="p-2.5 bg-slate-850/60 border border-slate-800/85 rounded-xl flex items-center justify-between gap-3 text-[10px]">
                  <div>
                    <span className="block text-[7.5px] text-slate-400 uppercase tracking-wider font-bold">Target Buyer Payout Detail</span>
                    <span className="block font-mono font-black text-xs text-indigo-300 mt-0.5">
                      {refundModal.order.paymentMethod || 'PayPal'}: {refundModal.order.paymentId || 'N/A'}
                    </span>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Product: <strong className="text-white">${refundModal.order.productName || 'Item'}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[7.5px] text-slate-400 uppercase tracking-wider font-bold">Amazon Order ID</span>
                    <span className="block font-mono font-bold text-[10px] text-slate-200 mt-0.5">{refundModal.order.amazonOrderId || 'N/A'}</span>
                  </div>
                </div>

                {/* Status Switcher Grid */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300 uppercase tracking-wider text-[9px]">
                    Select Target Status <span className="text-indigo-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { value: 'Ordered', label: 'Approved', icon: '🚚' },
                      { value: 'Delivered', label: 'Delivered', icon: '📦' },
                      { value: 'Cashback Sent', label: 'Cashback Sent', icon: '💸' },
                      { value: 'Refunded', label: 'Refunded', icon: '🔄' },
                      { value: 'Rejected', label: 'Flagged (Reject)', icon: '❌' },
                      { value: 'Need More Info', label: 'Need Info', icon: '❓' },
                    ].map((st) => {
                      const isSelected = selectedStatus === st.value;
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setSelectedStatus(st.value as any)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-slate-800 border-indigo-500 text-white shadow-md shadow-indigo-500/5 font-black scale-[1.01]' 
                              : 'bg-slate-850/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs">{st.icon}</span>
                          <span className="text-[9px] font-bold leading-tight truncate">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drag, Drop & Paste Screenshot Proof Zone */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-300 uppercase tracking-wider text-[9px]">
                      Screenshot / Payout Proof 
                      {(selectedStatus === 'Refunded' || selectedStatus === 'Cashback Sent') && (
                        <span className="text-rose-400 ml-1 font-bold">* Required</span>
                      )}
                    </label>
                    <span className="text-[8px] text-[#00e5a0] bg-[#00e5a0]/10 px-2 py-0.5 rounded-md font-bold animate-pulse">
                      📋 CLIPBOARD PASTE ACTIVE (Ctrl + V)
                    </span>
                  </div>
                  
                  <div 
                    onDragEnter={(e) => { e.preventDefault(); setRefundDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); setRefundDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setRefundDragActive(false); }}
                    onDrop={handleRefundDrop}
                    onClick={() => refundImageInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
                      refundDragActive 
                        ? 'border-[#00e5a0] bg-[#00e5a0]/10' 
                        : refundScreenshot 
                          ? 'border-[#00e5a0]/50 bg-slate-850/40' 
                          : 'border-slate-800 hover:border-slate-650 bg-slate-850/40'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={refundImageInputRef}
                      onChange={handleRefundFileChange}
                      accept="image/*"
                      className="hidden" 
                    />
                    
                    {refundScreenshot ? (
                      <div className="space-y-1.5">
                        <div className="mx-auto h-24 max-w-xs rounded-lg overflow-hidden border border-slate-800 bg-black/20 relative group">
                          <img 
                            src={refundScreenshot} 
                            alt="Screenshot preview" 
                            className="h-full w-full object-contain animate-fadeIn" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[9px] text-white font-bold">Replace Image 📸</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-[#00e5a0] font-bold animate-fadeIn flex items-center justify-center gap-1">
                          <span>✓ Loaded:</span>
                          <span className="font-mono text-slate-300 max-w-[150px] truncate">{refundScreenshotName || 'screenshot.png'}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <div className="text-2xl">🖼️</div>
                        <p className="text-slate-300 font-bold text-[10px]">
                          Drag & drop proof image, or <span className="text-[#00e5a0] underline">browse</span>
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Or just copy (Snipping Tool) and press <strong className="text-slate-300">Ctrl + V</strong> to Paste!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-slate-800/60"></div>
                    <span className="flex-shrink mx-3 text-slate-500 text-[8px] uppercase font-bold tracking-widest font-mono">Or Paste Screenshot URL</span>
                    <div className="flex-grow border-t border-slate-800/60"></div>
                  </div>

                  <input 
                    type="text" 
                    placeholder="https://imgur.com/example.png or any screenshot URL link..." 
                    value={refundScreenshot.startsWith('data:') ? '' : refundScreenshot}
                    onChange={(e) => {
                      setRefundScreenshot(e.target.value);
                      setRefundScreenshotName(e.target.value ? 'pasted_screenshot_url.png' : '');
                    }}
                    className="w-full rounded-xl bg-slate-850 border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-[10px]" 
                  />
                </div>

                {/* Optional comments / seller notes */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 uppercase tracking-wider text-[9px]">
                    Operations Notes & Comments (Optional)
                  </label>
                  <textarea 
                    rows={2} 
                    placeholder="e.g. Disbursed cashback successfully / Refund processed via PayPal ID #12371..." 
                    value={refundNotes} 
                    onChange={(e) => setRefundNotes(e.target.value)} 
                    className="w-full rounded-xl bg-slate-850 border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-[10px] resize-none" 
                  />
                </div>

              </div>

              {/* Actions Footer (Pinned) */}
              <div className="p-4 sm:p-5 bg-slate-950/25 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0 rounded-b-[2rem]">
                <button 
                  type="button" 
                  onClick={() => setRefundModal({ isOpen: false })} 
                  className="bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#00e5a0] to-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/10 cursor-pointer hover:scale-105 active:scale-95 transition flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Confirm & Save Status</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
