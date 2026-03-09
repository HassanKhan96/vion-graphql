import { getDBClient } from "../configs/db";
import { throwDBError } from "../helpers/error.helper";
import { tryCatch } from "../helpers/tryCatch.helper";

export const getMyConversations = async (myId: string) => {
  const db = await getDBClient();

  const query = `
    SELECT 
     cp.id,
     cp.conversation_id,
     cp.user_id,
     cp.role,
     cp.joined_at as created_at,
     (
      SELECT COUNT(*)::int
      FROM messages unread_messages
      WHERE unread_messages.conversation_id = cp.conversation_id
        AND unread_messages.sender_id != $1
        AND unread_messages.status != 'read'
     ) AS unread_count,
     cp.last_read_message_id,
     cp.mute_until,
     cp2.user_id AS other_user_id,
     u.username AS username,
     u.avatar_url AS avatar_url,
     m.id AS last_message_id, 
     m.sender_id AS last_message_sender_id,
     m.status AS last_message_status,
     m.content AS last_message, 
     m.created_at AS last_message_at
    FROM conversation_participants cp
    JOIN conversation_participants cp2 ON cp2.conversation_id = cp.conversation_id AND cp2.user_id != $1
    JOIN users u ON u.id = cp2.user_id
    LEFT JOIN messages m ON m.id = 
    ( SELECT id FROM messages WHERE conversation_id = cp.conversation_id ORDER BY created_at DESC LIMIT 1 )
    WHERE cp.user_id = $1
`;

  const params = [myId];

  const promise = db.query(query, params);
  const [result, error] = await tryCatch(promise);
  if (error) {
    console.log(error);
    throwDBError("Failed to fetch conversations");
  }

  return result.rows;
};

export const getAllMessages = async (
  conversation_id: string,
  user_id: string,
  limit: number,
  before: string | null,
) => {
  const db = await getDBClient();
  const safeLimit = Math.min(Math.max(limit || 15, 1), 50);

  const query = `
  SELECT 
   m.id, 
   m.conversation_id,
   m.sender_id, 
   m.content, 
  m.status, 
  m.created_at,
  CASE
    WHEN m.sender_id = $4 THEN 'me'
    ELSE 'them'
  END AS sender
  FROM messages m
  WHERE m.conversation_id = $1
    AND ($3::timestamptz IS NULL OR m.created_at < $3::timestamptz)
  ORDER BY m.created_at DESC
  LIMIT $2
  `;

  const params = [conversation_id, safeLimit, before, user_id];

  const promise = db.query(query, params);
  const [result, error] = await tryCatch(promise);

  if (error) {
    console.log(error);
    throwDBError("Unable to get messages");
  }

  return result.rows.reverse();
};

export const deleteConversationForUser = async (
  conversation_id: string,
  user_id: string,
) => {
  const db = await getDBClient();

  const [beginResult, beginError] = await tryCatch(db.query("BEGIN"));
  if (beginError) {
    throwDBError("Unable to delete conversation");
  }

  const [deleteParticipantResult, deleteParticipantError] = await tryCatch(
    db.query(
      `
      DELETE FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2
      RETURNING conversation_id
      `,
      [conversation_id, user_id],
    ),
  );

  if (deleteParticipantError) {
    await db.query("ROLLBACK").catch(() => null);
    throwDBError("Unable to delete conversation");
  }

  if (!deleteParticipantResult.rowCount) {
    await db.query("ROLLBACK").catch(() => null);
    return false;
  }

  const [participantsResult, participantsError] = await tryCatch(
    db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM conversation_participants
      WHERE conversation_id = $1
      `,
      [conversation_id],
    ),
  );

  if (participantsError) {
    await db.query("ROLLBACK").catch(() => null);
    throwDBError("Unable to delete conversation");
  }

  const remainingParticipants = participantsResult.rows[0]?.count ?? 0;

  if (remainingParticipants === 0) {
    const [deleteMessagesResult, deleteMessagesError] = await tryCatch(
      db.query("DELETE FROM messages WHERE conversation_id = $1", [
        conversation_id,
      ]),
    );
    if (deleteMessagesError) {
      await db.query("ROLLBACK").catch(() => null);
      throwDBError("Unable to delete conversation");
    }

    const [deleteConversationResult, deleteConversationError] = await tryCatch(
      db.query("DELETE FROM conversations WHERE id = $1", [conversation_id]),
    );
    if (deleteConversationError) {
      await db.query("ROLLBACK").catch(() => null);
      throwDBError("Unable to delete conversation");
    }
  }

  const [commitResult, commitError] = await tryCatch(db.query("COMMIT"));
  if (commitError) {
    await db.query("ROLLBACK").catch(() => null);
    throwDBError("Unable to delete conversation");
  }

  return true;
};
