// "use client";

// import {
//   createContext,
//   useMemo,
//   useState,
//   type ReactNode,
//   type Dispatch,
//   type SetStateAction,
//   useEffect,
//   useCallback,
// } from "react";
// import axios from "axios";
// import { APIcallFunction } from "./APIFunction";

// interface ApiResponse<T = unknown> {
//   status: number;
//   data?: T;
//   error?: { msg?: string };
// }

// export type ConversationItem = {
//   id?: string | number;
//   title?: string;
//   // Allow extra fields coming from API without using `any`
//   [key: string]: unknown;
// };

// export type ConversationsType = {
//   today: ConversationItem[];
//   yesterday: ConversationItem[];
//   previous_7_days: ConversationItem[];
//   starred: ConversationItem[];
// };

// export type ChatHistoryResponse =
//   | { status: 1; data: ConversationsType }
//   | { status: 0; msg: string };

// interface UploadedFileResponse {
//   id: string;
//   filename: string;
//   file_path: string;
//   mime_type: string;
//   file_size: number;
//   user_id: string;
// }

// export type FileUploadResponse = {
//   status: number;
//   msg: string;
//   // data: T[];
//   data: UploadedFileResponse[];
// };

// interface ChatContextType {
//   Chathistorylist: (
//     username: string,
//     appid: string
//   ) => Promise<ChatHistoryResponse>;
//   setConversationID: Dispatch<SetStateAction<string>>;
//   conversation_id: string;
//   setMessages: Dispatch<SetStateAction<Message[]>>;
//   messages: Message[];
//   conversations: ConversationsType;
//   GetFile: (
//     id: string | null,
//     page: number,
//     limit: number
//   ) => Promise<{ status: number; data: unknown[] | unknown; msg: string }>;
//   FileUpload: (
//     data: FormData | Blob | Record<string, unknown>
//   ) => Promise<{ status: number; msg: string; data: unknown[] }>;
//   DeleteFile: (
//     id: string,
//     isFolder: boolean
//   ) => Promise<{ status: number; msg: string }>;
//   DownloadFile: (file: {
//     id: string;
//     filename: string;
//   }) => Promise<{ status: number; msg: string }>;
// }

// export interface ConversationResult {
//   conversation_id: string;
//   messages: Array<{
//     message_id: number;
//     sender: string;
//     message: string;
//     token_cost: number;
//     token_count: number;
//     metadata: {
//       model_name: string;
//       persona: string;
//     };
//   }>;
// }

// export interface Message {
//   id: number;
//   source: "User" | "AI" | string;
//   message: string;
//   token_cost?: number;
//   token_count?: number;
//   model?: string;
//   assistant_type?: string;
//   app_id?: string;
//   date?: string;
// }

// const CONSTANTS = {
//   MAX_MESSAGES_TO_FORMAT: 10,
//   DEFAULT_TEMPERATURE: 0,
//   DEFAULT_K_VALUE: 3,
//   DEFAULT_PERSONA: "general",
//   ERROR_MESSAGE: "Something went wrong. Please try again shortly.",
//   NEW_CHAT_ROUTES: [
//     "/dashboard/new-chat/new",
//     "dashboard/my-apps/app-chat/new",
//     "/dashboard/doc-chat/new",
//     "/dashboard/excel-chat/new",
//   ],
//   REPO_ID_REGEX: /RepoIds:\s*([a-fA-F0-9]+)\.?\s*/,
//   RESPONSE_REGEX: /\<Response\>:\s*(.*)$/,
// } as const;

// export const ChatContext = createContext<ChatContextType>({
//   Chathistorylist: async () => ({ status: 0, msg: "Function not implemented" }),
//   setConversationID: (() => undefined) as unknown as Dispatch<
//     SetStateAction<string>
//   >, // placeholder
//   conversation_id: "",
//   setMessages: (() => undefined) as unknown as Dispatch<
//     SetStateAction<Message[]>
//   >, // placeholder
//   messages: [],
//   conversations: {
//     today: [],
//     yesterday: [],
//     previous_7_days: [],
//     starred: [],
//   },
//   GetFile: async () => ({
//     status: 0,
//     data: [],
//     msg: "Function not implemented",
//   }),
//   FileUpload: async () => ({
//     status: 0,
//     msg: "Function not implemented",
//     data: [],
//   }),
//   DeleteFile: async () => ({ status: 0, msg: "Function not implemented" }),
//   DownloadFile: async () => ({ status: 0, msg: "" }),
// });

