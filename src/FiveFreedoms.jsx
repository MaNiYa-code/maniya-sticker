import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import logoSrc from "./assets/maniya-logo.png";
import { T } from "./brand.js";

// ---- typography: deliberately different from the rounded Zen Maru Gothic
// used on the sticker page — an editorial serif system (newspaper-like)
// so this page reads as its own thing, not a reskinned template. ----
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,600;1,700&family=Dancing+Script:wght@600;700&display=swap";
const FAM_JA = '"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif';
const FAM_EN = '"Playfair Display", "Shippori Mincho", serif';
const FAM_SCRIPT = '"Dancing Script", "Shippori Mincho", cursive';

// ---- content: UK Five Freedoms, checklist items ----
const FREEDOMS = [
  {
    numeral: "I",
    titleJa: "飢えと渇きからの自由",
    titleEn: "Freedom from Hunger and Thirst",
    lede:
      "空腹でも喉が渇いてもいない状態。新鮮な水と、健康を保つための適切な食事が、いつでも手に入ることが基本です。",
    items: [
      { ja: "いつでも新鮮な水を飲める場所がある", en: "Fresh, clean water is available at all times" },
      { ja: "年齢・健康状態・活動量に合った食事を毎日与えている", en: "Diet suited to age, health and activity level, given daily" },
      { ja: "食欲や体重の変化を定期的にチェックしている", en: "Appetite and body weight are checked regularly" },
      { ja: "食器や水入れが清潔に保たれている", en: "Food and water containers are kept clean" },
    ],
  },
  {
    numeral: "II",
    titleJa: "不快からの自由",
    titleEn: "Freedom from Discomfort",
    lede:
      "適切な環境で過ごせること。気温、寝床、スペース——身体的にも精神的にも、無理のない暮らしの土台をつくります。",
    items: [
      { ja: "適切な温度・湿度で過ごせる環境がある", en: "Environment kept at an appropriate temperature and humidity" },
      { ja: "清潔で乾いた寝床・休息スペースがある", en: "A clean, dry resting area is provided" },
      { ja: "直射日光や雨風を避けられる場所がある", en: "Shelter from direct sun, rain and wind is available" },
      { ja: "体格に見合った十分な広さが確保されている", en: "Enough space for the animal's size is secured" },
    ],
  },
  {
    numeral: "III",
    titleJa: "痛み・怪我・病気からの自由",
    titleEn: "Freedom from Pain, Injury or Disease",
    lede:
      "予防と早期発見、そして迅速な対応。小さな異変を見逃さない日々の観察が、痛みや病気からその子を守ります。",
    items: [
      { ja: "定期的な健康チェック・体調観察を行っている", en: "Regular health checks and condition monitoring" },
      { ja: "異変があればすぐ動物病院に相談できる体制がある", en: "Prompt access to veterinary advice when something seems wrong" },
      { ja: "必要なワクチン接種・予防医療を行っている", en: "Necessary vaccinations and preventive care are up to date" },
      { ja: "ケガの原因になる危険物が生活空間にない", en: "Living space is free of hazards that could cause injury" },
    ],
  },
  {
    numeral: "IV",
    titleJa: "正常な行動を発現する自由",
    titleEn: "Freedom to Express Normal Behaviour",
    lede:
      "その動物らしくいられること。運動、探索、遊び——種として自然な行動ができる十分な環境と機会が必要です。",
    items: [
      { ja: "毎日十分な運動・遊びの時間がある", en: "Sufficient daily exercise and play time" },
      { ja: "その動物種らしい行動(爪とぎ・穴掘り・探索など)ができる環境がある", en: "Environment allows species-typical behaviours" },
      { ja: "単独/群れなど、その子に合った過ごし方ができている", en: "Living arrangement suits the individual animal" },
      { ja: "十分な刺激・気分転換ができる工夫がある", en: "Enough enrichment and mental stimulation is provided" },
    ],
  },
  {
    numeral: "V",
    titleJa: "恐怖や苦悩からの自由",
    titleEn: "Freedom from Fear and Distress",
    lede:
      "精神的な安心。恐怖やストレスの原因を減らし、逃げ場や落ち着ける場所を用意することが、心の健康を守ります。",
    items: [
      { ja: "過度な音・光・混雑などのストレス要因を避けられる", en: "Excessive noise, light or crowding can be avoided" },
      { ja: "安心して隠れられる・落ち着ける場所がある", en: "A safe place to hide or settle is available" },
      { ja: "見知らぬ人・動物との接触は無理なく段階的に行っている", en: "Contact with unfamiliar people/animals is gradual, not forced" },
      { ja: "恐怖や不安のサイン(震え、逃避行動など)を見逃さず対応している", en: "Signs of fear or anxiety are noticed and addressed" },
    ],
  },
];

