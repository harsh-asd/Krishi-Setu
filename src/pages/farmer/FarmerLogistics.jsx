import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";
import { Link } from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";
import { getCurrentFarmer } from "../../data/appStore";

const API_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const ACTIVE_STATUSES = new Set([
  "REQUESTED",
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
]);
const COMPLETE_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

const COPY = {
  en: {
    title: "Farmer Logistics Hub",
    subtitle: "Manage crop transport from pickup to procurement center in one place.",
    request: "Request Transport",
    tracking: "Track Trip",
    history: "Transport History",
    refresh: "Refresh",
    active: "Active Transport",
    noActive: "No active transport request",
    noActiveText: "Create a transport request when your crop is ready for pickup.",
    openRequest: "Open Request",
    viewTrip: "View Trip",
    current: "Current Status",
    transporter: "Transporter",
    vehicle: "Vehicle",
    pickup: "Pickup",
    center: "Procurement Center",
    eta: "ETA",
    updated: "Last updated",
    crop: "Crop",
    quantity: "Quantity",
    date: "Pickup Date",
    status: "Status",
    recent: "Recent Transport",
    noHistory: "No completed transport trips yet.",
    useLocation: "Use Current Location",
    locationHint: "GPS can help with faster pickup matching and easier navigation.",
    map: "Open Map",
    call: "Call",
    finding: "Checking transport requests…",
    loadError: "Unable to load transport information. Please try again.",
    retry: "Try Again",
    requested: "Searching for transporter",
    assigned: "Transporter assigned",
    enroutefarmer: "Transporter heading to you",
    picked: "Crop picked up",
    enroutecenter: "Heading to procurement center",
    delivered: "Delivered to center",
    completed: "Transport completed",
    cancelled: "Request cancelled",
    gpsCaptured: "Current GPS is available",
    farmerAccount: "Farmer account",
    ready: "Ready for transport",
    howItWorks: "How it works",
    step1: "Create request",
    step2: "Matched with transporter",
    step3: "Track pickup and delivery",
    step4: "Complete at procurement center",
  },
  hi: {
    title: "किसान लॉजिस्टिक्स हब",
    subtitle: "फसल उठाने से खरीद केंद्र तक परिवहन को एक ही जगह से संभालें।",
    request: "परिवहन रिक्वेस्ट",
    tracking: "यात्रा ट्रैक करें",
    history: "परिवहन इतिहास",
    refresh: "रिफ्रेश",
    active: "सक्रिय परिवहन",
    noActive: "कोई सक्रिय परिवहन रिक्वेस्ट नहीं",
    noActiveText: "फसल तैयार होने पर परिवहन रिक्वेस्ट बनाएं।",
    openRequest: "रिक्वेस्ट खोलें",
    viewTrip: "यात्रा देखें",
    current: "वर्तमान स्थिति",
    transporter: "ट्रांसपोर्टर",
    vehicle: "वाहन",
    pickup: "पिकअप",
    center: "खरीद केंद्र",
    eta: "अनुमानित समय",
    updated: "अंतिम अपडेट",
    crop: "फसल",
    quantity: "मात्रा",
    date: "पिकअप तारीख",
    status: "स्थिति",
    recent: "हाल का परिवहन",
    noHistory: "अभी कोई पूरा हुआ परिवहन ट्रिप नहीं है।",
    useLocation: "वर्तमान लोकेशन उपयोग करें",
    locationHint: "GPS से तेज मैचिंग और आसान नेविगेशन में मदद मिल सकती है।",
    map: "मैप खोलें",
    call: "कॉल",
    finding: "परिवहन रिक्वेस्ट जांची जा रही है…",
    loadError: "परिवहन जानकारी लोड नहीं हो सकी। फिर से प्रयास करें।",
    retry: "फिर से प्रयास करें",
    requested: "ट्रांसपोर्टर खोजा जा रहा है",
    assigned: "ट्रांसपोर्टर नियुक्त",
    enroutefarmer: "ट्रांसपोर्टर आपकी ओर आ रहा है",
    picked: "फसल उठा ली गई",
    enroutecenter: "खरीद केंद्र की ओर",
    delivered: "केंद्र पर पहुंचा दिया गया",
    completed: "परिवहन पूरा हुआ",
    cancelled: "रिक्वेस्ट रद्द",
    gpsCaptured: "वर्तमान GPS उपलब्ध है",
    farmerAccount: "किसान खाता",
    ready: "परिवहन के लिए तैयार",
    howItWorks: "यह कैसे काम करता है",
    step1: "रिक्वेस्ट बनाएं",
    step2: "ट्रांसपोर्टर से मैच करें",
    step3: "पिकअप और डिलीवरी ट्रैक करें",
    step4: "खरीद केंद्र पर पूरा करें",
  },
  te: {
    title: "రైతు లాజిస్టిక్స్ హబ్",
    subtitle: "పికప్ నుంచి కొనుగోలు కేంద్రం వరకు రవాణాను ఒకే చోట నిర్వహించండి.",
    request: "రవాణా అభ్యర్థన",
    tracking: "ట్రిప్ ట్రాక్ చేయండి",
    history: "రవాణా చరిత్ర",
    refresh: "రిఫ్రెష్",
    active: "సక్రియ రవాణా",
    noActive: "సక్రియ రవాణా అభ్యర్థన లేదు",
    noActiveText: "పంట పికప్‌కు సిద్ధమైనప్పుడు రవాణా అభ్యర్థన సృష్టించండి.",
    openRequest: "అభ్యర్థన తెరవండి",
    viewTrip: "ట్రిప్ చూడండి",
    current: "ప్రస్తుత స్థితి",
    transporter: "ట్రాన్స్‌పోర్టర్",
    vehicle: "వాహనం",
    pickup: "పికప్",
    center: "కొనుగోలు కేంద్రం",
    eta: "అంచనా సమయం",
    updated: "చివరి అప్డేట్",
    crop: "పంట",
    quantity: "పరిమాణం",
    date: "పికప్ తేదీ",
    status: "స్థితి",
    recent: "ఇటీవలి రవాణా",
    noHistory: "ఇంకా పూర్తి చేసిన రవాణా ట్రిప్ లేదు.",
    useLocation: "ప్రస్తుత లొకేషన్ ఉపయోగించండి",
    locationHint: "GPS వేగవంతమైన మ్యాచింగ్ మరియు సులభమైన నావిగేషన్‌కు సహాయపడుతుంది.",
    map: "మ్యాప్ తెరవండి",
    call: "కాల్",
    finding: "రవాణా అభ్యర్థనలు తనిఖీ చేస్తున్నాం…",
    loadError: "రవాణా సమాచారం లోడ్ కాలేదు. మళ్లీ ప్రయత్నించండి.",
    retry: "మళ్లీ ప్రయత్నించండి",
    requested: "ట్రాన్స్‌పోర్టర్ కోసం వెతుకుతోంది",
    assigned: "ట్రాన్స్‌పోర్టర్ కేటాయించబడింది",
    enroutefarmer: "ట్రాన్స్‌పోర్టర్ మీ వైపు వస్తున్నారు",
    picked: "పంట తీసుకున్నారు",
    enroutecenter: "కొనుగోలు కేంద్రానికి వెళ్తోంది",
    delivered: "కేంద్రానికి చేర్చారు",
    completed: "రవాణా పూర్తైంది",
    cancelled: "అభ్యర్థన రద్దు చేయబడింది",
    gpsCaptured: "ప్రస్తుత GPS అందుబాటులో ఉంది",
    farmerAccount: "రైతు ఖాతా",
    ready: "రవాణాకు సిద్ధం",
    howItWorks: "ఇది ఎలా పనిచేస్తుంది",
    step1: "అభ్యర్థన సృష్టించండి",
    step2: "ట్రాన్స్‌పోర్టర్‌తో మ్యాచ్ అవ్వండి",
    step3: "పికప్ మరియు డెలివరీ ట్రాక్ చేయండి",
    step4: "కొనుగోలు కేంద్రంలో పూర్తి చేయండి",
  },
};

