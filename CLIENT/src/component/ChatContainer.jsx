import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./Skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getQuickReplies } from "../lib/quickReplies";
const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeToMessages,
    isAITyping,
    sendMessage,
  } = useChatStore();

  const [suggestions, setSuggestions] = useState([]);
  const [inputText, setInputText] = useState("");
  const { authUser, privateKey } = useAuthStore();
  const messageEndRef = useRef(null);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    if (!selectedUser?._id || !privateKey) return;
    getMessages(selectedUser._id);
  }, [selectedUser?._id, privateKey, getMessages]);

  useEffect(() => {
    if (!selectedUser?._id || !privateKey) return;

    subscribeToMessages(privateKey); // now only runs when key is ready
    return () => unsubscribeToMessages();
  }, [
    selectedUser?._id,
    privateKey,
    subscribeToMessages,
    unsubscribeToMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [suggestions, messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const shouldFetchSuggestions =
      selectedUser?._id !== "ai-bot" &&
      lastMessage.senderId !== authUser._id &&
      !!lastMessage.text &&
      lastMessage.text.trim() !== "";

    let timeout;

    if (shouldFetchSuggestions) {
      timeout = setTimeout(async () => {
        try {
          const quickReplies = await getQuickReplies({
            lastMessage,
            authUserId: authUser._id,
          });
          setSuggestions(quickReplies);
        } catch (error) {
          console.error("Quick Replies Error:", error);
        }
      }, 2000); // Delay of 2 seconds
    } else {
      setSuggestions([]);
    }

    return () => clearTimeout(timeout); // Clean up
  }, [messages]);

  if (isMessagesLoading)
    return (
      <div className="flex flex-1 flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/DefaultProfile.png"
                      : selectedUser.profilePic || "/DefaultProfile.png"
                  }
                  alt="Profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div
              className={`chat-bubble flex flex-col ${
                message.senderId === authUser._id
                  ? "bg-yellow-300 text-black"
                  : "bg-slate-800 text-white"
              }`}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text &&
                (message.senderId === "ai-bot" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="text-sm text-gray-700">{children}</p>
                      ),
                      code: ({ inline, children }) =>
                        inline ? (
                          <code className="bg-gray-700 text-xs px-1 rounded">
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-gray-700 p-2 rounded overflow-x-auto">
                            <code>{children}</code>
                          </pre>
                        ),
                      li: ({ children }) => (
                        <li className="list-disc ml-5">{children}</li>
                      ),
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <p>{message.text}</p>
                ))}
            </div>
          </div>
        ))}
        {selectedUser?._id === "ai-bot" && isAITyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img src="/AI BOT.png" alt="AI Avatar" />
              </div>
            </div>
            <div className="chat-bubble flex items-center gap-2 text-sm text-gray-700">
              <span>AI is typing</span>
              <span className="animate-ping text-xl">✨</span>
            </div>
          </div>
        )}

        {suggestions.length > 0 &&
          lastMessage?.senderId === selectedUser?._id && (
            <div className="flex gap-2 px-3 py-2 overflow-x-auto">
              {suggestions.map((text, idx) => (
                <button
                  key={idx}
                  className="bg-yellow-300 text-white hover:bg-yellow-500 px-4 py-1 rounded-full text-sm transition"
                  onClick={async () => {
                    setSuggestions([]);
                    try {
                      await sendMessage({ text, image: null });
                    } catch (err) {
                      console.error("Quick reply send failed:", err);
                    }
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
      </div>
      <MessageInput inputText={inputText} setInputText={setInputText} />
    </div>
  );
};

export default ChatContainer;