const TOTAL_ITEMS = FREEDOMS.reduce((s, f) => s + f.items.length, 0);

function hashCode(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h << 5) + h + str.charCodeAt(i);
  return Math.abs(h);
}
function certNumber(seed) {
  return `MNY-${hashCode(seed).toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`;
}

// ---------- checklist item ----------
function ChecklistItem({ ja, en, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        width: "100%",
        textAlign: "left",
        background: "none",
        border: "none",
        borderTop: `1px solid ${T.line}`,
        padding: "16px 2px",
        cursor: "pointer",
        fontFamily: FAM_JA,
      }}
    >
      <span
        style={{
          flex: "0 0 auto",
          width: 22,
          height: 22,
          marginTop: 2,
          border: `1.5px solid ${checked ? T.alert : T.ink}`,
          background: checked ? T.alert : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        {checked ? "✓" : ""}
      </span>
      <span>
        <span
          style={{
            display: "block",
            fontSize: 16,
            color: T.ink,
            textDecoration: checked ? `line-through ${T.sub}` : "none",
            opacity: checked ? 0.6 : 1,
          }}
        >
          {ja}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: FAM_EN,
            fontStyle: "italic",
            fontSize: 13,
            color: T.sub,
            marginTop: 3,
          }}
        >
          {en}
        </span>
      </span>
    </button>
  );
}

// ---------- ornamental helpers ----------
function drawSparkle(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx + size * 0.15, cy - size * 0.15, cx + size, cy);
  ctx.quadraticCurveTo(cx + size * 0.15, cy + size * 0.15, cx, cy + size);
  ctx.quadraticCurveTo(cx - size * 0.15, cy + size * 0.15, cx - size, cy);
  ctx.quadraticCurveTo(cx - size * 0.15, cy - size * 0.15, cx, cy - size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFrameTicks(ctx, x, y, w, h, spacing, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  const drawTick = (cx, cy) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
  };
  for (let px = x + spacing / 2; px < x + w; px += spacing) {
    drawTick(px, y);
    drawTick(px, y + h);
  }
  for (let py = y + spacing / 2; py < y + h; py += spacing) {
    drawTick(x, py);
    drawTick(x + w, py);
  }
  ctx.restore();
}

function drawCornerOrnament(ctx, x, y, sx, sy, color) {
  // two nested arcs plus a small diamond, oriented into the given corner
  ctx.save();
  ctx.strokeStyle = color;
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI / 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(46, 0);
  ctx.lineTo(52, 6);
  ctx.lineTo(46, 12);
  ctx.lineTo(40, 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 46);
  ctx.lineTo(6, 52);
  ctx.lineTo(12, 46);
  ctx.lineTo(6, 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSeal(ctx, cx, cy, r, color, ink) {
  ctx.save();
  // scalloped rosette edge
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 18;
  for (let i = 0; i < spikes; i++) {
    const a1 = (i / spikes) * Math.PI * 2;
    const a2 = ((i + 0.5) / spikes) * Math.PI * 2;
    const rOut = r * 1.08;
    const rIn = r * 0.92;
    ctx.lineTo(cx + Math.cos(a1) * rOut, cy + Math.sin(a1) * rOut);
    ctx.lineTo(cx + Math.cos(a2) * rIn, cy + Math.sin(a2) * rIn);
  }
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = "#fff8ec";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.32, cy);
  ctx.lineTo(cx - r * 0.08, cy + r * 0.24);
  ctx.lineTo(cx + r * 0.34, cy - r * 0.26);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = `700 13px ${FAM_EN}`;
  try {
    ctx.letterSpacing = "1px";
  } catch {
    /* noop */
  }
  ctx.fillText("COMPLETE", cx, cy + r * 0.52);
  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* noop */
  }
  ctx.restore();
}

