"use client";
import { useLoginForm } from "./hooks/use-login";

export default function Page() {
  const { handlePassword, handleEmail, handleSubmit, email, password } =
    useLoginForm(); // destructuring useLoginForm hook

  return (
    <div>
      <div>
        <label>Email:</label>
        <input className="" type="email" value={email} onChange={handleEmail} />
      </div>
      <div>
        <label>Password:</label>
        <input
          className=""
          type="password"
          value={password}
          onChange={handlePassword}
        />
      </div>
      <button onClick={handleSubmit}>Test</button>
    </div>
  );
}
