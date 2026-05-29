import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import touchSound from '@/utils/touchSound';

const TableSelector = ({ tables, tableNumber, setTableNumber, setSelectedTableId, onClose }) => {
  const sections = {};
  tables.forEach(table => {
    const section = table.title || '';
    if (!sections[section]) sections[section] = [];
    sections[section].push(table);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/70 backdrop-blur-xl z-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white/50 rounded-xl border border-white/30 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-white/30 flex items-center justify-center bg-white/30 flex-shrink-0 relative">
          <div className="text-center">
            <h2 className="text-xl font-heading font-bold uppercase text-blue-dark">Select Your Table</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">Tap on your table number to continue</p>
          </div>
          {tableNumber && (
            <button onClick={() => { touchSound.playClick(); onClose(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50 rounded-sm">
              <X size={24} />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {Object.keys(sections).sort((a, b) => a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)).map(section => (
            <div key={section || 'no-section'} className="mb-4">
              {section && <h3 className="text-sm font-semibold mb-2 text-blue-dark uppercase text-center">{section}</h3>}
              <div className="grid grid-cols-10 gap-2">
                {sections[section].map((table) => (
                  <motion.button
                    key={table.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { touchSound.playSelect(); setTableNumber(table.table_no); setSelectedTableId(table.id); }}
                    data-testid={`table-${table.table_no}`}
                    className={`aspect-square rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center ${
                      tableNumber === table.table_no
                        ? 'bg-blue-hero text-white shadow-lg ring-4 ring-blue-hero/30'
                        : 'bg-white/80 hover:bg-white border border-white/50 text-blue-dark'
                    }`}
                  >
                    {table.table_no}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-white/30 bg-white/30 flex-shrink-0 flex justify-center">
          <button
            onClick={() => { 
              if (tableNumber) {
                touchSound.playClick(); 
                onClose(); 
              }
            }}
            disabled={!tableNumber}
            className={`w-full max-w-md py-4 rounded-sm font-semibold text-lg transition-all ${
              tableNumber 
                ? 'bg-blue-hero text-white hover:bg-blue-medium' 
                : 'bg-white/50 text-muted-foreground cursor-not-allowed'
            }`}
          >
            {tableNumber ? `Continue with Table ${tableNumber}` : 'Select a Table'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TableSelector;
