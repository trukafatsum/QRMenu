import type { Badge } from '@/types';

const badgeStyles: Record<Badge['type'], string> = {
  popular: 'bg-accent-400/15 text-accent-300 border border-accent-400/30',
  spicy: 'bg-red-500/15 text-red-400 border border-red-500/30',
  vegetarian: 'bg-green-500/15 text-green-400 border border-green-500/30',
  new: 'bg-primary-400/15 text-primary-400 border border-primary-400/30',
  'gluten-free': 'bg-secondary-400/15 text-secondary-300 border border-secondary-400/30',
};

export function BadgeTag({ badge }: { badge: Badge }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${badgeStyles[badge.type]}`}
    >
      {badge.label}
    </span>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: Number.isInteger(price) ? 0 : 2 }).format(price);
}
