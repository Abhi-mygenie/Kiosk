import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

const LogoutConfirmModal = ({ onClose, onConfirm }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-sm p-6 max-w-md w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
        <LogOut size={40} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-heading font-bold mb-2 uppercase text-blue-dark">Logout</h2>
        <p className="text-muted-foreground mb-6">Are you sure you want to logout?</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-sm border border-border hover:bg-muted font-semibold">Cancel</button>
          <button onClick={onConfirm} data-testid="confirm-logout" className="flex-1 py-3 rounded-sm bg-red-500 text-white hover:bg-red-600 font-semibold">Yes, Logout</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LogoutConfirmModal;
