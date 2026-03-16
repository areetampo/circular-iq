import { Box, Chip, InputAdornment, TextField } from '@mui/material';
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

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
    <Box sx={{ width: '100%' }}>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for circular economy solutions..."
        fullWidth
        variant="outlined"
        size="small"
        disabled={loading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {PRESET_FILTERS.map((filter) => {
          const isActive = activeFilter?.key === filter.key && activeFilter?.value === filter.value;
          return (
            <Chip
              key={`${filter.key}-${filter.value}`}
              label={filter.label}
              variant={isActive ? 'filled' : 'outlined'}
              color={isActive ? 'primary' : 'default'}
              onClick={() => toggleFilter(filter)}
              size="small"
            />
          );
        })}
      </Box>
    </Box>
  );
}

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

SearchBar.defaultProps = {
  loading: false,
};
