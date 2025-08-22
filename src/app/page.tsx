"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import { authentication } from "@microsoft/teams-js";
import { initTeams } from "@/lib/teamsInit";
import { getEmailFromToken } from "@/lib/getEmailFromToken";
import ChatHistory from "@/components/ChatHistory";
import Header from "@/components/Header";
import ChatContextProvider from "@/context/ChatContext";
import ChatWindow from "@/components/ChatWindow";
// import Cookies from "js-cookie";
import { AuthContext } from "@/context/AuthContext";
import { encryptPassword } from "@/lib/encryption";
import { Storage } from "@/lib/storage";

export default function Home() {
  const [status, setStatus] = useState<{ message: string; code: number }>({
    message: "Initializing…",
    code: 0,
  });
  const [email, setEmail] = useState<string | null>(null);
  const { login, handleOTPEntered } = useContext(AuthContext);
  // const [tokenSnippet, setTokenSnippet] = useState<string | null>(null);

  const LoginHandler = useCallback(
    async (email: string) => {
      try {
        if (login && email) {
          const encryptedPassword = encryptPassword("bridgeai@1234");

          if (!encryptedPassword) {
            setStatus({
              message: "Issue in Password Encryption. Please Refresh the Page",
              code: 0,
            });
            return;
          }

          const resp = await login(email, encryptedPassword);

          if (resp?.status !== 1 && resp?.message !== "OK") {
            setStatus({
              message: resp?.message,
              code: 0,
            });
            return;
          }

          if (!handleOTPEntered) {
            setStatus({
              message: "Error while Accessing the handleOTPEntered",
              code: 0,
            });
            return;
          }

          const res = await handleOTPEntered("123456", email);

          if (res.status === 1 && res?.message === "OK") {
            setStatus({
              message: "Login Successfull",
              code: 1,
            });
            return;
          } else {
            alert("Here");
            setStatus({
              message: `Error while OTP Verification. Please Refresh Page: ${res.message}`,
              code: 0,
            });
            return;
          }
        } else {
          setStatus({
            message: "Issue in Login Handler. Please Refresh the Page",
            code: 0,
          });
        }
      } catch (err) {
        setStatus({
          message: `Issue in Login Handler: ${err}`,
          code: 0,
        });
      }
    },
    [login, handleOTPEntered]
  );

  // useEffect(() => {
  //   Storage.deleteBeforeExpiry("TeamsEko");
  // }, []);

  useEffect(() => {
    (async () => {
      const inTeams = await initTeams();
      if (!inTeams) {
        setStatus({
          message: "This page is not running inside Microsoft Teams.",
          code: 0,
        });
        LoginHandler("Demo@user.com");
        return;
      }

      // setStatus();
      setStatus({
        message: "Requesting silent ID token from Teams…",
        code: 0,
      });
      try {
        // Teams SSO – ID token for the signed-in Teams user
        const idToken = await authentication.getAuthToken();

        const emailParsed = getEmailFromToken(idToken);
        setEmail(emailParsed);

        // setTokenSnippet(idToken.slice(0, 20) + "…");

        if (emailParsed) {
          setStatus({
            message: "Success! Email extracted from ID token.",
            code: 0,
          });

          if (!Storage.get<string>("TeamsEko")) {
            LoginHandler(emailParsed);
          } else {
            setStatus({
              message: "Already Logged in.",
              code: 1,
            });
          }

          // if (!Cookies.get("TeamsEko")) {
          //   LoginHandler(emailParsed);
          // }
        } else {
          setStatus({
            message: "Token acquired, but no email claim found.",
            code: 0,
          });
        }
      } catch (error) {
        // Common reasons: SSO not enabled in manifest, AAD app misconfigured, user not signed in to Teams
        const message = error instanceof Error ? error.message : String(error);
        setStatus({
          message: `Failed to get token: ${message}`,
          code: 0,
        });
      }
    })();
  }, [LoginHandler]);

  if (!status.code) {
    return (
      <div className="flex flex-col h-screen gap-0.5">
        {status.message}: {email}
      </div>
    );
  }

  return (
    <ChatContextProvider>
      <div className="flex flex-col h-screen gap-0.5">
        <Header />
        <div className="flex flex-1 overflow-hidden gap-0.5">
          <div className="w-1/4 bg-white overflow-y-auto">
            <ChatHistory />
          </div>
          <div className="flex-1 bg-white overflow-y-auto p-4">
            <ChatWindow />
          </div>
        </div>
      </div>
    </ChatContextProvider>
  );

  // return <ChatWindow />;
}
