/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  ExternalLink, 
  ShoppingBag, 
  Clock, 
  Search, 
  HelpCircle, 
  Info, 
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Percent,
  CheckCircle,
  AlertCircle,
  FileText,
  Upload,
  User,
  Phone,
  History,
  Store,
  Compass,
  Check,
  X,
  ShieldCheck,
  ArrowUpRight,
  Lock,
  Pencil
} from 'lucide-react';
import { Product, Agent, Order, BuyerUser } from '../types';
import TeddyCreature from './TeddyCreature';

interface BuyerPageProps {
  products: Product[];
  orders: Order[];
  agents: Agent[];
  activeAgent: Agent | null;
  onSubmitOrder: (orderData: {
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
  }) => Promise<void>;
  onSubmitDeliveryProof: (orderId: string, deliveryScreenshotUrl: string) => Promise<void>;
  onTrackOrder: (orderId: string) => void;
  currentTab: 'deals' | 'track' | 'orders' | 'agent';
  setCurrentTab: (tab: 'deals' | 'track' | 'orders' | 'agent') => void;
  trackOrderId?: string;
  buyerSession: BuyerUser | null;
  onLoginBuyer: (buyer: BuyerUser) => void;
  onSignOutBuyer: () => void;
  buyers: BuyerUser[];
  onRegisterBuyer: (buyer: Partial<BuyerUser>) => Promise<BuyerUser>;
  onUpdateOrderDetails?: (orderId: string, amazonId: string, paymentMethod: 'PayPal' | 'Venmo' | 'Zelle' | 'CashApp', paymentId: string) => Promise<void>;
}

