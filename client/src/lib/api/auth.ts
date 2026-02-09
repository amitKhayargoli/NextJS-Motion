import axios from "./axios";
import { API } from "./endpoints";

export const registerUser = async (registerData: any) => {
  try {
    const response = await axios.post(API.AUTH.REGISTER, registerData);
    return response.data; // response ko body
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Registration failed";

    throw new Error(message);
  }
};

export const loginuser = async (loginData: any) => {
  try {
    const response = await axios.post(API.AUTH.LOGIN, loginData);
    return response.data; // response ko body
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Login failed";

    throw new Error(message);
  }
};

export const updateProfile = async (updateData: any) => {
  try {
    const response = await axios.put(API.AUTH.UPDATE, updateData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to update profile";

    throw new Error(message);
  }
};
