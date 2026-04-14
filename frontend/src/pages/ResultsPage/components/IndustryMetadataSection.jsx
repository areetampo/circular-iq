import PropTypes from 'prop-types';

import { FieldDisplayCard } from '@/pages/ResultsPage/components/FieldDisplayCard';
import { SectionHeading } from '@/components/common';
import { Store } from 'lucide-react';

export function IndustryMetadataSection({ actualResult, fieldHelp }) {
  if (!actualResult.metadata) return null;

  return (
    <div>
      <SectionHeading variant="small" icon={<Store size={16} className="text-(--color-accent)" />}>
        Industry metadata
      </SectionHeading>
      <div className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent">
        <div className="mt-4 p-1 sm:p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
    </div>
  );
}

IndustryMetadataSection.propTypes = {
  actualResult: PropTypes.object,
  fieldHelp: PropTypes.object,
};

export default IndustryMetadataSection;
