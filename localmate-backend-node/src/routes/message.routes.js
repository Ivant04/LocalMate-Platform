const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /api/v1/messages/:conversationId
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return res.json(messages || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Clear all messages
const handleClearAll = async (req, res) => {
  try {
    const count = await Message.countDocuments();
    await Message.deleteMany({});
    return res.json({ message: 'All messages have been deleted', deletedCount: count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
router.delete('/clear-all', handleClearAll);
router.post('/clear-all', handleClearAll);
router.get('/clear-all', handleClearAll);

// POST /api/v1/messages
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.createdAt) {
      data.createdAt = new Date();
    }

    if (!data.messageType || !data.messageType.trim()) {
      if (data.latitude != null && data.longitude != null) {
        data.messageType = 'LOCATION';
      } else if (data.imgAttachment && data.imgAttachment.trim()) {
        data.messageType = 'IMAGE';
      } else {
        data.messageType = 'TEXT';
      }
    }

    const msg = new Message(data);
    const saved = await msg.save();

    // If socket server is active, emit message to room
    const io = req.app.get('io');
    if (io && data.conversationId) {
      io.to(data.conversationId).emit('new_message', saved);
    }

    return res.json(saved);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/v1/messages/auto-reply
router.post('/auto-reply', async (req, res) => {
  try {
    const { conversationId = 'sarah', text = 'Sounds wonderful! Let me know if you need any recommendations in advance. 😊' } = req.body;

    const reply = new Message({
      conversationId,
      senderId: conversationId,
      receiverId: 'me',
      content: text,
      isRead: false,
      createdAt: new Date(),
      messageType: 'TEXT',
    });

    const saved = await reply.save();

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', saved);
    }

    return res.json(saved);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
