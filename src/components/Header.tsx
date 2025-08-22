"use client";

import React, { useContext, useState } from "react";
import Profile from "./Profile";
import { ChatContext } from "@/context/ChatContext";
import FileModal from "./FileModal";
import { FolderClosed } from "lucide-react";
import { AuthContext } from "@/context/AuthContext";

function Header() {
  const [showfiles, setShowFiles] = useState(false);

  const { setConversationID, setMessages } = useContext(ChatContext);

  const { UserData } = useContext(AuthContext);

  return (
    <div className="flex overflow-hidden gap-0.5">
      <div className="w-1/4 bg-white overflow-y-auto p-3 flex flex-row items-center justify-between">
        <div className="">
          <h4 className="text-[22px] font-medium">Conversations</h4>
          <span className="text-[13px] text-[#8e8e8e]">Teams Eko.AI 1.0.1</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="bg-[#5B5FC7] text-white w-[80px] h-[30px] rounded-md text-[14px] font-medium cursor-pointer"
            onClick={() => {
              setConversationID("");
              setMessages([]);
            }}
          >
            + New
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white overflow-y-auto p-3 flex flex-row items-center justify-between">
        <div className="flex flex-row items-center justify-between gap-2">
          <Profile name={UserData?.user_name ?? undefined} />
          <div>
            <h4 className="text-[15px] font-semibold">{UserData?.user_name}</h4>
            <span className="text-[12px]">
              Chat ({UserData?.user_name == "" ? "Connecting..." : "Connected"})
            </span>
          </div>
        </div>
        <div
          onClick={() => {
            setShowFiles(true);
          }}
        >
          <FolderClosed />
        </div>
      </div>

      {showfiles && (
        <FileModal
          isOpen={showfiles}
          onClose={() => {
            setShowFiles(false);
          }}
        />
      )}
    </div>
  );
}

export default Header;
