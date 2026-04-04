import { Button, ListBox, Select } from '@heroui/react';
import { GitCompare, Search } from 'lucide-react';
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
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) pointer-events-none"
          size={14}
        />
        <input
          type="text"
          placeholder="Search assessments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-9 pr-4 text-sm rounded-xl border border-[rgba(180,160,130,0.28)] bg-[rgba(245,240,232,0.6)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:outline-none focus:shadow-[0_0_0_3px_rgba(184,145,106,0.12)] transition-all"
        />
      </div>

      {/* Sort + Compare button row */}
      <div className="flex items-center gap-3">
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

        {/* Compare button */}
        <Button
          variant={selectedIds.size === 2 ? 'primary' : 'secondary'}
          size="sm"
          onClick={handleCompareSelected}
          disabled={selectedIds.size !== 2}
          className={selectedIds.size !== 2 ? 'opacity-50 cursor-not-allowed' : ''}
          title={
            selectedIds.size !== 2 ? 'Select exactly 2 assessments to compare' : 'Compare selected'
          }
        >
          <GitCompare size={14} />
          Select exactly 2 assessments to compare
        </Button>
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
