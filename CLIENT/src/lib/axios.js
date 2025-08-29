import axios from "axios";
export const axiosInstance = axios.create({
    baseURL: "https://pingbuzz.onrender.com/api",
    withCredentials:true,
})
