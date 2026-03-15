import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, SkipForward, Save, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuSettings } from '@/contexts/MenuSettingsContext';

// Sortable Item (menu item within a category)
const SortableItem = ({ id, item, isHidden, onToggleVisibility }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`settings-item-${id}`}
      className={`flex items-center gap-3 px-4 py-3 bg-white border border-border rounded-sm mb-1.5 transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-blue-hero/30 scale-[1.02]' : ''
      } ${isHidden ? 'opacity-40' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-blue-hero touch-none"
        data-testid={`drag-item-${id}`}
      >
        <GripVertical size={18} />
      </button>

      {item.image && (
        <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-semibold uppercase text-blue-dark ${isHidden ? 'line-through' : ''}`}>
          {item.name}
        </span>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>

      <button
        onClick={() => onToggleVisibility(id)}
        data-testid={`toggle-item-${id}`}
        className={`p-2 rounded-sm transition-all ${
          isHidden
            ? 'text-muted-foreground hover:text-red-500 bg-muted'
            : 'text-blue-hero hover:text-blue-medium bg-blue-hero/10'
        }`}
      >
        {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

// Sortable Category
const SortableCategory = ({
  id,
  category,
  items,
  isHidden,
  isExpanded,
  hiddenItems,
  onToggleVisibility,
  onToggleExpand,
  onToggleItemVisibility,
  onReorderItems,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const visibleCount = items.filter(i => !hiddenItems.includes(i.id)).length;

  const handleItemDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onReorderItems(id, arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`settings-category-${id}`}
      className={`mb-3 rounded-sm overflow-hidden border-2 transition-all ${
        isDragging ? 'shadow-xl ring-2 ring-blue-hero/30 scale-[1.01]' : 'border-border'
      } ${isHidden ? 'opacity-40' : ''}`}
    >
      {/* Category Header */}
      <div className={`flex items-center gap-3 px-4 py-3.5 ${isHidden ? 'bg-muted' : 'bg-white'}`}>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-blue-hero touch-none"
          data-testid={`drag-category-${id}`}
        >
          <GripVertical size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <span className={`text-base font-heading font-bold uppercase text-blue-dark tracking-wide ${isHidden ? 'line-through' : ''}`}>
            {category.name}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {visibleCount}/{items.length} items
          </span>
        </div>

        <button
          onClick={() => onToggleVisibility(id)}
          data-testid={`toggle-category-${id}`}
          className={`p-2 rounded-sm transition-all ${
            isHidden
              ? 'text-muted-foreground hover:text-red-500 bg-muted'
              : 'text-blue-hero hover:text-blue-medium bg-blue-hero/10'
          }`}
        >
          {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        <button
          onClick={() => onToggleExpand(id)}
          data-testid={`expand-category-${id}`}
          className="p-2 rounded-sm text-muted-foreground hover:text-blue-dark hover:bg-muted transition-all"
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Category Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 bg-[#F9F8F6]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleItemDragEnd}
              >
                <SortableContext
                  items={items.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map(item => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      item={item}
                      isHidden={hiddenItems.includes(item.id)}
                      onToggleVisibility={onToggleItemVisibility}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminSettingsPage = () => {
  const { menuData } = useAuth();
  const { saveSettings, skipSettings } = useMenuSettings();

  // Initialize state from API data
  const [categoryOrder, setCategoryOrder] = useState(
    () => menuData.categories.map(c => c.id)
  );
  const [itemsByCategory, setItemsByCategory] = useState(() => {
    const grouped = {};
    menuData.categories.forEach(cat => {
      grouped[cat.id] = menuData.menuItems.filter(item => item.category === cat.id);
    });
    return grouped;
  });
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [hiddenItems, setHiddenItems] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(
    () => new Set(menuData.categories.map(c => c.id))
  );

  const categoriesMap = useMemo(() => {
    const map = {};
    menuData.categories.forEach(c => { map[c.id] = c; });
    return map;
  }, [menuData.categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Stats
  const totalItems = menuData.menuItems.length;
  const visibleItems = totalItems - hiddenItems.length -
    menuData.menuItems.filter(i => hiddenCategories.includes(i.category) && !hiddenItems.includes(i.id)).length;

  // Handlers
  const handleCategoryDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCategoryOrder(prev => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const toggleCategoryVisibility = (catId) => {
    setHiddenCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleItemVisibility = (itemId) => {
    setHiddenItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleExpand = (catId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleReorderItems = (catId, newItems) => {
    setItemsByCategory(prev => ({ ...prev, [catId]: newItems }));
  };

  const handleReset = () => {
    setCategoryOrder(menuData.categories.map(c => c.id));
    const grouped = {};
    menuData.categories.forEach(cat => {
      grouped[cat.id] = menuData.menuItems.filter(item => item.category === cat.id);
    });
    setItemsByCategory(grouped);
    setHiddenCategories([]);
    setHiddenItems([]);
    setExpandedCategories(new Set(menuData.categories.map(c => c.id)));
  };

  const handleSave = () => {
    const itemOrder = {};
    Object.keys(itemsByCategory).forEach(catId => {
      itemOrder[catId] = itemsByCategory[catId].map(i => i.id);
    });
    saveSettings(categoryOrder, itemOrder, hiddenCategories, hiddenItems);
  };

  const handleSkip = () => {
    skipSettings();
  };

  return (
    <div className="h-screen flex flex-col bg-[#F9F8F6]" data-testid="admin-settings-page">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <img
            src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png"
            alt="Logo"
            className="h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-heading font-bold uppercase text-blue-dark tracking-wide">
              Menu Settings
            </h1>
            <p className="text-xs text-muted-foreground">Drag to reorder, toggle to show/hide</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            data-testid="skip-settings-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border text-muted-foreground hover:bg-muted transition-all font-semibold text-sm"
          >
            <SkipForward size={16} />
            Skip
          </button>
          <button
            onClick={handleSave}
            data-testid="save-settings-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-blue-hero text-white hover:bg-blue-medium transition-all font-semibold text-sm"
          >
            <Save size={16} />
            Save & Continue
          </button>
        </div>
      </div>

      {/* Body - Scrollable Categories */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categoryOrder}
            strategy={verticalListSortingStrategy}
          >
            {categoryOrder.map(catId => {
              const category = categoriesMap[catId];
              if (!category) return null;
              return (
                <SortableCategory
                  key={catId}
                  id={catId}
                  category={category}
                  items={itemsByCategory[catId] || []}
                  isHidden={hiddenCategories.includes(catId)}
                  isExpanded={expandedCategories.has(catId)}
                  hiddenItems={hiddenItems}
                  onToggleVisibility={toggleCategoryVisibility}
                  onToggleExpand={toggleExpand}
                  onToggleItemVisibility={toggleItemVisibility}
                  onReorderItems={handleReorderItems}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <button
          onClick={handleReset}
          data-testid="reset-settings-btn"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-hero transition-all"
        >
          <RotateCcw size={14} />
          Reset to Default
        </button>
        <span className="text-sm text-muted-foreground" data-testid="visibility-count">
          {visibleItems} items visible / {totalItems} total
        </span>
        <button
          onClick={handleSave}
          data-testid="save-settings-footer-btn"
          className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-blue-hero text-white hover:bg-blue-medium transition-all font-semibold text-sm"
        >
          <Save size={16} />
          Save & Continue
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
