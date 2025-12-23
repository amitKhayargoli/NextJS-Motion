"use server";
import { redirect } from "next/navigation";

export async function loginAction(username: string) {
  if (!username) {
    throw new Error("Username is required");
  }
  if (username == "admin") {
    redirect("/example/input-form");
  } else {
    redirect("/example/state");
  }
}
