const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * @desc    Get all conversations for the logged-in user
 * @route   GET /api/chat/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Map conversations to include unreadCount of messages sent by other users
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          read: false,
        });
        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all messages in a conversation
 * @route   GET /api/chat/messages/:conversationId
 * @access  Private (Participants only)
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation',
      });
    }

    // Get messages sorted by creation time
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark unread messages from other users as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false,
      },
      { read: true }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new conversation or return existing one
 * @route   POST /api/chat/conversations
 * @access  Private
 */
const createConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required',
      });
    }

    // Prevent creating conversation with self
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a conversation with yourself',
      });
    }

    // Check if conversation already exists between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    }).populate('participants', 'name email avatar isOnline lastSeen');

    if (conversation) {
      return res.status(200).json({
        success: true,
        conversation,
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [req.user._id, recipientId],
    });

    // Populate participants before returning
    conversation = await Conversation.findById(conversation._id).populate(
      'participants',
      'name email avatar isOnline lastSeen'
    );

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, getMessages, createConversation };
