import axios from "axios";
export const axiosInstance = axios.create({
    baseURL: "https://pingbuzz-server.vercel.app/api",
    withCredentials:true,
})
