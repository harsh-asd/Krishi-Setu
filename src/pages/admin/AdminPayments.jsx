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
  Clock3,
  Copy,
  CreditCard,
  Database,
  ExternalLink,
  IndianRupee,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Volume2,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import { useLanguage } from "../../translations/LanguageContext";
import { useSearchParams } from "react-router";


const API_URL =
  import.meta.env.VITE_API_URL;


function AdminPayments() {
  const [searchParams] = useSearchParams();

  const [bookings, setBookings] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  const [refreshing, setRefreshing] =
    useState(false);


  const [saving, setSaving] =
    useState(false);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  const [search, setSearch] = useState(searchParams.get("search") || "");


  const [filter, setFilter] =
    useState("PENDING");


  const [selectedBooking, setSelectedBooking] =
    useState(null);


  const [showPaymentForm, setShowPaymentForm] =
    useState(false);


  const {
    language,
  } = useLanguage();


  const text =
    getPaymentsCopy(
      language
    );


  const loadPayments =
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
              "Unable to load payments."
            );

          }


          setBookings(
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : []
          );


          setError("");


        } catch (
          loadError
        ) {

          console.error(
            "Admin payments error:",
            loadError
          );


          setError(
            loadError?.message ||
            "Unable to connect to the backend."
          );

        } finally {

          setLoading(
            false
          );

          setRefreshing(
            false
          );

        }

      },
      []
    );


  useEffect(() => {

    loadPayments();


    const timer =
      setInterval(
        () =>
          loadPayments(),
        10000
      );


    return () => {

      clearInterval(
        timer
      );

    };

  }, [
    loadPayments,
  ]);


  const stats =
    useMemo(
      () => {

        const pending =
          bookings.filter(
            (
              booking
            ) =>
              booking.status ===
              "PAYMENT_PENDING"
          );


        const paid =
          bookings.filter(
            (
              booking
            ) =>
              booking.status ===
              "PAYMENT_SENT"
          );


        const pendingAmount =
          pending.reduce(
            (
              total,
              booking
            ) =>
              total +
              Number(
                booking.payment_amount ||
                0
              ),
            0
          );


        const paidAmount =
          paid.reduce(
            (
              total,
              booking
            ) =>
              total +
              Number(
                booking.payment_amount ||
                0
              ),
            0
          );


        return {

          total:
            bookings.filter(
              (
                booking
              ) =>
                [
                  "PAYMENT_PENDING",
                  "PAYMENT_SENT",
                ].includes(
                  booking.status
                )
            ).length,

          pending:
            pending.length,

          paid:
            paid.length,

          pendingAmount,

          paidAmount,

        };

      },
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


        return bookings
          .filter(
            (
              booking
            ) => {

              if (
                filter ===
                "PENDING" &&
                booking.status !==
                  "PAYMENT_PENDING"
              ) {

                return false;

              }


              if (
                filter ===
                "PAID" &&
                booking.status !==
                  "PAYMENT_SENT"
              ) {

                return false;

              }


              if (
                filter ===
                "ALL" &&
                ![
                  "PAYMENT_PENDING",
                  "PAYMENT_SENT",
                ].includes(
                  booking.status
                )
              ) {

                return false;

              }


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
                  booking.payment_reference,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              return searchable.includes(
                query
              );

            }
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.created_at ||
                ""
              ).localeCompare(
                String(
                  a.created_at ||
                  ""
                )
              )
          );

      },
      [
        bookings,
        search,
        filter,
      ]
    );


  function openPayment(
    booking
  ) {

    setSelectedBooking(
      booking
    );

    setShowPaymentForm(
      true
    );

    setError("");

    setSuccess("");

  }


  function speakPaymentConfirmation(
    booking,
    amount,
    paymentLanguage
  ) {

    if (
      typeof window ===
      "undefined"
    ) {

      return;

    }


    if (
      !(
        "speechSynthesis"
        in window
      )
    ) {

      return;

    }


    const farmer =
      booking?.farmer_name ||
      "";


    const token =
      booking?.token ||
      booking?.id ||
      "";


    let message =
      "";


    if (
      paymentLanguage ===
      "hi"
    ) {

      message =
        `${farmer} जी, आपके टोकन नंबर ${token} का भुगतान ${formatSpeechAmount(
          amount
        )} रुपये सफलतापूर्वक भेज दिया गया है। कृपया अपनी भुगतान जानकारी जांचें।`;

    } else if (
      paymentLanguage ===
      "te"
    ) {

      message =
        `${farmer} గారు, మీ టోకెన్ నంబర్ ${token} కోసం ${formatSpeechAmount(
          amount
        )} రూపాయల చెల్లింపు విజయవంతంగా పంపబడింది. దయచేసి మీ చెల్లింపు సమాచారాన్ని తనిఖీ చేయండి.`;

    } else {

      message =
        `${farmer}, payment for token ${token} of ${formatSpeechAmount(
          amount
        )} rupees has been successfully sent. Please check your payment information.`;

    }


    try {

      window.speechSynthesis.cancel();


      const utterance =
        new SpeechSynthesisUtterance(
          message
        );


      utterance.lang =
        paymentLanguage ===
        "hi"
          ? "hi-IN"
          : paymentLanguage ===
            "te"
              ? "te-IN"
              : "en-IN";


      utterance.rate =
        0.92;


      utterance.pitch =
        1;


      utterance.volume =
        0.85;


      window.speechSynthesis.speak(
        utterance
      );

    } catch (
      speechError
    ) {

      console.warn(
        "Payment voice announcement failed:",
        speechError
      );

    }

  }


  async function submitPayment(
    form
  ) {

    if (
      !selectedBooking
    ) {

      return;

    }


    const amount =
      Number(
        form.amount
      );


    if (
      !Number.isFinite(
        amount
      ) ||
      amount <=
      0
    ) {

      setError(
        text.invalidAmount
      );

      return;

    }


    if (
      !String(
        form.reference ||
        ""
      ).trim()
    ) {

      setError(
        text.referenceRequired
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
          )}/payment`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                amount:
                  amount,

                method:
                  form.method,

                reference:
                  form.reference.trim(),

                notes:
                  form.notes.trim(),

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
          text.paymentError
        );

      }


      setShowPaymentForm(
        false
      );


      setSelectedBooking(
        null
      );


      setSuccess(
        text.paymentRecorded
      );


      speakPaymentConfirmation(
        selectedBooking,
        amount,
        selectedBooking.language ||
        selectedBooking.farmer_language ||
        language
      );


      await loadPayments(
        true
      );


    } catch (
      paymentError
    ) {

      console.error(
        "Payment submit error:",
        paymentError
      );


      setError(
        paymentError?.message ||
        text.paymentError
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

      <div className="admin-payments-page">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="admin-payments-hero">


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


          <div className="admin-payments-actions">

            <div className="admin-payments-live">

              <Database
                size={14}
              />

              {text.liveData}

            </div>


            <button
              type="button"
              className="admin-payments-refresh"
              onClick={() =>
                loadPayments(true)
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



        {/* =====================================================
            FEEDBACK
        ====================================================== */}

        {error && (

          <div className="admin-payments-error">

            <AlertTriangle
              size={17}
            />


            <div>

              <strong>
                {text.paymentIssue}
              </strong>


              <span>
                {error}
              </span>

            </div>


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

          <div className="admin-payments-success">

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



        {/* =====================================================
            KPIs
        ====================================================== */}

        <section className="admin-payment-kpi-grid">


          <PaymentKpi
            tone="blue"
            icon={
              <CreditCard
                size={18}
              />
            }
            value={
              stats.total
            }
            label={
              text.paymentCases
            }
          />


          <PaymentKpi
            tone="gold"
            icon={
              <Clock3
                size={18}
              />
            }
            value={
              stats.pending
            }
            label={
              text.pendingPayments
            }
          />


          <PaymentKpi
            tone="green"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            value={
              stats.paid
            }
            label={
              text.paidPayments
            }
          />


          <PaymentKpi
            tone="orange"
            icon={
              <IndianRupee
                size={18}
              />
            }
            value={
              formatCurrency(
                stats.pendingAmount,
                language
              )
            }
            label={
              text.pendingAmount
            }
          />

        </section>



        {/* =====================================================
            PAYMENT INSIGHT STRIP
        ====================================================== */}

        <section className="admin-payment-insight-strip">

          <div className="admin-payment-insight-icon">

            <Volume2
              size={19}
            />

          </div>


          <div>

            <strong>
              {text.voiceReadyTitle}
            </strong>


            <span>
              {text.voiceReadyText}
            </span>

          </div>


          <div className="admin-payment-insight-amount">

            <span>
              {text.pendingAmount}
            </span>


            <strong>
              {
                formatCurrency(
                  stats.pendingAmount,
                  language
                )
              }
            </strong>

          </div>

        </section>



        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="admin-payments-filter-panel">


          <div className="admin-payments-search">

            <Search
              size={16}
            />


            <input
              value={
                search
              }
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


          <div className="admin-payments-filter">

            <select
              value={
                filter
              }
              onChange={(event) =>
                setFilter(
                  event.target.value
                )
              }
            >

              <option value="PENDING">
                {text.pendingOnly}
              </option>

              <option value="PAID">
                {text.paidOnly}
              </option>

              <option value="ALL">
                {text.allPayments}
              </option>

            </select>

          </div>

        </section>



        {/* =====================================================
            TABLE
        ====================================================== */}

        <section className="admin-payments-table-panel">


          <div className="admin-payments-table-header">

            <div>

              <span className="admin-page-eyebrow">

                {text.paymentQueue}

              </span>


              <h3>

                {
                  filteredBookings.length
                }

                {" "}

                {text.records}

              </h3>

            </div>


            <span>
              {text.liveDatabase}
            </span>

          </div>



          <div className="admin-payments-table">


            <div className="admin-payments-table-head">

              <span>
                {text.booking}
              </span>

              <span>
                {text.farmer}
              </span>

              <span>
                {text.amount}
              </span>

              <span>
                {text.paymentStatus}
              </span>

              <span>
                {text.reference}
              </span>

              <span>
                {text.action}
              </span>

            </div>



            {loading ? (

              <PaymentLoading />

            ) : filteredBookings.length ===
              0 ? (

              <div className="admin-payments-empty">

                <CreditCard
                  size={25}
                />


                <strong>
                  {text.noPayments}
                </strong>


                <span>
                  {text.noPaymentsDescription}
                </span>

              </div>

            ) : (

              filteredBookings.map(
                (
                  booking
                ) => (

                  <PaymentRow
                    key={
                      booking.id
                    }
                    booking={
                      booking
                    }
                    language={
                      language
                    }
                    text={
                      text
                    }
                    onPay={() =>
                      openPayment(
                        booking
                      )
                    }
                  />

                )
              )

            )}

          </div>

        </section>



        <div className="admin-payments-footer">

          <span>
            {text.footer}
          </span>


          <span>

            {
              filteredBookings.length
            }

            {" "}

            {text.displayed}

          </span>

        </div>



        {showPaymentForm &&
          selectedBooking && (

            <PaymentForm
              booking={
                selectedBooking
              }
              language={
                language
              }
              text={
                text
              }
              saving={
                saving
              }
              onClose={() => {

                if (
                  saving
                ) {

                  return;

                }


                setShowPaymentForm(
                  false
                );


                setSelectedBooking(
                  null
                );

              }}
              onSubmit={
                submitPayment
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

function PaymentKpi({
  icon,
  tone,
  value,
  label,
}) {

  return (

    <div
      className={
        `admin-payment-kpi ${tone}`
      }
    >

      <div className="admin-payment-kpi-icon">

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
   ROW
========================================================= */

function PaymentRow({
  booking,
  language,
  text,
  onPay,
}) {

  const paid =
    booking.status ===
    "PAYMENT_SENT";


  const quantity =
    Number(
      booking.actual_quantity ??
      booking.estimated_quantity ??
      0
    );


  return (

    <div className="admin-payment-row">


      <div className="admin-payment-booking">

        <div className="admin-payment-token">

          #
          {
            booking.token ||
            booking.id
          }

        </div>


        <div>

          <strong>
            {
              booking.id
            }
          </strong>


          <span>

            {
              booking.date ||
              "—"
            }

          </span>

        </div>

      </div>



      <div className="admin-payment-farmer">

        <div className="admin-payment-avatar">

          <UserRound
            size={14}
          />

        </div>


        <div>

          <strong>

            {
              booking.farmer_name ||
              text.unknownFarmer
            }

          </strong>


          <span>

            {
              booking.farmer_phone ||
              "—"
            }

          </span>

        </div>

      </div>



      <div className="admin-payment-amount">

        <strong>

          {
            formatCurrency(
              booking.payment_amount ||
              0,
              language
            )
          }

        </strong>


        <span>

          {
            booking.payment_rate_per_kg
              ? `₹${booking.payment_rate_per_kg}/kg`
              : text.amountCalculated
          }

        </span>


        {quantity > 0 && (

          <small>

            {
              quantity.toLocaleString()
            }

            {" kg"}

          </small>

        )}

      </div>



      <div>

        <span
          className={
            `admin-payment-status ${
              paid
                ? "paid"
                : "pending"
            }`
          }
        >

          <span />


          {
            paid
              ? text.paid
              : text.pending
          }

        </span>

      </div>



      <div className="admin-payment-reference">

        <strong>

          {
            booking.payment_reference ||
            "—"
          }

        </strong>


        {booking.payment_method && (

          <span>

            {
              booking.payment_method
            }

          </span>

        )}

      </div>



      <div>

        {paid ? (

          <span className="admin-payment-completed">

            <CheckCircle2
              size={13}
            />

            {text.completed}

          </span>

        ) : (

          <button
            type="button"
            className="admin-payment-pay-button"
            onClick={
              onPay
            }
          >

            <IndianRupee
              size={13}
            />

            {text.recordPayment}

            <ArrowRight
              size={13}
            />

          </button>

        )}

      </div>


    </div>

  );

}


/* =========================================================
   PAYMENT FORM
========================================================= */

function PaymentForm({
  booking,
  language,
  text,
  saving,
  onClose,
  onSubmit,
}) {

  const [
    amount,
    setAmount,
  ] =
    useState(
      String(
        booking.payment_amount ||
        ""
      )
    );


  const [
    method,
    setMethod,
  ] =
    useState(
      booking.payment_method ||
      "UPI"
    );


  const [
    reference,
    setReference,
  ] =
    useState(
      ""
    );


  const [
    notes,
    setNotes,
  ] =
    useState(
      ""
    );


  const [
    payeeUpi,
    setPayeeUpi,
  ] =
    useState(
      booking.farmer_upi_id ||
      booking.upi_id ||
      ""
    );


  const [
    referenceCopied,
    setReferenceCopied,
  ] =
    useState(
      false
    );


  const amountNumber =
    Number(
      amount ||
      0
    );


  const quantity =
    Number(
      booking.actual_quantity ??
      booking.estimated_quantity ??
      0
    );


  const rate =
    Number(
      booking.payment_rate_per_kg ||
      0
    );


  const calculatedAmount =
    quantity > 0 &&
    rate > 0
      ? quantity *
        rate
      : null;


  const amountDifference =
    calculatedAmount !== null &&
    amountNumber > 0
      ? amountNumber -
        calculatedAmount
      : null;


  function copyReference() {

    if (
      !reference.trim()
    ) {

      return;

    }


    if (
      navigator?.clipboard
    ) {

      navigator.clipboard
        .writeText(
          reference.trim()
        )
        .then(() => {

          setReferenceCopied(
            true
          );


          window.setTimeout(
            () =>
              setReferenceCopied(
                false
              ),
            1800
          );

        })
        .catch(
          () => {}
        );

    }

  }


  function openUpi() {

    const upi =
      payeeUpi
        .trim();


    if (
      !upi
    ) {

      return;

    }


    const name =
      booking.farmer_name ||
      "KrishiSetu Farmer";


    const currentAmount =
      Number(
        amount ||
        0
      );


    const params =
      new URLSearchParams({

        pa:
          upi,

        pn:
          name,

        tr:
          booking.token ||
          booking.id,

        tn:
          `KrishiSetu payment ${booking.token || booking.id}`,

        am:
          currentAmount > 0
            ? currentAmount.toFixed(
                2
              )
            : "",

        cu:
          "INR",

      });


    window.location.href =
      `upi://pay?${params.toString()}`;

  }


  function openBankPortal() {

    const bankLinks = {

      SBI:
        "https://onlinesbi.sbi/",

      HDFC:
        "https://netbanking.hdfcbank.com/",

      ICICI:
        "https://infinity.icicibank.com/",

      AXIS:
        "https://omni.axisbank.co.in/",

    };


    const chosenBank =
      method ===
        "BANK_TRANSFER"
        ? "SBI"
        : "SBI";


    window.open(
      bankLinks[
        chosenBank
      ],
      "_blank",
      "noopener,noreferrer"
    );

  }


  function submit(
    event
  ) {

    event.preventDefault();


    if (
      Number(
        amount
      ) <=
      0
    ) {

      return;

    }


    onSubmit({

      amount,

      method,

      reference,

      notes,

    });

  }


  return (

    <div className="admin-payment-form-overlay">


      <div className="admin-payment-form-modal">


        <div className="admin-payment-form-header">


          <div>

            <span className="admin-page-eyebrow">

              {text.paymentForm}

            </span>


            <h2>

              {text.recordPayment}

            </h2>


            <p>

              {
                text.paymentFormDescription
              }

            </p>

          </div>


          <button
            type="button"
            className="admin-payment-form-close"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >

            <X
              size={18}
            />

          </button>

        </div>



        {/* =====================================================
            BOOKING SUMMARY
        ====================================================== */}

        <div className="admin-payment-form-summary">


          <div className="admin-payment-form-booking">


            <div className="admin-payment-form-token">

              #

              {
                booking.token ||
                booking.id
              }

            </div>


            <div>

              <strong>

                {
                  booking.farmer_name ||
                  text.unknownFarmer
                }

              </strong>


              <span>

                {
                  booking.farmer_phone ||
                  "—"
                }

              </span>

            </div>

          </div>



          <div className="admin-payment-form-verification">


            <div>

              <span>
                {text.crop}
              </span>


              <strong>
                {
                  getCropName(
                    booking.crop,
                    language
                  )
                }
              </strong>

            </div>


            <div>

              <span>
                {text.quantity}
              </span>


              <strong>

                {
                  quantity.toLocaleString()
                }

                {" kg"}

              </strong>

            </div>


            <div>

              <span>
                {text.rate}
              </span>


              <strong>

                {
                  rate > 0
                    ? formatCurrency(
                        rate,
                        language
                      )
                    : "—"
                }

                /kg

              </strong>

            </div>


            <div>

              <span>
                {text.calculatedAmount}
              </span>


              <strong>

                {
                  calculatedAmount !==
                  null
                    ? formatCurrency(
                        calculatedAmount,
                        language
                      )
                    : "—"
                }

              </strong>

            </div>

          </div>

        </div>



        {/* =====================================================
            FORM
        ====================================================== */}

        <form
          className="admin-payment-form"
          onSubmit={
            submit
          }
        >


          <label className="admin-payment-field">

            <span>
              {text.amount}
            </span>


            <div className="admin-payment-input-wrap">

              <span>
                ₹
              </span>


              <input
                type="number"
                min="0.01"
                step="0.01"
                value={
                  amount
                }
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                required
              />

            </div>


            {
              amountDifference !==
              null &&
              amountDifference !==
                0 && (

                <small
                  className={
                    amountDifference >
                    0
                      ? "payment-amount-warning positive"
                      : "payment-amount-warning negative"
                  }
                >

                  {amountDifference >
                  0
                    ? `${text.aboveCalculated} ${formatCurrency(
                        Math.abs(
                          amountDifference
                        ),
                        language
                      )}`
                    : `${text.belowCalculated} ${formatCurrency(
                        Math.abs(
                          amountDifference
                        ),
                        language
                      )}`}

                </small>

              )
            }

          </label>



          <label className="admin-payment-field">

            <span>
              {text.method}
            </span>


            <select
              value={
                method
              }
              onChange={(event) =>
                setMethod(
                  event.target.value
                )
              }
            >

              <option value="UPI">
                UPI
              </option>

              <option value="BANK_TRANSFER">
                {text.bankTransfer}
              </option>

              <option value="NEFT">
                NEFT
              </option>

              <option value="RTGS">
                RTGS
              </option>

              <option value="CASH">
                {text.cash}
              </option>

            </select>

          </label>



          {
            method ===
            "UPI" && (

              <div className="admin-payment-upi-helper">


                <label className="admin-payment-field">

                  <span>
                    {text.payeeUpi}
                  </span>


                  <input
                    type="text"
                    value={
                      payeeUpi
                    }
                    onChange={(event) =>
                      setPayeeUpi(
                        event.target.value
                      )
                    }
                    placeholder={
                      text.payeeUpiPlaceholder
                    }
                  />

                </label>


                <button
                  type="button"
                  className="admin-payment-open-upi"
                  onClick={
                    openUpi
                  }
                  disabled={
                    !payeeUpi.trim() ||
                    amountNumber <=
                    0
                  }
                >

                  <ExternalLink
                    size={14}
                  />

                  {text.openUpi}

                </button>

              </div>

            )
          }



          {
            method ===
              "BANK_TRANSFER" && (

              <div className="admin-payment-bank-helper">

                <div>

                  <ShieldCheck
                    size={16}
                  />


                  <span>
                    {text.bankPortalNote}
                  </span>

                </div>


                <button
                  type="button"
                  onClick={
                    openBankPortal
                  }
                >

                  <ExternalLink
                    size={14}
                  />

                  {text.openBankPortal}

                </button>

              </div>

            )
          }



          <label className="admin-payment-field">

            <span>
              {text.reference}
            </span>


            <div className="admin-payment-reference-input">

              <input
                type="text"
                value={
                  reference
                }
                onChange={(event) =>
                  setReference(
                    event.target.value
                  )
                }
                placeholder={
                  text.referencePlaceholder
                }
                required
              />


              <button
                type="button"
                onClick={
                  copyReference
                }
                disabled={
                  !reference.trim()
                }
                aria-label={
                  text.copyReference
                }
              >

                {referenceCopied ? (

                  <Check
                    size={14}
                  />

                ) : (

                  <Copy
                    size={14}
                  />

                )}

              </button>

            </div>

          </label>



          <label className="admin-payment-field">

            <span>
              {text.notes}
            </span>


            <textarea
              value={
                notes
              }
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder={
                text.notesPlaceholder
              }
              rows="3"
            />

          </label>



          <div className="admin-payment-form-warning">

            <AlertTriangle
              size={15}
            />


            <span>

              {
                calculatedAmount !==
                null
                  ? text.paymentWarningWithAmount.replace(
                      "{amount}",
                      formatCurrency(
                        calculatedAmount,
                        language
                      )
                    )
                  : text.paymentWarning
              }

            </span>

          </div>



          <div className="admin-payment-form-actions">

            <button
              type="button"
              className="admin-payment-form-cancel"
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
              type="submit"
              className="admin-payment-form-submit"
              disabled={
                saving ||
                amountNumber <=
                0 ||
                !reference.trim()
              }
            >

              {saving ? (

                <RefreshCw
                  size={15}
                  className="admin-refresh-spin"
                />

              ) : (

                <CheckCircle2
                  size={15}
                />

              )}


              {
                saving
                  ? text.saving
                  : text.markPaid
              }

            </button>

          </div>

        </form>

      </div>

    </div>

  );
}


