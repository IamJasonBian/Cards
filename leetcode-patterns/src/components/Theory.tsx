import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark as BookmarkIcon,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  Sigma,
  X,
} from "lucide-react";
import { theoryDocs, type TheoryDoc, type TheoryDocId } from "../data/theoryBooks";
import { apiUrl } from "../lib/api";

// Mirrors server/storage.ts TheoryBookmark (server code is outside the app's
// tsconfig, so the shape is redeclared here).
interface TheoryBookmark {
  id: string;
  docId: string;
  page: number;
  label: string;
  createdAt: number;
}

type TheoryLink = {
  label: string;
  url: string;
};

type TheoryResource = {
  title: string;
  description: string;
  links: TheoryLink[];
  // When set, the first link's PDF gets the reader: chapter jumps, page
  // bookmarks, inline preview, and shareable #theory/{docId}/{page} links.
  doc?: TheoryDoc;
};

const resources: TheoryResource[] = [
  {
    title: "SICP — JavaScript Edition",
    description:
      "Structure and Interpretation of Computer Programs, JS adaptation (Abelson & Sussman, adapted by Henz & Wrigstad). Abstraction, recursion, state, streams, interpreters, and compilers — the recursion/DP chapters map straight onto interview patterns.",
    links: [
      { label: "PDF", url: theoryDocs["sicp-js"].pdfUrl },
      { label: "Interactive edition — sourceacademy.org", url: "https://sourceacademy.org/sicpjs/index" },
    ],
    doc: theoryDocs["sicp-js"],
  },
  {
    title: "Designing Data-Intensive Applications",
    description:
      "Martin Kleppmann (O'Reilly, 2017). Replication, partitioning, transactions, consensus, batch and stream processing — the system-design interview canon.",
    links: [
      { label: "PDF", url: theoryDocs["ddia"].pdfUrl },
      { label: "Official site — dataintensive.net", url: "https://dataintensive.net/" },
    ],
    doc: theoryDocs["ddia"],
  },
  {
    title: "OG NP 300 List",
    description:
      "Computers and Intractability, Garey & Johnson (1979) - appendix ~300 known T(n) = O(n^k) problems",
    links: [
      {
        label: "PDF",
        url: "/garey-johnson-appendix-np-list.pdf",
      },
      {
        label: "Backup — Internet Archive",
        url: "https://archive.org/details/computersintract0000gare",
      },
      {
        label: "Backup — Open Library",
        url: "https://openlibrary.org/works/OL4295313W/Computers_and_Intractability",
      },
    ],
    doc: theoryDocs["garey-johnson-np-appendix"],
  },
  {
    title: "SAT proof",
    description:
      "The Cook–Levin theorem: Boolean satisfiability is NP-complete — the proof that started it all.",
    links: [
      {
        label: "SAT proof",
        url: "https://en.wikipedia.org/wiki/Cook%E2%80%93Levin_theorem",
      },
    ],
  },
];

