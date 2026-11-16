import { cn } from '@/lib/utils';
import { TYPE_LABELS, type PostType } from '@/lib/blog';

const TONE: Record<PostType, string> = {
  article: 'bg-tint-blue',
  newsletter: 'bg-tint-yellow',
  'case-study': 'bg-tint-green',
};

const TypeBadge = ({ type, className }: { type: PostType; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md border-2 border-ink px-2 py-0.5 font-sans text-xs font-bold text-ink',
      TONE[type],
      className,
    )}
  >
    {TYPE_LABELS[type]}
  </span>
);

export default TypeBadge;
