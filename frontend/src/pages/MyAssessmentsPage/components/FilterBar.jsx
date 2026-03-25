import { Label, ListBox, Select } from '@heroui/react';
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';

import { IndustryFilterChip } from './IndustryFilterChip';

export function FilterBar({
  sortBy,
  setSortBy,
  setPage,
  searchTerm,
  setSearchTerm,
  industryOptions,
  selectedIndustries,
  handleToggleIndustry,
  formatIndustryLabel,
  selectedIds,
  handleCompareSelected,
}) {
  return (
    <div className="space-y-3 mb-6">
      {/* Search + sort row */}
      <div className="flex gap-3 flex-col sm:flex-row">
        {/* Search — use existing search state and handler */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            size={15}
            style={{ color: 'var(--muted)' }}
          />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border
                   focus:outline-none transition-all duration-150"
            style={{
              backgroundColor: 'var(--field-bg)',
              borderColor: 'var(--field-border)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* Sort — keep existing HeroUI Select */}
        <div className="w-full sm:w-44">
          <Select
            className="w-full"
            placeholder="Sort by"
            value={sortBy}
            onChange={(value) => {
              setSortBy(value || 'created_at_desc');
              setPage(1);
            }}
            variant="bordered"
            size="md"
          >
            <Label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Sort by
            </Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="created_at_asc" textValue="Date Created (Oldest)">
                  Date Created (Oldest)
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="created_at_desc" textValue="Date Created (Newest)">
                  Date Created (Newest)
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="title_asc" textValue="Title (A-Z)">
                  Title (A-Z)
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="title_desc" textValue="Title (Z-A)">
                  Title (Z-A)
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="overall_score_asc" textValue="Score (Low to High)">
                  Score (Low to High)
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="overall_score_desc" textValue="Score (High to Low)">
                  Score (High to Low)
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      {/* Industry filter chips */}
      <div className="flex flex-wrap gap-2">
        {industryOptions.map((industry) => (
          <IndustryFilterChip
            key={industry}
            industry={industry}
            isSelected={selectedIndustries.includes(industry)}
            onToggle={handleToggleIndustry}
            label={industry === 'all' ? 'All Industries' : formatIndustryLabel(industry)}
          />
        ))}
      </div>
    </div>
  );
}

FilterBar.propTypes = {
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  setPage: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  industryOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedIndustries: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleToggleIndustry: PropTypes.func.isRequired,
  formatIndustryLabel: PropTypes.func.isRequired,
  selectedIds: PropTypes.instanceOf(Set).isRequired,
  handleCompareSelected: PropTypes.func.isRequired,
};

export default FilterBar;
