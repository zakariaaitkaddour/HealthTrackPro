// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/login" />; // Changed from /LoginScreen to /login
}