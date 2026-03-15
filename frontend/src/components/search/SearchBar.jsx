import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Input, Chip, Button } from '@heroui/react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const FILTER_KEYS = ['industry', 'category', 'source'];

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    industry: false,
    category: false,
    source: false,
  });

  const debouncedQuery = useDebounce(query, 400);

  const filters = useMemo(() => {
    const out = {};
    FILTER_KEYS.forEach((key) => {
      if (activeFilters[key]) {
        // When a filter is active, pass the query as the filter value.
        // This allows the backend to narrow results by that category.
        out[key] = debouncedQuery.trim() || null;
      }
    });
    return out;
  }, [activeFilters, debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      onSearch('', {});
      return;
    }
    onSearch(debouncedQuery, filters);
  }, [debouncedQuery, filters, onSearch]);

  const toggleFilter = (key) => {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for circular economy solutions..."
          fullWidth
          disabled={loading}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-1 mt-1">
        {FILTER_KEYS.map((key) => (
          <Button
            key={key}
            variant={activeFilters[key] ? 'solid' : 'bordered'}
            color={activeFilters[key] ? 'primary' : 'default'}
            size="sm"
            onPress={() => toggleFilter(key)}
            className="text-xs"
          >
            {key.replace(/_/g, ' ').toUpperCase()}
          </Button>
        ))}
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
