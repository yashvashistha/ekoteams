import { useContext } from "react";
import { ChatContext } from "./ChatContext";
import { Storage } from "@/lib/storage";
// import Cookies from "js-cookie";

const WEBSOCKET_BASE =
  "wss://ecoapilwebapp02-ash2f8e6fcgzexgq.centralindia-01.azurewebsites.net";
const RESPONSE_REGEX = /\<Response\>:\s*(.*)$/;

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function buildWebSocketUrl(conversationId, token) {
  return `${WEBSOCKET_BASE}/api/v2/ws/${conversationId}?token=${token}`;
}

function formatMessagesForPayload(messages) {
  const latestMessages = messages.slice(-10);
  return latestMessages
    .map((msg) => {
      if (msg.source === "User") return { user: msg.message };
      if (msg.source === "AI") return { assistant: msg.message };
      return null;
    })
    .filter((msg) => msg !== null);
}

export const useSendMessage = () => {
  const { messages, setMessages, conversation_id, setConversationID } =
    useContext(ChatContext);

  const sendMessage = async (message) => {
    try {
      // const userDetails = JSON.parse(Cookies.get("TeamsEko"));
      // const userDetails = JSON.parse(localStorage.getItem("TeamsEko"));
      const userDetails = JSON.parse(Storage.get < string > "TeamsEko");

      const token = `Bearer ${userDetails.access_token}`;
      if (!userDetails.access_token) {
        throw new Error("Missing token or session ID");
      }

      const now = new Date();
      const formattedDate = now.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      const userMessage = {
        id: messages.length + 1,
        source: "User",
        message,
        date: formattedDate,
      };
      setMessages((prev) => [...prev, userMessage]);

      const formattedMessages = formatMessagesForPayload(messages);

      const payload = {
        metadata: {
          persona: "general",
          model_name: "GPT-4o",
          streaming: true,
          assistant_type: "knowledge_Based",
          temperature: 0,
          k: 3,
        },
        message_text: message,
        messages: formattedMessages,
        app_id: "534dcbe8694011f0a2026a872321dae9",
        ...(conversation_id !== "" && { conversation_id }),
      };

      const socketUrl = buildWebSocketUrl(conversation_id || "new", token);
      const ws = new WebSocket(socketUrl);

      return await new Promise((resolve, reject) => {
        ws.onopen = () => {
          console.log("WebSocket connected");
          ws.send(JSON.stringify(payload));
        };

        ws.onmessage = (event) => {
          try {
            const chunk = JSON.parse(event.data);
            const match = chunk.match(RESPONSE_REGEX);
            if (!match) {
              console.warn("No match found in event.data");
              return;
            }
            const parsed = safeJsonParse(match[1].trim(), {});
            const result = parsed?.result;

            if (result?.conversation_id && conversation_id === "") {
              setConversationID(result.conversation_id);
            }

            if (result?.response) {
              const aiMessage = {
                id: messages.length + 1,
                source: "AI",
                message: result.response,
                date: formattedDate,
              };
              setMessages((prev) => [...prev, aiMessage]);
              resolve(result.response);
              ws.close();
            } else {
              console.warn("result.response not found in:", result);
            }
          } catch (e) {
            console.error("Failed to process chunk", e);
          }
        };

        ws.onerror = (err) => {
          console.error("WebSocket error", err);
          ws.close();
          reject("WebSocket error");
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
        };
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return "Oops, something went wrong.";
    }
  };

  return { sendMessage };
};
