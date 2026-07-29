import { useState, useRef, useEffect, useCallback } from "react";
import logoSrc from "./assets/maniya-logo.png";

// ---- MaNiYa brand tokens ----
const T = {
  bg: "#faf8f4",
  ink: "#33302b",
  sub: "#7d7668",
  alert: "#d7263d",
  alertDark: "#b01e31",
  cream: "#fdf1ec",
  line: "#e8e2d6",
  accent: "#f2a93b",
};

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap";
const FAM = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif';

const SPECIES = [
  { key: "dog", icon: "🐕", label: "犬", breedLabel: "犬種" },
  { key: "cat", icon: "🐈", label: "猫", breedLabel: "猫種" },
  { key: "other", icon: "🐾", label: "その他", breedLabel: "種類" },
];

const GENDERS = [
  { key: "male", label: "オス" },
  { key: "female", label: "メス" },
  { key: "unknown", label: "不明" },
];

// ---------- canvas helpers ----------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// wraps text to a max number of lines, truncating the last line with … if needed
function wrapLines(ctx, text, maxWidth, maxLines) {
  if (!text) return [];
  const chars = Array.from(text);
  const lines = [];
  let line = "";
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    const consumed = lines.slice(0, -1).join("").length + last.length;
    if (consumed < chars.length) last += "…";
    lines[maxLines - 1] = last;
  }
  return lines;
}