function tx(language, key) {
  return COPY[language]?.[key] || COPY.en[key] || key;
}

function text(value) {
  return String(value ?? "").trim();
}

function statusLabel(status, language) {
  const value = text(status).toUpperCase();
  const keys = {
    REQUESTED: "requested",
    ASSIGNED: "assigned",
    EN_ROUTE_TO_FARMER: "enroutefarmer",
    CROP_PICKED_UP: "picked",
    EN_ROUTE_TO_CENTER: "enroutecenter",
    DELIVERED: "delivered",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  };
  return tx(language, keys[value] || "current");
}

function statusIcon(status) {
  const value = text(status).toUpperCase();
  if (value === "REQUESTED") return Search;
  if (value === "ASSIGNED") return UserRound;
  if (value === "EN_ROUTE_TO_FARMER") return Navigation;
  if (value === "CROP_PICKED_UP") return Package;
  if (value === "EN_ROUTE_TO_CENTER") return Route;
  if (value === "DELIVERED") return CheckCircle2;
  if (value === "COMPLETED") return ShieldCheck;
  if (value === "CANCELLED") return XCircle;
  return Truck;
}

function cropName(value) {
  const key = text(value).toLowerCase();
  const names = {
    wheat: "Wheat",
    paddy: "Paddy",
    rice: "Paddy",
    maize: "Maize",
    cotton: "Cotton",
    sugarcane: "Sugarcane",
    soybean: "Soybean",
  };
  return names[key] || text(value) || "Produce";
}

