"use client";

import { ChatContext, type ConversationItem } from "@/context/ChatContext";
import React, { useContext, useState } from "react";
import { Star, Clock, ClockIcon as ClockRewind, History } from "lucide-react";

interface ChatItem extends ConversationItem {
  conversation_id: string;
  conversation_name: string;
  type?: string;
  is_star?: boolean;
  message_text?: string;
}

type WordByWordProps = {
  text: string;
};

function ChatHistory() {
  const { setConversationID, conversation_id, conversations } =
    useContext(ChatContext);
  const [visibleChats, setVisibleChats] = useState<number>(3);

  const WordByWord = ({ text }: WordByWordProps) => {
    const words = text.split("");
    return (
      <>
        {words.map((char, i) => (
          <span
            key={i}
            className="animate-fade-in-right"
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </>
    );
  };

  const renderChatItem = (chat: ChatItem, index: number, label: string) => {
    const isFirstToday = label === "Today" && index === 0;
    const isAnimated = isFirstToday && conversation_id == conversation_id;

    const isStarred = !!conversations.starred.find(
      (c: ConversationItem) => c.conversation_id === chat.conversation_id
    );

    return (
      <div
        className={`flex items-center justify-center px-4 py-2 rounded-md mb-1 text-sm border border-gray-300 shadow-sm text-gray-800 w-[calc(100%-20px)] cursor-pointer ${
          conversation_id == chat.conversation_id ? "bg-[#efefef]" : "bg-white"
        }`}
        key={chat.conversation_id}
        onClick={() => {
          setConversationID(chat.conversation_id);
        }}
      >
        <div className="flex-1 truncate">
          {isAnimated ? (
            <span className="truncate inline-block max-w-[160px]">
              <WordByWord text={chat.conversation_name || "New Chat"} />
            </span>
          ) : (
            <span className="truncate inline-block max-w-[160px]">
              {chat.conversation_name || "New Chat"}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {isStarred && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      </div>
    );
  };

  const renderChatSection = (chats: ConversationItem[], label: string) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4 mt-2 pl-1">
        <div className="flex items-center mb-1">
          {label === "Today" && (
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
          )}
          {label === "Yesterday" && (
            <ClockRewind className="h-4 w-4 mr-2 text-gray-500" />
          )}
          {label === "Previous 7 Days" && (
            <History className="h-4 w-4 mr-2 text-gray-500" />
          )}
          {label === "Starred" && (
            <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
          )}
          <h3 className="text-xs font-medium text-gray-500 uppercase">
            {label}
          </h3>
        </div>

        <div className="space-y-1 flex flex-col items-center gap-1">
          {chats
            .slice(0, visibleChats)
            .map((chat, index) =>
              renderChatItem(chat as ChatItem, index, label)
            )}
        </div>

        {visibleChats < chats.length && (
          <button
            className="w-full mt-1 text-xs text-gray-500 cursor-pointer"
            onClick={() => {
              setVisibleChats((prevVisibleChats) => prevVisibleChats + 3);
            }}
          >
            Load More
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#FAFAFA]">
      {renderChatSection(conversations.starred, "Starred")}
      {renderChatSection(conversations.today, "Today")}
      {renderChatSection(conversations.yesterday, "Yesterday")}
      {/* {renderChatSection(conversations.previous_7_days, "Previous 7 Days")} */}
    </div>
  );
}

export default ChatHistory;
