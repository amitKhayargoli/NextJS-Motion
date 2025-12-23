import { useState } from "react";

export const useRegisterForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = () => {
    const registerData = {
      username,
      email,
      password,
      confirmPassword,
    };

    if (username === "") {
      alert("Username is required");
      return;
    }

    if (email === "") {
      alert("Email is required");
      return;
    }

    if (password === "") {
      alert("Password is required");
      return;
    }

    if (confirmPassword === "") {
      alert("Please confirm the password!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    alert("Registered successfully!");

    //call api later
  };
  return {
    handleEmail,
    handlePassword,
    handleUsername,
    handleConfirmPassword,
    handleSubmit,
  };
};
