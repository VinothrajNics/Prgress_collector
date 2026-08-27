"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const token =
      localStorage.getItem(
        "collect_token"
      );

    const role =
      localStorage.getItem(
        "collect_role"
      );

    if (!token) {
      window.location.replace(
        "/login"
      );
      return;
    }

    if (role === "admin") {
      window.location.replace(
        "/admin"
      );
      return;
    }

    if (role === "client") {
      window.location.replace(
        "/client"
      );
      return;
    }

    localStorage.clear();

    window.location.replace(
      "/login"
    );
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

        <p className="text-sm text-slate-500">
          Loading...
        </p>
      </div>
    </main>
  );
}