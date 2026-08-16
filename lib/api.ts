import axios from "axios";

export const api = axios.create({
  baseURL: "http://10.207.64.147:3000/api/user",
});