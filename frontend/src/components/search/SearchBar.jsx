import { Chip, SearchField } from '@heroui/react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';

// Preset filter options shown as toggleable chips
const PRESET_FILTERS = [
  { key: 'industry', value: 'textiles', label: 'Textiles' },
  { key: 'industry', value: 'packaging', label: 'Packaging' },
  { key: 'industry', value: 'electronics', label: 'Electronics' },
  { key: 'industry', value: 'construction', label: 'Construction' },
  { key: 'industry', value: 'energy', label: 'Energy' },
];

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // { key, value } | null

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      onSearch('', {});
      return;
    }
    const filters = activeFilter ? { [activeFilter.key]: activeFilter.value } : {};
    onSearch(debouncedQuery, filters);
  }, [debouncedQuery, activeFilter, onSearch]);

  const toggleFilter = (filter) => {
    setActiveFilter((prev) =>
      prev && prev.key === filter.key && prev.value === filter.value ? null : filter,
    );
  };

  return (
    <div className="w-full">
      <SearchField
        name="search"
        value={query}
        onChange={setQuery}
        isDisabled={loading}
        placeholder="Search for circular economy solutions..."
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <div className="flex flex-wrap gap-1 mt-1">
        {PRESET_FILTERS.map((filter) => {
          const isActive = activeFilter?.key === filter.key && activeFilter?.value === filter.value;
          return (
            <Chip
              key={`${filter.key}-${filter.value}`}
              onClick={() => toggleFilter(filter)}
              variant={isActive ? 'solid' : 'bordered'}
            >
              {filter.label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

SearchBar.defaultProps = {
  loading: false,
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

SearchBar.defaultProps = {
  loading: false,
};
