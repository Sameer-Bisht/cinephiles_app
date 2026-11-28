import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import { getPosterUrl } from '../utils/tmdb';

export function MovieCard({ movie }) {
  const posterUrl = getPosterUrl(movie.posterPath, 'w342');
  const mediaType = movie.mediaType || 'movie';
  const badgeLabel = movie.isAnime ? 'Anime' : mediaType === 'tv' ? 'TV' : null;

  return (
    <Link
      to={`/title/${mediaType}/${movie.tmdbId}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/40 transition hover:border-teal-500/60 hover:bg-zinc-900"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-600">
            <Film className="h-8 w-8" />
            <span className="text-xs">No Poster</span>
          </div>
        )}
        {badgeLabel && (
          <span className="absolute left-2 top-2 rounded-md bg-teal-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {badgeLabel}
          </span>
        )}
        {movie.releaseYear && (
          <span className="absolute right-2 top-2 rounded-md bg-black/75 px-2 py-0.5 text-xs font-medium text-zinc-200 backdrop-blur-sm">
            {movie.releaseYear}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100 group-hover:text-teal-300">
          {movie.title}
        </h3>
      </div>
    </Link>
  );
}
