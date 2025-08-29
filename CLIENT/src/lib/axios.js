import axios from "axios";
export const axiosInstance = axios.create({
    baseURL: "https://pingbuzz.vercel.app/api",
    withCredentials:true,
})
