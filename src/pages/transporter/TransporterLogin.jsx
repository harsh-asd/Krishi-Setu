import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import tractorHarvest from "../../assets/backgrounds/tractor-harvest.jpg";
import goldenOxPlowing from "../../assets/backgrounds/golden-ox-plowing.png";
import {
  CheckCircle2,
  Globe2,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { useLanguage } from "../../translations/LanguageContext";

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const API_BASE = String(RAW_API_BASE)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const STORAGE_KEY = "krishisetu_transporter_session";
const TEMP_SESSION_KEY = "krishisetu_transporter_temp_session";
const TRANSPORTER_ID_KEY = "krishisetu_transporter_id";
const LANGUAGE_STORAGE_KEY = "krishisetu-language";

const TEXT = {
  en: {
    network: "Transport partner portal",
    hero1: "Move crops.",
    hero2: "Connect farmers.",
    heroText:
      "Sign in to manage transport requests from farmers within your registered service area.",
    localTitle: "Local farmer matching",
    localText:
      "See eligible requests from your registered villages and service area.",
    updatesTitle: "Live job updates",
    updatesText:
      "Track accepted, active and completed transport jobs.",
    operationsTitle: "Simple operations",
    operationsText:
      "Accept jobs, update status and keep farmers informed.",
    welcome: "Welcome back",
    signInSub: "Sign in to your transporter account",
    mobile: "Mobile number",
    mobilePlaceholder: "Enter 10-digit mobile number",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    forgot: "Need help signing in?",
    signIn: "Sign in",
    signingIn: "Signing in...",
    newTransporter: "New transporter?",
    create: "Create transporter account",
    back: "Back to KrishiSetu",
    security:
      "Your transporter profile and service-area information are used to show you relevant farmer transport requests.",
    checking: "Checking your session...",
    success: "Login successful. Opening your dashboard...",
    invalidPhone: "Enter a valid 10-digit mobile number.",
    passwordRequired: "Enter your password.",
    networkError:
      "Unable to reach KrishiSetu. Check that the backend server is running and try again.",
    invalidCredentials:
      "Invalid transporter mobile number or password.",
    loginFailed: "Unable to sign in. Please check your details.",
    noProfile:
      "Login succeeded but the transporter profile was not returned.",
    sessionHelp:
      "Sign-in help is not connected to a password-reset backend yet. Please use your registered mobile number or contact the KrishiSetu administrator.",
    language: "Language",
    english: "English",
    hindi: "हिन्दी",
    telugu: "తెలుగు",
    onlineArea:
      "Your registered service area controls which farmer jobs are shown to you.",
    protected: "Protected transporter access",
  },

  hi: {
    network: "परिवहन साझेदार पोर्टल",
    hero1: "फसल पहुँचाएँ।",
    hero2: "किसानों से जुड़ें।",
    heroText:
      "अपने पंजीकृत सेवा क्षेत्र के किसानों से आने वाले परिवहन अनुरोध प्रबंधित करने के लिए साइन इन करें।",
    localTitle: "स्थानीय किसान मिलान",
    localText:
      "अपने पंजीकृत गाँवों और सेवा क्षेत्र के योग्य अनुरोध देखें।",
    updatesTitle: "लाइव कार्य अपडेट",
    updatesText:
      "स्वीकृत, सक्रिय और पूर्ण परिवहन कार्यों को ट्रैक करें।",
    operationsTitle: "सरल संचालन",
    operationsText:
      "कार्य स्वीकार करें, स्थिति अपडेट करें और किसानों को जानकारी दें।",
    welcome: "वापसी पर स्वागत है",
    signInSub: "अपने परिवहन खाते में साइन इन करें",
    mobile: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर दर्ज करें",
    password: "पासवर्ड",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    remember: "मुझे याद रखें",
    forgot: "साइन इन में सहायता चाहिए?",
    signIn: "साइन इन",
    signingIn: "साइन इन हो रहा है...",
    newTransporter: "नए परिवहनकर्ता?",
    create: "परिवहन खाता बनाएँ",
    back: "कृषिसेतु पर वापस जाएँ",
    security:
      "आपकी प्रोफ़ाइल और सेवा क्षेत्र की जानकारी का उपयोग प्रासंगिक किसान परिवहन अनुरोध दिखाने के लिए किया जाता है।",
    checking: "आपका सत्र जाँचा जा रहा है...",
    success: "लॉगिन सफल। डैशबोर्ड खोला जा रहा है...",
    invalidPhone: "मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।",
    passwordRequired: "पासवर्ड दर्ज करें।",
    networkError:
      "कृषिसेतु से संपर्क नहीं हो पा रहा। बैकएंड सर्वर चल रहा है या नहीं जाँचें।",
    invalidCredentials: "मोबाइल नंबर या पासवर्ड गलत है।",
    loginFailed: "साइन इन नहीं हो सका। कृपया विवरण जाँचें।",
    noProfile:
      "लॉगिन सफल हुआ, लेकिन परिवहनकर्ता प्रोफ़ाइल नहीं मिली।",
    sessionHelp:
      "पासवर्ड रीसेट बैकएंड अभी जुड़ा नहीं है। पंजीकृत मोबाइल नंबर का उपयोग करें या कृषिसेतु व्यवस्थापक से संपर्क करें।",
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    telugu: "తెలుగు",
    onlineArea:
      "आपका पंजीकृत सेवा क्षेत्र तय करता है कि आपको कौन से किसान कार्य दिखेंगे।",
    protected: "सुरक्षित परिवहनकर्ता प्रवेश",
  },

  te: {
    network: "రవాణా భాగస్వామి పోర్టల్",
    hero1: "పంటను తరలించండి.",
    hero2: "రైతులతో కలవండి.",
    heroText:
      "మీ నమోదైన సేవా ప్రాంతంలోని రైతుల రవాణా అభ్యర్థనలను నిర్వహించడానికి సైన్ ఇన్ చేయండి.",
    localTitle: "స్థానిక రైతు మ్యాచింగ్",
    localText:
      "మీ నమోదైన గ్రామాలు మరియు సేవా ప్రాంతంలోని అర్హమైన అభ్యర్థనలను చూడండి.",
    updatesTitle: "లైవ్ పని అప్డేట్లు",
    updatesText:
      "ఆమోదించిన, యాక్టివ్ మరియు పూర్తయిన రవాణా పనులను ట్రాక్ చేయండి.",
    operationsTitle: "సులభమైన నిర్వహణ",
    operationsText:
      "పనులను అంగీకరించండి, స్థితిని మార్చండి మరియు రైతులకు సమాచారం ఇవ్వండి.",
    welcome: "మళ్లీ స్వాగతం",
    signInSub: "మీ రవాణాదారు ఖాతాలోకి సైన్ ఇన్ చేయండి",
    mobile: "మొబైల్ నంబర్",
    mobilePlaceholder: "10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి",
    password: "పాస్‌వర్డ్",
    passwordPlaceholder: "మీ పాస్‌వర్డ్ నమోదు చేయండి",
    remember: "నన్ను గుర్తుంచుకోండి",
    forgot: "సైన్ ఇన్ సహాయం కావాలా?",
    signIn: "సైన్ ఇన్",
    signingIn: "సైన్ ఇన్ అవుతోంది...",
    newTransporter: "కొత్త రవాణాదారా?",
    create: "రవాణాదారు ఖాతా సృష్టించండి",
    back: "కృషిసేతుకు తిరిగి వెళ్లండి",
    security:
      "సంబంధిత రైతు రవాణా అభ్యర్థనలను చూపించడానికి మీ ప్రొఫైల్ మరియు సేవా ప్రాంత సమాచారాన్ని ఉపయోగిస్తాము.",
    checking: "మీ సెషన్ తనిఖీ చేస్తున్నాం...",
    success: "లాగిన్ విజయవంతం. డ్యాష్‌బోర్డ్ తెరవబడుతోంది...",
    invalidPhone: "చెల్లుబాటు అయ్యే 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.",
    passwordRequired: "పాస్‌వర్డ్ నమోదు చేయండి.",
    networkError:
      "కృషిసేతు సర్వర్‌ను చేరుకోలేకపోయాం. బ్యాకెండ్ సర్వర్ నడుస్తుందో చూడండి.",
    invalidCredentials:
      "రవాణాదారు మొబైల్ నంబర్ లేదా పాస్‌వర్డ్ తప్పు.",
    loginFailed: "సైన్ ఇన్ కాలేదు. మీ వివరాలను తనిఖీ చేయండి.",
    noProfile:
      "లాగిన్ విజయవంతమైంది, కానీ రవాణాదారు ప్రొఫైల్ తిరిగి రాలేదు.",
    sessionHelp:
      "పాస్‌వర్డ్ రీసెట్ బ్యాకెండ్ ఇంకా అనుసంధానం కాలేదు. నమోదైన మొబైల్ నంబర్ ఉపయోగించండి లేదా కృషిసేతు నిర్వాహకుడిని సంప్రదించండి.",
    language: "భాష",
    english: "English",
    hindi: "हिन्दी",
    telugu: "తెలుగు",
    onlineArea:
      "మీ నమోదైన సేవా ప్రాంతమే మీకు కనిపించే రైతు రవాణా పనులను నిర్ణయిస్తుంది.",
    protected: "సురక్షిత రవాణాదారు ప్రవేశం",
  },
};

function getStoredSession() {
  const candidates = [
    ["localStorage", window.localStorage],
    ["sessionStorage", window.sessionStorage],
  ];

  for (const [, storage] of candidates) {
    try {
      const value =
        storage.getItem(
          storage === window.localStorage
            ? STORAGE_KEY
            : TEMP_SESSION_KEY
        );

      if (!value) continue;

      const parsed = JSON.parse(value);

      if (parsed?.transporter?.id) {
        return parsed;
      }
    } catch {
      // Ignore malformed browser storage and continue.
    }
  }

  return null;
}

function saveSession(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function normalizePhone(value) {
  const digits = String(value || "")
    .replace(/\D/g, "");

  return digits.length > 10
    ? digits.slice(-10)
    : digits;
}

function TransporterLogin() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const copy = useMemo(
    () => TEXT[language] || TEXT.en,
    [language]
  );

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // The login page must remain directly reachable even when an old
  // transporter session exists in browser storage. A user may need to
  // switch accounts, so the login route must never auto-redirect simply
  // because a previous session was saved.
  useEffect(() => {
    setCheckingSession(false);
  }, []);

  function handlePhoneChange(event) {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 10);

    setPhone(value);

    if (error) {
      setError("");
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length !== 10) {
      setError(copy.invalidPhone);
      return;
    }

    if (!password.trim()) {
      setError(copy.passwordRequired);
      return;
    }

    setLoading(true);

    try {
      const loginUrl = `${API_BASE}/api/transporters/login`;

      console.info("[KrishiSetu transporter login] POST", loginUrl);

      const response = await fetch(
        loginUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: normalizedPhone,
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            copy.loginFailed
        );
      }

      const transporter =
        data.transporter ||
        data.user ||
        data.profile ||
        null;

      if (!transporter) {
        throw new Error(
          copy.noProfile
        );
      }

      const session = {
        authenticated: true,
        transporter,
        token:
          data.token ||
          data.accessToken ||
          null,
        loginAt: new Date().toISOString(),
      };

      if (rememberMe) {
        saveSession(session);
        sessionStorage.removeItem(TEMP_SESSION_KEY);
      } else {
        sessionStorage.setItem(
          TEMP_SESSION_KEY,
          JSON.stringify(session)
        );
        localStorage.removeItem(STORAGE_KEY);
      }

      window.localStorage.setItem(
        TRANSPORTER_ID_KEY,
        String(transporter.id)
      );

      setSuccess(copy.success);

      setTimeout(() => {
        navigate("/transporter/dashboard", {
          replace: true,
        });
      }, 400);
    } catch (err) {
      const message =
        err?.name === "TypeError"
          ? copy.networkError
          : err?.message || copy.loginFailed;

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>
            {copy.checking}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlow} />

      <main style={styles.wrapper}>
        <section style={styles.brandSection}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.brandButton}
          >
            <Logo size={58} />

            <div>
              <div style={styles.brandName}>
                KrishiSetu
              </div>

              <div style={styles.brandSubtitle}>
                Transporter Network
              </div>
            </div>
          </button>

          <div style={styles.heroCopy}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              {copy.network}
            </div>

            <h1 style={styles.heroTitle}>
              {copy.hero1}
              <br />
              <span style={styles.heroAccent}>
                {copy.hero2}
              </span>
            </h1>

            <p style={styles.heroText}>
              {copy.heroText}
            </p>

            <div style={styles.featureList}>
              <Feature
                icon={<MapPin size={17} />}
                title={copy.localTitle}
                text={copy.localText}
              />

              <Feature
                icon={<Truck size={17} />}
                title={copy.updatesTitle}
                text={copy.updatesText}
              />

              <Feature
                icon={<CheckCircle2 size={17} />}
                title={copy.operationsTitle}
                text={copy.operationsText}
              />
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <Logo size={42} />

            <div>
              <h2 style={styles.title}>
                {copy.welcome}
              </h2>

              <p style={styles.subtitle}>
                {copy.signInSub}
              </p>
            </div>
          </div>

          <div style={styles.languageRow}>
            <div style={styles.languageLabel}>
              <Globe2 size={15} />
              <span>{copy.language}</span>
            </div>

            <div style={styles.languageButtons}>
              {[
                ["en", copy.english],
                ["hi", copy.hindi],
                ["te", copy.telugu],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLanguage(id)}
                  style={{
                    ...styles.languageButton,
                    ...(language === id
                      ? styles.languageButtonActive
                      : {}),
                  }}
                  disabled={loading}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.areaNotice}>
            <MapPin size={16} />
            <span>{copy.onlineArea}</span>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.messageIcon}>
                !
              </span>

              <span>
                {error}
              </span>
            </div>
          )}

          {success && (
            <div style={styles.successBox}>
              <span style={styles.messageIcon}>
                ✓
              </span>

              <span>
                {success}
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <label style={styles.label}>
              {copy.mobile}
            </label>

            <div style={styles.inputGroup}>
              <span style={styles.prefix}>
                +91
              </span>

              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={copy.mobilePlaceholder}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <label style={styles.label}>
              {copy.password}
            </label>

            <div style={styles.passwordGroup}>
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder={copy.passwordPlaceholder}
                style={styles.passwordInput}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                style={styles.showButton}
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div style={styles.optionsRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(
                      event.target.checked
                    )
                  }
                  disabled={loading}
                />

                <span>
                  {copy.remember}
                </span>
              </label>

              <button
                type="button"
                style={styles.linkButton}
                onClick={() =>
                  navigate("/transporter/forgot-password")
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                ...(loading
                  ? styles.submitButtonDisabled
                  : {}),
              }}
            >
              {loading ? (
                <>
                  <span style={styles.buttonSpinner} />
                  {copy.signingIn}
                </>
              ) : (
                <>
                  {copy.signIn}
                  <span style={styles.arrow}>
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {showHelp && (
            <div style={styles.helpBox} role="dialog" aria-label={copy.forgot}>
              <div style={styles.helpHeader}>
                <div style={styles.helpTitleRow}>
                  <ShieldCheck size={18} />
                  <strong>{copy.forgot}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  style={styles.helpClose}
                  aria-label="Close"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <p style={styles.helpText}>
                {copy.sessionHelp}
              </p>
            </div>
          )}

          <div style={styles.divider}>
            <span />
            <span>{copy.newTransporter}</span>
            <span />
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/transporter/register")
            }
            style={styles.registerButton}
            disabled={loading}
          >
            {copy.create}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.backButton}
          >
            ← {copy.back}
          </button>

          <div style={styles.protectedBadge}>
            <LockKeyhole size={15} />
            <span>{copy.protected}</span>
          </div>

          <p style={styles.securityNote}>
            {copy.security}
          </p>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div style={styles.feature}>
      <div style={styles.featureIcon}>
        {icon}
      </div>

      <div>
        <div style={styles.featureTitle}>
          {title}
        </div>

        <div style={styles.featureText}>
          {text}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #d5ecd9 0%, #cde7d3 48%, #e2f4e5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  backgroundGlow: {
    position: "absolute",
    width: "520px",
    height: "520px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(43, 130, 76, 0.11), transparent 68%)",
    top: "-210px",
    right: "-150px",
    pointerEvents: "none",
  },

  wrapper: {
    width: "100%",
    maxWidth: "1120px",
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(390px, 470px)",
    gap: "72px",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },

  brandSection: {
    padding: "18px 0",
  },

  brandButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    textAlign: "left",
  },

  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    background:
      "linear-gradient(145deg, #267a46, #174e2d)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    fontWeight: 800,
    boxShadow:
      "0 10px 25px rgba(25, 91, 49, 0.18)",
  },

  brandName: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.4px",
    color: "#173522",
  },

  brandSubtitle: {
    fontSize: "11px",
    color: "#6b7c70",
    marginTop: "2px",
    letterSpacing: "0.3px",
  },

  heroCopy: {
    maxWidth: "570px",
    marginTop: "76px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "rgba(38, 122, 70, 0.08)",
    color: "#28663f",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "20px",
  },

  badgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#2e8b57",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(42px, 5vw, 66px)",
    lineHeight: 1.02,
    letterSpacing: "-3px",
    fontWeight: 800,
    color: "#173522",
  },

  heroAccent: {
    color: "#2b8050",
  },

  heroText: {
    maxWidth: "500px",
    margin: "22px 0 0",
    color: "#617067",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  featureList: {
    marginTop: "42px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  feature: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  featureIcon: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #dfe9e2",
    color: "#287848",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 800,
    boxShadow:
      "0 5px 15px rgba(25, 70, 40, 0.05)",
  },

  featureTitle: {
    fontSize: "13px",
    fontWeight: 750,
    color: "#274132",
    marginBottom: "3px",
  },

  featureText: {
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#738078",
    maxWidth: "430px",
  },

  card: {
    background: "rgba(255, 255, 255, 0.97)",
    border: "1px solid #e1eae4",
    borderRadius: "24px",
    padding: "38px",
    boxShadow:
      "0 24px 70px rgba(30, 73, 45, 0.11)",
    boxSizing: "border-box",
  },

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  languageRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    marginTop: "18px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#f5f9f6",
    border: "1px solid #e3ece5",
  },

  languageLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#5e7065",
    fontSize: "12px",
    fontWeight: 700,
  },

  languageButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  languageButton: {
    border: "1px solid #d7e2da",
    background: "#ffffff",
    borderRadius: "8px",
    padding: "6px 9px",
    fontSize: "11px",
    color: "#557063",
    cursor: "pointer",
  },

  languageButtonActive: {
    background: "#216b3d",
    borderColor: "#216b3d",
    color: "#ffffff",
    fontWeight: 800,
  },

  areaNotice: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "#f8fbf9",
    color: "#627267",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  helpBox: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "12px",
    background: "#f7faf8",
    border: "1px solid #dfe9e2",
  },

  helpHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  helpTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#235f39",
    fontSize: "13px",
  },

  helpClose: {
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: "#738278",
    cursor: "pointer",
  },

  helpText: {
    margin: "9px 0 0",
    color: "#65736b",
    fontSize: "12px",
    lineHeight: 1.55,
  },

  protectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "17px",
    padding: "7px 10px",
    borderRadius: "999px",
    background: "rgba(38, 122, 70, 0.08)",
    color: "#28663f",
    fontSize: "11px",
    fontWeight: 700,
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "28px",
  },

  mobileLogo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background:
      "linear-gradient(145deg, #2a824b, #1a5b35)",
    color: "#fff",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "20px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    letterSpacing: "-0.8px",
    color: "#1a3022",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#7a857e",
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    background: "#fff4f2",
    border: "1px solid #f3d2cd",
    color: "#a13d32",
    borderRadius: "11px",
    padding: "11px 12px",
    fontSize: "12px",
    lineHeight: 1.45,
    marginBottom: "18px",
  },

  successBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    background: "#f0faf3",
    border: "1px solid #cfe7d5",
    color: "#277044",
    borderRadius: "11px",
    padding: "11px 12px",
    fontSize: "12px",
    lineHeight: 1.45,
    marginBottom: "18px",
  },

  messageIcon: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
  },

  form: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#35473b",
    marginBottom: "8px",
  },

  inputGroup: {
    height: "49px",
    border: "1px solid #d9e3dc",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    background: "#ffffff",
    marginBottom: "19px",
    transition: "border-color 0.2s",
  },

  prefix: {
    padding: "0 12px",
    color: "#53645a",
    fontSize: "13px",
    fontWeight: 700,
    borderRight: "1px solid #e4ebe6",
    height: "100%",
    display: "flex",
    alignItems: "center",
  },

  input: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    height: "100%",
    padding: "0 13px",
    fontSize: "13px",
    color: "#24382a",
    background: "transparent",
  },

  passwordGroup: {
    height: "49px",
    border: "1px solid #d9e3dc",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    background: "#ffffff",
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    height: "100%",
    padding: "0 13px",
    fontSize: "13px",
    color: "#24382a",
    background: "transparent",
  },

  showButton: {
    border: "none",
    background: "transparent",
    color: "#32784c",
    fontWeight: 700,
    fontSize: "11px",
    padding: "0 13px",
    cursor: "pointer",
  },

  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "14px",
    marginBottom: "22px",
    gap: "12px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#69766e",
    fontSize: "11px",
    cursor: "pointer",
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: "#2b7748",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },

  submitButton: {
    width: "100%",
    minHeight: "50px",
    border: "none",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #2b8050, #236c42)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow:
      "0 10px 22px rgba(38, 119, 71, 0.18)",
  },

  submitButtonDisabled: {
    opacity: 0.72,
    cursor: "wait",
  },

  arrow: {
    fontSize: "18px",
    lineHeight: 1,
  },

  buttonSpinner: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.35)",
    borderTopColor: "#ffffff",
    animation: "spin 0.8s linear infinite",
  },

  divider: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "10px",
    color: "#a0aaa3",
    fontSize: "10px",
    margin: "24px 0 17px",
  },

  registerButton: {
    width: "100%",
    height: "47px",
    borderRadius: "11px",
    border: "1px solid #cfe0d4",
    background: "#f7fbf8",
    color: "#286b43",
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
  },

  backButton: {
    display: "block",
    margin: "18px auto 0",
    border: "none",
    background: "transparent",
    color: "#718078",
    fontSize: "11px",
    cursor: "pointer",
  },

  securityNote: {
    textAlign: "center",
    color: "#9aa49e",
    fontSize: "9px",
    lineHeight: 1.5,
    margin: "20px 8px 0",
  },

  loadingCard: {
    background: "#ffffff",
    border: "1px solid #e0e9e3",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    boxShadow:
      "0 20px 60px rgba(30, 73, 45, 0.09)",
  },

  spinner: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "3px solid #dbe9df",
    borderTopColor: "#2c7d4b",
    margin: "0 auto 15px",
    animation: "spin 0.8s linear infinite",
  },

  loadingText: {
    margin: 0,
    color: "#657269",
    fontSize: "13px",
  },
};

if (
  typeof document !== "undefined" &&
  !document.getElementById("krishisetu-transporter-login-animation")
) {
  const style = document.createElement("style");

  style.id =
    "krishisetu-transporter-login-animation";

  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 900px) {
      .krishisetu-transporter-login-page {
        padding: 20px;
      }
    }
  `;

  document.head.appendChild(style);
}

export default TransporterLogin;
