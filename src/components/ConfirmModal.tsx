/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  isDanger = true,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0b0f19] border border-slate-800/80 p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isDanger ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {isDanger ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-sans text-base font-bold text-white">{title}</h3>
                <p className="font-sans text-xs text-slate-300 leading-relaxed font-normal">{message}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800 px-4 py-2 text-xs font-bold transition cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition cursor-pointer hover:scale-[1.02] active:scale-95 ${
                  isDanger 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/20' 
                    : 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-950/20'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
