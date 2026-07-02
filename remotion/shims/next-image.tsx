import React from "react";

/**
 * Shim de `next/image` para o bundler do Remotion: renderiza um <img> simples.
 * Descarta props exclusivas do Next (priority, quality, etc.) para não vazar
 * atributos inválidos no DOM.
 */
type NextImageProps = {
  src: string | { src: string };
  alt?: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  onClick?: React.MouseEventHandler;
  // props do Next que devem ser descartadas
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  unoptimized?: boolean;
  onLoadingComplete?: unknown;
};

const NextImageShim: React.FC<NextImageProps> = ({
  src,
  alt = "",
  width,
  height,
  fill,
  style,
  className,
  title,
  onClick,
}) => {
  const resolved = typeof src === "string" ? src : src?.src;
  const fillStyle: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : {};
  return (
    <img
      src={resolved}
      alt={alt}
      title={title}
      onClick={onClick}
      width={fill ? undefined : (width as number | undefined)}
      height={fill ? undefined : (height as number | undefined)}
      className={className}
      style={{ ...fillStyle, ...style }}
    />
  );
};

export default NextImageShim;
