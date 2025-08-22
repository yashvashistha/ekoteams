// import { Storage } from "@/lib/storage";
// import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
// // import Cookies from "js-cookie";

// // User details interface for type safety
// interface UserDetails {
//   user_name: string;
//   user_role: string;
//   designation: string;
//   user_login_id: string;
//   access_token: string;
//   refresh_token: string;
//   api_key?: string;
//   user_uuid: string;
//   email_id: string;
//   department: string;
//   location: string;
// }

// const reqBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// // Use a function to create a new AbortController per request (avoid global state)
// const createAbortController = () => new AbortController();

// type APIMethod = "get" | "post" | "put" | "delete" | "patch";

// // Helper: Get and parse user details from cookies
// const getUserDetails = (): UserDetails | null => {
//   const userDetails = Storage.get<string>("TeamsEko");
//   // const userDetails = localStorage.getItem("TeamsEko");
//   // const userDetails = Cookies.get("TeamsEko");
//   if (!userDetails) return null;
//   try {
//     return JSON.parse(userDetails) as UserDetails;
//   } catch {
//     return null;
//   }
// };

// // Helper: Save user details to cookies with correct expiry
// const saveUserDetails = (details: UserDetails) => {
//   Storage.set("TeamsEko", JSON.stringify(details), 15);
//   // localStorage.setItem("TeamsEko", JSON.stringify(details));
//   // Cookies.set("TeamsEko", JSON.stringify(details), {
//   //   expires: 15 / 1440,
//   // });
// };

// // Helper: Refresh access token using refresh token
// const refreshAccessToken = async (
//   refreshToken: string,
//   csrfToken?: string
// ): Promise<UserDetails> => {
//   const config: AxiosRequestConfig = {
//     method: "post",
//     maxBodyLength: Number.POSITIVE_INFINITY,
//     url: `${reqBaseUrl}/v1/refresh_token`,
//     headers: {
//       accept: "application/json",
//       "Content-Type": "application/json",
//       ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
//     },
//     data: { token: refreshToken },
//   };
//   const response = await axios.request<any>(config);
//   return response.data.data.result as UserDetails;
// };

// // Main API call function
// export const APIcallFunction = () => {
//   return async (
//     endpoint: string,
//     method: APIMethod,
//     headers: Record<string, string>,
//     data?: any,
//     body?: any, // Unused, consider removing if not needed
//     blob = false
//   ): Promise<any> => {
//     const controller = createAbortController();
//     const signal = controller.signal;
//     const url = `${reqBaseUrl}/${endpoint}`;

//     // Clone headers to avoid mutating input
//     const requestHeaders = { ...headers };

//     // Attach Authorization header if user is logged in and not on login endpoint
//     const userDetails = getUserDetails();
//     if (endpoint !== "login" && userDetails) {
//       requestHeaders.Authorization = `Bearer ${userDetails.access_token}`;
//     }
//     console.log(userDetails);
//     const config: AxiosRequestConfig = {
//       method,
//       maxBodyLength: Number.POSITIVE_INFINITY,
//       url,
//       headers: requestHeaders,
//       data,
//       signal,
//       ...(blob ? { responseType: "blob" as const } : {}),
//     };

//     try {
//       const response: AxiosResponse = await axios.request(config);
//       return response.data;
//     } catch (error: any) {
//       // Handle token expiration or invalid credentials
//       console.log(error.response.data.detail);
//       const isAuthError =
//         error.response?.data?.detail === "Could not validate credentials" ||
//         error.message === "Request failed with status code 403";

//       if (isAuthError && userDetails) {
//         try {
//           // Attempt to refresh token
//           const refreshedDetails = await refreshAccessToken(
//             userDetails.refresh_token,
//             headers["X-CSRF-Token"]
//           );

//           // Merge new tokens with existing user details
//           const newUserDetails: UserDetails = {
//             ...userDetails,
//             ...refreshedDetails,
//           };
//           saveUserDetails(newUserDetails);

//           // Retry original request with new access token
//           const retryHeaders = {
//             ...requestHeaders,
//             Authorization: `Bearer ${refreshedDetails.access_token}`,
//           };
//           const retryConfig: AxiosRequestConfig = {
//             ...config,
//             headers: retryHeaders,
//           };
//           const retryResponse: AxiosResponse = await axios.request(retryConfig);
//           return retryResponse.data;
//         } catch (refreshError) {
//           // Token refresh failed, handle logout for non-admin users
//           throw refreshError;
//         }
//       }
//       throw error;
//     }
//   };
// };

