// Barrel file — re-exports the entire public API of the db module.
// Consumers can import from '@/services/db' for backward compatibility.

export { getDb, closeDb } from './connection';

export {
  type VideoStatusPayload,
  type PaginationResult,
  type HistoryStatusPayload,
  rowToHistoryItem,
  insertHistoryItem,
  findHistoryItemById,
  updateHistoryItem,
  updateHistoryImageSlot,
  findHistoryByUsername,
  getPaginatedHistoryForUser,
  getAllUsersHistoryPaginated,
  getHistoryItemStatus,
  deleteHistoryItemById,
  getRecentUploadsForUser,
  trackUserUpload,
} from './history.repository';

export {
  type FullUser,
  findUserByUsername,
  hashApiKey,
  findUserByApiKey,
  getAllUsersFromDb,
  createUserInDb,
  deleteUserFromDb,
  updateUserConfigInDb,
  setApiKeyForUserInDb,
} from './user.repository';
