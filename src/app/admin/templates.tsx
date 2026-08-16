import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Check, X, Plus, Upload, Pencil, Copy, Star,
  MoreHorizontal, Trash2, RefreshCw, Eye as EyeIcon, BookMarked, LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import { F, M, dotGrid, type Screen, CertificateSeal, InlineSeal } from "../shared";
import { AdminAppShell } from "./shell";
import { signOutUser, type AuthedProfile } from "../../lib/auth";

// ─── Certificate Templates ────────────────────────────────────────────────────

type TemplateField = {
  id: string;
  label: string;
  placeholder: string;
  enabled: boolean;
  fontFamily: "serif" | "mono" | "sans";
  size: "xl" | "lg" | "md" | "sm";
  x: number;
  y: number;
  isCustom?: boolean;
};

type CertTemplate = {
  id: string;
  name: string;
  usageCount: number;
  isDefault: boolean;
  accent: string;
  createdAt: string;
  fields: TemplateField[];
  backgroundImage?: string | null;
  backgroundImageAspectRatio?: number;
};

const DEFAULT_FIELDS: TemplateField[] = [
  { id:"f-name",  label:"Attendee Name",  placeholder:"Recipient Name", enabled:true,  fontFamily:"serif", size:"xl", x:50, y:32 },
  { id:"f-event", label:"Event Name",     placeholder:"Event Title",     enabled:true,  fontFamily:"serif", size:"lg", x:50, y:48 },
  { id:"f-date",  label:"Date & Venue",   placeholder:"Date · Venue",    enabled:true,  fontFamily:"mono",  size:"sm", x:50, y:58 },
  { id:"f-sig",   label:"Signature Line", placeholder:"Organizer Name",  enabled:true,  fontFamily:"mono",  size:"sm", x:25, y:80 },
  { id:"f-id",    label:"Certificate ID", placeholder:"CERT-FB-XXXXXXX", enabled:true,  fontFamily:"mono",  size:"sm", x:75, y:80 },
  { id:"f-dept",  label:"Department",     placeholder:"Department Name", enabled:false, fontFamily:"sans",  size:"sm", x:50, y:65 },
];

const PREVIEW_SAMPLE: Record<string, string> = {
  "f-name":  "Alexandra Okonkwo",
  "f-event": "Environmental Policy Symposium",
  "f-date":  "Nov 14, 2024 · Whitman Hall, Rm 204",
  "f-sig":   "Prof. Andrei Volkov",
  "f-id":    "CERT-FB-2024-088021",
  "f-dept":  "Environmental Science",
};

const INITIAL_TEMPLATES: CertTemplate[] = [
  {
    id:"t1", name:"Academic Lecture Series", usageCount:142, isDefault:true, accent:"#E2A23B",
    createdAt:"Aug 12, 2024",
    fields: DEFAULT_FIELDS.map(f => ({ ...f })),
  },
  {
    id:"t2", name:"Workshop Certificate",  usageCount:87,  isDefault:false, accent:"#2E6B4C",
    createdAt:"Sep 4, 2024",
    fields: DEFAULT_FIELDS.map(f => ({ ...f, enabled: f.id !== "f-dept" })),
  },
  {
    id:"t3", name:"Student Leadership",    usageCount:31,  isDefault:false, accent:"#1E1B16",
    createdAt:"Oct 1, 2024",
    fields: DEFAULT_FIELDS.map(f => ({ ...f })),
  },
  {
    id:"t4", name:"Research Symposium",    usageCount:19,  isDefault:false, accent:"#B5432E",
    createdAt:"Oct 18, 2024",
    fields: DEFAULT_FIELDS.map(f => ({ ...f })),
  },
  {
    id:"t5", name:"Community Engagement",  usageCount:8,   isDefault:false, accent:"#6B6355",
    createdAt:"Nov 2, 2024",
    fields: DEFAULT_FIELDS.map(f => ({ ...f, enabled: f.id !== "f-dept" && f.id !== "f-id" })),
  },
  {
    id:"t6", name:"Cultural Events",       usageCount:3,   isDefault:false, accent:"#E2A23B",
    createdAt:"Nov 8, 2024",
    fields: DEFAULT_FIELDS.map(f => ({ ...f })),
  },
];

const FONT_STYLE: Record<TemplateField["fontFamily"], React.CSSProperties> = {
  serif: { fontFamily:"'Fraunces', Georgia, serif" },
  mono:  { fontFamily:"'IBM Plex Mono', monospace" },
  sans:  { fontFamily:"'Public Sans', system-ui, sans-serif" },
};

const SIZE_CLASS: Record<TemplateField["size"], string> = {
  xl: "text-[2rem] leading-tight",
  lg: "text-[1.25rem] leading-snug",
  md: "text-[1rem]",
  sm: "text-[0.7rem]",
};

