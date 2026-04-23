import { useEffect, useState } from "react";
import { getToken } from "@/lib/storage";
import { API_BASE_URL } from "@/lib/api";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

function toProxyUrl(src: string): string | null {
  const match = src.match(/\/uploads\/(.+)$/);
  if (!match) return null;
  return `${API_BASE_URL}/api/uploads/${match[1]}`;
}

export function AuthenticatedImage({ src, alt, className }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (src.startsWith("data:")) {
      setBlobUrl(src);
      return;
    }

    const proxyUrl = toProxyUrl(src);
    if (!proxyUrl) { setBlobUrl(src); return; }

    const token = getToken();
    if (!token) return;

    let revoked = false;
    fetch(proxyUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => setBlobUrl(null));

    return () => {
      revoked = true;
      setBlobUrl((prev) => {
        if (prev && !prev.startsWith("data:")) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [src]);

  if (!blobUrl) return null;
  return <img src={blobUrl} alt={alt} className={className} />;
}

export async function fetchAuthenticatedBlob(src: string): Promise<string | null> {
  if (src.startsWith("data:")) return src;
  const proxyUrl = toProxyUrl(src);
  if (!proxyUrl) return null;
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(proxyUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
