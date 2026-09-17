import { useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Database,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Wheat,
  X,, MessageSquareText } from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import { useLanguage } from "../../translations/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL;


function AdminFarmers() {

  const [farmers, setFarmers] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [selectedFarmer, setSelectedFarmer] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [cropFilter, setCropFilter] =
    useState("ALL");

  const {
  language,
} = useLanguage();

  const text =
    getFarmersCopy(language);


  const loadData =
    useCallback(
      async (manual = false) => {

        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {

          const [
            farmerResponse,
            bookingResponse,
          ] = await Promise.all([
            fetch(`${API_URL}/farmers`),
            fetch(`${API_URL}/bookings`),
          ]);


          const farmerData =
            await farmerResponse.json();

          const bookingData =
            await bookingResponse.json();


          if (
            !farmerResponse.ok
          ) {
            throw new Error(
              farmerData?.message ||
              "Unable to load farmers."
            );
          }


          if (
            !bookingResponse.ok
          ) {
            throw new Error(
              bookingData?.message ||
              "Unable to load booking data."
            );
          }


          setFarmers(
            Array.isArray(
              farmerData?.farmers
            )
              ? farmerData.farmers
              : []
          );


          setBookings(
            Array.isArray(
              bookingData?.bookings
            )
              ? bookingData.bookings
              : []
          );


          setError("");

        } catch (loadError) {

          console.error(
            "Admin farmers error:",
            loadError
          );

          setError(
            loadError?.message ||
            "Unable to connect to the backend."
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      []
    );


  useEffect(() => {

    loadData();

    const timer =
      setInterval(
        () => loadData(),
        10000
      );


    return () =>
      clearInterval(timer);

  }, [loadData]);


  const cropOptions =
    useMemo(
      () => [
        "ALL",
        ...Array.from(
          new Set(
            farmers
              .map(
                (farmer) =>
                  farmer.primary_crop
              )
              .filter(Boolean)
          )
        ),
      ],
      [farmers]
    );


  const farmerBookingMap =
    useMemo(() => {

      const map = {};

      bookings.forEach(
        (booking) => {

          if (!booking.farmer_id) {
            return;
          }

          if (!map[booking.farmer_id]) {
            map[booking.farmer_id] = [];
          }

          map[booking.farmer_id].push(
            booking
          );

        }
      );

      return map;

    }, [bookings]);


  const filteredFarmers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return farmers.filter(
        (farmer) => {

          if (
            cropFilter !== "ALL" &&
            farmer.primary_crop !==
              cropFilter
          ) {
            return false;
          }


          if (!query) {
            return true;
          }


          const searchable =
            [
              farmer.id,
              farmer.name,
              farmer.phone,
              farmer.village,
              farmer.state_id,
              farmer.district_id,
              farmer.mandal_id,
              farmer.primary_crop,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          return searchable.includes(
            query
          );

        }
      );

    }, [
      farmers,
      search,
      cropFilter,
    ]);


  const stats =
    useMemo(() => {

      const farmersWithBookings =
        farmers.filter(
          (farmer) =>
            (
              farmerBookingMap[
                farmer.id
              ] || []
            ).length > 0
        ).length;


      const totalQuantity =
        bookings.reduce(
          (
            total,
            booking
          ) => {

            const quantity =
              Number(
                booking.actual_quantity ||
                booking.estimated_quantity ||
                0
              );

            return (
              total +
              (
                Number.isFinite(
                  quantity
                )
                  ? quantity
                  : 0
              )
            );

          },
          0
        );


      return {
        total:
          farmers.length,

        withBookings:
          farmersWithBookings,

        bookings:
          bookings.length,

        quantity:
          totalQuantity,
      };

    }, [
      farmers,
      bookings,
      farmerBookingMap,
    ]);


  const selectedBookings =
    selectedFarmer
      ? (
          farmerBookingMap[
            selectedFarmer.id
          ] || []
        )
      : [];


  return (

    <AdminLayout
      title={text.title}
      subtitle={text.subtitle}
    >

      <div className="admin-farmers-page">


        <section className="admin-farmers-hero">

          <div>

            <span className="admin-page-eyebrow">
              {text.eyebrow}
            </span>

            <h2>
              {text.heading}
            </h2>

            <p>
              {text.description}
            </p>

          </div>


          <div className="admin-farmers-actions">

            <div className="admin-farmers-live">
              <Database size={14} />
              {text.liveData}
            </div>


            <button
              type="button"
              className="admin-farmers-refresh"
              onClick={() =>
                loadData(true)
              }
              disabled={refreshing}
            >

              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "admin-refresh-spin"
                    : ""
                }
              />

              {refreshing
                ? text.refreshing
                : text.refresh}

            </button>

          </div>

        </section>


        {error && (

          <div className="admin-farmers-error">

            <AlertTriangle size={17} />

            <div>
              <strong>
                {text.connectionIssue}
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                loadData(true)
              }
            >
              {text.retry}
            </button>

          </div>

        )}


        <section className="admin-farmer-kpi-grid">

          <FarmerKpi
            tone="blue"
            icon={<UserRound size={18} />}
            value={stats.total}
            label={text.totalFarmers}
          />

          <FarmerKpi
            tone="green"
            icon={<CheckCircle2 size={18} />}
            value={stats.withBookings}
            label={text.farmersWithBookings}
          />

          <FarmerKpi
            tone="purple"
            icon={<CalendarDays size={18} />}
            value={stats.bookings}
            label={text.totalBookings}
          />

          <FarmerKpi
            tone="gold"
            icon={<Wheat size={18} />}
            value={formatQuantity(stats.quantity)}
            suffix="kg"
            label={text.totalQuantity}
          />

        </section>


        <section className="admin-farmers-filter-panel">

          <div className="admin-farmers-search">

            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                text.searchPlaceholder
              }
            />

          </div>


          <div className="admin-farmers-filter">

            <Wheat size={14} />

            <select
              value={cropFilter}
              onChange={(event) =>
                setCropFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                {text.allCrops}
              </option>

              {cropOptions
                .filter(
                  (crop) =>
                    crop !== "ALL"
                )
                .map(
                  (crop) => (

                    <option
                      key={crop}
                      value={crop}
                    >
                      {
                        getCropName(
                          crop,
                          language
                        )
                      }
                    </option>

                  )
                )}

            </select>

          </div>


          {(search ||
            cropFilter !== "ALL") && (

            <button
              type="button"
              className="admin-farmers-clear"
              onClick={() => {
                setSearch("");
                setCropFilter("ALL");
              }}
            >
              <X size={13} />
              {text.clear}
            </button>

          )}

        </section>


        <section className="admin-farmers-table-panel">

          <div className="admin-farmers-table-header">

            <div>

              <span className="admin-page-eyebrow">
                {text.farmerDirectory}
              </span>

              <h3>
                {filteredFarmers.length}{" "}
                {text.records}
              </h3>

            </div>

            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{text.readOnly}</span>
              <button
                onClick={() => {
                  const msg = window.prompt("Enter SMS Broadcast Message for Farmers:\n(e.g., Heavy rain alert, procurement delay)");
                  if (msg) {
                    const btn = document.getElementById("broadcast-btn");
                    btn.innerText = "Sending...";
                    btn.disabled = true;
                    fetch(String(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "") + "/admin/farmers/broadcast", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`
                      },
                      body: JSON.stringify({ message: msg })
                    })
                    .then(r => r.json())
                    .then(data => {
                      alert(data.message);
                      btn.innerText = "Broadcast SMS";
                      btn.disabled = false;
                    })
                    .catch(e => {
                      alert("Error: " + e.message);
                      btn.innerText = "Broadcast SMS";
                      btn.disabled = false;
                    });
                  }
                }}
                id="broadcast-btn"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <MessageSquareText size={16} /> Broadcast SMS
              </button>
            </div>


          </div>


          <div className="admin-farmers-table">

            <div className="admin-farmers-table-head">

              <span>{text.farmer}</span>
              <span>{text.contact}</span>
              <span>{text.location}</span>
              <span>{text.primaryCrop}</span>
              <span>{text.activity}</span>
              <span>{text.action}</span>

            </div>


            {loading ? (

              <FarmerLoading />

            ) : filteredFarmers.length === 0 ? (

              <div className="admin-farmers-empty">

                <Search size={23} />

                <strong>
                  {text.noFarmers}
                </strong>

                <span>
                  {text.noFarmersText}
                </span>

              </div>

            ) : (

              filteredFarmers.map(
                (farmer) => {

                  const farmerBookings =
                    farmerBookingMap[
                      farmer.id
                    ] || [];


                  const latest =
                    [...farmerBookings].sort(
                      (
                        a,
                        b
                      ) =>
                        String(
                          b.created_at || ""
                        ).localeCompare(
                          String(
                            a.created_at || ""
                          )
                        )
                    )[0];


                  return (

                    <div
                      key={farmer.id}
                      className="admin-farmer-row"
                    >

                      <div className="admin-farmer-main-cell">

                        <div className="admin-farmer-large-avatar">
                          <UserRound size={16} />
                        </div>

                        <div>

                                                      <strong>
                              {farmer.name}
                              {farmer.kyc_verified && (
                                <span style={{ marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '2px', backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                                  <CheckCircle2 size={10} /> KYC Verified
                                </span>
                              )}
                            </strong>

                          <span>
                            {farmer.id}
                          </span>

                        </div>

                      </div>


                      <div className="admin-farmer-contact-cell">

                        <div>
                          <Phone size={12} />
                          <span>
                            {farmer.phone}
                          </span>
                        </div>

                      </div>


                      <div className="admin-farmer-location-cell">

                        <strong>
                          {farmer.village ||
                            "—"}
                        </strong>

                        <span>
                          {[
                            farmer.mandal_id,
                            farmer.district_id,
                            farmer.state_id,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "—"}
                        </span>

                      </div>


                      <div className="admin-farmer-crop-cell">

                        <div>

                          <Wheat size={13} />

                          <strong>
                            {
                              getCropName(
                                farmer.primary_crop,
                                language
                              )
                            }
                          </strong>

                        </div>

                      </div>


                      <div className="admin-farmer-activity-cell">

                        <strong>
                          {
                            farmerBookings.length
                          }
                        </strong>

                        <span>
                          {text.bookings}
                        </span>


                        {latest && (

                          <small>
                            {
                              getStatusLabel(
                                latest.status,
                                language
                              )
                            }
                          </small>

                        )}

                      </div>


                      <div>

                        <button
                          type="button"
                          className="admin-farmer-view-button"
                          onClick={() =>
                            setSelectedFarmer(
                              farmer
                            )
                          }
                        >

                          {text.view}

                          <ArrowRight
                            size={13}
                          />

                        </button>

                      </div>

                    </div>

                  );

                }
              )

            )}

          </div>

        </section>


        <div className="admin-farmers-footer">

          <span>
            {text.footer}
          </span>

          <span>
            {filteredFarmers.length}{" "}
            {text.displayed}
          </span>

        </div>


        {selectedFarmer && (

          <FarmerDrawer
            farmer={
              selectedFarmer
            }
            bookings={
              selectedBookings
            }
            language={
              language
            }
            text={
              text
            }
            onClose={() =>
              setSelectedFarmer(
                null
              )
            }
          />

        )}

      </div>

    </AdminLayout>

  );
}


/* =========================================================
   KPI
========================================================= */

function FarmerKpi({
  icon,
  tone,
  value,
  suffix,
  label,
}) {

  return (

    <div
      className={
        `admin-farmer-kpi ${tone}`
      }
    >

      <div className="admin-farmer-kpi-icon">
        {icon}
      </div>

      <div>

        <strong>
          {value}
          {suffix && (
            <small>
              {" "}
              {suffix}
            </small>
          )}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>

  );
}


/* =========================================================
   LOADING
========================================================= */

function FarmerLoading() {

  return (

    <div className="admin-farmer-loading">

      {[
        1,
        2,
        3,
        4,
        5,
      ].map(
        (item) => (

          <div
            key={item}
            className="admin-farmer-skeleton"
          >

            <span />
            <div>
              <span />
              <span />
            </div>
            <span />
            <span />
            <span />
            <span />

          </div>

        )
      )}

    </div>

  );
}


/* =========================================================
   DRAWER
========================================================= */

function FarmerDrawer({
  farmer,
  bookings,
  language,
  text,
  onClose,
}) {

  const totalQuantity =
    bookings.reduce(
      (
        total,
        booking
      ) =>
        total +
        Number(
          booking.actual_quantity ||
          booking.estimated_quantity ||
          0
        ),
      0
    );


  const totalPaid =
    bookings.reduce(
      (
        total,
        booking
      ) => {

        if (
          booking.status !==
          "PAYMENT_SENT"
        ) {
          return total;
        }

        return (
          total +
          Number(
            booking.payment_amount ||
            0
          )
        );

      },
      0
    );


  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(

    <div
      className="admin-farmer-modal-root"
      role="presentation"
    >

      <style>{`
        .admin-farmer-modal-root {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          z-index: 2147483646 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 5vh 5vw !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          isolation: isolate !important;
          pointer-events: auto !important;
        }

        .admin-farmer-modal-root .admin-farmer-drawer-overlay {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 0 !important;
          background: rgba(27, 47, 39, 0.30) !important;
          backdrop-filter: blur(7px) !important;
          -webkit-backdrop-filter: blur(7px) !important;
        }

        .admin-farmer-modal-root .admin-farmer-modal {
          position: relative !important;
          top: auto !important;
          right: auto !important;
          bottom: auto !important;
          left: auto !important;
          transform: none !important;

          width: min(920px, 90vw) !important;
          height: min(820px, 88vh) !important;
          max-width: 920px !important;
          max-height: 820px !important;
          min-width: 0 !important;
          min-height: 0 !important;

          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;

          display: flex !important;
          flex-direction: column !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;

          z-index: 1 !important;
          background: #fff !important;
          border: 1px solid #d8e6df !important;
          border-radius: 26px !important;
          box-shadow: 0 35px 95px rgba(18,56,41,.23), 0 10px 30px rgba(18,56,41,.12) !important;

          overscroll-behavior: contain !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: thin !important;
          scrollbar-color: #b8cabe transparent !important;
        }

        .admin-farmer-modal-root .admin-farmer-modal::-webkit-scrollbar {
          width: 8px !important;
        }

        .admin-farmer-modal-root .admin-farmer-modal::-webkit-scrollbar-thumb {
          background: #b8cabe !important;
          border-radius: 999px !important;
        }

        .admin-farmer-modal-root .admin-farmer-modal > .admin-farmer-drawer-header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          flex: 0 0 auto !important;
          background: rgba(255,255,255,.98) !important;
        }

        .admin-farmer-modal-root .admin-farmer-profile-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .admin-farmer-modal-root .admin-farmer-drawer-field {
          min-width: 0 !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }

        .admin-farmer-modal-root .admin-farmer-drawer-field > strong {
          max-width: 100% !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        @media (max-width: 720px) {
          .admin-farmer-modal-root {
            padding: 4vh 4vw !important;
          }

          .admin-farmer-modal-root .admin-farmer-modal {
            width: 92vw !important;
            height: 86vh !important;
            border-radius: 22px !important;
          }

          .admin-farmer-modal-root .admin-farmer-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        className="admin-farmer-drawer-overlay"
        onClick={
          onClose
        }
      />


      <aside
        className="admin-farmer-drawer admin-farmer-modal"
        role="dialog"
        aria-modal="true"
        aria-label={text.farmerProfile}
      >

        <div className="admin-farmer-drawer-header">

          <div>

            <span className="admin-page-eyebrow">
              {text.farmerProfile}
            </span>

            <h2>
              {farmer.name}
            </h2>

            <span>
              {farmer.id}
            </span>

          </div>


          <button
            type="button"
            className="admin-farmer-drawer-close"
            onClick={
              onClose
            }
          >
            <X size={18} />
          </button>

        </div>


        <div className="admin-farmer-profile-summary">

          <div className="admin-farmer-profile-avatar">
            <UserRound size={24} />
          </div>


          <div>

                          <strong>
                {farmer.name}
                {farmer.kyc_verified && (
                  <span style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    <CheckCircle2 size={14} /> Aadhaar Verified
                  </span>
                )}
              </strong>

            <span>
              {farmer.phone}
            </span>

          </div>

        </div>


        <div className="admin-farmer-profile-grid">

          <DrawerField
            label={text.phone}
            value={farmer.phone}
          />

          <DrawerField
            label={text.village}
            value={farmer.village || "—"}
          />

          <DrawerField
            label={text.state}
            value={farmer.state_id || "—"}
          />

          <DrawerField
            label={text.district}
            value={farmer.district_id || "—"}
          />

          <DrawerField
            label={text.mandal}
            value={farmer.mandal_id || "—"}
          />

          <DrawerField
            label={text.language}
            value={
              getLanguageName(
                farmer.language
              )
            }
          />

          <DrawerField
            label={text.primaryCrop}
            value={
              getCropName(
                farmer.primary_crop,
                language
              )
            }
          />

          <DrawerField
            label={text.estimatedQuantity}
            value={
              `${Number(
                farmer.estimated_quantity ||
                0
              ).toLocaleString()} kg`
            }
          />

        </div>


        <div className="admin-farmer-profile-stats">

          <div>
            <strong>
              {bookings.length}
            </strong>
            <span>
              {text.bookings}
            </span>
          </div>

          <div>
            <strong>
              {formatQuantity(
                totalQuantity
              )}
              kg
            </strong>
            <span>
              {text.totalQuantity}
            </span>
          </div>

          <div>
            <strong>
              {formatCurrency(
                totalPaid,
                language
              )}
            </strong>
            <span>
              {text.totalPaid}
            </span>
          </div>

        </div>


        <section className="admin-farmer-history">

          <div className="admin-farmer-history-heading">

            <div>
              <span className="admin-page-eyebrow">
                {text.history}
              </span>

              <h3>
                {text.bookingHistory}
              </h3>
            </div>

            <span>
              {bookings.length}
            </span>

          </div>


          {bookings.length === 0 ? (

            <div className="admin-farmer-history-empty">

              <CalendarDays size={20} />

              <span>
                {text.noBookingHistory}
              </span>

            </div>

          ) : (

            bookings
              .slice(0, 10)
              .map(
                (booking) => (

                  <div
                    key={booking.id}
                    className="admin-farmer-history-row"
                  >

                    <div className="admin-farmer-history-token">

                      #
                      {
                        booking.token ||
                        booking.id
                      }

                    </div>


                    <div>

                      <strong>
                        {
                          getCropName(
                            booking.crop,
                            language
                          )
                        }
                      </strong>

                      <span>
                        {
                          booking.date ||
                          "—"
                        }
                      </span>

                    </div>


                    <div>

                      <strong>
                        {
                          Number(
                            booking.actual_quantity ??
                            booking.estimated_quantity ??
                            0
                          ).toLocaleString()
                        }
                        {" kg"}
                      </strong>

                      <span>
                        {
                          getStatusLabel(
                            booking.status,
                            language
                          )
                        }
                      </span>

                    </div>

                  </div>

                )
              )

          )}

        </section>


        <div className="admin-farmer-drawer-footer">

          <button
            type="button"
            onClick={
              onClose
            }
          >
            {text.close}
          </button>

        </div>

      </aside>

    </div>,
    document.body
  );
}


function DrawerField({
  label,
  value,
}) {

  return (

    <div className="admin-farmer-drawer-field">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );
}


/* =========================================================
   HELPERS
========================================================= */

function getLanguageName(
  value
) {

  const names = {

    en:
      "English",

    hi:
      "हिन्दी",

    te:
      "తెలుగు",

  };


  return (
    names[value] ||
    value ||
    "English"
  );

}


function getCropName(
  crop,
  language
) {

  const names = {

    wheat: {
      en: "Wheat",
      hi: "गेहूं",
      te: "గోధుమ",
    },

    paddy: {
      en: "Paddy",
      hi: "धान",
      te: "వరి",
    },

    maize: {
      en: "Maize",
      hi: "मक्का",
      te: "మొక్కజొన్న",
    },

    cotton: {
      en: "Cotton",
      hi: "कपास",
      te: "పత్తి",
    },

  };


  return (
    names[crop]?.[language] ||
    names[crop]?.en ||
    crop ||
    "—"
  );

}


function getStatusTone(
  status
) {

  if (
    status === "ARRIVED"
  ) {
    return "blue";
  }

  if (
    status === "LATE"
  ) {
    return "orange";
  }

  if (
    status === "WEIGHING"
  ) {
    return "purple";
  }

  if (
    status === "PAYMENT_PENDING"
  ) {
    return "gold";
  }

  return "green";

}


function getStatusLabel(
  status,
  language
) {

  const labels = {

    en: {
      CONFIRMED: "Confirmed",
      ARRIVED: "Arrived",
      LATE: "Late",
      WEIGHING: "Weighing",
      PROCURED: "Procured",
      PAYMENT_PENDING: "Payment Pending",
      PAYMENT_SENT: "Payment Sent",
    },

    hi: {
      CONFIRMED: "पुष्टि",
      ARRIVED: "पहुंचे",
      LATE: "देर से",
      WEIGHING: "वजन",
      PROCURED: "खरीद पूरी",
      PAYMENT_PENDING: "भुगतान लंबित",
      PAYMENT_SENT: "भुगतान भेजा गया",
    },

    te: {
      CONFIRMED: "నిర్ధారించబడింది",
      ARRIVED: "చేరుకున్నారు",
      LATE: "ఆలస్యం",
      WEIGHING: "తూకం",
      PROCURED: "కొనుగోలు పూర్తైంది",
      PAYMENT_PENDING: "చెల్లింపు పెండింగ్",
      PAYMENT_SENT: "చెల్లింపు పంపబడింది",
    },

  };


  return (
    labels[language]?.[status] ||
    labels.en[status] ||
    status ||
    "Unknown"
  );

}


function formatQuantity(
  value
) {

  const number =
    Number(
      value || 0
    );


  if (
    number >= 1000000
  ) {

    return `${(
      number / 1000000
    ).toFixed(1)}M`;

  }


  if (
    number >= 1000
  ) {

    return `${(
      number / 1000
    ).toFixed(
      number >= 10000
        ? 0
        : 1
    )}K`;

  }


  return number.toLocaleString();

}


function formatCurrency(
  value,
  language
) {

  const number =
    Number(
      value || 0
    );


  if (
    !Number.isFinite(
      number
    )
  ) {
    return "₹0";
  }


  const locale =
    language === "hi"
      ? "hi-IN"
      : language === "te"
        ? "te-IN"
        : "en-IN";


  return new Intl.NumberFormat(
    locale,
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(
    number
  );

}


/* =========================================================
   COPY
========================================================= */

function getFarmersCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Farmer Directory",

      subtitle:
        "Review registered farmers, locations, preferences and procurement history.",

      eyebrow:
        "FARMER MANAGEMENT",

      heading:
        "Know every farmer connected to the center.",

      description:
        "Search the farmer registry, review profile information and inspect procurement history without changing operational records.",

      liveData:
        "LIVE DATA",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      connectionIssue:
        "Farmer data connection issue",

      retry:
        "Retry",

      totalFarmers:
        "Total farmers",

      farmersWithBookings:
        "Farmers with bookings",

      totalBookings:
        "Total bookings",

      totalQuantity:
        "Total quantity",

      searchPlaceholder:
        "Search name, phone, village or farmer ID...",

      allCrops:
        "All crops",

      clear:
        "Clear",

      farmerDirectory:
        "FARMER DIRECTORY",

      records:
        "records",

      readOnly:
        "Read-only view",

      farmer:
        "Farmer",

      contact:
        "Contact",

      location:
        "Location",

      primaryCrop:
        "Primary crop",

      activity:
        "Activity",

      action:
        "Action",

      bookings:
        "bookings",

      view:
        "View",

      noFarmers:
        "No farmers found",

      noFarmersText:
        "Try another search or crop filter.",

      footer:
        "Farmer information is read from the live KrishiSetu database.",

      displayed:
        "displayed",

      farmerProfile:
        "FARMER PROFILE",

      phone:
        "Phone",

      village:
        "Village",

      state:
        "State",

      district:
        "District",

      mandal:
        "Mandal",

      language:
        "Language",

      estimatedQuantity:
        "Estimated quantity",

      totalPaid:
        "Total paid",

      history:
        "PROCUREMENT HISTORY",

      bookingHistory:
        "Booking history",

      noBookingHistory:
        "This farmer has no booking history yet.",

      close:
        "Close",

    },


    hi: {

      title:
        "किसान डायरेक्टरी",

      subtitle:
        "पंजीकृत किसानों, स्थान, प्राथमिकताओं और खरीद इतिहास की समीक्षा करें।",

      eyebrow:
        "किसान प्रबंधन",

      heading:
        "केंद्र से जुड़े हर किसान की जानकारी रखें।",

      description:
        "किसान खोजें, प्रोफ़ाइल देखें और खरीद इतिहास देखें, बिना ऑपरेशनल रिकॉर्ड बदले।",

      liveData:
        "लाइव डेटा",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      connectionIssue:
        "किसान डेटा कनेक्शन समस्या",

      retry:
        "फिर कोशिश करें",

      totalFarmers:
        "कुल किसान",

      farmersWithBookings:
        "बुकिंग वाले किसान",

      totalBookings:
        "कुल बुकिंग",

      totalQuantity:
        "कुल मात्रा",

      searchPlaceholder:
        "नाम, फोन, गांव या किसान ID खोजें...",

      allCrops:
        "सभी फसलें",

      clear:
        "साफ करें",

      farmerDirectory:
        "किसान डायरेक्टरी",

      records:
        "रिकॉर्ड",

      readOnly:
        "केवल-पठन दृश्य",

      farmer:
        "किसान",

      contact:
        "संपर्क",

      location:
        "स्थान",

      primaryCrop:
        "प्राथमिक फसल",

      activity:
        "गतिविधि",

      action:
        "कार्रवाई",

      bookings:
        "बुकिंग",

      view:
        "देखें",

      noFarmers:
        "कोई किसान नहीं मिला",

      noFarmersText:
        "दूसरी खोज या फसल फ़िल्टर आज़माएं।",

      footer:
        "किसान जानकारी लाइव KrishiSetu डेटाबेस से पढ़ी जाती है।",

      displayed:
        "दिखाए गए",

      farmerProfile:
        "किसान प्रोफ़ाइल",

      phone:
        "फोन",

      village:
        "गांव",

      state:
        "राज्य",

      district:
        "जिला",

      mandal:
        "मंडल",

      language:
        "भाषा",

      estimatedQuantity:
        "अनुमानित मात्रा",

      totalPaid:
        "कुल भुगतान",

      history:
        "खरीद इतिहास",

      bookingHistory:
        "बुकिंग इतिहास",

      noBookingHistory:
        "इस किसान का अभी कोई बुकिंग इतिहास नहीं है।",

      close:
        "बंद करें",

    },


    te: {

      title:
        "రైతు డైరెక్టరీ",

      subtitle:
        "నమోదైన రైతులు, ప్రాంతాలు, ప్రాధాన్యతలు మరియు కొనుగోలు చరిత్రను సమీక్షించండి.",

      eyebrow:
        "రైతు నిర్వహణ",

      heading:
        "కేంద్రానికి సంబంధించిన ప్రతి రైతు వివరాలను తెలుసుకోండి.",

      description:
        "రైతులను వెతికి, ప్రొఫైల్ మరియు కొనుగోలు చరిత్రను చూడండి. ఆపరేషనల్ రికార్డులు మార్చబడవు.",

      liveData:
        "లైవ్ డేటా",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      connectionIssue:
        "రైతు డేటా కనెక్షన్ సమస్య",

      retry:
        "మళ్లీ ప్రయత్నించండి",

      totalFarmers:
        "మొత్తం రైతులు",

      farmersWithBookings:
        "బుకింగ్‌లు ఉన్న రైతులు",

      totalBookings:
        "మొత్తం బుకింగ్‌లు",

      totalQuantity:
        "మొత్తం పరిమాణం",

      searchPlaceholder:
        "పేరు, ఫోన్, గ్రామం లేదా రైతు ID వెతకండి...",

      allCrops:
        "అన్ని పంటలు",

      clear:
        "క్లియర్",

      farmerDirectory:
        "రైతు డైరెక్టరీ",

      records:
        "రికార్డులు",

      readOnly:
        "రీడ్-ఓన్లీ వీక్షణ",

      farmer:
        "రైతు",

      contact:
        "సంప్రదింపు",

      location:
        "స్థానం",

      primaryCrop:
        "ప్రధాన పంట",

      activity:
        "కార్యకలాపం",

      action:
        "చర్య",

      bookings:
        "బుకింగ్‌లు",

      view:
        "చూడండి",

      noFarmers:
        "రైతులు కనుగొనబడలేదు",

      noFarmersText:
        "మరో శోధన లేదా పంట ఫిల్టర్ ప్రయత్నించండి.",

      footer:
        "రైతు సమాచారం లైవ్ KrishiSetu డేటాబేస్ నుండి చదవబడుతుంది.",

      displayed:
        "చూపబడుతున్నవి",

      farmerProfile:
        "రైతు ప్రొఫైల్",

      phone:
        "ఫోన్",

      village:
        "గ్రామం",

      state:
        "రాష్ట్రం",

      district:
        "జిల్లా",

      mandal:
        "మండలం",

      language:
        "భాష",

      estimatedQuantity:
        "అంచనా పరిమాణం",

      totalPaid:
        "మొత్తం చెల్లింపు",

      history:
        "కొనుగోలు చరిత్ర",

      bookingHistory:
        "బుకింగ్ చరిత్ర",

      noBookingHistory:
        "ఈ రైతుకు ఇంకా బుకింగ్ చరిత్ర లేదు.",

      close:
        "మూసివేయండి",

    },

  };


  return (
    copy[language] ||
    copy.en
  );

}


export default AdminFarmers;