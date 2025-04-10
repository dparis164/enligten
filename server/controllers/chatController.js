const User = require("../models/User");
const Chat = require("../models/Chat");
const Profile = require("../models/Profile");

// Get all users for chat (excluding the current user)
exports.getChatUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email profilePicture")
      .lean();

    res.json(users);
  } catch (error) {
    console.error("Error fetching chat users:", error);
    res.status(500).json({ error: "Error fetching chat users" });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.json([]);
    }

    // Get the current user's profile to get following and followers lists
    const currentUserProfile = await Profile.findOne({ userId: req.user._id });
    if (!currentUserProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Get the combined list of following and followers
    const connections = [
      ...currentUserProfile.following,
      ...currentUserProfile.followers,
    ];
    // Remove duplicates
    const uniqueConnections = [
      ...new Set(connections.map((id) => id.toString())),
    ];

    // Find users who are either following or followers and match the search term
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        { _id: { $in: uniqueConnections } }, // Only include connected users
        {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
          ],
        },
      ],
    })
      .select("name email profilePicture")
      .limit(10)
      .lean();

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Error searching users" });
  }
};

// Get conversation history between two users
exports.getConversationHistory = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const chat = await Chat.findOne({
      $or: [
        { participants: [userId1, userId2] },
        { participants: [userId2, userId1] },
      ],
    }).populate("messages");

    res.json(chat?.messages || []);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Error fetching conversation" });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { content, receiverId, type } = req.body;
    const senderId = req.user._id;
    // console.log(req.body);

    // Find existing chat or create new one
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [senderId, receiverId],
        messages: [],
      });
    }

    // Create new message object
    const newMessage = {
      senderId,
      content,
      type,
      timestamp: new Date(),
    };

    // If there's a file, add file information
    if (req.file) {
      newMessage.fileUrl = `/uploads/chat/${req.file.filename}`;
      newMessage.fileName = req.file.originalname;
      newMessage.fileType = req.file.mimetype;
    }
    console.log(newMessage);
    // Add new message to chat
    chat.messages.push(newMessage);
    await chat.save();

    res.json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Error sending message" });
  }
};

// Start a chat with a partner
exports.startChatWithPartner = async (req, res) => {
  try {
    const { partnerId } = req.body;
    const userId = req.user._id;

    let chat = await Chat.findOne({
      $or: [
        { participants: [userId, partnerId] },
        { participants: [partnerId, userId] },
      ],
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, partnerId],
        messages: [],
      });
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    console.error("Error starting chat:", error);
    res.status(500).json({ error: "Error starting chat" });
  }
};

// Get all chats for a user
exports.getAllChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "name email profilePicture")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Error fetching chats" });
  }
};

// Get chats by match ID
exports.getChatsByMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const chats = await Chat.find({ matchId })
      .populate("participants", "name email profilePicture")
      .sort({ createdAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching match chats:", error);
    res.status(500).json({ error: "Error fetching match chats" });
  }
};
