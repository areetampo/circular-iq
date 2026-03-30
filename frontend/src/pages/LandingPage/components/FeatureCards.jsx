import { Bot, LayersPlus, Pickaxe } from 'lucide-react';

export const FEATURE_CARDS = [
  {
    key: 'ai-powered',
    title: 'AI-Powered',
    desc: 'Machine learning analysis grounded in circular economy principles.',
    Icon: Bot,
    bg: 'var(--surface)',
    borderClass: 'var(--border)',
    iconColor: 'var(--accent)',
  },
  {
    key: 'multi-dimensional',
    title: 'Multi-Dimensional',
    desc: 'Evaluates across key domains for clarity and depth.',
    Icon: LayersPlus,
    bg: 'var(--surface)',
    borderClass: 'var(--border)',
    iconColor: 'var(--accent)',
  },
  {
    key: 'actionable',
    title: 'Actionable',
    desc: 'Clear recommendations you can apply immediately to improve outcomes.',
    Icon: Pickaxe,
    bg: 'var(--surface)',
    borderClass: 'var(--border)',
    iconColor: 'var(--accent)',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {FEATURE_CARDS.map((card) => {
        const Icon = card.Icon;
        return (
          <div
            key={card.key}
            role="article"
            aria-label={card.title}
            className="rounded-lg border p-5"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="p-2.5 rounded-lg shrink-0"
                style={{ backgroundColor: 'var(--accent-soft)' }}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={{ color: card.iconColor }}
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <h3
                  className="font-semibold text-[15px] mb-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {card.desc}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

FeatureCards.propTypes = {};
