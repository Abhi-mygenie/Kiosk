import React from 'react';
import { Plus, Minus, ShoppingCart, MessageSquare } from 'lucide-react';
import { normalizePrice } from '@/utils/kioskHelpers';
import touchSound from '@/utils/touchSound';

const CartSectionLandscape = ({ 
  cart, 
  removeFromCart, 
  updateQuantity, 
  calculateTotals, 
  tableNumber, 
  setShowTableSelector, 
  handlePlaceOrder, 
  isPlacingOrder,
  appliedCoupon,
  setEditingInstructions,
  hasTables
}) => {
  return (
    <div className="bg-white border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-heading font-bold uppercase text-blue-dark">Your Order</h2>
        <p className="text-sm text-muted-foreground">{cart.length} items</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg mb-1 font-medium">Ready to order?</p>
            <p className="text-sm">Select items from the menu to begin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.cartId} className="bg-blue-light/10 p-3 rounded-sm border border-blue-light/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-blue-dark truncate">{item.name}</h4>
                      <button
                        onClick={() => { touchSound.playTap(); setEditingInstructions(item); }}
                        className={`p-1 rounded transition-all flex-shrink-0 ${
                          item.specialInstructions 
                            ? 'text-blue-hero bg-blue-hero/10' 
                            : 'text-muted-foreground hover:text-blue-hero'
                        }`}
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                    {item.variations?.length > 0 && (
                      <p className="text-xs text-blue-medium truncate">{item.variations.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        touchSound.playClick();
                        if (item.quantity <= 1) removeFromCart(item.cartId);
                        else updateQuantity(item.cartId, item.quantity - 1);
                      }}
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:bg-red-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => { touchSound.playClick(); updateQuantity(item.cartId, item.quantity + 1); }}
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:bg-blue-light/30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {normalizePrice(item.totalPrice || item.price) > 0 && (
                    <span className="font-semibold text-sm text-blue-dark">
                      ₹{(normalizePrice(item.totalPrice || item.price) * item.quantity).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-white">
        {hasTables && tableNumber && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Table:</span>
              <span className="text-lg font-heading font-bold text-blue-dark">{tableNumber}</span>
            </div>
            <button
              onClick={() => { touchSound.playClick(); setShowTableSelector(true); }}
              className="text-sm text-blue-hero hover:text-blue-medium underline"
            >
              Change
            </button>
          </div>
        )}

        {cart.length > 0 && calculateTotals.grandTotal > 0 && (
          <div className="border-t border-border pt-3 mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{calculateTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST (2.5%)</span>
              <span>₹{calculateTotals.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST (2.5%)</span>
              <span>₹{calculateTotals.sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border text-base font-semibold">
              <span>Total</span>
              <span className="text-blue-dark">₹{calculateTotals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (hasTables && !tableNumber && cart.length > 0) {
              touchSound.playClick();
              setShowTableSelector(true);
            } else {
              handlePlaceOrder();
            }
          }}
          disabled={cart.length === 0 || isPlacingOrder}
          data-testid="place-order-button"
          className={`w-full py-4 rounded-sm text-lg font-semibold transition-all ${
            cart.length > 0 && !isPlacingOrder
              ? 'bg-blue-hero text-white hover:bg-blue-medium'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isPlacingOrder ? 'Placing...' : cart.length === 0 ? 'Add items' : hasTables && !tableNumber ? 'Select Table' : calculateTotals.grandTotal > 0 ? `Place Order • ₹${calculateTotals.grandTotal.toFixed(0)}` : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default CartSectionLandscape;
