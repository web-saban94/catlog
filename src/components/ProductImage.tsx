import React, {useEffect, useState} from 'react';

interface ProductImageProps {
  src: string | null;
  alt: string;
  sku?: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  sku,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50/40 text-slate-400 p-4 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-16 h-16 text-slate-300 mb-2"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="10" y="44" width="44" height="6" rx="2" fill="#CBD5E1" />
          <path d="M16 44L19 26H27L28 44H16Z" fill="#94A3B8" />
          <path d="M29 44L27 14H39L37 44H29Z" fill="#64748B" />
          <path d="M38 44L40 30H48L46 44H38Z" fill="#F59E0B" fillOpacity="0.7" />
          <rect x="31" y="21" width="4" height="5" rx="0.5" fill="#F8FAFC" />
        </svg>
        <span className="text-xs font-medium text-slate-500 line-clamp-1 max-w-[180px]">
          ח. סבן חומרי בניין
        </span>
        {sku && (
          <span className="text-[11px] font-mono-tabular text-slate-400 mt-0.5">
            מק״ט {sku}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
