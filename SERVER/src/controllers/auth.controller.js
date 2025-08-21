import cloudnary from "../lib/cloudnary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullName, email, password, publicKey, encryptedPrivateKey } =
    req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be atleast 6 Characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email Already Exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName,
      email: email,
      password: hashedpassword,
      publicKey,
      encryptedPrivateKey,
    });

    if (newUser) {
      //generate jwt token
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        publicKey: newUser.publicKey,
        encryptedPrivateKey: newUser.encryptedPrivateKey,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup Controller", error.message);
    res.status(500).json({ message: "Internal server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const isPasswordcorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordcorrect) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      publicKey: user.publicKey,
      encryptedPrivateKey: user.encryptedPrivateKey, // 👈 Add this
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out Successfully" });
  } catch (error) {
    console.log("Error in logging out controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "profile pic is required" });
    }
    const uploadResponse = await cloudnary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in  update profile", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("publicKey");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ publicKey: user.publicKey });
  } catch (error) {
    console.log("Error in getPublicKey controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
