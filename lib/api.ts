import axios from "axios";

export const api = axios.create({
  baseURL: "https://redapt-admin-git-main-gulshan-dotcoms-projects.vercel.app/api/userapi/user",
});