import { useMemo, useState, type KeyboardEvent } from "react";
import { ArrowLeftRight, Copy, FileCode, Check } from "lucide-react";

// Experimental: live, client-side Python -> TypeScript translator.
// Line-based heuristic (regex + an indentation stack for braces) — no server,
// no network, zero latency. Tuned for LeetCode-style, single-statement Python.
// Real AST fidelity would need tree-sitter-python (WASM); intentionally out of
// scope for this experimental view.

const SAMPLE = `def two_sum(nums, target):
    # find indices of two numbers adding to target
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []

class Counter:
    def __init__(self, start=0):
        self.count = start

    def inc(self):
        self.count += 1
        print(f"count is now {self.count}")
        return self.count
`;

// Python format spec -> TS. Only the common numeric case is supported:
// f"{x:.2f}" -> `${x.toFixed(2)}`. Anything else, the spec is dropped.
function applyFormatSpec(expr: string, spec: string): string {
  const m = spec.match(/\.(\d+)f$/);
  if (!m) return expr;
  const needsParen = /[^\w.[\]]/.test(expr);
  return `${needsParen ? `(${expr})` : expr}.toFixed(${m[1]})`;
}

// Split an f-string replacement field into its expression and format spec,
// respecting bracket depth so `d[k:v]` isn't mistaken for a spec. Also strips
// conversion flags (!r/!s/!a) since JS has no equivalent.
function splitFormatSpec(field: string): { expr: string; spec: string } {
  let depth = 0;
  for (let i = 0; i < field.length; i++) {
    const c = field[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (depth === 0 && c === ":") {
      return { expr: field.slice(0, i), spec: field.slice(i + 1) };
    } else if (depth === 0 && c === "!" && /[rsa]/.test(field[i + 1] ?? "")) {
      return { expr: field.slice(0, i), spec: "" };
    }
  }
  return { expr: field, spec: "" };
}

// f"a {expr} b" -> `a ${expr} b`. Handles {{ }} escapes, nested braces, and
// recursively converts each embedded expression's idioms.
function fStringToTemplate(body: string): string {
  let out = "`";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === "{") {
      if (body[i + 1] === "{") {
        out += "{";
        i++;
        continue;
      }
      let depth = 1;
      let field = "";
      i++;
      while (i < body.length && depth > 0) {
        if (body[i] === "{") depth++;
        else if (body[i] === "}") {
          depth--;
          if (depth === 0) break;
        }
        field += body[i];
        i++;
      }
      const { expr, spec } = splitFormatSpec(field);
      out += "${" + applyFormatSpec(convertExpr(expr.trim()), spec) + "}";
    } else if (c === "}" && body[i + 1] === "}") {
      out += "}";
      i++;
    } else if (c === "`" || c === "$" || c === "\\") {
      out += "\\" + c;
    } else {
      out += c;
    }
  }
  return out + "`";
}

function convertExpr(e: string): string {
  if (e == null) return e;
  let s = e;

  // Pull every string literal out into a placeholder BEFORE running the idiom
  // replacements, so `and`/`in`/`is`/etc. inside strings are never corrupted.
  // f-strings are converted to template literals on the way out.
  const literals: string[] = [];
  const stash = (text: string) => {
    literals.push(text);
    return `${literals.length - 1}`;
  };
  s = s.replace(/\bf"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, b) =>
    stash(fStringToTemplate(b))
  );
  s = s.replace(/\bf'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, b) =>
    stash(fStringToTemplate(b))
  );
  s = s.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m) => stash(m));
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (m) => stash(m));

  // Operators/keywords — order matters: longer forms before the bare ones.
  s = s.replace(/\bis not\b/g, "!==");
  s = s.replace(/([\w.[\]]+)\s+not in\s+([\w.[\]()]+)/g, "!$2.includes($1)");
  s = s.replace(/([\w.[\]]+)\s+in\s+([\w.[\]()]+)/g, "$2.includes($1)");
  s = s.replace(/\bis\b/g, "===");
  s = s.replace(/\band\b/g, "&&");
  s = s.replace(/\bor\b/g, "||");
  s = s.replace(/\bnot\s+/g, "!");
  s = s
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");
  s = s.replace(/\blen\(([^()]*)\)/g, "$1.length");
  s = s.replace(/\bstr\(([^()]*)\)/g, "String($1)");
  s = s.replace(/\bint\(([^()]*)\)/g, "parseInt($1)");
  s = s.replace(/\bfloat\(([^()]*)\)/g, "parseFloat($1)");
  s = s.replace(/\bself\./g, "this.");
  s = s.replace(/([\w.)\]]+)\s*\/\/\s*([\w.([]+)/g, "Math.floor($1 / $2)");

  // Restore the stashed literals.
  s = s.replace(/(\d+)/g, (_, i) => literals[Number(i)]);
  return s;
}

