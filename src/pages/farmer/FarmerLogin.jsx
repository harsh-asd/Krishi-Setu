import { ArrowLeft, ArrowRight, Check, Mail, Phone, UserRound, ShieldCheck, User } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import Header from "../../components/Header";
import Button from "../../components/Button";
import { useLanguage } from "../../translations/LanguageContext";
import { setCurrentFarmer } from "../../data/appStore";
import ricePlanting from "../../assets/backgrounds/rice-planting.png";

const API_URL = String(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

function FarmerLogin() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Send OTP
  async function handleSendOTP(event) {
    event.preventDefault();
    if (!name || phone.length !== 10 || !email) {
      setError("Please provide a valid Name, Email, and 10-digit Mobile Number.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/farmers/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });

      const data = await response.json();
      if (data.success) {
        setStep(2);
        // FALLBACK: Uncomment the line below if email APIs crash during your live pitch
        // setSuccessMsg(`OTP Sent! ${data.demoOtp ? "(Demo OTP: " + data.demoOtp + ")" : ""}`);
        setSuccessMsg("OTP Sent securely. Please check your email.");
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP
  async function handleVerifyOTP(event) {
    event.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid OTP.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/farmers/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentFarmer(data.data);
        
        // Check if profile is complete (e.g. they have a registered village)
        if (!data.data.village) {
          // If not complete, go to settings page to complete profile
          navigate("/farmer/settings", { replace: true });
        } else {
          // If complete, go to dashboard
          navigate("/farmer/home", { replace: true });
        }

      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch (err) {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper" style={{ backgroundImage: `linear-gradient(rgba(244, 252, 240, 0.85), rgba(244, 252, 240, 0.95)), url(${ricePlanting})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }}>
      <Header showHelp={false} />
      <main className="login-container">
        <div className="login-back-row">
          <Link to="/" className="back-link">
            <ArrowLeft size={17} /> {t("common.back")}
          </Link>
        </div>

        <section className="login-layout">
          <div className="login-intro">
            <span className="page-eyebrow">{t("common.farmer")}</span>
            <h1>{t("auth.welcome")}</h1>
            <p>Access your procurement dashboard using OTP via Email.</p>

            <div className="login-feature-list">
              <div className="login-feature">
                <div className="login-feature-icon"><ShieldCheck size={19} /></div>
                <div>
                  <strong>Secure Passwordless Access</strong>
                  <span>No passwords to remember. Just use Email OTP.</span>
                </div>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon"><UserRound size={19} /></div>
                <div>
                  <strong>Complete your Profile</strong>
                  <span>We'll direct you to fill in land details if you are new!</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-form-card">
            <div className="login-form-heading">
              <div className="login-form-icon">
                {step === 1 ? <User size={22} /> : <Mail size={22} />}
              </div>
              <div>
                <span className="page-eyebrow">
                  {step === 1 ? "Authentication" : "Verification"}
                </span>
                <h2>{step === 1 ? "Sign In / Register" : "Enter OTP"}</h2>
                <p>
                  {step === 1
                    ? "Enter your details to get an OTP."
                    : `We sent a code to ${email}`}
                </p>
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOTP}>
                {/* NAME FIELD */}
                <div className="login-field" style={{ marginBottom: "16px" }}>
                  <label htmlFor="farmer-name">Full Name</label>
                  <div className="login-phone-input">
                    <span className="login-country"><User size={17} /></span>
                    <input
                      id="farmer-name"
                      type="text"
                      value={name}
                      placeholder="e.g. Ramesh Kumar"
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* EMAIL FIELD */}
                <div className="login-field" style={{ marginBottom: "16px" }}>
                  <label htmlFor="farmer-email">Email ID</label>
                  <div className="login-phone-input">
                    <span className="login-country"><Mail size={17} /></span>
                    <input
                      id="farmer-email"
                      type="email"
                      value={email}
                      placeholder="e.g. ramesh@example.com"
                      onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                      required
                    />
                  </div>
                </div>

                {/* PHONE FIELD */}
                <div className="login-field" style={{ marginBottom: "16px" }}>
                  <label htmlFor="farmer-phone">{t("auth.mobileNumber")}</label>
                  <div className="login-phone-input">
                    <span className="login-country">+91</span>
                    <input
                      id="farmer-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      placeholder={t("auth.phonePlaceholder")}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      required
                    />
                    {phone.length === 10 && <Check size={18} className="login-phone-check" />}
                  </div>
                </div>

                {error && <div className="login-error" role="alert">{error}</div>}

                <Button fullWidth type="submit" disabled={loading}>
                  {loading ? "Sending OTP..." : "Get OTP via Email"}
                  {!loading && <ArrowRight size={18} />}
                </Button>
              </form>
            ) : (
               <form onSubmit={handleVerifyOTP}>
                {/* OTP FIELD */}
                <div className="login-field" style={{ marginBottom: "16px" }}>
                  <label htmlFor="farmer-otp">Email OTP Code</label>
                  <div className="login-phone-input">
                    <span className="login-country"><ShieldCheck size={17} /></span>
                    <input
                      id="farmer-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      placeholder="Enter 6-digit OTP"
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && <div className="login-error" role="alert">{error}</div>}
                {successMsg && <div className="login-error" style={{background: "#ecfccb", color: "#4d7c0f", borderColor: "#d9f99d"}}>{successMsg}</div>}

                <Button fullWidth type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Log In"}
                  {!loading && <ArrowRight size={18} />}
                </Button>
                
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button 
                    type="button" 
                    onClick={() => { setStep(1); setError(""); setSuccessMsg(""); }}
                    style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: "600" }}
                  >
                    Change Email or Phone
                  </button>
                </div>
              </form>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}

export default FarmerLogin;
