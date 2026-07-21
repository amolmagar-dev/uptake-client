import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** Standard page wrapper: consistent max-width + padding on every standard page. */
export const PageContainer: React.FC<PageContainerProps> = ({ children, className = "" }) => (
  <div className={`mx-auto w-full max-w-[1600px] px-6 py-6 ${className}`}>{children}</div>
);