function paramList(params: string): string {
  return params
    .split(",")
    .map((p) => {
      p = p.trim();
      if (!p) return "";
      if (p === "self") return null;
      const m = p.match(/^(\w+)\s*=\s*(.+)$/);
      if (m) return `${m[1]} = ${convertExpr(m[2])}`;
      return p;
    })
    .filter((x) => x !== null && x !== "")
    .join(", ");
}

type Block = { indent: number; type: string };

export function translate(src: string): string {
  const lines = src.replace(/\t/g, "    ").split("\n");
  const out: string[] = [];
  const stack: Block[] = [];

  const indentOf = (line: string) => (line.match(/^(\s*)/)?.[1].length ?? 0);

  for (const raw of lines) {
    if (raw.trim() === "") {
      out.push("");
      continue;
    }
    const ind = indentOf(raw);
    const line = raw.trim();

    while (stack.length && stack[stack.length - 1].indent >= ind) {
      const blk = stack.pop()!;
      out.push(" ".repeat(blk.indent) + "}");
    }
    const pad = " ".repeat(ind);
    let m: RegExpMatchArray | null;

    if (line.startsWith("#")) {
      out.push(pad + "//" + line.slice(1));
      continue;
    }

    if ((m = line.match(/^class\s+(\w+)\s*(\(([^)]*)\))?\s*:$/))) {
      const ext = m[3] && m[3].trim() ? ` extends ${m[3].trim()}` : "";
      out.push(pad + `class ${m[1]}${ext} {`);
      stack.push({ indent: ind, type: "class" });
      continue;
    }

    if ((m = line.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*(->\s*[^:]+)?:$/))) {
      const name = m[1];
      const params = paramList(m[2]);
      const insideClass = stack.some((s) => s.type === "class");
      if (name === "__init__" && insideClass) {
        out.push(pad + `constructor(${params}) {`);
      } else if (insideClass) {
        out.push(pad + `${name}(${params}) {`);
      } else {
        out.push(pad + `function ${name}(${params}) {`);
      }
      stack.push({ indent: ind, type: "def" });
      continue;
    }

    if ((m = line.match(/^for\s+(\w+)\s+in\s+range\(([^)]*)\)\s*:$/))) {
      const v = m[1];
      const argsR = m[2].split(",").map((a) => convertExpr(a.trim()));
      let start = "0";
      let stop = "0";
      let step = "1";
      if (argsR.length === 1) stop = argsR[0];
      else if (argsR.length === 2) {
        start = argsR[0];
        stop = argsR[1];
      } else {
        start = argsR[0];
        stop = argsR[1];
        step = argsR[2];
      }
      const cmp = step.startsWith("-") ? ">" : "<";
      const inc = step === "1" ? `${v}++` : `${v} += ${step}`;
      out.push(pad + `for (let ${v} = ${start}; ${v} ${cmp} ${stop}; ${inc}) {`);
      stack.push({ indent: ind, type: "for" });
      continue;
    }

    if (
      (m = line.match(/^for\s+(\w+)\s*,\s*(\w+)\s+in\s+enumerate\(([^)]*)\)\s*:$/))
    ) {
      out.push(
        pad + `for (const [${m[1]}, ${m[2]}] of ${convertExpr(m[3])}.entries()) {`
      );
      stack.push({ indent: ind, type: "for" });
      continue;
    }

    if ((m = line.match(/^for\s+(\w+)\s+in\s+(.+):$/))) {
      out.push(pad + `for (const ${m[1]} of ${convertExpr(m[2])}) {`);
      stack.push({ indent: ind, type: "for" });
      continue;
    }

    if ((m = line.match(/^while\s+(.+):$/))) {
      out.push(pad + `while (${convertExpr(m[1])}) {`);
      stack.push({ indent: ind, type: "while" });
      continue;
    }

    if ((m = line.match(/^if\s+(.+):$/))) {
      out.push(pad + `if (${convertExpr(m[1])}) {`);
      stack.push({ indent: ind, type: "if" });
      continue;
    }
    if ((m = line.match(/^elif\s+(.+):$/))) {
      out.push(pad + `} else if (${convertExpr(m[1])}) {`);
      stack.push({ indent: ind, type: "if" });
      continue;
    }
    if (line === "else:") {
      out.push(pad + `} else {`);
      stack.push({ indent: ind, type: "else" });
      continue;
    }

    if ((m = line.match(/^return\b\s*(.*)$/))) {
      out.push(pad + `return ${convertExpr(m[1])};`.replace(/\s+;$/, ";"));
      continue;
    }

    if (line === "pass") {
      out.push(pad + "// pass");
      continue;
    }
    if (line === "break") {
      out.push(pad + "break;");
      continue;
    }
    if (line === "continue") {
      out.push(pad + "continue;");
      continue;
    }

    if ((m = line.match(/^print\((.*)\)$/))) {
      out.push(pad + `console.log(${convertExpr(m[1])});`);
      continue;
    }

    if ((m = line.match(/^(.+?)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/))) {
      const lhsRaw = m[1].trim();
      const lhs = convertExpr(lhsRaw);
      const op = m[2];
      const rhs = convertExpr(m[3].trim());
      if (op === "=") {
        const bare = /^[a-zA-Z_]\w*$/.test(lhsRaw);
        out.push(pad + (bare ? `let ${lhs} = ${rhs};` : `${lhs} = ${rhs};`));
      } else {
        out.push(pad + `${lhs} ${op} ${rhs};`);
      }
      continue;
    }

    out.push(pad + convertExpr(line) + ";");
  }

  while (stack.length) {
    const blk = stack.pop()!;
    out.push(" ".repeat(blk.indent) + "}");
  }

  return out.join("\n");
}

