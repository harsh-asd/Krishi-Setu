

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Crosshair,
  FileText,
  Gauge,
  History,
  Info,
  Leaf,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Navigation,
  Package,
  Phone,
  Pencil,
  Star,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  Route,
  Search,
  Share2,
  ShieldCheck,
  Truck,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import { Link, useSearchParams } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";
import { getCurrentFarmer, getState } from "../../data/appStore";

const API_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const DRAFT_KEY = "krishisetu_farmer_transport_draft_v2";
const SELECTED_KEY = "krishisetu_farmer_transport_selected_v2";
const CLOSED = new Set(["CANCELLED", "COMPLETED"]);
const BOOKING_OK = new Set(["CONFIRMED", "ARRIVED", "LATE", "WEIGHING", "PROCURED"]);
const FLOW = ["REQUESTED", "ASSIGNED", "EN_ROUTE_TO_FARMER", "CROP_PICKED_UP", "EN_ROUTE_TO_CENTER", "DELIVERED", "COMPLETED"];

const LABELS = {
  en: {
    REQUESTED: "Searching for transporter", ASSIGNED: "Transporter assigned", EN_ROUTE_TO_FARMER: "Transporter heading to you",
    CROP_PICKED_UP: "Crop picked up", EN_ROUTE_TO_CENTER: "Heading to procurement center", DELIVERED: "Delivered to center",
    COMPLETED: "Transport completed", CANCELLED: "Request cancelled",
  },
  hi: {
    REQUESTED: "ट्रांसपोर्टर खोजा जा रहा है", ASSIGNED: "ट्रांसपोर्टर नियुक्त हो गया", EN_ROUTE_TO_FARMER: "ट्रांसपोर्टर आपकी ओर आ रहा है",
    CROP_PICKED_UP: "फसल उठाई गई", EN_ROUTE_TO_CENTER: "खरीद केंद्र की ओर जा रहा है", DELIVERED: "केंद्र पर पहुंचा दिया गया",
    COMPLETED: "परिवहन पूरा हुआ", CANCELLED: "रिक्वेस्ट रद्द",
  },
  te: {
    REQUESTED: "ట్రాన్స్‌పోర్టర్ కోసం వెతుకుతోంది", ASSIGNED: "ట్రాన్స్‌పోర్టర్ కేటాయించబడింది", EN_ROUTE_TO_FARMER: "ట్రాన్స్‌పోర్టర్ మీ వైపు వస్తున్నారు",
    CROP_PICKED_UP: "పంట తీసుకున్నారు", EN_ROUTE_TO_CENTER: "కొనుగోలు కేంద్రానికి వెళ్తోంది", DELIVERED: "కేంద్రానికి చేర్చారు",
    COMPLETED: "రవాణా పూర్తైంది", CANCELLED: "అభ్యర్థన రద్దు చేయబడింది",
  },
};

const MESSAGES = {
  en: {
    REQUESTED: "Your request is open and visible to eligible transporters.", ASSIGNED: "A transporter has accepted your request.",
    EN_ROUTE_TO_FARMER: "Your transporter is travelling towards pickup.", CROP_PICKED_UP: "Your crop has been picked up.",
    EN_ROUTE_TO_CENTER: "Your crop is travelling to the procurement center.", DELIVERED: "Your crop has reached the procurement center.",
    COMPLETED: "The transport trip has been completed.", CANCELLED: "This transport request is closed.",
  },
  hi: {
    REQUESTED: "आपकी रिक्वेस्ट योग्य ट्रांसपोर्टरों को दिखाई जा रही है।", ASSIGNED: "एक ट्रांसपोर्टर ने आपकी रिक्वेस्ट स्वीकार कर ली है।",
    EN_ROUTE_TO_FARMER: "ट्रांसपोर्टर पिकअप जगह की ओर आ रहा है।", CROP_PICKED_UP: "आपकी फसल उठा ली गई है।",
    EN_ROUTE_TO_CENTER: "आपकी फसल खरीद केंद्र की ओर जा रही है।", DELIVERED: "आपकी फसल खरीद केंद्र पहुंच गई है।",
    COMPLETED: "परिवहन यात्रा पूरी हो गई है।", CANCELLED: "यह परिवहन रिक्वेस्ट बंद हो चुकी है।",
  },
  te: {
    REQUESTED: "మీ అభ్యర్థన అర్హత ఉన్న ట్రాన్స్‌పోర్టర్లకు కనిపిస్తుంది.", ASSIGNED: "ఒక ట్రాన్స్‌పోర్టర్ మీ అభ్యర్థనను అంగీకరించారు.",
    EN_ROUTE_TO_FARMER: "ట్రాన్స్‌పోర్టర్ పికప్ ప్రదేశానికి వస్తున్నారు.", CROP_PICKED_UP: "మీ పంట తీసుకున్నారు.",
    EN_ROUTE_TO_CENTER: "మీ పంట కొనుగోలు కేంద్రానికి వెళ్తోంది.", DELIVERED: "మీ పంట కొనుగోలు కేంద్రానికి చేరుకుంది.",
    COMPLETED: "రవాణా ప్రయాణం పూర్తైంది.", CANCELLED: "ఈ రవాణా అభ్యర్థన మూసివేయబడింది.",
  },
};

const cropsFallback = [
  { id: "wheat", name: "Wheat" }, { id: "paddy", name: "Paddy" }, { id: "maize", name: "Maize" },
  { id: "cotton", name: "Cotton" }, { id: "sugarcane", name: "Sugarcane" }, { id: "soybean", name: "Soybean" },
];

