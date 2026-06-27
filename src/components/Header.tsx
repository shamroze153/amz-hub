/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingBag, 
  Search, 
  HelpCircle, 
  User, 
  Store,
  Compass,
  FileText,
  ShieldCheck, 
  RotateCw, 
  Settings, 
  Link as LinkIcon 
} from 'lucide-react';
import { Agent, HubConfig, BuyerUser } from '../types';

interface HeaderProps {
  role: 'buyer' | 'agent' | 'seller' | 'admin';
  setRole: (role: 'buyer' | 'agent' | 'seller' | 'admin') => void;
  currentTab: 'deals' | 'track' | 'orders' | 'agent' | 'admin' | 'seller';
  setCurrentTab: (tab: 'deals' | 'track' | 'orders' | 'agent' | 'admin' | 'seller') => void;
  activeRefAgent: Agent | null;
  config: HubConfig;
  onOpenSettings: () => void;
  buyerSession: BuyerUser | null;
  onSignOutBuyer: () => void;
}

export default function Header({ 
  role,
  setRole,
  currentTab, 
  setCurrentTab, 
  activeRefAgent, 
  config, 
  onOpenSettings,
  buyerSession,
  onSignOutBuyer
}: HeaderProps) {
  
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-2.5 px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="mx-auto flex max-w-7xl h-14 items-center justify-between gap-4">
        
        {/* Branding (😄 Happiness Hub Logo) */}
        <div 
          onClick={() => { setRole('buyer'); setCurrentTab('deals'); }} 
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 duration-300">
            <span className="text-lg">😄</span>
          </div>
          <div>
            <span className="font-sans text-base font-extrabold tracking-tight text-slate-900">
              Happiness <span className="text-indigo-600">Hub</span>
            </span>
          </div>
        </div>

        {/* Central Role & Portal Switching on Top (Puts everything on top as requested!) */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full p-1">
          {[
            { id: 'buyer-shop', name: '🛍️ Shop Catalog', action: () => { setRole('buyer'); setCurrentTab('deals'); }, isActive: role === 'buyer' && currentTab === 'deals' },
            { id: 'buyer-login', name: '👤 Buyer Login / My Orders', action: () => { setRole('buyer'); setCurrentTab('orders'); }, isActive: role === 'buyer' && currentTab === 'orders' },
            { id: 'orders-track', name: '📦 Order Status', action: () => { setRole('buyer'); setCurrentTab('track'); }, isActive: role === 'buyer' && currentTab === 'track' },
            { id: 'agent-login', name: '🤝 Agent Portal', action: () => { setRole('agent'); setCurrentTab('deals'); }, isActive: role === 'agent' },
            { id: 'seller-login', name: '🏪 Seller Desk', action: () => { setRole('seller'); setCurrentTab('deals'); }, isActive: role === 'seller' },
            { id: 'admin-console', name: '🛡️ Admin Console', action: () => { setRole('admin'); setCurrentTab('admin'); }, isActive: role === 'admin' }
          ].map((item) => {
            const active = item.isActive;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`rounded-full px-3.5 py-1.5 font-sans text-xs font-extrabold tracking-tight transition-all duration-250 cursor-pointer whitespace-nowrap ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 scale-[1.02]' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Medium Screen Nav (slightly smaller labels) */}
        <nav className="hidden md:flex xl:hidden items-center gap-1 bg-slate-50 border border-slate-200 rounded-full p-1">
          {[
            { id: 'buyer-shop', name: '🛍️ Shop', action: () => { setRole('buyer'); setCurrentTab('deals'); }, isActive: role === 'buyer' && currentTab === 'deals' },
            { id: 'buyer-login', name: '👤 Orders', action: () => { setRole('buyer'); setCurrentTab('orders'); }, isActive: role === 'buyer' && currentTab === 'orders' },
            { id: 'orders-track', name: '📦 Status', action: () => { setRole('buyer'); setCurrentTab('track'); }, isActive: role === 'buyer' && currentTab === 'track' },
            { id: 'agent-login', name: '🤝 Agent', action: () => { setRole('agent'); setCurrentTab('deals'); }, isActive: role === 'agent' },
            { id: 'seller-login', name: '🏪 Seller', action: () => { setRole('seller'); setCurrentTab('deals'); }, isActive: role === 'seller' },
            { id: 'admin-console', name: '🛡️ Admin', action: () => { setRole('admin'); setCurrentTab('admin'); }, isActive: role === 'admin' }
          ].map((item) => {
            const active = item.isActive;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`rounded-full px-3 py-1.5 font-sans text-xs font-extrabold tracking-tight transition-all duration-250 cursor-pointer whitespace-nowrap ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 scale-[1.02]' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Right Action Menu */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Active buyer profile indicator */}
          {buyerSession ? (
            <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-1 pr-2.5 text-[10.5px]">
              <div className="w-5.5 h-5.5 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                {buyerSession.name.charAt(0)}
              </div>
              <span className="text-slate-700 font-bold max-w-20 truncate">{buyerSession.name}</span>
              <button 
                onClick={onSignOutBuyer}
                className="text-red-600 hover:text-red-700 ml-1 hover:underline font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : null}

          {/* Active Agent Referrer notification */}
          {activeRefAgent && (
            <div className="hidden sm:flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[11px] text-indigo-700 font-medium">
              <LinkIcon className="h-3 w-3 text-indigo-500" />
              <span className="font-sans">Ref: <strong>{activeRefAgent.name}</strong></span>
            </div>
          )}

          {/* Config Settings Overlay button */}
          <button
            onClick={onOpenSettings}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
            title="Database Configuration"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Tabs Grid - Highly intuitive portal switcher */}
      <div className="md:hidden mt-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-around p-1 gap-1">
        {[
          { name: '🛍️ Shop', action: () => { setRole('buyer'); setCurrentTab('deals'); }, isActive: role === 'buyer' && currentTab === 'deals' },
          { name: '👤 Orders', action: () => { setRole('buyer'); setCurrentTab('orders'); }, isActive: role === 'buyer' && currentTab === 'orders' },
          { name: '📦 Status', action: () => { setRole('buyer'); setCurrentTab('track'); }, isActive: role === 'buyer' && currentTab === 'track' },
          { name: '🤝 Agent', action: () => { setRole('agent'); setCurrentTab('deals'); }, isActive: role === 'agent' },
          { name: '🏪 Seller', action: () => { setRole('seller'); setCurrentTab('deals'); }, isActive: role === 'seller' },
          { name: '🛡️ Admin', action: () => { setRole('admin'); setCurrentTab('admin'); }, isActive: role === 'admin' }
        ].map((item, idx) => {
          const active = item.isActive;
          return (
            <button
              key={idx}
              onClick={item.action}
              className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg py-1.5 px-1 text-center transition-all cursor-pointer ${
                active ? 'text-indigo-600 font-bold bg-white shadow-xs border border-slate-200/80' : 'text-slate-500'
              }`}
            >
              <span className="font-sans text-[10.5px] whitespace-nowrap">{item.name}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
