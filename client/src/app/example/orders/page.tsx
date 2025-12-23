"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nextAction } from "../redirect-server/actions/order";

export default function Page() {
  const [status, setStatus] = useState("inactive");
  const [price, setPrice] = useState(0);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const handleSubmit = () => {
    //logic
    if (price > 0) {
      return;
    } else {
      router.push("/example/orders/unauthorized");
    }
  };

  const serverHandleSubmit = () => {
    startTransition(async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        nextAction(status);
      } catch (err: Error | any) {
        alert(err.message ?? "Form error");
      }
    });
  };
  return (
    <div>
      <label htmlFor="price">Price:</label>
      <input type="number" onChange={(e) => setPrice(Number(e.target.value))} />
      <div className="flex gap-8">
        <button className="text-2xl" onClick={handleSubmit}>
          Apply
        </button>
        <button className="text-2xl" onClick={serverHandleSubmit}>
          Next
        </button>
      </div>
    </div>
  );
}
