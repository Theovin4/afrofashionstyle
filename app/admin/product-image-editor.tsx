"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Props = { onReady: (file: File | null) => void };
type FitMode = "fill" | "fit";
type Background = "cream" | "white" | "black" | "transparent";
type EditorSettings = {
  zoom: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  flipX: boolean;
  flipY: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  quality: number;
  fitMode: FitMode;
  background: Background;
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxSourceBytes = 12 * 1024 * 1024;
const outputWidth = 900;
const outputHeight = 1200;
const backgrounds: Record<Exclude<Background, "transparent">, string> = {
  cream: "#f4eee7",
  white: "#ffffff",
  black: "#120d0b",
};
const defaultSettings: EditorSettings = {
  zoom: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  flipX: false,
  flipY: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  quality: 88,
  fitMode: "fill",
  background: "cream",
};

function readableBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ProductImageEditor({ onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const settingsRef = useRef<EditorSettings>(defaultSettings);
  const outputFileRef = useRef<File | null>(null);
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportVersionRef = useRef(0);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const sourceUrlRef = useRef("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceDetails, setSourceDetails] = useState("");
  const [outputDetails, setOutputDetails] = useState("");
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
  }, []);

  function exportCanvas(canvas: HTMLCanvasElement, quality: number) {
    const version = ++exportVersionRef.current;
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    outputFileRef.current = null;
    onReady(null);
    setProcessing(true);
    exportTimerRef.current = setTimeout(() => {
      canvas.toBlob((blob) => {
        if (version !== exportVersionRef.current) return;
        setProcessing(false);
        if (!blob) {
          setError("The edited image could not be prepared. Try a different source photograph.");
          onReady(null);
          return;
        }
        const file = new File([blob], "afro-fashionstyle-product.webp", { type: "image/webp" });
        outputFileRef.current = file;
        setOutputDetails(`${outputWidth} × ${outputHeight} WebP · ${readableBytes(file.size)}`);
        onReady(file);
      }, "image/webp", quality / 100);
    }, 140);
  }

  function render(next = settingsRef.current, image = imageRef.current) {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    context.clearRect(0, 0, outputWidth, outputHeight);
    if (next.background !== "transparent") {
      context.fillStyle = backgrounds[next.background];
      context.fillRect(0, 0, outputWidth, outputHeight);
    }
    const radians = next.rotation * Math.PI / 180;
    const boundingWidth = Math.abs(image.width * Math.cos(radians)) + Math.abs(image.height * Math.sin(radians));
    const boundingHeight = Math.abs(image.width * Math.sin(radians)) + Math.abs(image.height * Math.cos(radians));
    const baseScale = next.fitMode === "fill"
      ? Math.max(outputWidth / boundingWidth, outputHeight / boundingHeight)
      : Math.min(outputWidth / boundingWidth, outputHeight / boundingHeight);
    const scale = baseScale * next.zoom;
    context.save();
    context.translate(outputWidth / 2 + next.offsetX, outputHeight / 2 + next.offsetY);
    context.rotate(radians);
    context.scale(next.flipX ? -1 : 1, next.flipY ? -1 : 1);
    context.filter = `brightness(${next.brightness}%) contrast(${next.contrast}%) saturate(${next.saturation}%)`;
    context.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
    context.restore();
    exportCanvas(canvas, next.quality);
  }

  function updateSettings(patch: Partial<EditorSettings>) {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    render(next);
  }

  function clearImage() {
    exportVersionRef.current += 1;
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    imageRef.current = null;
    outputFileRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    settingsRef.current = defaultSettings;
    setSettings(defaultSettings);
    setSourceUrl("");
    setSourceDetails("");
    setOutputDetails("");
    setProcessing(false);
    setError("");
    onReady(null);
  }

  function choose(file?: File) {
    setError("");
    if (!file) { clearImage(); return; }
    if (!allowedImageTypes.has(file.type)) { clearImage(); setError("Choose a JPG, PNG, WebP or AVIF photograph."); return; }
    if (file.size > maxSourceBytes) { clearImage(); setError("Choose an image smaller than 12 MB. Export very large photographs as JPG or WebP first."); return; }
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    const url = URL.createObjectURL(file);
    sourceUrlRef.current = url;
    setSourceUrl(url);
    setSourceDetails(`${file.name} · ${readableBytes(file.size)}`);
    setOutputDetails("");
    settingsRef.current = defaultSettings;
    setSettings(defaultSettings);
    outputFileRef.current = null;
    onReady(null);
    const image = new window.Image();
    image.onload = () => {
      imageRef.current = image;
      setSourceDetails(`${file.name} · ${image.naturalWidth} × ${image.naturalHeight} · ${readableBytes(file.size)}`);
      render(defaultSettings, image);
    };
    image.onerror = () => { setProcessing(false); onReady(null); setError("This photograph could not be opened. Export it as JPG or PNG and try again."); };
    image.src = url;
  }

  function resetEdits() {
    settingsRef.current = defaultSettings;
    setSettings(defaultSettings);
    render(defaultSettings);
  }

  function downloadPreview() {
    const file = outputFileRef.current;
    if (!file) return;
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function startDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!imageRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: settingsRef.current.offsetX, offsetY: settingsRef.current.offsetY };
  }

  function moveDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    updateSettings({
      offsetX: Math.max(-outputWidth, Math.min(outputWidth, drag.offsetX + (event.clientX - drag.x) * outputWidth / rect.width)),
      offsetY: Math.max(-outputHeight, Math.min(outputHeight, drag.offsetY + (event.clientY - drag.y) * outputHeight / rect.height)),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  return <div className="image-editor">
    <div className="image-editor-heading"><div><b>Product image studio</b><small>Crop, correct and optimize before publishing.</small></div>{sourceUrl && <span>{processing ? "Preparing image…" : "Ready to upload"}</span>}</div>
    <label className="image-picker">Choose product photograph<input ref={inputRef} name="sourceImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => choose(event.target.files?.[0])} required/></label>
    <div className="image-editor-workspace">
      <div className={`image-editor-preview${sourceUrl ? "" : " empty"}${settings.background === "transparent" ? " transparent" : ""}`}>
        <canvas ref={canvasRef} aria-label="Edited product image preview. Drag to reposition." onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}/>
        {!sourceUrl && <span>Choose a clear, high-resolution product photograph to begin.</span>}
        {sourceUrl && <i>Drag image to reposition</i>}
      </div>
      {sourceUrl && <div className="image-editor-panel">
        <div className="image-editor-tabs" aria-label="Image framing mode"><button type="button" className={settings.fitMode === "fill" ? "active" : ""} onClick={() => updateSettings({ fitMode: "fill", zoom: 1, offsetX: 0, offsetY: 0 })}>Fill frame</button><button type="button" className={settings.fitMode === "fit" ? "active" : ""} onClick={() => updateSettings({ fitMode: "fit", zoom: 1, offsetX: 0, offsetY: 0 })}>Fit image</button></div>
        <label>Zoom <output>{settings.zoom.toFixed(2)}×</output><input type="range" min="0.5" max="3" step="0.05" value={settings.zoom} onChange={(event) => updateSettings({ zoom: Number(event.target.value) })}/></label>
        <label>Rotate <output>{settings.rotation}°</output><input type="range" min="-180" max="180" step="1" value={settings.rotation} onChange={(event) => updateSettings({ rotation: Number(event.target.value) })}/></label>
        <div className="image-editor-controls"><button type="button" onClick={() => updateSettings({ rotation: settings.rotation - 90 })}>Rotate left</button><button type="button" onClick={() => updateSettings({ rotation: settings.rotation + 90 })}>Rotate right</button><button type="button" className={settings.flipX ? "active" : ""} onClick={() => updateSettings({ flipX: !settings.flipX })}>Flip horizontal</button><button type="button" className={settings.flipY ? "active" : ""} onClick={() => updateSettings({ flipY: !settings.flipY })}>Flip vertical</button></div>
        <div className="image-position-controls"><label>Horizontal <output>{Math.round(settings.offsetX)}</output><input type="range" min={-outputWidth} max={outputWidth} step="5" value={settings.offsetX} onChange={(event) => updateSettings({ offsetX: Number(event.target.value) })}/></label><label>Vertical <output>{Math.round(settings.offsetY)}</output><input type="range" min={-outputHeight} max={outputHeight} step="5" value={settings.offsetY} onChange={(event) => updateSettings({ offsetY: Number(event.target.value) })}/></label></div>
        <div className="image-adjustments"><label>Brightness <output>{settings.brightness}%</output><input type="range" min="50" max="150" value={settings.brightness} onChange={(event) => updateSettings({ brightness: Number(event.target.value) })}/></label><label>Contrast <output>{settings.contrast}%</output><input type="range" min="50" max="150" value={settings.contrast} onChange={(event) => updateSettings({ contrast: Number(event.target.value) })}/></label><label>Color <output>{settings.saturation}%</output><input type="range" min="0" max="180" value={settings.saturation} onChange={(event) => updateSettings({ saturation: Number(event.target.value) })}/></label></div>
        <fieldset className="image-backgrounds"><legend>Background</legend>{(["cream", "white", "black", "transparent"] as Background[]).map((background) => <button key={background} type="button" className={settings.background === background ? "active" : ""} onClick={() => updateSettings({ background })}><i className={background}/>{background}</button>)}</fieldset>
        <label>Web quality <output>{settings.quality}%</output><input type="range" min="70" max="95" value={settings.quality} onChange={(event) => updateSettings({ quality: Number(event.target.value) })}/></label>
        <div className="image-editor-actions"><button type="button" onClick={resetEdits}>Reset edits</button><button type="button" onClick={downloadPreview} disabled={processing || !outputDetails}>Download preview</button><button type="button" className="danger" onClick={clearImage}>Remove image</button></div>
      </div>}
    </div>
    {sourceUrl && <div className="image-editor-details"><small>Source: {sourceDetails}</small><small>Upload: {processing ? "Optimizing…" : outputDetails || "Preparing…"}</small><small>Storefront format: 3:4 WebP for fast, consistent product cards.</small></div>}
    {error && <p className="image-editor-error" role="alert">{error}</p>}
  </div>;
}
