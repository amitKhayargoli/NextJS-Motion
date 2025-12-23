"use client";

// client side page redirect

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const handleSubmit = () => {
    //logic
    if (username == "admin") {
      router.push("/example/input-form");
    } else {
      router.push("/example/state");
    }
  };
  return (
    <div className="mx-auto max-w-md border p-4">
      <label htmlFor="">Username</label>
      <input type="text" onChange={(e) => setUsername(e.target.value)} />

      <div>
        <button
          className="p-2 m-2 bg-blue-500 text-white"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
