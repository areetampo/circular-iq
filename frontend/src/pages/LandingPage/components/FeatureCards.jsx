import { Bot, LayersPlus, Pickaxe } from 'lucide-react';

export const FEATURE_CARDS = [
  {
    key: 'ai-powered',
    title: 'AI-Powered',
    desc: 'Machine learning analysis grounded in circular economy principles.',
    Icon: Bot,
  },
  {
    key: 'multi-dimensional',
    title: 'Multi-Dimensional',
    desc: 'Evaluates across key domains for clarity and depth.',
    Icon: LayersPlus,
  },
  {
    key: 'actionable',
    title: 'Actionable',
    desc: 'Clear recommendations you can apply immediately to improve outcomes.',
    Icon: Pickaxe,
  },
];

export default function FeatureCards() {
  return (
    <div className="mx-auto mb-12 grid max-w-3xl grid-cols-3 gap-6">
      {FEATURE_CARDS.map((card) => {
        const Icon = card.Icon;
        return (
          <div key={card.key} role="article" aria-label={card.title} className="text-center">
            {/* Icon */}
            <div className="mx-auto mb-3 flex size-8 items-center justify-center rounded-sm bg-(--color-accent-light) text-(--color-accent)">
              <Icon className="size-4" strokeWidth={2} />
            </div>

            {/* Title */}
            <h3 className="mb-1 text-sm font-semibold text-(--color-text-primary)">{card.title}</h3>

            {/* Description */}
            <p className="text-xs/relaxed text-(--color-text-muted)">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

FeatureCards.propTypes = {};
