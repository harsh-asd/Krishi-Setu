import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Scale,
  TicketCheck,
  UserRound,
  Wheat,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import { useLanguage } from "../../translations/LanguageContext";


const API_URL =
  import.meta.env.VITE_API_URL;


function AdminWeighing() {

  const [
    bookings,
    setBookings,
  ] = useState([]);


  const [
    selectedBooking,
    setSelectedBooking,
  ] = useState(null);


  const [
    search,
    setSearch,
  ] = useState("");


  const {
  language,
} = useLanguage();


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");
  const [moistureContent, setMoistureContent] = useState("");
  const [impurityContent, setImpurityContent] = useState("");
  const [cropGrade, setCropGrade] = useState("");

  const [
    actualQuantity,
    setActualQuantity,
  ] = useState("");


  const [
    quality,
    setQuality,
  ] = useState("");


  const [
    notes,
    setNotes,
  ] = useState("");


  const [
    rate,
    setRate,
  ] = useState("");


  const [
    adjustment,
    setAdjustment,
  ] = useState("0");


  const text =
    getWeighingCopy(
      language
    );


  const loadBookings =
    useCallback(
      async (
        manual = false
      ) => {

        if (
          manual
        ) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        try {

          const response =
            await fetch(
              `${API_URL}/bookings`
            );


          const data =
            await response.json();


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              text.loadError
            );

          }


          const rows =
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : [];


          setBookings(
            rows
          );


          setError("");


        } catch (
          loadError
        ) {

          console.error(
            "Admin weighing error:",
            loadError
          );


          setError(
            loadError?.message ||
            text.loadError
          );

        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      [
        text.loadError,
      ]
    );


  useEffect(() => {

    loadBookings();


    function handleExternalRefresh() {

      loadBookings(
        true
      );

    }


    window.addEventListener(
      "krishisetu-admin-refresh",
      handleExternalRefresh
    );


    const timer =
      setInterval(
        () =>
          loadBookings(),
        5000
      );


    


    return () => {

      clearInterval(
        timer
      );


      

    };

  }, [
    loadBookings,
  ]);


  const weighingBookings =
    useMemo(
      () =>
        bookings.filter(
          (
            booking
          ) =>
            [
              "ARRIVED",
              "LATE",
              "WEIGHING",
            ].includes(
              booking.status
            )
        ),
      [
        bookings,
      ]
    );


  const readyBookings =
    useMemo(
      () =>
        weighingBookings.filter(
          (
            booking
          ) =>
            booking.actual_quantity === null ||
            booking.actual_quantity === undefined
        ),
      [
        weighingBookings,
      ]
    );


  const completedBookings =
    useMemo(
      () =>
        bookings.filter(
          (
            booking
          ) =>
            booking.actual_quantity !== null &&
            booking.actual_quantity !== undefined
        ),
      [
        bookings,
      ]
    );


  const filteredBookings =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return weighingBookings.filter(
          (
            booking
          ) => {

            if (
              !query
            ) {

              return true;

            }


            const searchable =
              [
                booking.id,
                booking.token,
                booking.farmer_name,
                booking.farmer_phone,
                booking.farmer_village,
                booking.crop,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchable.includes(
              query
            );

          }
        );

      },
      [
        weighingBookings,
        search,
      ]
    );


  useEffect(() => {

    if (
      !selectedBooking
    ) {

      setActualQuantity("");
      setQuality("");
      setMoistureContent("");
      setImpurityContent("");
      setCropGrade("");
      setNotes("");
      setRate("");
      setAdjustment("0");

      return;

    }


    setActualQuantity(
      selectedBooking.actual_quantity ??
      ""
    );


    setQuality(
      selectedBooking.quality ||
      ""
    );


    setNotes("");


    setRate(
      selectedBooking.payment_rate_per_kg ??
      ""
    );


    setAdjustment(
      "0"
    );


    setSuccess("");
    setError("");

  }, [
    selectedBooking,
  ]);


  async function moveToWeighing() {

    if (
      !selectedBooking
    ) {
      return;
    }


    setSaving(true);
    setError("");
    setSuccess("");


    try {

      const response =
        await fetch(
          `${API_URL}/bookings/${encodeURIComponent(
            selectedBooking.id
          )}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  "WEIGHING",
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          text.statusError
        );

      }


      setSuccess(
        text.movedToWeighing
      );


      await loadBookings(
        true
      );


      setSelectedBooking(
        (
          current
        ) =>
          current
            ? {
                ...current,
                status:
                  "WEIGHING",
              }
            : current
      );


    } catch (
      statusError
    ) {

      console.error(
        "Move to weighing error:",
        statusError
      );


      setError(
        statusError?.message ||
        text.statusError
      );

    } finally {

      setSaving(false);

    }

  }


  async function saveWeight() {

    if (
      !selectedBooking
    ) {
      return;
    }


    const quantity =
      Number(
        actualQuantity
      );


    if (
      !Number.isFinite(
        quantity
      ) ||
      quantity <= 0
    ) {

      setError(
        text.invalidQuantity
      );

      return;

    }


    setSaving(true);
    setError("");
    setSuccess("");


    try {

      const response =
        await fetch(
          `${API_URL}/bookings/${encodeURIComponent(
            selectedBooking.id
          )}/weigh`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                actualQuantity: quantity,
moistureContent: moistureContent || null,
impurityContent: impurityContent || null,
cropGrade: cropGrade || quality || null,

                quality:
                  quality ||
                  null,

                notes:
                  notes.trim() ||
                  null,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          text.saveError
        );

      }


      setSuccess(
        text.weighingSaved
      );


      await loadBookings(
        true
      );


      setSelectedBooking(
        (
          current
        ) =>
          current
            ? {
                ...current,
                actual_quantity:
                  quantity,
                quality:
                  quality ||
                  null,
                status:
                  "WEIGHING",
              }
            : current
      );


    } catch (
      weighingError
    ) {

      console.error(
        "Save weight error:",
        weighingError
      );


      setError(
        weighingError?.message ||
        text.saveError
      );

    } finally {

      setSaving(false);

    }

  }


  async function completeProcurement() {

    if (
      !selectedBooking
    ) {
      return;
    }


    const quantity =
      Number(
        actualQuantity
      );


    const numericRate =
      Number(
        rate
      );


    const numericAdjustment =
      Number(
        adjustment ||
        0
      );


    if (
      !Number.isFinite(
        quantity
      ) ||
      quantity <= 0
    ) {

      setError(
        text.invalidQuantity
      );

      return;

    }


    if (
      !Number.isFinite(
        numericRate
      ) ||
      numericRate <= 0
    ) {

      setError(
        text.invalidRate
      );

      return;

    }


    if (
      !Number.isFinite(
        numericAdjustment
      )
    ) {

      setError(
        text.invalidAdjustment
      );

      return;

    }


    setSaving(true);
    setError("");
    setSuccess("");


    try {

      /*
       * Make sure the latest weight is saved first.
       */

      if (
        selectedBooking.actual_quantity !==
        quantity
      ) {

        const weighResponse =
          await fetch(
            `${API_URL}/bookings/${encodeURIComponent(
              selectedBooking.id
            )}/weigh`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  actualQuantity:
                    quantity,

                  quality:
                    quality ||
                    null,

                  notes:
                    notes.trim() ||
                    null,
                }),
            }
          );


        const weighData =
          await weighResponse.json();


        if (
          !weighResponse.ok
        ) {

          throw new Error(
            weighData?.message ||
            text.saveError
          );

        }

      }


      const response =
        await fetch(
          `${API_URL}/bookings/${encodeURIComponent(
            selectedBooking.id
          )}/procure`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                rate:
                  numericRate,

                adjustment:
                  numericAdjustment,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          text.procurementError
        );

      }


      const finalAmount =
        Number(
          data?.booking?.payment_amount ||
          quantity *
            numericRate +
            numericAdjustment
        );


      setSuccess(
        `${text.procurementSaved} ₹${finalAmount.toLocaleString(
          "en-IN",
          {
            maximumFractionDigits:
              2,
          }
        )}`
      );


      await loadBookings(
        true
      );


      setSelectedBooking(
        (
          current
        ) =>
          current
            ? {
                ...current,

                actual_quantity:
                  quantity,

                quality:
                  quality ||
                  null,

                status:
                  "PAYMENT_PENDING",

                payment_amount:
                  finalAmount,

                payment_rate_per_kg:
                  numericRate,

              }
            : current
      );


    } catch (
      procurementError
    ) {

      console.error(
        "Procurement error:",
        procurementError
      );


      setError(
        procurementError?.message ||
        text.procurementError
      );

    } finally {

      setSaving(false);

    }

  }


  return (

    <AdminLayout
      title={
        text.title
      }
      subtitle={
        text.subtitle
      }
    >

      <div className="admin-weighing-page">


        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="admin-weighing-hero">


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


          <div className="admin-weighing-hero-actions">


            <div className="admin-weighing-live">

              <span />

              {text.live}

            </div>


            <button
              type="button"
              className="admin-weighing-refresh"
              onClick={() =>
                loadBookings(
                  true
                )
              }
              disabled={
                refreshing
              }
            >

              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "admin-refresh-spin"
                    : ""
                }
              />


              {
                refreshing
                  ? text.refreshing
                  : text.refresh
              }

            </button>

          </div>

        </section>



        {/* ===================================================
            FEEDBACK
        ==================================================== */}

        {error && (

          <div className="admin-weighing-feedback error">

            <AlertTriangle
              size={17}
            />


            <span>
              {error}
            </span>


            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >

              <X
                size={14}
              />

            </button>

          </div>

        )}


        {success && (

          <div className="admin-weighing-feedback success">

            <CheckCircle2
              size={17}
            />


            <span>
              {success}
            </span>


            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >

              <X
                size={14}
              />

            </button>

          </div>

        )}



        {/* ===================================================
            KPI
        ==================================================== */}

        <section className="admin-weighing-kpi-grid">


          <WeighingStat
            tone="blue"
            icon={
              <Clock3
                size={18}
              />
            }
            value={
              weighingBookings.length
            }
            label={
              text.activeRecords
            }
          />


          <WeighingStat
            tone="orange"
            icon={
              <Scale
                size={18}
              />
            }
            value={
              readyBookings.length
            }
            label={
              text.awaitingWeight
            }
          />


          <WeighingStat
            tone="purple"
            icon={
              <ClipboardCheck
                size={18}
              />
            }
            value={
              bookings.filter(
                (
                  booking
                ) =>
                  booking.status ===
                  "WEIGHING"
              ).length
            }
            label={
              text.inWeighing
            }
          />


          <WeighingStat
            tone="green"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            value={
              completedBookings.length
            }
            label={
              text.recordsWithWeight
            }
          />

        </section>



        {/* ===================================================
            WORKSPACE
        ==================================================== */}

        <section className="admin-weighing-workspace">


          <div className="admin-weighing-list-panel">


            <div className="admin-weighing-panel-heading">

              <div>

                <span className="admin-page-eyebrow">
                  {text.processing}
                </span>


                <h3>
                  {text.selectFarmer}
                </h3>

              </div>


              <span>

                {
                  filteredBookings.length
                }

                {" "}

                {text.records}

              </span>

            </div>



            <div className="admin-weighing-search">

              <Search
                size={16}
              />


              <input
                type="text"
                placeholder={
                  text.searchPlaceholder
                }
                value={
                  search
                }
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>



            <div className="admin-weighing-booking-list">


              {loading ? (

                <WeighingLoading />

              ) : filteredBookings.length ===
                0 ? (

                <div className="admin-weighing-empty">

                  <Scale
                    size={24}
                  />


                  <strong>
                    {text.noRecords}
                  </strong>


                  <span>
                    {text.noRecordsText}
                  </span>

                </div>

              ) : (

                filteredBookings.map(
                  (
                    booking
                  ) => (

                    <button
                      key={
                        booking.id
                      }
                      type="button"
                      className={
                        `admin-weighing-booking-item ${
                          selectedBooking?.id ===
                          booking.id
                            ? "selected"
                            : ""
                        }`
                      }
                      onClick={() =>
                        setSelectedBooking(
                          booking
                        )
                      }
                    >

                      <div className="admin-weighing-token">

                        <TicketCheck
                          size={16}
                        />

                      </div>


                      <div className="admin-weighing-booking-main">

                        <div>

                          <strong>
                            #
                            {
                              booking.token ||
                              booking.id
                            }
                          </strong>


                          <StatusDot
                            status={
                              booking.status
                            }
                          />

                        </div>


                        <span>

                          {
                            booking.farmer_name ||
                            text.unknownFarmer
                          }

                        </span>


                        <small>

                          {
                            getCropName(
                              booking.crop,
                              language
                            )
                          }

                          {" · "}

                          {
                            Number(
                              booking.estimated_quantity ||
                              0
                            ).toLocaleString()
                          }

                          {" kg"}

                        </small>

                      </div>


                      <ChevronRight
                        size={15}
                      />

                    </button>

                  )
                )

              )}

            </div>

          </div>



          <div className="admin-weighing-form-panel">


            {!selectedBooking ? (

              <WeighingEmptyState
                text={
                  text
                }
              />

            ) : (

              <WeighingForm
                booking={
                  selectedBooking
                }
                language={
                  language
                }
                text={
                  text
                }
                actualQuantity={
                  actualQuantity
                }
                setActualQuantity={
                  setActualQuantity
                }
                quality={
                  quality
                }
                setQuality={
                  setQuality
                }
                notes={
                  notes
                }
                setNotes={
                  setNotes
                }
                rate={
                  rate
                }
                setRate={
                  setRate
                }
                adjustment={
                  adjustment
                }
                setAdjustment={
                  setAdjustment
                }
                saving={
                  saving
                }
                onMoveToWeighing={
                  moveToWeighing
                }
                onSaveWeight={
                  saveWeight
                }
                onCompleteProcurement={
                  completeProcurement
                }
                onClose={() =>
                  setSelectedBooking(
                    null
                  )
                }
              />

            )}

          </div>

        </section>



        <section className="admin-weighing-note">


          <div className="admin-weighing-note-icon">

            <Info
              size={18}
            />

          </div>


          <div>

            <strong>
              {text.processNoteTitle}
            </strong>


            <p>
              {text.processNoteText}
            </p>

          </div>

        </section>


      </div>

    </AdminLayout>

  );
}


/* =========================================================
   STAT
========================================================= */

function WeighingStat({
  icon,
  tone,
  value,
  label,
}) {

  return (

    <div
      className={
        `admin-weighing-stat ${tone}`
      }
    >

      <div className="admin-weighing-stat-icon">

        {icon}

      </div>


      <div>

        <strong>
          {value}
        </strong>


        <span>
          {label}
        </span>

      </div>

    </div>

  );
}


/* =========================================================
   STATUS DOT
========================================================= */

function StatusDot({
  status,
}) {

  return (

    <span
      className={
        `admin-weighing-status-dot ${
          getStatusTone(
            status
          )
        }`
      }
    />

  );

}


/* =========================================================
   EMPTY
========================================================= */

function WeighingEmptyState({
  text,
}) {

  return (

    <div className="admin-weighing-empty-state">

      <div className="admin-weighing-empty-icon">

        <Scale
          size={28}
        />

      </div>


      <span className="admin-page-eyebrow">

        {text.readyToWeigh}

      </span>


      <h3>
        {text.selectRecord}
      </h3>


      <p>
        {text.selectRecordText}
      </p>

    </div>

  );

}


/* =========================================================
   FORM
========================================================= */

function WeighingForm({
  booking,
  language,
  text,
  actualQuantity,
  setActualQuantity,
  quality,
  setQuality,
  notes,
  setNotes,
  rate,
  setRate,
  adjustment,
  setAdjustment,
  saving,
  onMoveToWeighing,
  onSaveWeight,
  onCompleteProcurement,
  onClose,
}) {

  const estimated =
    Number(
      booking.estimated_quantity ||
      0
    );


  const actual =
    Number(
      actualQuantity
    );


  const difference =
    Number.isFinite(
      actual
    ) &&
    actual > 0 &&
    estimated > 0
      ? actual - estimated
      : null;


  const differencePercent =
    difference !== null &&
    estimated > 0
      ? (
          (
            difference /
            estimated
          ) *
          100
        )
      : null;


  const numericRate =
    Number(
      rate || 0
    );


  const numericAdjustment =
    Number(
      adjustment || 0
    );


  const payableAmount =
    Number.isFinite(
      actual
    ) &&
    actual > 0 &&
    Number.isFinite(
      numericRate
    )
      ? (
          actual *
          numericRate
        ) +
        (
          Number.isFinite(
            numericAdjustment
          )
            ? numericAdjustment
            : 0
        )
      : 0;


  const status =
    booking.status ||
    "CONFIRMED";


  const canEnterWeight =
    [
      "ARRIVED",
      "LATE",
      "WEIGHING",
    ].includes(
      status
    );


  const alreadyProcured =
    [
      "PROCURED",
      "PAYMENT_PENDING",
      "PAYMENT_SENT",
    ].includes(
      status
    );


  const weightSaved =
    booking.actual_quantity !==
      null &&
    booking.actual_quantity !==
      undefined;


  return (

    <div className="admin-weighing-form">


      <div className="admin-weighing-form-header">


        <div>

          <div className="admin-weighing-form-token">

            <TicketCheck
              size={16}
            />


            <strong>
              #
              {
                booking.token ||
                booking.id
              }
            </strong>

          </div>


          <h3>

            {
              booking.farmer_name ||
              text.unknownFarmer
            }

          </h3>


          <p>

            {
              getCropName(
                booking.crop,
                language
              )
            }

            {" · "}

            {
              formatAdminDate(
                booking.date,
                language
              )
            }

          </p>

        </div>


        <button
          type="button"
          className="admin-weighing-close"
          onClick={
            onClose
          }
        >

          <X
            size={17}
          />

        </button>

      </div>



      <div className="admin-weighing-status-banner">

        <div>

          <StatusPill
            status={
              status
            }
            language={
              language
            }
          />

        </div>


        <span>

          {
            getStatusDescription(
              status,
              language
            )
          }

        </span>

      </div>



      <div className="admin-weighing-summary">


        <div>

          <span>
            {text.farmer}
          </span>


          <strong>
            {
              booking.farmer_name ||
              "—"
            }
          </strong>

        </div>


        <div>

          <span>
            {text.village}
          </span>


          <strong>
            {
              booking.farmer_village ||
              "—"
            }
          </strong>

        </div>


        <div>

          <span>
            {text.center}
          </span>


          <strong>
            {
              booking.center_id ||
              text.mainCenter
            }
          </strong>

        </div>


        <div>

          <span>
            {text.arrivalWindow}
          </span>


          <strong>
            {
              formatAdminTime(
                booking.slot_start,
                booking.slot_end
              )
            }
          </strong>

        </div>

      </div>



      {(status === "ARRIVED" ||
        status === "LATE") && (

        <section className="admin-weighing-start-card">


          <div className="admin-weighing-start-icon">

            <Scale
              size={20}
            />

          </div>


          <div>

            <span className="admin-page-eyebrow">

              {text.nextStep}

            </span>


            <h4>
              {text.moveToWeighing}
            </h4>


            <p>
              {text.moveToWeighingText}
            </p>

          </div>


          <button
            type="button"
            className="admin-weighing-start-button"
            onClick={
              onMoveToWeighing
            }
            disabled={
              saving
            }
          >

            {saving ? (

              <RefreshCw
                size={15}
                className="admin-refresh-spin"
              />

            ) : (

              <ArrowRight
                size={15}
              />

            )}


            {
              saving
                ? text.updating
                : text.startWeighing
            }

          </button>

        </section>

      )}



      <section
        className={
          `admin-weight-entry-section ${
            !canEnterWeight ||
            alreadyProcured
              ? "disabled"
              : ""
          }`
        }
      >


        <div className="admin-weighing-section-title">

          <div>

            <span className="admin-page-eyebrow">
              {text.weightStep}
            </span>


            <h4>
              {text.recordActualWeight}
            </h4>

          </div>


          <div className="admin-weight-status-mark">

            <Scale
              size={17}
            />

            {text.kilograms}

          </div>

        </div>



        <div className="admin-weight-comparison">


          <div className="admin-weight-estimated">

            <span>
              {text.estimatedWeight}
            </span>


            <strong>
              {
                estimated.toLocaleString()
              }
            </strong>


            <small>
              kg
            </small>

          </div>


          <div className="admin-weight-arrow">

            <ArrowRight
              size={18}
            />

          </div>


          <div className="admin-weight-actual">

            <span>
              {text.actualWeight}
            </span>


            <div className="admin-weight-input-wrap">

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  actualQuantity
                }
                disabled={
                  !canEnterWeight ||
                  alreadyProcured
                }
                placeholder="0"
                onChange={(event) =>
                  setActualQuantity(
                    event.target.value
                  )
                }
              />


              <span>
                kg
              </span>

            </div>

          </div>

          {/* SIH QUALITY METRICS */}
          <div className="admin-form-group" style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h4 style={{ margin: '0 0 16px 0', color: "#1c1917" }}>Scientific Quality Assessment</h4>
            <div className="sih-admin-quality-grid">
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: "#1c1917", marginBottom: '8px', fontWeight: 'bold' }}>Moisture Content (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: "rgba(235, 185, 70, 0.35)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255, 215, 0, 0.4)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)", border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px' }}>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 14.2" 
                    value={moistureContent} 
                    onChange={e => setMoistureContent(e.target.value)}
                    disabled={!canEnterWeight || alreadyProcured}
                    style={{ border: 'none', outline: 'none', padding: '10px 0', width: '100%', background: 'transparent' }} 
                  />
                  <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>%</span>
                </div>
                {moistureContent && Number(moistureContent) > 17 && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>Exceeds 17% limit! Farmer must dry crop.</small>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: "#1c1917", marginBottom: '8px', fontWeight: 'bold' }}>Impurity Content (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: "rgba(235, 185, 70, 0.35)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255, 215, 0, 0.4)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)", border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px' }}>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 1.5" 
                    value={impurityContent} 
                    onChange={e => setImpurityContent(e.target.value)}
                    disabled={!canEnterWeight || alreadyProcured}
                    style={{ border: 'none', outline: 'none', padding: '10px 0', width: '100%', background: 'transparent' }} 
                  />
                  <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>%</span>
                </div>
              </div>
            </div>
          </div>


        </div>



        {difference !== null && (

          <div
            className={
              `admin-weight-difference ${
                difference > 0
                  ? "positive"
                  : difference < 0
                    ? "negative"
                    : "equal"
              }`
            }
          >

            <div>

              <span>
                {text.difference}
              </span>


              <strong>

                {difference > 0
                  ? "+"
                  : ""}

                {
                  difference.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits:
                        2,
                    }
                  )
                }

                {" kg"}

              </strong>

            </div>


            {differencePercent !== null && (

              <span>

                {differencePercent > 0
                  ? "+"
                  : ""}

                {
                  differencePercent.toFixed(
                    1
                  )
                }
                %

              </span>

            )}

          </div>

        )}

      </section>



      <section className="admin-quality-section">


        <div className="admin-weighing-section-title">

          <div>

            <span className="admin-page-eyebrow">
              {text.qualityStep}
            </span>


            <h4>
              {text.qualityTitle}
            </h4>

          </div>

        </div>



        <div className="admin-quality-options">


          <QualityOption
            title={
              text.good
            }
            text={
              text.goodText
            }
            selected={
              quality ===
              "GOOD"
            }
            disabled={
              alreadyProcured
            }
            onClick={() =>
              setQuality(
                "GOOD"
              )
            }
          />


          <QualityOption
            title={
              text.average
            }
            text={
              text.averageText
            }
            selected={
              quality ===
              "AVERAGE"
            }
            disabled={
              alreadyProcured
            }
            onClick={() =>
              setQuality(
                "AVERAGE"
              )
            }
          />


          <QualityOption
            title={
              text.poor
            }
            text={
              text.poorText
            }
            selected={
              quality ===
              "POOR"
            }
            disabled={
              alreadyProcured
            }
            onClick={() =>
              setQuality(
                "POOR"
              )
            }
          />

        </div>

      </section>



      <section className="admin-weighing-notes-section">


        <div className="admin-weighing-section-title">

          <div>

            <span className="admin-page-eyebrow">
              {text.optional}
            </span>


            <h4>
              {text.operatorNotes}
            </h4>

          </div>

        </div>


        <textarea
          value={
            notes
          }
          disabled={
            alreadyProcured
          }
          onChange={(event) =>
            setNotes(
              event.target.value
            )
          }
          placeholder={
            text.notesPlaceholder
          }
          rows={4}
        />

      </section>



      {/* =================================================
          PAYMENT CALCULATION
      ================================================== */}

      <section className="admin-procurement-calculation">


        <div className="admin-weighing-section-title">

          <div>

            <span className="admin-page-eyebrow">
              {text.procurementStep}
            </span>


            <h4>
              {text.procurementCalculation}
            </h4>

          </div>

        </div>


        <div className="admin-procurement-grid">


          <label className="admin-weighing-field">

            <span>
              {text.ratePerKg}
            </span>


            <div className="admin-procurement-input">

              <span>
                ₹
              </span>


              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  rate
                }
                disabled={
                  alreadyProcured
                }
                onChange={(event) =>
                  setRate(
                    event.target.value
                  )
                }
                placeholder="0.00"
              />

              <small>
                / kg
              </small>

            </div>

          </label>


          <label className="admin-weighing-field">

            <span>
              {text.adjustment}
            </span>


            <div className="admin-procurement-input">

              <span>
                ₹
              </span>


              <input
                type="number"
                step="0.01"
                value={
                  adjustment
                }
                disabled={
                  alreadyProcured
                }
                onChange={(event) =>
                  setAdjustment(
                    event.target.value
                  )
                }
                placeholder="0.00"
              />

            </div>

          </label>

        </div>



        <div className="admin-procurement-breakdown">


          <div>

            <span>
              {text.actualWeight}
            </span>


            <strong>

              {
                Number(
                  actualQuantity || 0
                ).toLocaleString()
              }

              {" kg"}

            </strong>

          </div>


          <span>
            ×
          </span>


          <div>

            <span>
              {text.ratePerKg}
            </span>


            <strong>
              ₹
              {
                numericRate.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )
              }
            </strong>

          </div>


          <span>
            +
          </span>


          <div>

            <span>
              {text.adjustment}
            </span>


            <strong>
              ₹
              {
                numericAdjustment.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )
              }
            </strong>

          </div>


        </div>



        <div className="admin-procurement-total">

          <span>
            {text.payableAmount}
          </span>


          <strong>
            ₹
            {
              payableAmount.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )
            }
          </strong>

        </div>

      </section>



      {!canEnterWeight &&
        !alreadyProcured && (

        <div className="admin-weighing-disabled-note">

          <Info
            size={16}
          />

          <span>
            {text.startBeforeWeight}
          </span>

        </div>

      )}



      {!alreadyProcured ? (

        <div className="admin-weighing-form-actions">


          <button
            type="button"
            className="admin-weighing-cancel"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >
            {text.cancel}
          </button>


          <button
            type="button"
            className="admin-weighing-save"
            onClick={
              onSaveWeight
            }
            disabled={
              saving ||
              !canEnterWeight
            }
          >

            {saving ? (

              <RefreshCw
                size={16}
                className="admin-refresh-spin"
              />

            ) : (

              <Check
                size={16}
              />

            )}


            {saving
              ? text.saving
              : text.saveWeight}

          </button>


          <button
            type="button"
            className="admin-weighing-complete"
            onClick={
              onCompleteProcurement
            }
            disabled={
              saving ||
              !canEnterWeight ||
              !actualQuantity ||
              !rate
            }
          >

            {saving ? (

              <RefreshCw
                size={16}
                className="admin-refresh-spin"
              />

            ) : (

              <CheckCircle2
                size={16}
              />

            )}


            {saving
              ? text.processing
              : text.completeProcurement}

          </button>

        </div>

      ) : (

        <div className="admin-weighing-completed-banner">

          <CheckCircle2
            size={20}
          />


          <div>

            <strong>
              {text.alreadyCompleted}
            </strong>


            <span>
              {text.alreadyCompletedText}
            </span>

          </div>

        </div>

      )}

    </div>

  );
}


/* =========================================================
   QUALITY
========================================================= */

function QualityOption({
  title,
  text,
  selected,
  disabled,
  onClick,
}) {

  return (

    <button
      type="button"
      className={
        `admin-quality-option ${
          selected
            ? "selected"
            : ""
        }`
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
    >

      <div className="admin-quality-radio">

        {selected && (
          <span />
        )}

      </div>


      <div>

        <strong>
          {title}
        </strong>


        <span>
          {text}
        </span>

      </div>

    </button>

  );
}


/* =========================================================
   LOADING
========================================================= */

function WeighingLoading() {

  return (

    <div className="admin-weighing-loading">

      {[
        1,
        2,
        3,
        4,
        5,
      ].map(
        (
          item
        ) => (

          <div
            key={
              item
            }
            className="admin-weighing-skeleton"
          >

            <span />


            <div>

              <span />
              <span />
              <span />

            </div>

          </div>

        )
      )}

    </div>

  );
}


/* =========================================================
   STATUS HELPERS
========================================================= */

function getStatusTone(
  status
) {

  if (
    status ===
    "ARRIVED"
  ) {
    return "blue";
  }


  if (
    status ===
    "LATE"
  ) {
    return "orange";
  }


  if (
    status ===
    "WEIGHING"
  ) {
    return "purple";
  }


  if (
    status ===
    "PAYMENT_PENDING"
  ) {
    return "gold";
  }


  return "green";

}


function StatusPill({
  status,
  language,
}) {

  return (

    <span
      className={
        `admin-weighing-status-pill ${
          getStatusTone(
            status
          )
        }`
      }
    >

      <span />


      {
        getStatusLabel(
          status,
          language
        )
      }

    </span>

  );
}


function getStatusLabel(
  status,
  language
) {

  const labels = {

    en: {

      CONFIRMED:
        "Confirmed",

      ARRIVED:
        "Arrived",

      LATE:
        "Late",

      WEIGHING:
        "Weighing",

      PROCURED:
        "Procured",

      PAYMENT_PENDING:
        "Payment Pending",

      PAYMENT_SENT:
        "Payment Sent",

    },


    hi: {

      CONFIRMED:
        "पुष्टि",

      ARRIVED:
        "पहुंचे",

      LATE:
        "देर से",

      WEIGHING:
        "वजन",

      PROCURED:
        "खरीद पूरी",

      PAYMENT_PENDING:
        "भुगतान लंबित",

      PAYMENT_SENT:
        "भुगतान भेजा गया",

    },


    te: {

      CONFIRMED:
        "నిర్ధారించబడింది",

      ARRIVED:
        "చేరుకున్నారు",

      LATE:
        "ఆలస్యం",

      WEIGHING:
        "తూకం",

      PROCURED:
        "కొనుగోలు పూర్తైంది",

      PAYMENT_PENDING:
        "చెల్లింపు పెండింగ్",

      PAYMENT_SENT:
        "చెల్లింపు పంపబడింది",

    },

  };


  return (
    labels[
      language
    ]?.[
      status
    ] ||
    labels.en[
      status
    ] ||
    status
  );

}


function getStatusDescription(
  status,
  language
) {

  const descriptions = {

    en: {

      CONFIRMED:
        "The farmer has a confirmed procurement slot.",

      ARRIVED:
        "The farmer has reached the procurement center.",

      LATE:
        "The farmer has been marked late.",

      WEIGHING:
        "The booking is currently at the weighing desk.",

      PROCURED:
        "Procurement has been completed.",

      PAYMENT_PENDING:
        "The booking is waiting for payment processing.",

      PAYMENT_SENT:
        "Payment has been recorded as sent.",

    },


    hi: {

      CONFIRMED:
        "किसान का खरीद स्लॉट पुष्टि हो चुका है।",

      ARRIVED:
        "किसान खरीद केंद्र पर पहुंच चुका है।",

      LATE:
        "किसान के देर से आने की जानकारी दर्ज है।",

      WEIGHING:
        "बुकिंग वर्तमान में वजन केंद्र पर है।",

      PROCURED:
        "खरीद पूरी हो चुकी है।",

      PAYMENT_PENDING:
        "बुकिंग भुगतान प्रक्रिया की प्रतीक्षा कर रही है।",

      PAYMENT_SENT:
        "भुगतान भेजे जाने की जानकारी दर्ज है।",

    },


    te: {

      CONFIRMED:
        "రైతు కొనుగోలు స్లాట్ నిర్ధారించబడింది.",

      ARRIVED:
        "రైతు కొనుగోలు కేంద్రానికి చేరుకున్నారు.",

      LATE:
        "రైతు ఆలస్యంగా వచ్చినట్లు నమోదు చేయబడింది.",

      WEIGHING:
        "బుకింగ్ ప్రస్తుతం తూకం దశలో ఉంది.",

      PROCURED:
        "కొనుగోలు పూర్తైంది.",

      PAYMENT_PENDING:
        "బుకింగ్ చెల్లింపు ప్రక్రియ కోసం వేచి ఉంది.",

      PAYMENT_SENT:
        "చెల్లింపు పంపబడినట్లు నమోదు చేయబడింది.",

    },

  };


  return (
    descriptions[
      language
    ]?.[
      status
    ] ||
    descriptions.en[
      status
    ] ||
    ""
  );

}


/* =========================================================
   CROP
========================================================= */

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
    names[
      crop
    ]?.[
      language
    ] ||
    names[
      crop
    ]?.en ||
    crop ||
    "—"
  );

}


/* =========================================================
   DATE
========================================================= */

function formatAdminDate(
  value,
  language
) {

  if (
    !value
  ) {
    return "—";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }


  const locale =
    language === "hi"
      ? "hi-IN"
      : language === "te"
        ? "te-IN"
        : "en-IN";


  return date.toLocaleDateString(
    locale,
    {
      day:
        "numeric",

      month:
        "short",
    }
  );

}


/* =========================================================
   TIME
========================================================= */

function formatAdminTime(
  start,
  end
) {

  if (
    !start
  ) {
    return "—";
  }


  function convert(
    value
  ) {

    const parts =
      String(
        value
      ).split(
        ":"
      );


    const hour =
      Number(
        parts[0]
      );


    const minute =
      parts[1] ||
      "00";


    if (
      Number.isNaN(
        hour
      )
    ) {
      return value;
    }


    const suffix =
      hour >= 12
        ? "PM"
        : "AM";


    const displayHour =
      hour % 12 ||
      12;


    return `${displayHour}:${minute} ${suffix}`;

  }


  return end
    ? `${convert(start)} – ${convert(end)}`
    : convert(start);

}


/* =========================================================
   COPY
========================================================= */

function getWeighingCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Weighing Desk",

      subtitle:
        "Record actual quantities, verify quality and complete procurement.",

      eyebrow:
        "WEIGHING & PROCUREMENT",

      heading:
        "Process farmer produce accurately.",

      description:
        "Select an arriving farmer, record the actual quantity, set the procurement rate and complete procurement after verification.",

      live:
        "LIVE",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      activeRecords:
        "Active records",

      awaitingWeight:
        "Awaiting weight",

      inWeighing:
        "In weighing",

      recordsWithWeight:
        "Records with weight",

      processing:
        "PROCESSING",

      selectFarmer:
        "Select a farmer",

      records:
        "records",

      searchPlaceholder:
        "Search token, farmer or crop...",

      noRecords:
        "No weighing records",

      noRecordsText:
        "Arrived and weighing bookings will appear here.",

      unknownFarmer:
        "Unknown farmer",

      readyToWeigh:
        "READY FOR PROCESSING",

      selectRecord:
        "Select a booking",

      selectRecordText:
        "Choose a farmer from the list to review the booking and record the actual weight.",

      farmer:
        "Farmer",

      village:
        "Village",

      center:
        "Center",

      arrivalWindow:
        "Arrival window",

      nextStep:
        "NEXT STEP",

      moveToWeighing:
        "Move this booking to weighing",

      moveToWeighingText:
        "Start the weighing stage before recording the final quantity.",

      updating:
        "Updating...",

      startWeighing:
        "Start Weighing",

      weightStep:
        "WEIGHT RECORD",

      recordActualWeight:
        "Record actual weight",

      kilograms:
        "Kilograms",

      estimatedWeight:
        "Estimated quantity",

      actualWeight:
        "Actual quantity",

      difference:
        "Difference",

      qualityStep:
        "QUALITY CHECK",

      qualityTitle:
        "Select produce quality",

      good:
        "Good",

      goodText:
        "Acceptable quality",

      average:
        "Average",

      averageText:
        "Standard quality",

      poor:
        "Poor",

      poorText:
        "Below expected quality",

      optional:
        "OPTIONAL",

      operatorNotes:
        "Operator notes",

      notesPlaceholder:
        "Record any useful observation about the weighing or produce.",

      procurementStep:
        "PROCUREMENT",

      procurementCalculation:
        "Calculate payable amount",

      ratePerKg:
        "Rate per kg",

      adjustment:
        "Adjustment",

      payableAmount:
        "Final payable amount",

      startBeforeWeight:
        "Move the booking to the weighing stage before entering the final quantity.",

      cancel:
        "Cancel",

      saving:
        "Saving...",

      saveWeight:
        "Save Weight",

      processing:
        "Processing...",

      completeProcurement:
        "Complete Procurement",

      alreadyCompleted:
        "Procurement already completed",

      alreadyCompletedText:
        "This booking already has a completed procurement status.",

      invalidQuantity:
        "Enter a valid actual quantity greater than zero.",

      invalidRate:
        "Enter a valid procurement rate greater than zero.",

      invalidAdjustment:
        "Enter a valid adjustment amount.",

      saveError:
        "Unable to save the weighing record.",

      procurementError:
        "Unable to complete procurement.",

      statusError:
        "Unable to update the booking status.",

      loadError:
        "Unable to load weighing records.",

      movedToWeighing:
        "Booking moved to weighing.",

      weighingSaved:
        "Weight recorded. The booking remains in weighing until procurement is completed.",

      procurementSaved:
        "Procurement completed. Payable amount:",

      processNoteTitle:
        "Operator control",

      processNoteText:
        "Actual quantity becomes the basis for payment. Verify the physical produce, quality and approved rate before completing procurement.",

      mainCenter:
        "Main Procurement Center",

    },


    hi: {

      title:
        "वजन डेस्क",

      subtitle:
        "वास्तविक मात्रा दर्ज करें, गुणवत्ता सत्यापित करें और खरीद पूरी करें।",

      eyebrow:
        "वजन और खरीद",

      heading:
        "किसान की उपज को सही तरीके से प्रोसेस करें।",

      description:
        "पहुंचे हुए किसान का चयन करें, वास्तविक मात्रा दर्ज करें, खरीद दर सेट करें और सत्यापन के बाद खरीद पूरी करें।",

      live:
        "लाइव",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      activeRecords:
        "सक्रिय रिकॉर्ड",

      awaitingWeight:
        "वजन बाकी",

      inWeighing:
        "वजन में",

      recordsWithWeight:
        "वजन वाले रिकॉर्ड",

      processing:
        "प्रोसेसिंग",

      selectFarmer:
        "किसान चुनें",

      records:
        "रिकॉर्ड",

      searchPlaceholder:
        "टोकन, किसान या फसल खोजें...",

      noRecords:
        "कोई वजन रिकॉर्ड नहीं",

      noRecordsText:
        "पहुंचे हुए और वजन वाले रिकॉर्ड यहां दिखाई देंगे।",

      unknownFarmer:
        "अज्ञात किसान",

      readyToWeigh:
        "प्रक्रिया के लिए तैयार",

      selectRecord:
        "बुकिंग चुनें",

      selectRecordText:
        "सूची से किसान चुनकर बुकिंग देखें और वास्तविक वजन दर्ज करें।",

      farmer:
        "किसान",

      village:
        "गांव",

      center:
        "केंद्र",

      arrivalWindow:
        "आने का समय",

      nextStep:
        "अगला चरण",

      moveToWeighing:
        "इस बुकिंग को वजन में भेजें",

      moveToWeighingText:
        "अंतिम मात्रा दर्ज करने से पहले वजन प्रक्रिया शुरू करें।",

      updating:
        "अपडेट हो रहा है...",

      startWeighing:
        "वजन शुरू करें",

      weightStep:
        "वजन रिकॉर्ड",

      recordActualWeight:
        "वास्तविक वजन दर्ज करें",

      kilograms:
        "किलोग्राम",

      estimatedWeight:
        "अनुमानित मात्रा",

      actualWeight:
        "वास्तविक मात्रा",

      difference:
        "अंतर",

      qualityStep:
        "गुणवत्ता जांच",

      qualityTitle:
        "उपज की गुणवत्ता चुनें",

      good:
        "अच्छी",

      goodText:
        "स्वीकार्य गुणवत्ता",

      average:
        "औसत",

      averageText:
        "मानक गुणवत्ता",

      poor:
        "खराब",

      poorText:
        "अपेक्षित गुणवत्ता से कम",

      optional:
        "वैकल्पिक",

      operatorNotes:
        "ऑपरेटर नोट्स",

      notesPlaceholder:
        "वजन या उपज के बारे में जरूरी जानकारी लिखें।",

      procurementStep:
        "खरीद",

      procurementCalculation:
        "देय राशि की गणना",

      ratePerKg:
        "प्रति किलो दर",

      adjustment:
        "समायोजन",

      payableAmount:
        "अंतिम देय राशि",

      startBeforeWeight:
        "अंतिम मात्रा दर्ज करने से पहले बुकिंग को वजन चरण में भेजें।",

      cancel:
        "रद्द करें",

      saving:
        "सहेजा जा रहा है...",

      saveWeight:
        "वजन सहेजें",

      processing:
        "प्रक्रिया हो रही है...",

      completeProcurement:
        "खरीद पूरी करें",

      alreadyCompleted:
        "खरीद पहले ही पूरी हो चुकी है",

      alreadyCompletedText:
        "इस बुकिंग की खरीद पहले से पूरी स्थिति में है।",

      invalidQuantity:
        "शून्य से अधिक मान्य वास्तविक मात्रा दर्ज करें।",

      invalidRate:
        "शून्य से अधिक मान्य खरीद दर दर्ज करें।",

      invalidAdjustment:
        "मान्य समायोजन राशि दर्ज करें।",

      saveError:
        "वजन रिकॉर्ड सहेजा नहीं जा सका।",

      procurementError:
        "खरीद पूरी नहीं की जा सकी।",

      statusError:
        "बुकिंग स्थिति अपडेट नहीं की जा सकी।",

      loadError:
        "वजन रिकॉर्ड लोड नहीं किए जा सके।",

      movedToWeighing:
        "बुकिंग को वजन चरण में भेज दिया गया।",

      weighingSaved:
        "वजन दर्ज हो गया। खरीद पूरी होने तक बुकिंग वजन चरण में रहेगी।",

      procurementSaved:
        "खरीद पूरी हुई। देय राशि:",

      processNoteTitle:
        "ऑपरेटर नियंत्रण",

      processNoteText:
        "वास्तविक मात्रा भुगतान का आधार बनेगी। खरीद पूरी करने से पहले उपज, गुणवत्ता और स्वीकृत दर सत्यापित करें।",

      mainCenter:
        "मुख्य खरीद केंद्र",

    },


    te: {

      title:
        "తూకం డెస్క్",

      subtitle:
        "వాస్తవ పరిమాణాన్ని నమోదు చేసి, నాణ్యతను ధృవీకరించి, కొనుగోలును పూర్తి చేయండి.",

      eyebrow:
        "తూకం & కొనుగోలు",

      heading:
        "రైతు పంటను ఖచ్చితంగా ప్రాసెస్ చేయండి.",

      description:
        "చేరుకున్న రైతును ఎంచుకుని, వాస్తవ పరిమాణం నమోదు చేసి, కొనుగోలు రేటు సెట్ చేసి, ధృవీకరణ తర్వాత కొనుగోలును పూర్తి చేయండి.",

      live:
        "లైవ్",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      activeRecords:
        "యాక్టివ్ రికార్డులు",

      awaitingWeight:
        "తూకం కోసం వేచి ఉన్నవి",

      inWeighing:
        "తూకంలో",

      recordsWithWeight:
        "తూకం ఉన్న రికార్డులు",

      processing:
        "ప్రాసెసింగ్",

      selectFarmer:
        "రైతును ఎంచుకోండి",

      records:
        "రికార్డులు",

      searchPlaceholder:
        "టోకెన్, రైతు లేదా పంట వెతకండి...",

      noRecords:
        "తూకం రికార్డులు లేవు",

      noRecordsText:
        "చేరుకున్న మరియు తూకం దశలో ఉన్న బుకింగ్‌లు ఇక్కడ కనిపిస్తాయి.",

      unknownFarmer:
        "తెలియని రైతు",

      readyToWeigh:
        "ప్రాసెసింగ్‌కు సిద్ధం",

      selectRecord:
        "బుకింగ్ ఎంచుకోండి",

      selectRecordText:
        "జాబితా నుండి రైతును ఎంచుకుని బుకింగ్‌ను పరిశీలించి వాస్తవ తూకాన్ని నమోదు చేయండి.",

      farmer:
        "రైతు",

      village:
        "గ్రామం",

      center:
        "కేంద్రం",

      arrivalWindow:
        "రాక సమయం",

      nextStep:
        "తదుపరి దశ",

      moveToWeighing:
        "ఈ బుకింగ్‌ను తూకం దశకు పంపండి",

      moveToWeighingText:
        "చివరి పరిమాణాన్ని నమోదు చేయడానికి ముందు తూకం ప్రక్రియను ప్రారంభించండి.",

      updating:
        "అప్‌డేట్ చేస్తోంది...",

      startWeighing:
        "తూకం ప్రారంభించండి",

      weightStep:
        "తూకం రికార్డు",

      recordActualWeight:
        "వాస్తవ బరువును నమోదు చేయండి",

      kilograms:
        "కిలోగ్రాములు",

      estimatedWeight:
        "అంచనా పరిమాణం",

      actualWeight:
        "వాస్తవ పరిమాణం",

      difference:
        "తేడా",

      qualityStep:
        "నాణ్యత తనిఖీ",

      qualityTitle:
        "పంట నాణ్యతను ఎంచుకోండి",

      good:
        "మంచిది",

      goodText:
        "ఆమోదయోగ్యమైన నాణ్యత",

      average:
        "సగటు",

      averageText:
        "ప్రామాణిక నాణ్యత",

      poor:
        "తక్కువ",

      poorText:
        "అంచనా నాణ్యత కంటే తక్కువ",

      optional:
        "ఐచ్ఛికం",

      operatorNotes:
        "ఆపరేటర్ నోట్లు",

      notesPlaceholder:
        "తూకం లేదా పంట గురించి అవసరమైన గమనికను నమోదు చేయండి.",

      procurementStep:
        "కొనుగోలు",

      procurementCalculation:
        "చెల్లించాల్సిన మొత్తం లెక్కింపు",

      ratePerKg:
        "కిలోకు రేటు",

      adjustment:
        "సర్దుబాటు",

      payableAmount:
        "చివరి చెల్లించాల్సిన మొత్తం",

      startBeforeWeight:
        "వాస్తవ పరిమాణాన్ని నమోదు చేయడానికి ముందు బుకింగ్‌ను తూకం దశకు పంపండి.",

      cancel:
        "రద్దు చేయండి",

      saving:
        "సేవ్ చేస్తోంది...",

      saveWeight:
        "తూకాన్ని సేవ్ చేయండి",

      processing:
        "ప్రాసెస్ చేస్తోంది...",

      completeProcurement:
        "కొనుగోలు పూర్తి చేయండి",

      alreadyCompleted:
        "కొనుగోలు ఇప్పటికే పూర్తైంది",

      alreadyCompletedText:
        "ఈ బుకింగ్ ఇప్పటికే కొనుగోలు పూర్తైన స్థితిలో ఉంది.",

      invalidQuantity:
        "సున్నా కంటే ఎక్కువ సరైన వాస్తవ పరిమాణాన్ని నమోదు చేయండి.",

      invalidRate:
        "సున్నా కంటే ఎక్కువ సరైన కొనుగోలు రేటును నమోదు చేయండి.",

      invalidAdjustment:
        "సరైన సర్దుబాటు మొత్తాన్ని నమోదు చేయండి.",

      saveError:
        "తూకం రికార్డును సేవ్ చేయలేకపోయాము.",

      procurementError:
        "కొనుగోలును పూర్తి చేయలేకపోయాము.",

      statusError:
        "బుకింగ్ స్థితిని అప్‌డేట్ చేయలేకపోయాము.",

      loadError:
        "తూకం రికార్డులను లోడ్ చేయలేకపోయాము.",

      movedToWeighing:
        "బుకింగ్‌ను తూకం దశకు పంపించాము.",

      weighingSaved:
        "తూకం నమోదు చేయబడింది. కొనుగోలు పూర్తయ్యే వరకు బుకింగ్ తూకం దశలో ఉంటుంది.",

      procurementSaved:
        "కొనుగోలు పూర్తైంది. చెల్లించాల్సిన మొత్తం:",

      processNoteTitle:
        "ఆపరేటర్ నియంత్రణ",

      processNoteText:
        "వాస్తవ పరిమాణం చెల్లింపు లెక్కింపుకు ఆధారం. కొనుగోలు పూర్తిచేసే ముందు పంట, నాణ్యత మరియు ఆమోదించిన రేటును ధృవీకరించండి.",

      mainCenter:
        "ప్రధాన కొనుగోలు కేంద్రం",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default AdminWeighing;