function TemplateThumbnail({ template, scale = 1 }: { template: CertTemplate; scale?: number }) {
  const w = 320, h = 210;

  if (template.backgroundImage) {
    const EDITOR_W = 560;
    const ar = template.backgroundImageAspectRatio ?? (w / h);
    const editorH = Math.round(EDITOR_W / ar);
    const s = (w * scale) / EDITOR_W;
    const scaledH = editorH * s;
    const containerH = h * scale;
    const topOffset = (containerH - scaledH) / 2;

    const ffMap: Record<TemplateField["fontFamily"], string> = {
      serif: "'Fraunces',Georgia,serif",
      mono:  "'IBM Plex Mono',monospace",
      sans:  "'Public Sans',system-ui,sans-serif",
    };
    const fsMap: Record<TemplateField["size"], number> = { xl: 28, lg: 18, md: 14, sm: 11 };

    return (
      <div style={{
        width: w * scale, height: containerH,
        position: "relative", overflow: "hidden",
        background: "#F0EDE4", border: "1px solid rgba(30,27,22,0.14)",
        borderRadius: 6 * scale, flexShrink: 0,
      }}>
        <div style={{
          position: "absolute",
          width: EDITOR_W, height: editorH,
          top: topOffset, left: 0,
          transform: `scale(${s})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}>
          <img
            src={template.backgroundImage}
            alt=""
            style={{ width: "100%", height: "100%", display: "block", objectFit: "fill" }}
          />
          {template.fields.filter(f => f.enabled).map(field => (
            <div key={field.id} style={{
              position: "absolute",
              left: `${field.x}%`, top: `${field.y}%`,
              transform: "translate(-50%,-50%)",
              fontSize: fsMap[field.size],
              fontFamily: ffMap[field.fontFamily],
              fontWeight: 600, color: "#1E1B16",
              whiteSpace: "nowrap",
              textShadow: "0 0 6px rgba(255,255,255,0.95), 0 0 14px rgba(255,255,255,0.75)",
            }}>{field.placeholder}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: w * scale, height: h * scale, position:"relative", overflow:"hidden",
                  background:"#FFFFFF", border:"1px solid rgba(30,27,22,0.14)",
                  borderRadius: 6 * scale, flexShrink:0 }}>
      <div style={{ height: 3 * scale, background: template.accent, position:"absolute", top:0, left:0, right:0 }} />
      <div style={{ position:"absolute", top: 10*scale, left: 18*scale, right: 18*scale,
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    borderBottom:`${0.5*scale}px solid rgba(30,27,22,0.12)`, paddingBottom: 7*scale }}>
        <div style={{ display:"flex", alignItems:"center", gap: 5*scale }}>
          <svg width={9*scale} height={9*scale} viewBox="0 0 9 9">
            <BookMarked size={9*scale} strokeWidth={1.75} color="#E2A23B" />
          </svg>
          <span style={{ fontSize: 6.5*scale, fontFamily:"'IBM Plex Mono',monospace",
                         fontWeight:600, letterSpacing:"0.12em", color:"#1E1B16",
                         textTransform:"uppercase" }}>Fieldbook</span>
        </div>
        <span style={{ fontSize: 5.5*scale, fontFamily:"'IBM Plex Mono',monospace",
                       color:"#9C8E7E", textTransform:"uppercase", letterSpacing:"0.08em" }}>
          Certificate of Participation
        </span>
      </div>
      <div style={{ position:"absolute", top: 38*scale, left: 18*scale, right: 18*scale }}>
        <div style={{ fontSize: 5*scale, fontFamily:"'IBM Plex Mono',monospace",
                      color:"#9C8E7E", textTransform:"uppercase", letterSpacing:"0.12em",
                      marginBottom: 4*scale }}>This Certifies That</div>
        <div style={{ fontSize: 18*scale, fontFamily:"'Fraunces',Georgia,serif",
                      fontWeight:600, color:"#1E1B16", lineHeight:1.15, marginBottom: 3*scale }}>Recipient Name</div>
        <div style={{ fontSize: 5*scale, fontFamily:"'IBM Plex Mono',monospace",
                      color:"#9C8E7E", marginBottom: 6*scale }}>Student ID: XXX-0000</div>
        <div style={{ fontSize: 5*scale, fontFamily:"'IBM Plex Mono',monospace",
                      color:"#9C8E7E", textTransform:"uppercase", letterSpacing:"0.12em",
                      marginBottom: 2*scale }}>Has Attended</div>
        <div style={{ fontSize: 9*scale, fontFamily:"'Fraunces',Georgia,serif",
                      fontWeight:600, color:"#1E1B16", lineHeight:1.2 }}>Event Title</div>
        <div style={{ fontSize: 5*scale, fontFamily:"'IBM Plex Mono',monospace",
                      color:"#9C8E7E", marginTop: 2*scale }}>Date · Venue</div>
      </div>
      <div style={{ position:"absolute", bottom: 10*scale, left: 18*scale, right: 18*scale,
                    borderTop:`${0.5*scale}px solid rgba(30,27,22,0.12)`, paddingTop: 6*scale,
                    display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <div style={{ width: 40*scale, borderBottom:`${0.5*scale}px solid rgba(30,27,22,0.2)`, marginBottom: 2*scale }} />
          <div style={{ fontSize: 5*scale, fontFamily:"'IBM Plex Mono',monospace", color:"#9C8E7E" }}>Organizer Name</div>
        </div>
        <svg width={20*scale} height={20*scale} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="9" fill={template.accent} />
          <circle cx="10" cy="10" r="7" fill="none" stroke="rgba(30,27,22,0.2)" strokeWidth="0.5" />
          <path d="M6.5,10.5 L9,13 L13.5,7.5" stroke="#1E1B16" strokeWidth="1.2"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
                    backgroundImage:"radial-gradient(circle, rgba(30,27,22,0.05) 1px, transparent 1px)",
                    backgroundSize:`${14*scale}px ${14*scale}px` }} />
    </div>
  );
}

function TemplateOverflowMenu({
  template,
  onEdit,
  onSetDefault,
  onDuplicate,
  onDelete,
}: {
  template: CertTemplate;
  onEdit: () => void;
  onSetDefault: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button"
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-[5px] hover:bg-[#EDE7DA] transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Template options">
        <MoreHorizontal size={13} strokeWidth={1.75} className="text-[#6B6355]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[7px] overflow-hidden min-w-[168px]"
            style={{ boxShadow:"0 4px 16px rgba(30,27,22,0.08)" }}>
            <button type="button" onClick={() => { onEdit(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors text-left"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              <Pencil size={12} strokeWidth={1.75} className="text-[#6B6355]" /> Edit template
            </button>
            {!template.isDefault && (
              <button type="button" onClick={() => { onSetDefault(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors text-left"
                style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                <Star size={12} strokeWidth={1.75} className="text-[#E2A23B]" /> Set as default
              </button>
            )}
            <button type="button" onClick={() => { onDuplicate(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#1E1B16] hover:bg-[#F6F1E7] transition-colors text-left"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              <Copy size={12} strokeWidth={1.75} className="text-[#6B6355]" /> Duplicate
            </button>
            <div className="border-t border-[#DCD4C2]" />
            <button type="button" onClick={() => { onDelete(); setOpen(false); }}
              disabled={template.isDefault}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] hover:bg-[#F6F1E7] transition-colors text-left disabled:opacity-35 disabled:cursor-not-allowed"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#B5432E" }}>
              <Trash2 size={12} strokeWidth={1.75} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TemplateEditor({
  template,
  onSave,
  onBack,
  isGuest,
}: {
  template: CertTemplate;
  onSave: (t: CertTemplate) => void;
  onBack: () => void;
  isGuest?: boolean;
}) {
  const [name, setName]               = useState(template.name);
  const [accent, setAccent]           = useState(template.accent);
  const [fields, setFields]           = useState<TemplateField[]>(template.fields.map(f => ({ ...f })));
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [bgImage, setBgImage]         = useState<string | null>(template.backgroundImage ?? null);
  const [bgAspectRatio, setBgAspectRatio] = useState<number>(template.backgroundImageAspectRatio ?? 1.4142);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver]   = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const canvasRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef<{
    id: string; startMx: number; startMy: number; startFx: number; startFy: number;
  } | null>(null);

  const isCustomMode = bgImage !== null;
  const CANVAS_W = 560;

  const accentOptions = [
    { label:"Marigold",       value:"#E2A23B" },
    { label:"Verified Green", value:"#2E6B4C" },
    { label:"Ink",            value:"#1E1B16" },
    { label:"Flag Red",       value:"#B5432E" },
    { label:"Warm Stone",     value:"#6B6355" },
  ];

  function toggleField(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }

  function setFieldProp<K extends keyof TemplateField>(id: string, key: K, val: TemplateField[K]) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));
  }

  function moveField(id: string, dir: -1 | 1) {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function resetFieldPosition(id: string) {
    const def = DEFAULT_FIELDS.find(f => f.id === id);
    const cascadeBase = { x:50, y:40 };
    setFields(prev => prev.map(f =>
      f.id === id
        ? { ...f, x: def ? def.x : cascadeBase.x, y: def ? def.y : cascadeBase.y }
        : f
    ));
  }

  function addCustomField() {
    const enabledCount = fields.filter(f => f.enabled).length;
    const newField: TemplateField = {
      id: `f-custom-${Date.now()}`,
      label: "Custom Field",
      placeholder: "Custom Value",
      enabled: true,
      fontFamily: "sans",
      size: "md",
      x: 50,
      y: Math.min(20 + enabledCount * 10, 85),
      isCustom: true,
    };
    setFields(prev => [...prev, newField]);
    setActiveFieldId(newField.id);
  }

  function deleteCustomField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
    if (activeFieldId === id) setActiveFieldId(null);
  }

  async function processFile(file: File) {
    setUploadError(null);
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10 MB. Please use a smaller image.");
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        setBgImage(dataUrl);
        setBgAspectRatio(viewport.width / viewport.height);
      } catch {
        setUploadError("Failed to process PDF. Please try again.");
      }
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Only PNG, JPG, and PDF files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setBgImage(url);
        setBgAspectRatio(img.naturalWidth / img.naturalHeight);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }

  const handleFieldMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    if (!isCustomMode) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveFieldId(id);
    const field = fields.find(f => f.id === id);
    if (!field) return;
    dragState.current = { id, startMx: e.clientX, startMy: e.clientY, startFx: field.x, startFy: field.y };
  }, [isCustomMode, fields]);

  const handleFieldTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    if (!isCustomMode) return;
    e.stopPropagation();
    setActiveFieldId(id);
    const field = fields.find(f => f.id === id);
    if (!field) return;
    const touch = e.touches[0];
    dragState.current = { id, startMx: touch.clientX, startMy: touch.clientY, startFx: field.x, startFy: field.y };
  }, [isCustomMode, fields]);

  useEffect(() => {
    if (!isCustomMode) return;
    function onMouseMove(e: MouseEvent) {
      if (!dragState.current || !canvasRef.current) return;
      const { id, startMx, startMy, startFx, startFy } = dragState.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - startMx) / rect.width)  * 100;
      const dy = ((e.clientY - startMy) / rect.height) * 100;
      const nx = Math.max(2, Math.min(98, startFx + dx));
      const ny = Math.max(2, Math.min(98, startFy + dy));
      setFields(prev => prev.map(f => f.id === id ? { ...f, x: nx, y: ny } : f));
    }
    function onMouseUp() { dragState.current = null; }
    function onTouchMove(e: TouchEvent) {
      if (!dragState.current || !canvasRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const { id, startMx, startMy, startFx, startFy } = dragState.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((touch.clientX - startMx) / rect.width)  * 100;
      const dy = ((touch.clientY - startMy) / rect.height) * 100;
      const nx = Math.max(2, Math.min(98, startFx + dx));
      const ny = Math.max(2, Math.min(98, startFy + dy));
      setFields(prev => prev.map(f => f.id === id ? { ...f, x: nx, y: ny } : f));
    }
    function onTouchEnd() { dragState.current = null; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isCustomMode]);

  useEffect(() => {
    if (!isCustomMode || !activeFieldId) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 2 : 0.5;
      setFields(prev => prev.map(f => {
        if (f.id !== activeFieldId) return f;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp"   ? -step : e.key === "ArrowDown"  ? step : 0;
        return { ...f, x: Math.max(2, Math.min(98, f.x + dx)), y: Math.max(2, Math.min(98, f.y + dy)) };
      }));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCustomMode, activeFieldId]);

  function handleSave() {
    onSave({
      ...template, name, accent, fields,
      backgroundImage: bgImage,
      backgroundImageAspectRatio: bgAspectRatio,
    });
    toast.success("Template saved");
    onBack();
  }

  const activeField = fields.find(f => f.id === activeFieldId) ?? null;
  const canvasH = Math.round(CANVAS_W / bgAspectRatio);

  const CustomCanvas = () => (
    <div
      ref={canvasRef}
      style={{ width: CANVAS_W, height: canvasH, position:"relative", overflow:"hidden",
               border:"1px solid rgba(30,27,22,0.14)", borderRadius:8, flexShrink:0,
               boxShadow:"0 2px 20px rgba(30,27,22,0.07)", cursor:"default",
               userSelect:"none" }}
      onClick={() => setActiveFieldId(null)}
    >
      {bgImage ? (
        <img src={bgImage} alt="" style={{ width:"100%", height:"100%", display:"block", objectFit:"fill" }} />
      ) : (
        <div style={{ width:"100%", height:"100%", background:"#F0EDE4",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ ...M, fontSize:11, color:"#9C8E7E" }}>No image — upload one in the panel</span>
        </div>
      )}

      {fields.filter(f => f.enabled).map(field => {
        const isActive = activeFieldId === field.id;
        const text = previewMode ? (PREVIEW_SAMPLE[field.id] ?? field.placeholder) : field.placeholder;
        const sizeMap: Record<TemplateField["size"], number> = { xl:28, lg:18, md:14, sm:11 };
        return (
          <div
            key={field.id}
            onMouseDown={e => { e.stopPropagation(); handleFieldMouseDown(field.id, e); }}
            onTouchStart={e => { handleFieldTouchStart(field.id, e); }}
            onClick={e => { e.stopPropagation(); setActiveFieldId(isActive ? null : field.id); }}
            style={{
              position:"absolute",
              left:`${field.x}%`, top:`${field.y}%`,
              transform:"translate(-50%,-50%)",
              cursor: isCustomMode ? "grab" : "pointer",
              padding:"2px 6px",
              borderRadius:4,
              border: isActive ? "1.5px solid #E2A23B" : "1px dashed rgba(30,27,22,0.2)",
              background: isActive ? "rgba(226,162,59,0.08)" : "rgba(255,255,255,0.55)",
              backdropFilter:"blur(2px)",
              fontSize: sizeMap[field.size],
              fontFamily: FONT_STYLE[field.fontFamily].fontFamily,
              fontWeight: 600,
              color:"#1E1B16",
              whiteSpace:"nowrap",
              boxShadow: isActive ? "0 0 0 2px rgba(226,162,59,0.2)" : "none",
              zIndex: isActive ? 10 : 1,
            }}
          >
            {isActive && (
              <span style={{ position:"absolute", top:-13, left:0,
                             ...M, fontSize:7, color:"#E2A23B",
                             fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                             whiteSpace:"nowrap" }}>
                {field.label}
              </span>
            )}
            {text}
          </div>
        );
      })}
    </div>
  );

  const GeneratedCanvas = () => (
    <div className="bg-white border border-[rgba(30,27,22,0.14)] rounded-[8px] overflow-hidden"
      style={{ width: CANVAS_W, minHeight:380, position:"relative",
               boxShadow:"0 2px 20px rgba(30,27,22,0.07)",
               backgroundImage:"radial-gradient(circle, rgba(30,27,22,0.04) 1px, transparent 1px)",
               backgroundSize:"18px 18px" }}>
      <div style={{ height:4, background:accent }} />
      <div className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor:"rgba(30,27,22,0.10)" }}>
        <div className="flex items-center gap-2">
          <BookMarked size={12} strokeWidth={1.75} style={{ color:"#E2A23B" }} />
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={M}>Fieldbook</span>
        </div>
        <span className="text-[8px] tracking-widest uppercase" style={{ ...M, color:"#9C8E7E" }}>
          Certificate of Participation
        </span>
      </div>
      <div className="px-8 py-6 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[8px] tracking-widest uppercase mb-3" style={{ ...M, color:"#9C8E7E" }}>This Certifies That</p>
          {fields.filter(f => f.enabled).map(field => {
            const isActive = activeFieldId === field.id;
            const text = previewMode ? (PREVIEW_SAMPLE[field.id] ?? field.placeholder) : field.placeholder;
            return (
              <motion.div key={field.id}
                onClick={() => setActiveFieldId(isActive ? null : field.id)}
                className={`relative cursor-pointer rounded-[4px] px-1 -mx-1 mb-1 transition-all ${
                  isActive
                    ? "ring-2 ring-[#E2A23B] ring-offset-1 bg-[rgba(226,162,59,0.06)]"
                    : "hover:bg-[rgba(30,27,22,0.03)]"
                }`}
                layout transition={{ duration:0.15 }}>
                {isActive && (
                  <span className="absolute -top-[10px] left-1 text-[7px] font-semibold tracking-wider uppercase"
                    style={{ ...M, color:"#E2A23B" }}>{field.label}</span>
                )}
                {field.id === "f-name" ? (
                  <div className={`${SIZE_CLASS[field.size]} font-semibold text-[#1E1B16]`}
                    style={FONT_STYLE[field.fontFamily]}>{text}</div>
                ) : field.id === "f-event" ? (
                  <div className="mt-3">
                    <p className="text-[8px] tracking-widest uppercase mb-0.5" style={{ ...M, color:"#9C8E7E" }}>Has Attended</p>
                    <div className={`${SIZE_CLASS[field.size]} font-semibold text-[#1E1B16]`}
                      style={FONT_STYLE[field.fontFamily]}>{text}</div>
                  </div>
                ) : field.id === "f-date" ? (
                  <div className={`${SIZE_CLASS[field.size]} mt-0.5`}
                    style={{ ...FONT_STYLE[field.fontFamily], color:"#6B6355" }}>{text}</div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
        <div className="flex-shrink-0">
          <CertificateSeal size={72} rotate={-9} delay={0} />
        </div>
      </div>
      <div className="px-8 py-4 border-t flex items-end justify-between"
        style={{ borderColor:"rgba(30,27,22,0.10)" }}>
        <div>
          {fields.find(f => f.id === "f-sig" && f.enabled) && (
            <>
              <div className="w-28 border-b mb-1.5" style={{ borderColor:"rgba(30,27,22,0.2)" }} />
              <p className="text-[8px] tracking-wide uppercase" style={{ ...M, color:"#6B6355" }}>
                {previewMode ? PREVIEW_SAMPLE["f-sig"] : "Organizer Name"}
              </p>
              <p className="text-[7px]" style={{ ...M, color:"#9C8E7E" }}>Title · Department</p>
            </>
          )}
        </div>
        {fields.find(f => f.id === "f-id" && f.enabled) && (
          <div className="text-right">
            <p className="text-[7px] mb-0.5" style={{ ...M, color:"#9C8E7E" }}>
              {previewMode ? PREVIEW_SAMPLE["f-id"] : fields.find(f => f.id === "f-id")!.placeholder}
            </p>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border"
              style={{ borderColor:"rgba(46,107,76,0.3)" }}>
              <span className="w-1 h-1 rounded-full bg-[#2E6B4C]" />
              <span className="text-[7px]" style={{ ...M, color:"#2E6B4C" }}>Verified</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const UploadZone = () => (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        e.preventDefault(); setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
      }}
      onClick={() => fileInputRef.current?.click()}
      style={{
        width: CANVAS_W, height: 360, borderRadius:8, cursor:"pointer",
        border: `1px dashed ${isDragOver ? "#E2A23B" : "#DCD4C2"}`,
        background: isDragOver ? "rgba(226,162,59,0.04)" : "#FCFAF3",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:12, transition:"border-color 0.15s, background 0.15s",
      }}>
      <input
        ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,application/pdf,.pdf"
        style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
      />
      <Upload size={24} strokeWidth={1.5} style={{ color:"#DCD4C2" }} />
      <div style={{ textAlign:"center" }}>
        <p style={{ fontFamily:"'Public Sans',system-ui,sans-serif", fontSize:13, color:"#1E1B16", marginBottom:4 }}>
          Drag & drop your certificate design here
        </p>
        <p style={{ fontFamily:"'Public Sans',system-ui,sans-serif", fontSize:11, color:"#9C8E7E" }}>
          or{" "}
          <span style={{ textDecoration:"underline", color:"#1E1B16" }}>browse files</span>
          {" "}· PNG or JPG · max 10 MB
        </p>
      </div>
      {uploadError && (
        <p style={{ fontFamily:"'Public Sans',system-ui,sans-serif", fontSize:11,
                    color:"#B5432E", maxWidth:340, textAlign:"center" }}>
          {uploadError}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-shrink-0 bg-[#F6F1E7] border-b border-[#DCD4C2] h-14 flex items-center gap-4 px-8">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
          <ArrowLeft size={13} strokeWidth={1.5} /> Templates
        </button>
        <span className="text-[#DCD4C2] text-xs">/</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="text-[13px] font-semibold bg-transparent border-b border-transparent hover:border-[#DCD4C2] focus:border-[#1E1B16]/30 outline-none text-[#1E1B16] transition-colors px-1"
          style={F}
        />
        <div className="ml-auto flex items-center gap-2">
          <button type="button"
            onClick={() => setPreviewMode(v => !v)}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-[6px] text-[12px] border transition-colors"
            style={{
              fontFamily:"'Public Sans',system-ui,sans-serif",
              borderColor: previewMode ? "#1E1B16" : "#DCD4C2",
              background: previewMode ? "#1E1B16" : "transparent",
              color: previewMode ? "#F6F1E7" : "#6B6355",
            }}>
            <EyeIcon size={12} strokeWidth={1.75} />
            {previewMode ? "Editing" : "Preview"}
          </button>
          <button type="button" onClick={onBack}
            className="px-3.5 py-[7px] rounded-[6px] text-[12px] font-medium border border-[#DCD4C2] text-[#6B6355] hover:border-[#1E1B16]/30 hover:text-[#1E1B16] transition-colors"
            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
            Discard
          </button>
          <button type="button" onClick={handleSave}
            disabled={isGuest}
            title={isGuest ? "Disabled in guest mode" : undefined}
            className="flex items-center gap-2 px-4 py-[7px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
            <Check size={12} strokeWidth={2.5} /> Save template
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden lg:overflow-hidden overflow-auto">

        <div className="flex-1 min-h-[300px] overflow-auto flex items-start justify-center pt-10 pb-10"
          style={{ background:"#EDEAE2",
                   backgroundImage:"radial-gradient(circle, rgba(30,27,22,0.07) 1px, transparent 1px)",
                   backgroundSize:"22px 22px" }}>
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.24, ease:"easeOut" }}>
            {isCustomMode && !bgImage ? <UploadZone /> :
             isCustomMode ? <CustomCanvas /> :
             <GeneratedCanvas />}
            <p className="text-center mt-3 text-[9px]" style={{ ...M, color:"#9C8E7E" }}>
              {isCustomMode && bgImage
                ? "Drag fields to reposition · click to select · arrow keys to nudge"
                : isCustomMode
                ? "Upload a design to start placing fields"
                : "Click a field on the canvas to select it · changes reflect instantly"}
            </p>
          </motion.div>
        </div>

        <div className="w-full lg:w-[272px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[#DCD4C2] bg-[#FCFAF3] flex flex-col overflow-auto lg:overflow-hidden lg:min-h-0" style={{ maxHeight: "none" }}>

          {isCustomMode && (
            <div className="px-5 py-4 border-b border-[#DCD4C2] flex-shrink-0">
              <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-2.5" style={M}>Design Image</div>
              {bgImage ? (
                <div className="relative rounded-[5px] overflow-hidden border border-[#DCD4C2]"
                  style={{ aspectRatio: bgAspectRatio }}>
                  <img src={bgImage} alt="" className="w-full h-full object-fill block" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
                    style={{ background:"rgba(30,27,22,0.45)" }}>
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-[9px] font-medium"
                      style={{ background:"#F6F1E7", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                      <RefreshCw size={9} strokeWidth={2} /> Replace
                    </button>
                    <button type="button"
                      onClick={() => { setBgImage(null); setUploadError(null); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-[9px] font-medium"
                      style={{ background:"rgba(181,67,46,0.12)", color:"#B5432E", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                      <Trash2 size={9} strokeWidth={2} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[5px] border border-dashed border-[#DCD4C2] text-[11px] text-[#6B6355] hover:border-[#9C8E7E] hover:text-[#1E1B16] transition-colors"
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  <Upload size={11} strokeWidth={1.75} /> Upload image
                </button>
              )}
              {uploadError && (
                <p className="mt-2 text-[10px] leading-snug" style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#B5432E" }}>
                  {uploadError}
                </p>
              )}
              <input
                ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,application/pdf,.pdf"
                style={{ display:"none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
              />
            </div>
          )}

          {!isCustomMode && (
            <div className="px-5 py-4 border-b border-[#DCD4C2] flex-shrink-0">
              <div className="text-[8px] tracking-widest uppercase text-[#6B6355] mb-3" style={M}>Accent Color</div>
              <div className="flex items-center gap-2 flex-wrap">
                {accentOptions.map(opt => (
                  <button key={opt.value} type="button" aria-label={opt.label}
                    onClick={() => setAccent(opt.value)}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{
                      background: opt.value,
                      borderColor: accent === opt.value ? "#1E1B16" : "transparent",
                      outline: accent === opt.value ? "1px solid rgba(30,27,22,0.2)" : "none",
                      outlineOffset:"2px",
                    }} />
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
              <div className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>Fields</div>
              <span className="text-[9px]" style={{ ...M, color:"#9C8E7E" }}>
                {fields.filter(f => f.enabled).length} active
              </span>
            </div>
            <div className="px-4 pb-2 space-y-1.5">
              {fields.map((field, idx) => {
                const isActive = activeFieldId === field.id;
                return (
                  <motion.div key={field.id}
                    layout
                    className={`rounded-[7px] border transition-colors overflow-hidden ${
                      isActive
                        ? "border-[#E2A23B] bg-[rgba(226,162,59,0.06)]"
                        : field.enabled
                        ? "border-[#DCD4C2] bg-[#F6F1E7]"
                        : "border-[#EDE7DA] bg-[#EDE7DA]/50 opacity-60"
                    }`}
                    onClick={() => field.enabled && setActiveFieldId(isActive ? null : field.id)}>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      {!isCustomMode && (
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button type="button" onClick={e => { e.stopPropagation(); moveField(field.id,-1); }}
                            disabled={idx===0}
                            aria-label="Move field up"
                            className="text-[#DCD4C2] hover:text-[#6B6355] disabled:opacity-30 leading-none text-[8px]">▲</button>
                          <button type="button" onClick={e => { e.stopPropagation(); moveField(field.id,1); }}
                            disabled={idx===fields.length-1}
                            aria-label="Move field down"
                            className="text-[#DCD4C2] hover:text-[#6B6355] disabled:opacity-30 leading-none text-[8px]">▼</button>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {field.isCustom && isActive ? (
                          <input
                            value={field.label}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setFieldProp(field.id,"label",e.target.value)}
                            className="text-[11px] font-medium text-[#1E1B16] bg-transparent border-b border-[#DCD4C2] outline-none w-full"
                            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}
                          />
                        ) : (
                          <div className="text-[11px] font-medium text-[#1E1B16] truncate"
                            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{field.label}</div>
                        )}
                        <div className="text-[8px] truncate" style={{ ...M, color:"#9C8E7E" }}>{field.placeholder}</div>
                      </div>
                      {field.isCustom && (
                        <button type="button"
                          onClick={e => { e.stopPropagation(); deleteCustomField(field.id); }}
                          className="p-0.5 rounded text-[#DCD4C2] hover:text-[#B5432E] transition-colors flex-shrink-0"
                          aria-label="Delete field">
                          <X size={10} strokeWidth={2} />
                        </button>
                      )}
                      <button type="button"
                        onClick={e => { e.stopPropagation(); toggleField(field.id); }}
                        className={`w-8 h-4 rounded-full border transition-all flex-shrink-0 relative ${
                          field.enabled ? "bg-[#2E6B4C] border-[#2E6B4C]" : "bg-[#EDE7DA] border-[#DCD4C2]"
                        }`}
                        aria-label={field.enabled ? "Disable field" : "Enable field"}>
                        <motion.span
                          className="absolute top-[2px] w-3 h-3 rounded-full bg-white"
                          style={{ boxShadow:"0 1px 2px rgba(30,27,22,0.15)" }}
                          animate={{ left: field.enabled ? "calc(100% - 14px)" : "2px" }}
                          transition={{ type:"spring", stiffness:400, damping:28 }}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isActive && field.enabled && (
                        <motion.div
                          initial={{ height:0, opacity:0 }}
                          animate={{ height:"auto", opacity:1 }}
                          exit={{ height:0, opacity:0 }}
                          transition={{ duration:0.18 }}
                          className="overflow-hidden">
                          <div className="px-3 pb-3 pt-0.5 space-y-2.5 border-t border-[rgba(226,162,59,0.2)]">

                            <div>
                              <div className="text-[7px] tracking-widest uppercase text-[#9C8E7E] mb-1" style={M}>Placeholder</div>
                              <input
                                value={field.placeholder}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setFieldProp(field.id,"placeholder",e.target.value)}
                                className="w-full text-[10px] px-2 py-1 rounded-[4px] border border-[#DCD4C2] bg-[#FCFAF3] outline-none focus:border-[#E2A23B] transition-colors text-[#1E1B16]"
                                style={M}
                              />
                            </div>

                            <div>
                              <div className="text-[7px] tracking-widest uppercase text-[#9C8E7E] mb-1.5" style={M}>Font</div>
                              <div className="flex gap-1.5">
                                {(["serif","sans","mono"] as TemplateField["fontFamily"][]).map(ff => (
                                  <button key={ff} type="button"
                                    onClick={e => { e.stopPropagation(); setFieldProp(field.id,"fontFamily",ff); }}
                                    className="flex-1 py-1 rounded-[4px] text-[9px] border transition-colors"
                                    style={{
                                      fontFamily: ff === "serif" ? "'Fraunces',serif" : ff === "mono" ? "'IBM Plex Mono',monospace" : "'Public Sans',sans-serif",
                                      borderColor: field.fontFamily === ff ? "#E2A23B" : "#DCD4C2",
                                      background: field.fontFamily === ff ? "rgba(226,162,59,0.1)" : "transparent",
                                      color: field.fontFamily === ff ? "#E2A23B" : "#6B6355",
                                    }}>
                                    {ff === "serif" ? "Serif" : ff === "mono" ? "Mono" : "Sans"}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-[7px] tracking-widest uppercase text-[#9C8E7E] mb-1.5" style={M}>Size</div>
                              <div className="flex gap-1.5">
                                {(["sm","md","lg","xl"] as TemplateField["size"][]).map(sz => (
                                  <button key={sz} type="button"
                                    onClick={e => { e.stopPropagation(); setFieldProp(field.id,"size",sz); }}
                                    className="flex-1 py-1 rounded-[4px] text-[9px] border transition-colors"
                                    style={{
                                      fontFamily:"'IBM Plex Mono',monospace",
                                      borderColor: field.size === sz ? "#E2A23B" : "#DCD4C2",
                                      background: field.size === sz ? "rgba(226,162,59,0.1)" : "transparent",
                                      color: field.size === sz ? "#E2A23B" : "#6B6355",
                                    }}>
                                    {sz.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {isCustomMode && (
                              <div>
                                <div className="text-[7px] tracking-widest uppercase text-[#9C8E7E] mb-1.5" style={M}>Position</div>
                                <div className="flex gap-1.5 items-center">
                                  {(["x","y"] as const).map(axis => (
                                    <div key={axis} className="flex items-center gap-1 flex-1 border border-[#DCD4C2] rounded-[4px] bg-[#FCFAF3] px-1.5 py-1">
                                      <span style={{ ...M, fontSize:7, color:"#9C8E7E" }}>{axis.toUpperCase()}</span>
                                      <input
                                        type="number" min={0} max={100} step={0.5}
                                        value={Math.round(field[axis] * 10) / 10}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => setFieldProp(field.id, axis, Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                                        className="w-full text-[10px] bg-transparent outline-none text-[#1E1B16] text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        style={M}
                                      />
                                      <span style={{ ...M, fontSize:7, color:"#9C8E7E" }}>%</span>
                                    </div>
                                  ))}
                                </div>
                                <button type="button"
                                  onClick={e => { e.stopPropagation(); resetFieldPosition(field.id); }}
                                  className="mt-1.5 text-[8px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                                  style={M}>
                                  ↺ Reset position
                                </button>
                              </div>
                            )}

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {isCustomMode && (
              <div className="px-4 pb-4">
                <button type="button"
                  onClick={addCustomField}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[6px] border border-dashed border-[#DCD4C2] text-[11px] text-[#6B6355] hover:border-[#9C8E7E] hover:text-[#1E1B16] transition-colors"
                  style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  <Plus size={11} strokeWidth={2} /> Add field
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function UploadDesignScreen({
  onBack,
  onCreateTemplate,
}: {
  onBack: () => void;
  onCreateTemplate: (backgroundImage: string, backgroundImageAspectRatio: number) => void;
}) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio]     = useState<number>(1.4142);
  const [uploadError, setUploadError]     = useState<string | null>(null);
  const [isDragOver, setIsDragOver]       = useState(false);
  const [isProcessing, setIsProcessing]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PS: React.CSSProperties = { fontFamily: "'Public Sans',system-ui,sans-serif" };

  async function processFile(file: File) {
    setUploadError(null);
    setIsProcessing(true);

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10 MB. Please choose a smaller file.");
      setIsProcessing(false);
      return;
    }

    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg";

    if (!isPDF && !isImage) {
      setUploadError("Only PNG, JPG, or PDF files are accepted.");
      setIsProcessing(false);
      return;
    }

    try {
      if (isPDF) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        setUploadedImage(dataUrl);
        setAspectRatio(viewport.width / viewport.height);
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const img = new Image();
        img.onload = () => {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
          setUploadedImage(dataUrl);
          setIsProcessing(false);
        };
        img.onerror = () => {
          setUploadError("Could not read image. Please try a different file.");
          setIsProcessing(false);
        };
        img.src = dataUrl;
        return;
      }
    } catch {
      setUploadError("Failed to process file. Please try again.");
    }

    setIsProcessing(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="max-w-[560px] mx-auto px-8 py-10 space-y-6">

          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            style={PS}>
            <ArrowLeft size={12} strokeWidth={1.5} /> Back to templates
          </button>

          <div>
            <div className="text-[22px] font-semibold text-[#1E1B16] leading-tight" style={F}>
              Upload your design
            </div>
            <p className="text-[12px] mt-1.5 leading-relaxed" style={{ ...PS, color: "#6B6355" }}>
              Upload a PNG, JPG, or PDF of your certificate design. Field labels can be positioned
              after this step.
            </p>
          </div>

          {!uploadedImage ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-4 rounded-[8px] py-14 cursor-pointer transition-colors select-none"
              style={{
                border: `1px dashed ${isDragOver ? "#E2A23B" : "#DCD4C2"}`,
                background: isDragOver ? "rgba(226,162,59,0.04)" : "#FCFAF3",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,.pdf"
                style={{ display: "none" }}
                onChange={handleBrowse}
              />
              <div className="w-12 h-12 rounded-full bg-[#F6F1E7] border border-[#DCD4C2] flex items-center justify-center">
                {isProcessing
                  ? <RefreshCw size={18} strokeWidth={1.25} style={{ color: "#DCD4C2" }} className="animate-spin" />
                  : <Upload size={18} strokeWidth={1.25} style={{ color: "#DCD4C2" }} />}
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-[#1E1B16]" style={PS}>
                  {isProcessing ? "Processing…" : "Drag your certificate design here"}
                </p>
                {!isProcessing && (
                  <p className="text-[11px] mt-1" style={{ ...PS, color: "#9C8E7E" }}>
                    or{" "}
                    <span className="underline underline-offset-2 cursor-pointer hover:text-[#1E1B16] transition-colors">
                      Browse files
                    </span>
                  </p>
                )}
              </div>
              <p className="text-[10px] absolute bottom-4" style={{ ...M, color: "#DCD4C2" }}>
                PNG, JPG, or PDF · max 10 MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden p-4">
                <div className="text-[10px] tracking-[0.1em] uppercase mb-3" style={{ ...M, color: "#9C8E7E" }}>
                  Preview
                </div>
                <div className="w-full relative rounded-[4px] overflow-hidden bg-[#F6F1E7] border border-[#DCD4C2]">
                  <div style={{ paddingTop: `${(1 / aspectRatio) * 100}%`, position: "relative" }}>
                    <img
                      src={uploadedImage}
                      alt="Certificate design preview"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[11px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                  style={PS}
                >
                  <RefreshCw size={11} strokeWidth={1.75} /> Replace image
                </button>
                <span className="text-[#DCD4C2] text-xs">·</span>
                <button
                  type="button"
                  onClick={() => { setUploadedImage(null); setUploadError(null); }}
                  className="flex items-center gap-1.5 text-[11px] transition-colors hover:opacity-70"
                  style={{ ...PS, color: "#B5432E" }}
                >
                  <Trash2 size={11} strokeWidth={1.75} /> Remove
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,.pdf"
                  style={{ display: "none" }}
                  onChange={handleBrowse}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-[11px]" style={{ ...PS, color: "#B5432E" }}>{uploadError}</p>
          )}

          {uploadedImage && (
            <button
              type="button"
              onClick={() => onCreateTemplate(uploadedImage, aspectRatio)}
              className="w-full flex items-center justify-center gap-2 py-[10px] rounded-[6px] text-[13px] font-semibold transition-opacity hover:opacity-85"
              style={{ ...PS, background: "#E2A23B", color: "#1E1B16" }}
            >
              <Check size={14} strokeWidth={2.5} />
              Create template with this design
            </button>
          )}

        </div>
      </main>
    </div>
  );
}

export function CertificateTemplatesScreen({ onNavigate, isGuest, profile }: { onNavigate: (s: Screen) => void; isGuest?: boolean; profile?: AuthedProfile | null }) {
  const [templates, setTemplates] = useState<CertTemplate[]>(() => {
    try {
      const raw = localStorage.getItem("fieldbook-templates");
      if (raw) return JSON.parse(raw) as CertTemplate[];
    } catch {}
    return INITIAL_TEMPLATES;
  });

  useEffect(() => {
    try { localStorage.setItem("fieldbook-templates", JSON.stringify(templates)); } catch {}
  }, [templates]);

  const [editingTemplate, setEditingTemplate] = useState<CertTemplate | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sourceChoice, setSourceChoice] = useState<"scratch" | "upload" | "pending" | null>(null);
  const [uploadRoute, setUploadRoute] = useState(false);

  function handleSave(updated: CertTemplate) {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTemplate(null);
  }

  function handleSetDefault(id: string) {
    setTemplates(prev => prev.map(t => ({ ...t, isDefault: t.id === id })));
    toast.success("Default template updated");
  }

  function handleDuplicate(id: string) {
    const src = templates.find(t => t.id === id);
    if (!src) return;
    const copy: CertTemplate = {
      ...src,
      id: `t${Date.now()}`,
      name: `${src.name} (copy)`,
      usageCount: 0,
      isDefault: false,
      createdAt: "Just now",
      fields: src.fields.map(f => ({ ...f })),
    };
    setTemplates(prev => [...prev, copy]);
    toast("Template duplicated");
  }

  function handleDelete(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast("Template deleted");
  }

  function handleCreate() {
    setSourceChoice("pending");
  }

  function confirmCreate(source: "scratch" | "upload") {
    setSourceChoice(null);
    if (source === "upload") {
      setUploadRoute(true);
      return;
    }
    const newT: CertTemplate = {
      id: `t${Date.now()}`,
      name: "New Template",
      usageCount: 0,
      isDefault: false,
      accent: "#E2A23B",
      createdAt: "Just now",
      fields: DEFAULT_FIELDS.map(f => ({ ...f })),
    };
    setTemplates(prev => [...prev, newT]);
    setEditingTemplate(newT);
  }

  const sharedNavHandler = (id: string) => {
    if (id === "profile")          { onNavigate("profile");          return; }
    if (id === "admin-dashboard")  { onNavigate("admin-dashboard");  return; }
    if (id === "admin-approvals")  { onNavigate("admin-approvals");  return; }
    if (id === "admin-users")      { onNavigate("admin-users");      return; }
    if (id === "admin-analytics")  { onNavigate("admin-analytics");  return; }
    if (id === "admin-settings")   { onNavigate("admin-settings");   return; }
    if (id === "admin-notifs")     { onNavigate("admin-notifs");     return; }
    toast(`${id} — coming soon`);
  };

  const previewTemplate = previewId ? templates.find(t => t.id === previewId) ?? null : null;

  if (uploadRoute) {
    return (
      <AdminAppShell
        activeNav="admin-templates"
        adminName={profile?.fullName ?? "Dr. Helena Marsh"}
        adminRole="Platform Administrator"
        pendingApprovals={0}
        notifCount={3}
        isGuest={isGuest}
        onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
        onNav={sharedNavHandler}
        topBarLeft={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setUploadRoute(false)}
              className="flex items-center gap-1.5 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
              style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
              <ArrowLeft size={13} strokeWidth={1.5} /> Templates
            </button>
            <span className="text-[#DCD4C2] text-xs">/</span>
            <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Upload Design</span>
          </div>
        }
      >
        <UploadDesignScreen
          onBack={() => setUploadRoute(false)}
          onCreateTemplate={(backgroundImage, backgroundImageAspectRatio) => {
            const newT: CertTemplate = {
              id: `t${Date.now()}`,
              name: "New Template",
              usageCount: 0,
              isDefault: false,
              accent: "#E2A23B",
              createdAt: "Just now",
              fields: DEFAULT_FIELDS.map(f => ({ ...f })),
              backgroundImage,
              backgroundImageAspectRatio,
            };
            setTemplates(prev => [...prev, newT]);
            setUploadRoute(false);
            setEditingTemplate(newT);
          }}
        />
      </AdminAppShell>
    );
  }

  if (editingTemplate) {
    return (
      <AdminAppShell
        activeNav="admin-templates"
        adminName={profile?.fullName ?? "Dr. Helena Marsh"}
        adminRole="Platform Administrator"
        pendingApprovals={0}
        notifCount={3}
        isGuest={isGuest}
        onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
        onNav={sharedNavHandler}
        topBarLeft={<span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Certificate Templates</span>}
      >
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onBack={() => setEditingTemplate(null)}
          isGuest={isGuest}
        />
      </AdminAppShell>
    );
  }

  const showSourceModal = sourceChoice === "pending";

  return (
    <AdminAppShell
      activeNav="admin-templates"
      adminName={profile?.fullName ?? "Dr. Helena Marsh"}
      adminRole="Platform Administrator"
      pendingApprovals={0}
      notifCount={3}
      isGuest={isGuest}
      onLogOut={() => { void signOutUser(); onNavigate("admin-login"); }}
      onNav={sharedNavHandler}
      topBarLeft={
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onNavigate("admin-dashboard")}
            className="flex items-center gap-1.5 text-[12px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
            style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
            <ArrowLeft size={13} strokeWidth={1.5} /> Dashboard
          </button>
          <span className="text-[#DCD4C2] text-xs">/</span>
          <span className="text-[13px] font-semibold text-[#1E1B16]" style={F}>Certificate Templates</span>
          <span className="text-[9px] px-2 py-[3px] rounded-full border border-[#DCD4C2] text-[#6B6355]"
            style={M}>{templates.length} templates</span>
        </div>
      }
      topBarActions={
        <button type="button" onClick={handleCreate}
          disabled={isGuest}
          className="flex items-center gap-2 px-4 py-[7px] rounded-[6px] text-[12px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
          <Plus size={13} strokeWidth={2} /> Create Template
        </button>
      }
    >
      <main className="flex-1 overflow-auto bg-[#F6F1E7]" style={dotGrid}>
        <div className="px-4 sm:px-8 py-8">

          <div className="flex items-center justify-between mb-5">
            <div className="text-[8px] tracking-widest uppercase text-[#6B6355]" style={M}>
              All Templates · {templates.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[9px]" style={{ ...M, color:"#9C8E7E" }}>
                <Star size={9} className="text-[#E2A23B]" fill="#E2A23B" /> Default template is used for all new events
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {templates.map((t, i) => (
              <motion.div key={t.id}
                layout
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.2, delay:i * 0.04 }}
                className="bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] overflow-hidden group hover:border-[#1E1B16]/25 transition-colors">

                <div className="relative p-4 pb-3 bg-[#F0EDE4] border-b border-[#DCD4C2]"
                  style={{ backgroundImage:"radial-gradient(circle, rgba(30,27,22,0.06) 1px, transparent 1px)", backgroundSize:"16px 16px" }}>
                  <TemplateThumbnail template={t} scale={0.62} />
                  {t.isDefault && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-[3px] rounded-full"
                      style={{ background:"#E2A23B", border:"1px solid rgba(30,27,22,0.15)" }}>
                      <Star size={8} fill="#1E1B16" strokeWidth={0} />
                      <span className="text-[8px] font-semibold tracking-[0.06em] uppercase" style={{ ...M, color:"#1E1B16" }}>Default</span>
                    </div>
                  )}
                  <button type="button"
                    onClick={() => setPreviewId(t.id)}
                    className="absolute inset-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[5px]"
                    style={{ background:"rgba(30,27,22,0.04)" }}>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FCFAF3] border border-[#DCD4C2] rounded-full text-[10px] text-[#1E1B16] font-medium"
                      style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                      <EyeIcon size={10} strokeWidth={1.75} /> Preview
                    </span>
                  </button>
                </div>

                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#1E1B16] truncate mb-0.5"
                        style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>{t.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px]" style={{ ...M, color:"#9C8E7E" }}>
                          Used {t.usageCount}× · Created {t.createdAt}
                        </span>
                      </div>
                    </div>
                    <TemplateOverflowMenu
                      template={t}
                      onEdit={() => setEditingTemplate(t)}
                      onSetDefault={() => handleSetDefault(t.id)}
                      onDuplicate={() => handleDuplicate(t.id)}
                      onDelete={() => handleDelete(t.id)}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EDE7DA]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-[rgba(30,27,22,0.1)] flex-shrink-0"
                        style={{ background:t.accent }} />
                      <span className="text-[9px]" style={{ ...M, color:"#9C8E7E" }}>Accent</span>
                    </div>
                    <span className="text-[#EDE7DA]">·</span>
                    <span className="text-[9px]" style={{ ...M, color:"#9C8E7E" }}>
                      {t.fields.filter(f => f.enabled).length} fields active
                    </span>
                    <button type="button"
                      onClick={() => setEditingTemplate(t)}
                      className="ml-auto flex items-center gap-1 text-[10px] text-[#6B6355] hover:text-[#1E1B16] transition-colors"
                      style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                      <Pencil size={10} strokeWidth={1.75} /> Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </main>

      <AnimatePresence>
        {previewTemplate && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.15 }}
            onClick={() => setPreviewId(null)}>
            <div className="absolute inset-0 bg-[#1E1B16]/40" />
            <motion.div
              initial={{ scale:0.94, y:12 }} animate={{ scale:1, y:0 }} exit={{ scale:0.94, y:12 }}
              transition={{ duration:0.2, ease:"easeOut" }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 flex flex-col gap-3 items-center">
              <TemplateThumbnail template={previewTemplate} scale={1.55} />
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium" style={{ ...F, color:"#F6F1E7" }}>
                  {previewTemplate.name}
                </span>
                <button type="button"
                  onClick={() => { setEditingTemplate(previewTemplate); setPreviewId(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition-opacity hover:opacity-85"
                  style={{ background:"#E2A23B", color:"#1E1B16", fontFamily:"'Public Sans',system-ui,sans-serif" }}>
                  <Pencil size={11} strokeWidth={2} /> Edit template
                </button>
                <button type="button" onClick={() => setPreviewId(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close preview">
                  <X size={16} strokeWidth={1.75} color="#F6F1E7" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSourceModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.15 }}
            onClick={() => setSourceChoice(null)}>
            <div className="absolute inset-0 bg-[#1E1B16]/40" />
            <motion.div
              initial={{ scale:0.95, y:8 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:8 }}
              transition={{ duration:0.18, ease:"easeOut" }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 bg-[#FCFAF3] border border-[#DCD4C2] rounded-[10px] overflow-hidden"
              style={{ width:480, boxShadow:"0 8px 32px rgba(30,27,22,0.14)" }}>
              <div className="px-6 py-5 border-b border-[#DCD4C2] flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold text-[#1E1B16]" style={F}>Create Template</div>
                  <div className="text-[11px] mt-0.5" style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#9C8E7E" }}>
                    Choose a starting point
                  </div>
                </div>
                <button type="button" onClick={() => setSourceChoice(null)}
                  aria-label="Close"
                  className="p-1.5 rounded-[5px] hover:bg-[#EDE7DA] transition-colors">
                  <X size={14} strokeWidth={1.75} className="text-[#6B6355]" />
                </button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                <button type="button"
                  onClick={() => confirmCreate("scratch")}
                  className="group flex flex-col gap-3 p-5 rounded-[8px] border border-[#DCD4C2] bg-[#F6F1E7] hover:border-[#E2A23B] hover:bg-[rgba(226,162,59,0.04)] transition-colors text-left">
                  <div className="w-9 h-9 rounded-[7px] border border-[#DCD4C2] bg-[#FCFAF3] flex items-center justify-center group-hover:border-[#E2A23B] transition-colors">
                    <LayoutTemplate size={16} strokeWidth={1.5} style={{ color:"#6B6355" }} />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#1E1B16] mb-1"
                      style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>Design from scratch</div>
                    <div className="text-[10px] leading-snug" style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#9C8E7E" }}>
                      Use the Fieldbook-generated layout with accent color, seal, and field order controls.
                    </div>
                  </div>
                </button>
                <button type="button"
                  onClick={() => confirmCreate("upload")}
                  className="group flex flex-col gap-3 p-5 rounded-[8px] border border-[#DCD4C2] bg-[#F6F1E7] hover:border-[#E2A23B] hover:bg-[rgba(226,162,59,0.04)] transition-colors text-left">
                  <div className="w-9 h-9 rounded-[7px] border border-[#DCD4C2] bg-[#FCFAF3] flex items-center justify-center group-hover:border-[#E2A23B] transition-colors">
                    <Upload size={16} strokeWidth={1.5} style={{ color:"#6B6355" }} />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#1E1B16] mb-1"
                      style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>Upload your own design</div>
                    <div className="text-[10px] leading-snug" style={{ fontFamily:"'Public Sans',system-ui,sans-serif", color:"#9C8E7E" }}>
                      Upload a PNG or JPG and freely position fields on top of your design.
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminAppShell>
  );
}
