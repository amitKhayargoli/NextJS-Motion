"use server";

import { revalidatePath } from "next/cache";
import {
  loginuser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "../api/auth";
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

export const handleRequestPasswordReset = async (email: string) => {
  try {
    const response = await requestPasswordReset(email);
    if (response.success) {
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    }
    return {
      success: false,
      message: response.message || "Request password reset failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Request password reset action failed",
    };
  }
};

export const handleResetPassword = async (
  token: string,
  newPassword: string,
) => {
  try {
    const response = await resetPassword(token, newPassword);
    if (response.success) {
      return {
        success: true,
        message: "Password has been reset successfully",
      };
    }
    return {
      success: false,
      message: response.message || "Reset password failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Reset password action failed",
    };
  }
};
