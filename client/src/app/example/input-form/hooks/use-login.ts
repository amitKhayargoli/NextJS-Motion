import { ChangeEvent, useState } from "react";

export const useLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleEmail = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    //e - event, target - element, value - current value of input
  };

  const handlePassword = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = () => {
    const loginData = {
      email,
      password,
    };

    alert("Email: " + email);

    //call api later
  };
  return { handlePassword, handleEmail, handleSubmit, email, password };
};
