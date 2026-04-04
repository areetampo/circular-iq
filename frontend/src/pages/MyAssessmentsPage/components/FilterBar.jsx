import { ListBox, Select, Tooltip } from '@heroui/react';
import { GitCompare, Search } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button } from '@/components/common';

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
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) pointer-events-none"
          size={14}
          strokeWidth={2}
        />
        <input
          type="text"
          placeholder="Search assessments by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-9 pr-4 text-sm rounded-xl border border-[rgba(180,160,130,0.28)] bg-[rgba(245,240,232,0.6)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none focus:shadow-[0_0_0_3px_rgba(184,145,106,0.12)] transition-all"
        />
      </div>

      {/* Sort + Compare button row */}
      <div className="flex items-center justify-between gap-3">
        {/* Sort — HeroUI Select */}
        <div className="flex-1 max-w-50">
          <Select
            className="w-full"
            placeholder="Sort by"
            value={sortBy}
            onChange={(value) => {
              setSortBy(value || 'created_at_desc');
              setPage(1);
            }}
            variant="bordered"
            size="sm"
            classNames={{
              trigger:
                'border-[rgba(180,160,130,0.28)] bg-[rgba(245,240,232,0.6)] text-(--color-text-primary) pr-10',
              popover: 'bg-[rgba(245,240,232,0.95)] border-[rgba(180,160,130,0.28)]',
            }}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {[
                  { id: 'created_at_asc', label: 'Date Created (Oldest)' },
                  { id: 'created_at_desc', label: 'Date Created (Newest)' },
                  { id: 'title_asc', label: 'Title (A-Z)' },
                  { id: 'title_desc', label: 'Title (Z-A)' },
                  { id: 'overall_score_asc', label: 'Score (Low to High)' },
                  { id: 'overall_score_desc', label: 'Score (High to Low)' },
                ].map(({ id, label }) => (
                  <ListBox.Item key={id} id={id} textValue={label}>
                    {label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Compare button */}
        <Tooltip delay={0} isDisabled={selectedIds.size === 2}>
          <Tooltip.Trigger>
            <Button
              variant="results-action"
              onClick={handleCompareSelected}
              disabled={selectedIds.size !== 2}
              className={selectedIds.size !== 2 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <GitCompare size={14} />
              compare
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow placement="top">
            <Tooltip.Arrow />
            <p>Select exactly 2 assessments to compare</p>
          </Tooltip.Content>
        </Tooltip>
      </div>

      {/* Industry filter chips */}
      {industryOptions.length > 1 && (
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
      )}
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
