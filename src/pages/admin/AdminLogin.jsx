import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";


import {
  Link,
  useNavigate,
} from "react-router";


import {
  useState,
} from "react";

import farmerPortrait from "../../assets/backgrounds/farmer-portrait.png";
import Logo from "../../components/Logo";

function AdminLogin() {

  const navigate =
    useNavigate();


  const [
    userId,
    setUserId,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);


  const [
    remember,
    setRemember,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  function handleSubmit(
    event
  ) {

    event.preventDefault();


    setError("");


    if (
      !userId.trim()
    ) {

      setError(
        "Enter your operator ID."
      );

      return;

    }


    if (
      !password
    ) {

      setError(
        "Enter your password."
      );

      return;

    }


    setLoading(true);


    /*
     * Prototype admin access.
     *
     * Later this can be replaced with a
     * real backend authentication endpoint.
     */

    setTimeout(() => {

      const validUser =
        userId.trim().toLowerCase() ===
        "admin";


      const validPassword =
        password ===
        "admin123";


      if (
        !validUser ||
        !validPassword
      ) {

        setError(
          "Invalid operator ID or password."
        );

        setLoading(false);

        return;

      }


      if (
        remember
      ) {

        localStorage.setItem(
          "krishisetu-admin-session",
          "active"
        );

      }


      navigate(
        "/admin/dashboard"
      );


    }, 650);

  }


  return (

    <div className="admin-login-page" style={{ backgroundImage: `linear-gradient(rgba(215, 238, 220, 0.85), rgba(215, 238, 220, 0.95)), url(${farmerPortrait})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }}>


      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <header className="admin-login-header">


        <Link
          to="/"
          className="admin-login-brand"
        >

          <Logo
            size={58}
          />


          <div>

            <strong>
              KrishiSetu
            </strong>


            <span>
              Operations Portal
            </span>

          </div>

        </Link>


        <Link
          to="/"
          className="admin-login-back"
        >

          <ArrowLeft
            size={15}
          />

          Main Portal

        </Link>

      </header>



      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="admin-login-container">


        <section className="admin-login-layout">


          {/* =================================================
              LEFT INFORMATION
          ================================================== */}

          <div className="admin-login-intro">


            <div className="admin-login-eyebrow-row">

              <span className="page-eyebrow">
                OPERATIONS ACCESS
              </span>


              <span className="admin-secure-pill">

                <span />

                Secure workspace

              </span>

            </div>


            <h1>

              Manage procurement
              <span>
                with clarity.
              </span>

            </h1>


            <p>

              Access the KrishiSetu operations
              workspace to monitor farmer bookings,
              manage the live queue, record weighing,
              complete procurement and process payments.

            </p>



            {/* =================================================
                FEATURE CARDS
            ================================================== */}

            <div className="admin-login-feature-grid">


              <AdminFeature
                icon={
                  <ClipboardList
                    size={20}
                  />
                }
                title="Live queue"
                text="See confirmed, arrived and late farmers in one operational view."
              />


              <AdminFeature
                icon={
                  <Users
                    size={20}
                  />
                }
                title="Farmer records"
                text="Open booking details and follow each farmer through the workflow."
              />


              <AdminFeature
                icon={
                  <CheckCircle2
                    size={20}
                  />
                }
                title="Procurement tracking"
                text="Record weighing, procurement completion and payment progress."
              />


              <AdminFeature
                icon={
                  <ShieldCheck
                    size={20}
                  />
                }
                title="Controlled access"
                text="The operations workspace is intended for authorised center staff."
              />

            </div>



            {/* =================================================
                WORKFLOW
            ================================================== */}

            <div className="admin-login-workflow">


              <div className="admin-login-workflow-heading">

                <span>
                  OPERATIONS WORKFLOW
                </span>


                <strong>
                  From arrival to payment
                </strong>

              </div>


              <div className="admin-workflow-steps">


                <WorkflowStep
                  number="01"
                  title="Queue"
                />


                <WorkflowLine />


                <WorkflowStep
                  number="02"
                  title="Arrival"
                />


                <WorkflowLine />


                <WorkflowStep
                  number="03"
                  title="Weighing"
                />


                <WorkflowLine />


                <WorkflowStep
                  number="04"
                  title="Payment"
                />

              </div>

            </div>

          </div>



          {/* =================================================
              LOGIN CARD
          ================================================== */}

          <div className="admin-login-card">


            <div className="admin-login-card-heading">


              <div className="admin-login-lock">

                <LockKeyhole
                  size={22}
                />

              </div>


              <div>

                <span className="page-eyebrow">
                  ADMIN LOGIN
                </span>


                <h2>
                  Welcome back.
                </h2>


                <p>
                  Sign in to continue to the operations dashboard.
                </p>

              </div>

            </div>



            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={
                handleSubmit
              }
            >


              <div className="admin-login-field">


                <label htmlFor="admin-user-id">
                  Operator ID
                </label>


                <div className="admin-login-input">


                  <Users
                    size={17}
                  />


                  <input
                    id="admin-user-id"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter operator ID"
                    value={
                      userId
                    }
                    onChange={(event) => {

                      setUserId(
                        event.target.value
                      );

                      setError("");

                    }}
                  />

                </div>


                <small>
                  Use your authorised center operator ID.
                </small>

              </div>



              <div className="admin-login-field">


                <label htmlFor="admin-password">
                  Password
                </label>


                <div className="admin-login-input">


                  <LockKeyhole
                    size={17}
                  />


                  <input
                    id="admin-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={
                      password
                    }
                    onChange={(event) => {

                      setPassword(
                        event.target.value
                      );

                      setError("");

                    }}
                  />


                  <button
                    type="button"
                    className="admin-show-password"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >

                    {
                      showPassword
                        ? "Hide"
                        : "Show"
                    }

                  </button>

                </div>


                <small>
                  Your password is used only for operator access.
                </small>

              </div>



              {error && (

                <div className="admin-login-error">

                  <ShieldCheck
                    size={16}
                  />


                  <span>
                    {error}
                  </span>

                </div>

              )}



              <label className="admin-remember-row">


                <input
                  type="checkbox"
                  checked={
                    remember
                  }
                  onChange={(event) =>
                    setRemember(
                      event.target.checked
                    )
                  }
                />


                <span>
                  Remember this device
                </span>

              </label>



              <button
                type="submit"
                className="admin-login-submit"
                disabled={
                  loading
                }
              >

                {loading ? (

                  <>

                    <span className="admin-login-spinner" />

                    Signing in...

                  </>

                ) : (

                  <>

                    Enter Operations Portal

                    <ArrowRight
                      size={18}
                    />

                  </>

                )}

              </button>

            </form>



            {/* =================================================
                DEMO ACCESS
            ================================================== */}

            <div className="admin-demo-box">


              <div className="admin-demo-icon">

                <Smartphone
                  size={18}
                />

              </div>


              <div>

                <span>
                  DEMO ACCESS
                </span>


                <strong>
                  Prototype operator account
                </strong>


                <p>
                  Operator ID: <b>admin</b>
                  {" · "}
                  Password: <b>admin123</b>
                </p>

              </div>

            </div>



            {/* =================================================
                SECURITY
            ================================================== */}

            <div className="admin-security-row">


              <ShieldCheck
                size={16}
              />


              <span>

                Authorised operations staff only.
                Activity in the prototype workspace
                is linked to the operational workflow.

              </span>

            </div>

          </div>

        </section>



        {/* =====================================================
            LOWER TRUST STRIP
        ====================================================== */}

       


      </main>



      <footer className="admin-login-footer">


        <div>

          <strong>
            KrishiSetu
          </strong>


          <span>
            Smart agricultural procurement
          </span>

        </div>


        <span>
          SIH Prototype · Operations Portal
        </span>

      </footer>

    </div>

  );
}


/* =========================================================
   FEATURE
========================================================= */

function AdminFeature({
  icon,
  title,
  text,
}) {

  return (

    <div className="admin-login-feature">


      <div className="admin-login-feature-icon">

        {icon}

      </div>


      <div>

        <strong>
          {title}
        </strong>


        <span>
          {text}
        </span>

      </div>

    </div>

  );

}


/* =========================================================
   WORKFLOW STEP
========================================================= */

function WorkflowStep({
  number,
  title,
}) {

  return (

    <div className="admin-workflow-step">


      <span>
        {number}
      </span>


      <strong>
        {title}
      </strong>

    </div>

  );

}


/* =========================================================
   WORKFLOW LINE
========================================================= */

function WorkflowLine() {

  return (
    <div className="admin-workflow-line" />
  );

}


export default AdminLogin;
