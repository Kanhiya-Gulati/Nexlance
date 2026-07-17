import api from './api';

/**
 * Chat Service
 * API methods for managing conversations and messages.
 * Backend routes are mounted at /api/chat/
 */

/**
 * Get all conversations for the current user.
 * Backend returns: { success, conversations: [...] }
 */
export const getConversations = async () => {
  const res = await api.get('/chat/conversations');
  return res.data;
};

/**
 * Get all messages for a specific conversation.
 * Backend returns: { success, messages: [...] }
 * @param {string} conversationId
 */
export const getMessages = async (conversationId) => {
  const res = await api.get(`/chat/messages/${conversationId}`);
  return res.data;
};

/**
 * Create a new conversation with another user (or return existing one).
 * Backend expects: { recipientId }
 * Backend returns: { success, conversation }
 * @param {string} recipientId - The other user's ID
 */
export const createConversation = async (recipientId) => {
  const res = await api.post('/chat/conversations', { recipientId });
  return res.data;
};

/**
 * Upload a file attachment for a chat message.
 * Backend expects multipart/form-data with field name 'file'.
 * Backend returns: { success, fileUrl, fileName, fileType }
 * @param {FormData} formData - The FormData object with file field
 */
export const uploadFile = async (formData) => {
  const res = await api.post('/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
