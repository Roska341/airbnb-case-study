'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/context/ToastContext';
import { CheckCircle, XCircle, Info, X, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-md">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-card bg-white shadow-modal border",
              toast.type === 'success' && 'border-babu',
              toast.type === 'error' && 'border-rausch',
              toast.type === 'info' && 'border-kazan'
            )}
          >
            {toast.type === 'success' && <CheckCircle size={18} className="text-babu shrink-0" />}
            {toast.type === 'error' && <XCircle size={18} className="text-rausch shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="text-kazan shrink-0" />}
            <span className="text-sm font-medium text-kazan flex-1">{toast.message}</span>
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  removeToast(toast.id);
                }}
                className="flex items-center gap-1 text-sm font-bold text-rausch hover:underline shrink-0"
              >
                <Undo2 size={14} /> Undo
              </button>
            )}
            <button onClick={() => removeToast(toast.id)} className="text-foggy hover:text-kazan shrink-0">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
