import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MessageSquareText, ShieldAlert, Send } from "lucide-react";
import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";
import { getCurrentFarmer } from "../../data/appStore";

const API_URL = import.meta.env.VITE_API_URL;

function getText(language, english, hindi, telugu) {
  if (language === "hi" && hindi) return hindi;
  if (language === "te" && telugu) return telugu;
  return english;
}

export default function FarmerPaymentIssue() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const farmer = getCurrentFarmer();

  const [issueText, setIssueText] = useState("");
  const [issueSending, setIssueSending] = useState(false);
  const [issueMessage, setIssueMessage] = useState("");
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(bookingId || "");
  const [loading, setLoading] = useState(true);

  // Fetch farmer's past bookings to populate the dropdown
  useEffect(() => {
    async function loadBookings() {
      if (!farmer) return;
      try {
        const response = await fetch(`${API_URL}/farmer/payments/${farmer.id}`);
        const data = await response.json();
        if (data.success) {
          setBookings(data.data || []);
          if (!selectedBooking && data.data && data.data.length > 0) {
            setSelectedBooking(data.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [farmer]);

  async function submitIssue() {
    if (!farmer) {
      setIssueMessage(getText(language, "Please log in again.", "कृपया फिर से लॉग इन करें।", "దయచేసి మళ్లీ లాగిన్ చేయండి."));
      return;
    }
    if (!selectedBooking) {
      setIssueMessage(getText(language, "Please select a procurement token.", "कृपया खरीद टोकन चुनें।", "దయచేసి సేకరణ టోకెన్‌ను ఎంచుకోండి."));
      return;
    }
    if (!issueText.trim()) {
      setIssueMessage(getText(language, "Please describe the payment problem.", "कृपया भुगतान की समस्या का वर्णन करें।", "దయచేసి చెల్లింపు సమస్యను వివరించండి."));
      return;
    }

    setIssueSending(true);
    setIssueMessage("");

    try {
      const response = await fetch(`${API_URL}/payment-issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: farmer.id,
          bookingId: selectedBooking,
          message: issueText.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data?.message || "Unable to submit the payment issue.");
      }

      setIssueMessage(getText(language, "Payment issue submitted successfully.", "भुगतान समस्या सफलतापूर्वक सबमिट की गई।", "చెల్లింపు సమస్య విజయవంతంగా సమర్పించబడింది."));
      setTimeout(() => {
        navigate("/farmer/payments");
      }, 1500);
    } catch (submitError) {
      console.error("Payment issue error:", submitError);
      setIssueMessage(submitError?.message || getText(language, "Unable to submit the payment issue.", "भुगतान समस्या सबमिट करने में असमर्थ।", "చెల్లింపు సమస్యను సమర్పించలేకపోయాము."));
    } finally {
      setIssueSending(false);
    }
  }

  return (
    <div className="farmer-payments-page" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Header />
      <main className="farmer-payments-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        
        <button 
          onClick={() => navigate("/farmer/payments")} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', marginBottom: '24px', padding: 0 }}
        >
          <ArrowLeft size={20} />
          {getText(language, "Back to Payments", "भुगतान पर वापस जाएं", "చెల్లింపులకు తిరిగి వెళ్ళండి")}
        </button>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>
                {getText(language, "Report a Payment Issue", "भुगतान समस्या की रिपोर्ट करें", "చెల్లింపు సమస్యను నివేదించండి")}
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
                {getText(language, "File a dispute for a specific procurement.", "किसी विशिष्ट खरीद के लिए विवाद दर्ज करें।", "నిర్దిష్ట సేకరణ కోసం వివాదాన్ని దాఖలు చేయండి.")}
              </p>
            </div>
          </div>

          <label style={{ display: 'block', fontWeight: '600', color: '#334155', marginBottom: '12px', fontSize: '1.1rem' }}>
            {getText(language, "Select Procurement / Token", "खरीद / टोकन चुनें", "సేకరణ / టోకెన్ ఎంచుకోండి")}
          </label>
          <select 
            value={selectedBooking} 
            onChange={(e) => setSelectedBooking(e.target.value)} 
            disabled={issueSending || loading}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '1rem', marginBottom: '24px', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'white' }}
          >
            <option value="" disabled>{loading ? getText(language, "Loading...", "लोड हो रहा है...", "లోడ్ అవుతోంది...") : getText(language, "Select a procurement", "खरीद चुनें", "సేకరణను ఎంచుకోండి")}</option>
            {bookings.map(b => (
              <option key={b.id} value={b.id}>
                Token #{b.token || b.id} - ₹{b.payment_amount}
              </option>
            ))}
          </select>

          <label style={{ display: 'block', fontWeight: '600', color: '#334155', marginBottom: '12px', fontSize: '1.1rem' }}>
            {getText(language, "What went wrong with this payment?", "इस भुगतान में क्या गलत हुआ?", "ఈ చెల్లింపులో ఏ తప్పు జరిగింది?")}
          </label>
          <textarea
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            disabled={issueSending}
            placeholder={getText(language, "e.g., I received ₹1500 less than expected...", "उदा., मुझे उम्मीद से ₹1500 कम मिले...", "ఉదా., నాకు ఊహించిన దానికంటే ₹1500 తక్కువ వచ్చింది...")}
            rows={6}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '1rem', resize: 'vertical', marginBottom: '24px', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />

          {issueMessage && (
            <div style={{ padding: '16px', borderRadius: '12px', background: issueMessage.includes('successfully') || issueMessage.includes('सफलतापूर्वक') || issueMessage.includes('విజయవంతంగా') ? '#dcfce7' : '#fee2e2', color: issueMessage.includes('successfully') || issueMessage.includes('सफलतापूर्वक') || issueMessage.includes('విజయవంతంగా') ? '#166534' : '#991b1b', marginBottom: '24px', fontWeight: '500' }}>
              {issueMessage}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button
              onClick={() => navigate("/farmer/payments")}
              disabled={issueSending}
              style={{ padding: '12px 24px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: '600', border: 'none', cursor: 'pointer' }}
            >
              {getText(language, "Cancel", "रद्द करें", "రద్దు చేయండి")}
            </button>
            <button
              onClick={submitIssue}
              disabled={issueSending}
              style={{ padding: '12px 32px', borderRadius: '8px', background: '#ea580c', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)' }}
            >
              {issueSending ? getText(language, "Sending...", "भेज रहा है...", "పంపుతోంది...") : getText(language, "Submit Issue", "समस्या दर्ज करें", "సమస్యను సమర్పించండి")}
              {!issueSending && <Send size={18} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}