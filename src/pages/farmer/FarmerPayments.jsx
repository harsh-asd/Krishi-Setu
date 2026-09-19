import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  HelpCircle,
  MessageSquareText,
  RefreshCw,
  Scale,
  Search,
  Wheat,
} from "lucide-react";

import { Link, useNavigate } from "react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";

import {
  useLanguage,
} from "../../translations/LanguageContext";

import {
  getCurrentFarmer,
} from "../../data/appStore";


const API_URL =
  import.meta.env.VITE_API_URL;


function FarmerPayments() {
  const navigate = useNavigate();

  const {
    t,
    language,
  } =
    useLanguage();


  const farmer =
    getCurrentFarmer();


  const [
    bookings,
    setBookings,
  ] =
  useState([]);


  const [
    loading,
    setLoading,
  ] =
  useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
  useState(false);


  const [
    error,
    setError,
  ] =
  useState("");


  const [
    search,
    setSearch,
  ] =
  useState("");


  const [
    filter,
    setFilter,
  ] =
  useState("ALL");


  const [
    issueBooking,
    setIssueBooking,
  ] =
  useState(null);


  const [
    issueText,
    setIssueText,
  ] =
  useState("");


  const [
    issueSending,
    setIssueSending,
  ] =
  useState(false);


  const [
    issueMessage,
    setIssueMessage,
  ] =
  useState("");


  const farmerId =
    farmer?.id ||
    null;


  const loadPayments =
    useCallback(
      async (
        manual = false
      ) => {

        if (
          !farmerId
        ) {

          setError(
            getText(
              language,
              "Farmer account could not be loaded.",
              "किसान खाता लोड नहीं हो सका।",
              "రైతు ఖాతాను లోడ్ చేయలేకపోయాము."
            )
          );

          setLoading(false);

          return;

        }


        if (
          manual
        ) {

          setRefreshing(true);

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
              "Unable to load payment history."
            );

          }


          const allBookings =
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : [];


          const mine =
            allBookings.filter(
              (
                booking
              ) =>
                String(
                  booking?.farmer_id ??
                  ""
                ) ===
                String(
                  farmerId
                )
            );


          setBookings(
            mine
          );

          setError("");


        } catch (
          paymentError
        ) {

          console.error(
            "FarmerPayments error:",
            paymentError
          );


          setError(
            paymentError?.message ||
            getText(
              language,
              "Unable to load payment history.",
              "भुगतान इतिहास लोड नहीं हो सका।",
              "చెల్లింపు చరిత్రను లోడ్ చేయలేకపోయాము."
            )
          );


        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      [
        farmerId,
        language,
      ]
    );


  useEffect(
    () => {

      loadPayments();


      const timer =
        setInterval(
          () =>
            loadPayments(),
          5000
        );


      return () => {

        clearInterval(
          timer
        );

      };

    },
    [
      loadPayments,
    ]
  );


  const paymentRows =
    useMemo(
      () =>
        bookings
          .filter(
            (
              booking
            ) =>
              Number(
                booking.payment_amount ||
                0
              ) > 0 ||
              booking.status ===
                "PAYMENT_PENDING"
          )
          .filter(
            (
              booking
            ) => {

              if (
                filter ===
                "PAID"
              ) {

                return (
                  booking.status ===
                  "PAYMENT_SENT"
                );

              }


              if (
                filter ===
                "PENDING"
              ) {

                return (
                  booking.status ===
                    "PAYMENT_PENDING" ||
                  booking.status ===
                    "PROCURED"
                );

              }


              return true;

            }
          )
          .filter(
            (
              booking
            ) => {

              const query =
                search
                  .trim()
                  .toLowerCase();


              if (
                !query
              ) {

                return true;

              }


              const text =
                [
                  booking.id,
                  booking.token,
                  booking.crop,
                  booking.date,
                  booking.payment_reference,
                  booking.payment_method,
                  booking.status,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              return text.includes(
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
                b.date ||
                ""
              ).localeCompare(
                String(
                  a.date ||
                  ""
                )
              ) ||
              String(
                b.created_at ||
                ""
              ).localeCompare(
                String(
                  a.created_at ||
                  ""
                )
              )
          ),
      [
        bookings,
        filter,
        search,
      ]
    );


  const summary =
    useMemo(
      () => {

        const paid =
          bookings.filter(
            (
              booking
            ) =>
              booking.status ===
              "PAYMENT_SENT"
          );


        const pending =
          bookings.filter(
            (
              booking
            ) =>
              booking.status ===
              "PAYMENT_PENDING"
          );


        const received =
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


        return {

          received,

          paidCount:
            paid.length,

          pendingCount:
            pending.length,

          pendingAmount,

        };

      },
      [
        bookings,
      ]
    );


  function openIssue(
    booking
  ) {

    setIssueBooking(
      booking
    );

    setIssueText("");

    setIssueMessage("");

  }


  function closeIssue() {

    if (
      issueSending
    ) {

      return;

    }


    setIssueBooking(
      null
    );

    setIssueText("");

    setIssueMessage("");

  }


  async function submitIssue() {

    if (
      !issueBooking
    ) {

      return;

    }


    if (
      !issueText.trim()
    ) {

      setIssueMessage(
        getText(
          language,
          "Please describe the payment problem.",
          "कृपया भुगतान की समस्या बताएं।",
          "దయచేసి చెల్లింపు సమస్యను వివరించండి."
        )
      );

      return;

    }


    setIssueSending(true);

    setIssueMessage("");


    try {

      const response =
        await fetch(
          `${API_URL}/payment-issues`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                farmerId,
                bookingId:
                  issueBooking.id,
                message:
                  issueText.trim(),
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
          "Unable to submit the payment issue."
        );

      }


      setIssueMessage(
        getText(
          language,
          "Payment issue submitted successfully.",
          "भुगतान समस्या सफलतापूर्वक भेज दी गई।",
          "చెల్లింపు సమస్య విజయవంతంగా పంపబడింది."
        )
      );


      setTimeout(
        () => {

          setIssueBooking(
            null
          );

          setIssueText("");

          setIssueMessage("");

        },
        1300
      );


    } catch (
      submitError
    ) {

      console.error(
        "Payment issue error:",
        submitError
      );


      setIssueMessage(
        submitError?.message ||
        getText(
          language,
          "Unable to submit the payment issue.",
          "भुगतान समस्या भेजी नहीं जा सकी।",
          "చెల్లింపు సమస్యను పంపలేకపోయాము."
        )
      );

    } finally {

      setIssueSending(false);

    }

  }


  if (
    !farmer
  ) {

    return (

      <div className="farmer-payments-page">

        <Header />


        <main className="farmer-payments-container">

          <section className="farmer-payments-empty">

            <div className="farmer-payments-empty-icon">

              <HelpCircle
                size={30}
              />

            </div>


            <h1>

              {getText(
                language,
                "Farmer account not found",
                "किसान खाता नहीं मिला",
                "రైతు ఖాతా కనుగొనబడలేదు"
              )}

            </h1>


            <p>

              {getText(
                language,
                "Please login again to continue.",
                "जारी रखने के लिए फिर लॉगिन करें।",
                "కొనసాగించడానికి మళ్లీ లాగిన్ చేయండి."
              )}

            </p>


            <Link
              to="/farmer/login"
              className="home-primary-action"
            >

              {getText(
                language,
                "Go to Login",
                "लॉगिन पर जाएं",
                "లాగిన్‌కు వెళ్లండి"
              )}

              <ArrowRight
                size={17}
              />

            </Link>

          </section>

        </main>

      </div>

    );

  }


  return (

    <div className="farmer-payments-page">

      <Header />


      <main className="farmer-payments-container">


        {/* HEADER */}

        <section className="farmer-payments-top">

          <div>

            <Link
              to="/farmer/home"
              className="back-link"
            >

              <ArrowLeft
                size={18}
              />

              {getText(
                language,
                "Back to Home",
                "होम पर वापस जाएं",
                "హోమ్‌కు తిరిగి వెళ్లండి"
              )}

            </Link>


            <span className="page-eyebrow">

              {getText(
                language,
                "PAYMENT HISTORY",
                "भुगतान इतिहास",
                "చెల్లింపు చరిత్ర"
              )}

            </span>


            <h1>

              {getText(
                language,
                "Your payments",
                "आपके भुगतान",
                "మీ చెల్లింపులు"
              )}

            </h1>


            <p>

              {getText(
                language,
                "See every payment connected to your procurement records.",
                "अपनी खरीद से जुड़े सभी भुगतान यहां देखें।",
                "మీ కొనుగోళ్లకు సంబంధించిన అన్ని చెల్లింపులను ఇక్కడ చూడండి."
              )}

            </p>

          </div>


          <button
            type="button"
            className="farmer-payments-refresh"
            onClick={() =>
              loadPayments(true)
            }
            disabled={
              refreshing
            }
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "loading-spin"
                  : ""
              }
            />


            {getText(
              language,
              "Refresh",
              "रीफ्रेश",
              "రిఫ్రెష్"
            )}

          </button>

        </section>



        {/* SUMMARY */}

        <section className="farmer-payments-summary">

          <PaymentStat
            icon={
              <CheckCircle2
                size={21}
              />
            }
            label={getText(
              language,
              "Total received",
              "कुल प्राप्त",
              "మొత్తం అందుకున్నది"
            )}
            value={
              `₹${summary.received.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}`
            }
            tone="green"
          />


          <PaymentStat
            icon={
              <CreditCard
                size={21}
              />
            }
            label={getText(
              language,
              "Payments completed",
              "पूरे हुए भुगतान",
              "పూర్తైన చెల్లింపులు"
            )}
            value={
              summary.paidCount
            }
            tone="blue"
          />


          <PaymentStat
            icon={
              <Coins
                size={21}
              />
            }
            label={getText(
              language,
              "Pending payments",
              "लंबित भुगतान",
              "పెండింగ్ చెల్లింపులు"
            )}
            value={
              summary.pendingCount
            }
            tone="orange"
          />


          <PaymentStat
            icon={
              <Scale
                size={21}
              />
            }
            label={getText(
              language,
              "Pending amount",
              "लंबित राशि",
              "పెండింగ్ మొత్తం"
            )}
            value={
              `₹${summary.pendingAmount.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}`
            }
            tone="gold"
          />

        </section>



        {/* SEARCH */}

        <section className="farmer-payments-filter-bar">

          <div className="farmer-payments-search">

            <Search
              size={19}
            />


            <input
              type="text"
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={getText(
                language,
                "Search token, crop or reference...",
                "टोकन, फसल या संदर्भ खोजें...",
                "టోకెన్, పంట లేదా రిఫరెన్స్ వెతకండి..."
              )}
            />

          </div>


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

            <option value="ALL">

              {getText(
                language,
                "All payments",
                "सभी भुगतान",
                "అన్ని చెల్లింపులు"
              )}

            </option>


            <option value="PAID">

              {getText(
                language,
                "Paid",
                "भुगतान हुआ",
                "చెల్లించబడింది"
              )}

            </option>


            <option value="PENDING">

              {getText(
                language,
                "Pending",
                "लंबित",
                "పెండింగ్"
              )}

            </option>

          </select>


          {
            (
              search ||
              filter !==
                "ALL"
            ) && (

              <button
                type="button"
                onClick={() => {

                  setSearch("");

                  setFilter(
                    "ALL"
                  );

                }}
              >

                {getText(
                  language,
                  "Clear",
                  "साफ करें",
                  "క్లియర్"
                )}

              </button>

            )
          }

        </section>



        {/* LIST */}

        <section className="farmer-payments-list-card">

          <div className="farmer-payments-list-heading">

            <div>

              <span className="page-eyebrow">

                {getText(
                  language,
                  "PAYMENT RECORDS",
                  "भुगतान रिकॉर्ड",
                  "చెల్లింపు రికార్డులు"
                )}

              </span>


              <h2>

                {
                  paymentRows.length
                }

                {" "}

                {getText(
                  language,
                  "records",
                  "रिकॉर्ड",
                  "రికార్డులు"
                )}

              </h2>

            </div>

          </div>


          {
            loading ? (

              <div className="farmer-payments-state">

                <RefreshCw
                  size={27}
                  className="loading-spin"
                />


                <strong>

                  {getText(
                    language,
                    "Loading payment history...",
                    "भुगतान इतिहास लोड हो रहा है...",
                    "చెల్లింపు చరిత్ర లోడ్ అవుతోంది..."
                  )}

                </strong>

              </div>

            ) : error ? (

              <div className="farmer-payments-state">

                <HelpCircle
                  size={27}
                />


                <strong>

                  {getText(
                    language,
                    "Unable to load payments",
                    "भुगतान लोड नहीं हो सके",
                    "చెల్లింపులను లోడ్ చేయలేకపోయాము"
                  )}

                </strong>


                <span>
                  {error}
                </span>


                <button
                  type="button"
                  className="home-primary-action"
                  onClick={() =>
                    loadPayments(true)
                  }
                >

                  {getText(
                    language,
                    "Try again",
                    "फिर कोशिश करें",
                    "మళ్లీ ప్రయత్నించండి"
                  )}

                </button>

              </div>

            ) : paymentRows.length ===
                0 ? (

              <div className="farmer-payments-state">

                <Coins
                  size={28}
                />


                <strong>

                  {getText(
                    language,
                    "No payment records found",
                    "कोई भुगतान रिकॉर्ड नहीं मिला",
                    "చెల్లింపు రికార్డులు ఏవీ లేవు"
                  )}

                </strong>


                <span>

                  {getText(
                    language,
                    "Completed and pending payments will appear here.",
                    "पूरे और लंबित भुगतान यहां दिखाई देंगे।",
                    "పూర్తైన మరియు పెండింగ్ చెల్లింపులు ఇక్కడ కనిపిస్తాయి."
                  )}

                </span>

              </div>

            ) : (

              <div className="farmer-payments-list">

                {
                  paymentRows.map(
                    (
                      booking
                    ) => {

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

                        <div
                          key={
                            booking.id
                          }
                          className="farmer-payment-record"
                        >

                          <Link
                            to={
                              `/farmer/token?booking=${encodeURIComponent(
                                booking.id
                              )}`
                            }
                            className="farmer-payment-record-main-link"
                          >

                            <div
                              className={
                                `farmer-payment-record-icon ${
                                  paid
                                    ? "paid"
                                    : "pending"
                                }`
                              }
                            >

                              {
                                paid
                                  ? (
                                    <CheckCircle2
                                      size={20}
                                    />
                                  )
                                  : (
                                    <Coins
                                      size={20}
                                    />
                                  )
                              }

                            </div>


                            <div className="farmer-payment-record-content">

                              <div className="farmer-payment-record-title">

                                <strong>

                                  {
                                    getCropName(
                                      booking.crop,
                                      language,
                                      t
                                    )
                                  }

                                </strong>


                                <span>

                                  #
                                  {
                                    booking.token ||
                                    booking.id
                                  }

                                </span>

                              </div>


                              <div className="farmer-payment-record-meta">

                                <span>

                                  <CalendarDays
                                    size={14}
                                  />

                                  {
                                    formatDate(
                                      booking.date,
                                      language
                                    )
                                  }

                                </span>


                                <span>

                                  <Scale
                                    size={14}
                                  />

                                  {
                                    quantity.toLocaleString()
                                  }

                                  {" kg"}

                                </span>


                                {
                                  booking.payment_method && (

                                    <span>

                                      <CreditCard
                                        size={14}
                                      />

                                      {
                                        booking.payment_method
                                      }

                                    </span>

                                  )
                                }

                              </div>

                            </div>


                            <div className="farmer-payment-record-amount">

                              <strong>

                                {
                                  Number(
                                    booking.payment_amount ||
                                    0
                                  ) > 0
                                    ? `₹${Number(
                                        booking.payment_amount
                                      ).toLocaleString(
                                        "en-IN",
                                        {
                                          maximumFractionDigits:
                                            2,
                                        }
                                      )}`
                                    : "—"
                                }

                              </strong>


                              <span>

                                {
                                  paid
                                    ? getText(
                                        language,
                                        "Payment sent",
                                        "भुगतान भेजा गया",
                                        "చెల్లింపు పంపబడింది"
                                      )
                                    : getText(
                                        language,
                                        "Payment pending",
                                        "भुगतान लंबित",
                                        "చెల్లింపు పెండింగ్"
                                      )
                                }

                              </span>

                            </div>


                            <div className="farmer-payment-record-reference">

                              <span>

                                {getText(
                                  language,
                                  "REFERENCE",
                                  "संदर्भ",
                                  "రిఫరెన్స్"
                                )}

                              </span>


                              <strong>

                                {
                                  booking.payment_reference ||
                                  "—"
                                }

                              </strong>

                            </div>


                            <ChevronRight
                              size={18}
                            />

                          </Link>


                          {
                            paid && (

                              <div className="farmer-payment-record-actions">

                                <div className="farmer-payment-sms-status">

                                  <MessageSquareText
                                    size={15}
                                  />

                                  <span>

                                    {getText(
                                      language,
                                      "SMS confirmation available",
                                      "SMS पुष्टि उपलब्ध है",
                                      "SMS నిర్ధారణ అందుబాటులో ఉంది"
                                    )}

                                  </span>

                                </div>


                                <button
                                  type="button"
                                  className="farmer-payment-issue-button"
                                  onClick={() => navigate(`/farmer/payment-issue/${booking.id}`)}
                                >

                                  <HelpCircle
                                    size={14}
                                  />

                                  {getText(
                                    language,
                                    "Report payment issue",
                                    "भुगतान समस्या बताएं",
                                    "చెల్లింపు సమస్యను నివేదించండి"
                                  )}

                                </button>

                              </div>

                            )
                          }

                        </div>

                      );

                    }
                  )
                }

              </div>

            )
          }

        </section>



        {/* SMS INFO */}

        <section className="farmer-payments-sms-card">

          <div className="farmer-payments-sms-icon">

            <MessageSquareText
              size={23}
            />

          </div>


          <div>

            <span>

              {getText(
                language,
                "PAYMENT SMS",
                "भुगतान SMS",
                "చెల్లింపు SMS"
              )}

            </span>


            <h2>

              {getText(
                language,
                "Payment confirmation is sent to your registered mobile.",
                "भुगतान की पुष्टि आपके पंजीकृत मोबाइल पर भेजी जाती है।",
                "చెల్లింపు నిర్ధారణ మీ రిజిస్టర్డ్ మొబైల్‌కు పంపబడుతుంది."
              )}

            </h2>


            <p>

              {getText(
                language,
                "Keep your registered mobile number active so you can receive procurement and payment updates.",
                "अपना पंजीकृत मोबाइल नंबर सक्रिय रखें ताकि खरीद और भुगतान अपडेट मिलते रहें।",
                "కొనుగోలు మరియు చెల్లింపు అప్‌డేట్‌లను పొందడానికి మీ రిజిస్టర్డ్ మొబైల్ నంబర్‌ను యాక్టివ్‌గా ఉంచండి."
              )}

            </p>

          </div>

        </section>



        {/* FOOTER */}

        <div className="farmer-payments-footer">

          <Link
            to="/farmer/home"
            className="home-secondary-action"
          >

            <ArrowLeft
              size={16}
            />

            {getText(
              language,
              "Back to Home",
              "होम पर वापस जाएं",
              "హోమ్‌కు తిరిగి వెళ్లండి"
            )}

          </Link>


          <Link
            to="/farmer/history"
            className="home-secondary-action"
          >

            {getText(
              language,
              "Procurement history",
              "खरीद इतिहास",
              "కొనుగోలు చరిత్ర"
            )}

            <ArrowRight
              size={16}
            />

          </Link>


          <Link
            to="/farmer/book"
            className="home-primary-action"
          >

            {getText(
              language,
              "Book another slot",
              "दूसरा स्लॉट बुक करें",
              "మరో స్లాట్ బుక్ చేయండి"
            )}

            <ArrowRight
              size={16}
            />

          </Link>

        </div>

      </main>



      {/* PAYMENT ISSUE MODAL */}

      {
        issueBooking && (

          <div
            className="farmer-payment-issue-overlay"
            onClick={() => {

              if (
                !issueSending
              ) {

                closeIssue();

              }

            }}
          >

            <div
              className="farmer-payment-issue-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="farmer-payment-issue-header">

                <div>

                  <span className="page-eyebrow">

                    {getText(
                      language,
                      "PAYMENT SUPPORT",
                      "भुगतान सहायता",
                      "చెల్లింపు సహాయం"
                    )}

                  </span>


                  <h2>

                    {getText(
                      language,
                      "Report a payment issue",
                      "भुगतान समस्या बताएं",
                      "చెల్లింపు సమస్యను నివేదించండి"
                    )}

                  </h2>

                </div>


                <button
                  type="button"
                  onClick={
                    closeIssue
                  }
                  disabled={
                    issueSending
                  }
                >

                  ×

                </button>

              </div>


              <div className="farmer-payment-issue-booking">

                <div>

                  <span>

                    {getText(
                      language,
                      "Booking",
                      "बुकिंग",
                      "బుకింగ్"
                    )}

                  </span>


                  <strong>

                    #
                    {
                      issueBooking.token ||
                      issueBooking.id
                    }

                  </strong>

                </div>


                <div>

                  <span>

                    {getText(
                      language,
                      "Amount",
                      "राशि",
                      "మొత్తం"
                    )}

                  </span>


                  <strong>

                    ₹
                    {
                      Number(
                        issueBooking.payment_amount ||
                        0
                      ).toLocaleString(
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


              <label className="farmer-payment-issue-label">

                {getText(
                  language,
                  "Describe the problem",
                  "समस्या बताएं",
                  "సమస్యను వివరించండి"
                )}


                <textarea
                  value={
                    issueText
                  }
                  onChange={(event) =>
                    setIssueText(
                      event.target.value
                    )
                  }
                  placeholder={getText(
                    language,
                    "For example: payment amount is incorrect or payment has not reached me.",
                    "उदाहरण: भुगतान राशि गलत है या भुगतान अभी तक नहीं मिला।",
                    "ఉదాహరణ: చెల్లింపు మొత్తం తప్పుగా ఉంది లేదా చెల్లింపు ఇంకా అందలేదు."
                  )}
                  rows={5}
                  disabled={
                    issueSending
                  }
                />

              </label>


              {
                issueMessage && (

                  <div className="farmer-payment-issue-message">

                    {issueMessage}

                  </div>

                )
              }


              <div className="farmer-payment-issue-actions">

                <button
                  type="button"
                  className="home-secondary-action"
                  onClick={
                    closeIssue
                  }
                  disabled={
                    issueSending
                  }
                >

                  {getText(
                    language,
                    "Cancel",
                    "रद्द करें",
                    "రద్దు చేయండి"
                  )}

                </button>


                <button
                  type="button"
                  className="home-primary-action"
                  onClick={
                    submitIssue
                  }
                  disabled={
                    issueSending
                  }
                >

                  {
                    issueSending
                      ? (
                        <RefreshCw
                          size={15}
                          className="loading-spin"
                        />
                      )
                      : (
                        <ArrowRight
                          size={15}
                        />
                      )
                  }


                  {
                    issueSending
                      ? getText(
                          language,
                          "Sending...",
                          "भेजा जा रहा है...",
                          "పంపుతోంది..."
                        )
                      : getText(
                          language,
                          "Submit issue",
                          "समस्या भेजें",
                          "సమస్యను పంపండి"
                        )
                  }

                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

}


/* =========================================================
   COMPONENT
========================================================= */

function PaymentStat({
  icon,
  label,
  value,
  tone,
}) {

  return (

    <div
      className={
        `farmer-payments-stat ${tone}`
      }
    >

      <div className="farmer-payments-stat-icon">

        {icon}

      </div>


      <div>

        <span>
          {label}
        </span>


        <strong>
          {value}
        </strong>

      </div>

    </div>

  );

}


/* =========================================================
   HELPERS
========================================================= */

function getText(
  language,
  english,
  hindi,
  telugu
) {

  if (
    language ===
    "hi"
  ) {

    return hindi;

  }


  if (
    language ===
    "te"
  ) {

    return telugu;

  }


  return english;

}


function getCropName(
  crop,
  language,
  t
) {

  if (
    !crop
  ) {

    return getText(
      language,
      "Produce",
      "उपज",
      "పంట"
    );

  }


  const key =
    `crops.${crop}`;


  if (
    t
  ) {

    const translated =
      t(
        key
      );


    if (
      translated &&
      translated !==
        key
    ) {

      return translated;

    }

  }


  const names = {

    wheat:
      getText(
        language,
        "Wheat",
        "गेहूं",
        "గోధుమ"
      ),

    paddy:
      getText(
        language,
        "Paddy",
        "धान",
        "వరి"
      ),

    maize:
      getText(
        language,
        "Maize",
        "मक्का",
        "మొక్కజొన్న"
      ),

    cotton:
      getText(
        language,
        "Cotton",
        "कपास",
        "పత్తి"
      ),

  };


  return (
    names[
      crop
    ] ||
    crop
  );

}


function formatDate(
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
    language ===
      "hi"
      ? "hi-IN"
      : language ===
          "te"
        ? "te-IN"
        : "en-IN";


  return date.toLocaleDateString(
    locale,
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

    }
  );

}


export default FarmerPayments;