// ---------- canvas sticker renderer ----------
// L判 89×127mm @300dpi ≒ 1050×1500px（コンビニ写真プリント対応）
function drawSticker(canvas, s) {
  const W = 1050,
    H = 1500;
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const R = 48;
  ctx.clearRect(0, 0, W, H);
  roundRect(ctx, 0, 0, W, H, R);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0, 0, W, H, R);
  ctx.clip();

  const species = SPECIES.find((sp) => sp.key === s.species) || SPECIES[0];
  const gender = GENDERS.find((g) => g.key === s.gender) || GENDERS[2];

  // ---- header band ----
  const headH = 190;
  ctx.fillStyle = T.alert;
  ctx.fillRect(0, 0, W, headH);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.moveTo(640, headH);
  ctx.lineTo(830, 46);
  ctx.lineTo(880, 86);
  ctx.lineTo(925, 46);
  ctx.lineTo(1110, headH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `900 54px ${FAM}`;
  ctx.fillText("緊急時 ペット救助のお願い", W / 2, 82);
  ctx.font = `700 23px ${FAM}`;
  ctx.fillText("IN CASE OF EMERGENCY — PET INSIDE", W / 2, 128);
  ctx.font = `700 22px ${FAM}`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("この家に、いのちがいます", W / 2, 165);

  // ---- photo (landscape rounded rectangle, no color ring — soft shadow instead) ----
  const PW = 860,
    PH = 540;
  const px = (W - PW) / 2,
    py = 216;
  const halfW = PW / 2,
    halfH = PH / 2,
    pcx = px + halfW,
    pcy = py + halfH;

  ctx.save();
  ctx.shadowColor = "rgba(51,48,43,0.20)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, px, py, PW, PH, 28);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, px, py, PW, PH, 28);
  ctx.clip();
  if (s.img) {
    const img = s.img;
    const scale = Math.max(PW / img.width, PH / img.height) * s.zoom;
    const dw = img.width * scale,
      dh = img.height * scale;
    ctx.drawImage(
      img,
      pcx - dw / 2 + s.offX * halfW,
      pcy - dh / 2 + s.offY * halfH,
      dw,
      dh
    );
  } else {
    ctx.fillStyle = T.cream;
    ctx.fillRect(px, py, PW, PH);
    ctx.font = `500 120px ${FAM}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#e5b8ab";
    ctx.fillText("🐾", pcx, pcy + 42);
  }
  ctx.restore();

  roundRect(ctx, px, py, PW, PH, 28);
  ctx.lineWidth = 2;
  ctx.strokeStyle = T.line;
  ctx.stroke();

  let y = py + PH + 88;

  // ---- name ----
  ctx.textAlign = "center";
  ctx.fillStyle = T.ink;
  ctx.font = `900 ${s.name.length > 8 ? 54 : 74}px ${FAM}`;
  ctx.fillText(s.name || "なまえ", W / 2, y);
  y += 52;

  // ---- species / breed (primary line, matched weight to name) ----
  const primary = [`${species.icon} ${species.label}`];
  if (s.breed) primary.push(s.breed);
  ctx.font = `800 40px ${FAM}`;
  ctx.fillStyle = T.ink;
  ctx.fillText(primary.join("　"), W / 2, y);
  y += 42;

  // ---- gender / age (secondary line) ----
  const secondary = [gender.label];
  if (s.age) secondary.push(s.age);
  ctx.font = `700 28px ${FAM}`;
  ctx.fillStyle = T.sub;
  ctx.fillText(secondary.join("　・　"), W / 2, y);
  y += 36;

  // ---- features (personality / characteristics) ----
  if (s.features) {
    ctx.font = `500 27px ${FAM}`;
    ctx.fillStyle = T.sub;
    const lines = wrapLines(ctx, s.features, W - 180, 2);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * 34));
    y += lines.length * 34 + 12;
  }

  // ---- allergy / medical note ----
  if (s.allergy) {
    ctx.font = `700 24px ${FAM}`;
    ctx.fillStyle = T.alert;
    const lines = wrapLines(ctx, `⚠ ${s.allergy}`, W - 180, 2);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * 28));
    y += lines.length * 28;
  }

  // ---- contact card (inset, not full-bleed, to keep it from feeling too wide) ----
  const cardX = 90,
    cardW = W - cardX * 2,
    cardH = 200;
  const cardY = Math.min(1190, Math.max(1080, y + 46));
  roundRect(ctx, cardX, cardY, cardW, cardH, 26);
  ctx.fillStyle = T.cream;
  ctx.fill();
  ctx.fillStyle = T.alert;
  ctx.font = `700 26px ${FAM}`;
  ctx.fillText("緊急連絡先 EMERGENCY CONTACT", W / 2, cardY + 46);
  ctx.fillStyle = T.ink;
  ctx.font = `900 56px ${FAM}`;
  ctx.fillText(s.phone || "090-0000-0000", W / 2, cardY + 112);
  if (s.vet) {
    ctx.font = `500 24px ${FAM}`;
    ctx.fillStyle = T.sub;
    ctx.fillText(`かかりつけ：${s.vet}`, W / 2, cardY + 152);
  }

  // ---- footer logo ----
  if (s.logo) {
    const lh = 100;
    const lw = (s.logo.width / s.logo.height) * lh;
    ctx.drawImage(s.logo, W / 2 - lw / 2, H - lh - 22, lw, lh);
  }

  ctx.restore();
  // border
  roundRect(ctx, 6, 6, W - 12, H - 12, R - 6);
  ctx.lineWidth = 12;
  ctx.strokeStyle = T.alert;
  ctx.stroke();
}

// ---------- small UI atoms ----------
function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 22 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: T.sub,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>{hint}</div>
      )}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 15px",
  fontSize: 16,
  fontFamily: FAM,
  color: T.ink,
  background: "#fff",
  border: `1.5px solid ${T.line}`,
  borderRadius: 14,
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 84,
  resize: "vertical",
  lineHeight: 1.6,
};

function SegmentedGroup({ options, value, onChange, renderLabel }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              flex: "1 1 0",
              padding: "12px 10px",
              fontSize: 15,
              fontFamily: FAM,
              fontWeight: 700,
              color: active ? "#fff" : T.ink,
              background: active ? T.alert : "#fff",
              border: `1.5px solid ${active ? T.alert : T.line}`,
              borderRadius: 14,
              cursor: "pointer",
            }}
          >
            {renderLabel ? renderLabel(opt) : opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- main app ----------
export default function App() {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState("unknown");
  const [age, setAge] = useState("");
  const [features, setFeatures] = useState("");
  const [allergy, setAllergy] = useState("");
  const [phone, setPhone] = useState("");
  const [vet, setVet] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
  const [logoImg, setLogoImg] = useState(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  // load webfont
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONT_LINK;
    document.head.appendChild(l);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setFontsReady(true));
      const t = setTimeout(() => setFontsReady((v) => (!v ? true : v)), 2500);
      return () => clearTimeout(t);
    } else setFontsReady(true);
  }, []);

  // preload MaNiYa logo for canvas drawing
  useEffect(() => {
    const im = new Image();
    im.onload = () => setLogoImg(im);
    im.src = logoSrc;
  }, []);

  const currentSpecies = SPECIES.find((sp) => sp.key === species) || SPECIES[0];

  const redraw = useCallback(() => {
    if (canvasRef.current)
      drawSticker(canvasRef.current, {
        img,
        zoom,
        offX,
        offY,
        name,
        species,
        breed,
        gender,
        age,
        features,
        allergy,
        phone,
        vet,
        logo: logoImg,
      });
  }, [
    img,
    zoom,
    offX,
    offY,
    name,
    species,
    breed,
    gender,
    age,
    features,
    allergy,
    phone,
    vet,
    logoImg,
    fontsReady,
  ]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const im = new Image();
      im.onload = () => {
        setImg(im);
        setZoom(1);
        setOffX(0);
        setOffY(0);
      };
      im.src = ev.target.result;
    };
    reader.readAsDataURL(f);
  };

  const download = () => {
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `rescue-sticker_${name || "pet"}.png`;
    a.click();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: FAM,
        color: T.ink,
      }}
    >
      {/* header */}
      <header
        style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 8px" }}
      >
        <img
          src={logoSrc}
          alt="MaNiYa"
          style={{ height: 54, display: "block", marginBottom: 12 }}
        />
        <h1
          style={{
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 900,
            margin: "10px 0 6px",
            lineHeight: 1.25,
          }}
        >
          うちの子レスキューステッカー
        </h1>
        <p style={{ margin: 0, color: T.sub, fontSize: 15, lineHeight: 1.8 }}>
          災害時、「家の中にペットがいる」ことを救助者に伝えるステッカーを、
          写真1枚でつくれます。1枚につき1匹分の情報を記入してください。
          L判サイズなので、コンビニの写真プリントでそのまま印刷できます。
        </p>
      </header>

      {/* body */}
      <main
        style={{
          maxWidth: 1060,
          margin: "0 auto",
          padding: "28px 24px 64px",
          display: "grid",
          gridTemplateColumns: "minmax(300px, 460px) 1fr",
          gap: 40,
          alignItems: "start",
        }}
      >
        {/* form */}
        <section>
          <Field label="① うちの子の写真">
            <button
              onClick={() => fileRef.current.click()}
              style={{
                ...inputStyle,
                cursor: "pointer",
                textAlign: "center",
                fontWeight: 700,
                borderStyle: "dashed",
                borderWidth: 2,
                color: img ? T.ink : T.sub,
                padding: "18px 15px",
              }}
            >
              {img ? "📷 写真をえらび直す" : "📷 写真をアップロード"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              style={{ display: "none" }}
            />
          </Field>

          {img && (
            <Field label="写真の調整">
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <span style={{ fontSize: 12, color: T.sub }}>ズーム</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(+e.target.value)}
                    style={{ width: "100%", accentColor: T.alert }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 12, color: T.sub }}>左右</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={offX}
                    onChange={(e) => setOffX(+e.target.value)}
                    style={{ width: "100%", accentColor: T.alert }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 12, color: T.sub }}>上下</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={offY}
                    onChange={(e) => setOffY(+e.target.value)}
                    style={{ width: "100%", accentColor: T.alert }}
                  />
                </div>
              </div>
            </Field>
          )}

          <Field label="② なまえ">
            <input
              style={inputStyle}
              value={name}
              maxLength={14}
              placeholder="モコ"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="③ 種類（1枚につき1匹）">
            <SegmentedGroup
              options={SPECIES}
              value={species}
              onChange={setSpecies}
              renderLabel={(o) => `${o.icon} ${o.label}`}
            />
          </Field>

          <Field label={`④ ${currentSpecies.breedLabel}`} hint="例：柴犬、ミックスなど">
            <input
              style={inputStyle}
              value={breed}
              maxLength={20}
              placeholder="柴犬"
              onChange={(e) => setBreed(e.target.value)}
            />
          </Field>

          <Field label="⑤ 性別">
            <SegmentedGroup options={GENDERS} value={gender} onChange={setGender} />
          </Field>

          <Field label="⑥ 年齢（任意）">
            <input
              style={inputStyle}
              value={age}
              maxLength={10}
              placeholder="3歳"
              onChange={(e) => setAge(e.target.value)}
            />
          </Field>

          <Field
            label="⑦ 特徴・性格"
            hint="首輪の色、性格、注意点など。長めに書けます"
          >
            <textarea
              style={textareaStyle}
              value={features}
              maxLength={80}
              placeholder="人懐っこい／赤い首輪をしている／臆病なので驚かせないでください　など"
              onChange={(e) => setFeatures(e.target.value)}
            />
          </Field>

          <Field label="⑧ アレルギー・持病など（任意）">
            <textarea
              style={{ ...textareaStyle, minHeight: 64 }}
              value={allergy}
              maxLength={60}
              placeholder="鶏肉アレルギーあり／投薬中　など"
              onChange={(e) => setAllergy(e.target.value)}
            />
          </Field>

          <Field label="⑨ 緊急連絡先（電話番号）">
            <input
              style={inputStyle}
              value={phone}
              placeholder="090-0000-0000"
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Field label="⑩ かかりつけ動物病院（任意）">
            <input
              style={inputStyle}
              value={vet}
              placeholder="○○動物病院 055-000-0000"
              onChange={(e) => setVet(e.target.value)}
            />
          </Field>
        </section>

        {/* preview */}
        <section style={{ position: "sticky", top: 24 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 28,
              padding: 24,
              border: `1.5px solid ${T.line}`,
              boxShadow: "0 18px 40px rgba(51,48,43,0.08)",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                maxWidth: 420,
                margin: "0 auto",
                height: "auto",
                display: "block",
                borderRadius: 18,
              }}
            />
            <button
              onClick={download}
              style={{
                marginTop: 18,
                width: "100%",
                padding: "16px 20px",
                fontSize: 17,
                fontWeight: 900,
                fontFamily: FAM,
                color: "#fff",
                background: T.alert,
                border: "none",
                borderRadius: 16,
                cursor: "pointer",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = T.alertDark)
              }
              onMouseOut={(e) => (e.currentTarget.style.background = T.alert)}
            >
              ステッカー画像を保存（PNG・L判サイズ）
            </button>
          </div>
        </section>
      </main>

      <style>{`
        @media (max-width: 760px) {
          main { grid-template-columns: 1fr !important; }
          section[style*="sticky"] { position: static !important; }
        }
        button:focus-visible, input:focus-visible, textarea:focus-visible {
          outline: 3px solid ${T.accent}; outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
