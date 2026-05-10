import { Drawer } from '@heroui/react';
import {
  AlertCircle,
  Building2,
  FileText,
  FolderOpen,
  Lightbulb,
  MapPin,
  Package,
  Recycle,
  SquareArrowOutUpRight,
  Tag,
  Target,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { Chip } from '@/components/common';
import DRAWER_TYPES from '@/constants/drawerTypes';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks';
import { getMatchStrength } from '@/utils/content';

export default function ResultsDatabaseEvidenceDetailsDrawer({ data }) {
  const { drawer, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  // Check if this specific drawer is open and matches the expected type
  const isThisDrawerOpen =
    drawer?.type === DRAWER_TYPES.RESULTS_DATABASE_EVIDENCE_DETAILS && drawer?.isOpen;

  // Reusable component for sections with heading and content
  const DetailSection = ({ title, icon, content, fallback = null }) => {
    if (!content) return null;
    return (
      <div className="space-y-2">
        <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
          {title}
          {React.createElement(icon, { strokeWidth: 2.5, size: 16, className: 'ml-2 inline' })}
        </h4>
        <p className="text-sm/relaxed text-(--color-text-secondary)">{content || fallback}</p>
      </div>
    );
  };

  const matchPercentage = Math.round((data.similarity || 0) * 100).toFixed(1);
  const matchStrength = getMatchStrength(data.similarity || 0);

  if (!data) return null;

  return (
    <Drawer
      isOpen={isThisDrawerOpen}
      shouldCloseOnInteractOutside={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--color-drawer-icon-accent-bg)">
                  <FileText
                    size={16}
                    className="text-(--color-drawer-icon-accent-text)"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {data.title || data.case_id || 'Case Details'}
                  </Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-(--color-text-secondary)">
                    Detailed evidence and matched case context
                  </p>
                </div>
              </div>
            </Drawer.Header>

            <Drawer.Body className="space-y-6 p-6">
              {/* Meta Information */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {data.id && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Case ID
                    </span>
                    <p className="font-mono text-sm break-all text-(--color-text-primary)">
                      {data.id}
                    </p>
                  </div>
                )}
                {data.similarity && (
                  <div>
                    <p className="mb-1 text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Similarity
                    </p>
                    <Chip variant="match" color={matchStrength}>
                      <span>{matchPercentage}%</span>
                    </Chip>
                  </div>
                )}
                {data.source_display && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Source
                    </span>
                    <p className="text-sm text-(--color-text-primary)">{data.source_display}</p>
                  </div>
                )}
                {data.year && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Year
                    </span>
                    <p className="text-sm text-(--color-text-primary)">
                      {data.year || 'Not specified'}
                    </p>
                  </div>
                )}
              </div>

              <DetailSection title="Problem Statement" icon={AlertCircle} content={data.problem} />

              <DetailSection title="Solution Approach" icon={Lightbulb} content={data.solution} />

              <DetailSection title="Impact" icon={Target} content={data.impact} />

              <DetailSection title="Materials" icon={Package} content={data.materials} />

              <DetailSection
                title="Circular Strategy"
                icon={Recycle}
                content={data.circular_strategy}
              />

              <DetailSection title="Industry" icon={Building2} content={data.industry} />

              <DetailSection
                title="Location"
                icon={MapPin}
                content={data.location}
                fallback="Not specified"
              />

              <DetailSection title="Use Type" icon={Tag} content={data.use_type} />

              <DetailSection title="Category" icon={FolderOpen} content={data.category} />

              {/* Case Scores */}
              {/* {data.case_scores && (
                <div className="space-y-3">
                  <h4 className="mb-3 text-sm font-semibold text-(--color-text-primary)">
                    Performance Scores
                    <BarChart3 strokeWidth={2.5} size={16} className="ml-2 inline" />
                  </h4>
                  <div className="grid grid-cols-2">
                    {Object.entries(data.case_scores).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-start gap-2.5 rounded-lg bg-(--color-bg-field) p-2"
                      >
                        <span className="text-sm font-medium text-(--color-text-muted)">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-(--color-text-primary)">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Source URL */}
              {data.source_url && (
                <div className="space-y-2">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                      Source
                      <SquareArrowOutUpRight strokeWidth={2.5} size={16} className="ml-2 inline" />
                    </h4>
                  </div>
                  <a
                    href={data.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-jua text-sm/relaxed break-all text-(--color-accent) hover:underline"
                  >
                    {data.source_url}
                  </a>
                </div>
              )}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

ResultsDatabaseEvidenceDetailsDrawer.propTypes = {
  data: PropTypes.object,
};