export default function BuyerPage({ 
  products, 
  orders, 
  agents,
  activeAgent, 
  onSubmitOrder,
  onSubmitDeliveryProof,
  onTrackOrder,
  currentTab,
  setCurrentTab,
  trackOrderId,
  buyerSession,
  onLoginBuyer,
  onSignOutBuyer,
  buyers,
  onRegisterBuyer,
  onUpdateOrderDetails
}: BuyerPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackingIdInput, setTrackingIdInput] = useState<string>('');
  const [activeOrderFilter, setActiveOrderFilter] = useState<'all' | 'needs_proof' | 'processing' | 'completed'>('all');

  // Tracking-specific state matching track.html
  const [trackMethod, setTrackMethod] = useState<'whatsapp' | 'order_id'>('whatsapp');
  const [trackResults, setTrackResults] = useState<Order[] | null>(null);
  const [hasTracked, setHasTracked] = useState<boolean>(false);

  // Synchronize tracking input if trackOrderId is passed down
  React.useEffect(() => {
    if (trackOrderId) {
      setTrackingIdInput(trackOrderId);
      setTrackMethod('order_id');
      const cleanQuery = trackOrderId.trim().toLowerCase();
      const matches = orders.filter(o => 
        (o.id || '').toLowerCase().trim() === cleanQuery || 
        (o.productId || '').toLowerCase().trim() === cleanQuery ||
        (o.productName || '').toLowerCase().includes(cleanQuery)
      );
      setTrackResults(matches);
      setHasTracked(true);
    }
  }, [trackOrderId, orders]);

  // States for high-density compact orders view
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editOrderIdVal, setEditOrderIdVal] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'PayPal' | 'Venmo' | 'Zelle' | 'CashApp'>('PayPal');
  const [editPaymentId, setEditPaymentId] = useState<string>('');
  
  // States for interactive modals
  const [activeProductForModal, setActiveProductForModal] = useState<Product | null>(null);
  const [isSubmitOrderOpen, setIsSubmitOrderOpen] = useState(false);

  // Submit Order Form States
  const [formBuyerName, setFormBuyerName] = useState(buyerSession?.name || '');
  const [formBuyerWhatsApp, setFormBuyerWhatsApp] = useState(buyerSession?.whatsApp || '');
  const [formOrderId, setFormOrderId] = useState('');
  const [formAgentCode, setFormAgentCode] = useState(activeAgent?.referralCode || '');
  const [formNotes, setFormNotes] = useState('');

  // 3-Step Wizard Interactive States
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'Zelle' | 'CashApp' | 'Venmo' | 'PayPal'>('PayPal');
  const [paymentId, setPaymentId] = useState('');

  // Per-order delivery proof upload state maps
  const [deliveryFileBase64, setDeliveryFileBase64] = useState<Record<string, string>>({});
  const [deliveryFileName, setDeliveryFileName] = useState<Record<string, string>>({});
  const [isUploadingDeliveryMap, setIsUploadingDeliveryMap] = useState<Record<string, boolean>>({});
  
  // Screenshot Upload State
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unique Sign-In Mode & States
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginError, setLoginError] = useState('');

  // Buyer Registration Form States
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regWhatsApp, setRegWhatsApp] = useState('');
  const [regPaymentMethod, setRegPaymentMethod] = useState<'PayPal' | 'Venmo' | 'Zelle' | 'CashApp'>('PayPal');
  const [regPaymentId, setRegPaymentId] = useState('');

  // Local mini-auth forms within the Submit Order modal
  const [miniAuthMode, setMiniAuthMode] = useState<'signin' | 'register'>('signin');
  const [miniLoginUsername, setMiniLoginUsername] = useState('');
  const [miniRegUsername, setMiniRegUsername] = useState('');
  const [miniRegName, setMiniRegName] = useState('');
  const [miniRegWhatsApp, setMiniRegWhatsApp] = useState('');
  const [miniRegPaymentMethod, setMiniRegPaymentMethod] = useState<'PayPal' | 'Venmo' | 'Zelle' | 'CashApp'>('PayPal');
  const [miniRegPaymentId, setMiniRegPaymentId] = useState('');
  const [miniLoginError, setMiniLoginError] = useState('');
  const [isMiniRegistering, setIsMiniRegistering] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Processing triggers
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Sync details from login payload
  React.useEffect(() => {
    if (buyerSession) {
      setFormBuyerName(buyerSession.name);
      setFormBuyerWhatsApp(buyerSession.whatsApp || '');
      setPaymentMethod(buyerSession.paymentMethod || 'PayPal');
      setPaymentId(buyerSession.paymentId || '');
    }
  }, [buyerSession]);

  // Categories list derived dynamically from products
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Filter orders matching logged-in buyer
  const buyerOrders = useMemo(() => {
    if (!buyerSession) return [];
    return orders.filter(
      o => {
        const orderWhatsAppClean = (o.buyerWhatsApp || '').trim().replace(/\D/g, '');
        const sessionWhatsAppClean = (buyerSession.whatsApp || '').trim().replace(/\D/g, '');
        return (
          (o.buyerName || '').trim().toLowerCase() === (buyerSession.name || '').trim().toLowerCase() ||
          (sessionWhatsAppClean && orderWhatsAppClean === sessionWhatsAppClean) ||
          (o.paymentId || '').trim().toLowerCase() === (buyerSession.paymentId || '').trim().toLowerCase()
        );
      }
    );
  }, [orders, buyerSession]);

  // Filter orders based on active sub-tab/category filter
  const displayedOrders = useMemo(() => {
    if (activeOrderFilter === 'needs_proof') {
      return buyerOrders.filter(o => (o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') && !o.deliveryScreenshotUrl);
    }
    if (activeOrderFilter === 'processing') {
      return buyerOrders.filter(o => o.deliveryScreenshotUrl && o.orderStatus !== 'Cashback Sent' && o.orderStatus !== 'Refunded');
    }
    if (activeOrderFilter === 'completed') {
      return buyerOrders.filter(o => o.orderStatus === 'Cashback Sent' || o.orderStatus === 'Refunded');
    }
    return buyerOrders;
  }, [buyerOrders, activeOrderFilter]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = trackingIdInput.trim().toLowerCase();
    if (!cleanQuery) {
      setTrackResults([]);
      setHasTracked(true);
      return;
    }

    if (trackMethod === 'whatsapp') {
      const cleanPhone = cleanQuery.replace(/\D/g, '');
      const matches = orders.filter(o => {
        const oPhone = (o.buyerWhatsApp || '').replace(/\D/g, '');
        return cleanPhone.length > 0 && oPhone.includes(cleanPhone);
      });
      setTrackResults(matches);
    } else {
      const matches = orders.filter(o => 
        (o.id || '').toLowerCase().trim() === cleanQuery || 
        (o.productId || '').toLowerCase().trim() === cleanQuery ||
        (o.productName || '').toLowerCase().includes(cleanQuery)
      );
      setTrackResults(matches);
    }
    setHasTracked(true);
  };

  const openAmazonUrl = (product: Product) => {
    setActiveProductForModal(product);
  };

  // Drag and Drop files handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setScreenshotBase64(reader.result as string);
        setScreenshotFileName(file.name);
      };
    } else {
      alert("Please upload a valid image file raw screenshot.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleManualUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Submit Order Form logic
  const handleOrderSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductForModal) return;

    const finalBuyerName = (buyerSession?.name || formBuyerName || '').trim();
    const finalBuyerWhatsApp = (buyerSession?.whatsApp || formBuyerWhatsApp || '').trim();
    const finalPaymentMethod = paymentMethod || buyerSession?.paymentMethod || 'PayPal';
    const finalPaymentId = (paymentId || buyerSession?.paymentId || '').trim();

    if (!finalBuyerName || !finalBuyerWhatsApp || !formOrderId.trim() || !finalPaymentId) {
      alert('Missing required info. Please make sure your name, WhatsApp, Amazon Order ID, and payout details are specified.');
      return;
    }

    if (!screenshotBase64) {
      alert('Please upload your order confirmation screenshot as verification proof.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Find agent designated
      let assignedAgentName = 'Direct Channel';
      const selectedAgentObj = agents.find(a => a.referralCode.toLowerCase() === formAgentCode.trim().toLowerCase());
      if (selectedAgentObj) {
        assignedAgentName = selectedAgentObj.name;
      }

      await onSubmitOrder({
        orderId: formOrderId.trim(),
        productId: activeProductForModal.id,
        productName: activeProductForModal.name,
        buyerName: finalBuyerName,
        buyerWhatsApp: finalBuyerWhatsApp,
        agentName: assignedAgentName,
        agentReferralCode: formAgentCode.trim(),
        screenshotBase64,
        fileName: screenshotFileName || 'screenshot.png',
        notes: formNotes.trim(),
        paymentMethod: finalPaymentMethod,
        paymentId: finalPaymentId
      });

      setSubmissionSuccess(true);
      
      // Reset form states instantly
      setFormOrderId('');
      setFormNotes('');
      setScreenshotBase64('');
      setScreenshotFileName('');
      setWizardStep(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      alert(`Submission error: ${err.message || 'Server timeout'}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Mini Auth Helpers inside the checkout modal
  const handleMiniLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMiniLoginError('');
    const query = miniLoginUsername.trim().toLowerCase();
    if (!query) {
      setMiniLoginError('Please enter your unique Sign-In Name.');
      return;
    }
    const foundBuyer = buyers.find(b => b.username.toLowerCase() === query);
    if (foundBuyer) {
      onLoginBuyer(foundBuyer);
      setMiniLoginUsername('');
      setMiniLoginError('');
    } else {
      setMiniLoginError(`Sign-In Name "@${miniLoginUsername}" not found. Try again or select Quick Register!`);
    }
  };

  const handleMiniRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMiniLoginError('');
    const usernameClean = miniRegUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!usernameClean || !miniRegName.trim() || !miniRegWhatsApp.trim() || !miniRegPaymentId.trim()) {
      setMiniLoginError('Please fill out all required fields.');
      return;
    }

    const exists = buyers.some(b => b.username.toLowerCase() === usernameClean);
    if (exists) {
      setMiniLoginError(`Sign-In Name "@${miniRegUsername}" is already taken. Try another!`);
      return;
    }

    setIsMiniRegistering(true);
    try {
      const newlyRegistered = await onRegisterBuyer({
        username: usernameClean,
        name: miniRegName.trim(),
        whatsApp: miniRegWhatsApp.trim(),
        paymentMethod: miniRegPaymentMethod,
        paymentId: miniRegPaymentId.trim(),
        status: 'Active'
      });
      onLoginBuyer(newlyRegistered);
      setMiniRegUsername('');
      setMiniRegName('');
      setMiniRegWhatsApp('');
      setMiniRegPaymentId('');
    } catch (err: any) {
      setMiniLoginError(`Registration failed: ${err.message || 'Error occurred'}`);
    } finally {
      setIsMiniRegistering(false);
    }
  };

  // Simple Buyer Authentication handler via Unique Sign In Name
  const handleBuyerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginUsername.trim().toLowerCase();
    if (!query) {
      setLoginError('Please enter your Unique Sign-In Name.');
      return;
    }
    
    // Check against buyers list
    const foundBuyer = buyers.find(b => b.username.toLowerCase() === query);
    if (foundBuyer) {
      onLoginBuyer(foundBuyer);
      setLoginUsername('');
      setLoginError('');
    } else {
      setLoginError(`The Sign-In Name "${loginUsername}" was not found in our records. If this is your first time, toggle the section below to choose a unique Sign-In Name!`);
    }
  };

  // Buyer Registration logic
  const [isRegistering, setIsRegistering] = useState(false);
  const handleBuyerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameClean = regUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!usernameClean || !regName.trim() || !regWhatsApp.trim() || !regPaymentId.trim()) {
      setLoginError('Please fill out all fields for registration.');
      return;
    }

    // Check if unique sign-in name already taken
    const exists = buyers.some(b => b.username.toLowerCase() === usernameClean);
    if (exists) {
      setLoginError(`The Sign-In Name "${regUsername}" is already taken. Please choose another username (contains letters and numbers only).`);
      return;
    }

    setIsRegistering(true);
    setLoginError('');

    try {
      const newlyRegistered = await onRegisterBuyer({
        username: usernameClean,
        name: regName.trim(),
        whatsApp: regWhatsApp.trim(),
        paymentMethod: regPaymentMethod,
        paymentId: regPaymentId.trim(),
        status: 'Active'
      });
      // Automatically log the new buyer in
      onLoginBuyer(newlyRegistered);
      
      // Clear registration states
      setRegUsername('');
      setRegName('');
      setRegWhatsApp('');
      setRegPaymentId('');
      setAuthMode('signin');
    } catch (err: any) {
      setLoginError(`Registration failed: ${err.message || 'Error occurred'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const statusColors = {
    'Pending': 'bg-yellow-50 text-amber-700 border-yellow-200',
    'Ordered': 'bg-sky-50 text-sky-800 border-sky-200',
    'Delivered': 'bg-teal-50 text-teal-850 border-teal-200',
    'Cashback Sent': 'bg-emerald-50 text-emerald-800 border-emerald-250',
    'Rejected': 'bg-rose-50 text-rose-800 border-rose-200',
    'PayPal Issue': 'bg-orange-50 text-orange-800 border-orange-200',
    'Need More Info': 'bg-purple-50 text-purple-800 border-purple-200'
  };

  return (
    <div id="buyer-workspace" className="space-y-12 pb-24 font-sans text-slate-800">
      
      {/* ------------------------ SECTION A: DEALS HUB ------------------------ */}
      {currentTab === 'deals' && (
        <>
          {activeProductForModal ? (
            <div id="cashback-checkout-page" className="max-w-6xl mx-auto space-y-8 animate-fadeIn pt-6 text-left">
              {submissionSuccess ? (
                /* GORGEOUS FULL-PAGE REALTIME SUCCESS RECEIPT */
                <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-8 sm:p-12 text-center space-y-8 animate-scaleUp shadow-md mt-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-5xl shadow-sm border border-emerald-100">
                    🎉
                  </div>
                  
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-650 font-mono bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      REBATE STATUS: SUCCESSFULLY SUBMITTED
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">Your Cashback Order Has Been Recorded!</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                      We received your Amazon Order snapshot proof. The system has automatically synchronized this rebate claim with our active Google Sheets database ledger.
                    </p>
                  </div>

                  {/* Receipt Card Details Box */}
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 text-left space-y-4 max-w-xl mx-auto text-slate-850">
                    <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">Receipt Claim Summary</h4>
                    
                    <div className="flex gap-4 pb-4 border-b border-slate-200 items-center">
                      <img 
                        src={activeProductForModal.imageUrl} 
                        alt={activeProductForModal.name} 
                        className="w-16 h-16 object-cover rounded-2xl border border-slate-200 bg-white" 
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600";
                        }}
                      />
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{activeProductForModal.sellerName || 'Amazon Brand'}</p>
                        <h5 className="font-sans text-xs sm:text-[13px] font-bold text-slate-800 line-clamp-1">{activeProductForModal.name}</h5>
                        <span className="inline-block text-xs font-black text-emerald-600 font-mono">${activeProductForModal.cashbackAmount.toFixed(2)} Cashback Pending</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Amazon Order ID</span>
                        <span className="block font-mono font-black text-slate-850 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg mt-1 text-[11px] select-all tracking-wide">{formOrderId}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payout Destination</span>
                        <span className="block text-slate-800 font-bold mt-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-[11px]">{(buyerSession?.paymentMethod || paymentMethod || 'Zelle').toUpperCase()} ({buyerSession?.paymentId || paymentId})</span>
                      </div>
                    </div>

                    {/* Processing Time Banner aligning with average 24-72 hours */}
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50 flex gap-3 text-xs text-amber-900 leading-normal font-sans">
                      <span className="text-base select-none">⌛</span>
                      <div>
                        <strong className="font-bold text-amber-950">Avg. Processing Time: 24-72 hours.</strong>
                        <p className="text-[11px] text-amber-800/90 mt-0.5 font-normal">Our brand seller reviews order IDs during business hours. Tracking is updated in real-time under My Orders tracker.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 max-w-xl mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmissionSuccess(false);
                        setActiveProductForModal(null);
                        setFormOrderId('');
                        setFormNotes('');
                        setScreenshotBase64('');
                        setScreenshotFileName('');
                        setWizardStep(1);
                        setPaymentId('');
                        setCurrentTab('orders');
                      }}
                      className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-xl text-white transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>📦 View My Orders Ledger</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmissionSuccess(false);
                        setActiveProductForModal(null);
                        setFormOrderId('');
                        setFormNotes('');
                        setScreenshotBase64('');
                        setScreenshotFileName('');
                        setWizardStep(1);
                        setPaymentId('');
                      }}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-700 transition-all cursor-pointer border border-slate-200"
                    >
                      🛒 Browse More Deals
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Giant Breadcrumbs/Back Navigation Header to make it feel like a subpage */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-205 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#1bc2ff] font-mono bg-indigo-500/10 border border-indigo-505/20 px-2.5 py-1 rounded-full">
                          Step-by-Step Claim Panel
                        </span>
                        <span className="text-[9.5px] uppercase font-bold tracking-widest text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-505/20 px-2.5 py-1 rounded-full">
                          Rebate Online
                        </span>
                      </div>
                      <h3 className="text-2xl font-black font-sans text-slate-900 leading-normal">Claim Your Cashback Rebate</h3>
                      <p className="text-xs text-slate-500">Please complete the Amazon checkout to secure your 100% cashback reimbursement.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProductForModal(null);
                        setIsSubmitOrderOpen(false);
                        setSubmissionSuccess(false);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 px-4 py-2.5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-slate-200"
                    >
                      ← Back to active deals
                    </button>
                  </div>
                  
                  {/* Grid content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* COLUMN 1: Amazon Purchase & Information Details */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-800 shadow-sm">
                  <div className="space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-4">
                      <img 
                        src={activeProductForModal.imageUrl} 
                        alt={activeProductForModal.name}
                        className="max-h-full max-w-full object-contain rounded-xl"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600";
                        }}
                      />
                    </div>

                    <div className="space-y-4">
                      <span className="inline-block text-[10px] uppercase font-bold text-indigo-600 tracking-wider font-mono">
                        Category: {activeProductForModal.category}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">{activeProductForModal.name}</h4>
                      
                      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-200">
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cashback Amount:</span>
                          <span className="block text-3xl font-black text-emerald-600 font-mono">${activeProductForModal.cashbackAmount.toFixed(2)}</span>
                        </div>
                        
                        <div className="border-l border-slate-200 pl-4">
                          <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Seller Brand:</span>
                          <span className="block text-sm font-bold text-slate-800 leading-normal pt-1">{activeProductForModal.sellerName || 'Amazon Brand'}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 text-[11px] mb-1">💡 Double Check Instructions:</p>
                        <p>✅ 100% Tax, purchase prices and platform fees covered fully.</p>
                        <p>✨ Paid directly inside your preferred digital payout wallet.</p>
                        {activeProductForModal.deadline && (
                          <p>⌛ Deadline Offer: <strong className="text-amber-600">{activeProductForModal.deadline}</strong></p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 1 Amazon callout button */}
                  <div className="space-y-3 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                    <div>
                      <h5 className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider font-mono">STEP 1: BUY ON AMAZON</h5>
                      <p className="text-slate-600 text-xs font-normal">Click the checkout link to visit Amazon. Add the item to your cart & finish checkout.</p>
                    </div>

                    <a
                      href={activeProductForModal.amazonLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-gradient-to-r from-[#ffe14f] to-[#ffb11b] hover:from-[#ffea75] hover:to-[#ffa700] text-slate-950 font-black px-6 py-4 rounded-2xl transition duration-300 text-center flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <span>🛒 Proceed & Open Amazon Page</span>
                      <ExternalLink className="h-4 w-4 text-slate-900" />
                    </a>
                  </div>
                </div>

                {/* COLUMN 2: Submit cashback order claim form */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                      <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase font-mono">STEP 2: CLAIM REBATE</h3>
                      <p className="text-[10px] text-slate-500 leading-none">Complete checkout form details below</p>
                    </div>
                  </div>

                  {submissionSuccess ? (
                    <div className="py-12 text-center space-y-5 animate-fadeIn bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl">
                        🎉
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-slate-900 text-base">Rebate Submitted Successfully!</h4>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                          We received your Amazon Order snapshot and details. The owner brand will verify and process the digital payout immediately!
                        </p>
                      </div>

                      <div className="flex justify-center gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmissionSuccess(false);
                            setActiveProductForModal(null);
                            setCurrentTab('orders');
                          }}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-xl text-white transition-all cursor-pointer shadow-md"
                        >
                          View My Orders
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubmissionSuccess(false);
                            setActiveProductForModal(null);
                          }}
                          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl text-slate-700 transition-all cursor-pointer"
                        >
                          Browse Deals
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {!buyerSession ? (
                        /* Integrated Mini Auth in Modal for non-members */
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-5">
                          <div className="text-center space-y-1">
                            <h4 className="font-bold text-slate-900 text-xs">Unlock Cashback Connection</h4>
                            <p className="text-[10.5px] text-slate-600 max-w-sm mx-auto text-center leading-relaxed">
                              Access exclusive buyer credentials. Provide your payment tags so we can credit the rebate directly to your PayPal / Zelle wallet.
                            </p>
                          </div>

                          {/* Inline Selector tabs */}
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/50 rounded-xl border border-slate-200 text-xs font-bold font-sans">
                            <button
                              type="button"
                              onClick={() => { setMiniAuthMode('signin'); setMiniLoginError(''); }}
                              className={`py-2 rounded-lg transition-all cursor-pointer ${miniAuthMode === 'signin' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              Sign In
                            </button>
                            <button
                              type="button"
                              onClick={() => { setMiniAuthMode('register'); setMiniLoginError(''); }}
                              className={`py-2 rounded-lg transition-all cursor-pointer ${miniAuthMode === 'register' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              Register New Account
                            </button>
                          </div>

                          {miniLoginError && (
                            <p className="text-xs text-red-600 text-center font-bold bg-red-50 border border-red-200 rounded-xl p-2.5">
                              ⚠️ {miniLoginError}
                            </p>
                          )}

                          {miniAuthMode === 'signin' ? (
                            <form onSubmit={handleMiniLoginSubmit} className="space-y-4">
                              <div className="space-y-1 text-left">
                                <label className="block text-xs font-bold text-slate-700">Your Unique Payout Sign-In Username</label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3.5 text-indigo-600 font-mono font-bold">@</span>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. alex12"
                                    value={miniLoginUsername}
                                    onChange={(e) => setMiniLoginUsername(e.target.value)}
                                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono transition"
                                  />
                                </div>
                              </div>
                              <button
                                type="submit"
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                              >
                                Initialize Profile
                              </button>
                            </form>
                          ) : (
                            <form onSubmit={handleMiniRegisterSubmit} className="space-y-4 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 text-left">
                                  <label className="block text-xs text-slate-700 font-bold uppercase">Sign-In Name</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="alex12"
                                    value={miniRegUsername}
                                    onChange={(e) => setMiniRegUsername(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono"
                                  />
                                </div>
                                <div className="space-y-1 text-left">
                                  <label className="block text-xs text-slate-700 font-bold uppercase">Full Name</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Alex Wright"
                                    value={miniRegName}
                                    onChange={(e) => setMiniRegName(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 text-left">
                                  <label className="block text-xs text-slate-700 font-bold uppercase">WhatsApp No</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="+14155551234"
                                    value={miniRegWhatsApp}
                                    onChange={(e) => setMiniRegWhatsApp(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono"
                                  />
                                </div>
                                <div className="space-y-1 text-left">
                                  <label className="block text-xs text-slate-700 font-bold uppercase">Payout Wallet Type</label>
                                  <select
                                    value={miniRegPaymentMethod}
                                    onChange={(e) => setMiniRegPaymentMethod(e.target.value as any)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold"
                                  >
                                    <option value="PayPal">PayPal</option>
                                    <option value="Venmo">Venmo</option>
                                    <option value="Zelle">Zelle</option>
                                    <option value="CashApp">Cash App</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-xs text-slate-700 font-bold uppercase">Wallet Payout Username / Email / ID</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="paypal email or $cashtag"
                                  value={miniRegPaymentId}
                                  onChange={(e) => setMiniRegPaymentId(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isMiniRegistering}
                                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-45 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-650/15"
                              >
                                {isMiniRegistering ? 'Registering...' : 'Register and Continue'}
                              </button>
                            </form>
                          )}
                        </div>
                      ) : (
                        /* LOGGED IN - FORM WITH DEDICATED SPACIOUS FIELD LAYOUTS */
                        <form onSubmit={handleOrderSubmission} className="space-y-5 text-left">
                          {/* Connected Pill banner displaying payout details */}
                          <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex flex-col text-left">
                              <span className="text-indigo-600 font-bold">👤 Connected: @{buyerSession.username} ({buyerSession.name})</span>
                              <span className="text-[11px] text-slate-600">Rebate destination: <strong className="text-indigo-600 font-mono">{buyerSession.paymentMethod} ({buyerSession.paymentId})</strong></span>
                            </div>
                            <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono uppercase font-bold shrink-0 border border-emerald-500/20">
                              Connected
                            </span>
                          </div>

                          {/* Step 1: Select Active Product */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">Step 1: Select the product you want to submit order <span className="text-rose-500">*</span></label>
                            <select
                              required
                              value={activeProductForModal?.id || ''}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const matched = products.find(p => p.id === selectedId);
                                if (matched) {
                                  setActiveProductForModal(matched);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 font-medium cursor-pointer"
                            >
                              <option value="">-- Choose Active Product --</option>
                              {products.filter(p => p.status === 'Active').map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${p.cashbackAmount.toFixed(2)} Cashback)
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Order ID field */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-indigo-700">Step 2: Amazon Order ID <span className="text-rose-500">*</span></label>
                              <span className="text-[10px] text-slate-500 font-mono">17-digit format</span>
                            </div>
                            <input
                              type="text"
                              required
                              value={formOrderId}
                              onChange={(e) => setFormOrderId(e.target.value)}
                              placeholder="e.g. 111-4890812-3450912"
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-mono placeholder-slate-400 transition"
                            />
                          </div>

                          {/* Beautiful Payment Method Selector Grid (just like screenshot) */}
                          <div className="space-y-3">
                            <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">
                              How would you like your cashback? <span className="text-slate-500 font-normal">(optional)</span>
                            </label>
                            
                            <div className="grid grid-cols-2 gap-3.5">
                              {/* Zelle Option */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('Zelle')}
                                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 text-center cursor-pointer ${
                                  paymentMethod === 'Zelle'
                                    ? 'bg-amber-50/60 border-amber-500/80 shadow-sm ring-1 ring-amber-500/50'
                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-3xl mb-2 filter drop-shadow-sm">🏛️</div>
                                <span className="text-xs font-bold text-slate-800 font-sans">Zelle</span>
                                {paymentMethod === 'Zelle' && (
                                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500" />
                                )}
                              </button>

                              {/* Cash App Option */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('CashApp')}
                                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 text-center cursor-pointer ${
                                  paymentMethod === 'CashApp'
                                    ? 'bg-amber-50/60 border-amber-500/80 shadow-sm ring-1 ring-amber-500/50'
                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-3xl mb-2 filter drop-shadow-sm">💵</div>
                                <span className="text-xs font-bold text-slate-800 font-sans">Cash App</span>
                                {paymentMethod === 'CashApp' && (
                                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500" />
                                )}
                              </button>

                              {/* Venmo Option */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('Venmo')}
                                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 text-center cursor-pointer ${
                                  paymentMethod === 'Venmo'
                                    ? 'bg-amber-50/60 border-amber-500/80 shadow-sm ring-1 ring-amber-500/50'
                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-3xl mb-2 filter drop-shadow-sm">📲</div>
                                <span className="text-xs font-bold text-slate-800 font-sans">Venmo</span>
                                {paymentMethod === 'Venmo' && (
                                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500" />
                                )}
                              </button>

                              {/* PayPal Option */}
                              <button
                                type="button"
                                onClick={() => setPaymentMethod('PayPal')}
                                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 text-center cursor-pointer ${
                                  paymentMethod === 'PayPal'
                                    ? 'bg-amber-50/60 border-amber-500/80 shadow-sm ring-1 ring-amber-500/50'
                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-3xl mb-2 filter drop-shadow-sm">🅿️</div>
                                <span className="text-xs font-bold text-slate-800 font-sans">PayPal</span>
                                {paymentMethod === 'PayPal' && (
                                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Input field for payment details */}
                          <div className="space-y-2 animate-fadeIn">
                            <label className="block text-xs font-bold text-indigo-700">
                              Your {paymentMethod === 'CashApp' ? 'Cash App' : paymentMethod} Details
                            </label>
                            <input
                              type="text"
                              required
                              value={paymentId}
                              onChange={(e) => setPaymentId(e.target.value)}
                              placeholder={
                                paymentMethod === 'PayPal' ? 'PayPal email address' :
                                paymentMethod === 'Zelle' ? 'Zelle phone number or email' :
                                paymentMethod === 'Venmo' ? 'Venmo @username' :
                                'Cash App $cashtag'
                              }
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-mono placeholder-slate-400 transition"
                            />
                          </div>

                          {/* Upload box */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-indigo-700">Order Confirmation Screenshot <span className="text-rose-500">*</span></label>
                            
                            <div
                              onDragEnter={handleDrag}
                              onDragOver={handleDrag}
                              onDragLeave={handleDrag}
                              onDrop={handleDrop}
                              onClick={handleManualUploadClick}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                                dragActive 
                                  ? 'border-indigo-500 bg-indigo-50' 
                                  : screenshotBase64 
                                    ? 'border-emerald-500 bg-emerald-50/30' 
                                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                              />

                              {screenshotBase64 ? (
                                <div className="flex items-center gap-4 w-full text-left">
                                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                    <img src={screenshotBase64} alt="Thumbnail" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                      <Check className="h-3.5 w-3.5" /> Order Invoice Captured!
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{screenshotFileName || 'order_screenshot.png'}</p>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScreenshotBase64('');
                                      setScreenshotFileName('');
                                    }}
                                    className="text-xs text-rose-600 underline hover:text-rose-500 pl-2 shrink-0 font-semibold"
                                  >
                                    Reset / Upload other
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-indigo-500" />
                                  <p className="text-xs text-slate-600 font-sans">
                                    <strong className="text-slate-800">Click to browse</strong> or drop screenshot of Amazon receipt invoice
                                  </p>
                                  <p className="text-[10px] text-slate-400">PNG, JPG, WEBP formats supported</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Collapsible drawer for advanced options to minimize visual clutter */}
                          <div className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => setShowOptionalFields(!showOptionalFields)}
                              className="w-full flex items-center justify-between px-4 py-3 text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              <span className="font-extrabold text-[10px] uppercase tracking-wider font-mono">Additional Details (Optional)</span>
                              <span className="text-[10px] font-mono">{showOptionalFields ? '▲' : '▼'}</span>
                            </button>

                            {showOptionalFields && (
                              <div className="p-4 border-t border-slate-200 space-y-4 animate-fadeIn text-left bg-slate-50/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="block text-[10px] text-slate-500 font-bold">Referral Agent Code</label>
                                    <select
                                      value={formAgentCode}
                                      onChange={(e) => setFormAgentCode(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                                    >
                                      <option value="">None / Direct Hub</option>
                                      {agents.map((ag) => (
                                        <option key={ag.id} value={ag.referralCode}>
                                          {ag.name} ({ag.referralCode})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block text-[10px] text-slate-500 font-bold">Custom Notes</label>
                                    <input
                                      type="text"
                                      value={formNotes}
                                      onChange={(e) => setFormNotes(e.target.value)}
                                      placeholder="Any comments, questions, etc."
                                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions area */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveProductForModal(null);
                                setIsSubmitOrderOpen(false);
                              }}
                              className="flex-1 rounded-xl py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200 transition"
                            >
                              Cancel Claim
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingOrder || !screenshotBase64 || !formOrderId.trim()}
                              className="flex-[2] rounded-xl py-3.5 bg-gradient-to-r from-indigo-650 to-purple-655 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-indigo-600/10 shadow-lg"
                            >
                              {isSubmittingOrder ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                                  <span>Syncing to Google Sheets...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span>Confirm & Submit Order rebate claim</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      ) : (
        <>
              {/* Visual Clean Hero Banner matching high quality human design */}
              <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/20 px-6 py-16 text-center border border-slate-200/60 shadow-sm space-y-7 relative">
                {/* Ambient background accent filters */}
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[440px] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute top-1/2 right-10 h-60 w-60 rounded-full bg-pink-500/10 blur-[90px]" />

                <div className="relative max-w-4xl mx-auto space-y-6">
                  {/* Adorable Welcoming Mickey Mouse Mascot */}
                  <div className="relative z-20">
                    <TeddyCreature />
                  </div>

                  {/* Badge: ✨ Real Cashback — Real Money Back */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs text-indigo-700 shadow-sm">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <span className="font-sans font-bold text-[11px] uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Real Cashback — Real Money Back
                    </span>
                  </div>

                  {/* Title: Earn Real Cashback On Every Purchase */}
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] max-w-3xl mx-auto">
                    Earn Real <span className="text-indigo-600">Cashback On Every</span> Purchase
                  </h2>
                  
                  <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
                    Browse exclusive deals, buy through our links, and get your money back automatically.
                  </p>

                  {/* Clean Search Engine bar */}
                  <form onSubmit={(e) => e.preventDefault()} className="relative max-w-xl mx-auto pt-2">
                    <div className="relative rounded-3xl bg-white border border-slate-200 shadow-md p-1.5 flex items-center gap-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-300">
                      <div className="pl-4">
                        <Search className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search products, categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none py-2"
                      />
                      {searchQuery && (
                        <button 
                          type="button" 
                          onClick={() => setSearchQuery('')}
                          className="text-slate-400 hover:text-slate-600 px-2 text-xs font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Horizontal Summary Analytics badges */}
                  <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-6 text-center border-t border-slate-200/80">
                    <div className="space-y-1">
                      <span className="block text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono">
                        {products.length}
                      </span>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Deals</span>
                    </div>
                    <div className="space-y-1 border-l border-slate-200 border-r">
                      <span className="block text-2xl sm:text-3xl font-extrabold text-pink-600 font-mono">
                        $5-$50
                      </span>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Cashback Range</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                        24-72h
                      </span>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Processing</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Catalog Selection area with category filters */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 pt-4">
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-xl">🔥</span>
                    <h3 className="font-sans text-lg font-bold text-slate-900 tracking-tight">Trending Deals</h3>
                    <span className="text-xs text-slate-500 font-mono ml-2">({filteredProducts.length} deals available)</span>
                  </div>

                  {/* Category pills styled beautifully */}
                  <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`rounded-full px-5 py-2 font-sans text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1 cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition-colors shadow-sm'
                          }`}
                        >
                          <span>{cat === 'All' ? '🛍️ All Deals' : cat === 'Electronics' ? '💻 Electronics' : '📦 ' + cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Products cards display matrix */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((p) => {
                      const isOutOfStock = p.status === 'Out of Stock';
                      const isPaused = p.status === 'Paused';
                      const isUnavailable = isOutOfStock || isPaused;

                      return (
                        <div 
                          key={p.id}
                          onClick={() => openAmazonUrl(p)}
                          className={`group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white border border-slate-200 p-5 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all duration-350 hover:scale-[1.01] cursor-pointer ${
                            isUnavailable ? 'opacity-65' : ''
                          }`}
                        >
                          <div className="space-y-4">
                            {/* Image section */}
                            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                              <img 
                                src={p.imageUrl} 
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-contain group-hover:scale-103 transition-transform duration-500 p-2"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600";
                                }}
                              />
                              
                              {/* Categories Tag Left top */}
                              <span className="absolute top-4 left-4 rounded-full bg-indigo-600 px-2.5 py-1 font-sans text-[9px] font-extrabold text-white uppercase tracking-wider">
                                {p.category}
                              </span>

                              {/* Rebate badge matching screenshot 2 style */}
                              {!isUnavailable && (
                                <div className="absolute top-4 right-4 bg-emerald-600 text-white font-black px-4 py-1.5 rounded-xl shadow-md flex items-center gap-1 text-[11px]">
                                  <span>💸</span>
                                  <span>${p.cashbackAmount.toFixed(2)} Cashback</span>
                                </div>
                              )}

                              {isUnavailable && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-white">
                                    {p.status}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Title & Brand */}
                            <div className="space-y-1.5 text-left">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                                <span>{p.sellerName || 'Amazon Brand'}</span>
                                {p.deadline && <span className="text-amber-600 font-semibold">Ends: {p.deadline}</span>}
                              </div>
                              <h4 className="font-sans text-xs sm:text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                {p.name}
                              </h4>
                            </div>
                          </div>

                          {/* Card Bottom action area with active agent referral or deal key */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[9px] font-sans font-bold">
                              Verify link active
                            </span>
                            
                            {/* Agent Referral tag printed in bottom right matching image 2 */}
                            <span className="text-slate-400 font-mono text-[10.5px]">
                              {formAgentCode ? formAgentCode : 'general'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <ShoppingBag className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="font-sans text-sm font-bold text-slate-700 mt-3">No deals found for query</p>
                    <p className="font-sans text-xs text-slate-500 mt-1">Try changing category filters or typing other terms.</p>
                  </div>
                )}

                {/* Track My Order Promo Banner section matching Image 2 */}
                <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
                  
                  <div className="space-y-2 relative z-10 text-center md:text-left">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">Already placed an order?</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-normal font-normal">
                      Track your cashback status instantly using your WhatsApp or Order ID.
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentTab('track')}
                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 font-sans text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 hover:scale-[1.02] transition-all duration-300 relative z-10 shrink-0"
                  >
                    <span>📦</span>
                    <span>Track My Order</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

           {/* ------------------------ SECTION B: TRACKING COMPONENT ------------------------ */}
      {currentTab === 'track' && (
        <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pt-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-4xl">📦</span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Live Tracking Station</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Enter your WhatsApp number or Amazon Order ID to verify processing stages, seller feedback, and cashback payouts.
            </p>
          </div>

          {/* Search Form Card */}
          <form onSubmit={handleTrackSubmit} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-1/3 text-left">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search Method</label>
                <select
                  value={trackMethod}
                  onChange={(e) => {
                    setTrackMethod(e.target.value as any);
                    setHasTracked(false);
                    setTrackResults(null);
                  }}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="whatsapp">📱 WhatsApp Number</option>
                  <option value="order_id">🔢 Amazon Order ID</option>
                </select>
              </div>

              <div className="flex-1 text-left">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {trackMethod === 'whatsapp' ? 'WhatsApp Phone Number' : 'Amazon Order ID'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={
                      trackMethod === 'whatsapp'
                        ? 'e.g. +1 (555) 019-2834'
                        : 'e.g. 114-8736541-2910394'
                    }
                    value={trackingIdInput}
                    onChange={(e) => setTrackingIdInput(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 pl-10 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs shadow-md shadow-indigo-600/10 cursor-pointer transition-all duration-300"
            >
              LOCATE LIVE STATUS
            </button>
          </form>

          {/* Results Block */}
          {hasTracked && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Found {trackResults ? trackResults.length : 0} matching {trackResults?.length === 1 ? 'order' : 'orders'}
                </h4>
              </div>

              {trackResults && trackResults.length > 0 ? (
                <div className="space-y-6">
                  {trackResults.map((o) => {
                    // Mapped Status Info helper
                    const getTrackingStatusBadge = (status: Order['orderStatus']) => {
                      switch (status) {
                        case 'Pending': return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Submitted' };
                        case 'Ordered': return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Ordered' };
                        case 'Delivered': return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Delivered' };
                        case 'Cashback Sent': return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid Out' };
                        case 'Refunded': return { bg: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Refunded' };
                        case 'Rejected': return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rejected' };
                        case 'PayPal Issue': return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'PayPal Issue' };
                        case 'Need More Info': return { bg: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Info Needed' };
                        default: return { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: status };
                      }
                    };

                    const getProgressStepIndex = (status: Order['orderStatus']) => {
                      switch (status) {
                        case 'Pending':
                        case 'Need More Info':
                          return 1;
                        case 'Ordered':
                        case 'PayPal Issue':
                          return 2;
                        case 'Delivered':
                          return 3;
                        case 'Cashback Sent':
                        case 'Refunded':
                          return 4;
                        case 'Rejected':
                          return -1;
                        default:
                          return 1;
                      }
                    };

                    const statusInfo = getTrackingStatusBadge(o.orderStatus);
                    const stepIndex = getProgressStepIndex(o.orderStatus);
                    const matchedProduct = products.find(p => p.id === o.productId);
                    
                    return (
                      <div key={o.id} className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6 sm:p-8 space-y-6 text-left">
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono">ORDER ID</span>
                            <h4 className="font-mono text-sm font-extrabold text-slate-800 mt-0.5">{o.id}</h4>
                          </div>
                          <span className={`self-start sm:self-center inline-flex items-center rounded-full border px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Cashback Timeline Progress Bar */}
                        {stepIndex !== -1 ? (
                          <div className="space-y-6 py-2">
                            <div className="relative flex items-center justify-between">
                              {/* Horizontal connector line */}
                              <div className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 h-[3px] bg-slate-100 z-0">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-500"
                                  style={{ width: `${stepIndex === 1 ? '0%' : stepIndex === 2 ? '33%' : stepIndex === 3 ? '66%' : '100%'}` }}
                                />
                              </div>

                              {/* Timeline Nodes */}
                              {[
                                { step: 1, name: 'Submitted', desc: 'Claim uploaded', label: '1' },
                                { step: 2, name: 'Confirmed', desc: 'Receipt verified', label: '2' },
                                { step: 3, name: 'Delivered', desc: 'Item received', label: '3' },
                                { step: 4, name: 'Rebated', desc: 'Cashback sent', label: '✓' }
                              ].map((node) => {
                                const isPassed = stepIndex >= node.step;
                                const isCurrent = stepIndex === node.step;
                                return (
                                  <div key={node.step} className="flex flex-col items-center relative z-10 w-1/4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                      isPassed 
                                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/10' 
                                        : 'bg-slate-50 border border-slate-200 text-slate-400'
                                    } ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white scale-110' : ''}`}>
                                      {node.label}
                                    </div>
                                    <span className={`mt-2 font-sans text-[11px] font-bold ${isPassed ? 'text-slate-800' : 'text-slate-400'}`}>{node.name}</span>
                                    <span className="hidden sm:block text-[9px] text-slate-500 text-center mt-0.5 max-w-[80px] leading-tight font-normal">{node.desc}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* Rejected State Banner */
                          <div className="bg-rose-50 border border-rose-150 p-4 rounded-2xl flex items-start gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                              <p className="font-bold text-rose-800 text-xs font-sans">Cashback Request Rejected</p>
                              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed font-sans">
                                This cashback submission has been rejected. Please review the seller notes below or contact support.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Status notification boxes / interactive actions */}
                        <div className="space-y-4 font-sans">
                          {/* If status needs more details or PayPal backlog */}
                          {(o.orderStatus === 'Need More Info' || o.orderStatus === 'PayPal Issue' || o.orderStatus === 'Rejected') && o.sellerNotes && (
                            <div className="bg-amber-50 border border-amber-150 p-4 rounded-2xl space-y-1">
                              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
                                <span>💬</span>
                                <span>Seller Feedback/Notes:</span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed font-normal italic">
                                "{o.sellerNotes}"
                              </p>
                            </div>
                          )}

                          {/* If cashback is sent */}
                          {o.orderStatus === 'Cashback Sent' && (
                            <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl space-y-3">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                                <span>🎉</span>
                                <span>Cashback Payout Sent Successfully!</span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">
                                The seller has processed your cashback rebate of <strong>${matchedProduct?.cashbackAmount.toFixed(2) || '0.00'}</strong> using your preferred method ({o.paymentMethod || 'PayPal'}).
                              </p>
                              {o.cashbackProof && (
                                <div className="space-y-2 pt-1 text-left">
                                  <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Cashback Screenshot / Payout Proof:</span>
                                  {o.cashbackProof.startsWith('data:image/') || o.cashbackProof.startsWith('http') ? (
                                    <div className="relative group max-w-sm rounded-lg overflow-hidden border border-emerald-200 bg-white shadow-sm">
                                      <img 
                                        src={o.cashbackProof} 
                                        alt="Cashback screenshot proof" 
                                        className="w-full max-h-48 object-contain cursor-zoom-in"
                                        referrerPolicy="no-referrer"
                                        onClick={() => window.open(o.cashbackProof, '_blank')}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={() => window.open(o.cashbackProof, '_blank')}>
                                        <span className="text-white text-[10px] font-bold bg-slate-950/80 px-2.5 py-1 rounded-full">View Full Screen 🔍</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="pt-1">
                                      <a 
                                        href={o.cashbackProof} 
                                        target="_blank" 
                                        referrerPolicy="no-referrer"
                                        rel="noreferrer" 
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-750 text-white px-3 py-1.5 text-[10px] font-bold transition cursor-pointer shadow-sm"
                                      >
                                        <span>📄</span>
                                        <span>View Cashback Proof Receipt</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* If order is Refunded */}
                          {o.orderStatus === 'Refunded' && (
                            <div className="bg-teal-50 border border-teal-150 p-4 rounded-2xl space-y-3">
                              <div className="flex items-center gap-1.5 text-teal-850 font-bold text-[11px]">
                                <span>🎉</span>
                                <span>Your Refund has been Processed!</span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed font-normal">
                                The merchant has successfully processed your refund rebate.
                              </p>
                              {o.sellerNotes && (
                                <p className="text-slate-500 text-[10px] italic">
                                  Seller comments: "{o.sellerNotes}"
                                </p>
                              )}
                              {o.cashbackProof && (
                                <div className="space-y-2 pt-1">
                                  <span className="block text-[10px] font-bold text-teal-800 uppercase tracking-wider">Refund Screenshot / Receipt Proof:</span>
                                  {o.cashbackProof.startsWith('data:image/') || o.cashbackProof.startsWith('http') ? (
                                    <div className="relative group max-w-sm rounded-xl overflow-hidden border border-teal-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                                      <img 
                                        src={o.cashbackProof} 
                                        alt="Refund screenshot proof" 
                                        className="w-full max-h-80 object-contain bg-slate-50 cursor-zoom-in"
                                        referrerPolicy="no-referrer"
                                        onClick={() => window.open(o.cashbackProof, '_blank')}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={() => window.open(o.cashbackProof, '_blank')}>
                                        <span className="text-white text-[10px] font-bold bg-slate-950/80 px-2.5 py-1 rounded-full">View Full Screen 🔍</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="pt-1">
                                      <a 
                                        href={o.cashbackProof} 
                                        target="_blank" 
                                        referrerPolicy="no-referrer"
                                        rel="noreferrer" 
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-650 hover:bg-teal-700 text-white px-3 py-1.5 text-[10px] font-bold transition cursor-pointer shadow-sm"
                                      >
                                        <span>📄</span>
                                        <span>View Refund Proof Receipt</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Inline Delivery screenshot upload for pending / ordered items */}
                          {(o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') && (
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                              <div>
                                <h5 className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>📦</span>
                                  <span>Submit Package Delivery Screenshot</span>
                                </h5>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                  Has the item arrived? Upload a screenshot of your Amazon "Delivered" page below. This alerts the merchant to process your refund.
                                </p>
                              </div>

                              {o.deliveryScreenshotUrl ? (
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-150 p-2.5 rounded-xl text-[10.5px]">
                                  <span className="text-emerald-800 flex items-center gap-1.5 font-bold">
                                    <span>✓</span>
                                    <span>Delivery screenshot uploaded</span>
                                  </span>
                                  <a 
                                    href={o.deliveryScreenshotUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-slate-500 hover:text-slate-800 hover:underline font-semibold"
                                  >
                                    View file
                                  </a>
                                </div>
                              ) : (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`track-delivery-input-${o.id}`)?.click()}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-200 bg-white text-indigo-600 hover:bg-slate-50 px-4 py-3 text-[10.5px] font-bold transition-all duration-300 cursor-pointer shadow-sm"
                                    disabled={isUploadingDeliveryMap[o.id]}
                                  >
                                    {isUploadingDeliveryMap[o.id] ? (
                                      <span className="flex items-center gap-1">
                                        <span className="animate-pulse">⏳</span>
                                        <span>Syncing screenshot...</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5">
                                        <span>📷</span>
                                        <span>Upload Amazon Delivery Screenshot</span>
                                      </span>
                                    )}
                                  </button>

                                  <input 
                                    id={`track-delivery-input-${o.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        setIsUploadingDeliveryMap(prev => ({ ...prev, [o.id]: true }));
                                        
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                          const base64Url = reader.result as string;
                                          try {
                                            await onSubmitDeliveryProof(o.id, base64Url);
                                          } catch (err: any) {
                                            alert(`Error uploading delivery proof: ${err.message}`);
                                          } finally {
                                            setIsUploadingDeliveryMap(prev => ({ ...prev, [o.id]: false }));
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Transaction details grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-950/50 border border-slate-850 p-4 rounded-2xl text-[10.5px] text-slate-400 font-sans">
                          <div>
                            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Product Name</span>
                            <span className="block text-white font-bold mt-0.5 truncate max-w-[180px]" title={matchedProduct?.name || o.productName}>
                              {matchedProduct?.name || o.productName}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Cashback Amount</span>
                            <span className="block text-emerald-400 font-extrabold mt-0.5">
                              ${matchedProduct?.cashbackAmount.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Preferred Payment</span>
                            <span className="block text-slate-300 font-bold mt-0.5">
                              {o.paymentMethod || 'PayPal'} ({o.paymentId || 'N/A'})
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-500 uppercase tracking-wider">Referred Agent</span>
                            <span className="block text-indigo-400 font-bold mt-0.5">
                              {o.agentName} (Code: <code>{o.agentReferralCode}</code>)
                            </span>
                          </div>
                          <div className="border-pt border-slate-850 pt-2 col-span-2 flex items-center justify-between text-[9px] text-slate-500">
                            <span>Submitted: {new Date(o.createdAt).toLocaleString()}</span>
                            <span>Updated: {new Date(o.updatedAt || o.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                /* No Orders Found Empty State */
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-3">
                  <span className="text-4xl">🔍</span>
                  <h4 className="font-sans text-sm font-bold text-white">No Matching Orders Found</h4>
                  <p className="font-sans text-xs text-slate-450 max-w-xs mx-auto leading-relaxed">
                    We couldn't find any cashback records for <code>"{trackingIdInput}"</code>. Please double-check your Order ID format or WhatsApp number.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Guidelines info */}
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl text-xs space-y-2 text-slate-400 leading-relaxed text-left">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
              <Info className="h-4 w-4" />
              <span>Rebate Tracking Instructions:</span>
            </div>
            <p>1. If searching by **WhatsApp Number**, enter the exact phone number matching your account or claim registration.</p>
            <p>2. If searching by **Order ID**, verify the exact 17-digit code from your Amazon confirmation page (e.g., 114-xxxxxxx-xxxxxxx).</p>
            <p>3. Once your order is verified by the seller, its status moves from **Submitted** to **Confirmed** and eventually **Cashback Sent**.</p>
          </div>
        </div>
      )}

      {/* ------------------------ SECTION C: MY ORDERS SECTION (BUYER LOGIN) ------------------------ */}
      {currentTab === 'orders' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pt-4">
          {!buyerSession ? (
            /* Buyer Account authentication / creation component */
            <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-[2.2rem] p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <History className="h-40 w-40 text-indigo-200" />
              </div>

              <div className="space-y-2 text-center relative z-10">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <User className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  {authMode === 'signin' ? 'Buyer Account Sign In' : 'Create New Buyer Account'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {authMode === 'signin' 
                    ? 'Enter your unique Sign-In Name to quickly synchronize and unlock your cashback orders.' 
                    : 'Register with a unique Sign-In Name to automate your cashback order submission sheets.'}
                </p>
              </div>

              {loginError && (
                <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                  {loginError}
                </p>
              )}

              {authMode === 'signin' ? (
                <form onSubmit={handleBuyerLoginSubmit} className="space-y-4 relative z-10 text-left">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Unique Sign-In Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. alexander77"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs shadow-md shadow-indigo-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    AUTHENTICATE ACCOUNT
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setLoginError('');
                      }}
                      className="text-xs text-indigo-600 font-bold hover:text-indigo-800 hover:underline"
                    >
                      New here? Create your Unique Sign-In Name →
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBuyerRegisterSubmit} className="space-y-4 relative z-10 text-left">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Choose unique sign-in name (lowercase, no spaces):</label>
                      <input
                        type="text"
                        placeholder="e.g. janedoe42"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Full Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Doe"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your WhatsApp Number:</label>
                      <input
                        type="text"
                        placeholder="e.g. +1 (555) 765-4321"
                        required
                        value={regWhatsApp}
                        onChange={(e) => setRegWhatsApp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preferred Payout Option:</label>
                        <select
                          value={regPaymentMethod}
                          onChange={(e) => setRegPaymentMethod(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                        >
                          <option value="PayPal">PayPal</option>
                          <option value="Venmo">Venmo</option>
                          <option value="Zelle">Zelle</option>
                          <option value="CashApp">CashApp</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Handle / ID:</label>
                        <input
                          type="text"
                          placeholder="e.g. @username or email"
                          required
                          value={regPaymentId}
                          onChange={(e) => setRegPaymentId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isRegistering ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & SIGN IN'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setLoginError('');
                      }}
                      className="text-xs text-indigo-600 font-bold hover:text-indigo-800 hover:underline"
                    >
                      Already have an account? Sign In →
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Authenticated Buyer Orders display */
            <div className="space-y-6">
              
              {/* Authenticated Header banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-base font-extrabold shadow-sm">
                    👤
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-800">Active session: {buyerSession.name} ({buyerSession.username})</h3>
                    <p className="text-xs text-slate-500">Preferred payout: <strong className="font-mono text-indigo-650">{buyerSession.paymentMethod} ({buyerSession.paymentId})</strong> • WhatsApp: <strong className="font-mono text-indigo-600">{buyerSession.whatsApp}</strong></p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentTab('deals')}
                    className="bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Browse More Deals
                  </button>
                  <button 
                    onClick={onSignOutBuyer}
                    className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Disconnect Account
                  </button>
                </div>
              </div>

              {/* Needs Delivery Proof Warning Banner */}
              {buyerOrders.filter(o => (o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') && !o.deliveryScreenshotUrl).length > 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 flex items-start gap-3 shadow-sm">
                  <span className="text-xl">📸</span>
                  <div className="text-left">
                    <h5 className="font-extrabold text-amber-900 mb-0.5">
                      📸 Action needed on {buyerOrders.filter(o => (o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') && !o.deliveryScreenshotUrl).length} order{buyerOrders.filter(o => (o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') && !o.deliveryScreenshotUrl).length > 1 ? 's' : ''}!
                    </h5>
                    <p className="leading-relaxed text-slate-600">
                      Your purchase has been documented! To release your cashback payment, please select **Mark as Delivered** on the respective order below to easily drag and drop your package status screenshot.
                    </p>
                  </div>
                </div>
              )}

              {/* Stat Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('all')}
                  className={`border p-4 rounded-2xl text-center transition-all cursor-pointer ${
                    activeOrderFilter === 'all' 
                      ? 'bg-indigo-50/50 border-indigo-600 ring-1 ring-indigo-500/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Cashback Claimed</span>
                  <span className="block font-mono text-xl font-bold text-slate-900">
                    ${buyerOrders.reduce((sum, o) => {
                      const p = products.find(x => x.id === o.productId);
                      return sum + (p ? p.cashbackAmount : 0);
                    }, 0).toFixed(2)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('completed')}
                  className={`border p-4 rounded-2xl text-center transition-all cursor-pointer ${
                    activeOrderFilter === 'completed' 
                      ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-500/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Delivered / Paid</span>
                  <span className="block font-mono text-xl font-bold text-emerald-600">
                    ${buyerOrders.filter(o => o.orderStatus === 'Cashback Sent' || o.orderStatus === 'Refunded').reduce((sum, o) => {
                      const p = products.find(x => x.id === o.productId);
                      return sum + (p ? p.cashbackAmount : 0);
                    }, 0).toFixed(2)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('all')}
                  className={`border p-4 rounded-2xl text-center transition-all cursor-pointer ${
                    activeOrderFilter === 'all' 
                      ? 'bg-indigo-50/50 border-indigo-600 ring-1 ring-indigo-500/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Submitted Orders</span>
                  <span className="block font-mono text-xl font-bold text-indigo-600">
                    {buyerOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('needs_proof')}
                  className={`border p-4 rounded-2xl text-center transition-all cursor-pointer ${
                    activeOrderFilter === 'needs_proof' 
                      ? 'bg-amber-50/50 border-amber-650 ring-1 ring-amber-500/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Needs Delivery Proof</span>
                  <span className="block font-mono text-xl font-bold text-amber-700">
                    {buyerOrders.filter(o => (o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') && !o.deliveryScreenshotUrl).length}
                  </span>
                </button>
              </div>

              {/* Categorized Portions Tab Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold font-sans">
                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('all')}
                  className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeOrderFilter === 'all' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>📋 All Orders</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeOrderFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {buyerOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('needs_proof')}
                  className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeOrderFilter === 'needs_proof' 
                      ? 'bg-amber-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>📸 Needs Proof</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeOrderFilter === 'needs_proof' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {buyerOrders.filter(o => (o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') && !o.deliveryScreenshotUrl).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('processing')}
                  className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeOrderFilter === 'processing' 
                      ? 'bg-sky-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>⚡ Sub Checking</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeOrderFilter === 'processing' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {buyerOrders.filter(o => o.deliveryScreenshotUrl && o.orderStatus !== 'Cashback Sent' && o.orderStatus !== 'Refunded').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOrderFilter('completed')}
                  className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeOrderFilter === 'completed' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>💵 Cashback Done</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeOrderFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {buyerOrders.filter(o => o.orderStatus === 'Cashback Sent' || o.orderStatus === 'Refunded').length}
                  </span>
                </button>
              </div>

              {/* Order Lists Grid */}
              {buyerOrders.length > 0 ? (
                displayedOrders.length > 0 ? (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">
                          {activeOrderFilter === 'all' && 'All Synchronized Orders'}
                          {activeOrderFilter === 'needs_proof' && 'Orders Awaiting Delivery Snapshot'}
                          {activeOrderFilter === 'processing' && 'Awaiting Cashback Refund processing'}
                          {activeOrderFilter === 'completed' && 'Delivered & Cashback Sent'}
                        </h4>
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold font-mono px-2.5 py-1 rounded-full border border-indigo-200">
                        {displayedOrders.length} {displayedOrders.length === 1 ? 'Order' : 'Orders'} filtered
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xs animate-fadeIn">
                      
                      {/* Live Synchronized header info bar */}
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 font-sans uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                            Active Google Sheet Database Synchronized
                          </span>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold font-mono px-2.5 py-1 rounded-full border border-indigo-200">
                          {displayedOrders.length} {displayedOrders.length === 1 ? 'Order' : 'Orders'} synchronized
                        </span>
                      </div>

                      {/* Header columns - Desktop Only */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-sans text-left">
                        <div className="col-span-3">Item / Product</div>
                        <div className="col-span-2">Amazon Order ID</div>
                        <div className="col-span-2">Date & Agent</div>
                        <div className="col-span-2">Payout Method</div>
                        <div className="col-span-1">Cashback</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>

                      {/* Rows Collection */}
                      <div className="divide-y divide-slate-200 bg-transparent">
                        {displayedOrders.map((o) => {
                          const activeProduct = products.find(p => p.id === o.productId);
                          const fallbackProductImg = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400";
                          const productImage = activeProduct?.imageUrl || fallbackProductImg;
                          const isExpanded = expandedOrderId === o.id;
                          const isEditing = editingOrderId === o.id;

                          if (isEditing) {
                            return (
                              <div key={o.id} className="p-4 bg-slate-50/75 border-b border-slate-200 animate-fadeIn text-left">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                                  <div className="col-span-12 lg:col-span-3 flex items-center gap-2">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Editing:</span>
                                    <span className="text-xs font-bold truncate text-slate-700 max-w-xs">{o.productName}</span>
                                  </div>
                                  <div className="col-span-12 lg:col-span-3">
                                    <input 
                                      type="text"
                                      value={editOrderIdVal}
                                      onChange={(e) => setEditOrderIdVal(e.target.value)}
                                      className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
                                      placeholder="Amazon Order ID"
                                      required
                                    />
                                  </div>
                                  <div className="col-span-6 lg:col-span-2">
                                    <select
                                      value={editPaymentMethod}
                                      onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                                      className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 font-bold"
                                    >
                                      <option value="PayPal">PayPal</option>
                                      <option value="Zelle">Zelle</option>
                                      <option value="Venmo">Venmo</option>
                                      <option value="CashApp">CashApp</option>
                                    </select>
                                  </div>
                                  <div className="col-span-6 lg:col-span-2">
                                    <input 
                                      type="text"
                                      value={editPaymentId}
                                      onChange={(e) => setEditPaymentId(e.target.value)}
                                      className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-505 font-semibold text-slate-805"
                                      placeholder="Account tag or email"
                                      required
                                    />
                                  </div>
                                  <div className="col-span-12 lg:col-span-2 flex items-center justify-end gap-2 pt-2 lg:pt-0">
                                    <button 
                                      onClick={async () => {
                                        if (!editOrderIdVal.trim()) {
                                          alert('Amazon Order ID is required');
                                          return;
                                        }
                                        try {
                                          if (onUpdateOrderDetails) {
                                            await onUpdateOrderDetails(o.id, editOrderIdVal, editPaymentMethod, editPaymentId);
                                          }
                                          setEditingOrderId(null);
                                        } catch (err: any) {
                                          alert(`Error saving edits: ${err.message}`);
                                        }
                                      }}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Save
                                    </button>
                                    <button 
                                      onClick={() => setEditingOrderId(null)}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10.5px] px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5" /> Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={o.id} 
                              className={`transition-all duration-250 ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50 bg-transparent'} relative`}
                            >
                              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center px-4 py-3 sm:px-6 text-left">
                                
                                {/* Item Column */}
                                <div className="col-span-12 lg:col-span-3 flex items-center gap-3 min-w-0">
                                  <div className="relative w-8.5 h-8.5 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-150 shadow-2xs">
                                    <img 
                                      src={productImage} 
                                      alt={o.productName} 
                                      className="w-full h-full object-contain p-1"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide border ${statusColors[o.orderStatus] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {o.orderStatus}
                                      </span>
                                    </div>
                                    <h5 className="text-[11.5px] font-semibold text-slate-800 truncate max-w-[210px] mt-0.5" title={o.productName}>
                                      {o.productName}
                                    </h5>
                                  </div>
                                </div>

                                {/* Amazon Order ID Column */}
                                <div className="col-span-6 lg:col-span-2 text-left">
                                  <span className="lg:hidden text-[9px] font-bold text-slate-400 block uppercase font-mono">Amazon Order ID</span>
                                  <span className="font-mono text-[11px] font-bold text-indigo-700 select-all block bg-slate-50 px-2 py-0.5 border border-slate-150 rounded">
                                    {o.id}
                                  </span>
                                </div>

                                {/* Date & Agent Column */}
                                <div className="col-span-6 lg:col-span-2 text-left text-xs text-slate-500 font-sans">
                                  <span className="lg:hidden text-[9px] font-bold text-slate-400 block uppercase font-mono">Date / Agent</span>
                                  <div className="text-[10.5px]">
                                    <span className="block text-slate-700 font-semibold font-sans">📅 {o.createdAt ? o.createdAt.split('T')[0] : 'Just now'}</span>
                                    <span className="block text-[9.5px] text-slate-500">🤝 Code: <strong className="text-slate-600 font-mono">{o.agentReferralCode || 'Direct'}</strong></span>
                                  </div>
                                </div>

                                {/* Payout Destination Column */}
                                <div className="col-span-6 lg:col-span-2 text-left">
                                  <span className="lg:hidden text-[9px] font-bold text-slate-400 block uppercase font-mono">Payout Destination</span>
                                  {o.paymentMethod ? (
                                    <div className="text-[10.5px] truncate">
                                      <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[8.5px] border border-indigo-100 font-mono uppercase inline-block">
                                        {o.paymentMethod}
                                      </span>
                                      <span className="ml-1.5 text-slate-600 block sm:inline italic font-medium text-[10px] truncate">{o.paymentId}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[10.5px] italic">Not set</span>
                                  )}
                                </div>

                                {/* Cashback Column */}
                                <div className="col-span-6 lg:col-span-1 text-left lg:text-center">
                                  <span className="lg:hidden text-[9px] font-bold text-slate-400 block uppercase font-mono">Cashback Payout</span>
                                  <span className="text-[12.5px] font-black text-emerald-600 font-mono block">
                                    +${(activeProduct?.cashbackAmount || 15).toFixed(2)}
                                  </span>
                                </div>

                                {/* Dynamic Action Options Column */}
                                <div className="col-span-12 lg:col-span-2 flex items-center justify-end gap-1.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                  
                                  {/* 1. Modify Payment Details Button */}
                                  <button
                                    onClick={() => {
                                      setEditingOrderId(o.id);
                                      setEditOrderIdVal(o.id);
                                      setEditPaymentMethod(o.paymentMethod || 'PayPal');
                                      setEditPaymentId(o.paymentId || '');
                                    }}
                                    title="Modify Amazon ID or Payout Destination"
                                    className="p-1 px-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                                  >
                                    <Pencil className="w-3 h-3 text-indigo-600" />
                                    <span>Modify</span>
                                  </button>

                                  {/* 2. Check Status / Details Toggle Button */}
                                  <button
                                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                                    title="Check Order Status & Delivery Photo Upload"
                                    className={`p-1 px-2 text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer rounded-lg border shadow-xs hover:scale-105 active:scale-95 ${isExpanded ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-750' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                  >
                                    <span>🔍</span>
                                    <span>{isExpanded ? 'Hide' : 'Check Status'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Nested Collapsible Drawer for checking details, uploading delivery SS, seeing agent notes */}
                              {isExpanded && (
                                <div className="px-4 pb-5 pt-1 sm:px-6 border-t border-slate-200 bg-slate-50/50 animate-slideDown space-y-4">
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-left">
                                    
                                    {/* Left: Progress Stepper */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                      <span className="block text-[8px] text-slate-400 font-mono uppercase font-bold tracking-widest mb-3 text-left">Synchronized Lifecycle Status</span>
                                      
                                      <div className="flex flex-col gap-2.5">
                                        {[
                                          { label: 'Claim Submitted Successfully', active: true, color: 'text-indigo-600', bg: 'bg-indigo-600' },
                                          { label: 'Claim Verified by Brand Manager', active: ['Ordered', 'Delivered', 'Cashback Sent'].includes(o.orderStatus), color: 'text-indigo-600', bg: 'bg-indigo-600' },
                                          { label: 'Delivered / Box Photo Logs Saved', active: ['Delivered', 'Cashback Sent'].includes(o.orderStatus), color: 'text-teal-600', bg: 'bg-teal-600' },
                                          { label: 'Rebate Sent via Preferred Channel', active: o.orderStatus === 'Cashback Sent', color: 'text-emerald-600', bg: 'bg-emerald-600' }
                                        ].map((step, idx) => {
                                          return (
                                            <div key={idx} className="flex items-center gap-2">
                                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${step.active ? `${step.bg} text-white` : 'bg-slate-200 text-slate-400'}`}>
                                                ✓
                                              </span>
                                              <span className={`text-[11px] text-left ${step.active ? 'text-slate-800 font-bold' : 'text-slate-400 font-normal'}`}>{step.label}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Right: Screenshot and Comments area */}
                                    <div className="space-y-3">
                                      
                                      {/* Agent Notes / Comments feedback block if any */}
                                      {o.sellerNotes && (
                                        <div className="bg-amber-50 text-amber-805 text-left text-[11px] px-3.5 py-2.5 border border-amber-200 rounded-2xl space-y-0.5">
                                          <strong className="block text-amber-850 font-sans font-bold">💬 Agent Comments:</strong>
                                          <p className="font-normal italic leading-normal font-sans">"{o.sellerNotes}"</p>
                                        </div>
                                      )}

                                      {/* Delivery proof interactive block */}
                                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                        <span className="block text-[8px] text-slate-400 font-mono uppercase font-bold tracking-widest mb-3 text-left">📦 Delivery Snapshot Proof</span>
                                        
                                        {o.deliveryScreenshotUrl ? (
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                                                <img 
                                                  src={o.deliveryScreenshotUrl} 
                                                  alt="Delivered product block" 
                                                  className="w-full h-full object-cover"
                                                  referrerPolicy="no-referrer"
                                                />
                                              </div>
                                              <div className="text-left">
                                                <span className="text-[11.5px] font-bold text-emerald-700 block">Package Image Logged!</span>
                                                <span className="text-[9px] text-slate-500 block font-normal text-left">Auto-synced to live Google Sheets.</span>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <a 
                                                href={o.deliveryScreenshotUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                                              >
                                                View
                                              </a>
                                              <button
                                                onClick={() => {
                                                  const fileInputEdit = document.getElementById(`edit-delivery-input-${o.id}`) as HTMLInputElement;
                                                  fileInputEdit?.click();
                                                }}
                                                className="text-[10px] font-bold text-amber-705 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                                              >
                                                Replace
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          /* Needs Upload */
                                          <div className="space-y-2">
                                            <p className="text-[10px] text-slate-500 text-left font-normal leading-normal">
                                              Please assist in uploading a real photograph of your delivered package bag or box to synchronize release feedback.
                                            </p>
                                            <div 
                                              onClick={() => {
                                                const fileInputObj = document.getElementById(`edit-delivery-input-${o.id}`) as HTMLInputElement;
                                                fileInputObj?.click();
                                              }}
                                              className={`border border-dashed border-indigo-200 hover:border-indigo-500 rounded-xl p-3.5 text-center cursor-pointer transition-all duration-200 hover:bg-indigo-50/30 bg-slate-50 text-[10.5px] font-bold text-slate-500 hover:text-indigo-700 ${isUploadingDeliveryMap[o.id] ? 'animate-pulse' : ''}`}
                                            >
                                              {isUploadingDeliveryMap[o.id] ? (
                                                <span className="text-indigo-600 animate-pulse flex items-center justify-center gap-1">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                                                  Syncing screenshot proof...
                                                </span>
                                              ) : (
                                                <span className="flex items-center justify-center gap-1.5">
                                                  <span>📷</span>
                                                  <span>Upload Delivery Snapshot</span>
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                    </div>
                                  </div>

                                  {/* Invisible File Input inside Drawer */}
                                  <input 
                                    id={`edit-delivery-input-${o.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        setIsUploadingDeliveryMap(prev => ({ ...prev, [o.id]: true }));
                                        
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                          const base64Url = reader.result as string;
                                          try {
                                            await onSubmitDeliveryProof(o.id, base64Url);
                                          } catch (err: any) {
                                            alert(`Error uploading delivery proof: ${err.message}`);
                                          } finally {
                                            setIsUploadingDeliveryMap(prev => ({ ...prev, [o.id]: false }));
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-xl mb-3">✨</div>
                      <p className="font-sans text-sm font-bold text-slate-700">All caught up here!</p>
                      <p className="font-sans text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        No orders are currently in this status category. Try selecting another segment tab above.
                      </p>
                    </div>
                  )
              ) : (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl">
                  <FileText className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                  <p className="font-sans text-sm font-bold text-slate-700">No matching orders logged</p>
                  <p className="font-sans text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    If you already submitted an order with WhatsApp {buyerSession.whatsApp}, make sure it matches your sheet record exactly, or ask your referral agent.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------ SECTION D: AGENT INTRODUCTORY SPACE ------------------------ */}
      {currentTab === 'agent' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pt-4 text-left">
          <div className="text-center space-y-2">
            <span className="text-3xl">🤝</span>
            <h3 className="text-xl font-bold text-slate-800">Representative Affiliate Network</h3>
            <p className="text-xs text-slate-500">Are you an active cashback agent? Expand community links and earn stable commissions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="text-sm font-bold text-indigo-700 py-1 border-b border-slate-100">How Agents Scale Payouts:</h4>
              <ul className="space-y-3.5 text-xs text-slate-650">
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Share custom tracking links (e.g. `?ref=YOUR_CODE`) directly on WhatsApp groups.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Assist buyers directly in capturing purchase screenshots and confirming order keys.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Submit the details inside their exclusive secure **Agent Desk** interface.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Earn commission overrides on every single verified item disbursed.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 text-center flex flex-col items-center justify-center shadow-sm">
              <span className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 text-lg">
                🔑
              </span>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Ready to manage your active buyer network or submit rebates? Select **Agent Login** from the bottom footer to authenticate your dashboard with a passcode.
              </p>
              
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-150 px-3.5 py-1 text-[10px] font-medium rounded-full">
                Trusted Affiliate Portal Security
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ------------------------ MODAL 1: STUNNING PRODUCT DETAILS ------------------------ */}
      {false && activeProductForModal && (
        <div id="tutorial-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-[2.5rem] bg-slate-900 border border-slate-850 p-6 sm:p-8 space-y-6 animate-scaleUp text-slate-200">
            
            <button 
              onClick={() => {
                setActiveProductForModal(null);
                setIsSubmitOrderOpen(false);
              }} 
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition duration-200"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* SUB-HEADER COMPACT PRODUCT REBATE CARD (COMBINED LINK & STATS) */}
            <div className="bg-slate-950/45 border border-slate-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 transition-all text-left">
              <img 
                src={activeProductForModal.imageUrl} 
                alt={activeProductForModal.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-850 shrink-0 select-none"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600";
                }}
              />
              <div className="flex-1 text-center sm:text-left space-y-0.5 min-w-0">
                <h4 className="text-[10px] font-extrabold text-[#1bc2ff] uppercase tracking-widest font-mono">STEP 1: Amazon Purchase</h4>
                <p className="text-xs font-bold text-white truncate">{activeProductForModal.name}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <span className="text-sm font-black text-emerald-400 font-mono">${activeProductForModal.cashbackAmount.toFixed(2)} Cashback</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded-full font-bold">100% Tax Covered</span>
                </div>
              </div>
              <a
                href={activeProductForModal.amazonLink}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-gradient-to-r from-[#ffe14f] to-[#ffb11b] hover:from-[#ffea75] hover:to-[#ffa700] text-slate-950 font-black px-4 py-2.5 rounded-xl transition duration-300 text-xs text-center flex items-center justify-center gap-1.5 font-bold shrink-0 text-[11px]"
              >
                <span>🛒 Buy on Amazon</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-900" />
              </a>
            </div>

            <div id="cashback-wizard" className="space-y-4">
              <div className="flex items-center gap-2 border-b border-indigo-950/60 pb-1">
                <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-300">STEP 2: Claim Cashback</h3>
                </div>
              </div>

                {submissionSuccess ? (
                  <div className="py-8 text-center space-y-4 animate-fadeIn">
                    <div className="w-14 h-14 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                      🎉
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">Order Submitted!</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm mx-auto">
                        Your purchase rebate claim has been added to the database sheet!
                      </p>
                    </div>

                    <div className="flex justify-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionSuccess(false);
                          setIsSubmitOrderOpen(false);
                          setActiveProductForModal(null);
                          setCurrentTab('orders');
                        }}
                        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs rounded-xl text-white transition-all cursor-pointer shadow-md"
                      >
                        Go to My Orders
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!buyerSession ? (
                      /* Integrated Mini Auth in Modal for non-members */
                      <div className="bg-slate-950/45 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                        <div className="text-center space-y-1">
                          <h4 className="font-bold text-white text-xs">Unlock Cashback Connection</h4>
                          <p className="text-[10px] text-slate-400 max-w-xs mx-auto text-center">
                            Identify your session so we can credit the rebate directly to your Zelle / PayPal!
                          </p>
                        </div>

                        {/* Inline Selector tabs */}
                        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => { setMiniAuthMode('signin'); setMiniLoginError(''); }}
                            className={`py-1.5 rounded-lg transition-all cursor-pointer ${miniAuthMode === 'signin' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                            Sign In
                          </button>
                          <button
                            type="button"
                            onClick={() => { setMiniAuthMode('register'); setMiniLoginError(''); }}
                            className={`py-1.5 rounded-lg transition-all cursor-pointer ${miniAuthMode === 'register' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                            New Account
                          </button>
                        </div>

                        {miniLoginError && (
                          <p className="text-[10px] text-red-500 text-center font-semibold bg-red-950/20 border border-red-500/10 rounded-lg p-1.5">
                            ⚠️ {miniLoginError}
                          </p>
                        )}

                        {miniAuthMode === 'signin' ? (
                          <form onSubmit={handleMiniLoginSubmit} className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Your Unique Sign-In Name</label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-indigo-400 font-mono font-bold">@</span>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. alex12"
                                  value={miniLoginUsername}
                                  onChange={(e) => setMiniLoginUsername(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-705 font-mono"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer"
                            >
                              Initialize Profile
                            </button>
                          </form>
                        ) : (
                          <form onSubmit={handleMiniRegisterSubmit} className="space-y-3 text-[11px]">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="block text-[9.5px] text-slate-400 font-bold uppercase">Sign-In Name</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="alex12"
                                  value={miniRegUsername}
                                  onChange={(e) => setMiniRegUsername(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9.5px] text-slate-400 font-bold uppercase">Full Name</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Alex Wright"
                                  value={miniRegName}
                                  onChange={(e) => setMiniRegName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="block text-[9.5px] text-slate-400 font-bold uppercase">WhatsApp No</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="+14155551234"
                                  value={miniRegWhatsApp}
                                  onChange={(e) => setMiniRegWhatsApp(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9.5px] text-slate-400 font-bold uppercase">Payout Type</label>
                                <select
                                  value={miniRegPaymentMethod}
                                  onChange={(e) => setMiniRegPaymentMethod(e.target.value as any)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-semibold animate-none"
                                >
                                  <option value="PayPal">PayPal</option>
                                  <option value="Venmo">Venmo</option>
                                  <option value="Zelle">Zelle</option>
                                  <option value="CashApp">Cash App</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9.5px] text-slate-400 font-bold uppercase">Wallet Payout Username / ID</label>
                              <input
                                type="text"
                                required
                                placeholder="paypal email or $cashtag"
                                value={miniRegPaymentId}
                                onChange={(e) => setMiniRegPaymentId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isMiniRegistering}
                              className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-45 text-white font-bold rounded-xl transition-all cursor-pointer"
                            >
                              {isMiniRegistering ? 'Registering...' : 'Register and Continue'}
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      /* LOGGED IN - SIMPLIFIED COMPACT FORM WITH MINIMAL STEPS */
                      <form onSubmit={handleOrderSubmission} className="space-y-4">
                        {/* Connected Pill banner displaying payout details */}
                        <div className="bg-emerald-950/20 border border-emerald-500/15 p-2.5 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex flex-col text-left">
                            <span className="text-emerald-400 font-bold">👤 @{buyerSession.username} ({buyerSession.name})</span>
                            <span className="text-[10px] text-slate-400">Rebate destination: <strong className="text-white font-mono">{buyerSession.paymentMethod} ({buyerSession.paymentId})</strong></span>
                          </div>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono uppercase font-bold shrink-0">
                            Connected
                          </span>
                        </div>

                        {/* Order ID field */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="block text-[9.5px] font-bold text-indigo-300 uppercase">Amazon Order ID *</label>
                            <span className="text-[9px] text-slate-500 font-mono">17-digit format</span>
                          </div>
                          <input
                            type="text"
                            required
                            value={formOrderId}
                            onChange={(e) => setFormOrderId(e.target.value)}
                            placeholder="e.g. 111-4890812-3450912"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-700"
                          />
                        </div>

                        {/* Upload box */}
                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-indigo-300 uppercase">Order Confirmation Screenshot *</label>
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={handleManualUploadClick}
                            className={`border border-dashed rounded-xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                              dragActive 
                                ? 'border-indigo-500 bg-indigo-500/10' 
                                : screenshotBase64 
                                  ? 'border-emerald-500/40 bg-emerald-500/10' 
                                  : 'border-slate-800 hover:border-slate-755 bg-slate-950/60'
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />

                            {screenshotBase64 ? (
                              <div className="flex items-center gap-3 w-full justify-center">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800">
                                  <img src={screenshotBase64} alt="Thumbnail" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left">
                                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Screen Captured!
                                  </p>
                                  <p className="text-[9px] text-slate-400 truncate max-w-[180px]">{screenshotFileName || 'order_screenshot.png'}</p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setScreenshotBase64('');
                                    setScreenshotFileName('');
                                  }}
                                  className="text-[10px] text-rose-400 underline hover:text-rose-300 pl-2 ml-auto shrink-0"
                                >
                                  Reset
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 text-indigo-400" />
                                <p className="text-[10.5px] text-slate-350">
                                  <strong className="text-white">Click</strong> or drop screenshot of Amazon receipt
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Collapsible drawer for advanced options to minimize visual clutter */}
                        <div className="border border-slate-900 rounded-xl bg-slate-950/30 overflow-hidden text-[11px]">
                          <button
                            type="button"
                            onClick={() => setShowOptionalFields(!showOptionalFields)}
                            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <span className="font-semibold text-[10px] uppercase tracking-wider">Additional details (Optional)</span>
                            <span className="text-[10px] font-mono">{showOptionalFields ? '▲' : '▼'}</span>
                          </button>

                          {showOptionalFields && (
                            <div className="p-3 border-t border-slate-900 space-y-3 animate-fadeIn text-left">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                <div className="space-y-1 text-left">
                                  <label className="block text-[9.5px] text-slate-400 text-left">Referral Agent Code</label>
                                  <select
                                    value={formAgentCode}
                                    onChange={(e) => setFormAgentCode(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                                  >
                                    <option value="">None / Direct Hub</option>
                                    {agents.map((ag) => (
                                      <option key={ag.id} value={ag.referralCode}>
                                        {ag.name} ({ag.referralCode})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1 text-left">
                                  <label className="block text-[9.5px] text-slate-400 text-left">Custom Notes</label>
                                  <input
                                    type="text"
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder="Any messages..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-250 text-left"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProductForModal(null);
                              setIsSubmitOrderOpen(false);
                            }}
                            className="flex-1 rounded-xl py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingOrder || !screenshotBase64 || !formOrderId.trim()}
                            className="flex-[2] rounded-xl py-2 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-indigo-600/10 shadow-lg"
                          >
                            {isSubmittingOrder ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                <span>Syncing to Sheets...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                <span>Confirm & Submit Order</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>
      )}

    </div>
  );
}
