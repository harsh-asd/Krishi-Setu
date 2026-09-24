import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  Truck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import AdminLayout from "../../components/admin/AdminLayout";
import { useLanguage } from "../../translations/LanguageContext";

const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// VITE_API_URL may already end with /api.
// The endpoint below includes /api, so remove it once to avoid /api/api/...
const API_BASE = String(RAW_API_BASE)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const ACTIVE_STATUSES = new Set([
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
]);

const STATUS_ORDER = [
  "REQUESTED",
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];

const COPY = {
  en: {
    eyebrow: "TRANSPORT CONTROL",
    title: "Transport Operations",
    subtitle:
      "Monitor farmer transport requests, active trips and transporter activity from one place.",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    live: "Live operations",
    pending: "Pending requests",
    active: "Active trips",
    completed: "Completed trips",
    online: "Online transporters",
    allRequests: "Transport requests",
    activeTrips: "Active trips",
    search: "Search farmer, village, crop, vehicle or transporter",
    all: "All",
    requested: "Requested",
    assigned: "Assigned",
    moving: "Moving",
    delivered: "Delivered",
    completedTab: "Completed",
    cancelled: "Cancelled",
    noData: "No transport records found",
    noDataText: "Try another filter or refresh the live transport data.",
    farmer: "Farmer",
    crop: "Crop",
    quantity: "Quantity",
    pickup: "Pickup",
    center: "Center",
    transporter: "Transporter",
    vehicle: "Vehicle",
    status: "Status",
    requestedAt: "Requested",
    eta: "ETA",
    location: "Location",
    view: "View trip",
    openMaps: "Open maps",
    call: "Call",
    serviceArea: "Service area",
    noTransporter: "Waiting for transporter",
    onlineNow: "Online now",
    offline: "Offline",
    transporters: "Transporters",
    lastUpdate: "Last update",
    liveGps: "GPS available",
    noGps: "GPS not reported",
    region: "Region",
    cropFallback: "Produce",
    kg: "kg",
    minutes: "min",
    system: "System status",
    connected: "Transport API connected",
    apiError: "Transport API could not be reached.",
    retry: "Retry",
    back: "Admin dashboard",
  },
  hi: {
    eyebrow: "परिवहन नियंत्रण",
    title: "परिवहन संचालन",
    subtitle:
      "किसानों की परिवहन रिक्वेस्ट, सक्रिय यात्राओं और ट्रांसपोर्टर गतिविधि को एक जगह देखें।",
    refresh: "रिफ्रेश",
    refreshing: "रिफ्रेश हो रहा है…",
    live: "लाइव संचालन",
    pending: "लंबित रिक्वेस्ट",
    active: "सक्रिय यात्राएं",
    completed: "पूरी यात्राएं",
    online: "ऑनलाइन ट्रांसपोर्टर",
    allRequests: "परिवहन रिक्वेस्ट",
    activeTrips: "सक्रिय यात्राएं",
    search: "किसान, गांव, फसल, वाहन या ट्रांसपोर्टर खोजें",
    all: "सभी",
    requested: "अनुरोधित",
    assigned: "नियुक्त",
    moving: "यात्रा में",
    delivered: "डिलीवर",
    completedTab: "पूरी",
    cancelled: "रद्द",
    noData: "कोई परिवहन रिकॉर्ड नहीं मिला",
    noDataText: "कोई दूसरा फिल्टर चुनें या लाइव डेटा रिफ्रेश करें।",
    farmer: "किसान",
    crop: "फसल",
    quantity: "मात्रा",
    pickup: "पिकअप",
    center: "केंद्र",
    transporter: "ट्रांसपोर्टर",
    vehicle: "वाहन",
    status: "स्थिति",
    requestedAt: "रिक्वेस्ट",
    eta: "ETA",
    location: "स्थान",
    view: "यात्रा देखें",
    openMaps: "मैप खोलें",
    call: "कॉल",
    serviceArea: "सेवा क्षेत्र",
    noTransporter: "ट्रांसपोर्टर की प्रतीक्षा",
    onlineNow: "अभी ऑनलाइन",
    offline: "ऑफलाइन",
    transporters: "ट्रांसपोर्टर",
    lastUpdate: "अंतिम अपडेट",
    liveGps: "GPS उपलब्ध",
    noGps: "GPS उपलब्ध नहीं",
    region: "क्षेत्र",
    cropFallback: "उत्पाद",
    kg: "किग्रा",
    minutes: "मिनट",
    system: "सिस्टम स्थिति",
    connected: "ट्रांसपोर्ट API कनेक्टेड",
    apiError: "ट्रांसपोर्ट API तक पहुंच नहीं हो सकी।",
    retry: "दोबारा प्रयास",
    back: "एडमिन डैशबोर्ड",
  },
  te: {
    eyebrow: "రవాణా నియంత్రణ",
    title: "రవాణా కార్యకలాపాలు",
    subtitle:
      "రైతుల రవాణా అభ్యర్థనలు, యాక్టివ్ ట్రిప్‌లు మరియు ట్రాన్స్‌పోర్టర్ కార్యకలాపాలను ఒక చోట చూడండి.",
    refresh: "రిఫ్రెష్",
    refreshing: "రిఫ్రెష్ అవుతోంది…",
    live: "లైవ్ ఆపరేషన్స్",
    pending: "పెండింగ్ అభ్యర్థనలు",
    active: "యాక్టివ్ ట్రిప్‌లు",
    completed: "పూర్తైన ట్రిప్‌లు",
    online: "ఆన్‌లైన్ ట్రాన్స్‌పోర్టర్లు",
    allRequests: "రవాణా అభ్యర్థనలు",
    activeTrips: "యాక్టివ్ ట్రిప్‌లు",
    search: "రైతు, గ్రామం, పంట, వాహనం లేదా ట్రాన్స్‌పోర్టర్‌ను వెతకండి",
    all: "అన్నీ",
    requested: "అభ్యర్థించబడింది",
    assigned: "కేటాయించబడింది",
    moving: "ప్రయాణంలో",
    delivered: "చేర్చబడింది",
    completedTab: "పూర్తైంది",
    cancelled: "రద్దు",
    noData: "రవాణా రికార్డులు ఏవీ లేవు",
    noDataText: "మరొక ఫిల్టర్ ఎంచుకోండి లేదా లైవ్ డేటాను రిఫ్రెష్ చేయండి.",
    farmer: "రైతు",
    crop: "పంట",
    quantity: "పరిమాణం",
    pickup: "పికప్",
    center: "కేంద్రం",
    transporter: "ట్రాన్స్‌పోర్టర్",
    vehicle: "వాహనం",
    status: "స్థితి",
    requestedAt: "అభ్యర్థన",
    eta: "ETA",
    location: "స్థానం",
    view: "ట్రిప్ చూడండి",
    openMaps: "మ్యాప్ తెరువు",
    call: "కాల్",
    serviceArea: "సేవా ప్రాంతం",
    noTransporter: "ట్రాన్స్‌పోర్టర్ కోసం వేచి ఉంది",
    onlineNow: "ఇప్పుడు ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    transporters: "ట్రాన్స్‌పోర్టర్లు",
    lastUpdate: "చివరి అప్డేట్",
    liveGps: "GPS అందుబాటులో ఉంది",
    noGps: "GPS నివేదించబడలేదు",
    region: "ప్రాంతం",
    cropFallback: "ఉత్పత్తి",
    kg: "కిలోలు",
    minutes: "నిమిషాలు",
    system: "సిస్టమ్ స్థితి",
    connected: "ట్రాన్స్‌పోర్ట్ API కనెక్ట్ అయింది",
    apiError: "ట్రాన్స్‌పోర్ట్ API అందుబాటులో లేదు.",
    retry: "మళ్లీ ప్రయత్నించండి",
    back: "అడ్మిన్ డ్యాష్‌బోర్డ్",
  },
};

