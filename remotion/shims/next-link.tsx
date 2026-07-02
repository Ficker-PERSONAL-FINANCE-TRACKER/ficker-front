import React from "react";

/** Shim de `next/link`: renderiza um <a> inerte (sem navegação no render). */
const NextLinkShim: React.FC<any> = ({ href, children, style, className, onClick, title }) => (
  <a
    href={typeof href === "string" ? href : "#"}
    style={style}
    className={className}
    title={title}
    onClick={(e) => {
      e.preventDefault();
      onClick?.(e);
    }}
  >
    {children}
  </a>
);

export default NextLinkShim;
