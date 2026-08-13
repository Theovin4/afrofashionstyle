"use client";

import { useEffect, useRef, useState } from "react";

type Props = { onReady: (file: File | null) => void };

export function ProductImageEditor({ onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);

  function render(image = imageRef.current, nextZoom = zoom, nextRotation = rotation) {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = 900;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#f4eee7";
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(nextRotation * Math.PI / 180);
    const rotated = Math.abs(nextRotation % 180) === 90;
    const sourceWidth = rotated ? image.height : image.width;
    const sourceHeight = rotated ? image.width : image.height;
    const scale = Math.max(width / sourceWidth, height / sourceHeight) * nextZoom;
    context.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
    context.restore();
    setProcessing(true);
    canvas.toBlob((blob) => {
      setProcessing(false);
      onReady(blob ? new File([blob], "afro-fashionstyle-product.webp", { type: "image/webp" }) : null);
    }, "image/webp", .88);
  }

  function choose(file?: File) {
    if (!file) { setSourceUrl(""); onReady(null); return; }
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) { setSourceUrl(""); onReady(null); return; }
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setZoom(1);
    setRotation(0);
    const image = new window.Image();
    image.onload = () => { imageRef.current = image; render(image, 1, 0); };
    image.src = url;
  }

  return <div className="image-editor">
    <label className="image-picker">Product image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => choose(event.target.files?.[0])} required/></label>
    <div className={`image-editor-preview${sourceUrl ? "" : " empty"}`}><canvas ref={canvasRef} aria-label="Edited product image preview"/>{!sourceUrl && <span>Choose a clear front-facing product photograph to begin.</span>}</div>
    {sourceUrl && <>
      <div className="image-editor-controls">
        <label>Crop zoom<input type="range" min="1" max="2" step=".05" value={zoom} onChange={(event) => { const value = Number(event.target.value); setZoom(value); render(undefined, value, rotation); }}/></label>
        <button type="button" onClick={() => { const value = (rotation - 90) % 360; setRotation(value); render(undefined, zoom, value); }}>Rotate left</button>
        <button type="button" onClick={() => { const value = (rotation + 90) % 360; setRotation(value); render(undefined, zoom, value); }}>Rotate right</button>
      </div>
      <small>{processing ? "Preparing optimized image…" : "Preview is cropped to the storefront’s 3:4 product format and compressed for fast loading."}</small>
    </>}
  </div>;
}