const STATUS_COPY = {
  en: {
    REQUESTED: "Requested",
    ASSIGNED: "Assigned",
    EN_ROUTE_TO_FARMER: "En route to farmer",
    CROP_PICKED_UP: "Crop picked up",
    EN_ROUTE_TO_CENTER: "En route to center",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },
  hi: {
    REQUESTED: "अनुरोधित",
    ASSIGNED: "नियुक्त",
    EN_ROUTE_TO_FARMER: "किसान की ओर",
    CROP_PICKED_UP: "फसल उठाई गई",
    EN_ROUTE_TO_CENTER: "केंद्र की ओर",
    DELIVERED: "डिलीवर",
    COMPLETED: "पूरा",
    CANCELLED: "रद्द",
  },
  te: {
    REQUESTED: "అభ్యర్థించబడింది",
    ASSIGNED: "కేటాయించబడింది",
    EN_ROUTE_TO_FARMER: "రైతు వైపు",
    CROP_PICKED_UP: "పంట తీసుకున్నారు",
    EN_ROUTE_TO_CENTER: "కేంద్రం వైపు",
    DELIVERED: "చేర్చబడింది",
    COMPLETED: "పూర్తైంది",
    CANCELLED: "రద్దు",
  },
};

function t(language, key) {
  return COPY[language]?.[key] || COPY.en[key] || key;
}

