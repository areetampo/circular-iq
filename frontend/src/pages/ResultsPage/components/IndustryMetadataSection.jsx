import PropTypes from 'prop-types';

import { FieldDisplayCard } from '@/pages/ResultsPage/components/FieldDisplayCard';

export function IndustryMetadataSection({ actualResult, fieldHelp }) {
  if (!actualResult.metadata) return null;

  return (
    <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
      <div className="p-1 sm:p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Industry', value: actualResult.industry || '', helpKey: 'industry' },
            { label: 'Scale', value: actualResult.metadata.scale, helpKey: 'scale' },
            {
              label: 'Strategy',
              value: actualResult.metadata.r_strategy,
              helpKey: 'r_strategy',
            },
            {
              label: 'Material',
              value: actualResult.metadata.primary_material,
              helpKey: 'primary_material',
            },
            {
              label: 'Geography',
              value: actualResult.metadata.geographic_focus,
              helpKey: 'geographic_focus',
            },
          ].map((field) => (
            <FieldDisplayCard
              key={field.label}
              label={field.label}
              value={field.value}
              helpText={fieldHelp[field.helpKey]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

IndustryMetadataSection.propTypes = {
  actualResult: PropTypes.object,
  fieldHelp: PropTypes.object,
};

export default IndustryMetadataSection;
