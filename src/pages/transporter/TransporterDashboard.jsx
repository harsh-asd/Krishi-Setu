import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import tractorHarvest from "../../assets/backgrounds/tractor-harvest.jpg";
import {
  Activity,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  LocateFixed,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
  Wifi,
  WifiOff,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";

/*
 * VITE_API_URL may already include "/api" (for example:
 * http://localhost:5000/api). This dashboard uses endpoint
 * paths that already start with "/api", so normalize the base
 * once to prevent requests like "/api/api/transport/...".
 */
const RAW_API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const API_BASE =
  String(RAW_API_BASE)
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

const SESSION_KEY =
  "krishisetu_transporter_session";

const TEMP_SESSION_KEY =
  "krishisetu_transporter_temp_session";

const TRANSPORTER_ID_KEY =
  "krishisetu_transporter_id";

const REFRESH_INTERVAL_MS = 15000;
const LOCATION_INTERVAL_MS = 12000;

const ACTIVE_STATUSES = new Set([
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
]);

const STATUS_META = {
  REQUESTED: {
    label: {
      en: "Waiting",
      hi: "प्रतीक्षा में",
      te: "వేచిచూస్తోంది",
    },
    icon: Clock3,
  },
  ASSIGNED: {
    label: {
      en: "Assigned",
      hi: "असाइन किया गया",
      te: "కేటాయించబడింది",
    },
    icon: CheckCircle2,
  },
  EN_ROUTE_TO_FARMER: {
    label: {
      en: "Going to farmer",
      hi: "किसान के पास जा रहे हैं",
      te: "రైతు దగ్గరకు వెళ్తున్నారు",
    },
    icon: Navigation,
  },
  CROP_PICKED_UP: {
    label: {
      en: "Crop picked up",
      hi: "फसल उठाई गई",
      te: "పంట తీసుకున్నారు",
    },
    icon: Truck,
  },
  EN_ROUTE_TO_CENTER: {
    label: {
      en: "Going to center",
      hi: "केंद्र की ओर जा रहे हैं",
      te: "కేంద్రానికి వెళ్తున్నారు",
    },
    icon: Navigation,
  },
  DELIVERED: {
    label: {
      en: "Delivered",
      hi: "पहुंचाया गया",
      te: "చేరవేశారు",
    },
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: {
      en: "Completed",
      hi: "पूरा हुआ",
      te: "పూర్తయింది",
    },
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: {
      en: "Cancelled",
      hi: "रद्द",
      te: "రద్దయింది",
    },
    icon: XCircle,
  },
};

const COPY = {
  en: {
    portal: "TRANSPORT PARTNER",
    dashboard: "Transporter Dashboard",
    greeting: "Good day",
    subtitle:
      "Manage farmer transport requests from your registered service area.",
    online: "Online",
    offline: "Offline",
    goOnline: "Go online",
    goOffline: "Go offline",
    refreshing: "Refreshing…",
    refresh: "Refresh",
    currentLocation: "Use current location",
    locationUpdating: "Updating location…",
    locationDisabled:
      "Location access is disabled. Enable browser location permission to send live position.",
    serviceArea: "Your service area",
    primaryVillage: "Primary village",
    district: "District",
    state: "State",
    radius: "Service radius",
    nearbyJobs: "Available jobs",
    activeTrip: "Active trip",
    recentTrips: "Recent activity",
    noJobs:
      "No eligible farmer requests are waiting right now.",
    noJobsHint:
      "Stay online. New requests from your registered region will appear here.",
    requestFrom: "Farmer",
    crop: "Crop",
    quantity: "Quantity",
    pickup: "Pickup",
    destination: "Destination",
    requestedFor: "Requested",
    estimatedFare: "Estimated fare",
    accept: "Accept job",
    decline: "Decline",
    accepting: "Accepting…",
    declining: "Declining…",
    accepted: "Accepted",
    declineReason: "Why are you declining?",
    declinePlaceholder:
      "Optional reason for your records",
    confirmDecline: "Decline request",
    cancel: "Cancel",
    viewTrip: "Open active trip",
    noActive:
      "You do not have an active transport trip.",
    activeNow: "Active now",
    capacity: "Capacity",
    available: "Available",
    busy:
      "Complete your active trip before accepting another job.",
    cannotAccept:
      "This job is no longer available.",
    regionProtected:
      "Only farmers from your registered service area are shown in the normal job queue.",
    locationLastSeen: "Last location update",
    never: "Not available",
    accurateTo: "GPS accuracy",
    dashboard: "Dashboard",
    jobs: "Jobs",
    trip: "Trip",
    earnings: "Earnings",
    profile: "Profile",
    logout: "Sign out",
    language: "Language",
    hello: "Welcome back",
    connection: "Backend connection",
    connected: "Connected",
    disconnected: "Unavailable",
    retry: "Try again",
    phone: "Call farmer",
    openMaps: "Open route",
    kilometers: "km",
    kg: "kg",
    today: "Today",
    totalTrips: "Total trips",
    totalEarnings: "Total earnings",
    rating: "Rating",
    notRated: "Not rated yet",
    locationSent:
      "Your current GPS location was updated.",
    onlineMessage:
      "You are now online and eligible for new farmer jobs.",
    offlineMessage:
      "You are offline. New requests will not be offered to you.",
    errorProfile:
      "Unable to load your transporter profile.",
    errorRequests:
      "Unable to load transport jobs.",
    networkError:
      "KrishiSetu backend is not reachable.",
    loginRequired:
      "Your transporter session was not found. Please sign in again.",
    close: "Close",
    loadMore: "Load more",
    updated: "Updated",
  },

  hi: {
    portal: "परिवहन साझेदार",
    dashboard: "परिवहनकर्ता डैशबोर्ड",
    greeting: "नमस्कार",
    subtitle:
      "अपने पंजीकृत सेवा क्षेत्र से आने वाले किसान परिवहन अनुरोध प्रबंधित करें।",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    goOnline: "ऑनलाइन जाएँ",
    goOffline: "ऑफलाइन जाएँ",
    refreshing: "ताज़ा हो रहा है…",
    refresh: "रिफ्रेश",
    currentLocation: "वर्तमान स्थान लें",
    locationUpdating: "स्थान अपडेट हो रहा है…",
    locationDisabled:
      "लोकेशन बंद है। लाइव स्थान भेजने के लिए ब्राउज़र अनुमति दें।",
    serviceArea: "आपका सेवा क्षेत्र",
    primaryVillage: "मुख्य गाँव",
    district: "जिला",
    state: "राज्य",
    radius: "सेवा सीमा",
    nearbyJobs: "उपलब्ध कार्य",
    activeTrip: "सक्रिय यात्रा",
    recentTrips: "हाल की गतिविधि",
    noJobs:
      "अभी कोई योग्य किसान परिवहन अनुरोध प्रतीक्षा में नहीं है।",
    noJobsHint:
      "ऑनलाइन रहें। आपके पंजीकृत क्षेत्र के नए अनुरोध यहाँ दिखाई देंगे।",
    requestFrom: "किसान",
    crop: "फसल",
    quantity: "मात्रा",
    pickup: "पिकअप",
    destination: "गंतव्य",
    requestedFor: "अनुरोध समय",
    estimatedFare: "अनुमानित किराया",
    accept: "कार्य स्वीकार करें",
    decline: "मना करें",
    accepting: "स्वीकार हो रहा है…",
    declining: "मना किया जा रहा है…",
    accepted: "स्वीकार किया गया",
    declineReason: "मना करने का कारण",
    declinePlaceholder:
      "वैकल्पिक कारण",
    confirmDecline: "अनुरोध मना करें",
    cancel: "रद्द करें",
    viewTrip: "सक्रिय यात्रा खोलें",
    noActive:
      "आपकी कोई सक्रिय परिवहन यात्रा नहीं है।",
    activeNow: "अभी सक्रिय",
    capacity: "क्षमता",
    available: "उपलब्ध",
    busy:
      "दूसरा कार्य स्वीकार करने से पहले सक्रिय यात्रा पूरी करें।",
    cannotAccept:
      "यह कार्य अब उपलब्ध नहीं है।",
    regionProtected:
      "सामान्य कार्य सूची में केवल आपके पंजीकृत सेवा क्षेत्र के किसान दिखते हैं।",
    locationLastSeen: "अंतिम लोकेशन अपडेट",
    never: "उपलब्ध नहीं",
    accurateTo: "GPS सटीकता",
    dashboard: "डैशबोर्ड",
    jobs: "कार्य",
    trip: "यात्रा",
    earnings: "कमाई",
    profile: "प्रोफ़ाइल",
    logout: "साइन आउट",
    language: "भाषा",
    hello: "वापसी पर स्वागत है",
    connection: "बैकएंड कनेक्शन",
    connected: "कनेक्टेड",
    disconnected: "उपलब्ध नहीं",
    retry: "फिर प्रयास",
    phone: "किसान को कॉल करें",
    openMaps: "रूट खोलें",
    kilometers: "किमी",
    kg: "किग्रा",
    today: "आज",
    totalTrips: "कुल यात्राएँ",
    totalEarnings: "कुल कमाई",
    rating: "रेटिंग",
    notRated: "अभी रेटिंग नहीं",
    locationSent:
      "आपका वर्तमान GPS स्थान अपडेट हो गया है।",
    onlineMessage:
      "आप अब ऑनलाइन हैं और नए किसान कार्यों के लिए उपलब्ध हैं।",
    offlineMessage:
      "आप ऑफलाइन हैं। नए अनुरोध आपको नहीं दिए जाएँगे।",
    errorProfile:
      "आपकी परिवहनकर्ता प्रोफ़ाइल लोड नहीं हो सकी।",
    errorRequests:
      "परिवहन कार्य लोड नहीं हो सके।",
    networkError:
      "कृषिसेतु बैकएंड से कनेक्शन नहीं हो पाया।",
    loginRequired:
      "परिवहनकर्ता सत्र नहीं मिला। कृपया फिर से साइन इन करें।",
    close: "बंद करें",
    loadMore: "और देखें",
    updated: "अपडेट",
  },

  te: {
    portal: "రవాణా భాగస్వామి",
    dashboard: "రవాణాదారు డ్యాష్‌బోర్డ్",
    greeting: "నమస్కారం",
    subtitle:
      "మీ నమోదైన సేవా ప్రాంతం నుండి వచ్చే రైతు రవాణా అభ్యర్థనలను నిర్వహించండి.",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    goOnline: "ఆన్‌లైన్‌కు వెళ్లండి",
    goOffline: "ఆఫ్‌లైన్‌కు వెళ్లండి",
    refreshing: "రిఫ్రెష్ అవుతోంది…",
    refresh: "రిఫ్రెష్",
    currentLocation: "ప్రస్తుత లొకేషన్ తీసుకోండి",
    locationUpdating: "లొకేషన్ అప్డేట్ అవుతోంది…",
    locationDisabled:
      "లొకేషన్ అనుమతి లేదు. లైవ్ లొకేషన్ కోసం బ్రౌజర్ అనుమతి ఇవ్వండి.",
    serviceArea: "మీ సేవా ప్రాంతం",
    primaryVillage: "ప్రధాన గ్రామం",
    district: "జిల్లా",
    state: "రాష్ట్రం",
    radius: "సేవా పరిధి",
    nearbyJobs: "అందుబాటులో ఉన్న పనులు",
    activeTrip: "యాక్టివ్ ట్రిప్",
    recentTrips: "ఇటీవలి కార్యకలాపాలు",
    noJobs:
      "ప్రస్తుతం అర్హమైన రైతు రవాణా అభ్యర్థనలు లేవు.",
    noJobsHint:
      "ఆన్‌లైన్‌లో ఉండండి. మీ నమోదైన ప్రాంతం నుండి కొత్త అభ్యర్థనలు ఇక్కడ కనిపిస్తాయి.",
    requestFrom: "రైతు",
    crop: "పంట",
    quantity: "పరిమాణం",
    pickup: "పికప్",
    destination: "గమ్యం",
    requestedFor: "అభ్యర్థించిన సమయం",
    estimatedFare: "అంచనా ఛార్జీ",
    accept: "పని అంగీకరించండి",
    decline: "తిరస్కరించండి",
    accepting: "అంగీకరిస్తోంది…",
    declining: "తిరస్కరిస్తోంది…",
    accepted: "అంగీకరించబడింది",
    declineReason: "తిరస్కరణ కారణం",
    declinePlaceholder:
      "ఐచ్ఛిక కారణం",
    confirmDecline: "అభ్యర్థన తిరస్కరించండి",
    cancel: "రద్దు",
    viewTrip: "యాక్టివ్ ట్రిప్ తెరవండి",
    noActive:
      "మీకు యాక్టివ్ రవాణా ట్రిప్ లేదు.",
    activeNow: "ప్రస్తుతం యాక్టివ్",
    capacity: "సామర్థ్యం",
    available: "అందుబాటులో ఉంది",
    busy:
      "మరో పని అంగీకరించే ముందు మీ యాక్టివ్ ట్రిప్ పూర్తి చేయండి.",
    cannotAccept:
      "ఈ పని ఇక అందుబాటులో లేదు.",
    regionProtected:
      "సాధారణ పని క్యూలో మీ నమోదైన సేవా ప్రాంతంలోని రైతులే కనిపిస్తారు.",
    locationLastSeen: "చివరి లొకేషన్ అప్డేట్",
    never: "అందుబాటులో లేదు",
    accurateTo: "GPS ఖచ్చితత్వం",
    dashboard: "డ్యాష్‌బోర్డ్",
    jobs: "పనులు",
    trip: "ట్రిప్",
    earnings: "ఆదాయం",
    profile: "ప్రొఫైల్",
    logout: "సైన్ అవుట్",
    language: "భాష",
    hello: "మళ్లీ స్వాగతం",
    connection: "బ్యాకెండ్ కనెక్షన్",
    connected: "కనెక్ట్ అయింది",
    disconnected: "అందుబాటులో లేదు",
    retry: "మళ్లీ ప్రయత్నించండి",
    phone: "రైతుకు కాల్ చేయండి",
    openMaps: "రూట్ తెరవండి",
    kilometers: "కిమీ",
    kg: "కిలోలు",
    today: "ఈ రోజు",
    totalTrips: "మొత్తం ట్రిప్స్",
    totalEarnings: "మొత్తం ఆదాయం",
    rating: "రేటింగ్",
    notRated: "ఇంకా రేటింగ్ లేదు",
    locationSent:
      "మీ ప్రస్తుత GPS లొకేషన్ అప్డేట్ అయింది.",
    onlineMessage:
      "మీరు ఇప్పుడు ఆన్‌లైన్‌లో ఉన్నారు మరియు కొత్త రైతు పనులకు అందుబాటులో ఉన్నారు.",
    offlineMessage:
      "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. కొత్త అభ్యర్థనలు మీకు ఇవ్వబడవు.",
    errorProfile:
      "మీ రవాణాదారు ప్రొఫైల్ లోడ్ కాలేదు.",
    errorRequests:
      "రవాణా పనులు లోడ్ కాలేదు.",
    networkError:
      "కృషిసేతు బ్యాకెండ్‌కు కనెక్ట్ కాలేకపోయాం.",
    loginRequired:
      "రవాణాదారు సెషన్ కనుగొనబడలేదు. మళ్లీ సైన్ ఇన్ చేయండి.",
    close: "మూసివేయి",
    loadMore: "మరిన్ని చూడండి",
    updated: "అప్డేట్",
  },
};

function getSession() {
  const candidates = [
    [SESSION_KEY, window.localStorage],
    [TEMP_SESSION_KEY, window.sessionStorage],
  ];

  for (const [key, storage] of candidates) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (parsed?.transporter?.id) {
        return parsed;
      }
    } catch {
      // Continue to next storage source.
    }
  }

  const fallbackId =
    window.localStorage.getItem(
      TRANSPORTER_ID_KEY
    );

  return fallbackId
    ? {
        transporter: {
          id: fallbackId,
        },
      }
    : null;
}

