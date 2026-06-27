/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { 
  User, 
  Plus, 
  Upload, 
  Check, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Users, 
  PhoneCall, 
  History, 
  ShieldCheck, 
  AlertCircle,
  Copy,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Agent, Product, Order } from '../types';

interface AgentPageProps {
  agents: Agent[];
  products: Product[];
  orders: Order[];
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
  }) => Promise<any>;
}

export default function AgentPage({ agents, products, orders, onSubmitOrder }: AgentPageProps) {
  const [selectedAgentCode, setSelectedAgentCode] = useState<string>('');
  const [loggedInAgent, setLoggedInAgent] = useState<Agent | null>(null);
  
  // Passcode verification for quick access privacy
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');
  
  // Submit order form states
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('N/A');
  const [buyerWhatsApp, setBuyerWhatsApp] = useState<string>('N/A');
  const [notes, setNotes] = useState<string>('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'PayPal' | 'Venmo' | 'Zelle' | 'CashApp'>('PayPal');
  const [paymentId, setPaymentId] = useState<string>('');
  
  // Dynamic UI actions
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = agents.find(
      a => a.referralCode.toLowerCase() === selectedAgentCode.trim().toLowerCase()
    );
    if (found) {
      if (found.status === 'Inactive') {
        setSubmitError('This agent profile is currently Inactive. Contact Administrator.');
        return;
      }
      setLoggedInAgent(found);
      setSubmitError('');
    } else {
      setSubmitError('Referral Code not found. Please double-check or ask Admin.');
    }
  };

  // Pre-fill agent from list click for rapid sandbox preview but with PASSCODE privacy check!
  const handleQuickLogin = (agent: Agent) => {
    if (agent.status === 'Inactive') {
      alert('This agent is inactive!');
      return;
    }
    setPendingAgent(agent);
    setPasscodeInput('');
    setPasscodeError('');
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAgent) return;
    
    // Verify passcode matches referral code (case-insensitive)
    if (passcodeInput.trim().toLowerCase() === pendingAgent.referralCode.trim().toLowerCase()) {
      setLoggedInAgent(pendingAgent);
      setPendingAgent(null);
      setSubmitError('');
      setPasscodeInput('');
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid Passcode. Please try again.');
    }
  };

  // Convert image to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit to optimize speed
        setSubmitError('Screenshot is too large. Please upload an image under 2MB.');
        return;
      }
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result as string);
        setSubmitError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInAgent) return;
    if (!selectedProductId) {
      setSubmitError('Please select a product.');
      return;
    }
    if (!screenshotBase64) {
      setSubmitError('Please upload an order confirmation screenshot.');
      return;
    }
    if (!paymentId.trim()) {
      setSubmitError('Please specify the buyer\'s payout details.');
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      setSubmitError('Selected product not found.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await onSubmitOrder({
        orderId: orderId.trim(),
        productId: selectedProductId,
        productName: selectedProduct.name,
        buyerName: buyerName.trim(),
        buyerWhatsApp: buyerWhatsApp.trim(),
        agentName: loggedInAgent.name,
        agentReferralCode: loggedInAgent.referralCode,
        screenshotBase64,
        fileName: screenshotName || `screenshot_${orderId.trim()}.png`,
        notes: notes.trim(),
        paymentMethod,
        paymentId: paymentId.trim()
      });

      // Clear Form on success
      setOrderId('');
      setBuyerName('N/A');
      setBuyerWhatsApp('N/A');
      setNotes('');
      setScreenshotBase64('');
      setScreenshotName('');
      setPaymentMethod('PayPal');
      setPaymentId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter orders made by this agent
  const agentOrders = useMemo(() => {
    if (!loggedInAgent) return [];
    return orders.filter(
      o => o.agentReferralCode.toLowerCase() === loggedInAgent.referralCode.toLowerCase()
    );
  }, [orders, loggedInAgent]);

  const copyReferralLink = (code: string) => {
    // Generate refer url
    const link = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Set default status colors for ledger tracking grid
  const getStatusStyle = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Cashback Sent': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PayPal Issue': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Need More Info': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div id="agent-workspace" className="space-y-8 pb-16">
      
      {/* Login / Entrance Wall */}
      {!loggedInAgent ? (
        <div className="max-w-md mx-auto space-y-6 pt-10">
          <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2.2rem] p-6 sm:p-8 shadow-md text-center space-y-5">
            {/* Decorative curve */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full pointer-events-none" />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 relative">
              <User className="h-6 w-6" />
            </div>
            
            <div className="relative">
              <h3 className="font-sans text-sm font-bold text-slate-800">Agent Workspace Access</h3>
              <p className="font-sans text-xs text-slate-500">
                Type your referral code to load your active performance metrics and order pipeline.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 text-left relative">
              <div className="space-y-1.5">
                <label className="block font-sans text-xs font-bold text-slate-700">Referral Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. agent01"
                  value={selectedAgentCode}
                  onChange={(e) => setSelectedAgentCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {submitError && (
                <div className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 font-sans text-xs font-bold text-white py-2.5 shadow transition-colors"
              >
                Access Dashboard
              </button>
            </form>
          </div>

          {/* Setup Demo Shortcut login list */}
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-4">
            <h4 className="font-sans text-xs font-bold text-slate-700">🔒 Agent Portfolios (Tapping Asks Passcode):</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleQuickLogin(agent)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/60 bg-white text-left hover:border-indigo-400 hover:shadow-2xs transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <span className="block font-sans text-xs font-bold text-slate-800 leading-none">{agent.name}</span>
                      <span className="block font-sans text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <span>Ref Code:</span>
                        <span className="text-slate-350 tracking-widest font-bold">••••••</span>
                        <span className="text-[9px] text-indigo-500 font-semibold">(Requires Passcode)</span>
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
            <p className="font-sans text-[10px] text-slate-400 text-center">New agent accounts can be created within the console admin.</p>
          </div>

          {/* Secure Agent Passcode Prompt Modal */}
          {pendingAgent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-fadeIn">
              <div className="w-full max-w-sm rounded-[2rem] bg-white border border-slate-200 p-6 space-y-5 shadow-2xl animate-scaleUp text-left">
                
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <span className="text-lg">🔑</span>
                  </div>
                  <h3 className="font-sans text-sm font-bold text-slate-900">Verify Agent Privacy</h3>
                  <p className="font-sans text-[11px] text-slate-500">
                    Please enter the passcode for <strong>{pendingAgent.name}</strong> to unlock this workspace.
                  </p>
                </div>

                <form onSubmit={handleVerifyPasscode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block font-sans text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Agent Passcode
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      placeholder="Enter Passcode"
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value)}
                      className="w-full text-center tracking-wide rounded-xl border border-slate-250 px-3 py-2.5 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {passcodeError && (
                    <div className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 text-center font-bold">
                      ⚠️ {passcodeError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPendingAgent(null)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-sans text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-sans text-xs font-bold text-white py-2 shadow-md transition"
                    >
                      Unlock Workspace
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}
        </div>
      ) : (
        /* Authenticated Workspace */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Workspace Title & Stats banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-bl-full pointer-events-none" />

            <div className="space-y-1.5 relative">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Agent Portfolio Workspace</span>
              <div className="flex items-center gap-3">
                <h3 className="font-sans text-lg font-bold text-slate-900">{loggedInAgent.name}</h3>
                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-sans font-bold">
                  {loggedInAgent.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button 
                  onClick={() => copyReferralLink(loggedInAgent.referralCode)} 
                  className="inline-flex items-center gap-1.5 font-sans text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedCode ? 'Referred link copied!' : 'Copy Referral Link'}
                </button>
                <span className="text-slate-300">|</span>
                <span className="font-sans text-xs text-slate-500">WhatsApp: <strong className="text-slate-700">{loggedInAgent.whatsApp}</strong></span>
              </div>
            </div>
 
            <button
              onClick={() => {
                setLoggedInAgent(null);
                setSubmitError('');
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-center font-sans text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-700 transition relative"
            >
              Change Profile
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-sans text-xs text-slate-400">Total Registered Orders</span>
                <span className="block font-sans text-xl font-bold text-slate-800 mt-0.5">{agentOrders.length}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-sans text-xs text-slate-400">Earned Commissions</span>
                {/* Dynamically calculate commission from orders if we want, or display stored. Since stored gets updated on order add, let's use the stored profile, or calculate live if they differ */}
                <span className="block font-sans text-xl font-bold text-slate-800 mt-0.5">
                  ${loggedInAgent.commission.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-sans text-xs text-slate-400">Conversion Power URL</span>
                <span className="block font-mono text-[10px] text-indigo-600 font-bold border border-slate-100 bg-slate-50 px-1.5 py-0.5 rounded truncate mt-1">
                  ?ref={loggedInAgent.referralCode}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Submit Payout Order Form */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.2rem] p-6 shadow-sm space-y-4">
              <div>
                <h4 className="font-sans text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 text-indigo-600">
                  <Plus className="h-4 w-4" />
                  Submit Buyer Order
                </h4>
                <p className="font-sans text-[11px] text-slate-500 mt-1">
                  Submit orders placed on Amazon by your referred buyers to start their cashback validation flow.
                </p>
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block font-sans text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Step 1: Select the product you want to submit order <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-lg border border-slate-250 bg-white px-3 py-2 font-sans text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="">-- Choose Active Product --</option>
                    {products.filter(p => p.status === 'Active').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.cashbackAmount.toFixed(2)} Cashback)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-sans text-[11px] font-bold text-slate-700">Amazon Order ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 114-8736541-2910394"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full rounded-lg border border-slate-250 px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>



                {/* Beautiful Payment Method Selector Grid (just like screenshot) */}
                <div className="space-y-2">
                  <label className="block font-sans text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Buyer's Preferred Cashback Method <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Zelle Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Zelle')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 text-center cursor-pointer ${
                        paymentMethod === 'Zelle'
                          ? 'bg-indigo-50/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="text-2xl mb-1 filter drop-shadow-sm">🏛️</div>
                      <span className="text-xs font-bold text-slate-800 font-sans">Zelle</span>
                      {paymentMethod === 'Zelle' && (
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>

                    {/* Cash App Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CashApp')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 text-center cursor-pointer ${
                        paymentMethod === 'CashApp'
                          ? 'bg-indigo-50/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="text-2xl mb-1 filter drop-shadow-sm">💵</div>
                      <span className="text-xs font-bold text-slate-800 font-sans">Cash App</span>
                      {paymentMethod === 'CashApp' && (
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>

                    {/* Venmo Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Venmo')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 text-center cursor-pointer ${
                        paymentMethod === 'Venmo'
                          ? 'bg-indigo-50/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="text-2xl mb-1 filter drop-shadow-sm">📲</div>
                      <span className="text-xs font-bold text-slate-800 font-sans">Venmo</span>
                      {paymentMethod === 'Venmo' && (
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>

                    {/* PayPal Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PayPal')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 text-center cursor-pointer ${
                        paymentMethod === 'PayPal'
                          ? 'bg-indigo-50/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="text-2xl mb-1 filter drop-shadow-sm">🅿️</div>
                      <span className="text-xs font-bold text-slate-800 font-sans">PayPal</span>
                      {paymentMethod === 'PayPal' && (
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Dynamic Payout Details Input */}
                <div className="space-y-1">
                  <label className="block font-sans text-[11px] font-bold text-slate-700">
                    Buyer's {paymentMethod === 'CashApp' ? 'Cash App' : paymentMethod} Details <span className="text-red-500">*</span>
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
                    className="w-full rounded-lg border border-slate-250 px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-sans text-[11px] font-bold text-slate-700">Screenshot Proof <span className="text-red-500">*</span></label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-xl p-4 text-center cursor-pointer transition-colors space-y-1"
                  >
                    <Upload className="h-4 w-4 text-indigo-500 mx-auto" />
                    <span className="block font-sans text-[10px] text-slate-700 font-bold truncate leading-none">
                      {screenshotName ? screenshotName : 'Upload Order Confirmation Screen'}
                    </span>
                    <span className="block font-sans text-[9px] text-slate-400">PNG or JPG, Max 2MB</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  {screenshotBase64 && (
                    <div className="relative mt-2 border border-slate-200 rounded-xl overflow-hidden h-24">
                      <img src={screenshotBase64} alt="Order proof draft" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block font-sans text-[11px] font-bold text-slate-700">Developer / Process Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any notes about the transaction..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-250 px-3 py-2 font-sans text-[11px] text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {submitError && (
                  <div className="text-[10px] text-red-600 bg-red-50 p-2 border border-red-200 rounded-lg flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2.5 border border-emerald-200 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="font-semibold">Cashback Order uploaded successfully!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 font-sans text-xs font-bold text-white py-2.5 shadow transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading To Sheets...
                    </>
                  ) : (
                    'Submit Cashback Order'
                  )}
                </button>
              </form>
            </div>

            {/* Ledger order table pipeline */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-sans text-xs font-bold text-slate-800 flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-500" />
                    Your Referral Ledger Pipeline
                  </h4>
                  <p className="font-sans text-[11px] text-slate-500">Track states of cashback orders under your code</p>
                </div>
              </div>

              {agentOrders.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 bg-white rounded-2xl shadow-xs">
                  <table className="w-full table-auto text-left font-sans text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Order ID / Date</th>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3">Screenshot Link</th>
                        <th className="px-4 py-3 text-center">Rebate Status</th>
                        <th className="px-4 py-3">Seller / Proof Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {agentOrders.map((itm) => (
                        <tr key={itm.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="block font-mono font-bold text-[11px] text-slate-800">{itm.id}</span>
                            <span className="block font-sans text-[10px] text-slate-400 mt-0.5">{new Date(itm.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="px-4 py-3 min-w-[150px]">
                            <span className="block font-sans leading-relaxed text-slate-800 max-w-[200px] truncate" title={itm.productName}>
                              {itm.productName}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-center font-bold">
                            {itm.screenshotLink ? (
                              <a
                                href={itm.screenshotLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                              >
                                View File
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusStyle(itm.orderStatus)}`}>
                              {itm.orderStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 animate-fadeIn">
                            <div className="space-y-0.5 leading-tight max-w-[150px]">
                              {itm.sellerNotes ? (
                                <p className="font-sans text-[10px] text-orange-600 italic">" {itm.sellerNotes} "</p>
                              ) : (
                                <p className="font-sans text-[10px] text-slate-400">- No notes -</p>
                              )}
                              {itm.cashbackProof && (
                                <span className="block font-sans text-[9px] text-emerald-600 font-bold break-all">Proof Ref: {itm.cashbackProof}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                  <History className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="font-sans text-xs font-bold text-slate-700 mt-2">No orders submitted yet</p>
                  <p className="font-sans text-[11px] text-slate-400 mt-0.5">Use the left form to submit your first referred order!</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
