/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ShoppingBag, 
  ArrowRight, 
  ClipboardCheck, 
  CheckSquare, 
  Truck, 
  Coins, 
  HelpCircle,
  FileSearch,
  MessageCircleOff
} from 'lucide-react';
import { Order, Product } from '../types';

interface OrderTrackingPageProps {
  orders: Order[];
  products: Product[];
  initialSearchId?: string;
}

export default function OrderTrackingPage({ orders, products, initialSearchId = '' }: OrderTrackingPageProps) {
  const [searchId, setSearchId] = useState<string>(initialSearchId);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(
    initialSearchId ? (orders.find(o => (o.id || '').trim() === initialSearchId.trim()) || null) : null
  );
  const [hasSearched, setHasSearched] = useState<boolean>(!!initialSearchId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (searchId.trim()) {
      const match = orders.find(
        o => (o.id || '').trim().toLowerCase() === searchId.trim().toLowerCase()
      );
      setSearchedOrder(match || null);
    } else {
      setSearchedOrder(null);
    }
  };

  // Find linked product details
  const linkedProduct = searchedOrder 
    ? products.find(p => p.id === searchedOrder.productId) 
    : null;

  // Determine stage progress level
  const getStageInfo = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Pending':
        return { step: 1, label: 'Submitted', desc: 'Order details registered by agent' };
      case 'Ordered':
        return { step: 2, label: 'Confirmed', desc: 'Amazon order receipt verified by seller' };
      case 'Delivered':
        return { step: 3, label: 'Delivered', desc: 'Item arrival confirmed by buyer' };
      case 'Cashback Sent':
        return { step: 4, label: 'Paid Out', desc: 'Cashback rebate disbursed successfully!' };
      case 'Refunded':
        return { step: 4, label: 'Refunded', desc: 'Rebate order refunded successfully!' };
      case 'Rejected':
        return { step: -1, label: 'Rejected', desc: 'Rebate request declined' };
      case 'PayPal Issue':
        return { step: 2, label: 'Payout Blocked', desc: 'Rebate failed due to PayPal issues' };
      case 'Need More Info':
        return { step: 1, label: 'Info Requested', desc: 'Seller requested more documentation' };
      default:
        return { step: 1, label: 'Received', desc: 'Transaction submitted' };
    }
  };

  const stage = searchedOrder ? getStageInfo(searchedOrder.orderStatus) : { step: 0 };

  const timelineSteps = [
    { num: 1, name: 'Order Submitted', desc: 'Details registered on index' },
    { num: 2, name: 'Receipt Verified', desc: 'Amazon Order receipt confirmed' },
    { num: 3, name: 'Delivery Confirmed', desc: 'Final delivery confirmed' },
    { num: 4, name: 'Cashback Disbursed', desc: 'Funds credited to recipient' },
  ];

  return (
    <div id="tracking-portal" className="max-w-2xl mx-auto space-y-8 pb-16 font-sans text-xs">
      
      {/* Search Bar header card */}
      <div className="bg-white border border-slate-200 rounded-[2.2rem] p-6 sm:p-8 shadow-sm space-y-5 relative overflow-hidden">
        {/* Decorative corner curve */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full pointer-events-none" />

        <div className="text-center space-y-1.5 mb-2 relative">
          <FileSearch className="h-8 w-8 text-indigo-600 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Rebate Tracking Station</h3>
          <p className="text-slate-500">Enter your Amazon Order ID below to look up status updates in real-time.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. 114-8736541-2910394"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pl-10 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 shadow-md shadow-indigo-600/10 transition-all"
          >
            Locate Rebate
          </button>
        </form>
      </div>

      {/* SEARCH OUTPUT CHANNELS */}
      {hasSearched && (
        <div className="space-y-6">
          {searchedOrder ? (
            <div className="bg-white border border-slate-200 rounded-[2.2rem] shadow-sm overflow-hidden divide-y divide-slate-100 animate-scaleUp">
              
              {/* Card Title status summary */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="space-y-1 leading-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order Reference</span>
                  <h4 className="font-mono text-xs font-bold text-slate-900">{searchedOrder.id}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">Status:</span>
                  <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    searchedOrder.orderStatus === 'Cashback Sent' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : searchedOrder.orderStatus === 'Refunded'
                        ? 'bg-teal-100 text-teal-800 border-teal-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                  }`}>
                    {searchedOrder.orderStatus}
                  </span>
                </div>
              </div>

              {/* Product and Buyer Specs info */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Deal Product Info</span>
                  <div className="flex gap-3">
                    {linkedProduct && (
                      <div className="h-10 w-10 bg-slate-50 rounded border flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={linkedProduct.imageUrl} alt={searchedOrder.productName} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-slate-800 leading-snug">{searchedOrder.productName}</h5>
                      {linkedProduct && (
                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">Cashback Amount: ${linkedProduct.cashbackAmount.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Customer / Agent</span>
                  <div className="space-y-1">
                    <p className="text-slate-700">Buyer: <strong>{searchedOrder.buyerName}</strong></p>
                    <p className="text-slate-500">Contact Agent: <strong>{searchedOrder.agentName}</strong> (?ref={searchedOrder.agentReferralCode})</p>
                    <p className="text-[10px] text-slate-400">Logged on: {new Date(searchedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Seller Issue alerts */}
              {(searchedOrder.orderStatus === 'PayPal Issue' || searchedOrder.orderStatus === 'Need More Info' || searchedOrder.orderStatus === 'Rejected') && (
                <div className="p-4 bg-orange-50 text-orange-850 flex gap-3 border-l-4 border-orange-500">
                  <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-normal">
                    <strong className="font-bold block">Status Note from Seller Portfolio:</strong>
                    <p className="italic text-[11px]">" {searchedOrder.sellerNotes ? searchedOrder.sellerNotes : "The seller requires more information to verify this purchase."} "</p>
                    <p className="text-[10px] text-amber-700/80 mt-1">Please reach out to your registering agent on WhatsApp to help edit the form on Sheets.</p>
                  </div>
                </div>
              )}

              {/* Cashback Send Proof Receipt */}
              {searchedOrder.orderStatus === 'Cashback Sent' && (
                <div className="p-4 bg-emerald-50 text-emerald-950 flex gap-3 border-l-4 border-emerald-500 leading-normal">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-emerald-800">Cashback Executed successfully!</strong>
                    {searchedOrder.cashbackProof ? (
                      <p className="font-mono text-[11px] mt-0.5 bg-white/60 px-1 py-0.5 rounded border inline-block text-emerald-700 font-bold">
                        Payout Reference ID: {searchedOrder.cashbackProof}
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-600">The payout has been marked as settled by the dealer.</p>
                    )}
                    <p className="text-[10px] text-emerald-600/80 mt-1">Check your PayPal account or reach out to your agent if you have questions.</p>
                  </div>
                </div>
              )}

              {/* Refunded Proof Receipt */}
              {searchedOrder.orderStatus === 'Refunded' && (
                <div className="p-4 bg-teal-50 text-teal-950 flex gap-3 border-l-4 border-teal-500 leading-normal">
                  <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <div className="w-full text-left">
                    <strong className="font-bold block text-teal-800">Order Refunded successfully!</strong>
                    <p className="text-[11px] text-slate-700 mt-0.5">
                      The admin has processed and registered a refund for this order.
                    </p>
                    {searchedOrder.cashbackProof && (
                      <div className="mt-3 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Refund Proof Attachment</span>
                        {searchedOrder.cashbackProof.startsWith('data:') ? (
                          <div className="max-w-xs border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <img src={searchedOrder.cashbackProof} alt="Refund screenshot proof" className="w-full object-contain max-h-48" />
                          </div>
                        ) : (
                          <a 
                            href={searchedOrder.cashbackProof} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-bold text-teal-600 hover:underline"
                          >
                            <span>🔗 View Refund Document Receipt</span>
                          </a>
                        )}
                      </div>
                    )}
                    {searchedOrder.sellerNotes && (
                      <p className="text-[11px] text-slate-600 italic bg-white/50 p-2.5 rounded-lg border border-teal-100/50 mt-2">
                        " {searchedOrder.sellerNotes} "
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Visual horizontal stage progress tracker */}
              {stage.step > 0 && (
                <div className="p-6 space-y-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Rebate Progress Roadmap</span>
                  
                  <div className="grid grid-cols-4 relative items-start gap-2">
                    {/* Progress tracking connector bar background */}
                    <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-slate-100 -z-10" />
                    {/* Active highlighted connector bar */}
                    <div 
                      className="absolute top-4 left-[12.5%] h-0.5 bg-indigo-500 -z-10 transition-all duration-500" 
                      style={{ width: `${Math.max(0, Math.min(3, stage.step - 1)) * 25}%` }}
                    />

                    {timelineSteps.map((step) => {
                      const isCompleted = stage.step >= step.num;
                      const isCurrent = stage.step === step.num;
                      
                      return (
                        <div key={step.num} className="flex flex-col items-center text-center space-y-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 font-semibold font-mono text-xs ${
                            isCompleted 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                              : isCurrent 
                              ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50' 
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {isCompleted && step.num < stage.step ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              step.num
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span className={`block font-sans font-bold text-[9px] ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                              {step.name}
                            </span>
                            <span className="hidden sm:block text-[8px] text-slate-400 tracking-tight leading-tight">
                              {step.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-[2.2rem] shadow-xs space-y-2 animate-scaleUp">
              <MessageCircleOff className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="font-sans text-sm font-bold text-slate-700">Order ID Not Found</p>
              <div className="text-slate-500 max-w-sm mx-auto space-y-1 text-[11px] leading-relaxed px-4">
                <p>We could not locate any rebate processing for order <code className="font-mono text-indigo-600 bg-slate-50 px-1 rounded">{searchId}</code>.</p>
                <p className="pt-2 font-normal">If this was just purchased, contact your **affiliate agent**. They must submit the transaction within their agent desk to begin verification!</p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
