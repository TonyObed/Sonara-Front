/* ============================================================
   SONARA — App (routing + tweaks + montage)
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHue": 188,
  "theme": "dark",
  "density": "regular",
  "font": "Schibsted Grotesk"
}/*EDITMODE-END*/;

const ACCENTS = [
  { label: "Teal", hue: 188 },
  { label: "Émeraude", hue: 158 },
  { label: "Bleu", hue: 248 },
  { label: "Violet", hue: 292 },
  { label: "Ambre", hue: 70 },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState("home");
  const [camp, setCamp] = React.useState(null);
  const [call, setCall] = React.useState(null);
  const [notif, setNotif] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const theme = t.theme;

  // Appliquer les tweaks au :root
  React.useEffect(() => {
    document.documentElement.style.setProperty("--accent-h", t.accentHue);
    document.documentElement.setAttribute("data-theme", t.theme);
    const dens = { compact: { gap: "14px", pad: "15px", row: "48px" }, regular: { gap: "20px", pad: "20px", row: "56px" }, comfy: { gap: "26px", pad: "26px", row: "64px" } }[t.density] || {};
    document.documentElement.style.setProperty("--gap", dens.gap);
    document.documentElement.style.setProperty("--pad-card", dens.pad);
    document.documentElement.style.setProperty("--row-h", dens.row);
    document.documentElement.style.setProperty("--font-ui", `"${t.font}", system-ui, sans-serif`);
  }, [t]);

  const goCampaign = (c) => { setCamp(c); setRoute("campaign-detail"); window.scrollTo(0, 0); };
  const navTo = (r) => { setRoute(r); setCamp(null); window.scrollTo(0, 0); };
  const openCall = (d) => setCall(d);

  let screen;
  if (route === "home") screen = <HomeScreen goCampaign={goCampaign} openCall={openCall} setRoute={navTo} />;
  else if (route === "campaigns") screen = <CampaignsScreen goCampaign={goCampaign} />;
  else if (route === "campaign-detail" && camp) screen = <CampaignDetail camp={camp} back={() => navTo("campaigns")} openCall={openCall} />;
  else screen = <Placeholder route={route} />;

  const sideRoute = route === "campaign-detail" ? "campaigns" : route;

  return (
    <div className={"app" + (collapsed ? " collapsed" : "")}>
      <Sidebar route={sideRoute} setRoute={navTo} collapsed={collapsed} />
      <div className="main">
        <Topbar collapsed={collapsed} setCollapsed={setCollapsed}
                theme={theme} setTheme={(v) => setTweak("theme", v)}
                openNotif={() => setNotif(true)} />
        {screen}
      </div>

      {call && <CallModal data={call} close={() => setCall(null)} />}
      <NotifPanel open={notif} close={() => setNotif(false)} />

      <TweaksPanel>
        <TweakSection label="Apparence" />
        <TweakRow label="Couleur d'accent">
          <div style={{ display: "flex", gap: 7 }}>
            {ACCENTS.map(a => (
              <button key={a.hue} title={a.label}
                onClick={() => setTweak("accentHue", a.hue)}
                style={{
                  width: 26, height: 26, borderRadius: 8, cursor: "pointer",
                  background: `oklch(0.78 0.13 ${a.hue})`,
                  border: t.accentHue === a.hue ? "2px solid var(--ink)" : "2px solid transparent",
                  outline: t.accentHue === a.hue ? "1px solid var(--ink)" : "none",
                }} />
            ))}
          </div>
        </TweakRow>
        <TweakRadio label="Thème" value={t.theme} options={["dark", "light"]}
                    onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="Densité" value={t.density} options={["compact", "regular", "comfy"]}
                    onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Typographie" />
        <TweakSelect label="Police d'interface" value={t.font}
                     options={["Schibsted Grotesk", "Space Grotesk", "Geist", "Plus Jakarta Sans", "Outfit"]}
                     onChange={(v) => setTweak("font", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
