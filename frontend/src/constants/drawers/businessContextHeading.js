/**
 * @module businessContextHeading
 * @description Content for the business context heading drawer.
 * Defines the six business context fields with descriptions and hints.
 */

/**
 * Business context heading content object.
 * @type {Object}
 */
export const BUSINESS_CONTEXT_HEADING_CONTENT = {
  fields: [
    {
      title: 'Business Model Type',
      description:
        'The circular economy model your solution follows. Examples: Product-as-a-Service, Take-Back Schemes, Remanufacturing, or Recycling Operations.',
      hint: 'Helps the AI understand your approach to keeping materials in use.',
    },
    {
      title: 'Operational Stage',
      description:
        'Where your business or project currently stands. Ranges from early concept through mature/established operations.',
      hint: 'Informs realistic benchmarks and recommendations for your stage.',
    },
    {
      title: 'Target Geography',
      description:
        'The geographic scope of your operations or ambitions—from local city/region to global markets.',
      hint: 'Influences logistics, regulatory compliance, and scalability insights.',
    },
    {
      title: 'Annual Material Volume',
      description:
        'Approximate quantity of material processed, recovered, or handled per year. Can be physical (tonnes) or digital/intangible.',
      hint: 'Determines the scale of impact and infrastructure requirements.',
    },
    {
      title: 'Material Complexity',
      description:
        'The nature of materials your solution handles—single-material, multi-material composites, hazardous components, electronics, or biological materials.',
      hint: 'Affects technical challenges, safety, certifications, and market readiness.',
    },
    {
      title: 'Existing Supply Chain Partnerships',
      description:
        'Whether you already have collection, processing, or distribution partners in place or plan to establish them.',
      hint: 'Critical for understanding current barriers and acceleration opportunities.',
    },
  ],
};
