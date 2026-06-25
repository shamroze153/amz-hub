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
  currentTab: 'deals' | 'track' | 'orders' | 'agent' | 'admin' | 'seller';
  setCurrentTab: (tab: 'deals' | 'track' | 'orders' | 'agent' | 'admin' | 'seller') => void;
  activeRefAgent: Agent | null;
  config: HubConfig;
  onOpenSettings: () => void;
  buyerSession: BuyerUser | null;
  onSignOutBuyer: () => void;
}

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  activeRefAgent, 
  config, 
  onOpenSettings,
  buyerSession,
  onSignOutBuyer
}: HeaderProps) {
  
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="mx-auto flex max-w-7xl h-14 items-center justify-between">
        
        {/* Branding (😄 Happiness Hub Logo) */}
        <div 
          onClick={() => setCurrentTab('deals')} 
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 duration-300">
            <span className="text-lg">😄</span>
          </div>
          <div>
            <span className="font-sans text-base font-extrabold tracking-tight text-slate-900">
              Happiness <span className="text-indigo-600">Hub</span>
            </span>
            {currentTab === 'admin' && (
              <span className="ml-2 inline-flex items-center bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Central Nav Links (Matches Screenshot 1 / reference page) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-full p-1">
          {[
            { id: 'deals', name: 'Deals Hub', icon: Compass },
            { id: 'track', name: 'Track Order', icon: Search },
            { id: 'orders', name: 'My Orders', icon: FileText },
            { id: 'agent', name: 'Agent Portal', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-sans text-xs font-bold tracking-tight transition-all duration-300 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Right Action Menu */}
        <div className="flex items-center gap-2">
          
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

          {/* Screenshot-compatible Track Order call-out button */}
          <button
            onClick={() => setCurrentTab('track')}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10"
          >
            <span>📦</span>
            <span className="hidden sm:inline">Track Order</span>
          </button>

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

      {/* Mobile Nav Tabs Grid */}
      <div className="md:hidden mt-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-around px-1.5 py-1">
        {[
          { id: 'deals', name: 'Deals', icon: Compass },
          { id: 'track', name: 'Track', icon: Search },
          { id: 'orders', name: 'My Orders', icon: FileText },
          { id: 'agent', name: 'Agent', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1 px-3.5 text-center transition-all ${
                isActive ? 'text-indigo-600 font-bold bg-white shadow-sm border border-slate-200' : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-sans text-[9px]">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