// // Abort API call utility
// export const AbortAPI = (): boolean => {
//   // This function is now a no-op, as each request has its own controller.
//   // To abort a request, keep a reference to the controller returned by createAbortController.
//   // For backward compatibility, we log and return false.
//   console.warn(
//     "AbortAPI: No global controller to abort. Refactor to use per-request controller."
//   );
//   return false;
// };

import { Storage } from "@/lib/storage";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// User details interface for type safety
interface UserDetails {
  user_name: string;
  user_role: string;
  designation: string;
  user_login_id: string;
  access_token: string;
  refresh_token: string;
  api_key?: string;
  user_uuid: string;
  email_id: string;
  department: string;
  location: string;
}

const reqBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// Use a function to create a new AbortController per request (avoid global state)
const createAbortController = () => new AbortController();

type APIMethod = "get" | "post" | "put" | "delete" | "patch";

// Helper: Get and parse user details from storage
const getUserDetails = (): UserDetails | null => {
  const userDetails = Storage.get<string>("TeamsEko");
  if (!userDetails) return null;
  try {
    return JSON.parse(userDetails) as UserDetails;
  } catch {
    return null;
  }
};

// Helper: Save user details
const saveUserDetails = (details: UserDetails) => {
  Storage.set("TeamsEko", JSON.stringify(details), 15);
};

// Helper: Refresh access token using refresh token
const refreshAccessToken = async (
  refreshToken: string,
  csrfToken?: string
): Promise<UserDetails> => {
  const config: AxiosRequestConfig = {
    method: "post",
    maxBodyLength: Number.POSITIVE_INFINITY,
    url: `${reqBaseUrl}/v1/refresh_token`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    data: { token: refreshToken },
  };
  const response: AxiosResponse<{ data: { result: UserDetails } }> =
    await axios.request(config);
  return response.data.data.result;
};

// Main API call function
export const APIcallFunction = () => {
  return async <T = unknown>(
    endpoint: string,
    method: APIMethod,
    headers: Record<string, string>,
    data?: unknown,
    body?: unknown, // Unused
    blob = false
  ): Promise<T> => {
    const controller = createAbortController();
    const signal = controller.signal;
    const url = `${reqBaseUrl}/${endpoint}`;

    const requestHeaders = { ...headers };

    // Attach Authorization header if user is logged in
    const userDetails = getUserDetails();
    if (endpoint !== "login" && userDetails) {
      requestHeaders.Authorization = `Bearer ${userDetails.access_token}`;
    }

    const config: AxiosRequestConfig = {
      method,
      maxBodyLength: Number.POSITIVE_INFINITY,
      url,
      headers: requestHeaders,
      data,
      signal,
      ...(blob ? { responseType: "blob" as const } : {}),
    };

    try {
      const response: AxiosResponse<T> = await axios.request(config);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      console.log(error.response?.data?.detail);

      const isAuthError =
        error.response?.data?.detail === "Could not validate credentials" ||
        error.message === "Request failed with status code 403";

      if (isAuthError && userDetails) {
        try {
          // Attempt token refresh
          const refreshedDetails = await refreshAccessToken(
            userDetails.refresh_token,
            headers["X-CSRF-Token"]
          );

          // Merge tokens
          const newUserDetails: UserDetails = {
            ...userDetails,
            ...refreshedDetails,
          };
          saveUserDetails(newUserDetails);

          // Retry request with new token
          const retryHeaders = {
            ...requestHeaders,
            Authorization: `Bearer ${refreshedDetails.access_token}`,
          };
          const retryConfig: AxiosRequestConfig = {
            ...config,
            headers: retryHeaders,
          };
          const retryResponse: AxiosResponse<T> = await axios.request(
            retryConfig
          );
          return retryResponse.data;
        } catch (refreshError) {
          throw refreshError;
        }
      }
      throw error;
    }
  };
};

// Abort API call utility
export const AbortAPI = (): boolean => {
  console.warn(
    "AbortAPI: No global controller to abort. Refactor to use per-request controller."
  );
  return false;
};
