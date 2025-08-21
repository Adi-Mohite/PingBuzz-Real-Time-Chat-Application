import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ciphertext: {
      type: String,
      required: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    senderPublicKey: {
      type: String,
      required: true,
    },
    receiverPublicKey: { // ✅ NEW FIELD
      type: String,
      required: true,
    },
    image: {
      type: String, // Optional image field if needed
    },
  },
  { timestamps: true }
);

// ✅ THIS is what creates the actual model used in your controller
const Message = mongoose.model("Message", messageSchema);

export default Message;
