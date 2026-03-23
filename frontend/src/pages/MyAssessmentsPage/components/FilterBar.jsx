import {
  Card,
  Button as HeroButton,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Tooltip,
} from '@heroui/react';
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
    <Card className="border-2 border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
      <div className="p-6 space-y-6">
        {/* Sort and Search Row - compact responsive layout */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-48">
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
                <Label className="text-sm font-semibold text-slate-700">Sort by</Label>
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

            {/* Small helper action to reset sorting quickly */}
            <HeroButton
              onClick={() => setSortBy('created_at_desc')}
              size="md"
              variant="ghost"
              className="hidden md:inline-flex"
            >
              Reset
            </HeroButton>
          </div>

          {/* Search placed to the right on larger screens, full-width on mobile */}
          <div className="flex-1 lg:ml-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-700">Search</label>
              <div className="relative">
                <Search
                  className="absolute transform -translate-y-1/2 left-3 top-1/2 text-slate-400 pointer-events-none z-10"
                  size={16}
                />
                <Input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="bordered"
                  size="md"
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Industry Filter Chips */}
        {industryOptions.length > 1 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Filter by Industry</label>
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
        )}

        <Separator orientation="horizontal" />

        {/* Compare 2 Assessments Button */}
        <div className="flex justify-center items-center">
          <Tooltip delay={0} isDisabled={selectedIds.size === 2}>
            <Tooltip.Trigger>
              <Button
                onPress={handleCompareSelected}
                isDisabled={selectedIds.size !== 2}
                variant="teal"
                size="md"
              >
                <GitCompare size={16} />
                {selectedIds.size}/2 Compare Selected
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <span>
                Select exactly 2 assessments to see how your initiative evolved over time or compare
                strategies side-by-side.
              </span>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>
    </Card>
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
