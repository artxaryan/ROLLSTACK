"use client";

import { useState } from "react";
import { env } from "@sams-t-app/env/web";

export default function DebugAuthPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("Testing...\n");

    const serverUrl = env.NEXT_PUBLIC_SERVER_URL;
    setResult((prev) => `${prev}Server URL: ${serverUrl}\n\n`);

    try {
      setResult((prev) => `${prev}Fetching: ${serverUrl}/api/debug/env\n`);

      const response = await fetch(`${serverUrl}/api/debug/env`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
      });

      const text = await response.text();
      setResult((prev) => `${prev}Status: ${response.status}\n`);
      setResult((prev) => `${prev}Response: ${text}\n`);

      setResult((prev) => `${prev}\n--- Testing OTP Send ---\n`);

      const otpResponse = await fetch(
        `${serverUrl}/api/auth/email-otp/send-verification-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: window.location.origin,
          },
          body: JSON.stringify({
            email: "debug@test.com",
            type: "sign-in",
          }),
        }
      );

      const otpText = await otpResponse.text();
      setResult((prev) => `${prev}OTP Status: ${otpResponse.status}\n`);
      setResult((prev) => `${prev}OTP Response: ${otpText}\n`);
    } catch (err) {
      setResult((prev) => `${prev}Error: ${err}\n`);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Auth Debug Page</h1>
      <p>Server URL from env: {env.NEXT_PUBLIC_SERVER_URL}</p>
      <button onClick={testConnection} disabled={loading} type="button">
        {loading ? "Testing..." : "Test Connection"}
      </button>
      <pre
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f0f0f0",
          borderRadius: "4px",
          whiteSpace: "pre-wrap",
        }}
      >
        {result}
      </pre>
    </div>
  );
}
