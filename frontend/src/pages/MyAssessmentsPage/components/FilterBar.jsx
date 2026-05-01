import { ListBox, SearchField, Select, Tooltip } from '@heroui/react';
import { Scale, Share2, TrendingUpDown } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

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
  compareUrl,
}) {
  return (
    <div className="mb-6 space-y-3">
      {/* Search */}
      <SearchField value={searchTerm} onChange={setSearchTerm} className="w-full">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search assessments by name..." className="h-9 text-sm" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {/* Sort + Compare button row */}
      <div className="flex items-center justify-between gap-3">
        {/* Sort — HeroUI Select */}
        <div className="max-w-50 flex-1">
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
                'border-(--color-border-strong-alpha-80) bg-(--color-input-bg) text-(--color-text-primary) pr-10',
              popover: 'bg-(--color-select-popover-bg) border-(--color-border-strong-alpha-80)',
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
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            as={Link}
            to={'/assessments/share'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2 size={14} strokeWidth={2} />
            <span>Shared Assessments</span>
          </Button>
          <Button
            variant="ghost"
            as={Link}
            to={'/assessments/compare'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Scale size={14} strokeWidth={2} />
            <span>Compare Others</span>
          </Button>
          <Tooltip delay={0}>
            <Tooltip.Trigger>
              <Button
                variant="results-action"
                as={selectedIds.size === 2 ? Link : 'button'}
                to={selectedIds.size === 2 ? compareUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                isDisabled={selectedIds.size !== 2}
              >
                <TrendingUpDown size={14} strokeWidth={2} />
                <span className="font-mono">compare ({selectedIds.size}/2)</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <p>
                {selectedIds.size === 2
                  ? 'Compare these two assessments'
                  : 'Select exactly 2 assessments to compare'}
              </p>
            </Tooltip.Content>
          </Tooltip>
        </div>
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
  compareUrl: PropTypes.string,
};

export default FilterBar;
