import { ChatContext } from "@/context/ChatContext";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import Image from "next/image";

interface UploadFilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// type FolderItem = {
//   id: string;
//   name: string;
//   created_at: string;
//   updated_at: string;
//   owner: string;
//   parent_id: string | null;
// };

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

const FileModal: React.FC<UploadFilePopupProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  // const [folders, setFolders] = useState<FolderItem[]>([]);
  // const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const currentFolderId = null;
  // const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  // const [fileError, setFileError] = useState<string | null>(null);

  const { GetFile, DeleteFile, DownloadFile } = useContext(ChatContext);

  const fetchFilesAndFolders = useCallback(async () => {
    // setIsLoadingFiles(true);
    // setFileError(null);

    try {
      const response = await GetFile(currentFolderId, 1, 100);
      // setFolders([]);
      setFiles([]);

      // const collectedFolders: FolderItem[] = [];
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

      const parseItems = (items: unknown[]) => {
        items.forEach((item) => {
          const typedItem = item as FileSystemItem;
          if (
            typedItem.type == "folder" &&
            typedItem.id !== "root" &&
            currentFolderId !== typedItem.id
          ) {
            // collectedFolders.push({
            //   id: typedItem.id,
            //   name: typedItem.name,
            //   created_at: typedItem.created_at || new Date().toISOString(),
            //   updated_at: typedItem.updated_at || new Date().toISOString(),
            //   owner: typedItem.updated_by || "",
            //   parent_id: parentId,
            // });
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
            parseItems(typedItem.children);
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

      // setFolders(collectedFolders);
      setFiles(collectedFiles);
    } catch (err) {
      // setFileError("Failed to load files.");
      console.error("Error fetching files and folders:", err);
    } finally {
      // setIsLoadingFiles(false);
    }
  }, [GetFile, currentFolderId]);

  useEffect(() => {
    fetchFilesAndFolders();
  }, [fetchFilesAndFolders]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#606060] bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Uploaded Files</h2>
          <button onClick={onClose}>
            <Image
              src="/close.svg"
              alt="Close"
              className="w-4 h-4"
              width={10}
              height={10}
            />
          </button>
        </div>
        <div className="space-y-3">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border-b pb-2"
            >
              <span className="text-sm text-gray-800">
                Section {idx + 1}: {file.filename}
              </span>

              {/* Actions */}
              <div className="flex space-x-3">
                <button onClick={() => DownloadFile(file)}>
                  <Download className="w-4 h-4 text-gray-700 hover:text-black" />
                </button>
                <button
                  onClick={async () => {
                    const response = await DeleteFile(file.id, false);
                    if (response.status) {
                      fetchFilesAndFolders();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-gray-700 hover:text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileModal;