// ---- Site deep links: #theory/{docId}/{page} ----
function parseTheoryHash(): { docId: TheoryDocId; page: number } | null {
  const m = window.location.hash.match(/^#theory\/([a-z0-9-]+)\/(\d+)$/);
  if (!m) return null;
  const doc = (theoryDocs as Record<string, TheoryDoc>)[m[1]];
  if (!doc) return null;
  return {
    docId: doc.docId as TheoryDocId,
    page: Math.min(Math.max(1, Number(m[2])), doc.pages),
  };
}

// ---- Bookmark persistence ----
// Server is the source of truth (per-visitor via the anonymous user cookie);
// localStorage is a read cache + offline fallback so bookmarks still work when
// the backend is cold or cookies are blocked. Offline-created bookmarks get a
// `local-` id and are never sent to the DELETE endpoint.
function cacheKey(docId: string): string {
  return `theory-bookmarks:${docId}`;
}

function loadCache(docId: string): TheoryBookmark[] {
  try {
    const raw = localStorage.getItem(cacheKey(docId));
    return raw ? (JSON.parse(raw) as TheoryBookmark[]) : [];
  } catch {
    return [];
  }
}

function saveCache(docId: string, list: TheoryBookmark[]): void {
  try {
    localStorage.setItem(cacheKey(docId), JSON.stringify(list));
  } catch {
    // storage full/blocked — cache is best-effort
  }
}

function useBookmarks(docId: string) {
  const [bookmarks, setBookmarks] = useState<TheoryBookmark[]>(() => loadCache(docId));
  // True once a server call has failed — new saves live only in localStorage.
  const [deviceOnly, setDeviceOnly] = useState(false);

  function update(fn: (prev: TheoryBookmark[]) => TheoryBookmark[]) {
    setBookmarks((prev) => {
      const next = fn(prev);
      saveCache(docId, next);
      return next;
    });
  }

  useEffect(() => {
    let alive = true;
    fetch(apiUrl(`/api/theory/bookmarks?docId=${encodeURIComponent(docId)}`), {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { bookmarks: TheoryBookmark[] }) => {
        if (!alive) return;
        setDeviceOnly(false);
        // Server list wins; keep offline-created chips that never synced.
        update((prev) => [
          ...data.bookmarks,
          ...prev.filter((b) => b.id.startsWith("local-")),
        ]);
      })
      .catch(() => {
        if (alive) setDeviceOnly(true);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  async function add(page: number, label: string): Promise<void> {
    try {
      const res = await fetch(apiUrl("/api/theory/bookmarks"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ docId, page, label }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { bookmark: TheoryBookmark };
      setDeviceOnly(false);
      update((prev) => [...prev, data.bookmark]);
    } catch {
      setDeviceOnly(true);
      update((prev) => [
        ...prev,
        {
          id: `local-${Math.random().toString(36).slice(2, 12)}`,
          docId,
          page,
          label,
          createdAt: Date.now(),
        },
      ]);
    }
  }

  function remove(id: string): void {
    update((prev) => prev.filter((b) => b.id !== id));
    if (!id.startsWith("local-")) {
      void fetch(
        apiUrl(`/api/theory/bookmarks/${encodeURIComponent(docId)}/${encodeURIComponent(id)}`),
        { method: "DELETE", credentials: "include" }
      ).catch(() => {});
    }
  }

  return { bookmarks, deviceOnly, add, remove };
}

const chipClass =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 sm:bg-slate-100/70 border border-slate-900/10 rounded-none text-xs text-slate-700 hover:bg-cyan-50 hover:border-cyan-500/30 hover:text-cyan-700 transition-colors cursor-pointer";

// Reader for one bookmarkable PDF: a controlled "current page" that chapter
// jumps, bookmarks, the page box, and the URL hash all read/write, plus an
// on-demand inline preview (browser-native viewer honors #page=N on load).
function DocReader({
  doc,
  initialPage,
  autoOpen,
}: {
  doc: TheoryDoc;
  initialPage?: number;
  autoOpen?: boolean;
}) {
  const [page, setPage] = useState(initialPage ?? 1);
  const [pageText, setPageText] = useState(String(initialPage ?? 1));
  const [previewOpen, setPreviewOpen] = useState(Boolean(autoOpen));
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { bookmarks, deviceOnly, add, remove } = useBookmarks(doc.docId);

  // Arriving via a #theory/{docId}/{page} link: bring the opened reader into view.
  useEffect(() => {
    if (autoOpen) rootRef.current?.scrollIntoView({ block: "start" });
  }, [autoOpen]);

  function jump(target: number, openPreview = true): void {
    const clamped = Math.min(Math.max(1, Math.round(target) || 1), doc.pages);
    setPage(clamped);
    setPageText(String(clamped));
    if (openPreview) setPreviewOpen(true);
    // The address bar is itself the shareable deep link.
    window.history.replaceState(null, "", `#theory/${doc.docId}/${clamped}`);
  }

  function copyPageLink(): void {
    const link = `${window.location.origin}${window.location.pathname}#theory/${doc.docId}/${page}`;
    void navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const sorted = [...bookmarks].sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);

  return (
    <div ref={rootRef} className="mt-4 border-t border-slate-900/10 pt-4">
      {/* Toolbar: chapter jump · page box · open/copy/preview */}
      <div className="flex flex-wrap items-center gap-2">
        {doc.chapters.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) jump(Number(e.target.value));
            }}
            className="px-2 py-1.5 max-w-64 bg-white/80 border border-slate-900/10 rounded-none text-xs text-slate-700 cursor-pointer"
            aria-label="Jump to chapter"
          >
            <option value="">Jump to chapter…</option>
            {doc.chapters.map((ch) => (
              <option key={`${ch.page}-${ch.title}`} value={ch.page}>
                {"\u00A0\u00A0\u00A0".repeat(ch.depth) + ch.title}
              </option>
            ))}
          </select>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            jump(Number(pageText));
          }}
          className="flex items-center gap-1 text-xs text-slate-600"
        >
          <span>Page</span>
          <input
            value={pageText}
            onChange={(e) => setPageText(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => jump(Number(pageText), previewOpen)}
            inputMode="numeric"
            className="w-14 px-1.5 py-1.5 bg-white/80 border border-slate-900/10 rounded-none text-xs text-slate-900 text-center"
            aria-label="Page number"
          />
          <span className="text-slate-400">/ {doc.pages}</span>
        </form>

        <a
          href={`${doc.pdfUrl}#page=${page}`}
          target="_blank"
          rel="noopener noreferrer"
          className={chipClass}
        >
          Open at p.{page}
          <ExternalLink size={10} className="opacity-60" />
        </a>

        <button onClick={copyPageLink} className={chipClass} title="Copy shareable link to this page">
          {copied ? <Check size={10} className="text-emerald-600" /> : <Link2 size={10} className="opacity-60" />}
          {copied ? "Copied" : "Copy link"}
        </button>

        <button
          onClick={() => setPreviewOpen((o) => !o)}
          className={chipClass}
          title={previewOpen ? "Hide the inline reader" : "Read inline at the current page"}
        >
          {previewOpen ? <EyeOff size={10} className="opacity-60" /> : <Eye size={10} className="opacity-60" />}
          {previewOpen ? "Hide reader" : "Read inline"}
        </button>
      </div>

      {/* Bookmarks: each chip is a saved page deep link */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <BookmarkIcon size={12} className="text-cyan-700" />
        {sorted.map((b) => (
          <span
            key={b.id}
            className="inline-flex items-stretch bg-slate-100/90 sm:bg-slate-100/70 border border-slate-900/10 rounded-none text-xs"
          >
            <button
              onClick={() => jump(b.page)}
              className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors cursor-pointer"
              title={`Jump to page ${b.page}`}
            >
              {b.label || `page ${b.page}`}
              <span className="text-slate-400">p.{b.page}</span>
            </button>
            <button
              onClick={() => remove(b.id)}
              className="px-1 border-l border-slate-900/10 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              title="Delete bookmark"
              aria-label={`Delete bookmark ${b.label || `page ${b.page}`}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void add(page, label.trim());
            setLabel("");
          }}
          className="inline-flex items-stretch"
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value.slice(0, 120))}
            placeholder="Label (optional)"
            className="w-32 px-2 py-1 bg-white/80 border border-slate-900/10 border-r-0 rounded-none text-xs text-slate-900 placeholder:text-slate-400"
            aria-label="Bookmark label"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100/90 sm:bg-slate-100/70 border border-slate-900/10 rounded-none text-xs text-slate-700 hover:bg-cyan-50 hover:border-cyan-500/30 hover:text-cyan-700 transition-colors cursor-pointer"
            title={`Bookmark page ${page}`}
          >
            <BookmarkIcon size={10} />
            Save p.{page}
          </button>
        </form>

        {deviceOnly && (
          <span className="text-[10px] text-amber-700">
            sync unavailable — bookmarks saved on this device
          </span>
        )}
      </div>

      {previewOpen && (
        <iframe
          // Remount per page: the native viewer only reads #page=N on load.
          key={`${doc.docId}-${page}`}
          src={`${doc.pdfUrl}#page=${page}&zoom=page-width`}
          title={`${doc.docId} PDF preview`}
          loading="lazy"
          className="mt-3 w-full h-[75vh] bg-white border border-slate-900/10"
        />
      )}
    </div>
  );
}

export function Theory() {
  // Parse #theory/{docId}/{page} once on mount; the matching card opens its
  // reader at that page and scrolls into view.
  const deepLink = useMemo(() => parseTheoryHash(), []);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Sigma className="text-cyan-600" size={28} />
          Theory
        </h1>
        <p className="text-slate-700 text-sm font-bold">
          Foundational reading — programs, data systems, and complexity. Bookmark
          pages and share deep links straight into each PDF.
        </p>
      </div>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.title}
            className="bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-none border border-slate-900/10 p-5"
          >
            <h2 className="text-xl font-bold text-slate-900">{resource.title}</h2>
            <p className="text-sm text-slate-700 mt-1 mb-4">{resource.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {resource.links.map((link) => (
                <a
                  key={link.url + link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 sm:bg-slate-100/70 border border-slate-900/10 rounded-none text-xs text-slate-700 hover:bg-cyan-50 hover:border-cyan-500/30 hover:text-cyan-700 transition-colors"
                >
                  {link.label}
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              ))}
            </div>
            {resource.doc && (
              <DocReader
                doc={resource.doc}
                initialPage={
                  deepLink?.docId === resource.doc.docId ? deepLink.page : undefined
                }
                autoOpen={deepLink?.docId === resource.doc.docId}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