// ---------- certificate canvas ----------
function drawCertificate(canvas, { petName, ownerName, logo, dateStr, certNo }) {
  const W = 1600,
    H = 1132;
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = T.cream;
  ctx.fillRect(0, 0, W, H);

  // ornate double frame with a ticked band between the rules
  const m = 46;
  ctx.strokeStyle = T.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(m + 30, m + 30, W - (m + 30) * 2, H - (m + 30) * 2);
  drawFrameTicks(ctx, m + 14, m + 14, W - (m + 14) * 2, H - (m + 14) * 2, 30, 3, T.accent);

  [
    [m, m, 1, 1],
    [W - m, m, -1, 1],
    [m, H - m, 1, -1],
    [W - m, H - m, -1, -1],
  ].forEach(([x, y, sx, sy]) => drawCornerOrnament(ctx, x, y, sx, sy, T.accent));

  ctx.textAlign = "center";

  try {
    ctx.letterSpacing = "5px";
  } catch {
    /* not all browsers support letterSpacing on canvas */
  }
  ctx.fillStyle = T.sub;
  ctx.font = `600 20px ${FAM_EN}`;
  ctx.fillText("SPECIAL EDITION · CERTIFICATE OF ACHIEVEMENT", W / 2, 112);

  if (logo) {
    const lh = 56;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, W / 2 - lw / 2, 130, lw, lh);
  }

  ctx.fillStyle = T.ink;
  ctx.font = `900 88px ${FAM_EN}`;
  ctx.fillText("CERTIFICATE", W / 2, 300);
  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* noop */
  }
  ctx.font = `700 36px ${FAM_JA}`;
  ctx.fillText("「５つの自由」達成認定証", W / 2, 348);

  drawSparkle(ctx, W / 2 - 300, 268, 12, T.accent);
  drawSparkle(ctx, W / 2 + 300, 268, 12, T.accent);

  // ornamental rule with diamond
  ctx.strokeStyle = T.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 220, 384);
  ctx.lineTo(W / 2 - 14, 384);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 220, 384);
  ctx.lineTo(W / 2 + 14, 384);
  ctx.stroke();
  ctx.fillStyle = T.alert;
  ctx.beginPath();
  ctx.moveTo(W / 2, 376);
  ctx.lineTo(W / 2 + 8, 384);
  ctx.lineTo(W / 2, 392);
  ctx.lineTo(W / 2 - 8, 384);
  ctx.closePath();
  ctx.fill();

  try {
    ctx.letterSpacing = "3px";
  } catch {
    /* noop */
  }
  ctx.fillStyle = T.sub;
  ctx.font = `600 20px ${FAM_EN}`;
  ctx.fillText("THIS CERTIFICATE IS PROUDLY PRESENTED TO / これは、", W / 2, 438);
  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* noop */
  }

  const name = petName?.trim() || "きみ";
  ctx.fillStyle = T.ink;
  const nameSize = name.length > 10 ? 62 : name.length > 6 ? 76 : 94;
  ctx.font = `700 ${nameSize}px ${FAM_SCRIPT}`;
  ctx.fillText(name, W / 2, 520);
  const nameWidth = ctx.measureText(name).width;
  ctx.strokeStyle = T.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameWidth / 2 - 30, 542);
  ctx.lineTo(W / 2 + nameWidth / 2 + 30, 542);
  ctx.stroke();

  ctx.fillStyle = T.sub;
  ctx.font = `500 24px ${FAM_JA}`;
  ctx.fillText("が、下記「５つの自由」の基準をすべて満たしていることを、", W / 2, 588);
  ctx.fillText("MaNiYa はここに証します。", W / 2, 620);

  // five freedom badges
  const labels = ["Hunger", "Discomfort", "Pain", "Behaviour", "Fear"];
  const bw = 210;
  const startX = W / 2 - (bw * 5) / 2 + bw / 2;
  const by = 700;
  for (let i = 0; i < 5; i++) {
    const cx = startX + i * bw;
    ctx.beginPath();
    ctx.arc(cx, by, 36, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = T.ink;
    ctx.stroke();

    ctx.fillStyle = T.ink;
    ctx.font = `700 24px ${FAM_EN}`;
    ctx.fillText(FREEDOMS[i].numeral, cx, by - 3);

    ctx.strokeStyle = T.alert;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 11, by + 15);
    ctx.lineTo(cx - 3, by + 23);
    ctx.lineTo(cx + 13, by + 5);
    ctx.stroke();

    ctx.fillStyle = T.sub;
    ctx.font = `italic 500 14px ${FAM_EN}`;
    ctx.fillText(labels[i], cx, by + 58);
  }

  // two-signature layout with a gold seal between them
  const sigY = 900;
  const leftX = W / 2 - 340;
  const rightX = W / 2 + 340;

  ctx.font = `700 34px ${FAM_SCRIPT}`;
  ctx.fillStyle = T.ink;
  const checker = ownerName?.trim();
  if (checker) {
    ctx.fillText(checker, leftX, sigY - 14);
  }
  ctx.strokeStyle = T.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX - 150, sigY);
  ctx.lineTo(leftX + 150, sigY);
  ctx.stroke();
  ctx.font = `500 16px ${FAM_EN}`;
  ctx.fillStyle = T.sub;
  ctx.fillText("CHECKED BY / 確認者", leftX, sigY + 26);

  ctx.font = `700 34px ${FAM_SCRIPT}`;
  ctx.fillStyle = T.ink;
  ctx.fillText("MaNiYa Editorial", rightX, sigY - 14);
  ctx.strokeStyle = T.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightX - 150, sigY);
  ctx.lineTo(rightX + 150, sigY);
  ctx.stroke();
  ctx.font = `500 16px ${FAM_EN}`;
  ctx.fillStyle = T.sub;
  ctx.fillText("ISSUED BY / 発行", rightX, sigY + 26);

  drawSeal(ctx, W / 2, sigY - 40, 58, T.accent, T.ink);

  // date / cert no row
  ctx.font = `500 20px ${FAM_JA}`;
  ctx.fillStyle = T.sub;
  ctx.textAlign = "left";
  ctx.fillText(`発行日 / Date：${dateStr}`, m + 90, 1000);
  ctx.textAlign = "right";
  ctx.fillText(`証書番号 / No.：${certNo}`, W - m - 90, 1000);
  ctx.textAlign = "center";

  // footer small print
  ctx.fillStyle = T.sub;
  ctx.font = `italic 400 16px ${FAM_EN}`;
  ctx.fillText(
    "Issued by MaNiYa · Based on the Five Freedoms, UK Farm Animal Welfare Council (FAWC), 1979",
    W / 2,
    1050
  );
}

