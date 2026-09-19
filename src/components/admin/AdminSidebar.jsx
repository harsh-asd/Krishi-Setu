import {
  Radio,
  BarChart3,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Scale,
  Settings,
  Truck,
  Users,
  Wheat,
  X,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Logo from "../Logo";

import {
  useLanguage,
} from "../../translations/LanguageContext";


function AdminSidebar({
  open = false,
  onClose,
}) {

  const location =
    useLocation();

  const {
    t,
  } = useLanguage();

  const [centerCount, setCenterCount] =
    useState({
      total: 0,
      active: 0,
    });

  const API_URL =
    String(
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000/api"
    ).replace(/\/+$/, "");


  /* =========================================================
     CENTER NETWORK SUMMARY
     This is intentionally NOT an "active center" selector.
     The central admin manages the full procurement network.
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadCenterSummary() {
      try {
        const response = await fetch(
          `${API_URL}/centers`
        );

        if (!response.ok) {
          return;
        }

        const payload =
          await response.json();

        const centers =
          Array.isArray(payload?.centers)
            ? payload.centers
            : [];

        if (cancelled) {
          return;
        }

        const active = centers.filter(
          center =>
            Number(
              center?.active ??
              1
            ) === 1
        ).length;

        setCenterCount({
          total: centers.length,
          active,
        });
      } catch {
        // Sidebar must remain usable even when the API is temporarily unavailable.
      }
    }

    loadCenterSummary();

    return () => {
      cancelled = true;
    };
  }, [API_URL]);


  const transportTranslation =
    t("admin.transport");

  const transportLabel =
    transportTranslation &&
    transportTranslation !== "admin.transport"
      ? transportTranslation
      : "Transport";


  const centerSummary =
    useMemo(() => {
      if (!centerCount.total) {
        return "Center network";
      }

      if (centerCount.active === centerCount.total) {
        return `${centerCount.total} centers • all operational`;
      }

      return `${centerCount.active} active of ${centerCount.total} centers`;
    }, [centerCount]);


  const navigation = [

    {
      section:
        "OPERATIONS",

      items: [

        {
          label:
            t("admin.dashboard"),

          path:
            "/admin/dashboard",

          icon:
            LayoutDashboard,
        },

        {
          label:
            t("admin.liveQueue"),

          path:
            "/admin/queue",

          icon:
            ClipboardList,
        },

        {
          label:
            t("admin.weighing"),

          path:
            "/admin/weighing",

          icon:
            Scale,
        },

        {
          label:
            t("admin.procurement"),

          path:
            "/admin/procurement",

          icon:
            Wheat,
        },
        
        {
          label: "IoT Monitoring",
          path: "/admin/iot",
          icon: Radio,
        },

        {
          label:
            transportLabel,

          path:
            "/admin/transport",

          icon:
            Truck,
        },

        {
          label:
            t("admin.payments"),
          path:
            "/admin/payments",
          icon:
            CreditCard,
        },
        {
          label:
            "Payment Issues",
          path:
            "/admin/payment-issues",
          icon:
            FileText,
        },

      ],
    },


    {
      section:
        "MANAGEMENT",

      items: [

        {
          label:
            t("admin.farmers"),

          path:
            "/admin/farmers",

          icon:
            Users,
        },

        {
          label:
            t("admin.centers"),

          path:
            "/admin/centers",

          icon:
            MapPin,
        },

        {
          label:
            t("admin.reports"),

          path:
            "/admin/reports",

          icon:
            BarChart3,
        },

      ],
    },


    {
      section:
        "SYSTEM",

      items: [

        {
          label:
            t("admin.activityLog"),

          path:
            "/admin/activity",

          icon:
            FileText,
        },

        {
          label:
            t("admin.settings"),

          path:
            "/admin/settings",

          icon:
            Settings,
        },

      ],
    },

  ];


  function isActive(
    path
  ) {

    if (
      path ===
      "/admin/dashboard"
    ) {

      return (
        location.pathname ===
        path
      );

    }


    return location.pathname.startsWith(
      path
    );

  }


  return (

    <>
      {open && (

        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={
            onClose
          }
          aria-label="Close navigation"
        />

      )}


      <aside
        className={
          `admin-sidebar ${
            open
              ? "open"
              : ""
          }`
        }
        style={{
          height: "100dvh",
          maxHeight: "100dvh",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >


        <div
          className="admin-sidebar-top"
          style={{
            flexShrink: 0,
          }}
        >


          <Link
            to="/admin/dashboard"
            className="admin-sidebar-brand"
            onClick={
              onClose
            }
          >

            <Logo
              size={48}
            />

            <div>

              <strong>
                KrishiSetu
              </strong>


              <span>
                Operations
              </span>

            </div>

          </Link>


          <button
            type="button"
            className="admin-sidebar-close"
            onClick={
              onClose
            }
            aria-label="Close menu"
          >

            <X size={18} />

          </button>

        </div>



        {/* =====================================================
            ADMIN WORKSPACE CONTEXT
            No fake "active center" — this admin is network-level.
        ====================================================== */}

        <Link
          to="/admin/centers"
          className="admin-center-selector"
          onClick={
            onClose
          }
          title="Open procurement center management"
          style={{
            flexShrink: 0,
            textDecoration: "none",
          }}
        >

          <div className="admin-center-selector-icon">

            <MapPin
              size={16}
            />

          </div>


          <div>

            <span>
              PROCUREMENT NETWORK
            </span>


            <strong>
              All Centers
            </strong>


            <small
              style={{
                display: "block",
                marginTop: "3px",
                fontSize: "11px",
                lineHeight: 1.3,
                opacity: 0.72,
              }}
            >
              {centerSummary}
            </small>

          </div>

        </Link>



        <nav
          className="admin-sidebar-nav"
          aria-label="Admin navigation"
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            scrollbarGutter: "stable",
          }}
        >


          {navigation.map(
            (group) => (

              <div
                key={
                  group.section
                }
                className="admin-sidebar-group"
              >

                <span className="admin-sidebar-section">
                  {group.section}
                </span>


                <div className="admin-sidebar-items">

                  {group.items.map(
                    (item) => {

                      const Icon =
                        item.icon;


                      const active =
                        isActive(
                          item.path
                        );


                      return (

                        <Link
                          key={
                            item.path
                          }
                          to={
                            item.path
                          }
                          onClick={
                            onClose
                          }
                          className={
                            `admin-sidebar-link ${
                              active
                                ? "active"
                                : ""
                            }`
                          }
                          aria-current={
                            active
                              ? "page"
                              : undefined
                          }
                        >

                          <Icon
                            size={17}
                          />


                          <span>
                            {item.label}
                          </span>


                          {active && (

                            <span className="admin-sidebar-active-dot" />

                          )}

                        </Link>

                      );

                    }
                  )}

                </div>

              </div>

            )
          )}

        </nav>



        <div
          className="admin-sidebar-bottom"
          style={{
            flexShrink: 0,
          }}
        >


          <div className="admin-sidebar-status">

            <span />


            <div>

              <strong>
                System Online
              </strong>


              <small>
                Database connected
              </small>

            </div>

          </div>


          <Link
            to="/admin/login"
            className="admin-sidebar-logout"
            onClick={
              onClose
            }
          >

            <LogOut
              size={16}
            />

            Logout

          </Link>

        </div>


      </aside>

    </>

  );
}


export default AdminSidebar;
