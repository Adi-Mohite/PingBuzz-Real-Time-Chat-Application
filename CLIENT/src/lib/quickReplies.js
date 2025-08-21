import { axiosInstance } from "./axios";

export const getQuickReplies = async ({ lastMessage, authUserId }) => {
  try {
    const res = await axiosInstance.post("/ai/quick-replies", {
      lastMessage,
      authUserId,
    });
    return res.data.suggestions;
  } catch (err) {
    console.error("Quick Replies Fetch Error:", err.message || err);
    return [];
  }
};
