// "머지" 캐릭터 아바타 — 순수 인라인 SVG (이미지 로딩 없음, 어떤 크기에서도 선명)
type Expression = "neutral" | "happy" | "warm" | "think";

const BODY = "#fdfcf9";
const LINE = "#e0dbcd";
const EAR = "#4d7fd4";
const FACE = "#26251f";
const CHEEK = "#ef9fb6";

function TableBlock({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x} y={y} width={22} height={15} rx={4} fill={EAR} />
      <rect x={x + 2} y={y + 2} width={18} height={11} rx={1.5} fill="none" stroke="#fff" strokeWidth={1.1} opacity={0.65} />
      {[7.33, 14.67].map((c) => (
        <line key={c} x1={x + c} y1={y + 2} x2={x + c} y2={y + 13} stroke="#fff" strokeWidth={1.1} opacity={0.65} />
      ))}
      {[5.5, 9.5].map((r) => (
        <line key={r} x1={x + 2} y1={y + r} x2={x + 20} y2={y + r} stroke="#fff" strokeWidth={1.1} opacity={0.65} />
      ))}
    </>
  );
}

function Body() {
  return (
    <>
      <ellipse cx={60} cy={122} rx={34} ry={5} fill="#000" opacity={0.07} />
      <g transform="rotate(-13 40 34)">
        <TableBlock x={30} y={2} />
        <TableBlock x={30} y={18} />
      </g>
      <g transform="rotate(13 80 34)">
        <TableBlock x={68} y={2} />
        <TableBlock x={68} y={18} />
      </g>
      <rect x={40} y={106} width={14} height={12} rx={6} fill={FACE} />
      <rect x={66} y={106} width={14} height={12} rx={6} fill={FACE} />
      <rect x={16} y={30} width={88} height={80} rx={30} fill={BODY} stroke={LINE} strokeWidth={2.5} />
    </>
  );
}

function Face({ expression }: { expression: Expression }) {
  if (expression === "happy") {
    return (
      <>
        <path d="M33 72 q8 -11 16 0" fill="none" stroke={FACE} strokeWidth={4.5} strokeLinecap="round" />
        <path d="M71 72 q8 -11 16 0" fill="none" stroke={FACE} strokeWidth={4.5} strokeLinecap="round" />
        <ellipse cx={30} cy={90} rx={7.5} ry={5.5} fill={CHEEK} />
        <ellipse cx={90} cy={90} rx={7.5} ry={5.5} fill={CHEEK} />
        <path d="M47 87 q13 17 26 0" fill="none" stroke={FACE} strokeWidth={5} strokeLinecap="round" />
      </>
    );
  }
  if (expression === "warm") {
    return (
      <>
        <path d="M35 74 q6 6 12 0" fill="none" stroke={FACE} strokeWidth={4.5} strokeLinecap="round" />
        <path d="M73 74 q6 6 12 0" fill="none" stroke={FACE} strokeWidth={4.5} strokeLinecap="round" />
        <ellipse cx={30} cy={90} rx={7} ry={5} fill={CHEEK} opacity={0.85} />
        <ellipse cx={90} cy={90} rx={7} ry={5} fill={CHEEK} opacity={0.85} />
        <path d="M49 89 q11 9 22 0" fill="none" stroke={FACE} strokeWidth={4.5} strokeLinecap="round" />
      </>
    );
  }
  if (expression === "think") {
    return (
      <>
        <ellipse cx={44} cy={71} rx={6} ry={8} fill={FACE} />
        <ellipse cx={82} cy={71} rx={6} ry={8} fill={FACE} />
        <circle cx={46.5} cy={67} r={1.8} fill="#fff" />
        <circle cx={84.5} cy={67} r={1.8} fill="#fff" />
        <circle cx={60} cy={90} r={5} fill="none" stroke={FACE} strokeWidth={4} />
        <text x={98} y={50} fontWeight={700} fontSize={22} textAnchor="middle" fill={FACE} opacity={0.55}>?</text>
      </>
    );
  }
  return (
    <>
      <ellipse cx={41} cy={74} rx={6} ry={8} fill={FACE} />
      <ellipse cx={79} cy={74} rx={6} ry={8} fill={FACE} />
      <circle cx={43.5} cy={70} r={1.8} fill="#fff" />
      <circle cx={81.5} cy={70} r={1.8} fill="#fff" />
      <path d="M53 91 q7 5 14 0" fill="none" stroke={FACE} strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx={30} cy={90} rx={7.5} ry={5.5} fill={CHEEK} opacity={0.9} />
      <ellipse cx={90} cy={90} rx={7.5} ry={5.5} fill={CHEEK} opacity={0.9} />
    </>
  );
}

export default function MergeAvatar({
  expression = "neutral",
  size = 28,
  className = "",
}: {
  expression?: Expression;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 130"
      width={size}
      height={Math.round((size * 130) / 120)}
      className={className}
      aria-hidden="true"
    >
      <Body />
      <Face expression={expression} />
    </svg>
  );
}
