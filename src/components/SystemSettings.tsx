/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Database, 
  HelpCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  ListOrdered, 
  Sparkles, 
  SquarePlay,
  Github,
  CloudLightning
} from 'lucide-react';
import { HubConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE, GOOGLE_APPS_SCRIPT_SETUP_STEPS } from '../GoogleAppsScript';

interface SystemSettingsProps {
  config: HubConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: HubConfig) => void;
}

export default function SystemSettings({ config, isOpen, onClose, onSave }: SystemSettingsProps) {
  const [currentMode, setCurrentMode] = useState<'simulated' | 'live'>(config.mode);
  const [backendUrl, setBackendUrl] = useState(config.backendUrl);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMode === 'live') {
      const url = backendUrl.trim();
      if (!url) {
        setValidationError('Please enter a Web App URL.');
        return;
      }
      if (url.includes('docs.google.com/spreadsheets')) {
        setValidationError('⚠️ You entered your Google Sheets Spreadsheet URL instead of the Google Apps Script Web App URL! You must open Extensions -> Apps Script inside your sheet, click "Deploy" -> "New deployment" as a "Web App", authorize it, set "Who has access" to "Anyone", and copy the NEW generated Web App URL (which ends with "/exec"). Paste that URL here!');
        return;
      }
      if (!url.endsWith('/exec') && !url.includes('/exec?')) {
        setValidationError('⚠️ The Web App URL must end with "/exec". Please check your deployment URL and make sure it is not the Spreadsheet URL or a "/dev" URL.');
        return;
      }
    }
    setValidationError('');
    onSave({
      mode: currentMode,
      backendUrl: currentMode === 'live' ? backendUrl.trim() : '',
    });
    onClose();
  };

  return (
    <div id="settings-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div id="settings-modal" className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-sans text-lg font-bold text-slate-800">System Integration & Setup</h2>
              <p className="font-sans text-xs text-slate-500">Enable Google Sheets and real-time Apps Script syncing</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          {/* Mode Form Selection */}
          <form onSubmit={handleSubmit} id="config-form" className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-5">
            <div>
              <h3 className="font-sans text-sm font-semibold text-slate-800 mb-1">Database Sync Mode</h3>
              <p className="font-sans text-xs text-slate-500">
                You can run this app entirely inside your browser sandbox, or connect it to your live Spreadsheet!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label 
                id="mode-simulated"
                className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  currentMode === 'simulated' 
                    ? 'bg-white border-teal-500 ring-2 ring-teal-500/10 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg border ${currentMode === 'simulated' ? 'bg-teal-50 border-teal-200 text-teal-600': 'bg-white border-slate-200 text-slate-400'}`}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-sans text-xs font-bold text-slate-800">Local Sandbox Simulator</span>
                    <span className="block font-sans text-[11px] text-slate-500 mt-1">
                      Runs locally with robust mock products, agents, order processing, and auto-stats in localStorage.
                    </span>
                  </div>
                </div>
                <input 
                  type="radio" 
                  name="sync-mode" 
                  value="simulated" 
                  checked={currentMode === 'simulated'} 
                  onChange={() => setCurrentMode('simulated')} 
                  className="sr-only" 
                />
              </label>

              <label 
                id="mode-live"
                className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  currentMode === 'live' 
                    ? 'bg-white border-teal-500 ring-2 ring-teal-500/10 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg border ${currentMode === 'live' ? 'bg-teal-50 border-teal-200 text-teal-600': 'bg-white border-slate-200 text-slate-400'}`}>
                    <CloudLightning className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-sans text-xs font-bold text-slate-800">Live Google Sheets API (Production)</span>
                    <span className="block font-sans text-[11px] text-slate-500 mt-1">
                      Directly syncs to columns inside your private spreadsheet database, creating and modifying rows.
                    </span>
                  </div>
                </div>
                <input 
                  type="radio" 
                  name="sync-mode" 
                  value="live" 
                  checked={currentMode === 'live'} 
                  onChange={() => setCurrentMode('live')} 
                  className="sr-only" 
                />
              </label>
            </div>

            {/* Live Mode Inputs */}
            {currentMode === 'live' && (
              <div id="live-url-field" className="space-y-2 animate-fadeIn">
                <label className="block font-sans text-xs font-bold text-slate-700">
                  Google Apps Script Web App Endpoint URL <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="url"
                    required
                    placeholder="https://script.google.com/macros/s/AKfycb..._your_deploy_id.../exec"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <p className="font-sans text-[10px] text-slate-400">
                  The Web App URL should end with <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-600">/exec</code>. Fill it in using the deployment workflow described below.
                </p>
              </div>
            )}

            {/* Validation Error Alert */}
            {validationError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-xl font-medium leading-relaxed font-sans">
                {validationError}
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 font-sans text-xs font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-600 hover:bg-teal-700 px-5 py-2 font-sans text-xs font-semibold text-white shadow-sm hover:shadow transition-all"
              >
                Apply Integration Settings
              </button>
            </div>
          </form>

          {/* Deployment Instructions Header */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4.5 w-4.5 text-teal-600" />
                <h3 className="font-sans text-sm font-bold text-slate-800">Google Sheets & GAS Setup Manual</h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied script!' : 'Copy Script Code'}
              </button>
            </div>

            {/* Quick warning text */}
            <div className="bg-teal-50 border border-teal-200/80 rounded-xl p-4 text-xs text-teal-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-start gap-3">
                <SquarePlay className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Self-Host Spreadsheet Engine:</strong>
                  Using Google Sheet and Drive as backends is completely free, secure, and has virtually infinite capacity! The Apps Script acts as an automated API service for database rows, screenshot file storage, and data querying.
                </div>
              </div>
              <a 
                href="https://docs.google.com/spreadsheets/d/1gWmKluPLT4-w_I_6mvzYeTt_70cCUdg61LaH-AVI4HY/edit?gid=1144607957#gid=1144607957"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition duration-200 shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                📊 Open Live Spreadsheet
              </a>
            </div>

            {/* Step-by-Step list */}
            <ol className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
              {GOOGLE_APPS_SCRIPT_SETUP_STEPS.map((step, index) => (
                <li key={index} className="py-3 flex gap-4">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-teal-600">$1</code>') }} />
                </li>
              ))}
            </ol>
          </div>

          {/* Vercel and Deployment Guides section */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-sans text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <CloudLightning className="h-4.5 w-4.5 text-indigo-500" />
              Frontend and Platform Deployment Guides
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-2">
                <h4 className="font-sans text-xs font-bold text-slate-800">🚀 General Project Structure</h4>
                <p className="font-sans text-[11px] text-slate-500">
                  This multi-role system is designed and built inside a single client bundle. The project folder is simple for any amateur dev:
                </p>
                <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-2.5 rounded-lg space-y-1 leading-relaxed">
                  <div>happiness-hub/</div>
                  <div>├── src/</div>
                  <div>│   ├── types.ts (Models)</div>
                  <div>│   ├── data.ts (Data layer + API Clients)</div>
                  <div>│   ├── GoogleAppsScript.ts (GAS backup code)</div>
                  <div>│   ├── components/ (Dashboard workspace components)</div>
                  <div>│   └── App.tsx (System Layout manager)</div>
                  <div>└── package.json (Config)</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                <h4 className="font-sans text-xs font-bold text-slate-800 flex items-center gap-1">
                  🌐 Vercel Frontend Deployment
                </h4>
                <ol className="list-decimal list-inside font-sans text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
                  <li>Push your build to a **GitHub repository**.</li>
                  <li>Go to **Vercel** (vercel.com) and sign in.</li>
                  <li>Click **Add New Project**, pick the Happiness Hub repository.</li>
                  <li>Keep default settings (Framework: **Vite** or Other, Build Command: <code className="bg-slate-100 px-1 text-[10px] rounded">npm run build</code>, Output Directory: <code className="bg-slate-100 px-1 text-[10px] rounded">dist</code>).</li>
                  <li>Click **Deploy**. In under a minute, you will have your public URL!</li>
                </ol>
                <div className="bg-indigo-50 border border-indigo-200/60 rounded-lg p-2.5 text-[10px] text-indigo-800 flex items-start gap-2">
                  <Github className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
                  <div>
                    <strong>Hosting complete:</strong> Easily configure your custom domain on Vercel under settings.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Script Viewer */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-sans text-sm font-bold text-slate-800 mb-3">Google Apps Script Snippet Preview</h3>
            <div className="relative">
              <pre className="overflow-x-auto bg-slate-900 text-slate-300 font-mono text-[10px] p-4 rounded-xl max-h-52 leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={handleCopy}
                  className="rounded-md bg-slate-800 hover:bg-slate-700 text-white p-1 text-xs"
                  title="Copy Full Script Code"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50 rounded-b-2xl">
          <span className="font-mono text-[10px] text-slate-400">Created At: 2026-06-08</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-900 px-5 py-2 font-sans text-xs font-semibold text-white shadow"
          >
            Finished Setup
          </button>
        </div>

      </div>
    </div>
  );
}
