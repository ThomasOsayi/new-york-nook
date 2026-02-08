import { Suspense } from "react";
import ConfirmationContent from "./ConfirmationContent";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: "rgb(var(--bg-primary))", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span
            style={{
              display: "inline-block",
              width: 32,
              height: 32,
              border: "2px solid rgba(201,160,80,0.15)",
              borderTopColor: "#C9A050",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
