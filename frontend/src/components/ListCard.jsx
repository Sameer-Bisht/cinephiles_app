import { Link } from 'react-router-dom';
import { Film, Globe, Lock } from 'lucide-react';
import { getPosterUrl } from '../utils/tmdb';

export function ListCard({ list }) {
  const posters = list.previewPosters || [];

  return (
    <Link
      to={`/lists/${list._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 transition hover:border-violet-500/60 hover:bg-zinc-900"
    >
      {/* 4-poster collage */}
      <div className="grid h-36 grid-cols-4 gap-0.5 bg-zinc-950">
        {Array.from({ length: 4 }).map((_, idx) => {
          const posterPath = posters[idx];
          const url = posterPath ? getPosterUrl(posterPath, 'w185') : null;
          return (
            <div key={idx} className="h-full w-full overflow-hidden bg-zinc-900/80">
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-800">
                  <Film className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 space-y-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-white group-hover:text-violet-300">
              {list.title}
            </h3>
            {list.isPublic ? (
              <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-500" title="Public" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" title="Private" />
            )}
          </div>
          {list.description && (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{list.description}</p>
          )}
        </div>

        <p className="text-xs text-zinc-500">
          {list.itemsCount} {list.itemsCount === 1 ? 'film' : 'films'}
        </p>
      </div>
    </Link>
  );
}
