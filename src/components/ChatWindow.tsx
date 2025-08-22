"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Plus, Send } from "lucide-react";
import Profile from "./Profile";
import { useSendMessage } from "../context/useSendMessage";
import MarkdownMessage from "./MarkdownMessage";
import { ChatContext } from "@/context/ChatContext";
import ChatFileUploader from "./ChatFileUploader";

type FolderItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  owner: string;
  parent_id: string | null;
};

type FileItem = {
  id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  owner: string;
  is_folder: boolean;
  parent_id: string | null;
  status: string;
  file_path: string;
};

function ChatWindow() {
  const user = {
    name: "Yash Vashishtha",
  };
  const { messages, GetFile } = useContext(ChatContext);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [activeCommand, setActiveCommand] = useState("");
  const [isUpload, setIsUpload] = useState(false);

  const { sendMessage } = useSendMessage();

  const fetchFilesAndFolders = useCallback(async () => {
    setIsLoadingFiles(true);
    setFileError(null);

    try {
      const response = await GetFile(currentFolderId, 1, 100);
      setFolders([]);
      setFiles([]);

      const collectedFolders: FolderItem[] = [];
      const collectedFiles: FileItem[] = [];

      interface FileSystemItem {
        id: string;
        name: string;
        type: string;
        mime_type?: string;
        size?: number;
        created_at?: string;
        updated_at?: string;
        updated_by?: string;
        parent_id?: string;
        file_path?: string;
        children?: FileSystemItem[];
      }

      const parseItems = (items: unknown[], parentId: string | null = null) => {
        items.forEach((item) => {
          const typedItem = item as FileSystemItem;
          if (
            typedItem.type == "folder" &&
            typedItem.id !== "root" &&
            currentFolderId !== typedItem.id
          ) {
            collectedFolders.push({
              id: typedItem.id,
              name: typedItem.name,
              created_at: typedItem.created_at || new Date().toISOString(),
              updated_at: typedItem.updated_at || new Date().toISOString(),
              owner: typedItem.updated_by || "",
              parent_id: parentId,
            });
          } else if (
            typedItem.name !== "Root" &&
            typedItem.id !== "root" &&
            typedItem.type == "file"
          ) {
            collectedFiles.push({
              id: typedItem.id,
              filename: typedItem.name,
              mime_type: typedItem.mime_type || "file",
              file_size: typedItem.size || 0,
              created_at: typedItem.created_at || "",
              updated_at: typedItem.updated_by || "",
              owner: typedItem.updated_by || "",
              is_folder: false,
              parent_id: typedItem.parent_id || null,
              file_path: typedItem.file_path || `/${typedItem.name}`,
              status: "completed",
            });
          } else if (typedItem?.children?.length) {
            parseItems(typedItem.children, typedItem.id);
          }
        });
      };

      interface FileResponseData {
        tree?: { children: unknown[] };
        items?: unknown[];
      }

      if (currentFolderId) {
        const data = response.data as FileResponseData[];
        parseItems(data[0]?.tree?.children || []);
      } else {
        const data = response.data as FileResponseData;
        parseItems(data.items || []);
      }

      setFolders(collectedFolders);
      setFiles(collectedFiles);
    } catch (err) {
      setFileError("Failed to load files.");
      console.error("Error fetching files and folders:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [GetFile, currentFolderId]);

  const getPlainText = (): string => {
    if (!inputRef.current) return "";

    const clone = inputRef.current.cloneNode(true) as HTMLElement;
    const tokenSpans = clone.querySelectorAll(".token-span");

    tokenSpans.forEach((span) => {
      const type = span.getAttribute("data-type");
      const value = span.getAttribute("data-value") || "";
      const metadata = JSON.parse(span.getAttribute("data-metadata") || "{}");
      if (type === "file") {
        const filename = value;
        const filepath = metadata.path || `/${filename}`;
        const formattedText = `[filename: ${filename}. filepath: ${filepath}]`;
        const textNode = document.createTextNode(formattedText);
        span.parentNode?.replaceChild(textNode, span);
      } else {
        const textNode = document.createTextNode(value);
        span.parentNode?.replaceChild(textNode, span);
      }
    });

    return clone.textContent || "";
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      await handleSendMessage(e);
      if (inputRef.current) {
        inputRef.current.innerHTML = "";
        inputRef.current.dataset.empty = "true";
      }
      setInputValue("");
    }
  };

  const detectCommand = () => {
    const text = inputRef.current?.textContent || "";
    const fileMatch = text.match(/^\/file:$/);

    if (fileMatch) {
      setActiveCommand("file");
      setShowCommandMenu(true);
      fetchFilesAndFolders();
    } else {
      setShowCommandMenu(false);
      setActiveCommand("");
    }
  };

  const insertFileToken = (
    filename: string,
    metadata:
      | {
          fileId: string;
          path: string;
          mimeType: string;
          size: number;
          owner?: string;
        }
      | Record<string, unknown>
  ) => {
    if (!inputRef.current) return;

    const input = inputRef.current;
    const placeholder = document.createElement("span");
    placeholder.id = "file-token-placeholder";

    let replaced = false;

    const nodes = Array.from(input.childNodes);
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE && !replaced) {
        const textNode = node as Text;
        const text = textNode.textContent;

        if (text && text.includes("/file:")) {
          const index = text.indexOf("/file:");

          const beforeText = text.substring(0, index);
          const afterText = text.substring(index + 6);

          const beforeNode = document.createTextNode(beforeText);
          const afterNode = document.createTextNode(afterText);

          input.insertBefore(beforeNode, textNode);
          input.insertBefore(placeholder, textNode);
          input.insertBefore(afterNode, textNode);
          input.removeChild(textNode);

          replaced = true;
          break;
        }
      }
    }

    const token = document.createElement("span");
    token.className =
      "token-span inline-flex items-center gap-1 px-2 py-0.5 mr-1 rounded-md text-xs font-medium bg-green-200 text-green-800 border border-green-300";
    token.contentEditable = "false";
    token.setAttribute("data-type", "file");
    token.setAttribute("data-value", filename);
    token.setAttribute("data-metadata", JSON.stringify(metadata));
    token.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V7.5L14.5 2z"></path></svg> <span class="select-none">${filename}</span>`;

    const space = document.createTextNode(" ");

    const placeholderElement = document.getElementById(
      "file-token-placeholder"
    );
    if (placeholderElement && placeholderElement.parentNode) {
      placeholderElement.parentNode.replaceChild(token, placeholderElement);
      token.parentNode?.insertBefore(space, token.nextSibling);
    } else {
      input.appendChild(token);
      input.appendChild(space);
    }

    const sel = window.getSelection();
    const newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.collapse(true);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    setShowCommandMenu(false);
    setActiveCommand("");
    setInputValue(getPlainText());
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const text = el.textContent ?? "";
    el.dataset.empty = text.trim() === "" ? "true" : "false";
    const fileCommandMatch = text.match(/^\/file:(.+)/);
    if (fileCommandMatch) {
      const afterCommand = fileCommandMatch[1].trim();
      if (afterCommand.length > 0) {
        const newText = afterCommand;
        el.textContent = newText;
        setShowCommandMenu(false);
        setActiveCommand("");
      }
    }

    detectCommand();
    setInputValue(getPlainText());
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (value !== "") {
      await sendMessage(value);
      setInputValue("");
    }
  };

  useEffect(() => {
    if (inputValue.trim().endsWith("/file:")) {
      setActiveCommand("file");
      setShowCommandMenu(true);
      fetchFilesAndFolders();
    } else {
      setShowCommandMenu(false);
    }
  }, [inputValue, currentFolderId, fetchFilesAndFolders]);

  return (
    <div className="flex flex-col h-[100%]">
      {/* Message Area */}
      <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 space-y-2 mt-20">
            <p className="text-[20px]">Start a New Conversation</p>
            <span>Type a new message below to begin chatting</span>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div className="flex flex-col" key={idx}>
              {msg.source === "User" ? (
                <div key={idx} className="mb-4 max-w-[70%] ml-auto">
                  {/* Name and Timestamp */}
                  <div className="flex justify-between items-center mb-1 px-2 text-xs text-gray-500 gap-2">
                    <span className="font-medium">{user.name}</span>
                    <span>{msg.date}</span>
                  </div>

                  {/* Avatar and Message Bubble aligned to the right */}
                  <div className="flex justify-end items-start gap-2">
                    {/* Message Bubble */}
                    <Profile name={user.name} />
                    <div className="bg-[#E5E8FF] text-sm text-black px-3 py-2 rounded-lg shadow-sm">
                      {/* {msg.text} */}
                      <MarkdownMessage
                        content={msg.message}
                        name="user-message"
                        onTableDetect={() => {}}
                        setShowDocumentModal={() => {}}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={idx} className="mb-4 max-w-[70%] mr-auto">
                  {/* Name and Timestamp */}
                  <div className="flex items-center mb-1 px-2 text-xs text-gray-500 gap-2">
                    <Profile name="AI" />
                    <span className="font-medium">Eko.AI</span>
                  </div>

                  {/* Avatar and Message Bubble aligned to the left */}
                  <div className="flex items-start gap-2">
                    <div className="bg-[#F0F0F0] text-sm text-black px-3 py-2 rounded-lg shadow-sm">
                      <MarkdownMessage
                        content={msg.message}
                        name="ai-message"
                        onTableDetect={() => {}}
                        setShowDocumentModal={() => {}}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div
        className="flex items-center rounded-md px-3 py-2 shadow-sm w-full max-w-4xl mx-auto"
        style={{
          boxShadow: "0 1px 2px 0 #EBEBEB",
          border: "1px solid #EBEBEB",
        }}
      >
        {showCommandMenu && activeCommand === "file" && (
          <div className="absolute bg-white border shadow-md rounded-md z-10  max-h-60 overflow-auto mt-1 bottom-[70px]">
            {isLoadingFiles ? (
              <div className="p-2 text-sm text-gray-500">Loading files...</div>
            ) : fileError ? (
              <div className="p-2 text-sm text-red-500">{fileError}</div>
            ) : (
              <>
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    📁 {folder.name}
                  </div>
                ))}
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                    onClick={() =>
                      insertFileToken(file.filename, {
                        fileId: file.id,
                        path: file.file_path,
                        size: file.file_size,
                        mimeType: file.mime_type,
                      })
                    }
                  >
                    📄 {file.filename}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        <div
          ref={inputRef}
          contentEditable={true}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          //   onPaste={handlePaste}
          className={`flex-1 resize-none border-none outline-none focus:ring-0 placeholder-gray-400 text-sm ${
            false ? "pointer-events-none opacity-50" : ""
          }`}
          data-placeholder="Type a message or use / for commands"
          data-empty="true"
          suppressContentEditableWarning
          style={{
            lineHeight: "1.5",
            wordBreak: "break-word",
          }}
        />
        <div className="flex items-center gap-2 pl-2 text-gray-500">
          <button
            className="hover:text-black"
            onClick={() => setIsUpload(true)}
          >
            <Plus size={16} />
          </button>
          <div className="h-5 border-r" />
          <button className="hover:text-black" onClick={handleSendMessage}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {isUpload && (
        <ChatFileUploader
          isOpen={isUpload}
          onClose={() => {
            setIsUpload(false);
          }}
          insertFileToken={insertFileToken}
        />
      )}
    </div>
  );
}

export default ChatWindow;
