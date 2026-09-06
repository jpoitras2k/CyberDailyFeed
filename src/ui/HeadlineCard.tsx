import { formatRelativeTime } from "../core/freshness";
import type { Headline } from "../core/types";
import { openOriginalArticle } from "../platform/openLink";
import { TagChip } from "./TagChip";

interface HeadlineCardProps {
  headline: Headline;
  now: Date;
}

export function HeadlineCard({ headline, now }: HeadlineCardProps) {
  return (
    <article className="headline">
      <button
        type="button"
        className="headline-hit"
        onClick={() => void openOriginalArticle(headline.url)}
      >
        <div className="headline-meta">
          <span className="source-mark" data-source={headline.sourceId}>
            {headline.sourceName}
          </span>
          <time dateTime={headline.publishedAt}>
            {formatRelativeTime(headline.publishedAt, now)}
          </time>
        </div>
        <h2>{headline.title}</h2>
      </button>
      {headline.categories.length > 0 ? (
        <div className="headline-tags">
          {headline.categories.map((category) => (
            <TagChip key={category} category={category} />
          ))}
        </div>
      ) : null}
      <a
        className="headline-link"
        href={headline.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open original
      </a>
    </article>
  );
}
