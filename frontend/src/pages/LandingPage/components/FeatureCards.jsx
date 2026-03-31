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
    <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
      {FEATURE_CARDS.map((card) => {
        const Icon = card.Icon;
        return (
          <div key={card.key} role="article" aria-label={card.title} className="text-center">
            {/* Icon */}
            <div className="w-8 h-8 bg-(--color-accent-light) rounded-sm flex items-center justify-center text-(--color-accent) mb-3 mx-auto">
              <Icon className="w-4 h-4" strokeWidth={2} />
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-(--color-text-primary) mb-1">{card.title}</h3>

            {/* Description */}
            <p className="text-xs text-(--color-text-muted) leading-relaxed">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

FeatureCards.propTypes = {};
