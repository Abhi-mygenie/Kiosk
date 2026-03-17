import React from 'react';
import touchSound from '@/utils/touchSound';

const CategoryPills = ({ categories, activeCategory, setActiveCategory }) => {
  return (
    <div className="bg-white border-b border-border flex-shrink-0">
      <div className="flex overflow-x-auto scrollbar-hide px-7 py-5 gap-3">
        <button
          onClick={() => { touchSound.playTap(); setActiveCategory('all'); }}
          data-testid="category-pill-all"
          className={`flex-shrink-0 px-8 py-5 rounded-full text-base font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-blue-hero text-white'
              : 'bg-muted hover:bg-blue-light/20 text-muted-foreground'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => { touchSound.playTap(); setActiveCategory(category.id); }}
            data-testid={`category-pill-${category.id}`}
            className={`flex-shrink-0 px-8 py-5 rounded-full text-base font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-blue-hero text-white'
                : 'bg-muted hover:bg-blue-light/20 text-muted-foreground'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryPills;
