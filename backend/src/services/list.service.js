import { List } from '../models/List.js';
import { ListItem } from '../models/ListItem.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { getOrCacheMovieByTmdbId } from './movie.service.js';

const syncListMeta = async (listId) => {
  const [total, firstFour] = await Promise.all([
    ListItem.countDocuments({ list: listId }),
    ListItem.find({ list: listId })
      .sort({ addedAt: 1 })
      .limit(4)
      .populate('movie', 'posterPath')
      .lean(),
  ]);

  const previewPosters = firstFour
    .map((item) => item.movie?.posterPath)
    .filter(Boolean);

  await List.findByIdAndUpdate(listId, {
    $set: { itemsCount: total, previewPosters },
  });
};

export const createList = async (ownerId, { title, description, isPublic }) => {
  return List.create({ owner: ownerId, title, description, isPublic });
};

export const getMyLists = async (ownerId, tmdbId = null) => {
  const lists = await List.find({ owner: ownerId }).sort({ updatedAt: -1 }).lean();

  if (!tmdbId || lists.length === 0) {
    return lists;
  }

  const numericId = Number(tmdbId);
  const matchingItems = await ListItem.find({
    list: { $in: lists.map((l) => l._id) },
    tmdbId: numericId,
  })
    .select('list')
    .lean();

  const containingSet = new Set(matchingItems.map((i) => i.list.toString()));
  return lists.map((l) => ({
    ...l,
    containsMovie: containingSet.has(l._id.toString()),
  }));
};

export const getUserLists = async (username, viewerId) => {
  const user = await User.findOne({ username: username.toLowerCase() }).select('_id');
  if (!user) throw new ApiError(404, 'User not found');

  const isOwner = user._id.equals(viewerId);
  const query = isOwner ? { owner: user._id } : { owner: user._id, isPublic: true };

  return List.find(query).sort({ updatedAt: -1 }).lean();
};

export const getListDetail = async (listId, viewerId, page = 1, limit = 24) => {
  const list = await List.findById(listId)
    .populate('owner', 'username displayName avatarUrl')
    .lean();

  if (!list) throw new ApiError(404, 'List not found');

  const isOwner = list.owner._id.toString() === viewerId.toString();
  if (!list.isPublic && !isOwner) {
    throw new ApiError(403, 'This list is private');
  }

  const safeLimit = Math.min(Math.max(limit, 1), 60);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    ListItem.find({ list: listId })
      .sort({ addedAt: 1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('movie', 'tmdbId mediaType title posterPath releaseYear runtime isAnime')
      .lean(),
    ListItem.countDocuments({ list: listId }),
  ]);

  return {
    list,
    isOwner,
    items: items.filter((i) => i.movie),
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    totalResults: total,
  };
};

export const updateList = async (ownerId, listId, updates) => {
  const list = await List.findById(listId);
  if (!list) throw new ApiError(404, 'List not found');
  if (!list.owner.equals(ownerId)) {
    throw new ApiError(403, 'You can only edit your own lists');
  }

  if (updates.title !== undefined) list.title = updates.title;
  if (updates.description !== undefined) list.description = updates.description;
  if (updates.isPublic !== undefined) list.isPublic = updates.isPublic;
  await list.save();

  return list;
};

export const deleteList = async (ownerId, listId) => {
  const list = await List.findById(listId);
  if (!list) throw new ApiError(404, 'List not found');
  if (!list.owner.equals(ownerId)) {
    throw new ApiError(403, 'You can only delete your own lists');
  }

  await Promise.all([List.deleteOne({ _id: listId }), ListItem.deleteMany({ list: listId })]);
  return { deleted: true };
};

export const addMovieToList = async (ownerId, listId, { tmdbId, mediaType = 'movie', note }) => {
  const list = await List.findById(listId);
  if (!list) throw new ApiError(404, 'List not found');
  if (!list.owner.equals(ownerId)) {
    throw new ApiError(403, 'You can only modify your own lists');
  }

  const { movie } = await getOrCacheMovieByTmdbId(tmdbId, mediaType);

  const item = await ListItem.findOneAndUpdate(
    { list: list._id, movie: movie._id },
    {
      $set: { note: note || '' },
      $setOnInsert: {
        list: list._id,
        movie: movie._id,
        tmdbId: movie.tmdbId,
        addedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).populate('movie', 'tmdbId title posterPath releaseYear runtime');

  await syncListMeta(list._id);
  return item;
};

export const removeMovieFromList = async (ownerId, listId, tmdbId) => {
  const list = await List.findById(listId);
  if (!list) throw new ApiError(404, 'List not found');
  if (!list.owner.equals(ownerId)) {
    throw new ApiError(403, 'You can only modify your own lists');
  }

  const numericId = Number(tmdbId);
  await ListItem.deleteOne({ list: list._id, tmdbId: numericId });
  await syncListMeta(list._id);

  return { removed: true, tmdbId: numericId };
};
