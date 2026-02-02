import { getDBClient } from "../configs/db";
import { getConversationId } from "../helpers/conversation";
import { throwDBError } from "../helpers/error.helper";
import { tryCatch } from "../helpers/tryCatch.helper";

export const getMyConversations = async (myId: string) => {
  const db = await getDBClient();

  const query = `SELECT DISTINCT ON (c.conversation_id) c.id, c.conversation_id, c.content, c.created_at,
   (to_jsonb(u) - 'password') AS participant,
    CASE 
        WHEN c.from = $1 THEN 'me'
        ELSE 'them'
        END as sender
    FROM conversation c
    LEFT JOIN users u ON (u.id = 
    CASE
        WHEN c.from = $1 THEN c.to
        ELSE c.from
        END
    )
    WHERE c.to = $1 OR c.from = $1
    ORDER BY c.conversation_id, c.created_at DESC`;

  const params = [myId];

  const promise = db.query(query, params);
  const [result, error] = await tryCatch(promise);
  if (error) throwDBError("Failed to fetch conversations");

  return result.rows;
};

export const getAllMessages = async (
  participant_id: string,
  user_id: string,
) => {
  const db = await getDBClient();

  const conversation_id = getConversationId(user_id, participant_id);

  const query = `SELECT c.id, c.conversation_id, c.content, c.status, c.created_at,
    CASE
      WHEN c.from = $2 THEN 'me'
      ELSE 'them'
    END as sender
    FROM conversation c
  WHERE c.conversation_id = $1
  
  `;

  const params = [conversation_id, user_id];

  const promise = db.query(query, params);
  const [result, error] = await tryCatch(promise);

  if (error) throwDBError("Unable to get messages");

  return result.rows;
};
