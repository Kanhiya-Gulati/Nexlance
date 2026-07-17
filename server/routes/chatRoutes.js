/**
 * @fileoverview Chat Routes for NEXLANCE Freelance Marketplace
 *
 * Defines routes for real-time chat functionality including
 * conversation management and message retrieval.
 *
 * @module routes/chatRoutes
 */

const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  createConversation,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/conversations', protect, getConversations);

/**
 * @route   GET /api/chat/messages/:conversationId
 * @desc    Get all messages for a specific conversation
 * @access  Private (must be a participant)
 */
router.get('/messages/:conversationId', protect, getMessages);

/**
 * @route   POST /api/chat/conversations
 * @desc    Create a new conversation between two users
 * @access  Private
 */
router.post('/conversations', protect, createConversation);

// Configure multer storage for chat attachments (images, PDFs, documents, etc. up to 10MB)
const multer = require('multer');
const path = require('path');

const chatStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `chat-${Date.now()}-${basename}${ext}`);
  },
});

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * @route   POST /api/chat/upload
 * @desc    Upload a file attachment (image, pdf, document) to uploads folder
 * @access  Private
 */
router.post('/upload', protect, chatUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Classify file type for UI rendering
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  }
});

module.exports = router;
