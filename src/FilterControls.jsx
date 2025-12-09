import React from 'react';

const FilterControls = ({ eras, epochs, categories, onFilterChange }) => {
  return (
    <div className="filter-controls">
      <input
        type="text"
        placeholder="Search by name..."
        onChange={(e) => onFilterChange('name', e.target.value)}
      />
      <select onChange={(e) => onFilterChange('era', e.target.value)}>
        <option value="">All Eras</option>
        {eras.map((era, index) => (
          <option key={`${era}-${index}`} value={era}>
            {era}
          </option>
        ))}
      </select>
      <select onChange={(e) => onFilterChange('epoch', e.target.value)}>
        <option value="">All Epochs</option>
        {epochs.map((epoch, index) => (
          <option key={`${epoch}-${index}`} value={epoch}>
            {epoch}
          </option>
        ))}
      </select>
      <select onChange={(e) => onFilterChange('category', e.target.value)}>
        <option value="">All Categories</option>
        {categories.map((category, index) => (
          <option key={`${category}-${index}`} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterControls;