// interface APIContextProviderProps {
//   children: ReactNode;
// }

// /** ----------------------
//  * Provider
//  * ---------------------- */
// const ChatContextProvider = ({ children }: APIContextProviderProps) => {
//   const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? ""}`;

//   // Ensure API call function instance is stable across renders
//   // const apicall = useMemo(() => APIcallFunction(), []);
//   const apicall = useMemo(() => APIcallFunction<ApiResponse>(), []);

//   const [conversation_id, setConversationID] = useState<string>("");
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [conversations, setConversations] = useState<ConversationsType>({
//     today: [],
//     yesterday: [],
//     previous_7_days: [],
//     starred: [],
//   });

//   /** CSRF token getter (stable) */
//   const getCSRFtoken = useCallback(async (): Promise<string | undefined> => {
//     try {
//       const response = await axios.get<{ csrf_token: string }>(
//         `${url}/v1/get-csrf-token`
//       );
//       return response.data.csrf_token;
//     } catch (err) {
//       console.error("Error in CSRF Token", err);
//       return undefined;
//     }
//   }, [url]);

//   /** Chat history list (stable) */
//   const Chathistorylist = useCallback(
//     async (username: string, appid: string): Promise<ChatHistoryResponse> => {
//       const newcsrf = await getCSRFtoken();
//       const conversation_url =
//         appid === ""
//           ? `v1/user/${username}/conversations`
//           : `v2/conversations/${appid}`;

//       const response = await apicall(conversation_url, "get", {
//         "Content-Type": "application/json",
//         ...(newcsrf ? { "X-CSRF-Token": newcsrf } : {}),
//       });

//       const conv = response?.data?.result?.conversations as
//         | ConversationsType
//         | undefined;

//       if (conv) {
//         setConversations({
//           today: conv.today ?? [],
//           yesterday: conv.yesterday ?? [],
//           previous_7_days: conv.previous_7_days ?? [],
//           starred: conv.starred ?? [],
//         });
//         return { status: 1, data: conv };
//       }

//       setConversations({
//         today: [],
//         yesterday: [],
//         previous_7_days: [],
//         starred: [],
//       });
//       return {
//         status: 0,
//         msg: response?.data?.error?.msg ?? "Unable to fetch conversations",
//       };
//     },
//     [getCSRFtoken, apicall]
//   );

//   /** Conversation history fetcher (stable) */
//   const ConversationHistory = useCallback(async () => {
//     const isNewChat = messages.length === 0;
//     if (isNewChat) {
//       setMessages([]);
//     }
//     try {
//       const csrfToken = await getCSRFtoken();
//       const response = await apicall(
//         `v1/conversation_by_conversation_id?conversation_id=${conversation_id}`,
//         "post",
//         {
//           "Content-Type": "application/json",
//           ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
//         }
//       );

//       const result = response?.data?.result as ConversationResult | undefined;

//       if (response?.status === 1 && result && result.messages.length > 0) {
//         if (isNewChat) setMessages([]);

//         const conversationMessages: Message[] = result.messages.map((msg) => ({
//           id: msg.message_id,
//           source: msg.sender === "user" ? "User" : "AI",
//           message: msg.message.includes(CONSTANTS.ERROR_MESSAGE)
//             ? CONSTANTS.ERROR_MESSAGE
//             : msg.message,
//           token_cost: msg.token_cost,
//           token_count: msg.token_count,
//           model: msg.metadata.model_name,
//           assistant_type: "knowledge_Based",
//           app_id: "534dcbe8694011f0a2026a872321dae9",
//         }));

//         // last message metadata (guarded)
//         // const lastMeta = result.messages[result.messages.length - 1]?.metadata;
//         // const _metadataObj = {
//         //   engine: "False",
//         //   model: lastMeta?.model_name ?? "",
//         //   persona: lastMeta?.persona ?? CONSTANTS.DEFAULT_PERSONA,
//         //   temp: CONSTANTS.DEFAULT_TEMPERATURE,
//         //   k: 1,
//         //   id: Number(result.conversation_id),
//         // };

//         setMessages(conversationMessages);
//       }
//     } catch (error) {
//       console.error("Error fetching chat history:", error);
//       if (isNewChat) setMessages([]);
//     }
//   }, [messages.length, conversation_id, getCSRFtoken, apicall]);

//   useEffect(() => {
//     // example values kept from original snippet
//     void Chathistorylist("echo_add_ins", "534dcbe8694011f0a2026a872321dae9");
//     void ConversationHistory();
//   }, [conversation_id, Chathistorylist, ConversationHistory]);

//   /** Helpers */
//   const buildQueryString = useCallback((params: Record<string, unknown>) => {
//     const esc = encodeURIComponent;
//     return Object.entries(params)
//       .filter(([, v]) => v !== undefined && v !== null && v !== "")
//       .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
//       .join("&");
//   }, []);

//   /** Files API */
//   const GetFile = useCallback(
//     async (id: string | null = null, page: number, limit: number) => {
//       try {
//         const csrf = await getCSRFtoken();
//         const endpoint =
//           id == null
//             ? `v2/file-manager/user/file-system?${buildQueryString({
//                 page,
//                 page_size: limit,
//               })}`
//             : `v2/file-manager/user/${id}/tree?${buildQueryString({
//                 page,
//                 page_size: limit,
//               })}`;

//         const response = await apicall(`${endpoint}`, "get", {
//           accept: "application/json",
//           "Content-Type": "application/json",
//           ...(csrf ? { "X-CSRF-Token": csrf } : {}),
//         });

//         if (!id && response?.status && response?.data?.result)
//           return {
//             status: 1,
//             data: response.data.result as unknown[],
//             msg: "",
//           };
//         else if (id && response?.status && response?.data?.result)
//           return {
//             status: 1,
//             data: [response.data.result] as unknown[],
//             msg: "",
//           };
//         return { status: 0, data: [], msg: "No data found" };
//       } catch (err) {
//         console.error("Error while Fetching Files", err);
//         return { status: 0, data: [], msg: "Error while Fetching Files" };
//       }
//     },
//     [apicall, buildQueryString, getCSRFtoken]
//   );

//   const FileUpload = useCallback(
//     async (
//       data: FormData | Blob | Record<string, unknown>
//     ): Promise<FileUploadResponse> => {
//       try {
//         const csrf = await getCSRFtoken();
//         const response = await apicall(
//           `v2/file-manager/files`,
//           "post",
//           {
//             ...(csrf ? { "X-CSRF-Token": csrf } : {}),
//             Accept: "application/json",
//           },
//           data
//         );
//         if (response?.status)
//           return {
//             status: 1,
//             msg: "File Uploaded Successfully!",
//             data: (response?.data?.results ?? []) as UploadedFileResponse[],
//           };
//         return { status: 0, msg: "Error While Uploading the file", data: [] };
//       } catch (err) {
//         console.error("Error While Uploading the file: ", err);
//         return { status: 0, msg: String(err), data: [] };
//       }
//     },
//     [apicall, getCSRFtoken]
//   );

//   const DeleteFile = useCallback(
//     async (id: string, isFolder: boolean) => {
//       try {
//         const csrf = await getCSRFtoken();
//         const endpoint = `v2/file-manager/${
//           !isFolder ? "files" : "folders"
//         }/${id}`;
//         await apicall(endpoint, "delete", {
//           ...(csrf ? { "X-CSRF-Token": csrf } : {}),
//           Accept: "application/json",
//         });
//         return { status: 1, msg: "" };
//       } catch (err) {
//         console.error(
//           `Error while Deleting the ${
//             isFolder ? "Folder" : "File"
//           } of id: ${id}`,
//           err
//         );
//         return {
//           status: 0,
//           msg: `Error while Deleting the ${
//             isFolder ? "Folder" : "File"
//           } of id: ${id}`,
//         };
//       }
//     },
//     [apicall, getCSRFtoken]
//   );

//   const DownloadFile = useCallback(
//     async (file: { id: string; filename: string }) => {
//       try {
//         const csrf = await getCSRFtoken();
//         const blob: Blob = await apicall(
//           `v2/file-manager/files/${file.id}/download`,
//           "get",
//           {
//             ...(csrf ? { "X-CSRF-Token": csrf } : {}),
//             Accept: "application/json",
//           },
//           "",
//           "",
//           true
//         );
//         const downloadURL = URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = downloadURL;
//         link.download = file.filename;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(downloadURL);
//         return { status: 1, msg: "" };
//       } catch (err) {
//         console.error("Error while Downloading the File", err);
//         return { status: 0, msg: "Error while Downloading the File" };
//       }
//     },
//     [apicall, getCSRFtoken]
//   );

//   /**
//    * Memoized context value
//    */
//   const ChatContextValue = useMemo<ChatContextType>(
//     () => ({
//       Chathistorylist,
//       setConversationID,
//       conversation_id,
//       setMessages,
//       messages,
//       conversations,
//       GetFile,
//       FileUpload,
//       DeleteFile,
//       DownloadFile,
//     }),
//     [
//       Chathistorylist,
//       conversation_id,
//       messages,
//       conversations,
//       GetFile,
//       FileUpload,
//       DeleteFile,
//       DownloadFile,
//     ]
//   );

//   return (
//     <ChatContext.Provider value={ChatContextValue}>
//       {children}
//     </ChatContext.Provider>
//   );
// };

// export default ChatContextProvider;

"use client";

import {
  createContext,
  useMemo,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { APIcallFunction } from "./APIFunction";

/** ----------------------
 * Shared API response type
 * ---------------------- */
export interface ApiResponse<T = unknown> {
  status: number;
  data?: T;
  error?: { msg?: string };
}

/** ----------------------
 * Types
 * ---------------------- */
export type ConversationItem = {
  id?: string | number;
  title?: string;
  [key: string]: unknown; // allow extra fields
};

export type ConversationsType = {
  today: ConversationItem[];
  yesterday: ConversationItem[];
  previous_7_days: ConversationItem[];
  starred: ConversationItem[];
};

export type ChatHistoryResponse =
  | { status: 1; data: ConversationsType }
  | { status: 0; msg: string };

interface UploadedFileResponse {
  id: string;
  filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  user_id: string;
}

export type FileUploadResponse = {
  status: number;
  msg: string;
  data: UploadedFileResponse[];
};

interface ChatContextType {
  Chathistorylist: (
    username: string,
    appid: string
  ) => Promise<ChatHistoryResponse>;
  setConversationID: Dispatch<SetStateAction<string>>;
  conversation_id: string;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  messages: Message[];
  conversations: ConversationsType;
  GetFile: (
    id: string | null,
    page: number,
    limit: number
  ) => Promise<{ status: number; data: unknown[] | unknown; msg: string }>;
  FileUpload: (
    data: FormData | Blob | Record<string, unknown>
  ) => Promise<FileUploadResponse>;
  DeleteFile: (
    id: string,
    isFolder: boolean
  ) => Promise<{ status: number; msg: string }>;
  DownloadFile: (file: {
    id: string;
    filename: string;
  }) => Promise<{ status: number; msg: string }>;
}

export interface ConversationResult {
  conversation_id: string;
  messages: Array<{
    message_id: number;
    sender: string;
    message: string;
    token_cost: number;
    token_count: number;
    metadata: {
      model_name: string;
      persona: string;
    };
  }>;
}

export interface Message {
  id: number;
  source: "User" | "AI" | string;
  message: string;
  token_cost?: number;
  token_count?: number;
  model?: string;
  assistant_type?: string;
  app_id?: string;
  date?: string;
}

const CONSTANTS = {
  MAX_MESSAGES_TO_FORMAT: 10,
  DEFAULT_TEMPERATURE: 0,
  DEFAULT_K_VALUE: 3,
  DEFAULT_PERSONA: "general",
  ERROR_MESSAGE: "Something went wrong. Please try again shortly.",
  NEW_CHAT_ROUTES: [
    "/dashboard/new-chat/new",
    "dashboard/my-apps/app-chat/new",
    "/dashboard/doc-chat/new",
    "/dashboard/excel-chat/new",
  ],
  REPO_ID_REGEX: /RepoIds:\s*([a-fA-F0-9]+)\.?\s*/,
  RESPONSE_REGEX: /\<Response\>:\s*(.*)$/,
} as const;

/** ----------------------
 * Context
 * ---------------------- */
export const ChatContext = createContext<ChatContextType>({
  Chathistorylist: async () => ({ status: 0, msg: "Function not implemented" }),
  setConversationID: (() => undefined) as unknown as Dispatch<
    SetStateAction<string>
  >,
  conversation_id: "",
  setMessages: (() => undefined) as unknown as Dispatch<
    SetStateAction<Message[]>
  >,
  messages: [],
  conversations: {
    today: [],
    yesterday: [],
    previous_7_days: [],
    starred: [],
  },
  GetFile: async () => ({
    status: 0,
    data: [],
    msg: "Function not implemented",
  }),
  FileUpload: async () => ({
    status: 0,
    msg: "Function not implemented",
    data: [],
  }),
  DeleteFile: async () => ({ status: 0, msg: "Function not implemented" }),
  DownloadFile: async () => ({ status: 0, msg: "" }),
});

interface APIContextProviderProps {
  children: ReactNode;
}

/** ----------------------
 * Provider
 * ---------------------- */
const ChatContextProvider = ({ children }: APIContextProviderProps) => {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? ""}`;

  /** ✅ Corrected: call APIcallFunction() */
  const apicall = useMemo(() => APIcallFunction(), []);

  const [conversation_id, setConversationID] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationsType>({
    today: [],
    yesterday: [],
    previous_7_days: [],
    starred: [],
  });

  /** CSRF token getter */
  const getCSRFtoken = useCallback(async (): Promise<string | undefined> => {
    try {
      const response = await axios.get<{ csrf_token: string }>(
        `${url}/v1/get-csrf-token`
      );
      return response.data.csrf_token;
    } catch (err) {
      console.error("Error in CSRF Token", err);
      return undefined;
    }
  }, [url]);

  /** Chat history list */
  const Chathistorylist = useCallback(
    async (username: string, appid: string): Promise<ChatHistoryResponse> => {
      const newcsrf = await getCSRFtoken();
      const conversation_url =
        appid === ""
          ? `v1/user/${username}/conversations`
          : `v2/conversations/${appid}`;

      const response = await apicall<
        ApiResponse<{ result?: { conversations?: ConversationsType } }>
      >(conversation_url, "get", {
        "Content-Type": "application/json",
        ...(newcsrf ? { "X-CSRF-Token": newcsrf } : {}),
      });

      const conv = response.data?.result?.conversations;

      if (conv) {
        setConversations({
          today: conv.today ?? [],
          yesterday: conv.yesterday ?? [],
          previous_7_days: conv.previous_7_days ?? [],
          starred: conv.starred ?? [],
        });
        return { status: 1, data: conv };
      }

      setConversations({
        today: [],
        yesterday: [],
        previous_7_days: [],
        starred: [],
      });
      return {
        status: 0,
        msg: response.error?.msg ?? "Unable to fetch conversations",
      };
    },
    [getCSRFtoken, apicall]
  );

  /** Conversation history fetcher */
  const ConversationHistory = useCallback(async () => {
    const isNewChat = messages.length === 0;
    if (isNewChat) {
      setMessages([]);
    }
    try {
      const csrfToken = await getCSRFtoken();
      const response = await apicall<
        ApiResponse<{ result?: ConversationResult }>
      >(
        `v1/conversation_by_conversation_id?conversation_id=${conversation_id}`,
        "post",
        {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        }
      );

      const result = response.data?.result;

      if (response.status === 1 && result && result.messages.length > 0) {
        if (isNewChat) setMessages([]);

        const conversationMessages: Message[] = result.messages.map((msg) => ({
          id: msg.message_id,
          source: msg.sender === "user" ? "User" : "AI",
          message: msg.message.includes(CONSTANTS.ERROR_MESSAGE)
            ? CONSTANTS.ERROR_MESSAGE
            : msg.message,
          token_cost: msg.token_cost,
          token_count: msg.token_count,
          model: msg.metadata.model_name,
          assistant_type: "knowledge_Based",
          app_id: "534dcbe8694011f0a2026a872321dae9",
        }));

        setMessages(conversationMessages);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      if (isNewChat) setMessages([]);
    }
  }, [messages.length, conversation_id, getCSRFtoken, apicall]);

  useEffect(() => {
    void Chathistorylist("echo_add_ins", "534dcbe8694011f0a2026a872321dae9");
    void ConversationHistory();
  }, [conversation_id, Chathistorylist, ConversationHistory]);

  /** Helpers */
  const buildQueryString = useCallback((params: Record<string, unknown>) => {
    const esc = encodeURIComponent;
    return Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
      .join("&");
  }, []);

  /** Files API */
  const GetFile = useCallback(
    async (id: string | null = null, page: number, limit: number) => {
      try {
        const csrf = await getCSRFtoken();
        const endpoint =
          id == null
            ? `v2/file-manager/user/file-system?${buildQueryString({
                page,
                page_size: limit,
              })}`
            : `v2/file-manager/user/${id}/tree?${buildQueryString({
                page,
                page_size: limit,
              })}`;

        const response = await apicall<ApiResponse<{ result?: unknown }>>(
          endpoint,
          "get",
          {
            accept: "application/json",
            "Content-Type": "application/json",
            ...(csrf ? { "X-CSRF-Token": csrf } : {}),
          }
        );

        if (!id && response?.status && response?.data?.result)
          return {
            status: 1,
            data: response.data.result as unknown[],
            msg: "",
          };
        else if (id && response?.status && response?.data?.result)
          return {
            status: 1,
            data: [response.data.result] as unknown[],
            msg: "",
          };
        return { status: 0, data: [], msg: "No data found" };
      } catch (err) {
        console.error("Error while Fetching Files", err);
        return { status: 0, data: [], msg: "Error while Fetching Files" };
      }
    },
    [apicall, buildQueryString, getCSRFtoken]
  );

  const FileUpload = useCallback(
    async (
      data: FormData | Blob | Record<string, unknown>
    ): Promise<FileUploadResponse> => {
      try {
        const csrf = await getCSRFtoken();
        const response = await apicall<
          ApiResponse<{ results?: UploadedFileResponse[] }>
        >(
          `v2/file-manager/files`,
          "post",
          {
            ...(csrf ? { "X-CSRF-Token": csrf } : {}),
            Accept: "application/json",
          },
          data
        );
        if (response?.status)
          return {
            status: 1,
            msg: "File Uploaded Successfully!",
            data: response?.data?.results ?? [],
          };
        return { status: 0, msg: "Error While Uploading the file", data: [] };
      } catch (err) {
        console.error("Error While Uploading the file: ", err);
        return { status: 0, msg: String(err), data: [] };
      }
    },
    [apicall, getCSRFtoken]
  );

  const DeleteFile = useCallback(
    async (id: string, isFolder: boolean) => {
      try {
        const csrf = await getCSRFtoken();
        const endpoint = `v2/file-manager/${
          !isFolder ? "files" : "folders"
        }/${id}`;
        await apicall<ApiResponse>(endpoint, "delete", {
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
          Accept: "application/json",
        });
        return { status: 1, msg: "" };
      } catch (err) {
        console.error(
          `Error while Deleting the ${
            isFolder ? "Folder" : "File"
          } of id: ${id}`,
          err
        );
        return {
          status: 0,
          msg: `Error while Deleting the ${
            isFolder ? "Folder" : "File"
          } of id: ${id}`,
        };
      }
    },
    [apicall, getCSRFtoken]
  );

  const DownloadFile = useCallback(
    async (file: { id: string; filename: string }) => {
      try {
        const csrf = await getCSRFtoken();
        const blob: Blob = await apicall(
          `v2/file-manager/files/${file.id}/download`,
          "get",
          {
            ...(csrf ? { "X-CSRF-Token": csrf } : {}),
            Accept: "application/json",
          },
          "",
          "",
          true
        );
        const downloadURL = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadURL;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadURL);
        return { status: 1, msg: "" };
      } catch (err) {
        console.error("Error while Downloading the File", err);
        return { status: 0, msg: "Error while Downloading the File" };
      }
    },
    [apicall, getCSRFtoken]
  );

  /** Memoized context value */
  const ChatContextValue = useMemo<ChatContextType>(
    () => ({
      Chathistorylist,
      setConversationID,
      conversation_id,
      setMessages,
      messages,
      conversations,
      GetFile,
      FileUpload,
      DeleteFile,
      DownloadFile,
    }),
    [
      Chathistorylist,
      conversation_id,
      messages,
      conversations,
      GetFile,
      FileUpload,
      DeleteFile,
      DownloadFile,
    ]
  );

  return (
    <ChatContext.Provider value={ChatContextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContextProvider;