function tx(language, en, hi, te) { return language === "hi" ? hi : language === "te" ? te : en; }
function clean(v) { return String(v ?? "").trim(); }
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function maxDate() { const d = new Date(); d.setDate(d.getDate()+30); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function dateOk(v) { return /^\d{4}-\d{2}-\d{2}$/.test(clean(v)); }
function mins(v) {
  const raw = clean(v).toLowerCase().replace(/\./g, ":");
  let m = raw.match(/^(\d{1,2}):(\d{1,2})\s*(am|pm)?$/);
  if (m) {
    let h = Number(m[1]); const n = Number(m[2]);
    if (n > 59) return null;
    if (m[3] === "am" && h === 12) h = 0;
    if (m[3] === "pm" && h !== 12) h += 12;
    return h >= 0 && h <= 23 ? h * 60 + n : null;
  }
  m = raw.match(/^(\d{3,4})(am|pm)?$/);
  if (!m) return null;
  const s = m[1]; let h = s.length === 3 ? Number(s[0]) : Number(s.slice(0,2)); const n = s.length === 3 ? Number(s.slice(1)) : Number(s.slice(2));
  if (n > 59) return null;
  if (m[2]) { if (h < 1 || h > 12) return null; if (m[2] === "am" && h === 12) h = 0; if (m[2] === "pm" && h !== 12) h += 12; }
  return h >= 0 && h <= 23 ? h * 60 + n : null;
}
function fmtTime(v) { const m = mins(v); if (m == null) return clean(v) || "—"; const h = Math.floor(m/60); return `${h%12||12}:${String(m%60).padStart(2,"0")} ${h>=12?"PM":"AM"}`; }
function fmtDate(v, language="en") { if (!dateOk(v)) return "—"; return new Date(`${v}T00:00:00`).toLocaleDateString(language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN", {day:"numeric",month:"short",year:"numeric"}); }
function fmtDateTime(v, language="en") { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN", {day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}); }
function statusLabel(status, language) { const s = clean(status).toUpperCase(); return LABELS[language]?.[s] || LABELS.en[s] || s || "Transport update"; }
function statusMessage(status, language) { const s = clean(status).toUpperCase(); return MESSAGES[language]?.[s] || MESSAGES.en[s] || "Transport request updated."; }
function fareDisplay(request, language) {
  const finalFare = Number(request?.final_fare ?? request?.actual_fare);
  if (Number.isFinite(finalFare) && finalFare > 0) {
    return {
      amount: `₹${finalFare.toLocaleString("en-IN")}`,
      label: tx(language, "Final fare", "अंतिम किराया", "తుది ఛార్జీ"),
      note: tx(language, "Final fare recorded", "अंतिम किराया दर्ज है", "తుది ఛార్జీ నమోదు అయింది"),
      confirmed: true,
    };
  }
  const estimatedFare = Number(request?.estimated_fare);
  if (Number.isFinite(estimatedFare) && estimatedFare > 0) {
    return {
      amount: `₹${estimatedFare.toLocaleString("en-IN")}`,
      label: tx(language, "Estimated fare", "अनुमानित किराया", "అంచనా ఛార్జీ"),
      note: tx(language, "Only an estimate — not the final payable amount", "यह केवल अनुमान है — अंतिम भुगतान राशि नहीं", "ఇది కేవలం అంచనా — తుది చెల్లింపు మొత్తం కాదు"),
      confirmed: false,
    };
  }
  return {
    amount: tx(language, "To be agreed", "तय किया जाना है", "నిర్ణయించాల్సి ఉంది"),
    label: tx(language, "Fare", "किराया", "ఛార్జీ"),
    note: tx(language, "No fare has been fixed yet. The transporter must confirm a positive final fare before completion.", "अभी किराया तय नहीं हुआ है। यात्रा पूरी करने से पहले ट्रांसपोर्टर को सकारात्मक अंतिम किराया तय करना होगा।", "ఇంకా ఛార్జీ నిర్ణయించలేదు. ట్రిప్ పూర్తి చేసే ముందు ట్రాన్స్‌పోర్టర్ సానుకూల తుది ఛార్జీని నిర్ధారించాలి."),
    confirmed: false,
  };
}
function statusIcon(status) { return ({REQUESTED:Search,ASSIGNED:UserRound,EN_ROUTE_TO_FARMER:Navigation,CROP_PICKED_UP:Package,EN_ROUTE_TO_CENTER:Route,DELIVERED:CheckCircle2,COMPLETED:ShieldCheck,CANCELLED:X}[status] || Truck); }
function cropLabel(crop, crops, language) {
  const map = {wheat:tx(language,"Wheat","गेहूं","గోధుమ"),paddy:tx(language,"Paddy","धान","వరి"),maize:tx(language,"Maize","मक्का","మొక్కజొన్న"),cotton:tx(language,"Cotton","कपास","పత్తి"),sugarcane:tx(language,"Sugarcane","गन्ना","చెరకు"),soybean:tx(language,"Soybean","सोयाबीन","సోయాబీన్")};
  return map[String(crop).toLowerCase()] || crops.find(x => String(x.id)===String(crop) || String(x.name).toLowerCase()===String(crop).toLowerCase())?.name || crop || "Produce";
}
function readDraft() { try { const x=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null"); return x && typeof x === "object" ? x : null; } catch { return null; } }
function writeDraft(x) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({...x,updatedAt:Date.now()})); } catch {} }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch {} }
function readSelected() { try { return localStorage.getItem(SELECTED_KEY)||""; } catch { return ""; } }
function saveSelected(id) { try { if(id)localStorage.setItem(SELECTED_KEY,String(id)); } catch {} }
function slots(center) {
  if (!center) return [];
  const a=mins(center.opening_time||center.openingTime||"09:00"), b=mins(center.closing_time||center.closingTime||"17:00"); if(a==null||b==null||b<=a)return[];
  const out=[]; for(let x=a;x+30<=b;x+=30) out.push({start:`${String(Math.floor(x/60)).padStart(2,"0")}:${String(x%60).padStart(2,"0")}`,end:`${String(Math.floor((x+30)/60)).padStart(2,"0")}:${String((x+30)%60).padStart(2,"0")}`}); return out;
}

export default function FarmerTransport() {
  const [params,setParams] = useSearchParams();
  const { language } = useLanguage();
  const farmer = getCurrentFarmer();
  const appState = getState();
  const [online,setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [centers,setCenters] = useState([]), [bookings,setBookings] = useState([]), [requests,setRequests] = useState([]);
  const [selected,setSelected] = useState(null), [events,setEvents] = useState([]), [matches,setMatches] = useState([]);
  const skipDraftSaveRef = useRef(false);
  const [loading,setLoading] = useState(true), [refreshing,setRefreshing] = useState(false), [submitting,setSubmitting] = useState(false), [matchLoading,setMatchLoading] = useState(false);
  const [error,setError] = useState(""), [info,setInfo] = useState(""), [success,setSuccess] = useState(""), [copied,setCopied] = useState(false), [restored,setRestored] = useState(false);
  const [tab,setTab] = useState("request"), [locationOpen,setLocationOpen] = useState(false), [cancelTarget,setCancelTarget] = useState(null), [cancelReason,setCancelReason] = useState("");
  const [requestSort,setRequestSort] = useState("upcoming");
  const [editTarget,setEditTarget] = useState(null), [editSaving,setEditSaving] = useState(false);
  const [editForm,setEditForm] = useState({quantityKg:"",pickupAddress:"",requestedDate:"",requestedSlotStart:"",requestedSlotEnd:"",pickupNote:"",notes:""});
  const [tracking,setTracking] = useState(null), [trackingLoading,setTrackingLoading] = useState(false);
  const [ratingValue,setRatingValue] = useState(0), [ratingReview,setRatingReview] = useState(""), [ratingSaving,setRatingSaving] = useState(false), [rated,setRated] = useState(false);
  const [transportPayment,setTransportPayment] = useState(null), [paymentMethod,setPaymentMethod] = useState("UPI"), [paymentReference,setPaymentReference] = useState(""), [paymentSaving,setPaymentSaving] = useState(false);
  const [form,setForm] = useState({bookingId:"",timingMode:"scheduled",crop:"",quantityKg:"",centerId:"",pickupAddress:"",pickupLat:"",pickupLng:"",pickupNote:"",requestedDate:today(),requestedSlotStart:"",requestedSlotEnd:"",estimatedFare:"",notes:""});
  const crops = useMemo(() => Array.isArray(appState?.crops)&&appState.crops.length ? appState.crops : cropsFallback,[appState?.crops]);
  const activeBookings = useMemo(() => bookings.filter(b=>BOOKING_OK.has(String(b.status||"").toUpperCase())),[bookings]);

  const activeRequests = useMemo(() => {
    const list = requests.filter(r => !CLOSED.has(String(r.status||"").toUpperCase()));

    const timeValue = r => {
      const raw = String(r?.requested_date || r?.created_at || "");
      const d = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
      return Number.isNaN(d.getTime()) ? Number.POSITIVE_INFINITY : d.getTime();
    };

    return [...list].sort((a,b) => {
      if (requestSort === "latest") {
        return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
      }
      return timeValue(a) - timeValue(b);
    });
  }, [requests,requestSort]);

  const historyRequests = useMemo(() => {
    return [...requests]
      .filter(r=>CLOSED.has(String(r.status||"").toUpperCase()))
      .sort((a,b)=>new Date(b?.updated_at || b?.created_at || 0).getTime() - new Date(a?.updated_at || a?.created_at || 0).getTime());
  },[requests]);
  const center = useMemo(()=>centers.find(c=>String(c.id)===String(form.centerId))||null,[centers,form.centerId]);
  const slotOptions = useMemo(()=>slots(center),[center]);
  const rank = FLOW.indexOf(String(selected?.status||"").toUpperCase());
  const pickupReady = Number.isFinite(Number(form.pickupLat)) && Number.isFinite(Number(form.pickupLng));

  const setField = useCallback((key,value)=>setForm(x=>({...x,[key]:value})),[]);
  const api = useCallback(async(path,options={})=>{
    const r=await fetch(`${API_URL}${path}`,{...options,headers:{Accept:"application/json",...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})}});
    let d=null; try{d=await r.json();}catch{}
    if(!r.ok) throw new Error(d?.message||d?.error?.message||`Request failed: ${r.status}`); return d||{};
  },[]);

  const detail = useCallback(async(id,silent=true)=>{
    if(!id)return;
    if(!silent)setRefreshing(true);
    try{
      const d=await api(`/transport/requests/${encodeURIComponent(id)}`);
      if(d.request){setSelected(d.request);setEvents(Array.isArray(d.events)?d.events:[]);saveSelected(d.request.id);}
      if(d.request?.status==="REQUESTED"){
        setMatchLoading(true); try{const m=await api(`/transport/match/${encodeURIComponent(id)}`);setMatches(Array.isArray(m.candidates)?m.candidates:[]);}catch{setMatches([]);}finally{setMatchLoading(false);}
      }else setMatches([]);
    }catch(e){if(!silent)setError(e.message||tx(language,"Unable to load transport request.","परिवहन रिक्वेस्ट लोड नहीं हो सकी।","రవాణా అభ్యర్థన లోడ్ కాలేదు."));}
    finally{if(!silent)setRefreshing(false);}
  },[api,language]);

  const loadAll = useCallback(async(silent=false)=>{
    if(!farmer?.id){setLoading(false);setError(tx(language,"Farmer account could not be loaded. Please login again.","किसान खाता लोड नहीं हो सका। कृपया फिर से लॉगिन करें।","రైతు ఖాతా లోడ్ కాలేదు. దయచేసి మళ్లీ లాగిన్ చేయండి."));return;}
    if(silent)setRefreshing(true); else setLoading(true);
    try{
      const [c,b,r]=await Promise.all([api("/centers"),api("/bookings"),api(`/transport/requests?farmerId=${encodeURIComponent(farmer.id)}`)]);
      const cs=(c.centers||[]).filter(x=>Number(x.active??1)===1), bs=(b.bookings||[]).filter(x=>String(x.farmer_id)===String(farmer.id)), rs=(r.requests||[]).filter(x=>String(x.farmer_id)===String(farmer.id));
      setCenters(cs);setBookings(bs);setRequests(rs);
      setForm(cur=>({...cur,centerId:cur.centerId||String(farmer.preferredCenterId||farmer.preferred_center_id||cs[0]?.id||""),crop:cur.crop||String(farmer.primaryCrop||farmer.primary_crop||"")}));
      if(rs.length){const q=clean(params.get("request"));const wanted=q||readSelected();const pick=rs.find(x=>String(x.id)===wanted)||rs.find(x=>!CLOSED.has(String(x.status||"").toUpperCase()))||rs[0];setSelected(pick);saveSelected(pick.id);}
      else {setSelected(null);setEvents([]);setMatches([]);}
      setError("");
    }catch(e){console.error("FarmerTransport load:",e);setError(e.message||tx(language,"Unable to load transport data.","परिवहन डेटा लोड नहीं हो सका।","రవాణా డేటా లోడ్ కాలేదు."));}
    finally{setLoading(false);setRefreshing(false);}
  },[api,farmer?.id,farmer?.preferredCenterId,farmer?.preferred_center_id,farmer?.primaryCrop,farmer?.primary_crop,language,params]);

  useEffect(()=>{loadAll(false);},[loadAll]);
  useEffect(()=>{const a=()=>setOnline(true),b=()=>setOnline(false);window.addEventListener("online",a);window.addEventListener("offline",b);return()=>{window.removeEventListener("online",a);window.removeEventListener("offline",b);};},[]);
  useEffect(()=>{const d=readDraft();if(!d?.form||d.farmerId&&String(d.farmerId)!==String(farmer?.id))return;if(d.updatedAt&&Date.now()-d.updatedAt>86400000)return;setForm(x=>({...x,...d.form}));setRestored(true);},[farmer?.id]);
  useEffect(()=>{if(!farmer?.id)return;if(skipDraftSaveRef.current){skipDraftSaveRef.current=false;return;}writeDraft({farmerId:farmer.id,form});},[farmer?.id,form]);
  useEffect(()=>{const id=clean(params.get("booking"));if(!id||!bookings.length)return;const b=bookings.find(x=>String(x.id)===id);if(!b)return;setForm(x=>({...x,bookingId:String(b.id),crop:b.crop||x.crop,quantityKg:String(b.actual_quantity??b.estimated_quantity??x.quantityKg),centerId:String(b.center_id||x.centerId),requestedDate:dateOk(b.date)?b.date:x.requestedDate,requestedSlotStart:b.slot_start||x.requestedSlotStart,requestedSlotEnd:b.slot_end||x.requestedSlotEnd}));setParams(x=>{x.delete("booking");return x;},{replace:true});},[bookings,params,setParams]);
  useEffect(()=>{if(!selected?.id)return;const t=setInterval(()=>{detail(selected.id,true);loadAll(true);},5000);return()=>clearInterval(t);},[detail,loadAll,selected?.id]);
  useEffect(()=>{if(selected?.id)setTab("status");},[selected?.id]);
  useEffect(()=>{setTracking(null);setRated(false);setRatingValue(0);setRatingReview("");setTransportPayment(null);setPaymentMethod("UPI");setPaymentReference("");},[selected?.id]);
  const loadTracking = useCallback(async(silent=true)=>{
    if(!selected?.id || !selected?.transporter_id){setTracking(null);return;}
    if(!silent)setTrackingLoading(true);
    try{const d=await api(`/transport/requests/${encodeURIComponent(selected.id)}/tracking`);setTracking(d.tracking||null);}
    catch(err){if(!silent)setError(err.message||tx(language,"Unable to load live tracking.","लाइव ट्रैकिंग लोड नहीं हो सकी।","లైవ్ ట్రాకింగ్ లోడ్ కాలేదు."));}
    finally{if(!silent)setTrackingLoading(false);}
  },[api,language,selected?.id,selected?.transporter_id]);

  const loadTransportPayment = useCallback(async(silent=true)=>{
    if(!selected?.id || String(selected.status||"").toUpperCase()!=="COMPLETED"){setTransportPayment(null);return;}
    try{
      const d=await api(`/transport/requests/${encodeURIComponent(selected.id)}/payment`);
      setTransportPayment(d.payment||null);
    }catch(err){
      if(!silent)setError(err.message||tx(language,"Unable to load transport payment.","परिवहन भुगतान लोड नहीं हो सका।","రవాణా చెల్లింపు లోడ్ కాలేదు."));
    }
  },[api,language,selected?.id,selected?.status]);

  useEffect(()=>{if(!selected?.id||!selected?.transporter_id||!['ASSIGNED','EN_ROUTE_TO_FARMER','CROP_PICKED_UP','EN_ROUTE_TO_CENTER','DELIVERED'].includes(String(selected.status||"").toUpperCase())){setTracking(null);return;}loadTracking(true);const t=setInterval(()=>loadTracking(true),5000);return()=>clearInterval(t);},[loadTracking,selected?.id,selected?.status,selected?.transporter_id]);

  useEffect(()=>{if(String(selected?.status||"").toUpperCase()!=="COMPLETED"){setTransportPayment(null);return;}loadTransportPayment(true);const t=setInterval(()=>loadTransportPayment(true),8000);return()=>clearInterval(t);},[loadTransportPayment,selected?.id,selected?.status]);

  const chooseBooking = useCallback(id=>{const b=activeBookings.find(x=>String(x.id)===String(id));if(!b){setForm(x=>({...x,bookingId:""}));return;}setForm(x=>({...x,bookingId:String(b.id),crop:b.crop||x.crop,quantityKg:String(b.actual_quantity??b.estimated_quantity??""),centerId:String(b.center_id||""),requestedDate:dateOk(b.date)?b.date:today(),requestedSlotStart:b.slot_start||"",requestedSlotEnd:b.slot_end||""}));setInfo(tx(language,"Booking details copied into transport request.","बुकिंग विवरण परिवहन रिक्वेस्ट में कॉपी हो गया।","బుకింగ్ వివరాలు రవాణా అభ్యర్థనలోకి కాపీ అయ్యాయి."));},[activeBookings,language]);

  const locate = useCallback(()=>{if(!navigator.geolocation){setError(tx(language,"Location is not supported here.","यहां लोकेशन उपलब्ध नहीं है।","ఇక్కడ లొకేషన్ అందుబాటులో లేదు."));return;}navigator.geolocation.getCurrentPosition(p=>{setForm(x=>({...x,pickupLat:String(p.coords.latitude),pickupLng:String(p.coords.longitude)}));setInfo(tx(language,"Pickup GPS captured for smarter matching.","पिकअप GPS मिल गया है। इससे बेहतर मैचिंग होगी।","పికప్ GPS నమోదు అయింది. మెరుగైన మ్యాచింగ్‌కు ఇది సహాయపడుతుంది."));},e=>setError(e.code===1?tx(language,"Location permission was denied; enter the pickup address manually.","लोकेशन अनुमति नहीं मिली; पिकअप पता मैन्युअली दर्ज करें।","లొకేషన్ అనుమతి ఇవ్వలేదు; పికప్ చిరునామాను మాన్యువల్‌గా నమోదు చేయండి."):tx(language,"Unable to read your current location.","वर्तमान लोकेशन नहीं मिल सकी।","ప్రస్తుత లొకేషన్ పొందలేకపోయాము.")),{enableHighAccuracy:true,timeout:12000,maximumAge:30000});},[language]);

  const validate = useCallback(()=>{if(!farmer?.id)return tx(language,"Please login again.","कृपया फिर से लॉगिन करें।","దయచేసి మళ్లీ లాగిన్ చేయండి.");if(!form.crop)return tx(language,"Select a crop.","फसल चुनें।","పంట ఎంచుకోండి.");if(!(Number(form.quantityKg)>0))return tx(language,"Enter a valid quantity.","सही मात्रा दर्ज करें।","సరైన పరిమాణం నమోదు చేయండి.");if(!center)return tx(language,"Select a procurement center.","खरीद केंद्र चुनें।","కొనుగోలు కేంద్రాన్ని ఎంచుకోండి.");if(!clean(form.pickupAddress))return tx(language,"Enter the pickup address.","पिकअप पता दर्ज करें।","పికప్ చిరునామా నమోదు చేయండి.");if(form.timingMode==="scheduled"&&(!dateOk(form.requestedDate)||mins(form.requestedSlotStart)==null||mins(form.requestedSlotEnd)==null||mins(form.requestedSlotEnd)<=mins(form.requestedSlotStart)))return tx(language,"Choose a valid pickup date and time window.","सही पिकअप तारीख और समय चुनें।","సరైన పికప్ తేదీ మరియు సమయం ఎంచుకోండి.");if((form.pickupLat&&!form.pickupLng)||(!form.pickupLat&&form.pickupLng))return tx(language,"Enter both GPS coordinates or clear both.","दोनों GPS वैल्यू दें या दोनों खाली करें।","రెండు GPS విలువలు ఇవ్వండి లేదా రెండింటినీ ఖాళీ చేయండి.");if(!(Number(form.estimatedFare)>=100))return tx(language,"Minimum estimated fare is ₹100.","न्यूनतम अनुमानित किराया ₹100 है।","కనీస అంచనా ఛార్జీ ₹100.");return "";},[center,farmer?.id,form,language]);

  const submit = useCallback(async(e)=>{e.preventDefault();setError("");setInfo("");setSuccess("");const v=validate();if(v){setError(v);return;}if(!online){setError(tx(language,"You are offline. Your draft is saved on this device.","आप ऑफलाइन हैं। ड्राफ्ट इस डिवाइस पर सेव है।","మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. డ్రాఫ్ట్ ఈ డివైస్‌లో సేవ్ అయింది."));return;}setSubmitting(true);try{const d=await api("/transport/requests",{method:"POST",body:JSON.stringify({farmerId:farmer.id,phone:farmer.phone||"",bookingId:form.bookingId||"",centerId:form.centerId,crop:form.crop,quantityKg:Number(form.quantityKg),pickupAddress:clean(form.pickupAddress),pickupLat:form.pickupLat?Number(form.pickupLat):null,pickupLng:form.pickupLng?Number(form.pickupLng):null,pickupNote:clean(form.pickupNote),requestedDate:form.timingMode==="scheduled"?form.requestedDate:"",requestedSlotStart:form.timingMode==="scheduled"?clean(form.requestedSlotStart):"",requestedSlotEnd:form.timingMode==="scheduled"?clean(form.requestedSlotEnd):"",estimatedFare:form.estimatedFare===""?null:Number(form.estimatedFare),notes:clean(form.notes)})});clearDraft();setRestored(false);setSuccess(d.message||tx(language,"Transport request created.","परिवहन रिक्वेस्ट बन गई है।","రవాణా అభ్యర్థన సృష్టించబడింది."));if(d.request){setSelected(d.request);setEvents(Array.isArray(d.events)?d.events:[{status:"REQUESTED",actor_type:"FARMER",actor_id:farmer.id,created_at:d.request.created_at,note:"Transport request created."}]);setMatches(Array.isArray(d.candidates)?d.candidates:[]);saveSelected(d.request.id);setTab("status");setParams(x=>{x.set("request",String(d.request.id));return x;},{replace:true});}await loadAll(true);}catch(err){setError(err.message||tx(language,"Unable to create transport request.","परिवहन रिक्वेस्ट नहीं बन सकी।","రవాణా అభ్యర్థన సృష్టించలేకపోయాము."));}finally{setSubmitting(false);}},[api,farmer?.id,farmer?.phone,form,language,loadAll,online,setParams,validate]);

  const openRequest = useCallback(async r=>{if(!r?.id)return;setSelected(r);setTab("status");saveSelected(r.id);setParams(x=>{x.set("request",String(r.id));return x;},{replace:true});await detail(r.id,false);},[detail,setParams]);
  const cancel = useCallback(async()=>{if(!cancelTarget?.id)return;try{const d=await api(`/transport/requests/${encodeURIComponent(cancelTarget.id)}/cancel`,{method:"PATCH",body:JSON.stringify({farmerId:farmer?.id||"",phone:farmer?.phone||"",reason:clean(cancelReason)||"Cancelled by farmer."})});setCancelTarget(null);setCancelReason("");setSuccess(d.message||tx(language,"Transport request cancelled.","परिवहन रिक्वेस्ट रद्द कर दी गई है।","రవాణా అభ్యర్థన రద్దు చేయబడింది."));await loadAll(true);await detail(cancelTarget.id,false);}catch(err){setError(err.message||tx(language,"Unable to cancel this request.","रिक्वेस्ट रद्द नहीं हो सकी।","అభ్యర్థన రద్దు చేయలేకపోయాము."));}},[api,cancelReason,cancelTarget,farmer?.id,farmer?.phone,language,loadAll,detail]);
  const refreshMatches = useCallback(async()=>{if(selected?.status!=="REQUESTED")return;setMatchLoading(true);try{const d=await api(`/transport/match/${encodeURIComponent(selected.id)}`);setMatches(d.candidates||[]);if(d.request)setSelected(d.request);}catch(err){setError(err.message||"Unable to refresh matches.");}finally{setMatchLoading(false);}},[api,selected]);
  const copyId = useCallback(async()=>{if(!selected?.id)return;try{await navigator.clipboard.writeText(String(selected.id));setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{}},[selected?.id]);
  const share = useCallback(async()=>{if(!selected)return;const s=["KrishiSetu Transport Request",`Request: ${selected.id}`,`Crop: ${cropLabel(selected.crop,crops,"en")}`,`Quantity: ${Number(selected.quantity_kg||0).toLocaleString("en-IN")} kg`,`Pickup: ${selected.pickup_address||"—"}`,`Center: ${selected.center_name||selected.center_id||"—"}`,`Status: ${statusLabel(selected.status,"en")}`].join("\n");try{if(navigator.share){await navigator.share({title:"KrishiSetu Transport Request",text:s});}else{await navigator.clipboard.writeText(s);setCopied(true);setTimeout(()=>setCopied(false),1600);}}catch{}},[crops,selected]);
  const maps = useCallback((lat,lng,address="")=>{const q=Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))?`${lat},${lng}`:address;if(q)window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,"_blank","noopener,noreferrer");},[]);

  const canEdit = useCallback(r=>["REQUESTED","ASSIGNED"].includes(String(r?.status||"").toUpperCase()),[]);
  const canCancel = useCallback(r=>["REQUESTED","ASSIGNED","EN_ROUTE_TO_FARMER"].includes(String(r?.status||"").toUpperCase()),[]);

  const beginEdit = useCallback(r=>{
    if(!r || !canEdit(r)) return;
    setEditTarget(r);
    setEditForm({
      quantityKg:String(r.quantity_kg??""),
      pickupAddress:String(r.pickup_address??""),
      requestedDate:String(r.requested_date??""),
      requestedSlotStart:String(r.requested_slot_start??""),
      requestedSlotEnd:String(r.requested_slot_end??""),
      pickupNote:String(r.pickup_note??""),
      notes:String(r.notes??"")
    });
    setError(""); setInfo(""); setSuccess("");
  },[canEdit]);

  const editField = useCallback((key,value)=>setEditForm(x=>({...x,[key]:value})),[]);

  const updateRequest = useCallback(async e=>{
    e.preventDefault();
    if(!editTarget?.id) return;
    setEditSaving(true); setError(""); setSuccess("");
    const qty=Number(editForm.quantityKg);
    const start=mins(editForm.requestedSlotStart), end=mins(editForm.requestedSlotEnd);
    if(!(qty>0)){setEditSaving(false);setError(tx(language,"Enter a valid quantity.","सही मात्रा दर्ज करें।","సరైన పరిమాణం నమోదు చేయండి."));return;}
    if(!clean(editForm.pickupAddress)){setEditSaving(false);setError(tx(language,"Enter the pickup address.","पिकअप पता दर्ज करें।","పికప్ చిరునామా నమోదు చేయండి."));return;}
    if(!dateOk(editForm.requestedDate)){setEditSaving(false);setError(tx(language,"Choose a valid pickup date.","सही पिकअप तारीख चुनें।","సరైన పికప్ తేదీ ఎంచుకోండి."));return;}
    if(start==null || end==null || end<=start){setEditSaving(false);setError(tx(language,"Choose a valid pickup time window.","सही पिकअप समय विंडो चुनें।","సరైన పికప్ సమయ విండో ఎంచుకోండి."));return;}
    if(!online){setEditSaving(false);setError(tx(language,"You are offline. Editing needs a live connection.","आप ऑफलाइन हैं। एडिट करने के लिए इंटरनेट कनेक्शन चाहिए।","మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. ఎడిట్ చేయడానికి ఇంటర్నెట్ అవసరం."));return;}
    try{
      const d=await api(`/transport/requests/${encodeURIComponent(editTarget.id)}`,{method:"PATCH",body:JSON.stringify({quantityKg:qty,pickupAddress:clean(editForm.pickupAddress),requestedDate:editForm.requestedDate,requestedSlotStart:clean(editForm.requestedSlotStart),requestedSlotEnd:clean(editForm.requestedSlotEnd),pickupNote:clean(editForm.pickupNote),notes:clean(editForm.notes)})});
      setEditTarget(null); setSuccess(d.message||tx(language,"Transport request updated successfully.","परिवहन रिक्वेस्ट अपडेट हो गई है।","రవాణా అభ్యర్థన విజయవంతంగా నవీకరించబడింది."));
      await loadAll(true); await detail(editTarget.id,false);
    }catch(err){setError(err.message||tx(language,"Unable to update this transport request.","परिवहन रिक्वेस्ट अपडेट नहीं हो सकी।","రవాణా అభ్యర్థనను నవీకరించలేకపోయాము."));}
    finally{setEditSaving(false);}
  },[api,detail,editForm,editTarget,language,loadAll,online]);

  const distanceKm = useMemo(()=>{
    const aLat=Number(tracking?.lat),aLng=Number(tracking?.lng),pLat=Number(tracking?.pickupLat),pLng=Number(tracking?.pickupLng);
    if([aLat,aLng,pLat,pLng].some(Number.isNaN)) return null;
    const R=6371, r=x=>x*Math.PI/180, dLat=r(pLat-aLat), dLng=r(pLng-aLng);
    const h=Math.sin(dLat/2)**2+Math.cos(r(aLat))*Math.cos(r(pLat))*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
  },[tracking]);

  const etaMinutes = useMemo(()=>{
    if(distanceKm==null) return null;
    const speed = String(selected?.status||"").toUpperCase()==="EN_ROUTE_TO_CENTER" ? 30 : 25;
    return Math.max(1,Math.round((distanceKm/speed)*60));
  },[distanceKm,selected?.status]);

  const submitRating = useCallback(async()=>{
    if(!selected?.id || ratingValue<1 || !farmer?.id) return;
    setRatingSaving(true);setError("");
    try{
      const d=await api(`/transport/requests/${encodeURIComponent(selected.id)}/rating`,{
        method:"POST",
        body:JSON.stringify({
          farmerId:farmer.id,
          phone:farmer.phone||"",
          rating:ratingValue,
          review:clean(ratingReview)
        })
      });
      setRated(true);
      setSuccess(d.message||tx(language,"Thanks for rating your transporter.","ट्रांसपोर्टर को रेट करने के लिए धन्यवाद।","ట్రాన్స్‌పోర్టర్‌కు రేటింగ్ ఇచ్చినందుకు ధన్యవాదాలు."));
    }catch(err){setError(err.message||tx(language,"Unable to save the rating.","रेटिंग सेव नहीं हो सकी।","రేటింగ్ సేవ్ కాలేదు."));}
    finally{setRatingSaving(false);}
  },[api,farmer?.id,farmer?.phone,language,ratingReview,ratingValue,selected?.id]);

  const submitTransportPayment = useCallback(async()=>{
    if(!selected?.id || String(selected.status||"").toUpperCase()!=="COMPLETED") return;
    const method=clean(paymentMethod).toUpperCase();
    const reference=clean(paymentReference);
    if(!["UPI","BANK_TRANSFER","CASH"].includes(method)){
      setError(tx(language,"Choose a payment method.","भुगतान का तरीका चुनें।","చెల్లింపు విధానాన్ని ఎంచుకోండి."));
      return;
    }
    if(method!=="CASH" && !reference){
      setError(tx(language,"Enter the payment reference for a digital payment.","डिजिटल भुगतान के लिए पेमेंट रेफरेंस दर्ज करें।","డిజిటల్ చెల్లింపుకు రిఫరెన్స్ నమోదు చేయండి."));
      return;
    }
    setPaymentSaving(true);setError("");
    try{
      const d=await api(`/transport/requests/${encodeURIComponent(selected.id)}/payment`,{
        method:"POST",
        body:JSON.stringify({farmerId:farmer?.id||"",phone:farmer?.phone||"",method,reference})
      });
      setTransportPayment(d.payment||null);
      setPaymentReference("");
      setSuccess(d.message||tx(language,"Transport fare payment recorded successfully.","परिवहन किराया भुगतान सफलतापूर्वक दर्ज हो गया।","రవాణా ఛార్జీ చెల్లింపు విజయవంతంగా నమోదు అయింది."));
      await loadAll(true);
      await detail(selected.id,true);
      await loadTransportPayment(true);
    }catch(err){setError(err.message||tx(language,"Unable to record the transport payment.","परिवहन भुगतान दर्ज नहीं हो सका।","రవాణా చెల్లింపు నమోదు కాలేదు."));}
    finally{setPaymentSaving(false);}
  },[api,detail,farmer?.id,farmer?.phone,language,loadAll,loadTransportPayment,paymentMethod,paymentReference,selected?.id,selected?.status]);

  const clearForm = useCallback(()=>{skipDraftSaveRef.current=true;clearDraft();setForm({bookingId:"",timingMode:"scheduled",crop:farmer?.primaryCrop||farmer?.primary_crop||"",quantityKg:"",centerId:farmer?.preferredCenterId||farmer?.preferred_center_id||centers[0]?.id||"",pickupAddress:"",pickupLat:"",pickupLng:"",pickupNote:"",requestedDate:today(),requestedSlotStart:"",requestedSlotEnd:"",estimatedFare:"",notes:""});setRestored(false);setError("");setInfo("");},[centers,farmer?.preferredCenterId,farmer?.preferred_center_id,farmer?.primaryCrop,farmer?.primary_crop]);

  if(loading)return <><Header/><style>{styles}</style><main className="ft-shell ft-center"><div className="ft-loading"><LoaderCircle className="ft-spin" size={32}/><span>KRISHISETU LOGISTICS</span><h1>{tx(language,"Loading transport workspace","परिवहन वर्कस्पेस लोड हो रहा है","రవాణా వర్క్‌స్పేస్ లోడ్ అవుతోంది")}</h1><p>{tx(language,"Connecting your bookings and transport requests.","आपकी बुकिंग और परिवहन रिक्वेस्ट से कनेक्ट हो रहा है।","మీ బుకింగ్‌లు మరియు రవాణా అభ్యర్థనలకు కనెక్ట్ అవుతోంది.")}</p></div></main></>;

  return <div className="farmer-transport-page"><Header/><style>{styles}</style><main className="ft-shell">
    <div className="ft-head"><div><Link to="/farmer/home" className="ft-back"><ArrowLeft size={16}/>{tx(language,"Back to Home","होम पर वापस","హోమ్‌కు తిరిగి వెళ్లండి")}</Link><span className="ft-eyebrow">{tx(language,"FARMER LOGISTICS","किसान परिवहन","రైతు రవాణా")}</span><h1>{tx(language,"Move your crop without the guesswork.","अपनी फसल का परिवहन आसानी से करें।","మీ పంట రవాణాను సులభంగా నిర్వహించండి.")}</h1><p>{tx(language,"Request a vehicle, get smart matching, and track the journey from pickup to procurement center.","वाहन रिक्वेस्ट करें, स्मार्ट मैचिंग पाएं और पिकअप से खरीद केंद्र तक यात्रा ट्रैक करें।","వాహనం అభ్యర్థించండి, స్మార్ట్ మ్యాచ్ పొందండి మరియు పికప్ నుంచి కొనుగోలు కేంద్రం వరకు ప్రయాణాన్ని ట్రాక్ చేయండి.")}</p></div><div className="ft-head-actions"><span className={`ft-online ${online?"on":"off"}`}><i/>{online?tx(language,"Online","ऑनलाइन","ఆన్‌లైన్"):tx(language,"Offline draft","ऑफलाइन ड्राफ्ट","ఆఫ్‌లైన్ డ్రాఫ్ట్")}</span><button className="ft-btn ft-light" type="button" onClick={()=>loadAll(true)} disabled={refreshing}><RefreshCw className={refreshing?"ft-spin":""} size={16}/>{tx(language,"Refresh","रिफ्रेश","రిఫ్రెష్")}</button></div></div>
    {(error||info||success||restored)&&<div className="ft-alerts">{error&&<div className="ft-alert err"><AlertCircle size={17}/><span>{error}</span><button onClick={()=>setError("")}>×</button></div>}{info&&<div className="ft-alert inf"><Info size={17}/><span>{info}</span><button onClick={()=>setInfo("")}>×</button></div>}{success&&<div className="ft-alert ok"><CheckCircle2 size={17}/><span>{success}</span><button onClick={()=>setSuccess("")}>×</button></div>}{restored&&<div className="ft-alert draft"><FileText size={17}/><span>{tx(language,"Your previous transport draft was restored on this device.","पिछला परिवहन ड्राफ्ट इस डिवाइस पर रीस्टोर हुआ।","మీ మునుపటి రవాణా డ్రాఫ్ట్ ఈ డివైస్‌లో పునరుద్ధరించబడింది.")}</span><button onClick={()=>setRestored(false)}>×</button></div>}</div>}
    <div className="ft-features"><div><Truck size={19}/><b>{tx(language,"Smart matching","स्मार्ट मैचिंग","స్మార్ట్ మ్యాచింగ్")}</b><span>{tx(language,"Capacity + distance aware","क्षमता + दूरी","సామర్థ్యం + దూరం")}</span></div><div><LocateFixed size={19}/><b>{tx(language,"Pickup GPS","पिकअप GPS","పికప్ GPS")}</b><span>{tx(language,"Optional, improves matching","वैकल्पिक, मैचिंग बेहतर","ఐచ్ఛికం, మ్యాచింగ్ మెరుగ్గా")}</span></div><div><Navigation size={19}/><b>{tx(language,"Live trip status","लाइव ट्रिप स्थिति","లైవ్ ట్రిప్ స్థితి")}</b><span>{tx(language,"Refreshes automatically","ऑटो रिफ्रेश","ఆటో రిఫ్రెష్")}</span></div></div>
    <div className="ft-grid"><section>
      <div className="ft-tabs"><button className={tab==="request"?"sel":""} onClick={()=>setTab("request")}><Truck size={16}/>{tx(language,"Request vehicle","वाहन रिक्वेस्ट","వాహనం అభ్యర్థించండి")}</button><button className={tab==="status"?"sel":""} onClick={()=>setTab("status")}><Navigation size={16}/>{tx(language,"Active trip","सक्रिय यात्रा","యాక్టివ్ ట్రిప్")} {activeRequests.length>0&&<em>{activeRequests.length}</em>}</button><button className={tab==="history"?"sel":""} onClick={()=>setTab("history")}><History size={16}/>{tx(language,"History","इतिहास","చరిత్ర")}</button></div>
      {tab==="request"&&<form className="ft-card" onSubmit={submit}><div className="ft-card-head"><div><span>STEP 1</span><h2>{tx(language,"Request transport","परिवहन रिक्वेस्ट करें","రవాణా అభ్యర్థించండి")}</h2><p>{tx(language,"Link a booking or create a standalone transport request.","बुकिंग लिंक करें या नई परिवहन रिक्वेस्ट बनाएं।","బుకింగ్‌ను లింక్ చేయండి లేదా కొత్త రవాణా అభ్యర్థన సృష్టించండి.")}</p></div><ShieldCheck size={22}/></div>
        <div className="ft-section"><div className="ft-sec-title"><b>01</b><div><strong>{tx(language,"Procurement booking","खरीद बुकिंग","కొనుగోలు బుకింగ్")}</strong><span>{tx(language,"Optional, but recommended","वैकल्पिक, लेकिन बेहतर","ఐచ్ఛికం, కానీ సిఫార్సు")}</span></div></div><div className="ft-picker"><div className="ft-select"><select value={form.bookingId} onChange={e=>chooseBooking(e.target.value)}><option value="">{tx(language,"Create without booking","बिना बुकिंग के बनाएं","బుకింగ్ లేకుండా సృష్టించండి")}</option>{activeBookings.map(b=><option key={b.id} value={b.id}>#{b.token||b.id} · {cropLabel(b.crop,crops,language)} · {Number(b.actual_quantity??b.estimated_quantity??0).toLocaleString("en-IN")} kg · {fmtDate(b.date,language)}</option>)}</select><ChevronDown size={16}/></div><Link to="/farmer/book" className="ft-link"><CalendarDays size={15}/>{tx(language,"Open booking","बुकिंग खोलें","బుకింగ్ తెరవండి")}</Link></div></div>
        <div className="ft-section"><div className="ft-sec-title"><b>02</b><div><strong>{tx(language,"Cargo details","फसल का विवरण","పంట వివరాలు")}</strong><span>{tx(language,"Used to match vehicle capacity","गाड़ी की क्षमता मिलाने के लिए","వాహన సామర్థ్యం మ్యాచ్ చేయడానికి")}</span></div></div><div className="ft-two"><label className="ft-field"><span>{tx(language,"Crop / produce","फसल / उपज","పంట / ఉత్పత్తి")}</span><div className="ft-icon-input"><Leaf size={16}/><select value={form.crop} onChange={e=>setField("crop",e.target.value)}><option value="">{tx(language,"Select crop","फसल चुनें","పంట ఎంచుకోండి")}</option>{crops.map(c=><option key={c.id} value={c.id}>{cropLabel(c.id,crops,language)}</option>)}</select></div></label><label className="ft-field"><span>{tx(language,"Quantity","मात्रा","పరిమాణం")}</span><div className="ft-suffix"><input inputMode="decimal" value={form.quantityKg} onChange={e=>setField("quantityKg",e.target.value.replace(/[^0-9.]/g,""))} placeholder="e.g. 250"/><b>kg</b></div></label></div><div className="ft-note"><Gauge size={16}/>{tx(language,"Only online vehicles with enough capacity will qualify for smart matching.","पर्याप्त क्षमता वाली ऑनलाइन गाड़ियां ही स्मार्ट मैचिंग में आएंगी।","తగిన సామర్థ్యం ఉన్న ఆన్‌లైన్ వాహనాలే స్మార్ట్ మ్యాచింగ్‌లో కనిపిస్తాయి.")}</div></div>
        <div className="ft-section"><div className="ft-sec-title"><b>03</b><div><strong>{tx(language,"Destination","गंतव्य","గమ్యం")}</strong><span>{tx(language,"Where the crop will be delivered","फसल कहाँ पहुंचेगी","పంట ఎక్కడికి చేరాలి")}</span></div></div><label className="ft-field"><span>{tx(language,"Procurement center","खरीद केंद्र","కొనుగోలు కేంద్రం")}</span><div className="ft-icon-input"><MapPin size={16}/><select value={form.centerId} onChange={e=>setField("centerId",e.target.value)}><option value="">{tx(language,"Select center","केंद्र चुनें","కేంద్రాన్ని ఎంచుకోండి")}</option>{centers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></label>{center&&<div className="ft-destination"><MapPin size={18}/><div><b>{center.name}</b><span>{center.address||"—"}</span></div><button type="button" onClick={()=>maps(null,null,center.address||center.name)}><Navigation size={14}/>Map</button></div>}</div>
        <div className="ft-section"><div className="ft-sec-title"><b>04</b><div><strong>{tx(language,"Pickup location","पिकअप स्थान","పికప్ ప్రదేశం")}</strong><span>{tx(language,"Where the vehicle should collect the crop","जहां से फसल उठानी है","వాహనం పంటను తీసుకోవాల్సిన ప్రదేశం")}</span></div></div><label className="ft-field"><span>{tx(language,"Pickup address","पिकअप पता","పికప్ చిరునామా")}</span><textarea rows="3" value={form.pickupAddress} onChange={e=>setField("pickupAddress",e.target.value)} placeholder={tx(language,"Farm / village / road / landmark","खेत / गांव / सड़क / लैंडमार्क","పొలం / గ్రామం / రోడ్ / ల్యాండ్‌మార్క్")}/></label><div className="ft-loc-actions"><button type="button" className="ft-btn ft-light" onClick={locate}><Crosshair size={16}/>{tx(language,"Use my location","मेरी लोकेशन लें","నా లొకేషన్ ఉపయోగించండి")}</button><button type="button" className={`ft-gps ${pickupReady?"ready":""}`} onClick={()=>setLocationOpen(x=>!x)}><LocateFixed size={16}/>{pickupReady?`${Number(form.pickupLat).toFixed(5)}, ${Number(form.pickupLng).toFixed(5)}`:tx(language,"GPS optional","GPS वैकल्पिक","GPS ఐచ్ఛికం")}<ChevronDown size={14}/></button></div>{locationOpen&&<div className="ft-gps-box"><div className="ft-two"><label className="ft-field"><span>Latitude</span><input value={form.pickupLat} onChange={e=>setField("pickupLat",e.target.value)}/></label><label className="ft-field"><span>Longitude</span><input value={form.pickupLng} onChange={e=>setField("pickupLng",e.target.value)}/></label></div>{pickupReady&&<button type="button" className="ft-link-btn" onClick={()=>maps(form.pickupLat,form.pickupLng)}><Navigation size={14}/>Open pickup in Maps</button>}</div>}<label className="ft-field"><span>{tx(language,"Pickup note","पिकअप नोट","పికప్ నోట్")}</span><input value={form.pickupNote} onChange={e=>setField("pickupNote",e.target.value)} placeholder={tx(language,"Gate / landmark / loading note","गेट / लैंडमार्क / लोडिंग नोट","గేట్ / ల్యాండ్‌మార్క్ / లోడింగ్ నోట్")}/></label></div>
        <div className="ft-section"><div className="ft-sec-title"><b>05</b><div><strong>{tx(language,"Timing","समय","సమయం")}</strong><span>{tx(language,"Scheduled or ASAP","शेड्यूल या जल्द से जल्द","షెడ్యూల్ లేదా వీలైనంత త్వరగా")}</span></div></div><div className="ft-toggle"><button type="button" className={form.timingMode==="scheduled"?"sel":""} onClick={()=>setField("timingMode","scheduled")}><CalendarDays size={15}/>Schedule</button><button type="button" className={form.timingMode==="asap"?"sel":""} onClick={()=>setField("timingMode","asap")}><Zap size={15}/>ASAP</button></div>{form.timingMode==="scheduled"&&<><div className="ft-two"><label className="ft-field"><span>{tx(language,"Pickup date","पिकअप तारीख","పికప్ తేదీ")}</span><div className="ft-icon-input"><CalendarDays size={16}/><input type="date" min={today()} max={maxDate()} value={form.requestedDate} onChange={e=>setField("requestedDate",e.target.value)}/></div></label><div className="ft-field"><span>{tx(language,"Pickup window","पिकअप विंडो","పికప్ విండో")}</span><div className="ft-time"><label><Clock3 size={15}/><input value={form.requestedSlotStart} onChange={e=>setField("requestedSlotStart",e.target.value)} placeholder="08:00"/></label><b>—</b><label><Clock3 size={15}/><input value={form.requestedSlotEnd} onChange={e=>setField("requestedSlotEnd",e.target.value)} placeholder="08:30"/></label></div></div></div>{slotOptions.length>0&&<div className="ft-slots">{slotOptions.slice(0,10).map(s=><button type="button" key={s.start} className={form.requestedSlotStart===s.start&&form.requestedSlotEnd===s.end?"sel":""} onClick={()=>{setField("requestedSlotStart",s.start);setField("requestedSlotEnd",s.end);}}>{fmtTime(s.start)} – {fmtTime(s.end)}</button>)}</div>}</>}</div>
        <div className="ft-section"><div className="ft-sec-title"><b>06</b><div><strong>{tx(language,"Trip details","यात्रा विवरण","ట్రిప్ వివరాలు")}</strong><span>{tx(language,"Optional dispatch notes","वैकल्पिक डिस्पैच जानकारी","ఐచ్ఛిక డిస్పాచ్ సమాచారం")}</span></div></div><div className="ft-two"><label className="ft-field ft-fare-input"><span>{tx(language,"Estimated fare (₹100 min)","अनुमानित किराया (वैकल्पिक)","అంచనా ఛార్జీ (ఐచ్ఛికం)")}</span><div className="ft-suffix"><input inputMode="decimal" min="0" value={form.estimatedFare} onChange={e=>setField("estimatedFare",e.target.value.replace(/[^0-9.]/g,""))} placeholder={tx(language,"Enter at least 100","पता न हो तो खाली छोड़ें","తెలియకపోతే ఖాళీగా ఉంచండి")}/><b>₹</b></div><small className="ft-field-help">{tx(language,"Enter 0 or leave blank when you do not know the cost. This is only an estimate; the transporter must confirm the final fare later.","लागत पता न हो तो 0 या खाली छोड़ें। यह केवल अनुमान है; अंतिम किराया बाद में ट्रांसपोर्टर तय करेगा।","ధర తెలియకపోతే 0 లేదా ఖాళీగా ఉంచండి. ఇది కేవలం అంచనా; తుది ఛార్జీని తర్వాత ట్రాన్స్‌పోర్టర్ నిర్ధారించాలి.")}</small></label><label className="ft-field"><span>{tx(language,"Extra notes","अतिरिक्त नोट","అదనపు నోట్")}</span><input value={form.notes} onChange={e=>setField("notes",e.target.value)} placeholder={tx(language,"Special handling request","विशेष हैंडलिंग","ప్రత్యేక హ్యాండ్లింగ్")}/></label></div></div>
        <div className="ft-footer"><span><FileText size={15}/>{tx(language,"Draft saved automatically on this device","ड्राफ्ट इस डिवाइस पर अपने आप सेव होता है","డ్రాఫ్ట్ ఈ డివైస్‌లో ఆటోమేటిక్‌గా సేవ్ అవుతుంది")}</span><div><button className="ft-btn ft-light" type="button" onClick={clearForm}><X size={15}/>Clear</button><button className="ft-btn ft-primary" type="submit" disabled={submitting||!online}>{submitting?<LoaderCircle className="ft-spin" size={16}/>:<Truck size={16}/>} {submitting?"Creating…":tx(language,"Request transport","परिवहन रिक्वेस्ट करें","రవాణా అభ్యర్థించండి")} {!submitting&&<ArrowRight size={16}/>}</button></div></div>
      </form>}

      {tab==="status"&&<section className="ft-card ft-status">{!selected?<div className="ft-empty"><Truck size={30}/><h2>{tx(language,"No transport request selected","कोई परिवहन रिक्वेस्ट नहीं चुनी गई","రవాణా అభ్యర్థన ఎంచుకోలేదు")}</h2><p>{tx(language,"Create a request or select one from the list.","नई रिक्वेस्ट बनाएं या सूची से चुनें।","కొత్త అభ్యర్థనను సృష్టించండి లేదా జాబితా నుంచి ఎంచుకోండి.")}</p><button className="ft-btn ft-primary" type="button" onClick={()=>setTab("request")}><Truck size={16}/>Request vehicle</button></div>:<><div className="ft-card-head"><div><span>TRANSPORT REQUEST</span><button className="ft-id" type="button" onClick={copyId}><Copy size={13}/>{copied?"Copied":selected.id}</button><h2>{statusLabel(selected.status,language)}</h2><p>{statusMessage(selected.status,language)}</p></div><div className={`ft-status status-${String(selected.status).toLowerCase()}`}>{(()=>{const I=statusIcon(selected.status);return <I size={15}/>})()}{statusLabel(selected.status,language)}</div></div><div className="ft-actions"><button className="ft-btn ft-light" type="button" onClick={()=>detail(selected.id,false)} disabled={refreshing}><RefreshCw className={refreshing?"ft-spin":""} size={15}/>Refresh</button><button className="ft-btn ft-light" type="button" onClick={share}><Share2 size={15}/>Share</button><button className="ft-btn ft-light" type="button" onClick={()=>maps(selected.pickup_lat,selected.pickup_lng,selected.pickup_address)}><Navigation size={15}/>Pickup map</button>{canEdit(selected)&&<button className="ft-btn ft-light" type="button" onClick={()=>beginEdit(selected)}><Pencil size={15}/>Edit</button>}{canCancel(selected)&&<button className="ft-btn ft-danger" type="button" onClick={()=>setCancelTarget(selected)}><X size={15}/>Cancel</button>}</div><div className="ft-summary"><div><small>Crop</small><b>{cropLabel(selected.crop,crops,language)}</b></div><div><small>Quantity</small><b>{Number(selected.quantity_kg||0).toLocaleString("en-IN")} kg</b></div><div><small>Center</small><b>{selected.center_name||selected.center_id||"—"}</b></div><div><small>Pickup</small><b>{selected.pickup_address||"—"}</b></div></div>{selected.requested_date&&<div className="ft-schedule"><CalendarDays size={16}/><b>{fmtDate(selected.requested_date,language)}</b><Clock3 size={16}/><b>{selected.requested_slot_start&&selected.requested_slot_end?`${fmtTime(selected.requested_slot_start)} – ${fmtTime(selected.requested_slot_end)}`:"Flexible"}</b></div>}{["ASSIGNED","EN_ROUTE_TO_FARMER"].includes(String(selected.status||"").toUpperCase())&&!(Number(selected.final_fare??selected.actual_fare)>0)&&<div className="ft-fare-notice"><Info size={16}/><div><b>{tx(language,"Fare not fixed yet","किराया अभी तय नहीं हुआ है","ఛార్జీ ఇంకా నిర్ణయించలేదు")}</b><span>{tx(language,"The transporter has accepted the request, but no positive final fare is recorded yet. You can cancel before the crop is picked up if the fare is not acceptable.","ट्रांसपोर्टर ने रिक्वेस्ट स्वीकार कर ली है, लेकिन अभी सकारात्मक अंतिम किराया दर्ज नहीं है। फसल उठाए जाने से पहले किराया स्वीकार्य न होने पर आप रद्द कर सकते हैं।","ట్రాన్స్‌పోర్టర్ అభ్యర్థనను అంగీకరించారు, కానీ ఇంకా సానుకూల తుది ఛార్జీ నమోదు కాలేదు. పంట తీసుకునే ముందు ఛార్జీ సరిపోకపోతే మీరు రద్దు చేయవచ్చు.")}</span></div></div>}<div className="ft-timeline">{FLOW.map((s,i)=>{const I=statusIcon(s),hit=rank>=i,current=selected.status===s,ev=[...events].reverse().find(x=>String(x.status||"").toUpperCase()===s);return <div className={`ft-tline ${hit?"hit":""} ${current?"current":""}`} key={s}><div className="ft-ticon"><I size={14}/></div><div><b>{statusLabel(s,language)}</b><span>{fmtDateTime(ev?.created_at||selected.created_at,language)}</span>{ev?.note&&<small>{ev.note}</small>}</div></div>})}{selected.status==="CANCELLED"&&<div className="ft-tline cancelled"><div className="ft-ticon"><X size={14}/></div><div><b>{statusLabel("CANCELLED",language)}</b><span>{fmtDateTime(selected.updated_at,language)}</span></div></div>}</div>{selected.transporter_id&&<div className="ft-transport-stack">
  <div className="ft-transporter"><div className="ft-avatar"><Truck size={22}/></div><div><small>YOUR TRANSPORTER</small><h3>{selected.transporter_name||"Transporter"}</h3><p>{selected.transporter_vehicle_type||"Vehicle"}{selected.transporter_vehicle_number?` · ${selected.transporter_vehicle_number}`:""}{selected.transporter_capacity_kg?` · ${Number(selected.transporter_capacity_kg).toLocaleString("en-IN")} kg`:""}</p><div className="ft-contacts">{selected.transporter_phone&&<a href={`tel:${selected.transporter_phone}`}><Phone size={13}/>{selected.transporter_phone}</a>}{Number.isFinite(Number(selected.transporter_lat))&&<button type="button" onClick={()=>maps(selected.transporter_lat,selected.transporter_lng)}><Navigation size={13}/>Map</button>}</div></div><span className={`ft-live ${tracking?.isOnline===false?"offline":""}`}><i/>{tracking?.isOnline===false?"Offline":"Online"}</span></div>
  {['ASSIGNED','EN_ROUTE_TO_FARMER','CROP_PICKED_UP','EN_ROUTE_TO_CENTER','DELIVERED'].includes(String(selected.status||"").toUpperCase())&&<div className="ft-tracking-card"><div className="ft-tracking-head"><div><small>LIVE JOURNEY</small><h3>{tx(language,"Vehicle tracking","वाहन ट्रैकिंग","వాహన ట్రాకింగ్")}</h3><p>{tracking?.isOnline===false?tx(language,"The vehicle is offline. Showing the last known location.","वाहन ऑफलाइन है। अंतिम ज्ञात लोकेशन दिखाई जा रही है।","వాహనం ఆఫ్‌లైన్‌లో ఉంది. చివరి తెలిసిన లొకేషన్ చూపుతోంది."):tx(language,"Location refreshes automatically while the trip is active.","यात्रा के दौरान लोकेशन अपने आप अपडेट होती है।","ప్రయాణం యాక్టివ్‌గా ఉన్నప్పుడు లొకేషన్ ఆటోమేటిక్‌గా అప్డేట్ అవుతుంది.")}</p></div><button type="button" className="ft-btn ft-light" onClick={()=>loadTracking(false)} disabled={trackingLoading}><RefreshCw className={trackingLoading?"ft-spin":""} size={14}/>Refresh</button></div><div className="ft-route"><div className="ft-route-point"><span className="farm"/><div><b>Pickup</b><small>{tracking?.pickupAddress||selected.pickup_address||"—"}</small></div></div><div className="ft-route-line"><span className="ft-truck-pin"><Truck size={16}/></span></div><div className="ft-route-point"><span className="center"/><div><b>Procurement center</b><small>{tracking?.centerName||selected.center_name||selected.center_id||"—"}</small></div></div></div><div className="ft-live-stats"><div><small>LAST SEEN</small><b>{tracking?.locationUpdatedAt?fmtDateTime(tracking.locationUpdatedAt,language):"—"}</b></div><div><small>EST. ETA</small><b>{etaMinutes==null?"—":`~${etaMinutes} min`}</b></div><div><small>DISTANCE</small><b>{distanceKm==null?"—":`${distanceKm.toFixed(1)} km`}</b></div></div>{tracking?.lat!=null&&tracking?.lng!=null&&<button type="button" className="ft-link-btn" onClick={()=>maps(tracking.lat,tracking.lng)}><Navigation size={14}/>Open current vehicle location</button>}</div>}
  <div className={`ft-fare ${fareDisplay(selected,language).confirmed?"confirmed":"pending"}`}><div><small>{fareDisplay(selected,language).label.toUpperCase()}</small><h3>{fareDisplay(selected,language).amount}</h3><p>{fareDisplay(selected,language).note}</p></div><div className="ft-fare-grid"><span>Distance</span><b>{distanceKm==null?"—":`${distanceKm.toFixed(1)} km`}</b><span>Status</span><b>{statusLabel(selected.status,language)}</b></div></div>
  {String(selected.status||"").toUpperCase()==="COMPLETED"&&<div className={`ft-payment ${String(transportPayment?.status||"UNPAID").toUpperCase()==="PAID"?"paid":"due"}`}>
    <div className="ft-payment-head">
      <div><small>TRANSPORT PAYMENT</small><h3>{tx(language,"Pay your transporter","ट्रांसपोर्टर को भुगतान करें","ట్రాన్స్‌పోర్టర్‌కు చెల్లించండి")}</h3><p>{transportPayment?.status==="PAID"?tx(language,"This transport fare has already been marked as paid.","इस परिवहन किराए का भुगतान दर्ज हो चुका है।","ఈ రవాణా ఛార్జీ ఇప్పటికే చెల్లించినట్లు నమోదు అయింది."):tx(language,"Payment is due for the completed transport trip.","पूरी हुई परिवहन यात्रा का भुगतान बाकी है।","పూర్తైన రవాణా ప్రయాణానికి చెల్లింపు చేయాలి.")}</p></div>
      <strong>{fareDisplay(selected,language).amount}</strong>
    </div>
    {transportPayment?.status==="PAID"?<div className="ft-payment-done"><CheckCircle2 size={18}/><div><b>{tx(language,"Payment recorded","भुगतान दर्ज है","చెల్లింపు నమోదు అయింది")}</b><span>{transportPayment.method||"—"}{transportPayment.reference?` · ${transportPayment.reference}`:""}{transportPayment.paidAt?` · ${fmtDateTime(transportPayment.paidAt,language)}`:""}</span></div></div>:<div className="ft-payment-form">
      <div className="ft-payment-methods">
        <button type="button" className={paymentMethod==="UPI"?"sel":""} onClick={()=>setPaymentMethod("UPI")}><Zap size={14}/>UPI</button>
        <button type="button" className={paymentMethod==="BANK_TRANSFER"?"sel":""} onClick={()=>setPaymentMethod("BANK_TRANSFER")}><Navigation size={14}/>{tx(language,"Bank transfer","बैंक ट्रांसफर","బ్యాంక్ ట్రాన్స్‌ఫర్")}</button>
        <button type="button" className={paymentMethod==="CASH"?"sel":""} onClick={()=>setPaymentMethod("CASH")}><Package size={14}/>{tx(language,"Cash","नकद","నగదు")}</button>
      </div>
      {paymentMethod!=="CASH"&&<label className="ft-field"><span>{tx(language,"Payment reference","पेमेंट रेफरेंस","చెల్లింపు రిఫరెన్స్")}</span><input value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder={tx(language,"UPI transaction ID / bank reference","UPI ट्रांजैक्शन ID / बैंक रेफरेंस","UPI ట్రాన్సాక్షన్ ID / బ్యాంక్ రిఫరెన్స్")}/></label>}
      <button type="button" className="ft-btn ft-pay-button" onClick={submitTransportPayment} disabled={paymentSaving}><Check size={16}/>{paymentSaving?tx(language,"Recording payment…","भुगतान दर्ज हो रहा है…","చెల్లింపు నమోదు అవుతోంది…"):tx(language,"Mark transport fare as paid","परिवहन किराया भुगतान दर्ज करें","రవాణా ఛార్జీ చెల్లింపును నమోదు చేయండి")}</button>
    </div>}
  </div>}
  {String(selected.status||"").toUpperCase()==="COMPLETED"&&<div className="ft-rating">{rated?<><div className="ft-rating-done"><ShieldCheck size={20}/><div><b>{tx(language,"Rating saved","रेटिंग सेव हो गई","రేటింగ్ సేవ్ అయింది")}</b><span>{tx(language,"Thanks for helping improve the transporter network.","ट्रांसपोर्ट नेटवर्क बेहतर बनाने में मदद के लिए धन्यवाद।","ట్రాన్స్‌పోర్టర్ నెట్‌వర్క్‌ను మెరుగుపరచడంలో సహాయపడినందుకు ధన్యవాదాలు.")}</span></div></div></>:<><div><small>RATE YOUR TRANSPORTER</small><h3>{tx(language,"How was the trip?","यात्रा कैसी रही?","ప్రయాణం ఎలా ఉంది?")}</h3></div><div className="ft-stars">{[1,2,3,4,5].map(n=><button type="button" key={n} className={ratingValue>=n?"sel":""} onClick={()=>setRatingValue(n)} aria-label={`${n} stars`}><Star size={22} fill={ratingValue>=n?"currentColor":"none"}/></button>)}</div><textarea rows="2" value={ratingReview} onChange={e=>setRatingReview(e.target.value)} placeholder="Optional review"/><button type="button" className="ft-btn ft-primary" onClick={submitRating} disabled={ratingSaving||ratingValue<1}>{ratingSaving?<LoaderCircle className="ft-spin" size={15}/>:<Star size={15}/>} {ratingSaving?"Saving…":"Submit rating"}</button></>}</div>}
  {selected.status!=="COMPLETED"&&<div className="ft-report"><AlertTriangle size={17}/><div><b>{tx(language,"Need help with this trip?","इस यात्रा में मदद चाहिए?","ఈ ప్రయాణంలో సహాయం కావాలా?")}</b><span>{tx(language,"Contact the transporter or report a pickup / vehicle issue.","ट्रांसपोर्टर से संपर्क करें या पिकअप/वाहन समस्या बताएं।","ట్రాన్స్‌పోర్టర్‌ను సంప్రదించండి లేదా పికప్ / వాహన సమస్యను రిపోర్ట్ చేయండి.")}</span></div>{selected.transporter_phone&&<a href={`tel:${selected.transporter_phone}`}><Phone size={14}/>Call</a>}</div>}
</div>}{selected.booking_id&&<div className="ft-linked"><div><small>LINKED BOOKING</small><b>{selected.booking_id}</b></div><Link to={`/farmer/token?booking=${encodeURIComponent(selected.booking_id)}`} className="ft-link">Open booking<ArrowRight size={14}/></Link></div>}{selected.status==="REQUESTED"&&<div className="ft-matches"><div className="ft-match-head"><div><small>SMART MATCHING</small><h3>{tx(language,"Eligible transporters","उपयुक्त ट्रांसपोर्टर","అర్హత ఉన్న ట్రాన్స్‌పోర్టర్లు")}</h3><p>{tx(language,"Ranked using vehicle capacity, distance and transporter history.","वाहन क्षमता, दूरी और इतिहास के आधार पर रैंक किए गए हैं।","వాహన సామర్థ్యం, దూరం మరియు చరిత్ర ఆధారంగా ర్యాంక్ చేస్తాము.")}</p></div><button className="ft-btn ft-light" type="button" onClick={refreshMatches} disabled={matchLoading}><RefreshCw className={matchLoading?"ft-spin":""} size={14}/>Find again</button></div>{matches.length?<div className="ft-match-list">{matches.slice(0,8).map((m,i)=><div className="ft-match" key={m.id||i}><b>#{i+1}</b><Truck size={17}/><div><strong>{m.name}</strong><span>{m.vehicle_type}{m.vehicle_number?` · ${m.vehicle_number}`:""}</span></div><div><strong>{m.distanceKm==null?"—":`${Number(m.distanceKm).toFixed(1)} km`}</strong><span>{Number(m.capacity_kg||0).toLocaleString("en-IN")} kg</span></div><em>★ {Number(m.rating||0).toFixed(1)}</em></div>)}</div>:<div className="ft-no-match"><Search size={18}/><span>{tx(language,"No eligible transporter is visible yet. Your request stays open for new online vehicles.","अभी कोई योग्य ट्रांसपोर्टर नहीं दिख रहा। रिक्वेस्ट नए ऑनलाइन वाहनों के लिए खुली है।","ఇంకా అర్హత ఉన్న ట్రాన్స్‌పోర్టర్ కనిపించలేదు. కొత్త ఆన్‌లైన్ వాహనాల కోసం అభ్యర్థన ఓపెన్‌లో ఉంది.")}</span></div>}</div>}</>}</section>}

      {tab==="history"&&<section className="ft-card"><div className="ft-card-head"><div><span>TRANSPORT HISTORY</span><h2>{tx(language,"Previous journeys","पिछली यात्राएं","గత ప్రయాణాలు")}</h2><p>{tx(language,"Completed and cancelled requests are kept for reference.","पूरी और रद्द रिक्वेस्ट रिकॉर्ड में रहती हैं।","పూర్తైన మరియు రద్దు చేసిన అభ్యర్థనలు రికార్డులో ఉంటాయి.")}</p></div></div>{historyRequests.length?<div className="ft-history">{historyRequests.map(r=><button type="button" key={r.id} onClick={()=>openRequest(r)}><i className={`dot status-${String(r.status).toLowerCase()}`}/><div><b>{cropLabel(r.crop,crops,language)} · {Number(r.quantity_kg||0).toLocaleString("en-IN")} kg</b><span>{r.pickup_address||"—"}</span></div><div><b>{statusLabel(r.status,language)}</b><span>{fmtDateTime(r.updated_at||r.created_at,language)}</span></div><ChevronRight size={16}/></button>)}</div>:<div className="ft-empty small"><History size={26}/><h2>{tx(language,"No closed requests yet","अभी कोई बंद रिक्वेस्ट नहीं है","ఇంకా మూసివేసిన అభ్యర్థనలు లేవు")}</h2></div>}</section>}
    </section><aside><section className="ft-card ft-side"><div className="ft-side-head"><div><span>ACTIVE REQUESTS</span><h2>{tx(language,"Your transport requests","आपकी परिवहन रिक्वेस्ट","మీ రవాణా అభ్యర్థనలు")}</h2></div><em>{activeRequests.length}</em></div>{activeRequests.length?<><div className="ft-sort-row"><button type="button" className={requestSort==="upcoming"?"sel":""} onClick={()=>setRequestSort("upcoming")}>{tx(language,"Upcoming first","आगामी पहले","రాబోయేవి ముందు")}</button><button type="button" className={requestSort==="latest"?"sel":""} onClick={()=>setRequestSort("latest")}>{tx(language,"Latest first","नवीनतम पहले","తాజావి ముందు")}</button></div><div className="ft-active-list">{activeRequests.map(r=><button type="button" key={r.id} className={String(selected?.id)===String(r.id)?"sel":""} onClick={()=>openRequest(r)}><span>{statusLabel(r.status,language)}</span><b>#{r.booking_token||r.token||r.booking_id||"—"} · {cropLabel(r.crop,crops,language)}</b><small>{Number(r.quantity_kg||0).toLocaleString("en-IN")} kg · {r.center_name||r.center_id||"Center"}</small><i>{r.requested_date ? `${fmtDate(r.requested_date,language)}${r.requested_slot_start ? ` · ${fmtTime(r.requested_slot_start)}` : ""}` : fmtDateTime(r.created_at,language)}</i></button>)}</div></>:<div className="ft-side-empty"><Truck size={22}/><b>{tx(language,"No active transport","कोई सक्रिय परिवहन नहीं","యాక్టివ్ రవాణా లేదు")}</b><span>{tx(language,"Your next request will appear here.","आपकी अगली रिक्वेस्ट यहां दिखेगी।","మీ తదుపరి అభ్యర్థన ఇక్కడ కనిపిస్తుంది.")}</span></div>}</section><section className="ft-card ft-system"><ShieldCheck size={22}/><span>LOGISTICS RECORD</span><h2>{tx(language,"One request, one live record","एक रिक्वेस्ट, एक लाइव रिकॉर्ड","ఒక అభ్యర్థన, ఒక లైవ్ రికార్డ్")}</h2><p>{tx(language,"Farmer, vehicle, trip and procurement center stay connected to the same transport record.","किसान, वाहन, यात्रा और खरीद केंद्र एक ही रिकॉर्ड से जुड़े रहते हैं।","రైతు, వాహనం, ట్రిప్ మరియు కొనుగోలు కేంద్రం ఒకే రికార్డుతో అనుసంధానంగా ఉంటాయి.")}</p><div><b><Check size={13}/>Audit timeline</b><b><Check size={13}/>GPS-ready pickup</b><b><Check size={13}/>Smart candidates</b><b><Check size={13}/>Offline draft</b></div></section></aside></div>
  </main>{editTarget&&<div className="ft-modal-bg"><form className="ft-modal ft-edit-modal" onSubmit={updateRequest}><div className="ft-modal-icon"><Pencil size={22}/></div><span>EDIT TRANSPORT</span><h2>{tx(language,"Update transport request","परिवहन रिक्वेस्ट अपडेट करें","రవాణా అభ్యర్థనను నవీకరించండి")}</h2><p>{tx(language,"Changes are saved on the server and recorded in the transport timeline.","बदलाव सर्वर पर सेव होंगे और परिवहन टाइमलाइन में दर्ज होंगे।","మార్పులు సర్వర్‌లో సేవ్ అవుతాయి మరియు రవాణా టైమ్‌లైన్‌లో నమోదు అవుతాయి.")}</p><div className="ft-two"><label className="ft-field"><span>Quantity</span><div className="ft-suffix"><input inputMode="decimal" value={editForm.quantityKg} onChange={e=>editField("quantityKg",e.target.value.replace(/[^0-9.]/g,""))}/><b>kg</b></div></label><label className="ft-field"><span>Pickup date</span><input type="date" min={today()} max={maxDate()} value={editForm.requestedDate} onChange={e=>editField("requestedDate",e.target.value)}/></label></div><label className="ft-field"><span>Pickup address</span><textarea rows="3" value={editForm.pickupAddress} onChange={e=>editField("pickupAddress",e.target.value)}/></label><div className="ft-two"><label className="ft-field"><span>Start time</span><input value={editForm.requestedSlotStart} onChange={e=>editField("requestedSlotStart",e.target.value)} placeholder="08:00"/></label><label className="ft-field"><span>End time</span><input value={editForm.requestedSlotEnd} onChange={e=>editField("requestedSlotEnd",e.target.value)} placeholder="08:30"/></label></div><label className="ft-field"><span>Pickup note</span><input value={editForm.pickupNote} onChange={e=>editField("pickupNote",e.target.value)}/></label><label className="ft-field"><span>Extra notes</span><textarea rows="2" value={editForm.notes} onChange={e=>editField("notes",e.target.value)}/></label><div className="ft-modal-actions"><button className="ft-btn ft-light" type="button" onClick={()=>setEditTarget(null)} disabled={editSaving}>Keep unchanged</button><button className="ft-btn ft-primary" type="submit" disabled={editSaving}>{editSaving?<LoaderCircle className="ft-spin" size={15}/>:<Check size={15}/>} {editSaving?"Saving…":"Save changes"}</button></div></form></div>}{cancelTarget&&<div className="ft-modal-bg"><div className="ft-modal"><div className="ft-modal-icon"><AlertCircle size={22}/></div><span>CANCEL TRANSPORT</span><h2>{tx(language,"Cancel this transport request?","क्या यह परिवहन रिक्वेस्ट रद्द करें?","ఈ రవాణా అభ్యర్థనను రద్దు చేయాలా?")}</h2><p>{tx(language,"The request will be closed. You can create another one later.","रिक्वेस्ट बंद हो जाएगी। जरूरत होने पर बाद में नई रिक्वेस्ट बना सकते हैं।","అభ్యర్థన మూసివేయబడుతుంది. అవసరమైతే తర్వాత కొత్తది సృష్టించవచ్చు.")}</p><label className="ft-field"><span>{tx(language,"Reason (optional)","कारण (वैकल्पिक)","కారణం (ఐచ్ఛికం)")}</span><textarea rows="3" value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder={tx(language,"Why are you cancelling?","आप क्यों रद्द कर रहे हैं?","ఎందుకు రద్దు చేస్తున్నారు?")}/></label><div className="ft-modal-actions"><button className="ft-btn ft-light" type="button" onClick={()=>setCancelTarget(null)}>Keep request</button><button className="ft-btn ft-danger strong" type="button" onClick={cancel}><X size={15}/>Yes, cancel</button></div></div></div>}</div>;
}

const styles=`
.farmer-transport-page{min-height:100vh;background:#f4f7f5;color:#193529}.ft-shell{width:min(1460px,calc(100% - 40px));margin:auto;padding:32px 0 70px}.ft-center{min-height:70vh;display:grid;place-items:center}.ft-loading{width:min(560px,100%);padding:44px;text-align:center;border:1px solid #dce7e0;border-radius:26px;background:#fff;box-shadow:0 24px 70px rgba(30,70,48,.08)}.ft-loading>svg{color:#347451}.ft-loading span,.ft-eyebrow,.ft-card-head>div>span,.ft-sec-title>span,.ft-side-head>div>span,.ft-system>span,.ft-match-head>div>small,.ft-modal>span{font-size:10px;font-weight:900;letter-spacing:.16em;color:#62806f}.ft-loading h1,.ft-head h1{letter-spacing:-.04em}.ft-loading p,.ft-head p,.ft-card-head p,.ft-match-head p,.ft-system p{color:#708279;line-height:1.6}.ft-spin{animation:spin .9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.ft-head{display:flex;justify-content:space-between;gap:25px;align-items:flex-end;margin-bottom:20px}.ft-back{display:inline-flex;gap:7px;align-items:center;color:#567466;text-decoration:none;font-size:13px;font-weight:800;margin-bottom:15px}.ft-head h1{font-size:clamp(34px,4vw,54px);line-height:1;margin:6px 0 8px}.ft-head p{max-width:820px;margin:0;font-size:15px}.ft-head-actions{display:flex;gap:9px;align-items:center}.ft-online{display:inline-flex;gap:8px;align-items:center;padding:9px 12px;border:1px solid #d8e5dd;border-radius:99px;background:#fff;font-size:12px;font-weight:900}.ft-online i,.ft-live i{width:7px;height:7px;border-radius:50%;background:#55a975}.ft-online.off{color:#8d5e2c;background:#fff8ee;border-color:#eddec5}.ft-online.off i{background:#cf8a37}.ft-alerts{display:grid;gap:9px;margin:14px 0 18px}.ft-alert{display:flex;gap:9px;align-items:center;padding:12px 14px;border-radius:13px;font-size:13px;font-weight:700}.ft-alert button{margin-left:auto;border:0;background:none;font-size:20px;cursor:pointer;color:inherit}.ft-alert.err{color:#a24638;background:#fff0ed;border:1px solid #f0c9c0}.ft-alert.inf{color:#2e6578;background:#eef7fb;border:1px solid #cfe4ed}.ft-alert.ok{color:#2c754a;background:#eef9f1;border:1px solid #cfe7d6}.ft-alert.draft{color:#8b6430;background:#fff8eb;border:1px solid #eddfc2}.ft-features{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.ft-features>div{display:grid;grid-template-columns:38px 1fr;column-gap:10px;padding:13px 14px;background:#fff;border:1px solid #dfe9e3;border-radius:15px}.ft-features svg{grid-row:1/3;width:38px;height:38px;padding:9px;box-sizing:border-box;border-radius:12px;background:#edf5ef;color:#2f704c}.ft-features b{font-size:12px;margin-top:2px}.ft-features span{font-size:11px;color:#73857b}.ft-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:17px;align-items:start}.ft-grid>aside{display:grid;gap:17px;position:sticky;top:15px}.ft-tabs{display:inline-flex;padding:4px;background:#e8efea;border-radius:12px;margin-bottom:12px;gap:3px}.ft-tabs button,.ft-toggle button{border:0;background:transparent;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:900;color:#60766a;cursor:pointer}.ft-tabs button{min-height:39px;padding:0 13px;border-radius:9px;font-size:12px}.ft-tabs button.sel,.ft-toggle button.sel{background:#fff;color:#1f5a3e;box-shadow:0 4px 12px rgba(40,70,50,.08)}.ft-tabs em{font-style:normal;min-width:19px;height:19px;padding:0 5px;display:grid;place-items:center;border-radius:99px;background:#dceddf;font-size:10px}.ft-card{background:#fff;border:1px solid #dce7e1;border-radius:22px;box-shadow:0 17px 50px rgba(33,70,48,.05);overflow:hidden}.ft-card-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:24px 26px 18px;border-bottom:1px solid #e8eee9}.ft-card-head h2{font-size:26px;margin:7px 0 5px;letter-spacing:-.025em}.ft-card-head>svg{color:#32714d}.ft-section{padding:23px 26px;border-bottom:1px solid #edf2ee}.ft-sec-title{display:flex;gap:11px;align-items:flex-start;margin-bottom:14px}.ft-sec-title>b{width:34px;height:34px;display:grid;place-items:center;background:#edf5ef;border-radius:10px;color:#2f6b49;font-size:11px}.ft-sec-title strong{display:block;font-size:14px}.ft-sec-title span{display:block;font-size:11px;color:#778980;margin-top:3px}.ft-two{display:grid;grid-template-columns:1fr 1fr;gap:13px}.ft-field{display:grid;gap:7px}.ft-field>span{font-size:11px;color:#60766b;font-weight:900}.ft-field input,.ft-field select,.ft-field textarea{width:100%;box-sizing:border-box;min-height:46px;padding:0 12px;border:1px solid #d4e1d9;border-radius:11px;background:#fff;color:#274738;font:inherit;font-size:13px;outline:none}.ft-field textarea{padding-top:11px;resize:vertical;min-height:86px}.ft-field input:focus,.ft-field select:focus,.ft-field textarea:focus{border-color:#83a991;box-shadow:0 0 0 4px rgba(75,133,94,.1)}.ft-select{position:relative;flex:1}.ft-select select{appearance:none;width:100%;height:46px;padding:0 38px 0 12px;border:1px solid #d4e1d9;border-radius:11px;background:#fff;color:#274738;font:inherit;font-size:13px;font-weight:700}.ft-select>svg{position:absolute;right:12px;top:15px;color:#7a8d83;pointer-events:none}.ft-picker{display:flex;gap:9px;align-items:center}.ft-link,.ft-link-btn{display:inline-flex;align-items:center;gap:7px;text-decoration:none;border:0;background:#eff6f0;color:#2c6747;padding:0 11px;min-height:43px;border-radius:10px;font-size:12px;font-weight:900;cursor:pointer}.ft-icon-input{position:relative}.ft-icon-input>svg{position:absolute;left:13px;top:14px;color:#75897e;pointer-events:none}.ft-icon-input input,.ft-icon-input select{padding-left:39px}.ft-suffix{position:relative}.ft-suffix input{padding-right:44px}.ft-suffix b{position:absolute;right:13px;top:14px;color:#75887d;font-size:12px}.ft-note{display:flex;gap:8px;align-items:flex-start;margin-top:10px;padding:10px 11px;background:#e2f4e5;border:1px solid #e2ebe5;border-radius:11px;color:#657a70;font-size:11px;line-height:1.5}.ft-destination{display:flex;align-items:center;gap:10px;padding:12px;margin-top:11px;background:#e2f4e5;border:1px solid #dce9df;border-radius:13px}.ft-destination>svg{color:#2f704b}.ft-destination div{min-width:0;flex:1}.ft-destination b{display:block;font-size:12px}.ft-destination span{display:block;font-size:11px;color:#778980;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}.ft-destination button{border:0;background:none;color:#2d6a49;font-size:11px;font-weight:900;display:flex;gap:5px;align-items:center;cursor:pointer}.ft-loc-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.ft-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 13px;border-radius:10px;border:1px solid transparent;font-size:12px;font-weight:900;cursor:pointer}.ft-btn:disabled{opacity:.5;cursor:default}.ft-light{border-color:#d5e1da;background:#fff;color:#355444}.ft-primary{border-color:#1e5d3e;background:#1f6944;color:#fff;box-shadow:0 9px 22px rgba(31,105,68,.14)}.ft-danger{border-color:#ebc7c0;background:#fff2ef;color:#a14539}.ft-danger.strong{background:#a44337;color:#fff}.ft-gps{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 11px;border:1px dashed #cbd9d1;background:#fbfdfb;border-radius:10px;color:#70847a;font-size:11px;font-weight:800;cursor:pointer}.ft-gps.ready{border-style:solid;background:#f0f8f2;border-color:#cee3d4;color:#2d704a}.ft-gps svg:last-child{margin-left:4px}.ft-gps-box{margin-top:10px;padding:12px;border:1px solid #e1eae4;background:#fbfdfb;border-radius:13px}.ft-toggle{display:flex;gap:5px;background:#edf2ee;padding:4px;border-radius:10px;margin-bottom:13px}.ft-toggle button{flex:1;min-height:40px;border-radius:8px;font-size:11px}.ft-time{display:grid;grid-template-columns:1fr auto 1fr;gap:7px;align-items:center}.ft-time label{position:relative}.ft-time label>svg{position:absolute;left:11px;top:15px;color:#7b8d84}.ft-time input{width:100%;box-sizing:border-box;height:46px;padding:0 8px 0 33px;border:1px solid #d4e1d9;border-radius:11px;font:inherit;outline:none}.ft-slots{display:flex;gap:7px;overflow:auto;margin-top:10px}.ft-slots button{flex:0 0 auto;min-height:36px;padding:0 10px;border:1px solid #d6e3db;background:#fff;border-radius:9px;font-size:11px;font-weight:800;color:#4b6558;cursor:pointer}.ft-slots button.sel{background:#eaf4ed;border-color:#c6dece;color:#27613f}.ft-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:17px 26px;background:#fbfdfb}.ft-footer>span{display:flex;gap:7px;align-items:center;color:#778980;font-size:10px;font-weight:800}.ft-footer>div{display:flex;gap:8px}.ft-status{padding-bottom:22px}.ft-id{display:inline-flex;align-items:center;gap:6px;border:1px solid #dce6e0;background:#fafcfa;border-radius:7px;color:#63786d;font-size:10px;font-weight:900;padding:5px 7px;margin-left:8px}.ft-status{display:inline-flex;align-items:center;gap:6px;padding:9px 11px;border-radius:99px;background:#edf5ef;color:#2e6d49;font-size:10px;font-weight:900}.ft-actions{display:flex;gap:8px;flex-wrap:wrap;padding:0 26px 17px}.ft-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e8eee9}.ft-summary>div{background:#fbfdfb;padding:13px}.ft-summary small{display:block;text-transform:uppercase;letter-spacing:.08em;font-size:9px;font-weight:900;color:#84958d;margin-bottom:5px}.ft-summary b{display:block;font-size:12px;line-height:1.4;word-break:break-word}.ft-schedule{display:flex;gap:8px;align-items:center;margin:13px 26px 0;padding:10px 11px;background:#e2f4e5;border:1px solid #e3ebe5;border-radius:10px;color:#4d6a5a;font-size:11px}.ft-timeline{position:relative;padding:22px 26px 5px}.ft-tline{display:grid;grid-template-columns:32px 1fr;gap:11px;min-height:68px;position:relative}.ft-tline:not(:last-child):before{content:"";position:absolute;left:15px;top:31px;bottom:0;width:2px;background:#dfe7e2}.ft-ticon{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#edf2ee;color:#87988f;border:3px solid #fff;box-shadow:0 0 0 1px #d8e2dc;z-index:1}.ft-tline.hit .ft-ticon{background:#dff0e4;color:#2f7650}.ft-tline.current .ft-ticon{background:#1f6944;color:#fff;box-shadow:0 0 0 4px rgba(31,105,68,.1)}.ft-tline.cancelled .ft-ticon{background:#fff0ed;color:#a3483a}.ft-tline b{display:block;font-size:12px}.ft-tline span{display:block;font-size:10px;color:#85948d;margin-top:2px}.ft-tline small{display:block;font-size:10px;color:#63776c;margin-top:4px}.ft-transporter{display:flex;gap:11px;align-items:center;margin:5px 26px 17px;padding:13px;border:1px solid #d8e8dc;background:#f6fbf7;border-radius:15px}.ft-avatar{width:43px;height:43px;border-radius:13px;display:grid;place-items:center;background:#e5f2e8;color:#2d6c48;flex:0 0 auto}.ft-transporter>div:nth-child(2){min-width:0;flex:1}.ft-transporter small,.ft-linked small{font-size:9px;letter-spacing:.12em;font-weight:900;color:#688070}.ft-transporter h3{font-size:14px;margin:4px 0}.ft-transporter p{margin:0;color:#6f8278;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ft-contacts{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}.ft-contacts a,.ft-contacts button{display:inline-flex;gap:5px;align-items:center;color:#2e6b48;text-decoration:none;border:0;background:none;font-size:10px;font-weight:900;padding:0;cursor:pointer}.ft-live{display:inline-flex;gap:5px;align-items:center;border:1px solid #d8e8dc;background:#fff;border-radius:99px;padding:5px 7px;font-size:10px;font-weight:900;color:#2f6f4b}.ft-linked{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:4px 26px 17px;padding:12px;border:1px solid #e1eae5;background:#fbfdfb;border-radius:13px}.ft-linked b{display:block;margin-top:4px;font-size:12px}.ft-matches{margin:0 26px;padding:16px;border:1px solid #e1eae5;border-radius:16px;background:#fbfdfb}.ft-match-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.ft-match-head h3{font-size:16px;margin:5px 0}.ft-match-head p{font-size:11px;margin:0}.ft-match-list{display:grid;gap:6px;margin-top:11px}.ft-match{display:grid;grid-template-columns:25px 32px minmax(0,1fr) auto auto;align-items:center;gap:9px;padding:10px;background:#fff;border:1px solid #e5ece7;border-radius:11px}.ft-match>svg{color:#2d6c48}.ft-match div:nth-child(3){min-width:0}.ft-match strong{display:block;font-size:11px}.ft-match span{display:block;font-size:10px;color:#778980;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ft-match em{font-size:11px;font-style:normal;font-weight:900;color:#425e50}.ft-no-match{display:flex;gap:8px;align-items:start;margin-top:10px;padding:11px;border-radius:10px;background:#f7faf7;color:#677b71;font-size:11px;line-height:1.5}.ft-empty{display:grid;place-items:center;text-align:center;padding:65px 25px}.ft-empty.small{padding:45px 25px}.ft-empty svg{color:#3a7755}.ft-empty h2{font-size:20px;margin:8px 0}.ft-empty p{max-width:450px}.ft-history{display:grid;gap:7px;padding:10px 18px 22px}.ft-history button{width:100%;display:grid;grid-template-columns:9px minmax(0,1fr) auto 16px;gap:10px;align-items:center;text-align:left;border:1px solid #e2eae5;background:#fff;border-radius:12px;padding:12px;cursor:pointer}.ft-history .dot{width:9px;height:9px;border-radius:50%;background:#788b82}.ft-history .dot.status-completed{background:#50a06d}.ft-history .dot.status-cancelled{background:#bc5c4e}.ft-history b{display:block;font-size:11px;color:#304c3e}.ft-history span{display:block;font-size:10px;color:#7c8d85;margin-top:3px}.ft-side{padding:18px}.ft-side-head{display:flex;justify-content:space-between;align-items:center}.ft-side-head h2{font-size:20px;margin:5px 0}.ft-side-head em{width:30px;height:30px;display:grid;place-items:center;background:#eaf4ed;border-radius:9px;color:#2d6e4a;font-style:normal;font-weight:900;font-size:11px}.ft-sort-row{display:flex;gap:6px;padding:10px 0 2px}.ft-sort-row button{flex:1;border:1px solid #dfe8e2;background:#fff;border-radius:9px;min-height:34px;color:#667a70;font-size:10px;font-weight:900;cursor:pointer}.ft-sort-row button.sel{background:#edf6ef;border-color:#cfe1d5;color:#2b6847}.ft-active-list{display:grid;gap:7px;margin-top:8px}.ft-active-list button{width:100%;text-align:left;padding:11px;border:1px solid #e1e9e4;background:#fff;border-radius:12px;cursor:pointer}.ft-active-list button.sel{border-color:#a8cdae;box-shadow:0 0 0 3px rgba(66,132,85,.08)}.ft-active-list button>span{display:inline-block;padding:5px 7px;background:#edf5ef;color:#2e6e49;border-radius:99px;font-size:9px;font-weight:900}.ft-active-list button>b{display:block;font-size:12px;margin-top:8px}.ft-active-list button>small,.ft-active-list button>i{display:block;font-size:10px;color:#798b83;margin-top:3px;font-style:normal}.ft-side-empty{display:grid;gap:5px;padding:16px;margin-top:12px;background:#e2f4e5;border:1px solid #e5ece7;border-radius:12px;color:#71847a}.ft-side-empty b{color:#365243;font-size:11px}.ft-side-empty span{font-size:10px;line-height:1.45}.ft-system{padding:19px}.ft-system>svg{width:43px;height:43px;padding:10px;box-sizing:border-box;border-radius:13px;background:#edf6f0;color:#2d6f4a;margin-bottom:9px}.ft-system h2{font-size:19px;margin:6px 0}.ft-system p{font-size:11px}.ft-system>div{display:grid;gap:7px;margin-top:13px}.ft-system b{display:flex;gap:6px;align-items:center;font-size:10px;color:#527063}.ft-system b svg{color:#4c9966}.ft-modal-bg{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(12,31,21,.43);backdrop-filter:blur(5px)}.ft-modal{width:min(500px,100%);background:#fff;border-radius:22px;border:1px solid #dbe6df;padding:23px;box-shadow:0 30px 100px rgba(9,25,16,.22)}.ft-modal-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;background:#fff0ed;color:#a54739;margin-bottom:10px}.ft-modal h2{font-size:22px;margin:6px 0}.ft-modal p{font-size:12px;color:#6d8176;line-height:1.55}.ft-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}
@media(max-width:1100px){.ft-grid{grid-template-columns:1fr}.ft-grid>aside{position:static;grid-template-columns:1fr 1fr}.ft-features{grid-template-columns:1fr}.ft-feature{} }
@media(max-width:800px){.ft-shell{width:min(100% - 24px,720px);padding-top:22px}.ft-head{align-items:start;flex-direction:column}.ft-head-actions{width:100%;justify-content:space-between}.ft-two,.ft-summary{grid-template-columns:1fr}.ft-card-head{padding:20px}.ft-section{padding:20px}.ft-footer{align-items:start;flex-direction:column;padding:16px 20px}.ft-footer>div{width:100%}.ft-footer>div>*{flex:1}.ft-actions{padding:0 20px 15px}.ft-schedule,.ft-linked{margin-left:20px;margin-right:20px}.ft-timeline{padding-left:20px;padding-right:20px}.ft-transporter,.ft-matches{margin-left:20px;margin-right:20px}.ft-picker{align-items:stretch;flex-direction:column}.ft-select{width:100%}.ft-tabs{width:100%;display:grid;grid-template-columns:1fr 1fr 1fr}.ft-tabs button{padding:0 6px;font-size:10px}.ft-grid>aside{grid-template-columns:1fr}}
@media(max-width:560px){.ft-head h1{font-size:34px}.ft-card-head{flex-direction:column}.ft-status{align-self:start}.ft-match{grid-template-columns:23px 30px minmax(0,1fr)}.ft-match>div:nth-child(4),.ft-match>em{grid-column:3;text-align:left}.ft-modal-actions{flex-direction:column}.ft-btn{min-height:43px}.ft-footer>div{display:grid;grid-template-columns:1fr}.ft-features>div{grid-template-columns:35px 1fr}.ft-features svg{width:35px;height:35px}}
.ft-transport-stack{display:grid;gap:9px;margin:5px 26px 17px}.ft-transport-stack .ft-transporter{margin:0}.ft-tracking-card{border:1px solid #dce9df;border-radius:17px;background:#fbfefb;padding:16px}.ft-tracking-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.ft-tracking-head h3{font-size:16px;margin:5px 0}.ft-tracking-head p{font-size:10px;margin:0;line-height:1.5}.ft-tracking-head small,.ft-fare small,.ft-rating small{letter-spacing:.11em;font-size:9px;font-weight:900;color:#688070}.ft-route{display:grid;grid-template-columns:1fr 40px 1fr;gap:8px;align-items:center;margin:18px 0 12px}.ft-route-point{display:flex;gap:8px;align-items:flex-start}.ft-route-point>b,.ft-route-point small{display:block}.ft-route-point b{font-size:10px}.ft-route-point small{font-size:9px;color:#829189;line-height:1.4;margin-top:3px}.ft-route-point>span{width:13px;height:13px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #b7ccc0;flex:0 0 auto;margin-top:2px}.ft-route-point>span.farm{background:#2d7650}.ft-route-point>span.center{background:#5d6f68}.ft-route-line{height:2px;background:#cddbd2;position:relative}.ft-truck-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:#e7f3eb;color:#2c6d49;border:1px solid #d0e2d6}.ft-live-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#e4ece6;border:1px solid #e4ece6;border-radius:11px;overflow:hidden}.ft-live-stats>div{background:#fff;padding:9px}.ft-live-stats small,.ft-live-stats b{display:block}.ft-live-stats small{font-size:8px;font-weight:900;letter-spacing:.1em;color:#87958e}.ft-live-stats b{font-size:10px;margin-top:4px}.ft-link-btn{display:inline-flex;gap:6px;align-items:center;margin-top:10px;border:0;background:none;color:#2c6d48;font-size:10px;font-weight:900;padding:0;cursor:pointer}.ft-fare{display:grid;grid-template-columns:1fr 1.3fr;gap:12px;padding:14px 15px;border:1px solid #e2eae5;border-radius:15px;background:#fff}.ft-fare h3{font-size:22px;margin:5px 0 2px}.ft-fare p{font-size:9px;color:#7f8f88;margin:0}.ft-fare-grid{display:grid;grid-template-columns:1fr auto;gap:7px;align-content:center;font-size:10px}.ft-fare-grid span{color:#83928b}.ft-fare-grid b{text-align:right}.ft-rating{display:grid;gap:10px;padding:15px;border:1px solid #e2eae5;background:#fff;border-radius:15px}.ft-rating h3{font-size:15px;margin:4px 0 0}.ft-stars{display:flex;gap:4px}.ft-stars button{border:0;background:none;padding:4px;color:#a9b9b1;cursor:pointer}.ft-stars button.sel{color:#d3a63a}.ft-rating textarea{width:100%;box-sizing:border-box;resize:vertical;border:1px solid #d8e3dc;border-radius:11px;padding:10px;font:inherit;font-size:11px;outline:none}.ft-rating-done{display:flex;gap:10px;align-items:flex-start;color:#2d704b}.ft-rating-done b,.ft-rating-done span{display:block}.ft-rating-done b{font-size:12px}.ft-rating-done span{font-size:10px;color:#75867e;margin-top:3px}.ft-report{display:flex;gap:10px;align-items:center;padding:12px 13px;border:1px solid #eadfd9;background:#fffaf8;border-radius:13px;color:#805c51}.ft-report>div{min-width:0;flex:1}.ft-report b,.ft-report span{display:block}.ft-report b{font-size:11px;color:#574039}.ft-report span{font-size:10px;line-height:1.45;margin-top:3px}.ft-report a{display:inline-flex;gap:5px;align-items:center;text-decoration:none;color:#7d4a3d;font-size:10px;font-weight:900}.ft-live.offline{color:#855e54;background:#fff7f4;border-color:#ecdcd6}.ft-live.offline i{background:#bd7563}.ft-edit-modal{max-height:min(88vh,760px);overflow:auto}.ft-edit-modal .ft-field{margin-top:10px}
@media(max-width:700px){.ft-route{grid-template-columns:1fr 28px 1fr}.ft-fare{grid-template-columns:1fr}.ft-transport-stack{margin-left:20px;margin-right:20px}.ft-live-stats{grid-template-columns:1fr}.ft-tracking-head{flex-direction:column}.ft-tracking-head .ft-btn{width:100%}}



/* Transport payment */
.ft-payment{margin:0 26px 17px;padding:18px;border-radius:18px;border:1px solid #dbe7df;background:linear-gradient(135deg,#f5fbf7,#ffffff);box-shadow:0 10px 30px rgba(27,76,46,.06)}
.ft-payment.due{border-color:#ead9b8;background:linear-gradient(135deg,#fff9ed,#ffffff)}
.ft-payment.paid{border-color:#cbe5d2;background:linear-gradient(135deg,#effaf2,#ffffff)}
.ft-payment-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.ft-payment-head small{display:block;color:#9a7a2d;font-size:9px;font-weight:900;letter-spacing:.12em}
.ft-payment-head h3{margin:5px 0 3px;color:#223b2c;font-size:18px}
.ft-payment-head p{margin:0;color:#718078;font-size:10px;line-height:1.45}
.ft-payment-head>strong{color:#1e7a45;font-size:23px;white-space:nowrap}
.ft-payment-form{display:grid;gap:10px;margin-top:14px}
.ft-payment-methods{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.ft-payment-methods button{min-height:42px;border:1px solid #d8e4dc;border-radius:10px;background:#fff;color:#607167;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
.ft-payment-methods button.sel{border-color:#246f40;background:#246f40;color:#fff;box-shadow:0 8px 18px rgba(36,111,64,.18)}
.ft-pay-button{width:100%;background:#1f7a46!important;border-color:#1f7a46!important}
.ft-payment-done{display:flex;align-items:center;gap:10px;margin-top:14px;padding:11px 12px;border-radius:11px;background:#eaf8ee;color:#277744}
.ft-payment-done svg{flex:0 0 auto}
.ft-payment-done div{display:grid;gap:2px}
.ft-payment-done b{font-size:11px}
.ft-payment-done span{font-size:9px;color:#66806f}
@media(max-width:700px){
  .ft-payment{margin-left:20px;margin-right:20px;padding:14px}
  .ft-payment-head{flex-direction:column}
  .ft-payment-head>strong{font-size:21px}
  .ft-payment-methods{grid-template-columns:1fr}
}
@media(max-width:480px){
  .ft-payment{margin-left:16px;margin-right:16px}
  .ft-payment-head h3{font-size:17px}
  .ft-payment-methods button{min-height:46px;font-size:11px}
}

/* Farmer-first mobile overrides. */
@media(max-width:700px){
  .ft-route{grid-template-columns:1fr;gap:0;margin:16px 0 12px;padding-left:0;}
  .ft-route-point{padding:2px 0;}
  .ft-route-line{height:28px;width:2px;margin:0 0 0 6px;background:#cddbd2;}
  .ft-fare-notice{margin:0 20px 14px;}
  .ft-field-help{font-size:10px!important;line-height:1.45;color:#7a8b83;display:block;margin-top:-2px;}
  .ft-fare.pending{background:#fffdf8;border-color:#eadfc6;}
  .ft-fare.pending h3{font-size:20px;}
  .ft-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .ft-actions .ft-btn{width:100%;min-width:0;}
  .ft-actions .ft-danger{grid-column:1/-1;}
  .ft-transporter{align-items:flex-start;}
  .ft-live{margin-left:auto;flex:0 0 auto;}
}
@media(max-width:480px){
  .ft-shell{width:calc(100% - 16px);padding:14px 0 54px;}
  .ft-head{gap:12px;margin-bottom:13px;}
  .ft-back{font-size:12px;margin-bottom:10px;}
  .ft-head h1{font-size:29px;line-height:1.04;}
  .ft-head p{font-size:12px;line-height:1.5;}
  .ft-head-actions{gap:7px;align-items:stretch;flex-direction:column;}
  .ft-head-actions .ft-btn{width:100%;}
  .ft-features>div{padding:11px 12px;border-radius:13px;}
  .ft-card{border-radius:17px;}
  .ft-card-head{padding:16px;}
  .ft-card-head h2{font-size:21px;}
  .ft-section{padding:16px;}
  .ft-sec-title{gap:9px;margin-bottom:11px;}
  .ft-sec-title>b{width:30px;height:30px;}
  .ft-field input,.ft-field select,.ft-field textarea,.ft-select select,.ft-time input{min-height:48px;font-size:16px;}
  .ft-field textarea{min-height:96px;}
  .ft-loc-actions{display:grid;grid-template-columns:1fr;gap:7px;}
  .ft-loc-actions .ft-btn,.ft-loc-actions .ft-gps{width:100%;}
  .ft-footer{padding:14px 16px;}
  .ft-footer>span{font-size:9px;line-height:1.4;}
  .ft-tabs{position:sticky;top:8px;z-index:4;}
  .ft-tabs button{min-height:42px;font-size:10px;}
  .ft-summary>div{padding:11px 12px;}
  .ft-summary b{font-size:11px;}
  .ft-schedule{margin-left:16px;margin-right:16px;font-size:10px;flex-wrap:wrap;}
  .ft-timeline{padding:18px 16px 4px;}
  .ft-transporter,.ft-matches{margin-left:16px;margin-right:16px;}
  .ft-tracking-card{padding:13px;}
  .ft-live-stats{grid-template-columns:1fr;}
  .ft-live-stats>div{padding:10px 11px;}
  .ft-fare{padding:13px;}
  .ft-fare h3{font-size:21px;word-break:break-word;}
  .ft-fare-notice{margin:0 16px 13px;padding:11px;}
  .ft-match{padding:9px;}
  .ft-modal-bg{padding:10px;}
  .ft-modal{padding:18px;border-radius:18px;max-height:92vh;}
}
`;
