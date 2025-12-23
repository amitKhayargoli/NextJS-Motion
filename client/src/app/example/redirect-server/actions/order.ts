"use server";
import { redirect } from "next/navigation";

export async function nextAction(status: string) {
  if (!status) {
    throw new Error("Error No status");
  }
  if (status == "active") {
    redirect("/example/orders/success");
  } else if (status == "inactive") {
    redirect("/example/orders/failure");
  }
}
