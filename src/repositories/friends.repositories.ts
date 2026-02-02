import { getDBClient } from "../configs/db";
import { throwDBError, throwGraphQLError } from "../helpers/error.helper";
import { tryCatch } from "../helpers/tryCatch.helper";

export const addFriendRequest = async (userId1: string, userId2: string) => {
  const db = await getDBClient();

  // Check if a friend request already exists between the two users
  const requestExistsQuery =
    "SELECT * FROM friends WHERE user_id1 = $1 AND user_id2 = $2";

  const requestExistsValues = [userId1, userId2];

  const [existingRequestResult, existingRequestError] = await tryCatch(
    db.query(requestExistsQuery, requestExistsValues),
  );

  if (existingRequestError)
    throwGraphQLError("Request already sent", "BAD_REQUEST");

  // send friend request
  const query =
    "INSERT INTO friends (user_id1, user_id2, status) VALUES ($1, $2, $3) RETURNING *";

  const values = [userId1, userId2, false];

  const promise = db.query(query, values);

  const [result, error] = await tryCatch(promise);

  if (error) throwDBError("could not send friend request");

  return result.rows[0];
};

export const getFriendRequestById = async (requestId: string) => {
  const db = await getDBClient();

  const query = "SELECT * FROM friends WHERE id = $1";

  const values = [requestId];

  const promise = db.query(query, values);

  const [result, error] = await tryCatch(promise);

  if (error) throwDBError("Failed to fetch friend request");

  return result.rows[0];
};

export const updateFriendRequestStatus = async (
  requestId: string,
  status: string,
) => {
  const db = await getDBClient();
  if (status === "rejected") {
    const query = "DELETE FROM friends WHERE id = $1";

    const values = [requestId];

    const promise = db.query(query, values);

    const [result, error] = await tryCatch(promise);

    if (error) throwDBError("Failed to cancel the request.");

    return "Friend request rejected";
  } else if (status === "accepted") {
    const query =
      "UPDATE friends SET status = $1, updated_at = NOW() WHERE id = $2";

    const values = [true, requestId];

    const promise = db.query(query, values);

    const [result, error] = await tryCatch(promise);

    if (error) throwDBError("Failed to accept the request.");

    return "Friend request accepted";
  }

  throwGraphQLError("Invalid friend request status", "INVALID_STATUS");
};

export const getMyPendingFriendRequests = async (userId: string) => {
  const db = await getDBClient();

  const query = `SELECT
    f.id,
    f.user_id1,
    f.status,
    f.created_at,
    (to_jsonb(u) - 'password') AS from
    FROM friends f
    LEFT JOIN users u ON f.user_id1 = u.id
    WHERE f.user_id2 = $1
    AND f.status = $2;`;

  const values = [userId, false];

  const promise = db.query(query, values);

  const [result, error] = await tryCatch(promise);

  if (error) throwDBError("Failed to fetch friend requests");

  return result.rows;
};

export const getMyFriends = async (userId: string) => {
  const db = await getDBClient();

  const query = `
  SELECT u.id, u.username, u.email, u.created_at, u.updated_at FROM friends f
  JOIN users u ON (u.id = 
  CASE
    WHEN f.user_id1 = $1 THEN f.user_id2
    ELSE f.user_id1
  END
  )
  WHERE (user_id1 = $1 OR user_id2 = $1) AND status = true`;
  const values = [userId];

  const promise = db.query(query, values);

  const [result, error] = await tryCatch(promise);

  if (error) throwDBError("Failed to fetch friends");

  return result.rows;
};

export const unFriend = async (userId: string, friendId: string) => {
  const db = await getDBClient();

  const query = `DELETE FROM friends f WHERE (f.user_id1 = $1 OR f.user_id2 = $1) AND (f.user_id1 = $2 OR f.user_id2 = $2)`;
  const values = [userId, friendId];

  const promise = db.query(query, values);

  const [result, error] = await tryCatch(promise);

  if (error) throwDBError("Unable to unfriend");

  return "Unfriended successfully";
};