function statusText(language, status) {
  const key = String(status || "").toUpperCase();
  return STATUS_COPY[language]?.[key] || STATUS_COPY.en[key] || key || "—";
}

function clean(value) {
  return String(value ?? "").trim();
}

function numberValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function firstValue(...values) {
  return values.find((value) => clean(value)) || "";
}

function getRequestId(row) {
  return row?.id ?? row?.request_id ?? row?.transport_request_id ?? "";
}

function getFarmerName(row) {
  return firstValue(
    row?.farmer_name,
    row?.farmerName,
    row?.farmer?.name,
    "Unknown farmer"
  );
}

function getTransporterName(row) {
  return firstValue(
    row?.transporter_name,
    row?.transporterName,
    row?.transporter?.name,
    ""
  );
}

function getCrop(row) {
  return firstValue(
    row?.crop_name,
    row?.cropName,
    row?.crop,
    ""
  );
}

function getQuantity(row) {
  return numberValue(
    firstValue(row?.quantity_kg, row?.quantityKg, row?.quantity, 0)
  );
}

function getVehicle(row) {
  const type = firstValue(
    row?.vehicle_type,
    row?.vehicleType,
    row?.transporter_vehicle_type
  );
  const number = firstValue(
    row?.vehicle_number,
    row?.vehicleNumber,
    row?.transporter_vehicle_number
  );
  return [type, number].filter(Boolean).join(" • ") || "—";
}

function getPickup(row) {
  return firstValue(
    row?.pickup_address,
    row?.pickupAddress,
    row?.farmer_village,
    row?.village,
    "—"
  );
}

function getCenter(row) {
  return firstValue(
    row?.center_name,
    row?.centerName,
    row?.procurement_center_name,
    row?.procurementCenterName,
    "—"
  );
}

function getRegion(row) {
  const village = firstValue(row?.farmer_village, row?.village);
  const district = firstValue(row?.farmer_district, row?.district);
  const state = firstValue(row?.farmer_state, row?.state);
  return [village, district, state].filter(Boolean).join(", ") || "—";
}

function dateLabel(value, language) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return clean(value);
  const locale = language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN";
  return d.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapsUrl(lat, lng, address) {
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
  }
  if (clean(address)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  }
  return "";
}

function filterBucket(status) {
  const s = String(status || "").toUpperCase();
  if (s === "REQUESTED") return "requested";
  if (s === "ASSIGNED") return "assigned";
  if (ACTIVE_STATUSES.has(s)) return "moving";
  if (s === "DELIVERED") return "delivered";
  if (s === "COMPLETED") return "completed";
  if (s === "CANCELLED") return "cancelled";
  return "all";
}

