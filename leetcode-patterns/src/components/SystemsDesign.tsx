import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Network, Plus, Trash2 } from "lucide-react";
import { chapters, type Chapter } from "../data/systemsDesign";

// eslint-disable-next-line react-refresh/only-export-components -- hash parser shared with App routing
export function parseSystemsDesignChapterId(hash: string): string | null {
  const m = /^#systems-design(?:\/([a-z0-9-]+))?/.exec(hash);
  if (!m) return null;
  const id = m[1];
  if (!id) return chapters[0].id;
  return chapters.some((c) => c.id === id) ? id : chapters[0].id;
}

function chapterFromId(id: string): Chapter {
  return chapters.find((c) => c.id === id) ?? chapters[0];
}

type FlowItem =
  | { id: string; kind: "subhead"; text: string }
  | { id: string; kind: "diagram"; src: string }
  | { id: string; kind: "note"; text: string; saved?: boolean; open?: boolean };

type SectionState = {
  id: string;
  title: string;
  open: boolean;
  items: FlowItem[];
  aiNotes: string[];
  /** localStorage key part for this section's submitted notes. */
  noteKey: string;
  terms: string[];
  sourceHref: string;
};

type RemoteItem = { kind: "subhead"; text: string } | { kind: "diagram"; src: string };

type RemoteChapter = {
  id: string;
  title: string;
  sections: { title: string; items: RemoteItem[] }[];
};

let itemSeq = 0;
function nextId(prefix: string) {
  itemSeq += 1;
  return `${prefix}-${itemSeq}`;
}

function noteItem(open = false): FlowItem {
  return { id: nextId("note"), kind: "note", text: "", open };
}

// Submitted notes live in this browser only, keyed by chapter/section.
const NOTES_KEY = "leetcards:sd:notes";

function readNotes(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}") as Record<string, string[]>;
  } catch {
    return {};
  }
}

function persistNotes(noteKey: string, items: FlowItem[]) {
  const texts = items.flatMap((item) => (item.kind === "note" && item.saved ? [item.text] : []));
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify({ ...readNotes(), [noteKey]: texts }));
  } catch {
    /* storage unavailable: the note still shows for this visit */
  }
}

function savedNoteItems(noteKey: string): FlowItem[] {
  return (readNotes()[noteKey] ?? []).map(
    (text): FlowItem => ({ id: nextId("note"), kind: "note", text, saved: true })
  );
}

function decorate(
  chapter: Chapter,
  title: string,
  items: FlowItem[]
): SectionState {
  const source = chapter.sections.find((section) => section.title === title);
  const noteKey = `${chapter.id}/${source?.id ?? title}`;
  const saved = savedNoteItems(noteKey);
  return {
    id: source?.id ?? nextId("sec"),
    title,
    open: true,
    // Submitted notes sit just above the trailing empty note box.
    items: [...items.slice(0, -1), ...saved, ...items.slice(-1)],
    noteKey,
    aiNotes: source?.summary ?? [],
    terms: source?.terms ?? [],
    sourceHref: source ? `${chapter.sourceUrl}#${source.anchor}` : chapter.sourceUrl,
  };
}

function fromRemote(remote: RemoteChapter, chapter: Chapter): SectionState[] {
  return remote.sections.map((section) =>
    decorate(
      chapter,
      section.title,
      [
        ...section.items.map((item): FlowItem =>
          item.kind === "subhead"
            ? { id: nextId("sub"), kind: "subhead", text: item.text }
            : { id: nextId("fig"), kind: "diagram", src: item.src }
        ),
        noteItem(),
      ]
    )
  );
}

function fromStatic(chapter: Chapter): SectionState[] {
  return chapter.sections.map((section) =>
    decorate(chapter, section.title, [
      ...section.subsections.map(
        (text): FlowItem => ({ id: nextId("sub"), kind: "subhead", text })
      ),
      noteItem(),
    ])
  );
}

function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = list.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

const iconBtn =
  "inline-flex items-center justify-center rounded-full p-1 text-slate-500 hover:bg-slate-900/10 hover:text-cyan-700 cursor-pointer disabled:opacity-30 disabled:pointer-events-none";

