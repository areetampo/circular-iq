import { Bot, LayersPlus, Pickaxe } from 'lucide-react';

export const FEATURE_CARDS = [
  {
    key: 'ai-powered',
    title: 'AI-Powered',
    desc: 'Machine learning analysis grounded in circular economy principles.',
    Icon: Bot,
    bg: 'var(--accent-soft)',
    borderClass: 'var(--border)',
    iconColor: 'var(--accent)',
  },
  {
    key: 'multi-dimensional',
    title: 'Multi-Dimensional',
    desc: 'Evaluates across key domains for clarity and depth.',
    Icon: LayersPlus,
    bg: 'var(--success-soft)',
    borderClass: 'var(--border)',
    iconColor: 'var(--success)',
  },
  {
    key: 'actionable',
    title: 'Actionable',
    desc: 'Clear recommendations you can apply immediately to improve outcomes.',
    Icon: Pickaxe,
    bg: 'var(--warning-soft)',
    borderClass: 'var(--border)',
    iconColor: 'var(--warning)',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {FEATURE_CARDS.map((card) => {
        const Icon = card.Icon;
        return (
          <div
            key={card.key}
            role="article"
            aria-label={card.title}
            className="rounded-lg border p-6 group"
            style={{
              backgroundColor: card.bg,
              borderColor: card.borderClass,
            }}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <Icon
                className="h-8 w-8 shrink-0"
                style={{ color: card.iconColor }}
                strokeWidth={1.75}
              />

              <h3
                className="font-semibold text-lg mt-4"
                style={{
                  color: 'var(--foreground)',
                }}
              >
                {card.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{
                  color: 'var(--muted)',
                }}
              >
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

FeatureCards.propTypes = {};
