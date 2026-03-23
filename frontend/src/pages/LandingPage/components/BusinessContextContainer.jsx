import { Label, ListBox, Select, Switch } from '@heroui/react';
import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '@/utils/cn';

const LEAVE_EMPTY_OPTION = { value: null, label: '[LEAVE EMPTY]' };

const BUSINESS_MODEL_OPTIONS = [
  LEAVE_EMPTY_OPTION,
  { value: 'product-as-a-service', label: 'Product-as-a-Service' },
  { value: 'take-back', label: 'Take-Back Scheme' },
  { value: 'remanufacturing', label: 'Remanufacturing' },
  { value: 'sharing-platform', label: 'Sharing Platform' },
  { value: 'repair-service', label: 'Repair & Refurbish Service' },
  { value: 'recycling', label: 'Recycling Operation' },
  { value: 'other', label: 'Other' },
];

const OPERATIONAL_STAGE_OPTIONS = [
  LEAVE_EMPTY_OPTION,
  { value: 'idea', label: 'Idea / Concept' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'pilot', label: 'Pilot / Early Stage' },
  { value: 'scaling', label: 'Scaling Up' },
  { value: 'mature', label: 'Mature / Established' },
];

const GEOGRAPHY_OPTIONS = [
  LEAVE_EMPTY_OPTION,
  { value: 'local', label: 'Local (City / Region)' },
  { value: 'national', label: 'National' },
  { value: 'regional', label: 'Multi-Country Region' },
  { value: 'global', label: 'Global' },
];

const VOLUME_OPTIONS = [
  LEAVE_EMPTY_OPTION,
  { value: 'under-1-tonne', label: '< 1 tonne / year' },
  { value: '1-10-tonnes', label: '1 – 10 tonnes / year' },
  { value: '10-100-tonnes', label: '10 – 100 tonnes / year' },
  { value: 'over-100-tonnes', label: '> 100 tonnes / year' },
  { value: 'digital-intangible', label: 'Digital / Intangible' },
];

const MATERIAL_OPTIONS = [
  LEAVE_EMPTY_OPTION,
  { value: 'single-material', label: 'Single Material (e.g. aluminium only)' },
  { value: 'multi-material', label: 'Multi-Material Composite' },
  { value: 'hazardous-components', label: 'Hazardous Components' },
  { value: 'electronics', label: 'Electronics / E-Waste' },
  { value: 'biological', label: 'Biological / Organic' },
];

function BusinessContextContainer({ loading = false }) {
  const { control } = useFormContext();

  const renderSelect = (name, label, options, description) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {description && <span className="text-xs text-slate-400">{description}</span>}
      <Controller
        name={`businessContext.${name}`}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value === null ? '__LEAVE_EMPTY__' : (field.value ?? undefined)}
            onChange={(val) => field.onChange(val === '__LEAVE_EMPTY__' ? null : val)}
            isDisabled={loading}
            placeholder="Select (optional)"
            className="w-full"
          >
            <Label className="sr-only">{label}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {options.map((item) => (
                  <ListBox.Item
                    key={item.value === null ? '__LEAVE_EMPTY__' : item.value}
                    id={item.value === null ? '__LEAVE_EMPTY__' : item.value}
                    textValue={item.label}
                  >
                    {item.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}
      />
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-6 space-y-5">
      <p className="text-xs text-slate-500 italic">
        These optional fields help the AI generate more precise benchmarks and recommendations. Your
        answers are never stored beyond this session unless you save the assessment.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {renderSelect(
          'business_model_type',
          'Business Model Type',
          BUSINESS_MODEL_OPTIONS,
          'What circular economy model best describes your approach?',
        )}
        {renderSelect(
          'operational_stage',
          'Operational Stage',
          OPERATIONAL_STAGE_OPTIONS,
          'Where is your business / project right now?',
        )}
        {renderSelect(
          'target_geography',
          'Target Geography',
          GEOGRAPHY_OPTIONS,
          'What is the intended geographic scope?',
        )}
        {renderSelect(
          'annual_volume_estimate',
          'Annual Material Volume',
          VOLUME_OPTIONS,
          'Approximate volume of material processed or recovered per year.',
        )}
        {renderSelect(
          'material_complexity',
          'Material Complexity',
          MATERIAL_OPTIONS,
          'What best describes the materials your solution handles?',
        )}
      </div>

      {/* Boolean toggle — existing partnerships */}
      <Controller
        name="businessContext.has_existing_partnerships"
        control={control}
        render={({ field }) => (
          <Switch
            isSelected={field.value === true}
            onChange={(checked) => field.onChange(checked)}
            isDisabled={loading}
            size="sm"
            className="w-full"
          >
            <Switch.Content className="w-full">
              <Label className="cursor-pointer flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-col gap-0.5 mr-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Existing Supply Chain / Collection Partnerships
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Do you already have partners for collection, processing, or distribution?
                  </p>
                </div>
                <Switch.Control className={cn(field.value === true ? 'bg-rose-900' : '')}>
                  <Switch.Thumb>{/* <Switch.Icon></Switch.Icon> */}</Switch.Thumb>
                </Switch.Control>
              </Label>
            </Switch.Content>
          </Switch>
        )}
      />
    </div>
  );
}

BusinessContextContainer.propTypes = {
  loading: PropTypes.bool,
};

export default BusinessContextContainer;