export default function AdminTransportDashboard() {
  const { language } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [apiConnected, setApiConnected] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/transport/requests?activeOnly=false`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || t(language, "apiError")
        );
      }

      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.requests)
          ? payload.requests
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      setRows(data);
      setLastUpdated(new Date());
      setApiConnected(true);
    } catch (requestError) {
      setApiConnected(false);
      setError(requestError?.message || t(language, "apiError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => load(false), 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => String(r?.status).toUpperCase() === "REQUESTED").length;
    const active = rows.filter((r) => ACTIVE_STATUSES.has(String(r?.status).toUpperCase())).length;
    const completed = rows.filter((r) => String(r?.status).toUpperCase() === "COMPLETED").length;
    const onlineTransporters = new Set(
      rows
        .filter((r) => r?.transporter_online || r?.is_online)
        .map((r) => r?.transporter_id ?? r?.transporterId)
        .filter(Boolean)
    ).size;

    return { pending, active, completed, onlineTransporters };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows
      .filter((row) => {
        const status = String(row?.status || "").toUpperCase();
        if (filter !== "all" && filterBucket(status) !== filter) return false;
        if (!q) return true;

        const haystack = [
          getFarmerName(row),
          getTransporterName(row),
          getCrop(row),
          getVehicle(row),
          getPickup(row),
          getCenter(row),
          getRegion(row),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
      .sort((a, b) => {
        const aDate = new Date(firstValue(a?.created_at, a?.createdAt, a?.requested_at, a?.requestedAt)).getTime();
        const bDate = new Date(firstValue(b?.created_at, b?.createdAt, b?.requested_at, b?.requestedAt)).getTime();
        return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
      });
  }, [rows, query, filter]);

  const activeRows = useMemo(
    () => rows.filter((row) => ACTIVE_STATUSES.has(String(row?.status).toUpperCase())),
    [rows]
  );

  const selected = useMemo(
    () => rows.find((row) => String(getRequestId(row)) === String(selectedId)) || null,
    [rows, selectedId]
  );

  const filterItems = [
    ["all", t(language, "all")],
    ["requested", t(language, "requested")],
    ["assigned", t(language, "assigned")],
    ["moving", t(language, "moving")],
    ["delivered", t(language, "delivered")],
    ["completed", t(language, "completedTab")],
    ["cancelled", t(language, "cancelled")],
  ];

  return (
    <AdminLayout>
      <div className="at-page">
        <style>{STYLE}</style>

        <header className="at-header">
          <div>
            <div className="at-eyebrow">{t(language, "eyebrow")}</div>
            <h1>{t(language, "title")}</h1>
            <p>{t(language, "subtitle")}</p>
          </div>
          <div className="at-head-actions">
            <Link to="/admin" className="at-plain-link">
              ← {t(language, "back")}
            </Link>
            <button
              className="at-refresh"
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              {refreshing ? t(language, "refreshing") : t(language, "refresh")}
            </button>
          </div>
        </header>

        <section className="at-stats">
          <StatCard icon={<Clock3 size={19} />} value={stats.pending} label={t(language, "pending")} />
          <StatCard icon={<Activity size={19} />} value={stats.active} label={t(language, "active")} />
          <StatCard icon={<CheckCircle2 size={19} />} value={stats.completed} label={t(language, "completed")} />
          <StatCard icon={<Users size={19} />} value={stats.onlineTransporters} label={t(language, "online")} />
        </section>

        <section className="at-systembar">
          <div className="at-system-dot" />
          <strong>{t(language, "live")}</strong>
          <span>{t(language, "connected")}</span>
          {lastUpdated && <small>{t(language, "lastUpdate")}: {lastUpdated.toLocaleTimeString()}</small>}
        </section>

        {error && (
          <div className="at-alert error">
            <AlertCircle size={18} />
            <div>
              <strong>{t(language, "apiError")}</strong>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => load(true)}>{t(language, "retry")}</button>
          </div>
        )}

        <section className="at-main-card">
          <div className="at-toolbar">
            <div>
              <div className="at-card-label">{t(language, "allRequests")}</div>
              <h2>{visibleRows.length}</h2>
            </div>
            <div className="at-search-wrap">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(language, "search")}
              />
            </div>
          </div>

          <div className="at-filters">
            {filterItems.map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={filter === key ? "selected" : ""}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="at-empty">
              <RefreshCw className="spin" size={24} />
              <strong>Loading transport operations…</strong>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="at-empty">
              <Truck size={28} />
              <strong>{t(language, "noData")}</strong>
              <span>{t(language, "noDataText")}</span>
            </div>
          ) : (
            <div className="at-request-list">
              {visibleRows.map((row) => (
                <TransportRow
                  key={getRequestId(row) || `${getFarmerName(row)}-${row?.created_at || Math.random()}`}
                  row={row}
                  language={language}
                  onSelect={() => setSelectedId(getRequestId(row))}
                />
              ))}
            </div>
          )}
        </section>

        <section className="at-main-card">
          <div className="at-toolbar compact">
            <div>
              <div className="at-card-label">{t(language, "activeTrips")}</div>
              <h2>{activeRows.length}</h2>
            </div>
            <div className="at-live-pill">
              <Zap size={13} /> {t(language, "live")}
            </div>
          </div>

          {activeRows.length === 0 ? (
            <div className="at-mini-empty">{t(language, "noData")}</div>
          ) : (
            <div className="at-active-grid">
              {activeRows.slice(0, 12).map((row) => {
                const id = getRequestId(row);
                const lat = firstValue(row?.transporter_lat, row?.transporterLat, row?.current_lat, row?.currentLat);
                const lng = firstValue(row?.transporter_lng, row?.transporterLng, row?.current_lng, row?.currentLng);
                const address = firstValue(row?.transporter_location_address, row?.current_address, getPickup(row));
                const map = mapsUrl(lat, lng, address);
                const phone = firstValue(row?.transporter_phone, row?.transporterPhone);

                return (
                  <article className="at-trip" key={id}>
                    <div className="at-trip-top">
                      <div className="at-trip-icon"><Truck size={18} /></div>
                      <span className={`at-badge status-${String(row?.status || "").toLowerCase()}`}>
                        {statusText(language, row?.status)}
                      </span>
                    </div>
                    <strong>{getFarmerName(row)}</strong>
                    <span>{getTransporterName(row) || t(language, "noTransporter")}</span>
                    <div className="at-trip-meta">
                      <span>{getCrop(row) || t(language, "cropFallback")}</span>
                      <span>{getQuantity(row) > 0 ? `${getQuantity(row)} ${t(language, "kg")}` : "—"}</span>
                    </div>
                    <div className="at-trip-route">
                      <MapPin size={14} />
                      <span>{getPickup(row)}</span>
                      <Navigation size={14} />
                      <span>{getCenter(row)}</span>
                    </div>
                    <div className="at-trip-actions">
                      {map && (
                        <a href={map} target="_blank" rel="noreferrer">
                          <Navigation size={13} /> {t(language, "openMaps")}
                        </a>
                      )}
                      {phone && (
                        <a href={`tel:${phone}`}>
                          <Phone size={13} /> {t(language, "call")}
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {selected && (
          <div className="at-modal-backdrop" onMouseDown={() => setSelectedId("")}>
            <div className="at-modal" onMouseDown={(event) => event.stopPropagation()}>
              <button className="at-modal-close" type="button" onClick={() => setSelectedId("")} aria-label="Close">×</button>
              <div className="at-card-label">{t(language, "status")}</div>
              <h2>{statusText(language, selected?.status)}</h2>
              <div className="at-detail-grid">
                <Detail label={t(language, "farmer")} value={getFarmerName(selected)} />
                <Detail label={t(language, "transporter")} value={getTransporterName(selected) || t(language, "noTransporter")} />
                <Detail label={t(language, "crop")} value={getCrop(selected) || t(language, "cropFallback")} />
                <Detail label={t(language, "quantity")} value={`${getQuantity(selected)} ${t(language, "kg")}`} />
                <Detail label={t(language, "vehicle")} value={getVehicle(selected)} />
                <Detail label={t(language, "pickup")} value={getPickup(selected)} />
                <Detail label={t(language, "center")} value={getCenter(selected)} />
                <Detail label={t(language, "region")} value={getRegion(selected)} />
                <Detail label={t(language, "requestedAt")} value={dateLabel(firstValue(selected?.created_at, selected?.createdAt, selected?.requested_at, selected?.requestedAt), language)} />
                <Detail label={t(language, "location")} value={selected?.transporter_lat ? t(language, "liveGps") : t(language, "noGps")} />
              </div>
              <div className="at-modal-footer">
                <a className="at-modal-btn" href={`/transporter/trip/${getRequestId(selected)}`}>
                  <Navigation size={14} /> {t(language, "view")}
                </a>
                {(() => {
                  const phone = firstValue(selected?.transporter_phone, selected?.transporterPhone);
                  return phone ? (
                    <a className="at-modal-btn muted" href={`tel:${phone}`}>
                      <Phone size={14} /> {t(language, "call")}
                    </a>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="at-stat">
      <div className="at-stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function TransportRow({ row, language, onSelect }) {
  const status = String(row?.status || "").toUpperCase();
  const lat = firstValue(row?.transporter_lat, row?.transporterLat, row?.current_lat, row?.currentLat);
  const lng = firstValue(row?.transporter_lng, row?.transporterLng, row?.current_lng, row?.currentLng);
  const address = firstValue(row?.transporter_location_address, row?.current_address, getPickup(row));
  const map = mapsUrl(lat, lng, address);

  return (
    <button className="at-request" type="button" onClick={onSelect}>
      <div className="at-request-id">#{getRequestId(row) || "—"}</div>
      <div className="at-request-main">
        <strong>{getFarmerName(row)}</strong>
        <span>{getRegion(row)}</span>
      </div>
      <div className="at-request-main">
        <strong>{getCrop(row) || "—"}</strong>
        <span>{getQuantity(row) > 0 ? `${getQuantity(row)} ${COPY[language]?.kg || COPY.en.kg}` : "—"}</span>
      </div>
      <div className="at-request-main wide">
        <strong>{getPickup(row)}</strong>
        <span>→ {getCenter(row)}</span>
      </div>
      <div className="at-request-main">
        <strong>{getTransporterName(row) || COPY[language]?.noTransporter || COPY.en.noTransporter}</strong>
        <span>{getVehicle(row)}</span>
      </div>
      <div className="at-request-side">
        <span className={`at-badge status-${status.toLowerCase()}`}>{statusText(language, status)}</span>
        <small>{dateLabel(firstValue(row?.created_at, row?.createdAt, row?.requested_at, row?.requestedAt), language)}</small>
        {map && <a href={map} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><Navigation size={12} /></a>}
      </div>
    </button>
  );
}

const STYLE = `
.at-page{padding:24px 26px 42px;max-width:1500px;margin:0 auto;color:#1f3428}
.at-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:22px}
.at-eyebrow{font-size:10px;letter-spacing:.18em;font-weight:950;color:#5e7b69;margin-bottom:8px}
.at-header h1{font-size:34px;line-height:1.05;margin:0;color:#1d3527}
.at-header p{max-width:720px;font-size:13px;line-height:1.6;color:#72847a;margin:10px 0 0}
.at-head-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.at-plain-link{color:#3f6550;text-decoration:none;font-size:11px;font-weight:900}
.at-refresh{border:1px solid #d8e5dc;background:#fff;border-radius:11px;padding:10px 13px;display:inline-flex;align-items:center;gap:7px;color:#2c6747;font:inherit;font-size:11px;font-weight:900;cursor:pointer}
.at-refresh:disabled{opacity:.65;cursor:wait}
.spin{animation:atspin 1s linear infinite}@keyframes atspin{to{transform:rotate(360deg)}}
.at-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
.at-stat{background:#fff;border:1px solid #dfe9e3;border-radius:16px;padding:15px;display:flex;align-items:center;gap:11px;box-shadow:0 8px 25px rgba(19,47,31,.035)}
.at-stat-icon{width:38px;height:38px;border-radius:11px;background:#edf6f0;display:grid;place-items:center;color:#2e724d}
.at-stat strong,.at-stat span{display:block}.at-stat strong{font-size:23px}.at-stat span{font-size:10px;color:#75867d;margin-top:3px;font-weight:800}
.at-systembar{border:1px solid #dae7de;background:#f8fcf9;border-radius:12px;padding:9px 12px;display:flex;align-items:center;gap:8px;font-size:10px;margin-bottom:14px}
.at-systembar span{color:#73857b}.at-systembar small{margin-left:auto;color:#94a39b}.at-system-dot{width:8px;height:8px;border-radius:50%;background:#47a067;box-shadow:0 0 0 4px rgba(71,160,103,.1)}
.at-alert{display:flex;align-items:center;gap:10px;border-radius:13px;padding:12px 14px;margin-bottom:14px}.at-alert.error{background:#fff5f2;border:1px solid #ecd9d3;color:#885244}.at-alert div{display:grid;gap:2px;flex:1}.at-alert strong{font-size:11px}.at-alert span{font-size:10px;line-height:1.4}.at-alert button{border:0;background:#fff;border:1px solid #e5d2cc;border-radius:9px;padding:8px 10px;font-size:10px;font-weight:900;cursor:pointer;color:#7d4b3f}
.at-main-card{background:#fff;border:1px solid #dfe9e3;border-radius:18px;margin-bottom:14px;overflow:hidden;box-shadow:0 9px 28px rgba(15,46,27,.035)}
.at-toolbar{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:17px 19px;border-bottom:1px solid #e8eee9}.at-toolbar.compact{padding-bottom:13px}
.at-card-label{font-size:9px;letter-spacing:.14em;font-weight:950;color:#829087;text-transform:uppercase}.at-toolbar h2{margin:4px 0 0;font-size:24px}
.at-search-wrap{width:min(440px,100%);display:flex;align-items:center;gap:8px;border:1px solid #dbe6df;border-radius:11px;padding:0 10px;background:#fbfdfb}.at-search-wrap svg{color:#83958b}.at-search-wrap input{width:100%;border:0;outline:0;padding:10px 0;background:transparent;font:inherit;font-size:11px;color:#2b4235}
.at-filters{display:flex;gap:6px;flex-wrap:wrap;padding:10px 18px;border-bottom:1px solid #edf1ee}.at-filters button{border:1px solid #dde7e0;background:#fff;border-radius:99px;padding:7px 11px;font-size:10px;font-weight:900;color:#708179;cursor:pointer}.at-filters button.selected{background:#edf6f0;color:#2d704b;border-color:#bfd5c5}
.at-request-list{display:grid}.at-request{display:grid;grid-template-columns:55px minmax(110px,1fr) minmax(90px,.8fr) minmax(170px,1.5fr) minmax(150px,1fr) 125px;gap:11px;align-items:center;text-align:left;border:0;border-bottom:1px solid #eef2ef;background:#fff;padding:13px 17px;cursor:pointer;font:inherit}.at-request:hover{background:#fbfdfb}.at-request:last-child{border-bottom:0}.at-request-id{font-size:10px;font-weight:950;color:#8a9a92}.at-request-main{min-width:0}.at-request-main strong,.at-request-main span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.at-request-main strong{font-size:11px;color:#2a4235}.at-request-main span{font-size:9px;color:#819089;margin-top:3px}.at-request-side{display:flex;flex-direction:column;align-items:flex-end;gap:5px}.at-request-side small{font-size:8px;color:#909d97}.at-request-side a{color:#2f714d;display:inline-flex}
.at-badge{display:inline-flex;align-items:center;border-radius:99px;padding:5px 8px;font-size:8px;font-weight:950;white-space:nowrap;border:1px solid #dce7e0;background:#e2f4e5;color:#668074}.status-requested{color:#8b6b2d;background:#fff9e9;border-color:#eee1b6}.status-assigned{color:#456f9b;background:#f0f7ff;border-color:#d6e4f2}.status-en_route_to_farmer,.status-crop_picked_up,.status-en_route_to_center{color:#2e704d;background:#edf8f1;border-color:#d1e7d8}.status-delivered,.status-completed{color:#2b7550;background:#eaf7ee;border-color:#cae4d2}.status-cancelled{color:#9a5548;background:#fff3f0;border-color:#ecd3cc}
.at-live-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #d7e6dc;background:#f8fcf9;border-radius:99px;padding:7px 10px;font-size:9px;color:#427257;font-weight:950}.at-mini-empty{padding:25px;text-align:center;color:#7b8c84;font-size:10px}
.at-active-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:13px 16px 17px}.at-trip{border:1px solid #e0e9e3;border-radius:14px;padding:13px;background:#fcfefc}.at-trip-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.at-trip-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#edf6f0;color:#2e704c}.at-trip>strong,.at-trip>span{display:block}.at-trip>strong{font-size:12px;margin-top:10px}.at-trip>span{font-size:10px;color:#7b8b83;margin-top:3px}.at-trip-meta{display:flex;justify-content:space-between;gap:8px;margin-top:9px;font-size:9px;color:#65796e}.at-trip-route{display:grid;grid-template-columns:14px minmax(0,1fr) 14px minmax(0,1fr);gap:5px;align-items:center;margin-top:11px;font-size:9px;color:#6f8178}.at-trip-route span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.at-trip-route svg:first-child{color:#2c724c}.at-trip-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:11px}.at-trip-actions a{display:inline-flex;gap:5px;align-items:center;color:#2e714d;font-size:9px;font-weight:950;text-decoration:none}
.at-empty{min-height:220px;display:grid;place-items:center;align-content:center;gap:8px;text-align:center;color:#6f8277;padding:20px}.at-empty strong{font-size:12px;color:#435b4d}.at-empty span{font-size:10px}.at-empty svg{color:#3b7a56}
.at-modal-backdrop{position:fixed;inset:0;background:rgba(13,31,21,.42);backdrop-filter:blur(5px);display:grid;place-items:center;padding:18px;z-index:1000}.at-modal{position:relative;width:min(680px,100%);max-height:88vh;overflow:auto;background:#fff;border:1px solid #dbe6df;border-radius:20px;padding:22px;box-shadow:0 28px 90px rgba(9,25,16,.22)}.at-modal-close{position:absolute;right:13px;top:12px;border:0;background:#f2f6f3;width:32px;height:32px;border-radius:9px;font-size:20px;color:#60766a;cursor:pointer}.at-modal h2{margin:4px 0 16px;font-size:22px}.at-detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.at-detail-grid>div{border:1px solid #e4ebe6;border-radius:11px;padding:10px;background:#fbfdfb}.at-detail-grid small,.at-detail-grid strong{display:block}.at-detail-grid small{font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#899790;font-weight:950}.at-detail-grid strong{font-size:10px;margin-top:4px;color:#385344;line-height:1.45}.at-modal-footer{display:flex;gap:8px;margin-top:16px}.at-modal-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 12px;border-radius:10px;background:#edf6f0;color:#2e714c;text-decoration:none;font-size:10px;font-weight:950}.at-modal-btn.muted{background:#f6f8f6;color:#60786b}
@media(max-width:1100px){.at-stats{grid-template-columns:repeat(2,1fr)}.at-request{grid-template-columns:55px 1.2fr 1fr 1.3fr 1fr 110px}.at-active-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:860px){.at-header{align-items:flex-start;flex-direction:column}.at-search-wrap{width:100%}.at-toolbar{flex-direction:column;align-items:stretch}.at-request{grid-template-columns:50px 1fr 1fr}.at-request-main.wide{grid-column:2 / -1}.at-request-side{grid-column:1 / -1;flex-direction:row;justify-content:flex-start;align-items:center}.at-active-grid{grid-template-columns:1fr}}
@media(max-width:600px){.at-page{padding:18px 13px 35px}.at-stats{grid-template-columns:1fr 1fr}.at-header h1{font-size:28px}.at-detail-grid{grid-template-columns:1fr}.at-modal-footer{flex-direction:column}.at-systembar{align-items:flex-start;flex-wrap:wrap}.at-systembar small{margin-left:0;width:100%}}
@media(max-width:430px){.at-stats{grid-template-columns:1fr}.at-filters{overflow:auto;flex-wrap:nowrap}.at-request{grid-template-columns:1fr 1fr}.at-request-id{grid-column:1 / -1}.at-request-main.wide{grid-column:1 / -1}.at-request-side{grid-column:1 / -1}}
`;