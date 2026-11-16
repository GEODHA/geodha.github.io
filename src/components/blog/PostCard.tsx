import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatPostDate, type Post } from '@/lib/blog';
import TypeBadge from './TypeBadge';

interface Props {
  post: Post;
  /** Large horizontal layout for the lead post on the index. */
  lead?: boolean;
}

const PostCard = ({ post, lead = false }: Props) => (
  <Link
    to={`/blog/${post.slug}`}
    className={cn(
      'group flex flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-paper transition-transform',
      'hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40',
      lead && 'md:flex-row',
    )}
    style={{ boxShadow: 'var(--shadow-offset-4)' }}
  >
    <div
      className={cn(
        'relative shrink-0 overflow-hidden border-ink bg-muted',
        lead ? 'aspect-[16/9] border-b-[3px] md:aspect-auto md:w-1/2 md:border-b-0 md:border-r-[3px]' : 'aspect-[16/9] border-b-[3px]',
      )}
    >
      {post.cover ? (
        <img
          src={post.cover}
          alt={post.coverAlt ?? ''}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-tint-green/60 p-6">
          <span className="text-center text-lg font-black leading-tight text-ink/70 line-clamp-3">{post.title}</span>
        </div>
      )}
      {post.draft && (
        <span className="absolute left-3 top-3 rounded-md border-2 border-ink bg-tint-red px-2 py-0.5 text-xs font-bold">
          Draft (only visible locally)
        </span>
      )}
    </div>

    <div className={cn('flex flex-1 flex-col gap-3 p-5', lead && 'md:p-8 md:justify-center')}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
        <TypeBadge type={post.type} />
        {post.issue && <span>Issue #{post.issue}</span>}
        <span>{formatPostDate(post.date)}</span>
        <span aria-hidden>·</span>
        <span>{post.readingMinutes} min read</span>
      </div>
      <h3
        className={cn(
          'font-black leading-tight tracking-[-0.01em] group-hover:text-primary',
          lead ? 'text-2xl sm:text-3xl' : 'text-xl',
        )}
      >
        {post.title}
      </h3>
      {post.summary && (
        <p className={cn('text-muted-foreground', lead ? 'text-base sm:text-lg line-clamp-4' : 'text-sm line-clamp-3')}>
          {post.summary}
        </p>
      )}
      <p className="mt-auto pt-1 text-sm font-semibold">{post.authors.join(', ')}</p>
    </div>
  </Link>
);

export default PostCard;
