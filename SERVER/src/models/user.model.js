import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    encryptedPrivateKey: {
      type: String, // 👈 Encrypted + base64'd + JSON stringified
    },
    publicKey: {
      type: String, // 👈 Add this line to store E2EE public key
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
