import { useState, useRef, useEffect, useCallback } from "react";

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

  // ---- header band ----
  const headH = 290;
  ctx.fillStyle = T.alert;
  ctx.fillRect(0, 0, W, headH);
  // subtle Fuji silhouette
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.beginPath();
  ctx.moveTo(640, headH);
  ctx.lineTo(830, 80);
  ctx.lineTo(880, 130);
  ctx.lineTo(925, 80);
  ctx.lineTo(1110, headH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = `900 68px ${FAM}`;
  ctx.fillText("緊急時 ペット救助のお願い", W / 2, 122);
  ctx.font = `700 30px ${FAM}`;
  ctx.fillText("IN CASE OF EMERGENCY — PETS INSIDE", W / 2, 188);
  ctx.font = `700 28px ${FAM}`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("この家に、いのちがいます", W / 2, 244);

  // ---- photo circle ----
  const cx = W / 2,
    cy = 610,
    r = 265;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 16, 0, Math.PI * 2);
  ctx.fillStyle = T.alert;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (s.img) {
    const img = s.img;
    const scale =
      Math.max((r * 2) / img.width, (r * 2) / img.height) * s.zoom;
    const dw = img.width * scale,
      dh = img.height * scale;
    ctx.drawImage(
      img,
      cx - dw / 2 + s.offX * r,
      cy - dh / 2 + s.offY * r,
      dw,
      dh
    );
  } else {
    ctx.fillStyle = T.cream;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.font = `500 160px ${FAM}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#e5b8ab";
    ctx.fillText("🐾", cx, cy + 60);
  }
  ctx.restore();

  // ---- name ----
  ctx.textAlign = "center";
  ctx.fillStyle = T.ink;
  ctx.font = `900 ${s.name.length > 8 ? 62 : 84}px ${FAM}`;
  ctx.fillText(s.name || "なまえ", W / 2, 1000);

  // ---- species counts ----
  const parts = [];
  if (s.dog > 0) parts.push(`🐕 犬 ${s.dog}`);
  if (s.cat > 0) parts.push(`🐈 猫 ${s.cat}`);
  if (s.other > 0) parts.push(`🐾 その他 ${s.other}`);
  ctx.font = `700 44px ${FAM}`;
  ctx.fillStyle = T.ink;
  ctx.fillText(parts.length ? parts.join("　") : "🐕 犬 1", W / 2, 1078);

  // ---- contact band ----
  const bandY = 1140;
  ctx.fillStyle = T.cream;
  ctx.fillRect(0, bandY, W, H - bandY);
  ctx.fillStyle = T.alert;
  ctx.font = `700 32px ${FAM}`;
  ctx.fillText("緊急連絡先 EMERGENCY CONTACT", W / 2, bandY + 58);
  ctx.fillStyle = T.ink;
  ctx.font = `900 64px ${FAM}`;
  ctx.fillText(s.phone || "090-0000-0000", W / 2, bandY + 134);
  if (s.vet) {
    ctx.font = `500 28px ${FAM}`;
    ctx.fillStyle = T.sub;
    ctx.fillText(`かかりつけ：${s.vet}`, W / 2, bandY + 182);
  }
  // footer credit
  ctx.font = `700 22px ${FAM}`;
  ctx.fillStyle = "#b7ac9a";
  ctx.fillText("MaNiYa × やまなし火山防災", W / 2, H - 36);

  ctx.restore();
  // border
  roundRect(ctx, 6, 6, W - 12, H - 12, R - 6);
  ctx.lineWidth = 12;
  ctx.strokeStyle = T.alert;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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

function Counter({ icon, label, value, onChange }) {
  const btn = {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: `1.5px solid ${T.line}`,
    background: "#fff",
    fontSize: 18,
    fontWeight: 700,
    color: T.ink,
    cursor: "pointer",
    lineHeight: 1,
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        border: `1.5px solid ${T.line}`,
        borderRadius: 14,
        padding: "10px 14px",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700 }}>
        {icon} {label}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button style={btn} onClick={() => onChange(Math.max(0, value - 1))}>
          −
        </button>
        <span style={{ minWidth: 20, textAlign: "center", fontWeight: 900 }}>
          {value}
        </span>
        <button style={btn} onClick={() => onChange(Math.min(9, value + 1))}>
          ＋
        </button>
      </span>
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
  const [dog, setDog] = useState(1);
  const [cat, setCat] = useState(0);
  const [other, setOther] = useState(0);
  const [phone, setPhone] = useState("");
  const [vet, setVet] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
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

  const redraw = useCallback(() => {
    if (canvasRef.current)
      drawSticker(canvasRef.current, {
        img,
        zoom,
        offX,
        offY,
        name,
        dog,
        cat,
        other,
        phone,
        vet,
      });
  }, [img, zoom, offX, offY, name, dog, cat, other, phone, vet, fontsReady]);

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
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: T.alert,
          }}
        >
          MaNiYa × やまなし火山防災
        </div>
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
          写真1枚でつくれます。L判サイズなので、コンビニの写真プリントで
          そのまま印刷できます。
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

          <Field label="② なまえ" hint="複数いる場合は「モコ・クッキー」のように">
            <input
              style={inputStyle}
              value={name}
              maxLength={14}
              placeholder="モコ"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="③ 家にいる子の数">
            <div style={{ display: "grid", gap: 10 }}>
              <Counter icon="🐕" label="犬" value={dog} onChange={setDog} />
              <Counter icon="🐈" label="猫" value={cat} onChange={setCat} />
              <Counter
                icon="🐾"
                label="その他"
                value={other}
                onChange={setOther}
              />
            </div>
          </Field>

          <Field label="④ 緊急連絡先（電話番号）">
            <input
              style={inputStyle}
              value={phone}
              placeholder="090-0000-0000"
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Field label="⑤ かかりつけ動物病院（任意）">
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
            <p
              style={{
                fontSize: 12.5,
                color: T.sub,
                lineHeight: 1.8,
                margin: "12px 4px 0",
              }}
            >
              💡 L判（89×127mm・300dpi）で書き出されます。コンビニのマルチコピー機
              「写真プリント（L判）」でそのまま印刷OK（1枚約40円）。
              玄関ドアなど屋外に貼る場合は、耐水ラミネートや
              ソフトケースに入れるのがおすすめです。
            </p>
          </div>
        </section>
      </main>

      <style>{`
        @media (max-width: 760px) {
          main { grid-template-columns: 1fr !important; }
          section[style*="sticky"] { position: static !important; }
        }
        button:focus-visible, input:focus-visible {
          outline: 3px solid ${T.accent}; outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
