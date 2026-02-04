import { getDBClient } from "../configs/db";
import { getConversationId } from "../helpers/conversation";
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
     cp.last_read_message_id,
     cp.mute_until,
     cp2.user_id AS other_user_id,
     u.username AS username,
     m.id AS last_message_id, 
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
) => {
  const db = await getDBClient();

  const query = `SELECT m.id, m.conversation_id, m.content, m.status, m.created_at,
    CASE
      WHEN m.sender_id = $2 THEN 'me'
      ELSE 'them'
    END as sender
    FROM messages m
  WHERE m.conversation_id = $1
  
  `;

  const params = [conversation_id, user_id];

  const promise = db.query(query, params);
  const [result, error] = await tryCatch(promise);

  if (error) {
    console.log(error);
    throwDBError("Unable to get messages");
  }

  return result.rows;
};
