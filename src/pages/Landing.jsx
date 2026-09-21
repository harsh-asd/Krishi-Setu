
import {
  MessageCircle,
  Video,
  Camera,
  Users,
  Mail,
  Globe2,
  Phone,
  ArrowDown,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Coins,
  Leaf,
  MapPin,
  Menu,
  Scale,
  ShieldCheck,
  Smartphone,
  Wheat,
  Truck,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  useEffect,
  useState,
} from "react";

import Logo from "../components/Logo";
import IndianFlag from "../components/IndianFlag";
import cropsSunset from "../assets/backgrounds/crops-sunset.png";


function Landing() {
  const [
  isMobile,
  setIsMobile,
] = useState(
  () =>
    typeof window !== "undefined" &&
    window.matchMedia(
      "(max-width: 700px)"
    ).matches
);

useEffect(() => {

  const mediaQuery =
    window.matchMedia(
      "(max-width: 700px)"
    );

  function handleChange(event) {

    setIsMobile(
      event.matches
    );

  }

  mediaQuery.addEventListener(
    "change",
    handleChange
  );

  return () => {

    mediaQuery.removeEventListener(
      "change",
      handleChange
    );

  };

}, []);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);


  function closeMenu() {
    setMobileMenuOpen(false);
  }


  return (

    <div className="landing-page">


      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="landing-header">


        <Link
          to="/"
          className="landing-brand"
          onClick={closeMenu}
        >

          <Logo
            size={72}
            showName
          />

        </Link>


        <nav className="landing-nav">

          <a href="#purpose">
            Our Purpose
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#portals">
            Portals
          </a>

          <a href="#features">
            Features
          </a>

        </nav>


        <div className="landing-header-actions">

          <Link
            to="/farmer/login"
            className="landing-nav-farmer"
          >
            Farmer Portal
          </Link>


          <Link
            to="/transporter/login"
            className="landing-nav-admin landing-nav-transporter"
          >
            Transporter Portal
          </Link>

          <Link
            to="/admin/login"
            className="landing-nav-admin"
          >
            Operations
          </Link>

        </div>


        <button
          type="button"
          className="landing-mobile-menu-button"
          onClick={() =>
            setMobileMenuOpen(
              !mobileMenuOpen
            )
          }
          aria-label="Toggle navigation"
        >

          {mobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}

        </button>

      </header>


      {/* =====================================================
          MOBILE MENU
      ====================================================== */}

      {mobileMenuOpen && (

        <div className="landing-mobile-menu">

          <a
            href="#purpose"
            onClick={closeMenu}
          >
            Our Purpose
          </a>


          <a
            href="#how-it-works"
            onClick={closeMenu}
          >
            How It Works
          </a>


          <a
            href="#portals"
            onClick={closeMenu}
          >
            Portals
          </a>


          <a
            href="#features"
            onClick={closeMenu}
          >
            Features
          </a>


          <Link
            to="/farmer/login"
            onClick={closeMenu}
          >
            Farmer Portal
          </Link>


          <Link
            to="/transporter/login"
            onClick={closeMenu}
          >
            Transporter Portal
          </Link>

          <Link
            to="/admin/login"
            onClick={closeMenu}
          >
            Operations Portal
          </Link>

        </div>

      )}


      <main>


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="landing-hero">


          <div className="landing-hero-background" style={{
            backgroundImage: `linear-gradient(to bottom, rgba(244, 252, 240, 0.9), rgba(244, 252, 240, 0.98)), url(${cropsSunset})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 1
          }}>

            <div className="landing-glow landing-glow-one" />

            <div className="landing-glow landing-glow-two" />

            <div className="landing-grid-pattern" />

          </div>


          <div className="landing-hero-content">


            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
              <div className="landing-hero-badge" style={{ margin: 0, padding: '4px 12px' }}>
                <IndianFlag size={28} />
                <span style={{ fontWeight: "bold", letterSpacing: "0.5px", color: "#166534" }}>
                  PROUDLY MADE IN INDIA
                </span>
              </div>
              <div className="landing-hero-badge" style={{ margin: 0 }}>
                <Leaf size={17} />
                <span>DIGITAL PROCUREMENT FOR AGRICULTURE</span>
              </div>
            </div>


            <div className="landing-hero-logo">

              <Logo
                size={132}
                showName
              />

            </div>


            <h1>

              A simpler bridge

              <span>
                from farm to market.
              </span>

            </h1>


            <p className="landing-hero-description">

              KrishiSetu connects the full crop journey — from
              procurement booking and digital token to vehicle
              matching, trip tracking, center delivery and payment.

            </p>


            <div className="landing-hero-actions">

              <Link
                to="/farmer/login"
                className="landing-primary-button"
              >

                <Wheat size={21} />

                Enter Farmer Portal

                <ArrowRight size={18} />

              </Link>


              <a
                href="#how-it-works"
                className="landing-secondary-button"
              >

                See How It Works

                <ArrowDown size={18} />

              </a>

            </div>


            <div className="landing-hero-points">

              <div>
                <CheckCircle2 size={18} />

                <span>
                  Schedule your arrival
                </span>
              </div>


              <div>
                <CheckCircle2 size={18} />

                <span>
                  Get a digital token
                </span>
              </div>


              <div>
                <CheckCircle2 size={18} />

                <span>
                  Follow your payment
                </span>
              </div>

            </div>

            <div className="landing-hero-transport-note">

              <div className="landing-hero-transport-icon">
                <Truck size={18} />
              </div>

              <div>
                <strong>Need a vehicle?</strong>
                <span>
                  Arrange crop transport after booking and follow the trip from pickup to the procurement center.
                </span>
              </div>

            </div>

          </div>


          {/* ===================================================
              CIRCLE ANIMATION
              KEPT UNCHANGED
          ==================================================== */}

          {
  !isMobile && (

    <div className="landing-hero-visual">

      <LiveProcurementVisual />

    </div>

  )
}

        </section>


        {/* =====================================================
            TRUST STRIP
        ====================================================== */}

        <section className="landing-trust-strip scroll-reveal-group">

          <div className="scroll-reveal-item">
            <ShieldCheck size={20} />
            <span>Clear procurement status</span>
          </div>


          <div className="scroll-reveal-item">
            <CalendarCheck2 size={20} />
            <span>Scheduled arrival windows</span>
          </div>


          <div className="scroll-reveal-item">
            <Smartphone size={20} />
            <span>SMS-ready communication</span>
          </div>


          <div className="scroll-reveal-item">
            <Wheat size={20} />
            <span>Farmer-first experience</span>
          </div>

        </section>


        {/* =====================================================
            PURPOSE
        ====================================================== */}

        <section
          id="purpose"
          className="landing-purpose-section"
        >

          <div className="landing-section-heading scroll-reveal">

            <span>
              OUR PURPOSE
            </span>


            <h2>

              Procurement should feel

              <em>
                simple.
              </em>

            </h2>


            <p>

              Farmers should know where to go,
              when to arrive, what happens next
              and when their payment is complete.

            </p>

          </div>


          <div className="landing-purpose-grid scroll-reveal-group">


            <div className="purpose-card purpose-green scroll-reveal-item">

              <div className="purpose-card-number">
                01
              </div>


              <div className="purpose-card-icon">
                <Leaf size={30} />
              </div>


              <span>
                FOR FARMERS
              </span>


              <h3>
                Less uncertainty
              </h3>


              <p>

                Book a suitable procurement window
                and arrive with a clear digital token
                instead of waiting without knowing
                when your turn will come.

              </p>

            </div>


            <div className="purpose-card purpose-gold scroll-reveal-item">

              <div className="purpose-card-number">
                02
              </div>


              <div className="purpose-card-icon">
                <Scale size={30} />
              </div>


              <span>
                FOR PROCUREMENT
              </span>


              <h3>
                Better visibility
              </h3>


              <p>

                Give operators a clear view of the
                queue, weighing stage, procurement
                status and payment journey.

              </p>

            </div>


            <div className="purpose-card purpose-blue scroll-reveal-item">

              <div className="purpose-card-number">
                03
              </div>


              <div className="purpose-card-icon">
                <Smartphone size={30} />
              </div>


              <span>
                ONE CONNECTED SYSTEM
              </span>


              <h3>
                Information in one place
              </h3>


              <p>

                Connect the farmer's booking with
                operational actions so every important
                step follows the same record.

              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FLOW
        ====================================================== */}

        <section className="landing-stats-strip scroll-reveal">

          <div>
            <strong>01</strong>
            <span>Book</span>
          </div>


          <div className="stats-arrow">
            <ArrowRight size={20} />
          </div>


          <div>
            <strong>02</strong>
            <span>Token</span>
          </div>


          <div className="stats-arrow">
            <ArrowRight size={20} />
          </div>


          <div>
            <strong>03</strong>
            <span>Arrive</span>
          </div>


          <div className="stats-arrow">
            <ArrowRight size={20} />
          </div>


          <div>
            <strong>04</strong>
            <span>Weigh</span>
          </div>


          <div className="stats-arrow">
            <ArrowRight size={20} />
          </div>


          <div>
            <strong>05</strong>
            <span>Procure</span>
          </div>


          <div className="stats-arrow">
            <ArrowRight size={20} />
          </div>


          <div>
            <strong>06</strong>
            <span>Payment</span>
          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}

        <section
          id="how-it-works"
          className="landing-process-section"
        >

          <div className="landing-section-heading centered scroll-reveal">

            <span>
              HOW IT WORKS
            </span>


            <h2>

              From booking to payment,

              <em>
                every step is visible.
              </em>

            </h2>


            <p>
              One connected journey for the farmer
              and procurement team.
            </p>

          </div>


          <div className="landing-process-track scroll-reveal-group">


            <ProcessStep
              number="01"
              icon={<UserIcon />}
              title="Register"
              text="Create your farmer account with basic details and location."
              tone="green"
            />


            <ProcessConnector />


            <ProcessStep
              number="02"
              icon={<CalendarCheck2 size={28} />}
              title="Book a slot"
              text="Choose your crop, quantity, center and available arrival window."
              tone="gold"
            />


            <ProcessConnector />


            <ProcessStep
              number="03"
              icon={<ShieldCheck size={28} />}
              title="Receive token"
              text="Get a digital token that identifies your procurement booking."
              tone="blue"
            />


            <ProcessConnector />


            <ProcessStep
              number="04"
              icon={<MapPin size={28} />}
              title="Arrive"
              text="Come to your selected procurement center during your assigned window."
              tone="orange"
            />


            <ProcessConnector />


            <ProcessStep
              number="05"
              icon={<Scale size={28} />}
              title="Weigh"
              text="The procurement team records actual produce weight and quality."
              tone="green"
            />


            <ProcessConnector />


            <ProcessStep
              number="06"
              icon={<CheckCircle2 size={28} />}
              title="Procure"
              text="Your produce moves through a recorded procurement workflow."
              tone="blue"
            />


            <ProcessConnector />


            <ProcessStep
              number="07"
              icon={<Coins size={28} />}
              title="Payment"
              text="Follow the payment stage after procurement is completed."
              tone="gold"
              last
            />

          </div>

        </section>


        {/* =====================================================
            PORTALS
        ====================================================== */}

        <section
          id="portals"
          className="landing-portals-section"
        >

          <div className="landing-portals-intro scroll-reveal">

            <span>
              CHOOSE YOUR PATH
            </span>


            <h2>

              One platform.

              <br />

              <em>
                Three connected experiences.
              </em>

            </h2>


            <p>

              Farmers plan the visit, transporters move the crop,
              and procurement teams keep the journey visible from one system.

            </p>

          </div>


          <div className="landing-portal-guide scroll-reveal">

            <div>
              <span>01</span>
              <strong>Farmers</strong>
              <p>Plan procurement, request a vehicle and track your crop.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Transporters</strong>
              <p>Accept suitable jobs, move the crop and update the trip.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Operations</strong>
              <p>Monitor the queue, procurement and the connected workflow.</p>
            </div>

          </div>


          <div className="landing-portal-grid scroll-reveal-group">


            <Link
              to="/farmer/login"
              className="landing-portal-card farmer scroll-reveal-item"
            >

              <div className="portal-card-top">

                <div className="portal-number">
                  01
                </div>


                <div className="portal-card-icon">
                  <Wheat size={35} />
                </div>

              </div>


              <div className="portal-card-content">

                <span>
                  FARMER PORTAL
                </span>


                <h3>

                  Bring your produce.
                  <br />
                  We'll help plan the visit.

                </h3>


                <p>

                  Register, choose what you're bringing,
                  reserve a procurement window, receive
                  a token and follow the journey from
                  arrival to payment.

                </p>


                <div className="portal-card-features">

                  <span>
                    <CheckCircle2 size={16} />
                    Book a procurement slot
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Get a digital token
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Track your status
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Follow payment
                  </span>

                </div>

              </div>


              <div className="portal-card-action">

                <span>
                  Enter Farmer Portal
                </span>


                <div>
                  <ArrowRight size={21} />
                </div>

              </div>

            </Link>


            <Link
              to="/transporter/login"
              className="landing-portal-card transporter scroll-reveal-item"
            >

              <div className="portal-card-top">

                <div className="portal-number">
                  02
                </div>


                <div className="portal-card-icon">
                  <Truck size={35} />
                </div>

              </div>


              <div className="portal-card-content">

                <span>
                  TRANSPORTER PORTAL
                </span>


                <h3>

                  Move crops safely.
                  <br />
                  Keep every trip visible.

                </h3>


                <p>

                  Register your vehicle, set availability,
                  receive nearby transport jobs, accept trips,
                  update journey status and track your earnings.

                </p>


                <div className="portal-card-features">

                  <span>
                    <CheckCircle2 size={16} />
                    See suitable transport jobs
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Accept and manage trips
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Share live trip location
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Track earnings and history
                  </span>

                </div>

              </div>


              <div className="portal-card-action">

                <span>
                  Enter Transporter Portal
                </span>


                <div>
                  <ArrowRight size={21} />
                </div>

              </div>

            </Link>


            <Link
              to="/admin/login"
              className="landing-portal-card operations scroll-reveal-item"
            >

              <div className="portal-card-top">

                <div className="portal-number">
                  03
                </div>


                <div className="portal-card-icon">
                  <ShieldCheck size={35} />
                </div>

              </div>


              <div className="portal-card-content">

                <span>
                  OPERATIONS PORTAL
                </span>


                <h3>

                  See the queue.
                  <br />
                  Control the workflow.

                </h3>


                <p>

                  Monitor incoming bookings, manage the
                  arrival queue, record weighing, complete
                  procurement and maintain payment records.

                </p>


                <div className="portal-card-features">

                  <span>
                    <CheckCircle2 size={16} />
                    Monitor live queue
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Record actual weighing
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Complete procurement
                  </span>


                  <span>
                    <CheckCircle2 size={16} />
                    Track payments and reports
                  </span>

                </div>

              </div>


              <div className="portal-card-action">

                <span>
                  Enter Operations Portal
                </span>


                <div>
                  <ArrowRight size={21} />
                </div>

              </div>

            </Link>

          </div>


          <div className="landing-transport-bridge scroll-reveal">

            <div className="landing-transport-bridge-heading">
              <span>HOW TRANSPORT CONNECTS THE SYSTEM</span>
              <h3>One request. One vehicle. One visible journey.</h3>
              <p>Once a farmer needs a vehicle, KrishiSetu connects the request to suitable transporters and keeps the trip tied to the same crop journey.</p>
            </div>

            <div className="landing-transport-bridge-flow">
              <div>
                <span>01</span>
                <Truck size={20} />
                <strong>Request</strong>
                <small>Crop + quantity + pickup</small>
              </div>
              <ArrowRight className="bridge-arrow" size={20} />
              <div>
                <span>02</span>
                <MapPin size={20} />
                <strong>Match</strong>
                <small>Capacity + location + availability</small>
              </div>
              <ArrowRight className="bridge-arrow" size={20} />
              <div>
                <span>03</span>
                <Truck size={20} />
                <strong>Move</strong>
                <small>Pickup + live trip status</small>
              </div>
              <ArrowRight className="bridge-arrow" size={20} />
              <div>
                <span>04</span>
                <CheckCircle2 size={20} />
                <strong>Deliver</strong>
                <small>Procurement center + completion</small>
              </div>
            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURES
        ====================================================== */}

        <section
          id="features"
          className="landing-features-section"
        >

          <div className="landing-section-heading centered scroll-reveal">

            <span>
              THE KRISHISETU DIFFERENCE
            </span>


            <h2>

              Built around the

              <em>
                real journey.
              </em>

            </h2>


            <p>

              Important information stays visible from
              booking through payment.

            </p>

          </div>


          <div className="landing-feature-grid scroll-reveal-group">


            <FeatureCard
              icon={<CalendarCheck2 size={29} />}
              title="Scheduled arrivals"
              text="Give farmers a clear procurement date and arrival window."
              tone="green"
            />


            <FeatureCard
              icon={<ShieldCheck size={29} />}
              title="Digital identity"
              text="Each booking receives a unique token for quick identification."
              tone="blue"
            />


            <FeatureCard
              icon={<Scale size={29} />}
              title="Transparent weighing"
              text="Keep estimated quantity and actual weight clearly separated."
              tone="orange"
            />


            <FeatureCard
              icon={<Coins size={29} />}
              title="Payment visibility"
              text="Continue the journey into a visible payment stage."
              tone="gold"
            />


            <FeatureCard
              icon={<Smartphone size={29} />}
              title="Status updates"
              text="Keep farmers informed as their procurement status changes."
              tone="purple"
            />


            <FeatureCard
              icon={<MapPin size={29} />}
              title="Location-aware booking"
              text="Connect farmers with the relevant procurement center."
              tone="teal"
            />

          </div>

        </section>


        {/* =====================================================
            SUPPORT
        ====================================================== */}

        <section className="landing-support-section">

          <div className="landing-support-card scroll-reveal">

            <div className="landing-support-icon">

              <Smartphone size={32} />

            </div>


            <div>

              <span>
                BUILT FOR REAL FARMERS
              </span>


              <h2>

                Important updates should never
                depend on remembering a website.

              </h2>


              <p>

                KrishiSetu is designed around clear
                on-screen status and SMS-ready
                communication, making the procurement
                journey easier to follow.

              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ====================================================== */}

        <section className="landing-final-cta">


          <div className="landing-final-cta-content scroll-reveal">

            <span>
              READY TO GET STARTED?
            </span>


            <h2>

              Choose your

              <em>
                KrishiSetu journey.
              </em>

            </h2>


            <p>

              Start from the portal built for you.
              Farmers plan the visit, transporters move the crop,
              and operations teams manage the journey behind it.

            </p>


            <div className="landing-final-cta-actions">

              <Link
                to="/farmer/login"
                className="landing-final-farmer-button"
              >

                <Wheat size={21} />

                Farmer Portal

                <ArrowRight size={18} />

              </Link>


              <Link
                to="/transporter/login"
                className="landing-final-admin-button landing-final-transporter-button"
              >

                <Truck size={21} />

                Transporter Portal

                <ArrowRight size={18} />

              </Link>


              <Link
                to="/admin/login"
                className="landing-final-admin-button"
              >

                <ShieldCheck size={21} />

                Operations Portal

                <ArrowRight size={18} />

              </Link>

            </div>

          </div>


          <div className="landing-final-cta-decoration">

            <div>
              <Wheat size={105} />
            </div>


            <div>
              <Scale size={82} />
            </div>


            <div>
              <Coins size={74} />
            </div>

          </div>

        </section>

      </main>


      {/* =======================================================
          FOOTER
      ======================================================== */}

      <footer className="custom-green-footer">
  <div className="custom-green-footer-inner">
    
    <div className="custom-footer-col brand-col">
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
        <span style={{ color: "#4ade80", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>KRISHI</span>
        <span style={{ color: "#ea580c", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>SETU</span>
      </div>
      
      <p className="custom-footer-brand-text">
        Krishisetu is one of the largest and innovative Indian full-stack AgriTech platforms transforming agriculture in India.
      </p>
      
      <div className="custom-footer-contact">
        <div className="custom-footer-icon-circle">
          <Phone size={14} />
        </div>
        <span>+91 9125428551</span>
      </div>
      
      <div className="custom-footer-contact">
        <div className="custom-footer-icon-circle">
          <Globe2 size={14} />
        </div>
        <span>krishisetu-937n.onrender.com</span>
      </div>
      
      <div className="custom-footer-contact">
        <div className="custom-footer-icon-circle">
          <Mail size={14} />
        </div>
        <span>blizardsasd@gmail.com</span>
      </div>
    </div>
    
    <div className="custom-footer-col">
      <h3>Quick Links</h3>
      <ul className="custom-footer-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About Us</Link></li>
        <li><a href="#portals">Services</a></li>
        <li><a href="#portals">Products</a></li>
        <li><Link to="/brands">Brands</Link></li>
      </ul>
    </div>
    
    <div className="custom-footer-col">
      <h3>Support</h3>
      <ul className="custom-footer-links">
        <li><Link to="/blog">Blog</Link></li>
        <li><Link to="/faq">FAQ</Link></li>
        <li><Link to="/contact">Contact Us</Link></li>
        <li><Link to="/team">Team</Link></li>
        <li><Link to="/security">Security</Link></li>
      </ul>
    </div>
    
    <div className="custom-footer-col">
      <h3>Policies</h3>
      <ul className="custom-footer-links">
        <li><Link to="/privacy">Privacy Policy</Link></li>
        <li><Link to="/refund">Return & Refund</Link></li>
        <li><Link to="/delivery">Delivery Policy</Link></li>
        <li><Link to="/terms">Terms of Service</Link></li>
        <li><Link to="/vendor">Vendor Agreement</Link></li>
      </ul>
    </div>
    
    <div className="custom-footer-col">
      <h3>Social Media</h3>
      <div className="custom-footer-social">
  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><Users size={16} /></a>
  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><Camera size={16} /></a>
  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><Video size={16} /></a>
  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /></a>
</div>
    </div>
    
  </div>
  
  <div className="custom-footer-bottom">
    Copyright © 2026 Krishisetu
  </div>
</footer>

    </div>
  );
}


/* =========================================================
   PROCESS STEP
========================================================= */

function ProcessStep({
  number,
  icon,
  title,
  text,
  tone,
  last = false,
}) {

  return (

    <div
      className={
        `landing-process-step tone-${tone} ${
          last ? "last" : ""
        } scroll-reveal-item`
      }
    >

      <div className="process-step-top">

        <span>
          {number}
        </span>


        <div className="process-step-icon">

          {icon}

        </div>

      </div>


      <h3>
        {title}
      </h3>


      <p>
        {text}
      </p>

    </div>

  );

}


/* =========================================================
   PROCESS CONNECTOR
========================================================= */

function ProcessConnector() {

  return (

    <div className="landing-process-connector">

      <ArrowRight size={20} />

    </div>

  );

}


/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon,
  title,
  text,
  tone,
}) {

  return (

    <div
      className={
        `landing-feature-card tone-${tone} scroll-reveal-item`
      }
    >

      <div className="landing-feature-icon">

        {icon}

      </div>


      <div>

        <h3>
          {title}
        </h3>


        <p>
          {text}
        </p>

      </div>

    </div>

  );

}
/* =========================================================
   PREMIUM FULL-SCREEN ORBITAL VISUAL
========================================================= */

function LiveProcurementVisual() {

  const [
    currentTime,
    setCurrentTime,
  ] = useState(
    new Date()
  );


  useEffect(() => {

    const timer =
      setInterval(
        () => {
          setCurrentTime(
            new Date()
          );
        },
        1000
      );


    return () =>
      clearInterval(
        timer
      );

  }, []);


  const hours =
    currentTime.getHours();


  const minutes =
    currentTime.getMinutes();


  const seconds =
    currentTime.getSeconds();


  const secondAngle =
    seconds * 6;


  const minuteAngle =
    minutes * 6 +
    seconds * 0.1;


  const hourAngle =
    (
      hours % 12
    ) * 30 +
    minutes * 0.5;


  return (

    <div className="landing-orbital-visual">


      {/* =====================================================
          HUGE BACKGROUND ORBITS
      ====================================================== */}

      <div className="orbital-field">


        <div
          className="orbital-ring ring-one"
        />

        <div
          className="orbital-ring ring-two"
        />

        <div
          className="orbital-ring ring-three"
        />

        <div
          className="orbital-ring ring-four"
        />

        <div
          className="orbital-ring ring-five"
        />


        <div className="orbital-glow glow-one" />

        <div className="orbital-glow glow-two" />

        <div className="orbital-glow glow-three" />

      </div>


      {/* =====================================================
          MOVING LIGHT PARTICLES
      ====================================================== */}

      <div className="orbital-particle particle-one" />

      <div className="orbital-particle particle-two" />

      <div className="orbital-particle particle-three" />

      <div className="orbital-particle particle-four" />

      <div className="orbital-particle particle-five" />

      <div className="orbital-particle particle-six" />


      {/* =====================================================
          SOFT CENTRAL CLOCK
      ====================================================== */}

      <div className="orbital-clock">


        <div className="orbital-clock-face">


          <div
            className="orbital-clock-hand clock-hour-hand"
            style={{
              transform:
                `rotate(${hourAngle}deg)`,
            }}
          />


          <div
            className="orbital-clock-hand clock-minute-hand"
            style={{
              transform:
                `rotate(${minuteAngle}deg)`,
            }}
          />


          <div
            className="orbital-clock-hand clock-second-hand"
            style={{
              transform:
                `rotate(${secondAngle}deg)`,
            }}
          />


          <div className="orbital-clock-dot" />


          <span className="orbital-clock-mark mark-12">
            12
          </span>

          <span className="orbital-clock-mark mark-3">
            3
          </span>

          <span className="orbital-clock-mark mark-6">
            6
          </span>

          <span className="orbital-clock-mark mark-9">
            9
          </span>

        </div>


        <span className="orbital-clock-label">
          LIVE
        </span>

      </div>


      {/* =====================================================
          FLOATING STATUS CARDS
      ====================================================== */}

      <div className="orbital-status-card orbital-status-one">

        <div className="orbital-status-icon">
          <Wheat size={18} />
        </div>


        <div>
          <span>
            FARM
          </span>

          <strong>
            Produce ready
          </strong>
        </div>

      </div>


      <div className="orbital-status-card orbital-status-two">

        <div className="orbital-status-icon">
          <ShieldCheck size={18} />
        </div>


        <div>
          <span>
            TOKEN
          </span>

          <strong>
            #B018
          </strong>
        </div>

      </div>


      <div className="orbital-status-card orbital-status-three">

        <div className="orbital-status-icon">
          <Scale size={18} />
        </div>


        <div>
          <span>
            WEIGHING
          </span>

          <strong>
            248 kg
          </strong>
        </div>

      </div>


      <div className="orbital-status-card orbital-status-four">

        <div className="orbital-status-icon">
          <MapPin size={18} />
        </div>


        <div>
          <span>
            CENTER
          </span>

          <strong>
            ARRIVAL
          </strong>
        </div>

      </div>


      <div className="orbital-status-card orbital-status-five">

        <div className="orbital-status-icon">
          <Coins size={18} />
        </div>


        <div>
          <span>
            PAYMENT
          </span>

          <strong>
            TRACKED
          </strong>
        </div>

      </div>


      {/* =====================================================
          LIVE SYSTEM LABEL
      ====================================================== */}

      <div className="orbital-live-indicator">

        <span />

        LIVE PROCUREMENT FLOW

      </div>


      <div className="orbital-digital-time">

        {
          currentTime.toLocaleTimeString(
            "en-IN",
            {
              hour:
                "2-digit",

              minute:
                "2-digit",

              second:
                "2-digit",
            }
          )
        }

      </div>

    </div>

  );

}

/* =========================================================
   USER ICON
========================================================= */

function UserIcon() {

  return (

    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path d="M20 21a8 8 0 0 0-16 0" />


      <circle
        cx="12"
        cy="7"
        r="4"
      />

    </svg>

  );

}


export default Landing;