function saveSession(transporter) {
  const session = {
    authenticated: true,
    role: "transporter",
    transporter,
    savedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );
  } catch {
    // Ignore storage failures.
  }

  try {
    window.localStorage.setItem(
      TRANSPORTER_ID_KEY,
      String(transporter.id)
    );
  } catch {
    // Ignore storage failures.
  }

  return session;
}

async function requestJson(
  path,
  options = {}
) {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      headers: {
        Accept:
          "application/json",
        "Content-Type":
          "application/json",
        ...(options.headers || {}),
      },
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      data?.error ||
      `Request failed (${response.status})`;

    const error =
      new Error(message);

    error.status = response.status;
    throw error;
  }

  return data || {};
}

function normaliseStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function dashboardDistanceKm(lat1, lng1, lat2, lng2) {
  const values = [lat1, lng1, lat2, lng2].map(Number);
  if (!values.every(Number.isFinite)) return null;

  const [aLat, aLng, bLat, bLng] = values;
  const radians = value => (value * Math.PI) / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(aLat)) *
      Math.cos(radians(bLat)) *
      Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function dashboardRequestTime(request) {
  const date = String(request?.requested_date || "").trim();
  const start = String(request?.requested_slot_start || "").trim();

  if (date) {
    const raw = start ? `${date}T${start}` : `${date}T00:00`;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  const created = new Date(
    request?.created_at || request?.updated_at || 0
  );
  return Number.isNaN(created.getTime())
    ? Number.MAX_SAFE_INTEGER
    : created.getTime();
}

function getStatusLabel(
  status,
  language
) {
  const normalized =
    normaliseStatus(status);

  return (
    STATUS_META[normalized]
      ?.label?.[language] ||
    STATUS_META[normalized]
      ?.label?.en ||
    normalized ||
    "Unknown"
  );
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "₹0";
  }

  return `₹${number.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN")
    : "0";
}

function formatDateTime(
  value,
  language
) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  const locale =
    language === "hi"
      ? "hi-IN"
      : language === "te"
      ? "te-IN"
      : "en-IN";

  return date.toLocaleString(
    locale,
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatRelative(
  value,
  language
) {
  if (!value) return "";

  const timestamp =
    new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const delta =
    Math.max(
      0,
      Date.now() - timestamp
    );

  const seconds =
    Math.floor(delta / 1000);

  if (seconds < 60) {
    if (language === "hi") {
      return `${seconds} सेकंड पहले`;
    }

    if (language === "te") {
      return `${seconds} సెకన్ల క్రితం`;
    }

    return `${seconds}s ago`;
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    if (language === "hi") {
      return `${minutes} मिनट पहले`;
    }

    if (language === "te") {
      return `${minutes} నిమిషాల క్రితం`;
    }

    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (language === "hi") {
    return `${hours} घंटे पहले`;
  }

  if (language === "te") {
    return `${hours} గంటల క్రితం`;
  }

  return `${hours}h ago`;
}

function isSameCalendarDay(value) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return (
    !Number.isNaN(d.getTime()) &&
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatLocationStatus(location, language) {
  if (!location?.capturedAt) {
    return language === "hi"
      ? "लोकेशन अभी साझा नहीं की गई"
      : language === "te"
      ? "లొకేషన్ ఇంకా షేర్ కాలేదు"
      : "Location not shared yet";
  }

  return `${formatRelative(location.capturedAt, language)}${
    location.accuracy
      ? ` · ±${Math.round(location.accuracy)} m`
      : ""
  }`;
}

function mapsUrl(
  lat,
  lng,
  address
) {
  if (
    lat !== null &&
    lng !== null &&
    lat !== undefined &&
    lng !== undefined
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
  }

  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  }

  return "";
}

function getInitials(name) {
  const parts = String(
    name || "T"
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2);

  return parts
    .map(
      (part) =>
        part.charAt(0).toUpperCase()
    )
    .join("") || "T";
}

function isActiveTrip(request) {
  return ACTIVE_STATUSES.has(
    normaliseStatus(
      request?.status
    )
  );
}

function getNextAction(
  status
) {
  switch (
    normaliseStatus(status)
  ) {
    case "ASSIGNED":
      return "EN_ROUTE_TO_FARMER";

    case "EN_ROUTE_TO_FARMER":
      return "CROP_PICKED_UP";

    case "CROP_PICKED_UP":
      return "EN_ROUTE_TO_CENTER";

    case "EN_ROUTE_TO_CENTER":
      return "DELIVERED";

    case "DELIVERED":
      return "COMPLETED";

    default:
      return null;
  }
}

function getActionLabel(
  status,
  language
) {
  const labels = {
    en: {
      EN_ROUTE_TO_FARMER: "Start pickup",
      CROP_PICKED_UP: "Crop picked up",
      EN_ROUTE_TO_CENTER: "Start to center",
      DELIVERED: "Mark delivered",
      COMPLETED: "Complete trip",
    },
    hi: {
      EN_ROUTE_TO_FARMER: "पिकअप के लिए जाएँ",
      CROP_PICKED_UP: "फसल उठाई",
      EN_ROUTE_TO_CENTER: "केंद्र के लिए निकलें",
      DELIVERED: "पहुंचा हुआ चिन्हित करें",
      COMPLETED: "यात्रा पूरी करें",
    },
    te: {
      EN_ROUTE_TO_FARMER: "పికప్ ప్రారంభించండి",
      CROP_PICKED_UP: "పంట తీసుకున్నారు",
      EN_ROUTE_TO_CENTER: "కేంద్రానికి బయలుదేరండి",
      DELIVERED: "చేరవేసినట్లు గుర్తించండి",
      COMPLETED: "ట్రిప్ పూర్తి చేయండి",
    },
  };

  const next =
    getNextAction(status);

  return (
    labels[language]?.[next] ||
    labels.en[next] ||
    next
  );
}

function AppIconButton({
  title,
  onClick,
  children,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.iconButton,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        <Icon size={19} />
      </div>

      <div style={styles.statBody}>
        <span style={styles.statLabel}>
          {label}
        </span>

        <strong style={styles.statValue}>
          {value}
        </strong>

        {subtext ? (
          <small style={styles.statSubtext}>
            {subtext}
          </small>
        ) : null}
      </div>
    </div>
  );
}

function LanguageSwitcher({
  language,
  setLanguage,
  copy,
}) {
  return (
    <div style={styles.languageSwitcher}>
      <Globe2 size={15} />

      <span style={styles.languageTitle}>
        {copy.language}
      </span>

      {[
        ["en", "English"],
        ["hi", "हिन्दी"],
        ["te", "తెలుగు"],
      ].map(
        ([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              setLanguage(id)
            }
            style={{
              ...styles.languageButton,
              ...(language === id
                ? styles.languageButtonActive
                : {}),
            }}
          >
            {label}
          </button>
        )
      )}
    </div>
  );
}

function StatusPill({
  status,
  language,
}) {
  const normalized =
    normaliseStatus(status);

  const Icon =
    STATUS_META[normalized]
      ?.icon || Activity;

  return (
    <span
      style={{
        ...styles.statusPill,
        ...(normalized ===
          "ASSIGNED"
          ? styles.statusAssigned
          : {}),
        ...(normalized.includes(
          "EN_ROUTE"
        )
          ? styles.statusRoute
          : {}),
        ...(normalized ===
          "CROP_PICKED_UP"
          ? styles.statusPicked
          : {}),
        ...(normalized ===
          "DELIVERED"
          ? styles.statusDelivered
          : {}),
        ...(normalized ===
          "COMPLETED"
          ? styles.statusCompleted
          : {}),
        ...(normalized ===
          "CANCELLED"
          ? styles.statusCancelled
          : {}),
      }}
    >
      <Icon size={13} />

      <span>
        {getStatusLabel(
          normalized,
          language
        )}
      </span>
    </span>
  );
}

function RegionCard({
  transporter,
  copy,
}) {
  return (
    <div style={styles.regionCard}>
      <div style={styles.regionIcon}>
        <MapPin size={21} />
      </div>

      <div style={styles.regionBody}>
        <span style={styles.sectionEyebrow}>
          {copy.serviceArea}
        </span>

        <strong style={styles.regionPrimary}>
          {transporter?.village ||
            copy.primaryVillage}
        </strong>

        <span style={styles.regionLine}>
          {[
            transporter?.mandal,
            transporter?.district,
            transporter?.state,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>

        <div style={styles.regionMetaRow}>
          <span>
            {copy.radius}:{" "}
            {formatNumber(
              transporter?.service_radius_km ??
                transporter?.serviceRadiusKm ??
                10
            )}{" "}
            {copy.kilometers}
          </span>

          {transporter?.pincode ? (
            <span>
              PIN{" "}
              {transporter.pincode}
            </span>
          ) : null}
        </div>

        <p style={styles.regionNote}>
          {copy.regionProtected}
        </p>
      </div>
    </div>
  );
}

function JobCard({
  request,
  language,
  copy,
  canAccept,
  busyRequestId,
  onAccept,
  onDecline,
}) {
  const [showDecline, setShowDecline] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const isBusy =
    busyRequestId === request.id;

  const pickupAddress =
    request.pickup_address ||
    request.farmer_village ||
    "Farmer pickup";

  const centerName =
    request.center_name ||
    request.center_address ||
    "Procurement center";

  const requested =
    request.requested_date ||
    request.requested_slot_start
      ? [
          request.requested_date,
          request.requested_slot_start,
          request.requested_slot_end,
        ]
          .filter(Boolean)
          .join(" · ")
      : formatDateTime(
          request.created_at,
          language
        );

  const maps =
    mapsUrl(
      request.pickup_lat,
      request.pickup_lng,
      pickupAddress
    );

  return (
    <article style={styles.jobCard}>
      <div style={styles.jobTop}>
        <div>
          <span style={styles.jobEyebrow}>
            {copy.requestFrom}
          </span>

          <h3 style={styles.jobFarmerName}>
            {request.farmer_name ||
              request.request_farmer_name ||
              "Farmer"}
          </h3>

          <span style={styles.jobBookingRef}>
            {request.booking_id || request.token
              ? `Booking ${request.booking_id || request.token}`
              : `Request ${request.id}`}
          </span>
        </div>

        <StatusPill
          status={request.status}
          language={language}
        />
      </div>

      <div style={styles.jobMain} className="sih-transporter-job-main">
        <div style={styles.cropBlock}>
          <div style={styles.cropIcon}>
            <Truck size={19} />
          </div>

          <div>
            <span style={styles.jobMetaLabel}>
              {copy.crop}
            </span>

            <strong style={styles.jobMetaValue}>
              {request.crop ||
                "Crop load"}
            </strong>
          </div>
        </div>

        <div>
          <span style={styles.jobMetaLabel}>
            {copy.quantity}
          </span>
          <strong style={styles.jobMetaValue}>
            {formatNumber(request.quantity_kg || request.quantityKg)} {copy.kg}
          </strong>
        </div>

        {/* SIH: Standardized Bag Tracking */}
        <div>
          <span style={styles.jobMetaLabel} title="Standardized Jute Bag Tracking">
            Load Details (Traceable)
          </span>
          <strong style={{...styles.jobMetaValue, color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block', marginTop: '2px'}}>
            {Math.ceil(Number(request.quantity_kg || request.quantityKg || 0) / 50)} Jute Bags
          </strong>
          <div style={{fontSize: '9px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace'}}>
            BATCH #{request.id.slice(0,6).toUpperCase()}-FCI
          </div>
        </div>

        <div>
          <span style={styles.jobMetaLabel}>
            {copy.estimatedFare}
          </span>

          <strong
            style={{
              ...styles.jobMetaValue,
              color: "#1f6b40",
            }}
          >
            {formatMoney(
              request.estimated_fare
            )}
          </strong>
        </div>

        <div>
          <span style={styles.jobMetaLabel}>
            Distance
          </span>

          <strong style={styles.jobMetaValue}>
            {request._dashboardDistance == null
              ? "—"
              : `${Number(request._dashboardDistance).toFixed(1)} ${copy.kilometers}`}
          </strong>
        </div>
      </div>

      <div style={styles.routeBox}>
        <div style={styles.routeItem}>
          <div
            style={styles.routeDotPickup}
          />

          <div>
            <span
              style={styles.routeLabel}
            >
              {copy.pickup}
            </span>

            <strong
              style={styles.routeText}
            >
              {pickupAddress}
            </strong>

            {request.request_farmer_village ||
            request.farmer_village ? (
              <small
                style={styles.routeHint}
              >
                {[
                  request.request_farmer_village ||
                    request.farmer_village,
                  request.request_farmer_mandal ||
                    request.farmer_mandal,
                  request.request_farmer_district ||
                    request.farmer_district,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            ) : null}
          </div>
        </div>

        <div style={styles.routeLine} />

        <div style={styles.routeItem}>
          <div
            style={styles.routeDotCenter}
          />

          <div>
            <span
              style={styles.routeLabel}
            >
              {copy.destination}
            </span>

            <strong style={styles.routeText}>{centerName}</strong>
            {/* SIH FCI ROUTING INSTRUCTION */}
            <div style={{marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <span style={{fontSize: '10px', background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #fde047'}}>
                FCI / Warehouse Routing
              </span>
            </div>
            {/* SIH FCI ROUTING INSTRUCTION */}
            <div style={{marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <span style={{fontSize: '10px', background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #fde047'}}>
                FCI / Warehouse Routing
              </span>
            </div>
            {/* SIH FCI ROUTING INSTRUCTION */}
            <div style={{marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <span style={{fontSize: '10px', background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #fde047'}}>
                FCI / Warehouse Routing
              </span>
            </div>

            {request.center_address ? (
              <small
                style={styles.routeHint}
              >
                {request.center_address}
              </small>
            ) : null}
          </div>
        </div>
      </div>

      <div style={styles.jobFooter}>
        <div style={styles.requestTime}>
          <Clock3 size={15} />
          <span>
            {copy.requestedFor}:{" "}
            {requested}
          </span>
        </div>

        <div style={styles.jobActions}>
          {maps ? (
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              style={styles.secondaryButton}
            >
              <Navigation size={15} />
              {copy.openMaps}
            </a>
          ) : null}

          <button
            type="button"
            onClick={() =>
              setShowDecline(
                (value) => !value
              )
            }
            disabled={
              !canAccept || isBusy
            }
            style={{
              ...styles.declineButton,
              opacity:
                !canAccept || isBusy
                  ? 0.5
                  : 1,
            }}
          >
            <X size={15} />
            {copy.decline}
          </button>

          <button
            type="button"
            onClick={() =>
              onAccept(request.id)
            }
            disabled={
              !canAccept || isBusy
            }
            style={{
              ...styles.acceptButton,
              opacity:
                !canAccept || isBusy
                  ? 0.5
                  : 1,
            }}
          >
            {isBusy ? (
              <span
                style={
                  styles.miniSpinner
                }
              />
            ) : (
              <Check size={16} />
            )}

            {isBusy
              ? copy.accepting
              : copy.accept}
          </button>
        </div>
      </div>

      {showDecline ? (
        <div style={styles.declinePanel}>
          <label
            style={styles.inlineLabel}
          >
            {copy.declineReason}
          </label>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value
              )
            }
            placeholder={
              copy.declinePlaceholder
            }
            rows={3}
            style={
              styles.declineTextarea
            }
            disabled={isBusy}
          />

          <div
            style={
              styles.declinePanelActions
            }
          >
            <button
              type="button"
              onClick={() => {
                setReason("");
                setShowDecline(false);
              }}
              style={styles.cancelButton}
              disabled={isBusy}
            >
              {copy.cancel}
            </button>

            <button
              type="button"
              onClick={() => {
                onDecline(
                  request.id,
                  reason
                );
                setShowDecline(false);
                setReason("");
              }}
              style={
                styles.confirmDeclineButton
              }
              disabled={isBusy}
            >
              {isBusy ? (
                <span
                  style={
                    styles.miniSpinner
                  }
                />
              ) : (
                <X size={15} />
              )}
              {isBusy
                ? copy.declining
                : copy.confirmDecline}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ActiveTripCard({
  request,
  copy,
  language,
  onStatusChange,
  statusBusy,
}) {
  if (!request) {
    return (
      <div style={styles.emptyCard}>
        <div style={styles.emptyIcon}>
          <Truck size={24} />
        </div>

        <strong
          style={styles.emptyTitle}
        >
          {copy.noActive}
        </strong>
      </div>
    );
  }

  const status =
    normaliseStatus(
      request.status
    );

  const nextStatus =
    getNextAction(status);

  const maps =
    mapsUrl(
      request.pickup_lat,
      request.pickup_lng,
      request.pickup_address
    );

  const centerMaps =
    mapsUrl(
      request.center_lat,
      request.center_lng,
      request.center_address ||
        request.center_name
    );

  return (
    <div style={styles.activeCard}>
      <div style={styles.activeHeader}>
        <div>
          <span
            style={styles.sectionEyebrow}
          >
            {copy.activeTrip}
          </span>

          <h3
            style={styles.activeTitle}
          >
            {request.farmer_name ||
              "Farmer"}{" "}
            ·{" "}
            {request.crop ||
              "Crop load"}
          </h3>
        </div>

        <StatusPill
          status={status}
          language={language}
        />
      </div>

      <div style={styles.activeRoute}>
        <div style={styles.timelineColumn}>
          <div style={styles.timelineStart}>
            <MapPin size={18} />
          </div>
          <div style={styles.timelineStem} />
          <div style={styles.timelineEnd}>
            <Truck size={17} />
          </div>
        </div>

        <div style={styles.timelineContent}>
          <div>
            <span
              style={styles.timelineLabel}
            >
              {copy.pickup}
            </span>

            <strong
              style={styles.timelineValue}
            >
              {request.pickup_address ||
                request.farmer_village ||
                "Farmer"}
            </strong>
          </div>

          <div style={styles.timelineGap} />

          <div>
            <span
              style={styles.timelineLabel}
            >
              {copy.destination}
            </span>

            <strong
              style={styles.timelineValue}
            >
              {request.center_name ||
                request.center_address ||
                "Procurement center"}
            </strong>
          </div>
        </div>
      </div>

      <div style={styles.activeFacts}>
        <div>
          <span
            style={styles.jobMetaLabel}
          >
            {copy.quantity}
          </span>
          <strong
            style={styles.jobMetaValue}
          >
            {formatNumber(
              request.quantity_kg
            )}{" "}
            {copy.kg}
          </strong>
        </div>

        <div>
          <span
            style={styles.jobMetaLabel}
          >
            {copy.estimatedFare}
          </span>
          <strong
            style={{
              ...styles.jobMetaValue,
              color: "#1f6b40",
            }}
          >
            {formatMoney(
              request.final_fare ??
                request.estimated_fare
            )}
          </strong>
        </div>

        <div>
          <span
            style={styles.jobMetaLabel}
          >
            {copy.requestFrom}
          </span>
          <strong
            style={styles.jobMetaValue}
          >
            {request.farmer_name ||
              "Farmer"}
          </strong>
        </div>
      </div>

      <div style={styles.activeActions}>
        {request.farmer_phone ? (
          <a
            href={`tel:${request.farmer_phone}`}
            style={styles.secondaryButton}
          >
            <Phone size={15} />
            {copy.phone}
          </a>
        ) : null}

        {maps ? (
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            style={styles.secondaryButton}
          >
            <Navigation size={15} />
            {copy.openMaps}
          </a>
        ) : null}

        {centerMaps ? (
          <a
            href={centerMaps}
            target="_blank"
            rel="noreferrer"
            style={styles.secondaryButton}
          >
            <MapPin size={15} />
            {copy.destination}
          </a>
        ) : null}

        {nextStatus ? (
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                request.id,
                nextStatus
              )
            }
            disabled={statusBusy}
            style={styles.primaryButton}
          >
            {statusBusy ? (
              <span
                style={
                  styles.miniSpinner
                }
              />
            ) : (
              <Check size={15} />
            )}

            {statusBusy
              ? copy.refreshing
              : getActionLabel(
                  status,
                  language
                )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function TransporterDashboard() {
  const navigate =
    useNavigate();

  const {
    language,
    setLanguage,
  } = useLanguage();

  const copy =
    useMemo(
      () =>
        COPY[language] ||
        COPY.en,
      [language]
    );

  const session =
    useMemo(
      () => getSession(),
      []
    );

  const transporterId =
    session?.transporter?.id ||
    session?.transporter?.transporter_id ||
    window.localStorage.getItem(
      TRANSPORTER_ID_KEY
    );

  const [transporter, setTransporter] =
    useState(
      session?.transporter || null
    );

  const [requests, setRequests] =
    useState([]);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [loadingRequests, setLoadingRequests] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [requestError, setRequestError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [connectionState, setConnectionState] =
    useState("unknown");

  const [actionRequestId, setActionRequestId] =
    useState("");

  const [statusRequestId, setStatusRequestId] =
    useState("");

  const [jobView, setJobView] =
    useState("priority");

  const [jobSearch, setJobSearch] =
    useState("");

  const [trackingLocation, setTrackingLocation] =
    useState(null);

  const [locationStatus, setLocationStatus] =
    useState("");

  const [locationBusy, setLocationBusy] =
    useState(false);

  const locationWatchRef =
    useRef(null);

  const refreshTimerRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const loadProfile =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!transporterId) {
          setLoadingProfile(false);
          setError(copy.loginRequired);
          return null;
        }

        if (!silent) {
          setLoadingProfile(true);
        }

        try {
          const data =
            await requestJson(
              `/api/transporters/${encodeURIComponent(
                transporterId
              )}`
            );

          if (!mountedRef.current) {
            return null;
          }

          setTransporter(
            data?.transporter || null
          );

          setConnectionState(
            "connected"
          );

          setError("");

          return data;
        } catch (loadError) {
          if (!mountedRef.current) {
            return null;
          }

          setConnectionState(
            "disconnected"
          );

          setError(
            loadError?.message ||
              copy.errorProfile
          );

          return null;
        } finally {
          if (
            mountedRef.current &&
            !silent
          ) {
            setLoadingProfile(false);
          }
        }
      },
      [copy.errorProfile, copy.loginRequired, transporterId]
    );

  const loadRequests =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!transporterId) {
          setLoadingRequests(false);
          return [];
        }

        if (!silent) {
          setLoadingRequests(true);
        }

        try {
          const data =
            await requestJson(
              `/api/transport/requests?transporterId=${encodeURIComponent(
                transporterId
              )}`
            );

          if (!mountedRef.current) {
            return [];
          }

          setRequests(
            Array.isArray(
              data?.requests
            )
              ? data.requests
              : []
          );

          setRequestError("");

          setConnectionState(
            "connected"
          );

          return data?.requests || [];
        } catch (loadError) {
          if (!mountedRef.current) {
            return [];
          }

          setConnectionState(
            "disconnected"
          );

          setRequestError(
            loadError?.message ||
              copy.errorRequests
          );

          return [];
        } finally {
          if (
            mountedRef.current &&
            !silent
          ) {
            setLoadingRequests(
              false
            );
          }
        }
      },
      [copy.errorRequests, transporterId]
    );

  const refreshAll =
    useCallback(
      async ({
        manual = true,
      } = {}) => {
        if (manual) {
          setRefreshing(true);
        }

        setActionError("");

        try {
          await Promise.all([
            loadProfile({
              silent: manual,
            }),
            loadRequests({
              silent: manual,
            }),
          ]);
        } finally {
          if (manual) {
            setRefreshing(false);
          }
        }
      },
      [loadProfile, loadRequests]
    );

  useEffect(() => {
    mountedRef.current = true;

    if (!transporterId) {
      navigate(
        "/transporter/login",
        {
          replace: true,
        }
      );
    }

    return () => {
      mountedRef.current =
        false;
    };
  }, [navigate, transporterId]);

  useEffect(() => {
    if (!transporterId) {
      return undefined;
    }

    refreshAll({
      manual: false,
    });

    refreshTimerRef.current =
      window.setInterval(
        () => {
          refreshAll({
            manual: false,
          });
        },
        REFRESH_INTERVAL_MS
      );

    return () => {
      if (
        refreshTimerRef.current
      ) {
        window.clearInterval(
          refreshTimerRef.current
        );
      }
    };
  }, [
    refreshAll,
    transporterId,
  ]);

  const activeTrip =
    requests.find(
      (request) =>
        String(
          request.transporter_id || ""
        ) ===
          String(
            transporterId
          ) &&
        isActiveTrip(request)
    ) || null;

  const availableJobs = useMemo(() => {
    const query = String(jobSearch || "").trim().toLowerCase();

    const base = requests
      .filter(
        request =>
          normaliseStatus(request.status) === "REQUESTED"
      )
      .map(request => ({
        ...request,
        _dashboardDistance: dashboardDistanceKm(
          request.pickup_lat,
          request.pickup_lng,
          trackingLocation?.lat,
          trackingLocation?.lng
        ),
      }))
      .filter(request => {
        if (!query) return true;
        return [
          request.booking_id,
          request.token,
          request.farmer_name,
          request.crop,
          request.pickup_address,
          request.center_name,
          request.center_address,
        ]
          .filter(Boolean)
          .some(value =>
            String(value).toLowerCase().includes(query)
          );
      });

    return [...base].sort((a, b) => {
      if (jobView === "nearest") {
        const ad = a._dashboardDistance ?? Number.POSITIVE_INFINITY;
        const bd = b._dashboardDistance ?? Number.POSITIVE_INFINITY;
        if (ad !== bd) return ad - bd;
      }

      if (jobView === "latest") {
        const at = new Date(a.created_at || 0).getTime();
        const bt = new Date(b.created_at || 0).getTime();
        if (at !== bt) return bt - at;
      }

      if (jobView === "priority") {
        const at = dashboardRequestTime(a);
        const bt = dashboardRequestTime(b);
        if (at !== bt) return at - bt;
      }

      return new Date(b.created_at || 0).getTime()
        - new Date(a.created_at || 0).getTime();
    });
  }, [jobSearch, jobView, requests, trackingLocation]);

  const historyTrips =
    requests.filter(
      request =>
        !isActiveTrip(request) &&
        normaliseStatus(request.status) !== "REQUESTED"
    );

  const online =
    Boolean(
      transporter?.is_online
    );

  const capacity =
    Number(
      transporter?.capacity_kg ||
        transporter?.capacityKg ||
        0
    );

  const totalTrips =
    Number(
      transporter?.total_trips ||
        transporter?.totalTrips ||
        0
    );

  const totalEarnings =
    Number(
      transporter?.total_earnings ||
        transporter?.totalEarnings ||
        0
    );

  const rating =
    Number(
      transporter?.rating || 0
    );

  const completedToday = requests.filter(
    request =>
      normaliseStatus(request.status) === "COMPLETED" &&
      isSameCalendarDay(request.updated_at || request.created_at)
  );

  const todayEarnings = completedToday.reduce(
    (sum, request) =>
      sum +
      Number(
        request.final_fare ??
          request.estimated_fare ??
          0
      ),
    0
  );

  const pendingRequestsCount = requests.filter(
    request =>
      normaliseStatus(request.status) === "REQUESTED"
  ).length;

  const toggleAvailability =
    async () => {
      if (!transporterId) {
        return;
      }

      setActionError("");
      setSuccess("");

      const nextOnline =
        !Boolean(
          transporter?.is_online
        );

      try {
        const data =
          await requestJson(
            `/api/transporters/${encodeURIComponent(
              transporterId
            )}/availability`,
            {
              method: "PATCH",
              body: JSON.stringify({
                isOnline:
                  nextOnline,
                is_online:
                  nextOnline,
                currentLat:
                  trackingLocation?.lat ??
                  null,
                currentLng:
                  trackingLocation?.lng ??
                  null,
              }),
            }
          );

        setTransporter(
          data?.transporter ||
            transporter
        );

        setSuccess(
          nextOnline
            ? copy.onlineMessage
            : copy.offlineMessage
        );

        await loadRequests();

        if (
          !nextOnline &&
          locationWatchRef.current
        ) {
          navigator.geolocation?.clearWatch(
            locationWatchRef.current
          );
          locationWatchRef.current =
            null;
        }
      } catch (toggleError) {
        setActionError(
          toggleError?.message ||
            copy.networkError
        );
      }
    };

  const sendLocation =
    useCallback(
      async (
        position,
        {
          showMessage = false,
        } = {}
      ) => {
        if (!transporterId) {
          return false;
        }

        const lat =
          Number(
            position?.coords?.latitude
          );

        const lng =
          Number(
            position?.coords?.longitude
          );

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          return false;
        }

        const location = {
          lat,
          lng,
          accuracy:
            Number(
              position?.coords
                ?.accuracy
            ) || null,
          capturedAt:
            new Date().toISOString(),
        };

        setTrackingLocation(
          location
        );

        try {
          await requestJson(
            `/api/transporters/${encodeURIComponent(
              transporterId
            )}/location`,
            {
              method: "PATCH",
              body: JSON.stringify({
                lat,
                lng,
              }),
            }
          );

          setLocationStatus(
            location.capturedAt
          );

          /*
           * Location affects job eligibility. Refresh the job queue
           * immediately after the backend stores the new coordinates.
           * Without this, the dashboard can remain empty until the
           * user manually refreshes even though a nearby farmer request
           * is now eligible.
           */
          await loadRequests({
            silent: true,
          });

          if (showMessage) {
            setSuccess(
              copy.locationSent
            );
          }

          return true;
        } catch (
          locationError
        ) {
          setLocationStatus("");

          if (showMessage) {
            setActionError(
              locationError?.message ||
                copy.networkError
            );
          }

          return false;
        }
      },
      [
        copy.locationSent,
        copy.networkError,
        loadRequests,
        transporterId,
      ]
    );

  const startLocationWatch =
    useCallback(() => {
      if (
        !navigator.geolocation
      ) {
        setLocationStatus(
          "unsupported"
        );
        return;
      }

      if (
        locationWatchRef.current
      ) {
        navigator.geolocation.clearWatch(
          locationWatchRef.current
        );
        locationWatchRef.current =
          null;
      }

      locationWatchRef.current =
        navigator.geolocation.watchPosition(
          (position) => {
            sendLocation(
              position
            );
          },
          () => {
            setLocationStatus(
              "denied"
            );
          },
          {
            enableHighAccuracy:
              true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
    }, [sendLocation]);

  useEffect(() => {
    if (
      online &&
      transporterId
    ) {
      startLocationWatch();
    } else if (
      locationWatchRef.current
    ) {
      navigator.geolocation?.clearWatch(
        locationWatchRef.current
      );
      locationWatchRef.current =
        null;
    }

    return () => {
      if (
        locationWatchRef.current
      ) {
        navigator.geolocation?.clearWatch(
          locationWatchRef.current
        );
        locationWatchRef.current =
          null;
      }
    };
  }, [
    online,
    startLocationWatch,
    transporterId,
  ]);

  const useCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setLocationStatus(
          "unsupported"
        );
        setActionError(
          copy.locationDisabled
        );
        return;
      }

      setLocationBusy(true);
      setActionError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const updated = await sendLocation(
            position,
            {
              showMessage: true,
            }
          );

          if (updated) {
            await loadRequests({
              silent: true,
            });
          }

          setLocationBusy(false);
        },
        () => {
          setLocationBusy(false);
          setLocationStatus(
            "denied"
          );
          setActionError(
            copy.locationDisabled
          );
        },
        {
          enableHighAccuracy:
            true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    };

  const acceptJob =
    async (requestId) => {
      if (!transporterId) {
        return;
      }

      setActionRequestId(
        String(requestId)
      );
      setActionError("");
      setSuccess("");

      try {
        const data =
          await requestJson(
            `/api/transport/requests/${encodeURIComponent(
              requestId
            )}/accept`,
            {
              method: "PATCH",
              body: JSON.stringify({
                transporterId,
              }),
            }
          );

        setSuccess(
          data?.message ||
            copy.accepted
        );

        await Promise.all([
          loadProfile(),
          loadRequests(),
        ]);
      } catch (acceptError) {
        setActionError(
          acceptError?.message ||
            copy.cannotAccept
        );

        await loadRequests({
          silent: true,
        });
      } finally {
        setActionRequestId("");
      }
    };

  const declineJob =
    async (
      requestId,
      reason
    ) => {
      if (!transporterId) {
        return;
      }

      setActionRequestId(
        String(requestId)
      );
      setActionError("");
      setSuccess("");

      try {
        const data =
          await requestJson(
            `/api/transport/requests/${encodeURIComponent(
              requestId
            )}/reject`,
            {
              method: "PATCH",
              body: JSON.stringify({
                transporterId,
                reason:
                  String(
                    reason || ""
                  ).trim() ||
                  "Transporter declined the request.",
              }),
            }
          );

        setSuccess(
          data?.message ||
            copy.decline
        );

        await loadRequests();
      } catch (declineError) {
        setActionError(
          declineError?.message ||
            copy.networkError
        );
      } finally {
        setActionRequestId("");
      }
    };

  const updateTripStatus =
    async (
      requestId,
      nextStatus
    ) => {
      if (!transporterId) {
        return;
      }

      setStatusRequestId(
        String(requestId)
      );
      setActionError("");
      setSuccess("");

      try {
        const data =
          await requestJson(
            `/api/transport/requests/${encodeURIComponent(
              requestId
            )}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({
                transporterId,
                status:
                  nextStatus,
              }),
            }
          );

        setSuccess(
          data?.message ||
            getStatusLabel(
              nextStatus,
              language
            )
        );

        await Promise.all([
          loadProfile(),
          loadRequests(),
        ]);
      } catch (statusError) {
        setActionError(
          statusError?.message ||
            copy.networkError
        );
      } finally {
        setStatusRequestId("");
      }
    };

  const logout =
    () => {
      try {
        window.localStorage.removeItem(
          SESSION_KEY
        );
        window.localStorage.removeItem(
          TRANSPORTER_ID_KEY
        );
        window.sessionStorage.removeItem(
          TEMP_SESSION_KEY
        );
      } catch {
        // Ignore storage failures.
      }

      if (
        locationWatchRef.current
      ) {
        navigator.geolocation?.clearWatch(
          locationWatchRef.current
        );
        locationWatchRef.current =
          null;
      }

      navigate(
        "/transporter/login",
        {
          replace: true,
        }
      );
    };

  if (!transporterId) {
    return null;
  }

  return (
    <div
      style={
        styles.page
      }
    >
      <Header />

      <main
        style={
          styles.shell
        }
      >
        <section
          style={
            styles.hero
          }
        >
          <div
            style={
              styles.heroMain
            }
          >
            <div
              style={
                styles.profileAvatar
              }
            >
              {getInitials(
                transporter?.name
              )}
            </div>

            <div>
              <span
                style={
                  styles.eyebrow
                }
              >
                {copy.portal}
              </span>

              <h1
                style={
                  styles.heroTitle
                }
              >
                {copy.greeting},{" "}
                {transporter?.name ||
                  "Transporter"}
              </h1>

              <p
                style={
                  styles.heroSubtitle
                }
              >
                {copy.subtitle}
              </p>
            </div>
          </div>

          <div
            style={
              styles.heroActions
            }
          >
            <LanguageSwitcher
              language={
                language
              }
              setLanguage={
                setLanguage
              }
              copy={copy}
            />

            <button
              type="button"
              onClick={
                toggleAvailability
              }
              disabled={
                loadingProfile
              }
              style={{
                ...styles.availabilityButton,
                ...(online
                  ? styles.availabilityOnline
                  : styles.availabilityOffline),
              }}
            >
              <span
                style={
                  styles.onlineDot
                }
              />
              {online
                ? copy.goOffline
                : copy.goOnline}
            </button>

            <AppIconButton
              title={
                copy.logout
              }
              onClick={
                logout
              }
            >
              <LogOut
                size={17}
              />
            </AppIconButton>
          </div>
        </section>

        <section
          style={styles.commandQuickBar}
          className="transporter-dashboard-command-quickbar"
        >
          <div style={styles.quickBarIdentity}>
            <div style={styles.quickBarIcon}>
              <Truck size={18} />
            </div>
            <div>
              <span style={styles.quickBarEyebrow}>
                YOUR WORKSPACE
              </span>
              <strong>
                {online
                  ? "Ready to receive farmer requests"
                  : "You're currently offline"}
              </strong>
              <small>
                {transporter?.vehicle_number ||
                  transporter?.vehicleNumber ||
                  "Vehicle details"}{" "}
                ·{" "}
                {formatNumber(
                  capacity
                )}{" "}
                {copy.kg}
              </small>
            </div>
          </div>

          <div style={styles.quickBarActions} className="transporter-dashboard-quickbar-actions">
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("transporter-dashboard-jobs")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }}
              style={styles.quickActionPrimary}
            >
              <Bell size={15} />
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} New ${
                    pendingRequestsCount === 1
                      ? "Request"
                      : "Requests"
                  }`
                : "View Requests"}
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("transporter-dashboard-trip")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
              }
              style={styles.quickActionSecondary}
            >
              <Navigation size={15} />
              {activeTrip
                ? "Active Trip"
                : "Trip Center"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transporter/earnings"
                )
              }
              style={styles.quickActionSecondary}
            >
              <Activity size={15} />
              Earnings
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transporter/profile"
                )
              }
              style={styles.quickActionSecondary}
            >
              <UserRound size={15} />
              Profile
            </button>
          </div>
        </section>

        {error ? (
          <div
            style={
              styles.alertError
            }
          >
            <XCircle
              size={18}
            />
            <span>
              {error}
            </span>
            <button
              type="button"
              onClick={() =>
                refreshAll()
              }
              style={
                styles.alertButton
              }
            >
              {copy.retry}
            </button>
          </div>
        ) : null}

        {requestError ? (
          <div
            style={
              styles.alertWarning
            }
          >
            <Bell
              size={18}
            />
            <span>
              {
                requestError
              }
            </span>
            <button
              type="button"
              onClick={() =>
                loadRequests()
              }
              style={
                styles.alertButton
              }
            >
              {copy.retry}
            </button>
          </div>
        ) : null}

        {actionError ? (
          <div
            style={
              styles.alertError
            }
          >
            <XCircle
              size={18}
            />
            <span>
              {actionError}
            </span>
            <button
              type="button"
              onClick={() =>
                setActionError(
                  ""
                )
              }
              style={
                styles.alertClose
              }
            >
              <X
                size={16}
              />
            </button>
          </div>
        ) : null}

        {success ? (
          <div
            style={
              styles.alertSuccess
            }
          >
            <CheckCircle2
              size={18}
            />
            <span>
              {success}
            </span>
            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              style={
                styles.alertClose
              }
            >
              <X
                size={16}
              />
            </button>
          </div>
        ) : null}

        <section
          style={
            styles.topGrid
          }
        >
          <div
            style={
              styles.statusCard
            }
          >
            <div
              style={
                styles.statusHeader
              }
            >
              <div>
                <span
                  style={
                    styles.sectionEyebrow
                  }
                >
                  {copy.connection}
                </span>

                <h2
                  style={
                    styles.statusTitle
                  }
                >
                  {online
                    ? copy.online
                    : copy.offline}
                </h2>
              </div>

              <div
                style={{
                  ...styles.statusBigIcon,
                  background:
                    online
                      ? "#e6f5ea"
                      : "#f2f4f3",
                  color:
                    online
                      ? "#1f7a47"
                      : "#748177",
                }}
              >
                {online ? (
                  <Wifi
                    size={25}
                  />
                ) : (
                  <WifiOff
                    size={25}
                  />
                )}
              </div>
            </div>

            <p
              style={
                styles.statusText
              }
            >
              {online
                ? copy.onlineMessage
                : copy.offlineMessage}
            </p>

            <div
              style={
                styles.statusBottom
              }
            >
              <span
                style={
                  styles.statusConnection
                }
              >
                <span
                  style={{
                    ...styles.connectionDot,
                    background:
                      connectionState ===
                      "connected"
                        ? "#2d9758"
                        : "#c15b42",
                  }}
                />
                {connectionState ===
                "connected"
                  ? copy.connected
                  : copy.disconnected}
              </span>

              <button
                type="button"
                onClick={
                  toggleAvailability
                }
                style={
                  styles.inlineAction
                }
              >
                {online
                  ? copy.goOffline
                  : copy.goOnline}
              </button>
            </div>
          </div>

          <RegionCard
            transporter={
              transporter
            }
            copy={copy}
          />

          <div
            style={
              styles.quickStats
            }
          >
            <StatCard
              icon={Truck}
              label={
                copy.capacity
              }
              value={`${formatNumber(
                capacity
              )} ${copy.kg}`}
              subtext={
                copy.available
              }
            />

            <StatCard
              icon={
                CheckCircle2
              }
              label={
                copy.totalTrips
              }
              value={formatNumber(
                totalTrips
              )}
              subtext={
                copy.today
              }
            />

            <StatCard
              icon={Activity}
              label={
                copy.totalEarnings
              }
              value={formatMoney(
                totalEarnings
              )}
              subtext={
                rating > 0
                  ? `${copy.rating} ${rating.toFixed(
                      1
                    )}`
                  : copy.notRated
              }
            />
          </div>
        </section>

        <section
          style={styles.todayStrip}
          className="transporter-dashboard-today-strip"
        >
          <StatCard
            icon={Bell}
            label="New requests"
            value={formatNumber(
              pendingRequestsCount
            )}
            subtext="Waiting for acceptance"
          />
          <StatCard
            icon={CheckCircle2}
            label="Trips completed today"
            value={formatNumber(
              completedToday.length
            )}
            subtext="Completed jobs"
          />
          <StatCard
            icon={Activity}
            label="Today's earnings"
            value={formatMoney(
              todayEarnings
            )}
            subtext="From completed trips"
          />
          <StatCard
            icon={LocateFixed}
            label="GPS status"
            value={
              trackingLocation
                ? "Live"
                : "Not shared"
            }
            subtext={formatLocationStatus(
              trackingLocation,
              language
            )}
          />
        </section>

        <section
          id="transporter-dashboard-jobs"
          style={styles.commandCenter}
          className="transporter-dashboard-command-center"
        >
          <div style={styles.commandHeader}>
            <div>
              <span style={styles.sectionEyebrow}>
                TODAY'S WORK
              </span>
              <h2 style={styles.pageSectionTitle}>
                {copy.nearbyJobs}
              </h2>
              <p style={styles.commandSubtext}>
                {online
                  ? `${availableJobs.length} request${availableJobs.length === 1 ? "" : "s"} ready for your attention.`
                  : "Go online to receive new farmer transport jobs."}
              </p>
            </div>

            <div style={styles.commandHeaderActions}>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationBusy}
                style={styles.secondaryButton}
              >
                {locationBusy ? (
                  <span style={styles.miniSpinner} />
                ) : (
                  <LocateFixed size={15} />
                )}
                {locationBusy
                  ? copy.locationUpdating
                  : copy.currentLocation}
              </button>

              <button
                type="button"
                onClick={() => refreshAll()}
                disabled={refreshing}
                style={styles.refreshButton}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "krishisetu-spin" : ""}
                />
                {copy.refresh}
              </button>
            </div>
          </div>

          <div
            style={styles.priorityStrip}
            className="transporter-dashboard-priority-strip"
          >
            <div style={styles.priorityMetric}>
              <div style={styles.priorityMetricIcon}>
                <Zap size={18} />
              </div>
              <div>
                <span style={styles.priorityMetricLabel}>
                  NEW REQUESTS
                </span>
                <strong>{availableJobs.length}</strong>
              </div>
            </div>

            <div style={styles.priorityMetric}>
              <div style={styles.priorityMetricIcon}>
                <Truck size={18} />
              </div>
              <div>
                <span style={styles.priorityMetricLabel}>
                  ACTIVE TRIP
                </span>
                <strong>
                  {activeTrip
                    ? getStatusLabel(activeTrip.status, language)
                    : "None"}
                </strong>
              </div>
            </div>

            <div style={styles.priorityMetric}>
              <div style={styles.priorityMetricIcon}>
                <LocateFixed size={18} />
              </div>
              <div>
                <span style={styles.priorityMetricLabel}>
                  YOUR GPS
                </span>
                <strong>
                  {trackingLocation
                    ? `${Number(trackingLocation.lat).toFixed(4)}, ${Number(trackingLocation.lng).toFixed(4)}`
                    : "Not shared"}
                </strong>
              </div>
            </div>

            <div style={styles.priorityMetric}>
              <div style={styles.priorityMetricIcon}>
                <Wifi size={18} />
              </div>
              <div>
                <span style={styles.priorityMetricLabel}>
                  AVAILABILITY
                </span>
                <strong>{online ? "Online" : "Offline"}</strong>
              </div>
            </div>
          </div>

          <div style={styles.locationServiceGrid} className="transporter-dashboard-location-service-grid">
            <div style={styles.locationServiceCard}>
              <div style={styles.locationServiceIcon}>
                <LocateFixed size={17} />
              </div>
              <div>
                <span style={styles.locationServiceLabel}>
                  LIVE LOCATION
                </span>
                <strong>
                  {trackingLocation
                    ? `${Number(trackingLocation.lat).toFixed(5)}, ${Number(trackingLocation.lng).toFixed(5)}`
                    : "Not shared"}
                </strong>
                <small>
                  {formatLocationStatus(
                    trackingLocation,
                    language
                  )}
                </small>
              </div>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationBusy}
                style={styles.locationRefreshButton}
              >
                <LocateFixed size={13} />
                {locationBusy
                  ? "Updating…"
                  : "Update"}
              </button>
            </div>

            <div style={styles.locationServiceCard}>
              <div style={styles.locationServiceIcon}>
                <MapPin size={17} />
              </div>
              <div>
                <span style={styles.locationServiceLabel}>
                  SERVICE AREA
                </span>
                <strong>
                  {transporter?.village ||
                    copy.primaryVillage}
                </strong>
                <small>
                  {[
                    transporter?.mandal,
                    transporter?.district,
                    transporter?.state,
                  ]
                    .filter(Boolean)
                    .join(" · ") ||
                    "Registered transport area"}{" "}
                  ·{" "}
                  {formatNumber(
                    transporter?.service_radius_km ??
                      transporter?.serviceRadiusKm ??
                      0
                  )}{" "}
                  {copy.kilometers}
                </small>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/transporter/profile"
                  )
                }
                style={styles.locationRefreshButton}
              >
                Profile
              </button>
            </div>
          </div>

          <div
            style={styles.jobToolbar}
            className="transporter-dashboard-job-toolbar"
          >
            <div style={styles.jobFilterGroup}>
              <button
                type="button"
                onClick={() => setJobView("priority")}
                style={{
                  ...styles.filterButton,
                  ...(jobView === "priority"
                    ? styles.filterButtonActive
                    : {}),
                }}
              >
                Upcoming first
              </button>

              <button
                type="button"
                onClick={() => setJobView("nearest")}
                style={{
                  ...styles.filterButton,
                  ...(jobView === "nearest"
                    ? styles.filterButtonActive
                    : {}),
                }}
              >
                Nearest first
              </button>

              <button
                type="button"
                onClick={() => setJobView("latest")}
                style={{
                  ...styles.filterButton,
                  ...(jobView === "latest"
                    ? styles.filterButtonActive
                    : {}),
                }}
              >
                Latest
              </button>
            </div>

            <input
              type="search"
              value={jobSearch}
              onChange={event => setJobSearch(event.target.value)}
              placeholder="Search farmer, crop, booking…"
              style={styles.jobSearch}
            />
          </div>

          {!online ? (
            <div style={styles.offlineBanner}>
              <WifiOff size={18} />
              <div>
                <strong>You're offline</strong>
                <span>
                  Turn availability on so eligible farmer requests can reach this dashboard.
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAvailability}
                style={styles.primaryButton}
              >
                {copy.goOnline}
              </button>
            </div>
          ) : null}

          {loadingRequests ? (
            <div style={styles.loadingGrid}>
              {[1, 2, 3, 4].map(index => (
                <div
                  key={index}
                  style={styles.skeletonCard}
                  className="transporter-dashboard-skeleton"
                >
                  <div style={styles.skeletonLineShort} />
                  <div style={styles.skeletonLineLong} />
                  <div style={styles.skeletonLine} />
                  <div style={styles.skeletonLine} />
                </div>
              ))}
            </div>
          ) : availableJobs.length ? (
            <div style={styles.jobsGrid}>
              {availableJobs.slice(0, 12).map(request => (
                <JobCard
                  key={request.id}
                  request={request}
                  language={language}
                  copy={copy}
                  canAccept={online && !activeTrip}
                  busyRequestId={actionRequestId}
                  onAccept={acceptJob}
                  onDecline={declineJob}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyJobs}>
              <div style={styles.emptyIconLarge}>
                <Zap size={26} />
              </div>
              <h3 style={styles.emptyTitle}>
                {jobSearch
                  ? "No matching requests"
                  : copy.noJobs}
              </h3>
              <p style={styles.emptyText}>
                {jobSearch
                  ? "Try a different farmer, crop, booking or center search."
                  : online
                    ? copy.noJobsHint
                    : "Go online and share your current GPS location. New eligible requests will appear here."}
              </p>
            </div>
          )}

          {availableJobs.length > 12 ? (
            <div style={styles.moreJobsNote}>
              Showing the first 12 priority requests. Open Jobs for the complete queue.
              <button
                type="button"
                onClick={() => navigate("/transporter/jobs")}
                style={styles.textLinkButton}
              >
                Open Jobs →
              </button>
            </div>
          ) : null}
        </section>

        <section
          id="transporter-dashboard-trip"
          style={
            styles.tripSection
          }
        >
          <div
            style={
              styles.sectionHeaderRow
            }
          >
            <div>
              <span
                style={
                  styles.sectionEyebrow
                }
              >
                {copy.trip}
              </span>

              <h2
                style={
                  styles.pageSectionTitle
                }
              >
                {copy.activeTrip}
              </h2>
            </div>

            {activeTrip ? (
              <span
                style={
                  styles.liveBadge
                }
              >
                <span
                  style={
                    styles.liveBadgeDot
                  }
                />
                {copy.activeNow}
              </span>
            ) : null}
          </div>

          <ActiveTripCard
            request={
              activeTrip
            }
            copy={
              copy
            }
            language={
              language
            }
            onStatusChange={
              updateTripStatus
            }
            statusBusy={
              Boolean(
                statusRequestId
              )
            }
          />
        </section>

        <section
          style={
            styles.bottomSection
          }
        >
          <div
            style={
              styles.sectionHeaderRow
            }
          >
            <div>
              <span
                style={
                  styles.sectionEyebrow
                }
              >
                {copy.recentTrips}
              </span>

              <h2
                style={
                  styles.pageSectionTitle
                }
              >
                {copy.recentTrips}
              </h2>
            </div>
          </div>

          {historyTrips.length ? (
            <div
              style={
                styles.historyList
              }
            >
              {historyTrips
                .slice(0, 8)
                .map(
                  (
                    request
                  ) => (
                    <div
                      key={
                        request.id
                      }
                      style={
                        styles.historyRow
                      }
                    >
                      <div
                        style={
                          styles.historyIcon
                        }
                      >
                        <Truck
                          size={17}
                        />
                      </div>

                      <div
                        style={
                          styles.historyMain
                        }
                      >
                        <strong>
                          {request.crop ||
                            "Crop load"}
                          {" · "}
                          {formatNumber(
                            request.quantity_kg
                          )}{" "}
                          {copy.kg}
                        </strong>

                        <span>
                          {request.farmer_name ||
                            "Farmer"}{" "}
                          →{" "}
                          {request.center_name ||
                            "Center"}
                        </span>
                      </div>

                      <StatusPill
                        status={
                          request.status
                        }
                        language={
                          language
                        }
                      />

                      <div
                        style={
                          styles.historyFare
                        }
                      >
                        {formatMoney(
                          request.final_fare ??
                            request.estimated_fare
                        )}
                      </div>

                      <div
                        style={
                          styles.historyDate
                        }
                      >
                        {formatRelative(
                          request.updated_at ||
                            request.created_at,
                          language
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          ) : (
            <div
              style={
                styles.emptyHistory
              }
            >
              <Activity
                size={20}
              />
              <span>
                {copy.noActive}
              </span>
            </div>
          )}
        </section>

        <section style={styles.navigationPanel}>
          <div>
            <span style={styles.sectionEyebrow}>
              QUICK ACCESS
            </span>
            <h2 style={styles.pageSectionTitle}>
              Manage your transport work
            </h2>
          </div>

          <div style={styles.navigationGrid} className="transporter-dashboard-navigation-grid">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transporter/jobs"
                )
              }
              style={styles.navigationCard}
            >
              <Bell size={18} />
              <span>
                <strong>All Jobs</strong>
                <small>
                  Browse every eligible farmer request
                </small>
              </span>
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transporter/trip"
                )
              }
              style={styles.navigationCard}
            >
              <Navigation size={18} />
              <span>
                <strong>Trip Center</strong>
                <small>
                  Continue or review an active trip
                </small>
              </span>
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transporter/earnings"
                )
              }
              style={styles.navigationCard}
            >
              <Activity size={18} />
              <span>
                <strong>Earnings</strong>
                <small>
                  View fares and completed trips
                </small>
              </span>
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transporter/profile"
                )
              }
              style={styles.navigationCard}
            >
              <UserRound size={18} />
              <span>
                <strong>Profile & vehicle</strong>
                <small>
                  Update service area and vehicle details
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        </section>

        <footer
          style={
            styles.footer
          }
        >
          <div>
            <ShieldCheck
              size={16}
            />
            <span>
              {copy.regionProtected}
            </span>
          </div>

          <button
            type="button"
            onClick={
              logout
            }
            style={
              styles.footerLogout
            }
          >
            <LogOut
              size={15}
            />
            {copy.logout}
          </button>
        </footer>
      </main>

      <style>
        {`
          @keyframes krishisetuSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .krishisetu-spin {
            animation: krishisetuSpin 0.9s linear infinite;
          }

          @media (max-width: 1050px) {
            .transporter-dashboard-today-strip {
              grid-template-columns: repeat(2, 1fr) !important;
            }

            .transporter-dashboard-command-quickbar {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .transporter-dashboard-quickbar-actions {
              justify-content: flex-start !important;
            }

            .transporter-dashboard-navigation-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }

            .transporter-dashboard-location-service-grid {
              grid-template-columns: 1fr !important;
            }

            .transporter-dashboard-priority-strip {
              grid-template-columns: repeat(2, 1fr) !important;
            }

            .transporter-dashboard-top-grid {
              grid-template-columns: 1fr 1fr !important;
            }

            .transporter-dashboard-quick-stats {
              grid-column: 1 / -1;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
            }

            .transporter-dashboard-jobs-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 760px) {
            .transporter-dashboard-today-strip {
              grid-template-columns: 1fr !important;
            }

            .transporter-dashboard-navigation-grid {
              grid-template-columns: 1fr !important;
            }

            .transporter-dashboard-location-service-grid {
              grid-template-columns: 1fr !important;
            }

            .transporter-dashboard-command-center {
              padding: 16px !important;
            }

            .transporter-dashboard-priority-strip {
              grid-template-columns: 1fr !important;
            }

            .transporter-dashboard-job-toolbar {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .transporter-dashboard-job-toolbar input {
              width: 100% !important;
            }

            .transporter-dashboard-shell {
              padding: 18px 14px 42px !important;
            }

            .transporter-dashboard-hero {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .transporter-dashboard-hero-actions {
              justify-content: space-between !important;
              flex-wrap: wrap;
            }

            .transporter-dashboard-top-grid {
              grid-template-columns: 1fr !important;
            }

            .transporter-dashboard-quick-stats {
              grid-template-columns: 1fr !important;
            }

            .transporter-dashboard-job-main {
              grid-template-columns: 1fr 1fr !important;
            }

            .transporter-dashboard-job-footer {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .transporter-dashboard-job-actions {
              flex-wrap: wrap;
            }

            .transporter-dashboard-history-row {
              grid-template-columns: auto 1fr !important;
            }

            .transporter-dashboard-history-row > *:nth-child(n+3) {
              grid-column: 2;
              justify-self: start;
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  commandQuickBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginTop: "16px",
    padding: "13px 15px",
    borderRadius: "16px",
    background: "#ffffff",
    border: "1px solid #e0e9e3",
    boxShadow: "0 10px 25px rgba(25,65,42,.04)",
  },

  quickBarIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  quickBarIcon: {
    width: "39px",
    height: "39px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    background: "#eaf6ee",
    color: "#2a7547",
  },

  quickBarEyebrow: {
    display: "block",
    color: "#8a968e",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.12em",
  },

  quickBarIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  quickBarIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  quickBarActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "6px",
    flexWrap: "wrap",
  },

  quickActionPrimary: {
    minHeight: "35px",
    padding: "0 11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "9px",
    border: "1px solid #236d40",
    background: "#236f40",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  quickActionSecondary: {
    minHeight: "35px",
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "9px",
    border: "1px solid #dce6e0",
    background: "#ffffff",
    color: "#52675b",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  todayStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "13px",
  },

  locationServiceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "11px",
  },

  locationServiceCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 12px",
    border: "1px solid #e2ebe5",
    borderRadius: "13px",
    background: "#fbfdfb",
  },

  locationServiceIcon: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#edf7f0",
    color: "#2c7547",
  },

  locationServiceCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 12px",
    border: "1px solid #e2ebe5",
    borderRadius: "13px",
    background: "#fbfdfb",
  },

  locationServiceLabel: {
    display: "block",
    color: "#8a968e",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.1em",
  },

  locationServiceCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 12px",
    border: "1px solid #e2ebe5",
    borderRadius: "13px",
    background: "#fbfdfb",
  },

  locationServiceCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 12px",
    border: "1px solid #e2ebe5",
    borderRadius: "13px",
    background: "#fbfdfb",
  },

  locationRefreshButton: {
    marginLeft: "auto",
    minHeight: "31px",
    padding: "0 9px",
    borderRadius: "8px",
    border: "1px solid #d8e4dd",
    background: "#ffffff",
    color: "#416154",
    fontSize: "9px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  navigationPanel: {
    marginTop: "29px",
  },

  navigationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "12px",
  },

  navigationCard: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "13px",
    borderRadius: "13px",
    border: "1px solid #e2ebe5",
    background: "#ffffff",
    color: "#2c4438",
    textAlign: "left",
    cursor: "pointer",
  },

  navigationCard: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "13px",
    borderRadius: "13px",
    border: "1px solid #e2ebe5",
    background: "#ffffff",
    color: "#2c4438",
    textAlign: "left",
    cursor: "pointer",
  },

  commandCenter: {
    marginTop: "28px",
    padding: "22px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #e1e9e3",
    boxShadow: "0 15px 36px rgba(28, 72, 46, 0.05)",
  },

  commandHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
  },

  commandHeaderActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  commandSubtext: {
    margin: "5px 0 0",
    color: "#718078",
    fontSize: "11px",
  },

  priorityStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "9px",
    marginTop: "18px",
    padding: "10px",
    borderRadius: "15px",
    background: "#f7faf8",
    border: "1px solid #e3ebe5",
  },

  priorityMetric: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
    padding: "10px 11px",
    borderRadius: "11px",
    background: "#ffffff",
    border: "1px solid #e8eee9",
  },

  priorityMetricIcon: {
    width: "35px",
    height: "35px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#eaf5ed",
    color: "#277447",
  },

  priorityMetricLabel: {
    display: "block",
    color: "#8a978f",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.09em",
  },

  jobToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginTop: "17px",
    marginBottom: "13px",
  },

  jobFilterGroup: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  filterButton: {
    minHeight: "34px",
    padding: "0 10px",
    borderRadius: "9px",
    border: "1px solid #dce6e0",
    background: "#ffffff",
    color: "#66776e",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  filterButtonActive: {
    borderColor: "#abd1b7",
    background: "#edf7f0",
    color: "#246b40",
  },

  jobSearch: {
    width: "250px",
    height: "36px",
    padding: "0 11px",
    borderRadius: "9px",
    border: "1px solid #dce6e0",
    outline: "none",
    color: "#354b40",
    background: "#ffffff",
    fontSize: "11px",
  },

  offlineBanner: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "13px",
    padding: "12px 13px",
    borderRadius: "12px",
    background: "#fff8ec",
    border: "1px solid #efdcb7",
    color: "#7b5a22",
  },

  textLinkButton: {
    marginLeft: "8px",
    border: 0,
    padding: 0,
    background: "transparent",
    color: "#267144",
    fontWeight: 800,
    cursor: "pointer",
  },

  moreJobsNote: {
    marginTop: "13px",
    textAlign: "center",
    color: "#7a8880",
    fontSize: "10px",
  },



  shell: {
    width: "min(1240px, calc(100% - 32px))",
    margin: "0 auto",
    padding: "34px 0 58px",
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    padding: "26px 28px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f2f8f4 100%)",
    border:
      "1px solid #e2ebe4",
    boxShadow:
      "0 18px 44px rgba(25, 65, 42, 0.07)",
  },

  heroMain: {
    display: "flex",
    alignItems: "center",
    gap: "17px",
    minWidth: 0,
  },

  profileAvatar: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background:
      "linear-gradient(135deg, #277548, #164f31)",
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 800,
    boxShadow:
      "0 12px 24px rgba(39, 117, 72, 0.22)",
  },

  eyebrow: {
    display: "block",
    marginBottom: "5px",
    color: "#6b7a70",
    fontSize: "10px",
    letterSpacing: "0.17em",
    fontWeight: 800,
  },

  heroTitle: {
    margin: 0,
    color: "#193325",
    fontSize: "30px",
    lineHeight: 1.12,
    letterSpacing: "-0.025em",
  },

  heroSubtitle: {
    margin: "7px 0 0",
    maxWidth: "670px",
    color: "#6a776f",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  heroActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "9px",
    flexWrap: "wrap",
  },

  languageSwitcher: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px",
    borderRadius: "12px",
    border: "1px solid #dde7df",
    background: "#ffffff",
    color: "#66756c",
  },

  languageTitle: {
    padding: "0 4px",
    fontSize: "10px",
    fontWeight: 700,
  },

  languageButton: {
    border: 0,
    borderRadius: "8px",
    padding: "6px 7px",
    background: "transparent",
    color: "#6a776f",
    fontSize: "10px",
    cursor: "pointer",
  },

  languageButtonActive: {
    background: "#246d40",
    color: "#ffffff",
    fontWeight: 800,
  },

  availabilityButton: {
    border: "1px solid transparent",
    borderRadius: "11px",
    padding: "10px 13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  availabilityOnline: {
    background: "#e6f6eb",
    borderColor: "#c8e7d0",
    color: "#1d713f",
  },

  availabilityOffline: {
    background: "#f2f5f3",
    borderColor: "#dbe4de",
    color: "#627168",
  },

  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#31a35d",
    boxShadow:
      "0 0 0 4px rgba(49, 163, 93, 0.12)",
  },

  iconButton: {
    width: "40px",
    height: "40px",
    borderRadius: "11px",
    border: "1px solid #dde7df",
    background: "#ffffff",
    color: "#617067",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  alertError: {
    marginTop: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#fff4f1",
    border: "1px solid #f0d5cd",
    color: "#9c4d3c",
    fontSize: "12px",
  },

  alertWarning: {
    marginTop: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#fffaf0",
    border: "1px solid #eee1bd",
    color: "#8b6a20",
    fontSize: "12px",
  },

  alertSuccess: {
    marginTop: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#eff9f2",
    border: "1px solid #cee8d5",
    color: "#286c40",
    fontSize: "12px",
  },

  alertButton: {
    marginLeft: "auto",
    border: 0,
    background: "transparent",
    color: "inherit",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "11px",
  },

  alertClose: {
    marginLeft: "auto",
    width: "26px",
    height: "26px",
    border: 0,
    background: "transparent",
    color: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  topGrid: {
    display: "grid",
    gridTemplateColumns:
      "1.15fr 1fr 1.2fr",
    gap: "14px",
    marginTop: "16px",
  },

  statusCard: {
    padding: "22px",
    borderRadius: "20px",
    background: "#ffffff",
    border: "1px solid #e4ebe6",
    boxShadow:
      "0 13px 30px rgba(26, 69, 44, 0.055)",
  },

  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  sectionEyebrow: {
    display: "block",
    color: "#7a877f",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },

  statusTitle: {
    margin: "6px 0 0",
    color: "#1b3828",
    fontSize: "22px",
  },

  statusBigIcon: {
    width: "47px",
    height: "47px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    margin: "15px 0 18px",
    color: "#69776e",
    fontSize: "12px",
    lineHeight: 1.5,
    minHeight: "37px",
  },

  statusBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  statusConnection: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#68766d",
    fontSize: "11px",
  },

  connectionDot: {
    width: "7px",
    height: "7px",
    borderRadius: "999px",
  },

  inlineAction: {
    border: 0,
    padding: "0",
    background: "transparent",
    color: "#246d40",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  regionCard: {
    display: "flex",
    gap: "13px",
    padding: "22px",
    borderRadius: "20px",
    background: "#f9fcfa",
    border: "1px solid #dce9df",
  },

  regionIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e9f5ed",
    color: "#286f42",
  },

  regionBody: {
    minWidth: 0,
  },

  regionPrimary: {
    display: "block",
    marginTop: "5px",
    color: "#1e3d2b",
    fontSize: "17px",
  },

  regionLine: {
    display: "block",
    marginTop: "3px",
    color: "#66756c",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  regionMetaRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "12px",
    color: "#718078",
    fontSize: "10px",
    fontWeight: 700,
  },

  regionNote: {
    margin: "13px 0 0",
    color: "#78867e",
    fontSize: "10px",
    lineHeight: 1.45,
  },

  quickStats: {
    display: "grid",
    gap: "10px",
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "17px",
    background: "#ffffff",
    border: "1px solid #e4ebe6",
  },

  statIcon: {
    width: "39px",
    height: "39px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#edf6f0",
    color: "#2a7445",
    flexShrink: 0,
  },

  statBody: {
    minWidth: 0,
  },

  statLabel: {
    display: "block",
    color: "#78857d",
    fontSize: "9px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.11em",
  },

  statValue: {
    display: "block",
    marginTop: "2px",
    color: "#233a2b",
    fontSize: "18px",
    lineHeight: 1.1,
  },

  statSubtext: {
    display: "block",
    marginTop: "2px",
    color: "#829088",
    fontSize: "9px",
  },

  dashboardToolbar: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "18px",
    marginTop: "31px",
    marginBottom: "13px",
  },

  pageSectionTitle: {
    margin: "5px 0 0",
    color: "#1d3827",
    fontSize: "21px",
    letterSpacing: "-0.02em",
  },

  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    padding: "0 12px",
    borderRadius: "10px",
    border: "1px solid #dbe6df",
    background: "#ffffff",
    color: "#4d6256",
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  refreshButton: {
    minHeight: "38px",
    padding: "0 12px",
    borderRadius: "10px",
    border: "1px solid #d2e1d6",
    background: "#246d40",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  locationNotice: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "12px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "#fff7f3",
    color: "#916252",
    border: "1px solid #edd8cf",
    fontSize: "11px",
  },

  gpsStrip: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "13px",
    padding: "11px 13px",
    borderRadius: "12px",
    background: "#eff8f2",
    border: "1px solid #d5eadd",
  },

  gpsStripIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#deefe3",
    color: "#277547",
  },

  jobsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },

  loadingGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },

  skeletonCard: {
    minHeight: "260px",
    padding: "21px",
    borderRadius: "20px",
    background: "#ffffff",
    border: "1px solid #e6ece8",
    overflow: "hidden",
  },

  skeletonLineShort: {
    height: "10px",
    width: "32%",
    borderRadius: "999px",
    background: "#edf1ee",
  },

  skeletonLineLong: {
    height: "16px",
    width: "55%",
    marginTop: "11px",
    borderRadius: "999px",
    background: "#edf1ee",
  },

  skeletonLine: {
    height: "12px",
    width: "85%",
    marginTop: "20px",
    borderRadius: "999px",
    background: "#f1f4f2",
  },

  jobCard: {
    padding: "20px",
    borderRadius: "20px",
    background: "#ffffff",
    border: "1px solid #e1e9e3",
    boxShadow:
      "0 13px 28px rgba(28, 72, 46, 0.045)",
  },

  jobTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  jobEyebrow: {
    display: "block",
    color: "#89958e",
    fontSize: "9px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.13em",
  },

  jobFarmerName: {
    margin: "5px 0 0",
    color: "#1d3927",
    fontSize: "18px",
  },

  jobBookingRef: {
    display: "block",
    marginTop: "4px",
    color: "#8a968f",
    fontSize: "9px",
    fontWeight: 700,
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    flexShrink: 0,
    padding: "6px 8px",
    borderRadius: "999px",
    background: "#f1f4f2",
    color: "#6c7971",
    fontSize: "9px",
    fontWeight: 800,
  },

  statusAssigned: {
    background: "#e9f5ed",
    color: "#246f41",
  },

  statusRoute: {
    background: "#edf6f8",
    color: "#3d717b",
  },

  statusPicked: {
    background: "#fff5e5",
    color: "#8a672a",
  },

  statusDelivered: {
    background: "#eaf4ed",
    color: "#246c40",
  },

  statusCompleted: {
    background: "#e8f6ed",
    color: "#176b39",
  },

  statusCancelled: {
    background: "#fff1ef",
    color: "#a04d42",
  },

  jobMain: {
    // Moved to index.css .sih-transporter-job-main

    gap: "13px",
    marginTop: "20px",
    padding: "13px",
    borderRadius: "13px",
    background: "#f8fbf9",
  },

  cropBlock: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  cropIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e9f5ec",
    color: "#2a7444",
  },

  jobMetaLabel: {
    display: "block",
    color: "#849088",
    fontSize: "9px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  jobMetaValue: {
    display: "block",
    marginTop: "3px",
    color: "#25392c",
    fontSize: "13px",
    fontWeight: 800,
  },

  routeBox: {
    marginTop: "14px",
    padding: "13px",
    border: "1px solid #e6ece8",
    borderRadius: "13px",
  },

  routeItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
  },

  routeDotPickup: {
    width: "11px",
    height: "11px",
    marginTop: "4px",
    borderRadius: "999px",
    border: "3px solid #5b9b73",
    flexShrink: 0,
  },

  routeDotCenter: {
    width: "11px",
    height: "11px",
    marginTop: "4px",
    borderRadius: "999px",
    background: "#2d7144",
    flexShrink: 0,
  },

  routeLine: {
    width: "1px",
    height: "17px",
    margin:
      "3px 0 3px 5px",
    background: "#d8e4dc",
  },

  routeLabel: {
    display: "block",
    color: "#8a958f",
    fontSize: "8px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },

  routeText: {
    display: "block",
    marginTop: "3px",
    color: "#31463a",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  routeHint: {
    display: "block",
    marginTop: "3px",
    color: "#7b8981",
    fontSize: "9px",
    lineHeight: 1.4,
  },

  jobFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "14px",
  },

  requestTime: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#7b8880",
    fontSize: "9px",
    lineHeight: 1.35,
  },

  jobActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "7px",
    flexWrap: "wrap",
  },

  declineButton: {
    minHeight: "36px",
    padding: "0 10px",
    borderRadius: "9px",
    border: "1px solid #edd9d4",
    background: "#fff8f6",
    color: "#a25d4c",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  acceptButton: {
    minHeight: "36px",
    padding: "0 12px",
    borderRadius: "9px",
    border: "1px solid #216d3e",
    background: "#236e40",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  primaryButton: {
    minHeight: "39px",
    padding: "0 12px",
    borderRadius: "10px",
    border: "1px solid #216d3f",
    background: "#236f40",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  miniSpinner: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    border:
      "2px solid rgba(255,255,255,0.38)",
    borderTopColor: "#ffffff",
    animation:
      "krishisetuSpin 0.75s linear infinite",
  },

  declinePanel: {
    marginTop: "11px",
    padding: "12px",
    borderRadius: "12px",
    background: "#fff9f7",
    border: "1px solid #f0ddd7",
  },

  inlineLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#745e56",
    fontSize: "10px",
    fontWeight: 800,
  },

  declineTextarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    padding: "9px 10px",
    borderRadius: "9px",
    border: "1px solid #e4cec7",
    outline: "none",
    color: "#39483f",
    background: "#ffffff",
    fontFamily:
      "inherit",
    fontSize: "11px",
  },

  declinePanelActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "7px",
    marginTop: "8px",
  },

  cancelButton: {
    minHeight: "32px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #dce4df",
    background: "#ffffff",
    color: "#647269",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  confirmDeclineButton: {
    minHeight: "32px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #a85444",
    background: "#a85444",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  emptyJobs: {
    minHeight: "235px",
    padding: "26px",
    borderRadius: "20px",
    border: "1px dashed #d7e3da",
    background: "#fbfdfb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  emptyIconLarge: {
    width: "52px",
    height: "52px",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#edf7f0",
    color: "#2c7546",
  },

  emptyCard: {
    padding: "27px",
    borderRadius: "20px",
    border: "1px dashed #d6e2da",
    background: "#fbfdfb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  emptyIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "15px",
    background: "#eef6f0",
    color: "#2b7445",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    margin: "12px 0 0",
    color: "#304338",
    fontSize: "15px",
  },

  emptyText: {
    maxWidth: "500px",
    margin: "8px auto 0",
    color: "#75827a",
    fontSize: "11px",
    lineHeight: 1.55,
  },

  tripSection: {
    marginTop: "34px",
  },

  sectionHeaderRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "14px",
    marginBottom: "12px",
  },

  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#e9f7ee",
    color: "#2c7145",
    fontSize: "9px",
    fontWeight: 800,
  },

  liveBadgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    background: "#39a560",
    boxShadow:
      "0 0 0 3px rgba(57,165,96,0.12)",
  },

  activeCard: {
    padding: "22px",
    borderRadius: "21px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f4faf6 100%)",
    border: "1px solid #dfe9e2",
    boxShadow:
      "0 15px 32px rgba(27, 74, 46, 0.055)",
  },

  activeHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
  },

  activeTitle: {
    margin: "5px 0 0",
    color: "#203a2b",
    fontSize: "19px",
  },

  activeRoute: {
    display: "grid",
    gridTemplateColumns:
      "30px 1fr",
    gap: "10px",
    marginTop: "20px",
    padding: "15px",
    borderRadius: "14px",
    background: "#ffffff",
    border: "1px solid #e6ede8",
  },

  timelineColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  timelineStart: {
    width: "27px",
    height: "27px",
    borderRadius: "9px",
    background: "#eaf6ed",
    color: "#2b7545",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  timelineStem: {
    width: "2px",
    flex: 1,
    minHeight: "34px",
    margin: "3px 0",
    background:
      "linear-gradient(180deg, #b9dac3, #dae9de)",
  },

  timelineEnd: {
    width: "27px",
    height: "27px",
    borderRadius: "9px",
    background: "#eef4ef",
    color: "#5d7464",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  timelineContent: {
    display: "flex",
    flexDirection: "column",
  },

  timelineGap: {
    minHeight: "32px",
  },

  timelineLabel: {
    display: "block",
    color: "#87928c",
    fontSize: "8px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.11em",
  },

  timelineValue: {
    display: "block",
    marginTop: "4px",
    color: "#304338",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  activeFacts: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "12px",
    padding: "13px",
    borderRadius: "13px",
    background: "#ffffff",
    border: "1px solid #e6ede8",
  },

  activeActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "13px",
  },

  bottomSection: {
    marginTop: "34px",
  },

  historyList: {
    overflow: "hidden",
    borderRadius: "18px",
    border: "1px solid #e3ebe5",
    background: "#ffffff",
  },

  historyRow: {
    display: "grid",
    gridTemplateColumns:
      "40px minmax(0, 1fr) auto auto auto",
    alignItems: "center",
    gap: "12px",
    padding: "13px 15px",
    borderBottom:
      "1px solid #edf1ee",
  },

  historyIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eff6f1",
    color: "#2b7445",
  },

  historyMain: {
    minWidth: 0,
  },

  historyFare: {
    color: "#287047",
    fontSize: "12px",
    fontWeight: 800,
  },

  historyDate: {
    minWidth: "67px",
    color: "#8a958e",
    fontSize: "9px",
    textAlign: "right",
  },

  emptyHistory: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "25px",
    borderRadius: "17px",
    border: "1px dashed #d7e3da",
    background: "#fbfdfb",
    color: "#77857c",
    fontSize: "11px",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginTop: "28px",
    paddingTop: "16px",
    borderTop: "1px solid #e5ece7",
    color: "#7b8880",
    fontSize: "10px",
  },

  footerLogout: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: 0,
    background: "transparent",
    color: "#7b625c",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },
};