/* =========================================================
   LOADING
========================================================= */

function PaymentLoading() {

  return (

    <div className="admin-payment-loading">

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
            className="admin-payment-skeleton"
          >

            <span />
            <span />
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
   HELPERS
========================================================= */

function formatCurrency(
  value,
  language
) {

  const locale =
    language ===
      "hi"
      ? "hi-IN"
      : language ===
          "te"
        ? "te-IN"
        : "en-IN";


  return new Intl.NumberFormat(
    locale,
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        2,

    }
  ).format(
    Number(
      value ||
      0
    )
  );

}


function formatSpeechAmount(
  value
) {

  const number =
    Number(
      value ||
      0
    );


  return number
    .toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          2,
      }
    );

}


function getCropName(
  crop,
  language
) {

  const names = {

    wheat: {

      en:
        "Wheat",

      hi:
        "गेहूं",

      te:
        "గోధుమ",

    },

    paddy: {

      en:
        "Paddy",

      hi:
        "धान",

      te:
        "వరి",

    },

    maize: {

      en:
        "Maize",

      hi:
        "मक्का",

      te:
        "మొక్కజొన్న",

    },

    cotton: {

      en:
        "Cotton",

      hi:
        "कपास",

      te:
        "పత్తి",

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
   COPY
========================================================= */

function getPaymentsCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Admin Payments",

      subtitle:
        "Review, verify and record farmer payments.",

      eyebrow:
        "PAYMENT CONTROL",

      heading:
        "Control every payment before it is closed.",

      description:
        "Review amounts generated from procurement, record the payment reference and maintain a clear payment trail.",

      liveData:
        "LIVE DATA",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      paymentIssue:
        "Payment operation issue",

      paymentRecorded:
        "Payment recorded successfully.",

      paymentCases:
        "Payment cases",

      pendingPayments:
        "Pending payments",

      paidPayments:
        "Paid payments",

      pendingAmount:
        "Pending amount",

      searchPlaceholder:
        "Search token, farmer, phone or reference...",

      pendingOnly:
        "Pending only",

      paidOnly:
        "Paid only",

      allPayments:
        "All payments",

      paymentQueue:
        "PAYMENT QUEUE",

      records:
        "records",

      liveDatabase:
        "Live database",

      booking:
        "Booking",

      farmer:
        "Farmer",

      amount:
        "Amount",

      paymentStatus:
        "Status",

      reference:
        "Reference",

      action:
        "Action",

      noPayments:
        "No payment cases found",

      noPaymentsDescription:
        "There are no payment records matching the current filter.",

      footer:
        "Payment records are read from the live KrishiSetu database.",

      displayed:
        "displayed",

      unknownFarmer:
        "Unknown farmer",

      amountCalculated:
        "Procurement amount",

      paid:
        "Paid",

      pending:
        "Pending",

      completed:
        "Completed",

      recordPayment:
        "Record payment",

      paymentForm:
        "PAYMENT ENTRY",

      paymentFormDescription:
        "Verify the final amount and enter the transaction reference.",

      method:
        "Payment method",

      bankTransfer:
        "Bank transfer",

      cash:
        "Cash",

      referencePlaceholder:
        "Enter UPI / bank transaction reference...",

      notes:
        "Notes",

      notesPlaceholder:
        "Optional payment notes...",

      paymentWarning:
        "Marking this payment as sent permanently changes the booking status to PAYMENT_SENT.",

      paymentWarningWithAmount:
        "The calculated procurement amount is {amount}. Verify the amount and transaction reference before marking payment as sent.",

      cancel:
        "Cancel",

      markPaid:
        "Mark as Paid",

      saving:
        "Saving...",

      paymentError:
        "Unable to record payment.",

      invalidAmount:
        "Enter a valid payment amount greater than zero.",

      referenceRequired:
        "Enter the payment transaction reference.",

      quantity:
        "Quantity",

      rate:
        "Rate",

      crop:
        "Crop",

      calculatedAmount:
        "Calculated amount",

      aboveCalculated:
        "Amount is above calculated value by",

      belowCalculated:
        "Amount is below calculated value by",

      payeeUpi:
        "Farmer UPI ID",

      payeeUpiPlaceholder:
        "example@upi",

      openUpi:
        "Open UPI App",

      bankPortalNote:
        "The bank portal opens separately. Complete the actual transfer there and return here to record the transaction reference.",

      openBankPortal:
        "Open Bank Portal",

      copyReference:
        "Copy reference",

      voiceReadyTitle:
        "Voice confirmation ready",

      voiceReadyText:
        "After a successful payment, the operator receives an automatic confirmation announcement in the farmer's language when available.",

    },


    hi: {

      title:
        "एडमिन भुगतान",

      subtitle:
        "किसान भुगतान की समीक्षा, पुष्टि और रिकॉर्ड करें।",

      eyebrow:
        "भुगतान नियंत्रण",

      heading:
        "हर भुगतान को बंद करने से पहले नियंत्रित करें।",

      description:
        "खरीद से बनी राशि की समीक्षा करें, भुगतान संदर्भ दर्ज करें और स्पष्ट भुगतान रिकॉर्ड बनाए रखें।",

      liveData:
        "लाइव डेटा",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      paymentIssue:
        "भुगतान ऑपरेशन समस्या",

      paymentRecorded:
        "भुगतान सफलतापूर्वक रिकॉर्ड किया गया।",

      paymentCases:
        "भुगतान मामले",

      pendingPayments:
        "लंबित भुगतान",

      paidPayments:
        "भुगतान किए गए",

      pendingAmount:
        "लंबित राशि",

      searchPlaceholder:
        "टोकन, किसान, फोन या संदर्भ खोजें...",

      pendingOnly:
        "केवल लंबित",

      paidOnly:
        "केवल भुगतान किए गए",

      allPayments:
        "सभी भुगतान",

      paymentQueue:
        "भुगतान कतार",

      records:
        "रिकॉर्ड",

      liveDatabase:
        "लाइव डेटाबेस",

      booking:
        "बुकिंग",

      farmer:
        "किसान",

      amount:
        "राशि",

      paymentStatus:
        "स्थिति",

      reference:
        "संदर्भ",

      action:
        "कार्रवाई",

      noPayments:
        "कोई भुगतान मामला नहीं मिला",

      noPaymentsDescription:
        "वर्तमान फ़िल्टर के अनुसार कोई भुगतान रिकॉर्ड नहीं है।",

      footer:
        "भुगतान रिकॉर्ड लाइव KrishiSetu डेटाबेस से पढ़े जाते हैं।",

      displayed:
        "दिखाए गए",

      unknownFarmer:
        "अज्ञात किसान",

      amountCalculated:
        "खरीद राशि",

      paid:
        "भुगतान किया",

      pending:
        "लंबित",

      completed:
        "पूरा",

      recordPayment:
        "भुगतान रिकॉर्ड करें",

      paymentForm:
        "भुगतान प्रविष्टि",

      paymentFormDescription:
        "अंतिम राशि सत्यापित करें और लेनदेन संदर्भ दर्ज करें।",

      method:
        "भुगतान विधि",

      bankTransfer:
        "बैंक ट्रांसफर",

      cash:
        "नकद",

      referencePlaceholder:
        "UPI / बैंक लेनदेन संदर्भ दर्ज करें...",

      notes:
        "नोट्स",

      notesPlaceholder:
        "वैकल्पिक भुगतान नोट्स...",

      paymentWarning:
        "भुगतान भेजा गया के रूप में चिह्नित करने पर बुकिंग स्थिति PAYMENT_SENT हो जाएगी।",

      paymentWarningWithAmount:
        "गणना की गई खरीद राशि {amount} है। भुगतान भेजने से पहले राशि और लेनदेन संदर्भ सत्यापित करें।",

      cancel:
        "रद्द करें",

      markPaid:
        "भुगतान किया गया चिन्हित करें",

      saving:
        "सहेजा जा रहा है...",

      paymentError:
        "भुगतान रिकॉर्ड नहीं किया जा सका।",

      invalidAmount:
        "शून्य से अधिक मान्य भुगतान राशि दर्ज करें।",

      referenceRequired:
        "भुगतान लेनदेन संदर्भ दर्ज करें।",

      quantity:
        "मात्रा",

      rate:
        "दर",

      crop:
        "फसल",

      calculatedAmount:
        "गणना की गई राशि",

      aboveCalculated:
        "राशि गणना से अधिक है:",

      belowCalculated:
        "राशि गणना से कम है:",

      payeeUpi:
        "किसान UPI ID",

      payeeUpiPlaceholder:
        "example@upi",

      openUpi:
        "UPI ऐप खोलें",

      bankPortalNote:
        "बैंक पोर्टल अलग से खुलेगा। वहां वास्तविक ट्रांसफर पूरा करें और वापस आकर लेनदेन संदर्भ दर्ज करें।",

      openBankPortal:
        "बैंक पोर्टल खोलें",

      copyReference:
        "संदर्भ कॉपी करें",

      voiceReadyTitle:
        "वॉइस पुष्टि तैयार",

      voiceReadyText:
        "सफल भुगतान के बाद उपलब्ध किसान भाषा में ऑपरेटर को स्वचालित पुष्टि सुनाई जाएगी।",

    },


    te: {

      title:
        "అడ్మిన్ చెల్లింపులు",

      subtitle:
        "రైతుల చెల్లింపులను సమీక్షించి, నిర్ధారించి నమోదు చేయండి.",

      eyebrow:
        "చెల్లింపు నియంత్రణ",

      heading:
        "ప్రతి చెల్లింపును ముగించే ముందు నియంత్రించండి.",

      description:
        "కొనుగోలు ద్వారా వచ్చిన మొత్తాన్ని సమీక్షించి, చెల్లింపు రిఫరెన్స్ నమోదు చేసి, స్పష్టమైన చెల్లింపు రికార్డును నిర్వహించండి.",

      liveData:
        "లైవ్ డేటా",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      paymentIssue:
        "చెల్లింపు ఆపరేషన్ సమస్య",

      paymentRecorded:
        "చెల్లింపు విజయవంతంగా నమోదు చేయబడింది.",

      paymentCases:
        "చెల్లింపు కేసులు",

      pendingPayments:
        "పెండింగ్ చెల్లింపులు",

      paidPayments:
        "చెల్లించినవి",

      pendingAmount:
        "పెండింగ్ మొత్తం",

      searchPlaceholder:
        "టోకెన్, రైతు, ఫోన్ లేదా రిఫరెన్స్ వెతకండి...",

      pendingOnly:
        "పెండింగ్ మాత్రమే",

      paidOnly:
        "చెల్లించినవి మాత్రమే",

      allPayments:
        "అన్ని చెల్లింపులు",

      paymentQueue:
        "చెల్లింపు క్యూ",

      records:
        "రికార్డులు",

      liveDatabase:
        "లైవ్ డేటాబేస్",

      booking:
        "బుకింగ్",

      farmer:
        "రైతు",

      amount:
        "మొత్తం",

      paymentStatus:
        "స్థితి",

      reference:
        "రిఫరెన్స్",

      action:
        "చర్య",

      noPayments:
        "చెల్లింపు కేసులు కనుగొనబడలేదు",

      noPaymentsDescription:
        "ప్రస్తుత ఫిల్టర్‌కు సరిపోయే చెల్లింపు రికార్డులు లేవు.",

      footer:
        "చెల్లింపు రికార్డులు లైవ్ KrishiSetu డేటాబేస్ నుండి చదవబడతాయి.",

      displayed:
        "చూపబడుతున్నవి",

      unknownFarmer:
        "తెలియని రైతు",

      amountCalculated:
        "కొనుగోలు మొత్తం",

      paid:
        "చెల్లించబడింది",

      pending:
        "పెండింగ్",

      completed:
        "పూర్తైంది",

      recordPayment:
        "చెల్లింపు నమోదు",

      paymentForm:
        "చెల్లింపు నమోదు",

      paymentFormDescription:
        "చివరి మొత్తాన్ని నిర్ధారించి లావాదేవీ రిఫరెన్స్ నమోదు చేయండి.",

      method:
        "చెల్లింపు విధానం",

      bankTransfer:
        "బ్యాంక్ ట్రాన్స్‌ఫర్",

      cash:
        "నగదు",

      referencePlaceholder:
        "UPI / బ్యాంక్ ట్రాన్సాక్షన్ రిఫరెన్స్ నమోదు చేయండి...",

      notes:
        "నోట్స్",

      notesPlaceholder:
        "ఐచ్ఛిక చెల్లింపు నోట్స్...",

      paymentWarning:
        "చెల్లింపు పంపబడిందిగా గుర్తిస్తే బుకింగ్ స్థితి PAYMENT_SENT అవుతుంది.",

      paymentWarningWithAmount:
        "లెక్కించిన కొనుగోలు మొత్తం {amount}. చెల్లింపు పంపబడిందిగా గుర్తించే ముందు మొత్తాన్ని మరియు లావాదేవీ రిఫరెన్స్‌ను ధృవీకరించండి.",

      cancel:
        "రద్దు చేయండి",

      markPaid:
        "చెల్లించినట్లు గుర్తించండి",

      saving:
        "సేవ్ చేస్తోంది...",

      paymentError:
        "చెల్లింపును నమోదు చేయలేకపోయాము.",

      invalidAmount:
        "సున్నా కంటే ఎక్కువ సరైన చెల్లింపు మొత్తాన్ని నమోదు చేయండి.",

      referenceRequired:
        "చెల్లింపు లావాదేవీ రిఫరెన్స్ నమోదు చేయండి.",

      quantity:
        "పరిమాణం",

      rate:
        "రేటు",

      crop:
        "పంట",

      calculatedAmount:
        "లెక్కించిన మొత్తం",

      aboveCalculated:
        "లెక్కించిన మొత్తానికి ఎక్కువ:",

      belowCalculated:
        "లెక్కించిన మొత్తానికి తక్కువ:",

      payeeUpi:
        "రైతు UPI ID",

      payeeUpiPlaceholder:
        "example@upi",

      openUpi:
        "UPI యాప్ తెరవండి",

      bankPortalNote:
        "బ్యాంక్ పోర్టల్ విడిగా తెరుచుకుంటుంది. అక్కడ నిజమైన ట్రాన్స్‌ఫర్ పూర్తి చేసి, తిరిగి వచ్చి లావాదేవీ రిఫరెన్స్ నమోదు చేయండి.",

      openBankPortal:
        "బ్యాంక్ పోర్టల్ తెరవండి",

      copyReference:
        "రిఫరెన్స్ కాపీ చేయండి",

      voiceReadyTitle:
        "వాయిస్ నిర్ధారణ సిద్ధంగా ఉంది",

      voiceReadyText:
        "విజయవంతమైన చెల్లింపు తర్వాత అందుబాటులో ఉన్న రైతు భాషలో ఆపరేటర్‌కు ఆటోమేటిక్ నిర్ధారణ వినిపించబడుతుంది.",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default AdminPayments;