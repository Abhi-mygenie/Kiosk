import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const EditInstructionsModal = ({ item, isPortrait, onClose, onUpdate }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-end portrait:items-end landscape:items-center justify-center z-50" onClick={onClose}>
      <motion.div
        initial={{ y: isPortrait ? '100%' : 0, scale: isPortrait ? 1 : 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: isPortrait ? '100%' : 0, scale: isPortrait ? 1 : 0.9 }}
        className={`bg-white p-6 ${isPortrait ? 'w-full rounded-t-2xl' : 'rounded-sm max-w-md w-full mx-4'}`}
        onClick={e => e.stopPropagation()}
      >
        {isPortrait && <div className="flex justify-center mb-2"><div className="w-12 h-1.5 bg-gray-300 rounded-full" /></div>}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-heading font-bold uppercase text-blue-dark">Cooking Instructions</h2>
            <p className="text-sm text-muted-foreground">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-sm"><X size={20} /></button>
        </div>
        <textarea
          value={item.specialInstructions || ''}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="E.g., Less spicy, No onions..."
          className="w-full bg-muted border border-border p-3 rounded-sm text-sm focus:outline-none focus:border-blue-hero resize-none h-24 mb-2"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground text-right mb-4">{(item.specialInstructions || '').length}/200</p>
        <button onClick={onClose} className="w-full bg-blue-hero text-white py-4 rounded-sm font-semibold hover:bg-blue-medium">Done</button>
      </motion.div>
    </motion.div>
  );
};

export default EditInstructionsModal;