export function Py2TsTranslator() {
  const [python, setPython] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const typescript = useMemo(() => translate(python), [python]);

  async function handleCopy() {
    await navigator.clipboard.writeText(typescript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  // Keep Tab inside the editor (insert a tab char) instead of moving focus.
  // translate() normalizes tabs to 4 spaces for indentation counting.
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: start, selectionEnd: end } = ta;
    const next = python.slice(0, start) + "\t" + python.slice(end);
    setPython(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 1;
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ArrowLeftRight size={22} className="text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">Python → TypeScript</h2>
        <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          Experimental
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Converts as you type. A line-based regex engine walks each line and
        keeps an indentation → brace stack; f-strings become template literals,
        and string contents are stashed so idiom swaps never corrupt them.
        Tuned for LeetCode-style logic — multi-line expressions and
        comprehensions aren&apos;t covered yet.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Python
            </span>
            <button
              onClick={() => setPython(SAMPLE)}
              className="ml-auto text-xs text-gray-500 hover:text-indigo-600 cursor-pointer"
            >
              Load sample
            </button>
          </div>
          <textarea
            value={python}
            onChange={(e) => setPython(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-full h-[28rem] p-4 font-mono text-[13px] leading-relaxed text-gray-800 resize-none outline-none [tab-size:4]"
            placeholder="Paste Python here…"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              TypeScript
            </span>
            <button
              onClick={handleCopy}
              className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={13} /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="w-full h-[28rem] p-4 font-mono text-[13px] leading-relaxed text-gray-800 overflow-auto m-0">
            <code>{typescript}</code>
          </pre>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <FileCode size={13} />
        Built with React + lucide-react. Translation engine is hand-rolled
        regex — no parser, WASM, or runtime library; nothing leaves the browser.
      </div>
    </div>
  );
}
