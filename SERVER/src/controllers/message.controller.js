import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudnary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUser = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUser);
  } catch (error) {
    console.error("Error in getUserForSidebar", error.message);
    res.status(500).json({ error: " Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {

  
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;
    const message = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
    });

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in getMessage controller ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const sendMessage = async (req, res) => {
  try {
    const { ciphertext, nonce, senderPublicKey, receiverPublicKey, image } = req.body; // ✅ include receiverPublicKey
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!ciphertext || !nonce || !senderPublicKey || !receiverPublicKey) {
      return res.status(400).json({ error: "Missing encrypted data" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      ciphertext,
      nonce,
      senderPublicKey,
      receiverPublicKey, // ✅ save it
      image,
    });

    await newMessage.save();

    // Emit real-time message
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

