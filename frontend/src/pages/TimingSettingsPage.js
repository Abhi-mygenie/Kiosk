import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2, Save, ArrowLeft, RotateCcw } from 'lucide-react';
import { useTimingSettings } from '@/contexts/TimingSettingsContext';
import { toast } from 'sonner';

const TimingSettingsPage = ({ onBack }) => {
  const { shifts: savedShifts, saveShifts, clearShifts } = useTimingSettings();

  const [slots, setSlots] = useState(() => {
    if (savedShifts.length) return savedShifts.map((s, i) => ({ ...s, id: i }));
    return [];
  });

  const addSlot = () => {
    if (slots.length >= 4) {
      toast.error('Maximum 4 time slots allowed');
      return;
    }
    setSlots(prev => [...prev, { id: Date.now(), start: '07:00', end: '09:00', prepTime: 10 }]);
  };

  const removeSlot = (id) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const updateSlot = (id, field, value) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    const cleaned = slots.map(({ start, end, prepTime }) => ({
      start,
      end,
      prepTime: parseInt(prepTime) || 10,
    }));
    saveShifts(cleaned);
    toast.success('Timing settings saved');
    if (onBack) onBack();
  };

  const handleReset = () => {
    setSlots([]);
    clearShifts();
    toast.success('Timing settings cleared');
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="timing-settings-page">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              data-testid="timing-back-btn"
              className="p-2 rounded-sm hover:bg-muted transition-all text-muted-foreground"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <img
            src="https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png"
            alt="Logo"
            className="h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-heading font-bold uppercase text-blue-dark tracking-wide">
              Operating Hours
            </h1>
            <p className="text-xs text-muted-foreground">Define time slots and estimated preparation time</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              data-testid="timing-cancel-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border text-muted-foreground hover:bg-muted transition-all font-semibold text-sm"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            data-testid="timing-save-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-blue-hero text-white hover:bg-blue-medium transition-all font-semibold text-sm"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          {/* Info Card */}
          <div className="bg-white rounded-sm border-2 border-border p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-hero/10 flex items-center justify-center">
                <Clock size={20} className="text-blue-hero" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold uppercase text-blue-dark tracking-wide">
                  Restaurant Operating Hours
                </h2>
                <p className="text-sm text-muted-foreground">
                  Estimated prep time is shown to guests after placing an order
                </p>
              </div>
            </div>

            {/* Column Headers */}
            {slots.length > 0 && (
              <div className="grid grid-cols-[80px_1fr_1fr_120px_40px] gap-3 mb-3 px-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground"></span>
                <span className="text-xs font-semibold uppercase text-muted-foreground">Start</span>
                <span className="text-xs font-semibold uppercase text-muted-foreground">End</span>
                <span className="text-xs font-semibold uppercase text-muted-foreground">Prep Time</span>
                <span></span>
              </div>
            )}

            {/* Slots */}
            <div className="space-y-3">
              {slots.map((slot, index) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-[80px_1fr_1fr_120px_40px] gap-3 items-center bg-background rounded-sm p-3 border border-border"
                  data-testid={`timing-slot-${index}`}
                >
                  <span className="text-sm font-heading font-bold text-blue-dark">Slot {index + 1}</span>
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(slot.id, 'start', e.target.value)}
                    data-testid={`slot-start-${index}`}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-blue-hero focus:ring-1 focus:ring-blue-hero"
                  />
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(slot.id, 'end', e.target.value)}
                    data-testid={`slot-end-${index}`}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-blue-hero focus:ring-1 focus:ring-blue-hero"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={slot.prepTime}
                      onChange={(e) => updateSlot(slot.id, 'prepTime', e.target.value)}
                      data-testid={`slot-prep-${index}`}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-blue-hero focus:ring-1 focus:ring-blue-hero"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">min</span>
                  </div>
                  <button
                    onClick={() => removeSlot(slot.id)}
                    data-testid={`slot-delete-${index}`}
                    className="p-2 rounded-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {slots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No time slots configured</p>
                <p className="text-xs mt-1">Add slots to show estimated prep time on orders</p>
              </div>
            )}

            {/* Add Slot Button */}
            {slots.length < 4 && (
              <button
                onClick={addSlot}
                data-testid="add-slot-btn"
                className="mt-4 flex items-center gap-2 px-4 py-3 rounded-sm border-2 border-dashed border-border text-muted-foreground hover:border-blue-hero hover:text-blue-hero transition-all text-sm font-medium"
              >
                <Plus size={16} />
                Add Slot
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <button
          onClick={handleReset}
          data-testid="timing-reset-btn"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-hero transition-all"
        >
          <RotateCcw size={14} />
          Clear All
        </button>
        <span className="text-sm text-muted-foreground" data-testid="slot-count">
          {slots.length} slot{slots.length !== 1 ? 's' : ''} configured
        </span>
        <button
          onClick={handleSave}
          data-testid="timing-save-footer-btn"
          className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-blue-hero text-white hover:bg-blue-medium transition-all font-semibold text-sm"
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );
};

export default TimingSettingsPage;
