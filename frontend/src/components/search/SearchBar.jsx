import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, InputAdornment, Chip, Box } from '@mui/material';
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
        {FILTER_KEYS.map((key) => (
          <Chip
            key={key}
            label={key.replace(/_/g, ' ').toUpperCase()}
            variant={activeFilters[key] ? 'filled' : 'outlined'}
            color={activeFilters[key] ? 'primary' : 'default'}
            onClick={() => toggleFilter(key)}
            size="small"
          />
        ))}
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