export function SystemsDesign({ initialChapterId }: { initialChapterId?: string | null }) {
  const [chapterId, setChapterId] = useState(() =>
    initialChapterId && chapters.some((c) => c.id === initialChapterId)
      ? initialChapterId
      : parseSystemsDesignChapterId(window.location.hash) ?? chapters[0].id
  );
  const [drafts, setDrafts] = useState<Record<string, SectionState[]>>({});
  const [remote, setRemote] = useState<Record<string, SectionState[]> | null>(null);
  const chapter = chapterFromId(chapterId);
  const staticSections = useMemo(() => fromStatic(chapter), [chapter]);
  const sections = drafts[chapterId] ?? remote?.[chapterId] ?? staticSections;

  // Follow the parent when it points at a different chapter (adjusted during render, no effect).
  const [seenInitial, setSeenInitial] = useState(initialChapterId);
  if (initialChapterId !== seenInitial) {
    setSeenInitial(initialChapterId);
    if (initialChapterId && chapters.some((c) => c.id === initialChapterId)) {
      setChapterId(initialChapterId);
    }
  }

  useEffect(() => {
    const onHash = () => {
      const next = parseSystemsDesignChapterId(window.location.hash);
      if (next) setChapterId(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/sd-context.json")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ chapters: RemoteChapter[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        const mapped: Record<string, SectionState[]> = {};
        for (const ch of data.chapters) {
          const local = chapters.find((chapter) => chapter.id === ch.id);
          if (local && ch.sections.length > 0) mapped[ch.id] = fromRemote(ch, local);
        }
        setRemote(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function selectChapter(id: string) {
    setChapterId(id);
    window.history.replaceState(null, "", `#systems-design/${id}`);
  }

  function commit(next: SectionState[]) {
    setDrafts((prev) => ({ ...prev, [chapterId]: next }));
  }

  function updateSection(index: number, patch: Partial<SectionState>) {
    commit(sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function updateItem(sectionIndex: number, itemIndex: number, patch: Partial<FlowItem>) {
    const section = sections[sectionIndex];
    const items = section.items.map((item, i) =>
      i === itemIndex ? ({ ...item, ...patch } as FlowItem) : item
    );
    updateSection(sectionIndex, { items });
  }

  function submitNote(sectionIndex: number, itemIndex: number) {
    const section = sections[sectionIndex];
    const items = section.items.map((item, i) =>
      i === itemIndex && item.kind === "note" ? { ...item, text: item.text.trim(), saved: true } : item
    );
    persistNotes(section.noteKey, items);
    updateSection(sectionIndex, { items });
  }

  return (
    <div className="flex items-start gap-6">
      <aside className="hidden md:block w-64 shrink-0 sticky top-20 max-h-[calc(100vh-96px)] overflow-y-auto bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-2xl border border-slate-900/10 p-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chapters</h2>
        <div className="space-y-0.5">
          {chapters.map((c, i) => (
            <div key={c.id}>
              <button
                onClick={() => selectChapter(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                  c.id === chapter.id
                    ? "bg-cyan-100 text-cyan-700"
                    : "text-slate-700 hover:bg-slate-900/5"
                }`}
              >
                <span className="font-mono text-xs text-slate-500 w-5 shrink-0">{i + 1}</span>
                <span className="font-medium truncate">{c.title}</span>
              </button>
              {c.id === chapter.id && (
                <div className="ml-7 my-1 border-l border-slate-900/10">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        document.getElementById(`sd-${s.id}`)?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="block w-full text-left px-3 py-1 text-xs text-slate-600 hover:text-cyan-700 truncate cursor-pointer transition-colors"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Network className="text-cyan-600" size={28} />
            Systems Design
          </h1>
          <p className="text-slate-700 text-sm">
            Section headers and diagrams, in reading order. Edit or reorder anything here — it stays in this tab.
          </p>
        </div>

        <div className="md:hidden flex gap-1.5 flex-wrap mb-4">
          {chapters.map((c) => (
            <button
              key={c.id}
              onClick={() => selectChapter(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                c.id === chapter.id
                  ? "bg-cyan-100 text-cyan-700"
                  : "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-xl font-bold text-slate-900">{chapter.title}</h2>
          <button
            type="button"
            onClick={() => {
              const fresh = remote?.[chapterId] ?? staticSections;
              commit(structuredClone(fresh));
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 sm:bg-slate-100/70 border border-slate-900/10 rounded-full text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer"
          >
            Reset order
          </button>
        </div>

        <div className="space-y-3">
          {sections.map((section, sectionIndex) => (
            <section
              key={section.id}
              id={`sd-${section.id}`}
              className="scroll-mt-20 bg-white/85 sm:bg-white/65 backdrop-blur-2xl rounded-2xl border border-slate-900/10"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  aria-expanded={section.open}
                  onClick={() => updateSection(sectionIndex, { open: !section.open })}
                  className={iconBtn}
                >
                  <ChevronDown
                    size={16}
                    className={section.open ? "rotate-180 transition-transform" : "transition-transform"}
                  />
                </button>
                <input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-lg font-bold text-slate-900 outline-none border-b border-transparent focus:border-cyan-500/40"
                />
                <a
                  href={section.sourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-600 hover:bg-slate-900/10 hover:text-cyan-700"
                >
                  Source
                  <ExternalLink size={10} />
                </a>
                <button
                  type="button"
                  aria-label="Move section up"
                  disabled={sectionIndex === 0}
                  onClick={() => commit(move(sections, sectionIndex, -1))}
                  className={iconBtn}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Move section down"
                  disabled={sectionIndex === sections.length - 1}
                  onClick={() => commit(move(sections, sectionIndex, 1))}
                  className={iconBtn}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {section.terms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {section.terms.map((term) => (
                    <span
                      key={term}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              )}

              {section.open && (
                <div className="px-4 pb-4 space-y-3">
                  {section.aiNotes.length > 0 && (
                    <details className="group rounded-xl border border-slate-900/10 bg-slate-900/5 px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
                        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                        Note
                        <span className="font-mono font-normal normal-case tracking-normal">
                          {section.aiNotes.length}
                        </span>
                      </summary>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {section.aiNotes.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {section.items.map((item, itemIndex) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <div className="flex flex-col pt-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={itemIndex === 0}
                          onClick={() =>
                            updateSection(sectionIndex, {
                              items: move(section.items, itemIndex, -1),
                            })
                          }
                          className={iconBtn}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={itemIndex === section.items.length - 1}
                          onClick={() =>
                            updateSection(sectionIndex, {
                              items: move(section.items, itemIndex, 1),
                            })
                          }
                          className={iconBtn}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        {item.kind === "subhead" && (
                          <input
                            value={item.text}
                            onChange={(e) =>
                              updateItem(sectionIndex, itemIndex, { text: e.target.value })
                            }
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none border-b border-transparent focus:border-cyan-500/40"
                          />
                        )}
                        {item.kind === "diagram" && (
                          <div
                            className="rounded-xl border border-slate-900/10 p-3 overflow-x-auto"
                            style={{ background: "#f4f4f5" }}
                          >
                            <img
                              src={item.src}
                              alt=""
                              className="mx-auto max-h-[520px] w-auto max-w-full"
                            />
                          </div>
                        )}
                        {item.kind === "note" && (
                          <details
                            open={item.open ?? false}
                            onToggle={(e) => {
                              const open = e.currentTarget.open;
                              if (open !== (item.open ?? false)) updateItem(sectionIndex, itemIndex, { open });
                            }}
                            className="group rounded-xl border border-slate-900/10 bg-slate-900/5 px-3 py-2"
                          >
                            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
                              <ChevronDown size={14} className="shrink-0 transition-transform group-open:rotate-180" />
                              <span className="shrink-0">
                                Note {section.items.slice(0, itemIndex + 1).filter((i) => i.kind === "note").length}
                              </span>
                              {item.saved && (
                                <span className="truncate font-normal normal-case tracking-normal group-open:hidden">
                                  {item.text}
                                </span>
                              )}
                            </summary>
                            {item.saved ? (
                              <div className="mt-2">
                                <p className="whitespace-pre-wrap text-sm text-slate-800">{item.text}</p>
                                <button
                                  type="button"
                                  onClick={() => updateItem(sectionIndex, itemIndex, { saved: false })}
                                  className="mt-1 text-xs text-slate-500 hover:text-cyan-700 cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <textarea
                                  value={item.text}
                                  onChange={(e) =>
                                    updateItem(sectionIndex, itemIndex, { text: e.target.value })
                                  }
                                  onKeyDown={(e) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && item.text.trim()) {
                                      e.preventDefault();
                                      submitNote(sectionIndex, itemIndex);
                                    }
                                  }}
                                  rows={3}
                                  placeholder="Add Notes"
                                  className="w-full resize-y rounded-lg border border-slate-900/10 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-500/40"
                                />
                                <div className="mt-1.5 flex items-center justify-end gap-3">
                                  <span className="text-[11px] text-slate-500">⌘/Ctrl + Enter</span>
                                  <button
                                    type="button"
                                    disabled={!item.text.trim()}
                                    onClick={() => submitNote(sectionIndex, itemIndex)}
                                    className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-medium text-white hover:bg-cyan-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                                  >
                                    Submit
                                  </button>
                                </div>
                              </div>
                            )}
                          </details>
                        )}
                      </div>

                      {item.kind !== "subhead" && (
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => {
                            const items = section.items.filter((_, i) => i !== itemIndex);
                            persistNotes(section.noteKey, items);
                            updateSection(sectionIndex, { items });
                          }}
                          className={iconBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      updateSection(sectionIndex, { items: [...section.items, noteItem(true)] })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-900/10 hover:text-cyan-700 cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Notes
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
