// import mongoose from 'mongoose';

// const castMemberSchema = new mongoose.Schema(
//   {
//     tmdbPersonId: { type: Number },
//     name: { type: String, required: true },
//     character: { type: String, default: '' },
//     profilePath: { type: String, default: '' },
//   },
//   { _id: false }
// );

// const movieSchema = new mongoose.Schema(
//   {
//     tmdbId: {
//       type: Number,
//       required: true,
//       unique: true,
//     },
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     tagline: {
//       type: String,
//       default: '',
//     },
//     posterPath: {
//       type: String,
//       default: '',
//     },
//     backdropPath: {
//       type: String,
//       default: '',
//     },
//     releaseDate: {
//       type: String,
//       default: '',
//     },
//     releaseYear: {
//       type: Number,
//       default: null,
//     },
//     runtime: {
//       type: Number,
//       default: null,
//     },
//     genres: {
//       type: [String],
//       default: [],
//     },
//     overview: {
//       type: String,
//       default: '',
//     },
//     director: {
//       type: String,
//       default: '',
//     },
//     cast: {
//       type: [castMemberSchema],
//       default: [],
//     },
//     trailerKey: {
//       type: String,
//       default: '',
//     },
//     verdictCounts: {
//       skip: { type: Number, default: 0, min: 0 },
//       casual: { type: Number, default: 0, min: 0 },
//       recommended: { type: Number, default: 0, min: 0 },
//       masterpiece: { type: Number, default: 0, min: 0 },
//     },
//     totalVotes: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     cachedAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { timestamps: true }
// );

// export const Movie = mongoose.model('Movie', movieSchema);


import mongoose from 'mongoose';

const castMemberSchema = new mongoose.Schema(
  {
    tmdbPersonId: { type: Number },
    name: { type: String, required: true },
    character: { type: String, default: '' },
    profilePath: { type: String, default: '' },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    // TMDB movie IDs and TV IDs overlap, so a title is unique by (tmdbId + mediaType).
    // See the compound unique index below.
    tmdbId: {
      type: Number,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['movie', 'tv'],
      default: 'movie',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    posterPath: {
      type: String,
      default: '',
    },
    backdropPath: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: String,
      default: '',
    },
    releaseYear: {
      type: Number,
      default: null,
    },
    // Movies: total runtime. TV: typical episode runtime.
    runtime: {
      type: Number,
      default: null,
    },
    genres: {
      type: [String],
      default: [],
    },
    overview: {
      type: String,
      default: '',
    },
    director: {
      type: String,
      default: '',
    },
    // TV only
    creators: {
      type: [String],
      default: [],
    },
    numberOfSeasons: {
      type: Number,
      default: null,
    },
    numberOfEpisodes: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      default: '',
    },
    originalLanguage: {
      type: String,
      default: '',
    },
    isAnime: {
      type: Boolean,
      default: false,
    },
    cast: {
      type: [castMemberSchema],
      default: [],
    },
    trailerKey: {
      type: String,
      default: '',
    },
    verdictCounts: {
      skip: { type: Number, default: 0, min: 0 },
      casual: { type: Number, default: 0, min: 0 },
      recommended: { type: Number, default: 0, min: 0 },
      masterpiece: { type: Number, default: 0, min: 0 },
    },
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    cachedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

movieSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });

export const Movie = mongoose.model('Movie', movieSchema);