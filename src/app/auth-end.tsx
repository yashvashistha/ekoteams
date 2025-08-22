// import { useEffect } from "react";
// import * as microsoftTeams from "@microsoft/teams-js";
// import { jwtDecode } from "jwt-decode";

// export default function AuthEnd() {
//   useEffect(() => {
//     microsoftTeams.authentication.getAuthToken({
//       successCallback: (token: string) => {
//         const decoded: any = jwtDecode(token);
//         alert("Email: " + decoded?.preferred_username); // 👈 Email here
//         microsoftTeams.authentication.notifySuccess(token);
//       },
//       failureCallback: (error) => {
//         alert("Failed to get token: " + error);
//         microsoftTeams.authentication.notifyFailure(error);
//       },
//     });
//   }, []);

//   return <div>Authenticating…</div>;
// }
