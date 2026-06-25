/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Store, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  DollarSign,
  Briefcase,
  HelpCircle,
  TrendingUp,
  X,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { Seller, Product, Order } from '../types';

interface SellerPageProps {
  sellers: Seller[];
  products: Product[];
  orders: Order[];
  onUpdateOrderStatus: (
    orderId: string, 
    status: Order['orderStatus'], 
    notes: string, 
    proof: string
  ) => Promise<any>;
}

export default function SellerPage({ sellers, products, orders, onUpdateOrderStatus }: SellerPageProps) {
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [loggedInSeller, setLoggedInSeller] = useState<Seller | null>(null);

  // Active status editing state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Order['orderStatus']>('Pending');
  const [sellerNotes, setSellerNotes] = useState<string>('');
  const [cashbackProof, setCashbackProof] = useState<string>('');

  // UI state actions
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>('');
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  // Quick select login for showcase convenience
  const handleQuickLogin = (sel: Seller) => {
    if (sel.status === 'Inactive') {
      alert('This seller profile is set to Inactive. Contact Administrator.');
      return;
    }
    setLoggedInSeller(sel);
    setUpdateError('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = sellers.find(s => s.id === selectedSellerId);
    if (found) {
      if (found.status === 'Inactive') {
        setUpdateError('Seller is Inactive.');
        return;
      }
      setLoggedInSeller(found);
      setUpdateError('');
    } else {
      setUpdateError('Please select a valid seller.');
    }
  };

  // Get products owned by this seller
  const sellerProductIds = useMemo(() => {
    if (!loggedInSeller) return new Set<string>();
    const ids = products
      .filter(p => p.sellerName.toLowerCase() === loggedInSeller.name.toLowerCase())
      .map(p => p.id);
    return new Set<string>(ids);
  }, [products, loggedInSeller]);

  // Filter orders related to this seller's products only
  const filteredOrders = useMemo(() => {
    if (!loggedInSeller) return [];
    return orders.filter(
      o => sellerProductIds.has(o.productId)
    );
  }, [orders, sellerProductIds, loggedInSeller]);

  // Calculate live statistics
  const metrics = useMemo(() => {
    const list = filteredOrders;
    const completed = list.filter(o => o.orderStatus === 'Cashback Sent');
    const pending = list.filter(o => o.orderStatus === 'Pending');
    const issues = list.filter(o => o.orderStatus === 'PayPal Issue' || o.orderStatus === 'Need More Info' || o.orderStatus === 'Rejected');
    
    // Calculate total layout fund disbursed
    const cashDisbursed = completed.reduce((sum, ord) => {
      // Find product cashback amount
      const targetProd = products.find(p => p.id === ord.productId);
      return sum + (targetProd ? targetProd.cashbackAmount : 0);
    }, 0);

    return {
      total: list.length,
      completed: completed.length,
      pending: pending.length,
      issues: issues.length,
      cashDisbursed
    };
  }, [filteredOrders, products]);

  // Open operational update slide-over drawer
  const openEditDrawer = (order: Order) => {
    setEditingOrder(order);
    setNewStatus(order.orderStatus);
    setSellerNotes(order.sellerNotes);
    setCashbackProof(order.cashbackProof);
    setUpdateError('');
    setUpdateSuccess(false);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);

    try {
      await onUpdateOrderStatus(
        editingOrder.id,
        newStatus,
        sellerNotes.trim(),
        cashbackProof.trim()
      );

      setUpdateSuccess(true);
      setTimeout(() => {
        setEditingOrder(null);
        setUpdateSuccess(false);
      }, 1000);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update order in sheets.');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions: Order['orderStatus'][] = [
    'Pending',
    'Ordered',
    'Delivered',
    'Cashback Sent',
    'Refunded',
    'Rejected',
    'PayPal Issue',
    'Need More Info'
  ];

  const getStatusStyle = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ordered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Cashback Sent': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Refunded': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PayPal Issue': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Need More Info': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div id="seller-workspace" className="space-y-8 pb-16 font-sans">
      
      {/* Seller Wall Gateway */}
      {!loggedInSeller ? (
        <div className="max-w-md mx-auto space-y-6 pt-10 font-sans">
          <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2.2rem] p-6 sm:p-8 shadow-md text-center space-y-5">
            {/* Decorative curve */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full pointer-events-none" />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 relative">
              <Store className="h-6 w-6" />
            </div>

            <div className="relative">
              <h3 className="font-sans text-sm font-bold text-slate-800">Seller Office Portal</h3>
              <p className="font-sans text-xs text-slate-500">
                Pick your seller brand profile to view buyer orders and submit payouts.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 text-left relative">
              <div className="space-y-1.5 font-sans text-xs">
                <label className="block font-bold text-slate-700">Select Seller Brand</label>
                <select
                  required
                  value={selectedSellerId}
                  onChange={(e) => setSelectedSellerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Brand --</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              {updateError && (
                <div className="text-[11px] text-red-650 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-1.5 font-sans">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                  <span>{updateError}</span>
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

          {/* Sandbox click selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-4 font-sans">
            <h4 className="font-sans text-xs font-bold text-slate-700">Sandbox Quick-Access Brand Sellers:</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {sellers.map((sel) => (
                <button
                  key={sel.id}
                  onClick={() => handleQuickLogin(sel)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/60 bg-white text-left hover:border-indigo-400 hover:shadow-2xs transition-all animate-fadeIn"
                >
                  <div className="flex items-center gap-2.5 font-sans">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                      {sel.name.charAt(0)}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 leading-none">{sel.name}</span>
                      <span className="block text-[10px] text-slate-400 mt-1">Products: <strong className="text-indigo-600 font-mono">
                        {products.filter(p => p.sellerName.toLowerCase() === sel.name.toLowerCase()).length} listed
                      </strong></span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Workspace */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-bl-full pointer-events-none" />

            <div className="space-y-1.5 relative">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Brand Seller Dashboard</span>
              <div className="flex items-center gap-3">
                <h3 className="font-sans text-lg font-bold text-slate-900">{loggedInSeller.name}</h3>
                <span className="rounded-full bg-emerald-100 text-emerald-850 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-sans font-bold">
                  {loggedInSeller.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-0.5 text-xs text-slate-500 font-sans">
                <span>Email: <strong className="text-slate-700">{loggedInSeller.email}</strong></span>
                <span className="text-slate-300">|</span>
                <span>WhatsApp: <strong className="text-slate-700">{loggedInSeller.whatsApp}</strong></span>
              </div>
            </div>

            <button
              onClick={() => {
                setLoggedInSeller(null);
                setUpdateError('');
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 font-sans text-xs font-semibold text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-700 transition relative"
            >
              Sign out of store
            </button>
          </div>

          {/* Stat metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 font-bold">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-sans text-xs text-slate-400">Your Applet deals</span>
                <span className="block font-sans text-lg font-bold text-slate-800">
                  {products.filter(p => p.sellerName.toLowerCase() === loggedInSeller.name.toLowerCase()).length} Deals
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                <RefreshCw className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <span className="block font-sans text-xs text-slate-400">Awaiting Action</span>
                <span className="block font-sans text-lg font-bold text-slate-800">{metrics.pending} Pending</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-650">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-sans text-xs text-slate-400">Cashback Sent</span>
                <span className="block font-sans text-lg font-bold text-slate-800">{metrics.completed} Done</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 rounded-lg bg-slate-50 text-indigo-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-sans text-xs text-slate-400">Reimbursements Paid</span>
                <span className="block font-sans text-lg font-bold text-slate-900">${metrics.cashDisbursed.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Orders ledger list related to this seller’s products */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-250 pb-3">
              <div>
                <h4 className="font-sans text-xs font-bold text-slate-800 tracking-tight">Your Brand Orders Pipeline</h4>
                <p className="font-sans text-xs text-slate-500">Showing only orders placed for products under your portfolio.</p>
              </div>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 bg-white rounded-2xl shadow-xs">
                <table className="w-full table-auto text-left font-sans text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3.5">Order ID</th>
                      <th className="px-4 py-3.5">Product Name</th>
                      <th className="px-4 py-3.5">Buyer Name</th>
                      <th className="px-4 py-3.5">Agent Code</th>
                      <th className="px-4 py-3.5 text-center">Screenshot Proof</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5">Seller Notes & Proof</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="block font-mono font-bold text-[11px] text-slate-800">{ord.id}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-sans">{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-4 py-3.5 min-w-[140px]">
                          <span className="block font-sans text-xs leading-relaxed font-semibold text-slate-800 max-w-[170px] truncate" title={ord.productName}>
                            {ord.productName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-sans">
                          <span className="block font-bold text-slate-905 leading-none">{ord.buyerName}</span>
                          <span className="block text-[10px] text-slate-400 leading-none mt-1">{ord.buyerWhatsApp}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">
                            {ord.agentReferralCode}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {ord.screenshotLink ? (
                            <a 
                              href={ord.screenshotLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-indigo-650 hover:underline"
                            >
                              Open Photo
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-slate-405 font-sans text-[11px]">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusStyle(ord.orderStatus)}`}>
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5 leading-tight max-w-[160px]">
                            {ord.sellerNotes ? (
                              <p className="font-sans text-[10px] text-amber-600 italic">" {ord.sellerNotes} "</p>
                            ) : (
                              <p className="font-sans text-[10px] text-slate-400 italic">No notes</p>
                            )}
                            {ord.cashbackProof && (
                              <span className="block font-mono text-[9px] text-emerald-600 font-bold break-all">Ref ID: {ord.cashbackProof}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            id={`action-modify-${ord.id}`}
                            onClick={() => openEditDrawer(ord)}
                            className="rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 font-sans text-xs font-semibold hover:bg-indigo-100 transition-colors"
                          >
                            Edit Status / Proof
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
                <Store className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="font-sans text-xs font-bold text-slate-700 mt-2">No buyer orders mapped to your deals</p>
                <p className="font-sans text-[11px] text-slate-400 mt-0.5">Orders will show here once agents submit sales for your products.</p>
              </div>
            )}
          </div>

          {/* Action edit status popup overlay */}
          {editingOrder && (
            <div id="status-edit-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
              <div className="relative w-full max-w-md rounded-[2.2rem] bg-white shadow-xl border border-slate-100 p-6 sm:p-8 space-y-6 animate-scaleUp">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-sans text-sm font-bold text-slate-800">Update Order Transaction</h3>
                    <p className="font-sans text-[10px] text-slate-400 font-mono mt-0.5">Amazon ID: {editingOrder.id}</p>
                  </div>
                  <button 
                    onClick={() => setEditingOrder(null)} 
                    className="rounded-lg p-1 text-slate-405 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleStatusSubmit} className="space-y-4">
                  <div className="space-y-1 font-sans text-xs text-slate-700">
                    <label className="block font-bold">Transaction Status <span className="text-red-500">*</span></label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as Order['orderStatus'])}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 font-sans text-xs text-slate-700">
                    <label className="block font-bold">Refund Reference ID / Proof</label>
                    <input
                      type="text"
                      placeholder="e.g. PayPal Transaction ID or confirmation link"
                      value={cashbackProof}
                      onChange={(e) => setCashbackProof(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">Provide payment proof hash once status is set to 'Cashback Sent'</p>
                  </div>

                  <div className="space-y-1 font-sans text-xs text-slate-700">
                    <label className="block font-bold">Seller Notes / Issues / Details</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. 'Order marked delivered. Cashback sent via PayPal.' or 'Buyer needs to upload screenshot matching order.'"
                      value={sellerNotes}
                      onChange={(e) => setSellerNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {updateError && (
                    <div className="text-[10px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-start gap-1">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{updateError}</span>
                    </div>
                  )}

                  {updateSuccess && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-1 text-center font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Action synchronized successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingOrder(null)}
                      className="rounded-lg px-4 py-2 font-sans text-xs font-semibold text-slate-650 hover:bg-slate-100 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 px-5 py-2 font-sans text-xs font-bold text-white shadow transition-all shadow-indigo-600/10"
                    >
                      {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                      Sync Sheets Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
