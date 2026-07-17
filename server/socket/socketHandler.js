/**
 * @fileoverview Socket.IO Handler for NEXLANCE Freelance Marketplace
 *
 * Manages real-time WebSocket connections for:
 * - Online presence tracking (join / disconnect)
 * - Real-time messaging (sendMessage → receiveMessage)
 * - Typing indicators (typing / stopTyping)
 *
 * Uses an in-memory Map to associate userId → socketId for
 * targeted message delivery.
 *
 * @module socket/socketHandler
 */

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

/**
 * Map of online users: userId (string) → socketId (string)
 * @type {Map<string, string>}
 */
const onlineUsers = new Map();

/**
 * Sets up all Socket.IO event listeners on the given server instance.
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /**
     * 'join' event — Registers a user as online.
     * Stores the userId → socketId mapping, updates the User document,
     * and broadcasts the online status to all other clients.
     *
     * @param {string} userId - The MongoDB ObjectId of the joining user
     */
    socket.on('join', async (userId) => {
      try {
        // Store mapping
        onlineUsers.set(userId, socket.id);

        // Update user's online status in the database
        await User.findByIdAndUpdate(userId, { isOnline: true });

        // Broadcast to all other clients that this user is online
        socket.broadcast.emit('userOnline', userId);

        console.log(`✅ User ${userId} joined — Online users: ${onlineUsers.size}`);
      } catch (error) {
        console.error('Error in join event:', error.message);
      }
    });

    /**
     * 'sendMessage' event — Handles sending a chat message.
     * Creates a new Message document, updates the Conversation's lastMessage,
     * and delivers the message to the recipient in real time.
     *
     * @param {Object}  data                 - The message payload
     * @param {string}  data.conversationId  - The conversation this message belongs to
     * @param {string}  data.senderId        - The sender's user ID
     * @param {string}  data.recipientId     - The recipient's user ID
     * @param {string}  data.text            - The message body text
     */
    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, senderId, recipientId, content, fileUrl, fileName, fileType } = data;
        console.log(`💬 Message event: from ${senderId} to ${recipientId} in conv ${conversationId}`);
        console.log(`📡 Current online users map:`, Array.from(onlineUsers.keys()));

        // Persist the message in MongoDB
        const message = await Message.create({
          conversation: conversationId,
          sender: senderId,
          content: content || '',
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileType: fileType || null,
        });

        // Populate sender details for the response
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name avatar');

        // Update the conversation's lastMessage reference
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
        });

        // Deliver to the recipient if they are currently online
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          console.log(`✉️ Delivering message via socket to user ${recipientId} (socket: ${recipientSocketId})`);
          io.to(recipientSocketId).emit('receiveMessage', populatedMessage);
        } else {
          console.log(`⚠️ Recipient ${recipientId} is offline. Socket message not sent.`);
        }

        // Acknowledge back to the sender with the populated message
        socket.emit('receiveMessage', populatedMessage);
      } catch (error) {
        console.error('Error in sendMessage event:', error.message);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    /**
     * 'typing' event — Forwards typing indicator to the recipient.
     *
     * @param {Object} data              - Typing event payload
     * @param {string} data.recipientId  - Who should see the indicator
     * @param {string} data.senderId     - Who is typing
     * @param {string} data.conversationId - The active conversation
     */
    socket.on('typing', (data) => {
      const { recipientId, senderId, conversationId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('userTyping', {
          senderId,
          conversationId,
        });
      }
    });

    /**
     * 'stopTyping' event — Clears the typing indicator for the recipient.
     *
     * @param {Object} data              - Stop-typing event payload
     * @param {string} data.recipientId  - Who should clear the indicator
     * @param {string} data.senderId     - Who stopped typing
     * @param {string} data.conversationId - The active conversation
     */
    socket.on('stopTyping', (data) => {
      const { recipientId, senderId, conversationId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('userStopTyping', {
          senderId,
          conversationId,
        });
      }
    });

    /**
     * 'disconnect' event — Cleans up when a socket disconnects.
     * Removes the user from the onlineUsers map, sets isOnline=false
     * and lastSeen=now in the database, and broadcasts offline status.
     */
    socket.on('disconnect', async () => {
      try {
        // Find the userId associated with this socket
        let disconnectedUserId = null;
        for (const [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            break;
          }
        }

        if (disconnectedUserId) {
          // Remove from online users map
          onlineUsers.delete(disconnectedUserId);

          // Update user's status in the database
          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen: Date.now(),
          });

          // Broadcast to all clients that this user went offline
          socket.broadcast.emit('userOffline', disconnectedUserId);

          console.log(
            `❌ User ${disconnectedUserId} disconnected — Online users: ${onlineUsers.size}`
          );
        }
      } catch (error) {
        console.error('Error in disconnect event:', error.message);
      }
    });
  });
};

module.exports = setupSocket;