function formatDate(value, language) {
  if (!value) return "—";
  const date = new Date(String(value).includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return text(value);
  return date.toLocaleDateString(language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value, language) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return date.toLocaleTimeString(language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapHref(request) {
  const lat = Number(request?.pickup_lat ?? request?.pickupLat);
  const lng = Number(request?.pickup_lng ?? request?.pickupLng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const address = text(request?.pickup_address ?? request?.pickupAddress);
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "https://maps.google.com/";
}

function telHref(phone) {
  const clean = text(phone).replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : "#";
}

export default function FarmerLogistics() {
  const { language } = useLanguage();
  const farmer = getCurrentFarmer();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) {
      throw new Error(data?.message || data?.error?.message || `Request failed: ${response.status}`);
    }
    return data;
  }, []);

  const loadRequests = useCallback(async (silent = false) => {
    if (!farmer?.id) {
      setLoading(false);
      setError(tx(language, "farmerAccount"));
      return;
    }
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api(`/transport/requests?farmerId=${encodeURIComponent(farmer.id)}`);
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
      setError("");
    } catch (err) {
      console.error("FarmerLogistics load:", err);
      setError(err.message || tx(language, "loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, farmer?.id, language]);

  useEffect(() => {
    loadRequests(false);
  }, [loadRequests]);

  useEffect(() => {
    const timer = setInterval(() => loadRequests(true), 15000);
    return () => clearInterval(timer);
  }, [loadRequests]);

  const active = useMemo(() => {
    return requests.find((item) => ACTIVE_STATUSES.has(text(item.status).toUpperCase())) || null;
  }, [requests]);

  const recent = useMemo(() => {
    return requests
      .filter((item) => COMPLETE_STATUSES.has(text(item.status).toUpperCase()))
      .slice()
      .sort((a, b) => new Date(b.updated_at || b.updatedAt || b.created_at || 0).getTime() - new Date(a.updated_at || a.updatedAt || a.created_at || 0).getTime())
      .slice(0, 5);
  }, [requests]);

  const stats = useMemo(() => {
    const completed = requests.filter((item) => text(item.status).toUpperCase() === "COMPLETED").length;
    const cancelled = requests.filter((item) => text(item.status).toUpperCase() === "CANCELLED").length;
    return { total: requests.length, completed, cancelled };
  }, [requests]);

  const captureGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGps(null);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGps(null);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  const activeStatus = text(active?.status).toUpperCase();
  const StatusIcon = statusIcon(activeStatus);
  const transporterName = text(active?.transporter_name ?? active?.transporter?.name);
  const transporterPhone = text(active?.transporter_phone ?? active?.transporter?.phone);
  const vehicleNumber = text(active?.vehicle_number ?? active?.transporter_vehicle_number ?? active?.transporter?.vehicle_number);
  const vehicleType = text(active?.vehicle_type ?? active?.transporter_vehicle_type ?? active?.transporter?.vehicle_type);
  const pickupAddress = text(active?.pickup_address ?? active?.pickupAddress);
  const centerName = text(active?.center_name ?? active?.center?.name);

  return (
    <>
      <Header />
      <main className="fl-page">
        <section className="fl-hero">
          <div>
            <div className="fl-eyebrow"><Truck size={16} /> KRISHISETU · LOGISTICS</div>
            <h1>{tx(language, "title")}</h1>
            <p>{tx(language, "subtitle")}</p>
          </div>
          <div className="fl-hero-actions">
            <button className="fl-secondary-btn" type="button" onClick={() => loadRequests(true)} disabled={refreshing}>
              <RefreshCw size={17} className={refreshing ? "fl-spin" : ""} />
              {tx(language, "refresh")}
            </button>
            <Link className="fl-primary-btn" to="/farmer/transport">
              <Zap size={17} />
              {tx(language, "request")}
            </Link>
          </div>
        </section>

        {error && (
          <section className="fl-alert fl-error">
            <div>
              <strong>{error}</strong>
              <span>{tx(language, "loadError")}</span>
            </div>
            <button type="button" onClick={() => loadRequests(false)}>{tx(language, "retry")}</button>
          </section>
        )}

        <section className="fl-stat-grid">
          <div className="fl-stat"><Activity size={20} /><span>{tx(language, "active")}</span><strong>{active ? "1" : "0"}</strong></div>
          <div className="fl-stat"><Truck size={20} /><span>{tx(language, "recent")}</span><strong>{stats.completed}</strong></div>
          <div className="fl-stat"><Clock3 size={20} /><span>{tx(language, "status")}</span><strong>{stats.total}</strong></div>
        </section>

        <section className="fl-layout">
          <div className="fl-main">
            <div className="fl-section-head">
              <div>
                <span className="fl-section-kicker">01</span>
                <h2>{tx(language, "active")}</h2>
              </div>
              {active && <span className="fl-live"><span /> LIVE</span>}
            </div>

            {loading ? (
              <div className="fl-card fl-loading"><RefreshCw className="fl-spin" size={22} />{tx(language, "finding")}</div>
            ) : active ? (
              <article className="fl-active-card">
                <div className="fl-active-top">
                  <div className="fl-status-icon"><StatusIcon size={23} /></div>
                  <div>
                    <div className="fl-status-label">{tx(language, "current")}</div>
                    <h3>{statusLabel(activeStatus, language)}</h3>
                    <div className="fl-muted">{text(active.request_id ?? active.id)}</div>
                  </div>
                  <div className="fl-active-actions">
                    <Link to={`/farmer/transport?request=${encodeURIComponent(active.id)}`} className="fl-ghost-btn">{tx(language, "tracking")} <ArrowRight size={16} /></Link>
                    <a className="fl-icon-btn" href={mapHref(active)} target="_blank" rel="noreferrer" title={tx(language, "map")}><MapPin size={18} /></a>
                  </div>
                </div>

                <div className="fl-progress">
                  {["REQUESTED", "ASSIGNED", "EN_ROUTE_TO_FARMER", "CROP_PICKED_UP", "EN_ROUTE_TO_CENTER", "DELIVERED", "COMPLETED"].map((step, index) => {
                    const flow = ["REQUESTED", "ASSIGNED", "EN_ROUTE_TO_FARMER", "CROP_PICKED_UP", "EN_ROUTE_TO_CENTER", "DELIVERED", "COMPLETED"];
                    const currentIndex = flow.indexOf(activeStatus);
                    const done = currentIndex >= index && currentIndex >= 0;
                    return (
                      <div className={`fl-progress-step ${done ? "done" : ""}`} key={step}>
                        <div className="fl-progress-dot">{done ? <CheckCircle2 size={13} /> : index + 1}</div>
                        <span>{statusLabel(step, language)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="fl-detail-grid">
                  <InfoCard icon={Package} label={tx(language, "crop")} value={cropName(active.crop)} />
                  <InfoCard icon={Activity} label={tx(language, "quantity")} value={`${text(active.quantity_kg ?? active.quantityKg) || "—"} kg`} />
                  <InfoCard icon={CalendarDays} label={tx(language, "date")} value={formatDate(active.requested_date ?? active.requestedDate, language)} />
                  <InfoCard icon={MapPin} label={tx(language, "pickup")} value={pickupAddress || "—"} />
                  <InfoCard icon={Route} label={tx(language, "center")} value={centerName || "—"} />
                  <InfoCard icon={Clock3} label={tx(language, "updated")} value={formatTime(active.updated_at ?? active.updatedAt, language)} />
                </div>

                <div className="fl-transporter">
                  <div className="fl-person-icon"><UserRound size={20} /></div>
                  <div className="fl-transporter-info">
                    <span>{tx(language, "transporter")}</span>
                    <strong>{transporterName || "Awaiting transporter"}</strong>
                    <small>{vehicleType || tx(language, "vehicle")} {vehicleNumber ? `· ${vehicleNumber}` : ""}</small>
                  </div>
                  <div className="fl-row-actions">
                    {transporterPhone && <a href={telHref(transporterPhone)} className="fl-secondary-btn"><Phone size={16} />{tx(language, "call")}</a>}
                    <a href={mapHref(active)} target="_blank" rel="noreferrer" className="fl-secondary-btn"><Navigation size={16} />{tx(language, "map")}</a>
                    <Link to={`/farmer/transport?request=${encodeURIComponent(active.id)}`} className="fl-primary-btn">{tx(language, "viewTrip")} <ArrowRight size={16} /></Link>
                  </div>
                </div>
              </article>
            ) : (
              <div className="fl-empty">
                <div className="fl-empty-icon"><Truck size={28} /></div>
                <h3>{tx(language, "noActive")}</h3>
                <p>{tx(language, "noActiveText")}</p>
                <Link to="/farmer/transport" className="fl-primary-btn"><Zap size={17} />{tx(language, "request")}</Link>
              </div>
            )}
          </div>

          <aside className="fl-side">
            <div className="fl-side-card">
              <div className="fl-side-head"><LocateFixed size={20} /><h3>{tx(language, "useLocation")}</h3></div>
              <p>{tx(language, "locationHint")}</p>
              <button type="button" className="fl-location-btn" onClick={captureGps} disabled={gpsLoading}>
                <LocateFixed size={17} className={gpsLoading ? "fl-spin" : ""} />
                {gpsLoading ? "…" : tx(language, "useLocation")}
              </button>
              {gps ? (
                <div className="fl-gps-ok"><CheckCircle2 size={16} /><span>{tx(language, "gpsCaptured")}<small>{gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}</small></span></div>
              ) : (
                <div className="fl-gps-note"><MapPin size={15} />Manual pickup address is still supported.</div>
              )}
            </div>

            <div className="fl-side-card">
              <div className="fl-side-head"><Zap size={20} /><h3>{tx(language, "ready")}</h3></div>
              <Link to="/farmer/transport" className="fl-side-link"><span>{tx(language, "request")}</span><ArrowRight size={17} /></Link>
              <Link to="/farmer/transport" className="fl-side-link"><span>{tx(language, "history")}</span><ArrowRight size={17} /></Link>
            </div>

            <div className="fl-side-card fl-how">
              <div className="fl-side-head"><ShieldCheck size={20} /><h3>{tx(language, "howItWorks")}</h3></div>
              <Step number="01" text={tx(language, "step1")} />
              <Step number="02" text={tx(language, "step2")} />
              <Step number="03" text={tx(language, "step3")} />
              <Step number="04" text={tx(language, "step4")} />
            </div>
          </aside>
        </section>

        <section className="fl-history">
          <div className="fl-section-head">
            <div><span className="fl-section-kicker">02</span><h2>{tx(language, "recent")}</h2></div>
            <Link to="/farmer/transport" className="fl-text-link">{tx(language, "history")} <ArrowRight size={15} /></Link>
          </div>
          {recent.length === 0 ? (
            <div className="fl-card fl-empty-history">{tx(language, "noHistory")}</div>
          ) : (
            <div className="fl-table-wrap">
              <table className="fl-table">
                <thead>
                  <tr><th>{tx(language, "crop")}</th><th>{tx(language, "quantity")}</th><th>{tx(language, "date")}</th><th>{tx(language, "status")}</th><th /></tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{cropName(item.crop)}</strong></td>
                      <td>{text(item.quantity_kg ?? item.quantityKg) || "—"} kg</td>
                      <td>{formatDate(item.requested_date ?? item.requestedDate, language)}</td>
                      <td><span className="fl-history-status"><CheckCircle2 size={14} />{statusLabel(item.status, language)}</span></td>
                      <td><Link to={`/farmer/transport?request=${encodeURIComponent(item.id)}`} className="fl-small-btn">{tx(language, "openRequest")}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <style>{styles}</style>
    </>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="fl-info-card"><Icon size={17} /><span>{label}</span><strong>{value}</strong></div>
  );
}

function Step({ number, text }) {
  return <div className="fl-step"><span>{number}</span><strong>{text}</strong></div>;
}

const styles = `
.fl-page{min-height:100vh;background:linear-gradient(180deg,#f7fbf8 0,#eef6f0 100%);padding:34px clamp(18px,4vw,64px) 70px;color:#173321;font-family:inherit}
.fl-hero{max-width:1320px;margin:0 auto 22px;display:flex;justify-content:space-between;gap:24px;align-items:flex-end}
.fl-eyebrow{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:.14em;color:#378457;margin-bottom:9px}
.fl-hero h1{margin:0;font-size:clamp(30px,4vw,48px);letter-spacing:-.04em;line-height:1.02}.fl-hero p{margin:12px 0 0;color:#63756a;max-width:680px;font-size:15px;line-height:1.6}
.fl-hero-actions,.fl-active-actions,.fl-row-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.fl-primary-btn,.fl-secondary-btn,.fl-ghost-btn,.fl-icon-btn,.fl-small-btn,.fl-location-btn{font:inherit;text-decoration:none;cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;transition:.2s ease}.fl-primary-btn{background:#245f3b;color:#fff;padding:12px 16px;box-shadow:0 8px 20px rgba(36,95,59,.18)}.fl-primary-btn:hover{transform:translateY(-1px);background:#1d5232}.fl-secondary-btn{background:#fff;color:#294437;border:1px solid #dce8df;padding:11px 14px}.fl-secondary-btn:hover,.fl-ghost-btn:hover{border-color:#a7c9b4;background:#f8fcf9}.fl-ghost-btn{padding:10px 13px;background:#f5faf6;border:1px solid #d9e8dd;color:#245f3b}.fl-icon-btn{width:42px;height:42px;background:#fff;border:1px solid #dce8df;color:#315741}.fl-stat-grid{max-width:1320px;margin:0 auto 22px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.fl-stat{background:#fff;border:1px solid #dfebe2;border-radius:16px;padding:16px 18px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;box-shadow:0 8px 24px rgba(33,72,45,.05)}.fl-stat svg{color:#3c8758}.fl-stat span{font-size:13px;color:#687a70}.fl-stat strong{font-size:25px}.fl-layout{max-width:1320px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:22px}.fl-main,.fl-side{min-width:0}.fl-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.fl-section-head>div{display:flex;align-items:center;gap:9px}.fl-section-kicker{font-size:11px;font-weight:900;color:#65a178}.fl-section-head h2{margin:0;font-size:20px;letter-spacing:-.02em}.fl-live{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:900;letter-spacing:.1em;color:#2c7f4b}.fl-live span{width:8px;height:8px;border-radius:50%;background:#49a96b;box-shadow:0 0 0 5px rgba(73,169,107,.12)}.fl-card,.fl-active-card,.fl-empty,.fl-side-card{background:#fff;border:1px solid #dfeae1;border-radius:20px;box-shadow:0 12px 30px rgba(33,72,45,.06)}.fl-loading{min-height:160px;display:flex;align-items:center;justify-content:center;gap:10px;color:#728078}.fl-active-card{padding:18px}.fl-active-top{display:flex;gap:14px;align-items:center;border-bottom:1px solid #e7efe9;padding-bottom:18px}.fl-status-icon{width:48px;height:48px;border-radius:15px;background:#e9f5ed;color:#32764b;display:grid;place-items:center;flex:0 0 auto}.fl-status-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#829187;font-weight:800}.fl-active-top h3{margin:3px 0 4px;font-size:20px}.fl-muted{font-size:11px;color:#87958c}.fl-active-actions{margin-left:auto}.fl-progress{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:20px 2px 6px}.fl-progress-step{text-align:center;min-width:0}.fl-progress-dot{width:26px;height:26px;border-radius:50%;margin:0 auto 7px;border:1px solid #d7e5db;background:#e2f4e5;color:#8a9990;font-size:11px;font-weight:800;display:grid;place-items:center}.fl-progress-step.done .fl-progress-dot{background:#2e7a4b;border-color:#2e7a4b;color:#fff}.fl-progress-step span{font-size:9px;line-height:1.3;color:#819087;display:block}.fl-progress-step.done span{color:#356b47;font-weight:700}.fl-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:17px}.fl-info-card{border:1px solid #e4ede7;border-radius:13px;padding:12px;display:grid;grid-template-columns:auto 1fr;column-gap:8px;row-gap:4px;background:#fbfdfb}.fl-info-card svg{grid-row:1/3;color:#4d8862;margin-top:1px}.fl-info-card span{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#8a978f;font-weight:800}.fl-info-card strong{font-size:13px;line-height:1.4;overflow-wrap:anywhere}.fl-transporter{margin-top:14px;padding:14px;background:#f6faf7;border:1px solid #dfeae1;border-radius:15px;display:flex;align-items:center;gap:12px}.fl-person-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#e7f3eb;color:#377a4f}.fl-transporter-info{min-width:0}.fl-transporter-info span{display:block;font-size:10px;color:#819087;text-transform:uppercase;font-weight:800;letter-spacing:.07em}.fl-transporter-info strong{display:block;margin-top:2px;font-size:14px}.fl-transporter-info small{color:#77867d}.fl-row-actions{margin-left:auto;justify-content:flex-end}.fl-empty{min-height:270px;padding:30px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}.fl-empty-icon{width:64px;height:64px;border-radius:20px;background:#ebf5ee;color:#347b50;display:grid;place-items:center;margin-bottom:13px}.fl-empty h3{margin:0;font-size:20px}.fl-empty p{max-width:470px;color:#77867d;line-height:1.6;margin:9px 0 18px}.fl-side{display:flex;flex-direction:column;gap:14px}.fl-side-card{padding:17px}.fl-side-head{display:flex;gap:10px;align-items:center}.fl-side-head svg{color:#397f52}.fl-side-head h3{font-size:15px;margin:0}.fl-side-card p{color:#718079;font-size:13px;line-height:1.55;margin:10px 0 14px}.fl-location-btn{width:100%;background:#285f3d;color:#fff;padding:11px 14px}.fl-location-btn:disabled{opacity:.65;cursor:wait}.fl-gps-ok{display:flex;gap:9px;margin-top:11px;padding:10px 11px;border-radius:11px;background:#eef8f1;color:#317647;font-size:12px}.fl-gps-ok svg{flex:0 0 auto}.fl-gps-ok small{display:block;color:#64786c;margin-top:3px}.fl-gps-note{display:flex;gap:7px;align-items:center;margin-top:10px;font-size:11px;color:#849088}.fl-side-link,.fl-text-link{display:flex;align-items:center;justify-content:space-between;gap:8px;text-decoration:none;color:#315a3f;border-top:1px solid #edf2ee;padding:12px 0;font-size:13px;font-weight:700}.fl-side-link:first-of-type{margin-top:4px}.fl-text-link{border:0;padding:0;color:#39794f}.fl-step{display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #edf2ee}.fl-step span{font-size:10px;font-weight:900;color:#63a079}.fl-step strong{font-size:12px}.fl-history{max-width:1320px;margin:28px auto 0}.fl-table-wrap{background:#fff;border:1px solid #dfeae1;border-radius:18px;overflow:auto;box-shadow:0 12px 30px rgba(33,72,45,.05)}.fl-table{width:100%;border-collapse:collapse;min-width:720px}.fl-table th,.fl-table td{padding:14px 16px;text-align:left;border-bottom:1px solid #edf2ee;font-size:12px}.fl-table th{text-transform:uppercase;letter-spacing:.08em;font-size:10px;color:#89958e;background:#fbfdfb}.fl-table tr:last-child td{border-bottom:0}.fl-history-status{display:inline-flex;align-items:center;gap:6px;color:#39784e;font-weight:700}.fl-small-btn{padding:8px 11px;background:#f0f7f2;color:#2f6b45;font-weight:700}.fl-empty-history{padding:27px;color:#849088;font-size:13px}.fl-alert{max-width:1320px;margin:0 auto 18px;border-radius:15px;padding:13px 15px;display:flex;justify-content:space-between;align-items:center;gap:18px}.fl-alert strong{display:block;font-size:13px}.fl-alert span{display:block;margin-top:2px;font-size:11px;opacity:.8}.fl-error{background:#fff1ef;border:1px solid #ffd5ce;color:#9b4439}.fl-alert button{border:0;border-radius:10px;padding:8px 12px;background:#fff;color:#8e4137;cursor:pointer}.fl-spin{animation:flspin .9s linear infinite}@keyframes flspin{to{transform:rotate(360deg)}}
@media(max-width:1050px){.fl-layout{grid-template-columns:1fr}.fl-side{display:grid;grid-template-columns:repeat(3,1fr)}.fl-progress{grid-template-columns:repeat(4,1fr);row-gap:15px}.fl-detail-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.fl-page{padding:22px 14px 50px}.fl-hero{align-items:stretch;flex-direction:column}.fl-hero-actions{width:100%}.fl-hero-actions>*{flex:1}.fl-stat-grid{grid-template-columns:1fr}.fl-side{display:flex}.fl-active-top{align-items:flex-start;flex-wrap:wrap}.fl-active-actions{margin-left:0;width:100%}.fl-progress{grid-template-columns:repeat(3,1fr)}.fl-detail-grid{grid-template-columns:1fr}.fl-transporter{align-items:flex-start;flex-wrap:wrap}.fl-row-actions{width:100%;margin-left:0}.fl-row-actions>*{flex:1}.fl-table{min-width:640px}}
`;
