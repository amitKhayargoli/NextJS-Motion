"use server";

import { revalidatePath } from "next/cache";
import { loginuser, registerUser, updateProfile } from "../api/auth";
import { getTokenCookie, setTokenCookie, storeUserData } from "../cookie";
export const handleRegister = async (formData: any) => {
  try {
    const res = await registerUser(formData);
    if (res.success) {
      return {
        success: true,
        data: res.data,
        message: "Registration successful",
      };
    }
    return { success: false, message: res.message || "Registration failed" };
  } catch (err: Error | any) {
    return { success: false, message: err.message || "Registration failed" };
  }
};

export const handleLogin = async (formData: any) => {
  try {
    const res = await loginuser(formData);

    if (res.success) {
      const token = res.token;
      console.log("Received token:", token);
      await setTokenCookie(token);
      await storeUserData(res.data);
      return {
        success: true,
        data: res.data,
        message: "Login successful",
      };
    }
    return { success: false, message: res.message || "Login failed" };
  } catch (err: Error | any) {
    return { success: false, message: err.message || "Login failed" };
  }
};

export const handleUpdateProfile = async (data: FormData) => {
  try {
    const response = await updateProfile(data);
    if (response.success) {
      revalidatePath("/user/profile");
      return {
        success: true,
        message: "Update successful",
        data: response.data,
      };
    }
    return {
      success: false,
      message: response.message || "Update failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Update action failed",
    };
  }
};
