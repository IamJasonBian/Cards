import type { ReactNode, SVGProps } from "react";

// Black-and-white "pen on paper" drawing kit shared by every visualization.
// State is carried by fill and line style, never by hue:
//   idle = outline · active = hatched, heavy outline · done = solid ink · dim = dashed gray

export const INK = "#1e1e1e";
export const PAPER = "#fffdf7";
export const GRAY = "#9a9a9a";
export type Tone = "idle" | "active" | "done" | "dim";

const EASE = "350ms ease";
const HATCH = "url(#paper-hatch)";

interface ToneStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  text: string;
}

const TONES: Record<Tone, ToneStyle> = {
  idle: { fill: PAPER, stroke: INK, strokeWidth: 1.6, text: INK },
  active: { fill: HATCH, stroke: INK, strokeWidth: 3, text: INK },
  done: { fill: INK, stroke: INK, strokeWidth: 1.6, text: PAPER },
  dim: { fill: PAPER, stroke: GRAY, strokeWidth: 1.4, strokeDasharray: "5 4", text: GRAY },
};

/** Fill/stroke props for a custom shape drawn in a given tone. */
// eslint-disable-next-line react-refresh/only-export-components -- tiny helper that belongs with the kit
export function toneProps(tone: Tone): SVGProps<SVGElement> {
  const { fill, stroke, strokeWidth, strokeDasharray } = TONES[tone];
  return {
    fill,
    stroke,
    strokeWidth,
    strokeDasharray,
    strokeLinejoin: "round",
    strokeLinecap: "round",
    style: { transition: `stroke ${EASE}, stroke-width ${EASE}` },
  };
}

interface SketchProps {
  width: number;
  height: number;
  /** Accessible description of the drawing. */
  label: string;
  children: ReactNode;
}

/**
 * The drawing surface. Everything inside is nudged by a noise filter so straight
 * lines come out slightly wobbly. Use one Sketch per visualization (ids are global).
 */
export function Sketch({ width, height, label, children }: SketchProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block mx-auto w-full max-h-[58vh]"
      // Small drawings should not balloon to fill the modal.
      style={{ maxWidth: width * 1.6 }}
      role="img"
      aria-label={label}
    >
      <defs>
        <filter
          id="paper-rough"
          filterUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={width}
          height={height}
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <pattern
          id="paper-hatch"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-38)"
        >
          <rect width="7" height="7" fill={PAPER} />
          <line x1="0" y1="3.5" x2="7" y2="3.5" stroke={INK} strokeWidth="1" />
        </pattern>
        {(["idle", "dim"] as const).map((tone) => (
          <marker
            key={tone}
            id={`paper-arrow-${tone}`}
            markerWidth="12"
            markerHeight="12"
            refX="9"
            refY="6"
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M2 2 L10 6 L2 10"
              fill="none"
              stroke={TONES[tone].stroke}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        ))}
      </defs>
      <g filter="url(#paper-rough)">{children}</g>
    </svg>
  );
}

interface TextProps {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  tone?: Tone;
  anchor?: "start" | "middle" | "end";
  bold?: boolean;
}

/** Text on the sketch. A paper-colored halo keeps it readable over hatching and lines. */
export function Ink({ x, y, children, size = 16, tone = "idle", anchor = "middle", bold }: TextProps) {
  const fill = TONES[tone].text;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontSize={size}
      fontWeight={bold ? 700 : 400}
      fill={fill}
      stroke={fill === PAPER ? INK : PAPER}
      strokeWidth={fill === PAPER ? 0 : 4}
      paintOrder="stroke"
      strokeLinejoin="round"
      style={{ transition: `fill ${EASE}` }}
    >
      {children}
    </text>
  );
}

interface CellProps {
  x: number;
  y: number;
  w: number;
  h?: number;
  tone?: Tone;
  label?: ReactNode;
  /** Small gray caption under the box (an index, a weight, …). */
  sub?: ReactNode;
  size?: number;
}

/** A box with a centered label: array slot, table cell, stack item, list node. */
export function Cell({ x, y, w, h = w, tone = "idle", label, sub, size = 18 }: CellProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} {...(toneProps(tone) as SVGProps<SVGRectElement>)} />
      {label !== undefined && (
        <Ink x={x + w / 2} y={y + h / 2} size={size} tone={tone} bold={tone === "active"}>
          {label}
        </Ink>
      )}
      {sub !== undefined && (
        <Ink x={x + w / 2} y={y + h + 13} size={12} tone="dim">
          {sub}
        </Ink>
      )}
    </g>
  );
}

interface NodeProps {
  x: number;
  y: number;
  r?: number;
  tone?: Tone;
  label?: ReactNode;
  sub?: ReactNode;
}

/** A circle with a centered label: tree or graph node. */
export function Node({ x, y, r = 22, tone = "idle", label, sub }: NodeProps) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} {...(toneProps(tone) as SVGProps<SVGCircleElement>)} />
      {label !== undefined && (
        <Ink x={x} y={y} size={r * 0.8} tone={tone} bold={tone === "active"}>
          {label}
        </Ink>
      )}
      {sub !== undefined && (
        <Ink x={x} y={y + r + 13} size={12} tone="dim">
          {sub}
        </Ink>
      )}
    </g>
  );
}

interface EdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** idle = pen line, active = heavy line, dim = dashed gray. */
  tone?: Exclude<Tone, "done">;
  arrow?: boolean;
  /** Shorten both ends by this much, e.g. the radius of the nodes it connects. */
  trim?: number;
  /** Bend the line sideways by this many units (0 = straight). */
  bend?: number;
}

/** A line or arrow between two points. */
export function Edge({ x1, y1, x2, y2, tone = "idle", arrow, trim = 0, bend = 0 }: EdgeProps) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const ax = x1 + ux * trim;
  const ay = y1 + uy * trim;
  const bx = x2 - ux * trim;
  const by = y2 - uy * trim;
  const cx = (ax + bx) / 2 - uy * bend;
  const cy = (ay + by) / 2 + ux * bend;
  return (
    <path
      d={`M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`}
      fill="none"
      stroke={tone === "dim" ? GRAY : INK}
      strokeWidth={tone === "active" ? 3.2 : 1.6}
      strokeDasharray={tone === "dim" ? "5 4" : undefined}
      strokeLinecap="round"
      markerEnd={arrow ? `url(#paper-arrow-${tone === "dim" ? "dim" : "idle"})` : undefined}
      style={{ transition: `stroke ${EASE}, stroke-width ${EASE}` }}
    />
  );
}

interface PointerProps {
  /** Tip of the arrow: the spot being pointed at. */
  x: number;
  y: number;
  label: string;
  /** "down" draws the label above the tip; "up" draws it below. */
  dir?: "down" | "up";
}

/** A labeled arrow that glides to its target when x/y change. */
export function Pointer({ x, y, label, dir = "down" }: PointerProps) {
  const s = dir === "down" ? -1 : 1;
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transition: `transform 450ms ease` }}>
      <path
        d={`M 0 ${s * 20} L 0 ${s * 3} M ${-5} ${s * 10} L 0 ${s * 3} L 5 ${s * 10}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Ink x={0} y={s * 31} size={16} bold>
        {label}
      </Ink>
    </g>
  );
}