// ---------- main component ----------
export default function FiveFreedoms() {
  const [checked, setChecked] = useState(() => FREEDOMS.map((f) => f.items.map(() => false)));
  const [petName, setPetName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
  const [logoImg, setLogoImg] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONT_LINK;
    document.head.appendChild(l);
    const loads = [
      '900 88px "Playfair Display"',
      '600 20px "Playfair Display"',
      '500 16px "Playfair Display"',
      '700 94px "Dancing Script"',
      '700 34px "Dancing Script"',
      '700 36px "Shippori Mincho"',
      '500 24px "Shippori Mincho"',
    ];
    if (document.fonts) {
      Promise.all([document.fonts.ready, ...loads.map((f) => document.fonts.load(f).catch(() => {}))]).then(() =>
        setFontsReady(true)
      );
      const t = setTimeout(() => setFontsReady((v) => (!v ? true : v)), 2500);
      return () => clearTimeout(t);
    } else setFontsReady(true);
  }, []);

  useEffect(() => {
    const im = new Image();
    im.onload = () => setLogoImg(im);
    im.src = logoSrc;
  }, []);

  const totalChecked = checked.reduce((s, arr) => s + arr.filter(Boolean).length, 0);
  const unlocked = totalChecked === TOTAL_ITEMS;

  const toggle = (fi, ii) =>
    setChecked((prev) => prev.map((arr, i) => (i === fi ? arr.map((v, j) => (j === ii ? !v : v)) : arr)));

  const dateStr = useMemo(
    () => new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }),
    []
  );
  const certNo = useMemo(() => certNumber(`${petName}|${ownerName}|${dateStr}`), [petName, ownerName, dateStr]);

  const redraw = useCallback(() => {
    if (unlocked && canvasRef.current) {
      drawCertificate(canvasRef.current, { petName, ownerName, logo: logoImg, dateStr, certNo });
    }
  }, [unlocked, petName, ownerName, logoImg, dateStr, certNo, fontsReady]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const download = () => {
    if (!canvasRef.current) return;
    const filename = `five-freedoms-certificate_${petName || "pet"}.png`;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename });
          return;
        } catch (err) {
          if (err && err.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const todayLine = useMemo(
    () => new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase(),
    []
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink, fontFamily: FAM_JA }}>
      {/* masthead */}
      <header style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: FAM_EN,
            fontSize: 12,
            letterSpacing: "0.08em",
            color: T.sub,
          }}
        >
          <span>{todayLine}</span>
          <span>PET WELFARE EDITION</span>
        </div>
        <div style={{ borderTop: `3px solid ${T.ink}`, marginTop: 10 }} />
        <div style={{ borderTop: `1px solid ${T.ink}`, marginTop: 3 }} />

        <div style={{ textAlign: "center", padding: "20px 0 6px" }}>
          <img src={logoSrc} alt="MaNiYa" style={{ height: 58, margin: "0 auto" }} />
          <p
            style={{
              fontFamily: FAM_EN,
              fontStyle: "italic",
              fontSize: 15,
              letterSpacing: "0.03em",
              color: T.sub,
              margin: "10px 0 0",
            }}
          >
            英国発「５つの自由」診断 — The Five Freedoms of Animal Welfare
          </p>
        </div>

        <div style={{ borderTop: `1px solid ${T.ink}`, marginTop: 14 }} />
        <nav
          className="ff-nav"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px 22px",
            padding: "10px 0",
            fontSize: 13,
            fontFamily: FAM_EN,
            letterSpacing: "0.05em",
            color: T.ink,
          }}
        >
          <a href="#intro" style={{ color: T.ink, textDecoration: "none", whiteSpace: "nowrap" }}>
            ① 5つの自由とは
          </a>
          <span style={{ color: T.line }}>|</span>
          <a href="#checklist" style={{ color: T.ink, textDecoration: "none", whiteSpace: "nowrap" }}>
            ② チェックリスト
          </a>
          <span style={{ color: T.line }}>|</span>
          <a href="#certificate" style={{ color: T.ink, textDecoration: "none", whiteSpace: "nowrap" }}>
            ③ 認定証を発行
          </a>
          <span style={{ color: T.line }}>|</span>
          <Link to="/" style={{ color: T.alert, textDecoration: "none", whiteSpace: "nowrap" }}>
            ← ステッカーへ
          </Link>
        </nav>
        <div style={{ borderTop: `1px solid ${T.ink}` }} />
      </header>

      {/* sticky progress ticker */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: T.ink,
          color: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "9px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: FAM_EN,
            fontSize: 12,
            letterSpacing: "0.06em",
          }}
        >
          <span style={{ flex: "0 0 auto" }}>{unlocked ? "✓ COMPLETE" : "PROGRESS"}</span>
          <span style={{ display: "flex", gap: 3, flex: "0 0 auto" }}>
            {Array.from({ length: TOTAL_ITEMS }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  background: i < totalChecked ? T.alert : "rgba(255,255,255,0.28)",
                }}
              />
            ))}
          </span>
          <span style={{ flex: "0 0 auto", opacity: 0.85 }}>
            {totalChecked} / {TOTAL_ITEMS}
          </span>
        </div>
      </div>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        {/* lede article */}
        <section id="intro" style={{ paddingTop: 36 }}>
          <p
            style={{
              fontFamily: FAM_EN,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: T.alert,
              borderBottom: `2px solid ${T.alert}`,
              display: "inline-block",
              paddingBottom: 3,
              margin: 0,
            }}
          >
            ANIMAL WELFARE · 動物福祉
          </p>
          <h1
            style={{
              fontFamily: FAM_JA,
              fontWeight: 800,
              fontSize: "clamp(28px, 5vw, 42px)",
              lineHeight: 1.4,
              margin: "16px 0 10px",
            }}
          >
            その子は、ちゃんと幸せに暮らせていますか。
          </h1>
          <p
            style={{
              fontFamily: FAM_EN,
              fontStyle: "italic",
              fontSize: 17,
              color: T.sub,
              lineHeight: 1.7,
              margin: "0 0 14px",
            }}
          >
            1979年、英国の家畜福祉委員会(FAWC)が提唱した「Five Freedoms(５つの自由)」という考え方を、
            ペットショップと一般の飼い主のために、MaNiYaがチェックリストにしました。
          </p>
          <p
            style={{
              fontFamily: FAM_EN,
              fontSize: 12,
              letterSpacing: "0.04em",
              color: T.sub,
              margin: "0 0 24px",
              borderTop: `1px solid ${T.line}`,
              borderBottom: `1px solid ${T.line}`,
              padding: "8px 0",
            }}
          >
            By MaNiYa Editorial · Source: UK Farm Animal Welfare Council (FAWC), 1979
          </p>

          <div
            className="ff-lede-columns"
            style={{ columnCount: 2, columnGap: 32, fontSize: 15.5, lineHeight: 1.95 }}
          >
            <p className="ff-lede-body" style={{ margin: "0 0 16px" }}>
              「５つの自由」はもともと、1965年に英国で家畜の飼育状況を調査した「ブランベル報告書」に端を発し、
              1979年にFAWCによって五つの原則としてまとめられました。今では犬や猫などのコンパニオンアニマルの
              福祉を考えるうえでも、世界的に広く使われる基本の物差しになっています。
            </p>
            <p style={{ margin: "0 0 16px" }}>
              飢えと渇き、不快、痛みや病気、正常な行動、そして恐怖や苦悩——。この５つの「〜からの自由」が
              すべて満たされているとき、動物はストレスの少ない、健やかな状態にあると考えられます。
              特別な知識がなくても、日々のお世話をひとつずつ振り返るだけで確認できるのが、この考え方の
              いいところです。
            </p>
          </div>

          <blockquote
            style={{
              float: "right",
              width: 240,
              margin: "4px 0 20px 24px",
              padding: "16px 18px",
              border: `1px solid ${T.ink}`,
              fontFamily: FAM_EN,
              fontStyle: "italic",
              fontSize: 15,
              lineHeight: 1.6,
              color: T.ink,
            }}
          >
            “Freedom from hunger and thirst, discomfort, pain, injury or disease, fear and distress,
            and freedom to express normal behaviour.”
            <footer style={{ marginTop: 10, fontSize: 12, fontStyle: "normal", color: T.sub }}>
              — FAWC, 1979
            </footer>
          </blockquote>

          <p style={{ fontSize: 15.5, lineHeight: 1.95, margin: "0 0 8px" }}>
            以下のチェックリストは、ペットショップのスタッフや、一般の飼い主のみなさんが、自分たちの
            飼育環境をセルフチェックするためのものです。全{TOTAL_ITEMS}項目をすべて達成すると、
            MaNiYaから特別な認定証を発行できます。
          </p>
        </section>

        {/* checklist sections */}
        <section id="checklist" style={{ paddingTop: 40 }}>
          <div style={{ borderTop: `3px solid ${T.ink}`, marginBottom: 4 }} />
          <div style={{ borderTop: `1px solid ${T.ink}`, marginBottom: 30 }} />

          {FREEDOMS.map((f, fi) => {
            const reversed = fi % 2 === 1;
            const sectionChecked = checked[fi].filter(Boolean).length;
            return (
              <article key={f.numeral} style={{ marginBottom: 52 }}>
                <div
                  className="ff-numeral-row"
                  style={{
                    display: "flex",
                    flexDirection: reversed ? "row-reverse" : "row",
                    gap: 22,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      flex: "0 0 auto",
                      fontFamily: FAM_EN,
                      fontStyle: "italic",
                      fontWeight: 900,
                      fontSize: 76,
                      lineHeight: 1,
                      color: T.alert,
                      opacity: 0.9,
                    }}
                  >
                    {f.numeral}
                  </div>
                  <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: FAM_EN,
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        color: T.sub,
                        margin: "6px 0 2px",
                      }}
                    >
                      {f.titleEn.toUpperCase()} · {sectionChecked}/{f.items.length}
                    </p>
                    <h2
                      style={{
                        fontFamily: FAM_JA,
                        fontWeight: 700,
                        fontSize: 26,
                        margin: "0 0 12px",
                      }}
                    >
                      {f.titleJa}
                    </h2>
                    <p className="ff-section-intro" style={{ fontSize: 15, lineHeight: 1.85, margin: "0 0 6px" }}>
                      {f.lede}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {f.items.map((item, ii) => (
                    <ChecklistItem
                      key={ii}
                      ja={item.ja}
                      en={item.en}
                      checked={checked[fi][ii]}
                      onToggle={() => toggle(fi, ii)}
                    />
                  ))}
                  <div style={{ borderTop: `1px solid ${T.line}` }} />
                </div>
              </article>
            );
          })}
        </section>

        {/* certificate */}
        <section id="certificate" style={{ paddingTop: 10 }}>
          <div style={{ borderTop: `3px solid ${T.ink}`, marginBottom: 4 }} />
          <div style={{ borderTop: `1px solid ${T.ink}`, marginBottom: 26 }} />

          <p
            style={{
              fontFamily: FAM_EN,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: T.alert,
              margin: "0 0 10px",
            }}
          >
            SPECIAL NOTICE
          </p>
          <h2
            style={{
              fontFamily: FAM_JA,
              fontWeight: 800,
              fontSize: "clamp(24px, 4vw, 32px)",
              margin: "0 0 20px",
            }}
          >
            認定証の発行 — Certificate of Completion
          </h2>

          {!unlocked ? (
            <div
              style={{
                border: `1.5px dashed ${T.sub}`,
                padding: "32px 24px",
                textAlign: "center",
                color: T.sub,
              }}
            >
              <p style={{ fontFamily: FAM_EN, fontStyle: "italic", fontSize: 16, margin: "0 0 8px" }}>
                Not yet available
              </p>
              <p style={{ fontSize: 15, margin: 0 }}>
                あと <strong style={{ color: T.alert, fontSize: 20 }}>{TOTAL_ITEMS - totalChecked}</strong>{" "}
                項目チェックすると、MaNiYa認定「５つの自由」達成証を発行できます。
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 15, lineHeight: 1.8, margin: "0 0 22px" }}>
                すべての項目を達成しました。おめでとうございます。お名前を入力して、証明書を作成してください。
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 24,
                }}
                className="ff-form-grid"
              >
                <label style={{ display: "block" }}>
                  <div style={{ fontFamily: FAM_EN, fontSize: 12, letterSpacing: "0.05em", color: T.sub, marginBottom: 6 }}>
                    ペットの名前 / PET NAME (必須)
                  </div>
                  <input
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    maxLength={14}
                    placeholder="モコ"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: FAM_JA,
                      fontSize: 17,
                      padding: "8px 2px",
                      border: "none",
                      borderBottom: `1.5px solid ${T.ink}`,
                      background: "transparent",
                      color: T.ink,
                      outline: "none",
                    }}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <div style={{ fontFamily: FAM_EN, fontSize: 12, letterSpacing: "0.05em", color: T.sub, marginBottom: 6 }}>
                    飼い主・店舗名 / CHECKED BY (任意)
                  </div>
                  <input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    maxLength={20}
                    placeholder="〇〇ペットショップ"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: FAM_JA,
                      fontSize: 17,
                      padding: "8px 2px",
                      border: "none",
                      borderBottom: `1.5px solid ${T.ink}`,
                      background: "transparent",
                      color: T.ink,
                      outline: "none",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  border: `1px solid ${T.line}`,
                  padding: 16,
                  marginBottom: 18,
                }}
              >
                <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>

              <button
                type="button"
                onClick={download}
                disabled={!petName.trim()}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "16px 20px",
                  fontFamily: FAM_EN,
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "0.08em",
                  color: petName.trim() ? "#fff" : T.sub,
                  background: petName.trim() ? T.alert : T.line,
                  border: `1.5px solid ${petName.trim() ? T.alert : T.line}`,
                  cursor: petName.trim() ? "pointer" : "not-allowed",
                }}
                onMouseOver={(e) => petName.trim() && (e.currentTarget.style.background = T.alertDark)}
                onMouseOut={(e) => petName.trim() && (e.currentTarget.style.background = T.alert)}
              >
                証明書を保存する (PNG) — DOWNLOAD CERTIFICATE
              </button>
              {!petName.trim() && (
                <p style={{ fontSize: 12, color: T.sub, textAlign: "center", marginTop: 8 }}>
                  ペットの名前を入力すると保存できます
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <footer
        style={{
          borderTop: `1px solid ${T.ink}`,
          padding: "24px 24px 40px",
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.8, margin: "0 0 12px" }}>
          MaNiYa GAZETTE · 本ページの内容は一般的な目安であり、獣医療アドバイスに代わるものではありません。
          体調に異変がある場合は、速やかにかかりつけの動物病院にご相談ください。
        </p>
        <Link to="/" style={{ fontFamily: FAM_EN, fontSize: 13, color: T.alert, textDecoration: "none" }}>
          ← うちの子レスキューステッカーを作る
        </Link>
      </footer>

      <style>{`
        .ff-lede-body::first-letter, .ff-section-intro::first-letter {
          float: left;
          font-family: ${FAM_EN};
          font-style: italic;
          font-weight: 900;
          color: ${T.alert};
          line-height: 0.8;
          padding-right: 6px;
        }
        .ff-lede-body::first-letter { font-size: 64px; padding-top: 6px; }
        .ff-section-intro::first-letter { font-size: 40px; padding-top: 3px; }
        @media (max-width: 720px) {
          .ff-lede-columns { column-count: 1 !important; }
          .ff-numeral-row { flex-direction: column !important; }
          .ff-numeral-row > div:first-child { font-size: 52px !important; }
          .ff-form-grid { grid-template-columns: 1fr !important; }
          blockquote { float: none !important; width: auto !important; margin: 20px 0 !important; }
        }
        button:focus-visible, input:focus-visible, a:focus-visible {
          outline: 3px solid ${T.accent};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
