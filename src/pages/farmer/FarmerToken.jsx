import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  Copy,
  FileText,
  HelpCircle,
  Info,
  MapPin,
  RefreshCw,
  Scale,
  Share2,
  ShieldCheck,
  Wheat,
  Truck,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "../../components/Header";

import {
  getCurrentFarmer,
  updateBooking,
} from "../../data/appStore";

import {
  useLanguage,
} from "../../translations/LanguageContext";

import QRCode from "qrcode";
import jsPDF from "jspdf";


const API_URL =
  import.meta.env.VITE_API_URL;


const STATUS_ORDER = [
  "CONFIRMED",
  "ARRIVED",
  "WEIGHING",
  "PROCURED",
  "PAYMENT_PENDING",
  "PAYMENT_SENT",
];


const STATUS_ICONS = {

  CONFIRMED:
    CalendarDays,

  ARRIVED:
    MapPin,

  WEIGHING:
    Scale,

  PROCURED:
    CheckCircle2,

  PAYMENT_PENDING:
    Coins,

  PAYMENT_SENT:
    Check,

  CANCELLED:
    X,

};


function FarmerToken() {

  const {
    t,
    language,
  } =
    useLanguage();


  const [
    searchParams,
  ] =
    useSearchParams();


  const navigate =
    useNavigate();


  const farmer =
    getCurrentFarmer();


  const bookingId =
    searchParams.get(
      "booking"
    );


  const assistantTokenAction =
    searchParams.get("assistantAction") ||
    "";


  const [
    booking,
    setBooking,
  ] =
    useState(null);


  const [
    farmerBookings,
    setFarmerBookings,
  ] =
    useState([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    actionBusy,
    setActionBusy,
  ] =
    useState(false);


  const [
    actionError,
    setActionError,
  ] =
    useState("");


  const [
    actionMessage,
    setActionMessage,
  ] =
    useState("");


  const [
    showCancelConfirmation,
    setShowCancelConfirmation,
  ] =
    useState(false);


  const [
    cancelReason,
    setCancelReason,
  ] =
    useState("");


  const [
    showPaymentIssue,
    setShowPaymentIssue,
  ] =
    useState(false);


  const [
    paymentIssueType,
    setPaymentIssueType,
  ] =
    useState("PAYMENT_NOT_RECEIVED");


  const [
    issueNote,
    setIssueNote,
  ] =
    useState("");


  const [
    issueSubmitted,
    setIssueSubmitted,
  ] =
    useState(false);


  const [
    qrCodeUrl,
    setQrCodeUrl,
  ] =
    useState("");


  const [
    copiedToken,
    setCopiedToken,
  ] =
    useState(false);


  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState(null);


  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(
      new Date()
    );


  const loadBooking =
    useCallback(
      async (
        isRefresh = false
      ) => {

        if (
          !bookingId
        ) {

          setBooking(null);

          setError(
            getText(
              language,
              "No booking reference was provided.",
              "बुकिंग संदर्भ नहीं मिला।",
              "బుకింగ్ సూచన కనుగొనబడలేదు."
            )
          );

          setLoading(false);

          return;

        }


        if (
          isRefresh
        ) {

          setRefreshing(
            true
          );

        }


        try {

          const response =
            await fetch(
              `${API_URL}/bookings/${encodeURIComponent(
                bookingId
              )}`
            );


          const data =
            await response.json();


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Booking not found."
            );

          }


          if (
            !data?.booking
          ) {

            throw new Error(
              "Booking not found."
            );

          }


          setBooking(
            data.booking
          );

          setLastUpdated(
            new Date()
          );

          setError("");


        } catch (
          loadError
        ) {

          console.error(
            "FarmerToken:",
            loadError
          );


          setBooking(null);


          setError(
            loadError?.message ||
            getText(
              language,
              "Unable to load your booking.",
              "बुकिंग लोड नहीं हो सकी।",
              "బుకింగ్ లోడ్ కాలేదు."
            )
          );


        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      [
        bookingId,
        language,
      ]
    );


  const loadFarmerHistory =
    useCallback(
      async (
        farmerId
      ) => {

        if (
          !farmerId
        ) {

          return;

        }


        setHistoryLoading(
          true
        );


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

            return;

          }


          const rows =
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : [];


          const mine =
            rows.filter(
              (
                item
              ) =>
                String(
                  item.farmer_id
                ) ===
                String(
                  farmerId
                )
            );


          setFarmerBookings(
            mine
          );


        } catch (
          historyError
        ) {

          console.error(
            "Farmer history:",
            historyError
          );

        } finally {

          setHistoryLoading(
            false
          );

        }

      },
      []
    );


  useEffect(() => {

    loadBooking();


    const timer =
      setInterval(
        () =>
          loadBooking(),
        4000
      );


    return () => {

      clearInterval(
        timer
      );

    };

  }, [
    loadBooking,
  ]);


  useEffect(() => {

    if (
      booking?.farmer_id
    ) {

      loadFarmerHistory(
        booking.farmer_id
      );

    }

  }, [
    booking?.farmer_id,
    loadFarmerHistory,
  ]);


  useEffect(() => {

    const timer =
      setInterval(
        () =>
          setCurrentTime(
            new Date()
          ),
        1000
      );


    return () => {

      clearInterval(
        timer
      );

    };

  }, []);


  const currentStatus =
    booking?.status ||
    "CONFIRMED";


  const estimatedQuantity =
    Number(
      booking?.estimated_quantity ||
      0
    );


  const actualQuantity =
    booking?.actual_quantity ===
      null ||
    booking?.actual_quantity ===
      undefined
      ? null
      : Number(
          booking.actual_quantity
        );


  const paymentAmount =
    booking?.payment_amount ===
      null ||
    booking?.payment_amount ===
      undefined
      ? null
      : Number(
          booking.payment_amount
        );


  const paymentRatePerKg =
    booking?.payment_rate_per_kg ===
      null ||
    booking?.payment_rate_per_kg ===
      undefined
      ? null
      : Number(
          booking.payment_rate_per_kg
        );


  const calculatedRatePerKg =
    paymentRatePerKg !== null
      ? paymentRatePerKg
      : (
          paymentAmount !== null &&
          actualQuantity !== null &&
          actualQuantity > 0
        )
        ? paymentAmount /
          actualQuantity
        : null;


  const paymentReference =
    booking?.payment_reference ||
    "—";


  const paymentMethod =
    booking?.payment_method ||
    "—";


  const paymentSent =
    currentStatus ===
    "PAYMENT_SENT";


  const paymentPending =
    currentStatus ===
    "PAYMENT_PENDING";


  const smsStatus =
    String(
      booking?.payment_sms_status ||
      "NOT_SENT"
    ).toUpperCase();


  const smsSent =
    smsStatus ===
    "SENT";


  const smsFailed =
    smsStatus ===
    "FAILED";


  const smsNotSent =
    !smsSent &&
    !smsFailed;


  const cropName =
    getCropName(
      booking?.crop,
      t
    );


  const farmerName =
    booking?.farmer_name ||
    "Farmer";


  const village =
    booking?.farmer_village ||
    "—";


  const center =
    getCenterDisplay(
      booking?.center_id
    );


  const statusMessage =
    getStatusMessage(
      currentStatus,
      language
    );


  const statusLabel =
    getStatusLabel(
      currentStatus,
      language,
      t
    );


  const currentIndex =
    getTimelineIndex(
      currentStatus
    );


  const timelineProgress =
    STATUS_ORDER.length <=
      1
      ? 100
      : (
          currentIndex /
          (
            STATUS_ORDER.length -
            1
          )
        ) *
        100;


  const arrivalCountdown =
    getArrivalCountdown(
      booking?.date,
      booking?.slot_start,
      booking?.slot_end,
      currentTime,
      language
    );


  const nextAction =
    getNextAction(
      currentStatus,
      language
    );


  const bookingCanBeChanged =
    ["CONFIRMED", "LATE"].includes(
      String(currentStatus).toUpperCase()
    );


  const bookingIsCancelled =
    String(currentStatus).toUpperCase() ===
    "CANCELLED";


  async function cancelCurrentBooking() {
    if (!booking?.id || actionBusy) return;

    setActionBusy(true);
    setActionError("");
    setActionMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/bookings/${encodeURIComponent(booking.id)}/cancel`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              farmerId:
                farmer?.id ||
                farmer?.farmerId ||
                booking.farmer_id ||
                null,
              phone:
                farmer?.phone ||
                booking.farmer_phone ||
                null,
              reason:
                cancelReason.trim() ||
                "Cancelled by farmer",
            }),
          }
        );

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Unable to cancel this booking."
        );
      }

      if (data?.booking) {
        setBooking(data.booking);
      }

      setShowCancelConfirmation(false);
      setCancelReason("");
          setActionMessage(
        getText(
          language,
          "Booking cancelled successfully.",
          "बुकिंग सफलतापूर्वक रद्द कर दी गई।",
          "బుకింగ్ విజయవంతంగా రద్దు చేయబడింది."
        )
      );

      try {
        if (data?.booking?.id) {
          updateBooking(
            data.booking.id,
            {
              status: "CANCELLED",
              crop: data.booking.crop,
              estimatedQuantity: Number(
                data.booking.estimated_quantity ?? 0
              ),
              centerId: data.booking.center_id,
              date: data.booking.date,
              slotStart: data.booking.slot_start,
              slotEnd: data.booking.slot_end,
              token: data.booking.token,
            }
          );
        }
      } catch (prototypeSyncError) {
        console.warn(
          "FarmerToken prototype sync warning:",
          prototypeSyncError
        );
      }

      if (data?.booking?.farmer_id) {
        await loadFarmerHistory(
          data.booking.farmer_id
        );
      }
    } catch (cancelError) {
      console.error(
        "FarmerToken cancel booking:",
        cancelError
      );
      setActionError(
        cancelError?.message ||
        getText(
          language,
          "Unable to cancel this booking.",
          "यह बुकिंग रद्द नहीं हो सकी।",
          "ఈ బుకింగ్‌ను రద్దు చేయలేకపోయాము."
        )
      );
    } finally {
      setActionBusy(false);
    }
  }


  function openBookingEditor() {
    if (!booking?.id || !bookingCanBeChanged) return;
    navigate(
      `/farmer/book?edit=${encodeURIComponent(booking.id)}`
    );
  }


  /*
   * ========================================================
   * LIVE QUEUE POSITION
   * ========================================================
   */

  const queuePosition =
    useMemo(
      () =>
        getQueuePosition(
          booking,
          farmerBookings,
          currentTime
        ),
      [
        booking,
        farmerBookings,
        currentTime,
      ]
    );


  /*
   * ========================================================
   * ASSISTANT TOKEN ACTIONS
   * ========================================================
   */

  useEffect(() => {
    if (!booking?.id || !assistantTokenAction) return;

    let cancelled = false;

    const run = async () => {
      try {
        if (
          assistantTokenAction === "download-qr" &&
          qrCodeUrl &&
          !cancelled
        ) {
          const anchor = document.createElement("a");
          anchor.href = qrCodeUrl;
          anchor.download = `KrishiSetu-${booking.token || booking.id}-QR.png`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        } else if (
          assistantTokenAction === "download-receipt" &&
          !cancelled
        ) {
          await downloadProcurementReceipt();
        }
      } catch (error) {
        console.error("Assistant token action failed:", error);
      }
    };

    if (assistantTokenAction === "download-qr") {
      if (qrCodeUrl) {
        run();
      }
    } else {
      run();
    }

    return () => {
      cancelled = true;
    };
  }, [
    booking?.id,
    assistantTokenAction,
    qrCodeUrl,
  ]);


  /*
   * ========================================================
   * AUTOMATIC PAYMENT VOICE NOTIFICATION
   * ========================================================
   */

  useEffect(() => {

    if (
      !booking?.id
    ) {

      return;

    }


    if (
      typeof window ===
        "undefined" ||
      !(
        "speechSynthesis" in
        window
      )
    ) {

      return;

    }


    const storageKey =
      `krishisetu-payment-status-${booking.id}`;


    const previousStatus =
      sessionStorage.getItem(
        storageKey
      );


    if (
      !previousStatus
    ) {

      sessionStorage.setItem(
        storageKey,
        currentStatus
      );

      return;

    }


    if (
      previousStatus !==
        "PAYMENT_SENT" &&
      currentStatus ===
        "PAYMENT_SENT"
    ) {

      const amountText =
        paymentAmount !==
          null
          ? paymentAmount.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )
          : "";


      const message =
        getPaymentVoiceMessage(
          language,
          amountText
        );


      speakPaymentMessage(
        message,
        language
      );

    }


    sessionStorage.setItem(
      storageKey,
      currentStatus
    );


  }, [
    booking?.id,
    currentStatus,
    paymentAmount,
    language,
  ]);


  /*
   * ========================================================
   * QR CODE
   * ========================================================
   */

  useEffect(() => {

    if (
      !booking
    ) {

      setQrCodeUrl("");

      return;

    }


    async function generateBookingQr() {

      try {

        const qrData = `===== KRISHISETU BOOKING =====
Token: ${booking.token || booking.id}
Farmer: ${farmerName}
Crop: ${cropName}
Est. Qty: ${estimatedQuantity}
Center: ${center.name}
Date: ${booking.date}
Time: ${formatTime(booking.slot_start, booking.slot_end)}
Status: ${booking.status || "CONFIRMED"}
==============================`;


        const url =
          await QRCode.toDataURL(
            qrData,
            {
              width:
                500,

              margin:
                2,

              errorCorrectionLevel:
                "M",
            }
          );


        setQrCodeUrl(
          url
        );

      } catch (
        qrError
      ) {

        console.error(
          "QR generation failed:",
          qrError
        );

        setQrCodeUrl("");

      }

    }


    generateBookingQr();

  }, [
    booking,
    farmerName,
    cropName,
    estimatedQuantity,
    actualQuantity,
    center.name,
    statusLabel,
  ]);


  /*
   * ========================================================
   * COPY TOKEN
   * ========================================================
   */

  async function copyToken() {

    const token =
      booking?.token ||
      booking?.id ||
      "";


    if (
      !token
    ) {

      return;

    }


    try {

      await navigator.clipboard.writeText(
        token
      );

      setCopiedToken(
        true
      );


      setTimeout(
        () =>
          setCopiedToken(
            false
          ),
        1800
      );

    } catch (
      copyError
    ) {

      console.error(
        "Copy token failed:",
        copyError
      );

    }

  }


  /*
   * ========================================================
   * SHARE BOOKING
   * ========================================================
   */

  async function shareBooking() {

    if (
      !booking
    ) {

      return;

    }


    const shareText =
      `${getText(
        language,
        "KrishiSetu booking",
        "KrishiSetu बुकिंग",
        "KrishiSetu బుకింగ్"
      )}\n\n` +
      `${getText(
        language,
        "Token",
        "टोकन",
        "టోకెన్"
      )}: #${booking.token || booking.id}\n` +
      `${getText(
        language,
        "Crop",
        "फसल",
        "పంట"
      )}: ${cropName}\n` +
      `${getText(
        language,
        "Center",
        "केंद्र",
        "కేంద్రం"
      )}: ${center.name}\n` +
      `${getText(
        language,
        "Date",
        "तारीख",
        "తేదీ"
      )}: ${formatDate(
        booking.date,
        language
      )}\n` +
      `${getText(
        language,
        "Arrival",
        "आने का समय",
        "రాక సమయం"
      )}: ${formatTime(
        booking.slot_start,
        booking.slot_end
      )}`;


    try {

      if (
        navigator.share
      ) {

        await navigator.share({
          title:
            "KrishiSetu Booking",

          text:
            shareText,

        });

        return;

      }


      await navigator.clipboard.writeText(
        shareText
      );


      setCopiedToken(
        true
      );


      setTimeout(
        () =>
          setCopiedToken(
            false
          ),
        1800
      );

    } catch (
      shareError
    ) {

      console.error(
        "Share booking failed:",
        shareError
      );

    }

  }


  /*
   * ========================================================
   * MONTHLY DATA
   * ========================================================
   */

  const monthlyData =
    useMemo(
      () => {

        const now =
          new Date();


        const year =
          now.getFullYear();


        const month =
          now.getMonth();


        const rows =
          farmerBookings.filter(
            (
              item
            ) => {

              if (
                !item.date
              ) {

                return false;

              }


              const itemDate =
                new Date(
                  `${item.date}T00:00:00`
                );


              return (
                itemDate.getFullYear() ===
                  year &&
                itemDate.getMonth() ===
                  month
              );

            }
          );


        const completedRows =
          rows.filter(
            (
              item
            ) =>
              item.status ===
                "PAYMENT_SENT" ||
              item.status ===
                "PAYMENT_PENDING" ||
              item.status ===
                "PROCURED"
          );


        const totalQuantity =
          completedRows.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.actual_quantity ??
                item.estimated_quantity ??
                0
              ),
            0
          );


        const totalEarned =
          completedRows.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.payment_amount ||
                0
              ),
            0
          );


        const cropMap =
          {};


        for (
          const item
          of completedRows
        ) {

          const key =
            item.crop ||
            "other";


          if (
            !cropMap[key]
          ) {

            cropMap[key] = {

              crop:
                key,

              quantity:
                0,

              amount:
                0,

              count:
                0,

            };

          }


          cropMap[key].quantity +=
            Number(
              item.actual_quantity ??
              item.estimated_quantity ??
              0
            );


          cropMap[key].amount +=
            Number(
              item.payment_amount ||
              0
            );


          cropMap[key].count +=
            1;

        }


        return {

          rows,

          completedRows,

          totalBookings:
            rows.length,

          totalQuantity,

          totalEarned,

          crops:
            Object.values(
              cropMap
            ),

        };

      },
      [
        farmerBookings,
      ]
    );


  /*
   * ========================================================
   * PAYMENT HISTORY
   * ========================================================
   */

  const paymentHistory =
    useMemo(
      () =>
        farmerBookings
          .filter(
            (
              item
            ) =>
              Number(
                item.payment_amount ||
                0
              ) > 0
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
              )
          ),
      [
        farmerBookings,
      ]
    );


  /*
   * ========================================================
   * DOWNLOAD OFFLINE BOOKING PASS
   * ========================================================
   */

  async function downloadBookingPass() {

    if (
      !booking
    ) {

      return;

    }


    try {

      const qrData = `===== KRISHISETU BOOKING =====
Token: ${booking.token || booking.id}
Farmer: ${farmerName}
Crop: ${cropName}
Est. Qty: ${estimatedQuantity}
Center: ${center.name}
Date: ${booking.date}
Time: ${formatTime(booking.slot_start, booking.slot_end)}
Status: ${booking.status || "CONFIRMED"}
==============================`;


      const qrDataUrl =
        await QRCode.toDataURL(
          qrData,
          {
            width:
              500,

            margin:
              2,

            errorCorrectionLevel:
              "M",

          }
        );


      const pdf =
        new jsPDF({
          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",
        });


      const pageWidth =
        pdf.internal.pageSize.getWidth();


      const pageHeight =
        pdf.internal.pageSize.getHeight();


      pdf.setFillColor(
        27,
        83,
        56
      );


      pdf.rect(
        0,
        0,
        pageWidth,
        31,
        "F"
      );


      pdf.setTextColor(
        255,
        255,
        255
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        20
      );


      pdf.text(
        "KrishiSetu",
        18,
        14
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        9
      );


      pdf.text(
        "Digital Procurement Booking Pass",
        18,
        22
      );


      pdf.setTextColor(
        30,
        55,
        42
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        10
      );


      pdf.text(
        "SCAN TO IDENTIFY BOOKING",
        138,
        42
      );


      pdf.addImage(
        qrDataUrl,
        "PNG",
        136,
        47,
        52,
        48
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        12
      );


      pdf.text(
        "YOUR TOKEN",
        18,
        48
      );


      pdf.setFontSize(
        30
      );


      pdf.setTextColor(
        27,
        83,
        56
      );


      pdf.text(
        `#${booking.token || booking.id}`,
        18,
        65
      );


      pdf.setFontSize(
        10
      );


      pdf.setTextColor(
        85,
        105,
        94
      );


      pdf.text(
        `Status: ${statusLabel}`,
        18,
        74
      );


      let y =
        92;


      pdf.setTextColor(
        35,
        55,
        45
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        13
      );


      pdf.text(
        "Booking Details",
        18,
        y
      );


      y += 12;


      const details = [

        [
          "Farmer",
          farmerName,
        ],

        [
          "Crop",
          cropName,
        ],

        [
          "Estimated Quantity",
          `${estimatedQuantity.toLocaleString()} kg`,
        ],

        [
          "Actual Quantity",
          actualQuantity === null
            ? "Not recorded"
            : `${actualQuantity.toLocaleString()} kg`,
        ],

        [
          "Procurement Center",
          center.name,
        ],

        [
          "Arrival Date",
          formatDate(
            booking.date,
            language
          ),
        ],

        [
          "Arrival Window",
          formatTime(
            booking.slot_start,
            booking.slot_end
          ),
        ],

        [
          "Village",
          village,
        ],

        [
          "Quality",
          booking.quality ||
          "Not recorded",
        ],

        [
          "Booking Reference",
          booking.id,
        ],

      ];


      pdf.setFontSize(
        10
      );


      details.forEach(
        (
          [
            label,
            value,
          ]
        ) => {

          pdf.setFont(
            "helvetica",
            "bold"
          );


          pdf.setTextColor(
            100,
            115,
            106
          );


          pdf.text(
            `${label}:`,
            18,
            y
          );


          pdf.setFont(
            "helvetica",
            "normal"
          );


          pdf.setTextColor(
            35,
            55,
            45
          );


          const lines =
            pdf.splitTextToSize(
              String(
                value || "—"
              ),
              105
            );


          pdf.text(
            lines,
            62,
            y
          );


          y +=
            Math.max(
              7,
              lines.length *
                5
            );

        }
      );


      if (
        paymentAmount !== null ||
        paymentReference !== "—"
      ) {

        y += 5;


        pdf.setFont(
          "helvetica",
          "bold"
        );


        pdf.setFontSize(
          13
        );


        pdf.setTextColor(
          35,
          55,
          45
        );


        pdf.text(
          "Payment Information",
          18,
          y
        );


        y += 10;


        pdf.setFontSize(
          10
        );


        if (
          paymentAmount !== null
        ) {

          pdf.setFont(
            "helvetica",
            "normal"
          );


          pdf.text(
            `Amount: ₹${paymentAmount.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )}`,
            18,
            y
          );


          y += 6;

        }


        pdf.text(
          `Method: ${paymentMethod}`,
          18,
          y
        );


        y += 6;


        pdf.text(
          `Reference: ${paymentReference}`,
          18,
          y
        );

      }


      const noteY =
        Math.min(
          y + 18,
          pageHeight - 40
        );


      pdf.setFillColor(
        239,
        246,
        241
      );


      pdf.roundedRect(
        18,
        noteY,
        pageWidth - 36,
        22,
        4,
        4,
        "F"
      );


      pdf.setTextColor(
        45,
        85,
        63
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        9
      );


      pdf.text(
        "Keep this pass available offline.",
        24,
        noteY + 8
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        8
      );


      pdf.text(
        "Show the QR code or token at the procurement center.",
        24,
        noteY + 15
      );


      pdf.setTextColor(
        125,
        135,
        130
      );


      pdf.setFontSize(
        7
      );


      pdf.text(
        "KrishiSetu · Smart Agricultural Procurement",
        18,
        pageHeight - 12
      );


      pdf.text(
        `Generated ${new Date().toLocaleDateString(
          "en-IN"
        )}`,
        pageWidth - 58,
        pageHeight - 12
      );


      const safeToken =
        String(
          booking.token ||
          booking.id ||
          "booking"
        ).replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        );


      pdf.save(
        `KrishiSetu-${safeToken}-Booking-Pass.pdf`
      );


    } catch (
      downloadError
    ) {

      console.error(
        "Booking pass download failed:",
        downloadError
      );

    }

  }


  /*
   * ========================================================
   * FINAL PROCUREMENT RECEIPT
   * ========================================================
   */

  async function downloadProcurementReceipt() {

    if (
      !booking ||
      !paymentSent
    ) {

      return;

    }


    try {

      const receiptQrData = `==== KRISHISETU RECEIPT ====
Receipt: ${booking.payment_reference || booking.id}
Token: ${booking.token || booking.id}
Farmer: ${farmerName}
Crop: ${cropName}
Procured Qty: ${actualQuantity}
Rate/Kg: ${calculatedRatePerKg}
Total: ${paymentAmount}
Method: ${paymentMethod}
Ref: ${paymentReference}
Center: ${center.name}
Date: ${booking.date}
============================`;


      const receiptQrUrl =
        await QRCode.toDataURL(
          receiptQrData,
          {
            width:
              500,

            margin:
              2,

            errorCorrectionLevel:
              "M",
          }
        );


      const pdf =
        new jsPDF({
          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",
        });


      const pageWidth =
        pdf.internal.pageSize.getWidth();


      const pageHeight =
        pdf.internal.pageSize.getHeight();


      pdf.setFillColor(
        27,
        83,
        56
      );


      pdf.rect(
        0,
        0,
        pageWidth,
        38,
        "F"
      );


      pdf.setTextColor(
        255,
        255,
        255
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        22
      );


      pdf.text(
        "KrishiSetu",
        18,
        15
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        9
      );


      pdf.text(
        "Smart Agricultural Procurement",
        18,
        23
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        8
      );


      pdf.text(
        "OFFICIAL PROCUREMENT RECEIPT",
        pageWidth - 18,
        15,
        {
          align:
            "right",
        }
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        8
      );


      pdf.text(
        "PAYMENT COMPLETED",
        pageWidth - 18,
        23,
        {
          align:
            "right",
        }
      );


      pdf.setTextColor(
        35,
        55,
        45
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        10
      );


      pdf.text(
        "RECEIPT DETAILS",
        18,
        52
      );


      pdf.setFontSize(
        9
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setTextColor(
        90,
        105,
        97
      );


      pdf.text(
        "Receipt / Payment Reference",
        18,
        61
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setTextColor(
        35,
        55,
        45
      );


      pdf.text(
        String(
          paymentReference !== "—"
            ? paymentReference
            : booking.id
        ),
        18,
        67
      );


      pdf.addImage(
        receiptQrUrl,
        "PNG",
        pageWidth - 66,
        46,
        44,
        44
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        7
      );


      pdf.setTextColor(
        105,
        120,
        112
      );


      pdf.text(
        "Scan to verify receipt data",
        pageWidth - 44,
        94,
        {
          align:
            "center",
        }
      );


      let y =
        83;


      pdf.setFillColor(
        247,
        250,
        248
      );


      pdf.roundedRect(
        18,
        y,
        pageWidth - 36,
        42,
        4,
        4,
        "F"
      );


      pdf.setTextColor(
        35,
        55,
        45
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        12
      );


      pdf.text(
        "Farmer & Booking",
        24,
        y + 9
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        9
      );


      pdf.setTextColor(
        95,
        110,
        102
      );


      pdf.text(
        "Farmer",
        24,
        y + 19
      );


      pdf.text(
        "Token",
        105,
        y + 19
      );


      pdf.text(
        "Booking Reference",
        24,
        y + 31
      );


      pdf.text(
        "Procurement Center",
        105,
        y + 31
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setTextColor(
        35,
        55,
        45
      );


      pdf.text(
        String(
          farmerName
        ),
        24,
        y + 25
      );


      pdf.text(
        `#${booking.token || booking.id}`,
        105,
        y + 25
      );


      pdf.text(
        String(
          booking.id
        ),
        24,
        y + 37
      );


      pdf.text(
        String(
          center.name
        ),
        105,
        y + 37
      );


      y += 54;


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        12
      );


      pdf.setTextColor(
        35,
        55,
        45
      );


      pdf.text(
        "Procurement Summary",
        18,
        y
      );


      y += 10;


      const procurementRows = [

        [
          "Crop",
          cropName,
        ],

        [
          "Procurement Date",
          formatDate(
            booking.date,
            language
          ),
        ],

        [
          "Actual Quantity",
          actualQuantity === null
            ? "Not recorded"
            : `${actualQuantity.toLocaleString()} kg`,
        ],

        [
          "Quality",
          booking.quality ||
          "Not recorded",
        ],

        [
          "Arrival Window",
          formatTime(
            booking.slot_start,
            booking.slot_end
          ),
        ],

      ];


      pdf.setFontSize(
        9
      );


      procurementRows.forEach(
        (
          [
            label,
            value,
          ]
        ) => {

          pdf.setFont(
            "helvetica",
            "normal"
          );


          pdf.setTextColor(
            95,
            110,
            102
          );


          pdf.text(
            label,
            18,
            y
          );


          pdf.setFont(
            "helvetica",
            "bold"
          );


          pdf.setTextColor(
            35,
            55,
            45
          );


          pdf.text(
            String(
              value || "—"
            ),
            78,
            y
          );


          y += 8;

        }
      );


      y += 5;


      pdf.setFillColor(
        239,
        246,
        241
      );


      pdf.roundedRect(
        18,
        y,
        pageWidth - 36,
        55,
        4,
        4,
        "F"
      );


      pdf.setTextColor(
        45,
        85,
        63
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        12
      );


      pdf.text(
        "Payment Details",
        24,
        y + 10
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        9
      );


      pdf.setTextColor(
        90,
        105,
        97
      );


      pdf.text(
        "Actual quantity",
        24,
        y + 21
      );


      pdf.text(
        "Rate",
        24,
        y + 30
      );


      pdf.text(
        "Payment method",
        24,
        y + 39
      );


      pdf.text(
        "Payment reference",
        105,
        y + 21
      );


      pdf.text(
        "Payment status",
        105,
        y + 30
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setTextColor(
        35,
        55,
        45
      );


      pdf.text(
        actualQuantity === null
          ? "—"
          : `${actualQuantity.toLocaleString()} kg`,
        65,
        y + 21
      );


      pdf.text(
        calculatedRatePerKg !== null
          ? `₹${calculatedRatePerKg.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )} / kg`
          : "—",
        65,
        y + 30
      );


      pdf.text(
        String(
          paymentMethod
        ),
        65,
        y + 39
      );


      pdf.text(
        String(
          paymentReference
        ),
        145,
        y + 21
      );


      pdf.text(
        "PAID",
        145,
        y + 30
      );


      y += 67;


      pdf.setDrawColor(
        210,
        220,
        214
      );


      pdf.line(
        18,
        y,
        pageWidth - 18,
        y
      );


      y += 13;


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        11
      );


      pdf.setTextColor(
        90,
        105,
        97
      );


      pdf.text(
        "TOTAL PAID",
        18,
        y
      );


      pdf.setFontSize(
        21
      );


      pdf.setTextColor(
        27,
        83,
        56
      );


      pdf.text(
        paymentAmount !== null
          ? `₹${paymentAmount.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )}`
          : "—",
        pageWidth - 18,
        y + 1,
        {
          align:
            "right",
        }
      );


      y += 14;


      pdf.setFillColor(
        27,
        83,
        56
      );


      pdf.roundedRect(
        18,
        y,
        pageWidth - 36,
        20,
        4,
        4,
        "F"
      );


      pdf.setTextColor(
        255,
        255,
        255
      );


      pdf.setFont(
        "helvetica",
        "bold"
      );


      pdf.setFontSize(
        10
      );


      pdf.text(
        "Payment successfully recorded in KrishiSetu",
        pageWidth / 2,
        y + 8,
        {
          align:
            "center",
        }
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        7
      );


      pdf.text(
        "This receipt is generated from the procurement booking record.",
        pageWidth / 2,
        y + 14,
        {
          align:
            "center",
        }
      );


      pdf.setTextColor(
        125,
        135,
        130
      );


      pdf.setFont(
        "helvetica",
        "normal"
      );


      pdf.setFontSize(
        7
      );


      pdf.text(
        `Generated ${new Date().toLocaleString(
          "en-IN",
          {
            dateStyle:
              "medium",
            timeStyle:
              "short",
          }
        )}`,
        18,
        pageHeight - 12
      );


      pdf.text(
        "KrishiSetu · Smart Agricultural Procurement",
        pageWidth - 18,
        pageHeight - 12,
        {
          align:
            "right",
        }
      );


      const safeReceipt =
        String(
          booking.payment_reference ||
          booking.token ||
          booking.id ||
          "receipt"
        ).replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        );


      pdf.save(
        `KrishiSetu-${safeReceipt}-Procurement-Receipt.pdf`
      );


    } catch (
      receiptError
    ) {

      console.error(
        "Procurement receipt download failed:",
        receiptError
      );

    }

  }


  /*
   * ========================================================
   * PAYMENT ISSUE
   * ========================================================
   */

  async function handleIssueSubmit(
    event
  ) {

    event.preventDefault();


    if (
      !booking?.farmer_id ||
      !booking?.id ||
      !issueNote.trim()
    ) {

      setIssueSubmitted(
        true
      );

      return;

    }


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
                farmerId:
                  booking.farmer_id,

                bookingId:
                  booking.id,

                message:
                  `${paymentIssueType}: ${issueNote.trim()}`,
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
          "Failed to report payment issue."
        );

      }


      setIssueSubmitted(
        true
      );

      setIssueNote("");


    } catch (
      issueError
    ) {

      console.error(
        "Payment issue submit:",
        issueError
      );

      setIssueSubmitted(
        false
      );

    }

  }


  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (
    loading
  ) {

    return (

      <div className="farmer-token-page">

        <Header />


        <main className="token-container">

          <section className="token-loading-card">

            <div className="token-loading-icon">

              <RefreshCw
                size={28}
                className="token-spin"
              />

            </div>


            <span className="page-eyebrow">
              LIVE BOOKING
            </span>


            <h1>

              {getText(
                language,
                "Loading your booking",
                "आपकी बुकिंग लोड हो रही है",
                "మీ బుకింగ్ లోడ్ అవుతోంది"
              )}

            </h1>


            <p>

              {getText(
                language,
                "Connecting to the procurement system...",
                "खरीद प्रणाली से कनेक्ट हो रहा है...",
                "కొనుగోలు వ్యవస్థకు కనెక్ట్ అవుతోంది..."
              )}

            </p>

          </section>

        </main>

      </div>

    );

  }


  /*
   * ========================================================
   * ERROR
   * ========================================================
   */

  if (
    !booking
  ) {

    return (

      <div className="farmer-token-page">

        <Header />


        <main className="token-container">

          <section className="token-error-card">

            <div className="token-error-icon">

              <HelpCircle
                size={29}
              />

            </div>


            <span className="page-eyebrow">
              BOOKING
            </span>


            <h1>

              {getText(
                language,
                "Booking not found",
                "बुकिंग नहीं मिली",
                "బుకింగ్ కనుగొనబడలేదు"
              )}

            </h1>


            <p>
              {error}
            </p>


            <div className="token-error-actions">

              <button
                type="button"
                className="token-refresh-button"
                onClick={() =>
                  loadBooking(
                    true
                  )
                }
              >

                <RefreshCw
                  size={16}
                />

                {getText(
                  language,
                  "Try again",
                  "फिर कोशिश करें",
                  "మళ్లీ ప్రయత్నించండి"
                )}

              </button>


              <Link
                to="/farmer/home"
                className="home-primary-action"
              >

                {getText(
                  language,
                  "Back to Home",
                  "होम पर वापस जाएं",
                  "హోమ్‌కు తిరిగి వెళ్లండి"
                )}

                <ArrowRight
                  size={17}
                />

              </Link>

            </div>

          </section>

        </main>

      </div>

    );

  }


  /*
   * ========================================================
   * MAIN PAGE
   * ========================================================
   */

  return (

    <div className="farmer-token-page">

      <Header />


      {(actionMessage || actionError) && (
        <div
          className="booking-error prominent"
          style={{
            margin: "16px auto 0",
            maxWidth: "1180px",
            color:
              actionError
                ? "#b42318"
                : undefined,
          }}
        >
          <Info size={17} />
          <span>
            {actionError || actionMessage}
          </span>
        </div>
      )}


      {showCancelConfirmation && (
        <div
          role="presentation"
          onClick={() => {
            if (!actionBusy) {
              setShowCancelConfirmation(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(12, 24, 18, 0.52)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            onClick={event => event.stopPropagation()}
            style={{
              width: "min(100%, 520px)",
              borderRadius: "20px",
              background: "#ffffff",
              padding: "28px",
              boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "#fff1f0",
                  color: "#b42318",
                }}
              >
                <X size={21} />
              </div>
              <div>
                <span className="page-eyebrow">
                  {getText(
                    language,
                    "BOOKING CHANGE",
                    "बुकिंग बदलाव",
                    "బుకింగ్ మార్పు"
                  )}
                </span>
                <h2
                  id="cancel-booking-title"
                  style={{ margin: "4px 0 0" }}
                >
                  {getText(
                    language,
                    "Cancel this booking?",
                    "क्या यह बुकिंग रद्द करें?",
                    "ఈ బుకింగ్‌ను రద్దు చేయాలా?"
                  )}
                </h2>
              </div>
            </div>

            <p style={{ margin: "0 0 18px", lineHeight: 1.6 }}>
              {getText(
                language,
                `Token #${booking?.token || booking?.id || "—"} will be released and the booking will remain in your history as cancelled.`,
                `टोकन #${booking?.token || booking?.id || "—"} रिलीज़ कर दिया जाएगा और बुकिंग हिस्ट्री में रद्द के रूप में रहेगी।`,
                `టోకెన్ #${booking?.token || booking?.id || "—"} విడుదల అవుతుంది మరియు బుకింగ్ చరిత్రలో రద్దు అయినదిగా ఉంటుంది.`
              )}
            </p>

            <textarea
              value={cancelReason}
              onChange={event => setCancelReason(event.target.value)}
              placeholder={getText(
                language,
                "Reason (optional)",
                "कारण (वैकल्पिक)",
                "కారణం (ఐచ్ఛికం)"
              )}
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                border: "1px solid #d9e2dc",
                borderRadius: "12px",
                padding: "12px 13px",
                marginBottom: "18px",
                font: "inherit",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="token-inline-action"
                onClick={() => setShowCancelConfirmation(false)}
                disabled={actionBusy}
              >
                {getText(
                  language,
                  "Keep booking",
                  "बुकिंग रखें",
                  "బుకింగ్ ఉంచండి"
                )}
              </button>

              <button
                type="button"
                className="token-inline-action"
                onClick={cancelCurrentBooking}
                disabled={actionBusy}
                style={{
                  color: "#b42318",
                  borderColor: "#f2b8b5",
                  fontWeight: 700,
                }}
              >
                {actionBusy
                  ? getText(
                      language,
                      "Cancelling...",
                      "रद्द हो रही है...",
                      "రద్దు చేస్తోంది..."
                    )
                  : getText(
                      language,
                      "Yes, cancel booking",
                      "हाँ, बुकिंग रद्द करें",
                      "అవును, బుకింగ్ రద్దు చేయండి"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}


      <main className="token-container">


        {/* =================================================
            TOP
        ================================================= */}

        <div className="token-top-row">

          <div>

            <Link
              to="/farmer/home"
              className="back-link"
            >

              <ArrowLeft
                size={16}
              />

              {getText(
                language,
                "Back",
                "वापस",
                "వెనుకకు"
              )}

            </Link>


            <div className="token-eyebrow-row">

              <span className="page-eyebrow">

                {getText(
                  language,
                  "LIVE PROCUREMENT",
                  "लाइव खरीद",
                  "లైవ్ కొనుగోలు"
                )}

              </span>


              <span className="token-live-pill">

                <span />

                {getText(
                  language,
                  "Live",
                  "लाइव",
                  "లైవ్"
                )}

              </span>

            </div>


            <h1>

              {getText(
                language,
                "Your procurement journey",
                "आपकी खरीद यात्रा",
                "మీ కొనుగోలు ప్రయాణం"
              )}

            </h1>


            <p>

              {getText(
                language,
                "Track your booking, weighing, procurement and payment from one place.",
                "अपनी बुकिंग, वजन, खरीद और भुगतान को एक ही जगह से ट्रैक करें।",
                "మీ బుకింగ్, తూకం, కొనుగోలు మరియు చెల్లింపును ఒకే చోట ట్రాక్ చేయండి."
              )}

            </p>


            <div className="token-live-meta">

              <span>

                ●{" "}

                {getText(
                  language,
                  "Live sync",
                  "लाइव सिंक",
                  "లైవ్ సింక్"
                )}

              </span>


              <span>

                {getText(
                  language,
                  "Last updated",
                  "अंतिम अपडेट",
                  "చివరి అప్‌డేట్"
                )}{" "}

                {lastUpdated
                  ? formatUpdatedTime(
                      lastUpdated,
                      language
                    )
                  : "—"}

              </span>

            </div>

          </div>


          <div className="token-database-card">

            <div className="token-database-icon">

              <CheckCircle2
                size={18}
              />

            </div>


            <div>

              <span>
                LIVE DATABASE
              </span>


              <strong>

                {getText(
                  language,
                  "Connected",
                  "जुड़ा हुआ",
                  "కనెక్ట్ అయింది"
                )}

              </strong>


              <small>

                {getText(
                  language,
                  "Updates automatically",
                  "अपने आप अपडेट होता है",
                  "ఆటోమేటిక్‌గా అప్‌డేట్ అవుతుంది"
                )}

              </small>

            </div>

          </div>

        </div>



        {/* =================================================
            FINAL COMPLETION
        ================================================= */}

        {paymentSent && (

          <section className="token-completed-card">

            <div className="token-completed-header">

              <div className="token-completed-icon">

                <CheckCircle2
                  size={28}
                />

              </div>


              <div>

                <span className="page-eyebrow">

                  {getText(
                    language,
                    "COMPLETED",
                    "पूरा हुआ",
                    "పూర్తైంది"
                  )}

                </span>


                <h2>

                  {getText(
                    language,
                    "Procurement completed successfully",
                    "खरीद प्रक्रिया सफलतापूर्वक पूरी हुई",
                    "కొనుగోలు ప్రక్రియ విజయవంతంగా పూర్తైంది"
                  )}

                </h2>


                <p>

                  {getText(
                    language,
                    "Your produce has been procured and your payment has been sent.",
                    "आपकी उपज की खरीद पूरी हो गई है और आपका भुगतान भेज दिया गया है।",
                    "మీ పంట కొనుగోలు పూర్తైంది మరియు మీ చెల్లింపు పంపబడింది."
                  )}

                </p>

              </div>

            </div>


            <div className="token-payment-summary">

              <TokenPaymentItem
                label={getText(
                  language,
                  "Amount",
                  "राशि",
                  "మొత్తం"
                )}
                value={
                  paymentAmount !==
                    null
                    ? `₹${paymentAmount.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits:
                            2,
                        }
                      )}`
                    : "—"
                }
              />


              <TokenPaymentItem
                label={getText(
                  language,
                  "Method",
                  "तरीका",
                  "పద్ధతి"
                )}
                value={
                  paymentMethod
                }
              />


              <TokenPaymentItem
                label={getText(
                  language,
                  "Reference",
                  "संदर्भ",
                  "రిఫరెన్స్"
                )}
                value={
                  paymentReference
                }
              />

            </div>


            <div
              className={
                `token-sms-confirmation ${
                  smsSent
                    ? "sent"
                    : smsFailed
                      ? "failed"
                      : "not-sent"
                }`
              }
            >

              <div className="token-sms-confirmation-icon">

                {
                  smsSent ? (

                    <CheckCircle2
                      size={21}
                    />

                  ) : smsFailed ? (

                    <X
                      size={21}
                    />

                  ) : (

                    <Info
                      size={21}
                    />

                  )
                }

              </div>


              <div className="token-sms-confirmation-content">

                <span className="token-sms-status-label">

                  {
                    smsSent
                      ? getText(
                          language,
                          "SMS SENT",
                          "SMS भेजा गया",
                          "SMS పంపబడింది"
                        )
                      : smsFailed
                        ? getText(
                            language,
                            "SMS DELIVERY FAILED",
                            "SMS नहीं भेजा जा सका",
                            "SMS పంపడం విఫలమైంది"
                          )
                        : getText(
                            language,
                            "SMS NOT SENT",
                            "SMS नहीं भेजा गया",
                            "SMS పంపబడలేదు"
                          )
                  }

                </span>


                <strong>

                  {
                    smsSent
                      ? getText(
                          language,
                          "Payment confirmation sent",
                          "भुगतान की पुष्टि भेज दी गई",
                          "చెల్లింపు నిర్ధారణ పంపబడింది"
                        )
                      : smsFailed
                        ? getText(
                            language,
                            "Payment recorded, but SMS could not be delivered.",
                            "भुगतान दर्ज हो गया, लेकिन SMS नहीं भेजा जा सका।",
                            "చెల్లింపు నమోదు అయింది, కానీ SMS పంపడం సాధ్యపడలేదు."
                          )
                        : getText(
                            language,
                            "Payment recorded without SMS delivery.",
                            "भुगतान दर्ज हो गया, लेकिन SMS नहीं भेजा गया।",
                            "చెల్లింపు సమాచారం లభ్యంగా ఉంది."
                          )
                  }

                </strong>


                <span>

                  {
                    smsSent
                      ? getText(
                          language,
                          "A confirmation was sent to your registered mobile number.",
                          "आपके पंजीकृत मोबाइल नंबर पर पुष्टि भेजी गई।",
                          "మీ రిజిస్టర్డ్ మొబైల్ నంబర్‌కు నిర్ధారణ పంపబడింది."
                        )
                      : smsFailed
                        ? getText(
                            language,
                            "Your payment is still recorded safely in KrishiSetu.",
                            "आपका भुगतान KrishiSetu में सुरक्षित रूप से दर्ज है।",
                            "మీ చెల్లింపు KrishiSetuలో సురక్షితంగా నమోదు చేయబడింది."
                          )
                        : getText(
                            language,
                            "Your payment information is available inside KrishiSetu.",
                            "आपके भुगतान की जानकारी KrishiSetu में उपलब्ध है।",
                            "మీ చెల్లింపు సమాచారం KrishiSetuలో అందుబాటులో ఉంది."
                          )
                  }

                </span>

              </div>


              {
                smsSent &&
                booking?.payment_sms_sent_at && (

                  <small className="token-sms-time">

                    {
                      formatNotificationDate(
                        booking.payment_sms_sent_at,
                        language
                      )
                    }

                  </small>

                )
              }

            </div>


            <div className="token-completion-actions">

              <Link
                to="/farmer/home"
                className="token-completion-home"
              >

                <ArrowLeft
                  size={15}
                />

                {getText(
                  language,
                  "Back to Farmer Home",
                  "किसान होम पर वापस जाएं",
                  "రైతు హోమ్‌కు తిరిగి వెళ్లండి"
                )}

              </Link>


              <Link
                to="/farmer/book"
                className="token-completion-book"
              >

                {getText(
                  language,
                  "Book another slot",
                  "दूसरा स्लॉट बुक करें",
                  "మరో స్లాట్ బుక్ చేయండి"
                )}

                <ArrowRight
                  size={15}
                />

              </Link>

            </div>


            <div className="token-completion-receipt-actions">

              <button
                type="button"
                className="token-receipt-download-button"
                onClick={
                  downloadProcurementReceipt
                }
              >

                <FileText
                  size={16}
                />

                {getText(
                  language,
                  "Download Procurement Receipt",
                  "खरीद रसीद डाउनलोड करें",
                  "కొనుగోలు రసీదు డౌన్‌లోడ్ చేయండి"
                )}

              </button>

            </div>


            <button
              type="button"
              className="farmer-payment-issue-button" style={{ marginTop: "16px", width: "100%", justifyContent: "center", padding: "14px" }}
              onClick={() => navigate(`/farmer/payment-issue/${booking.id}`)}
            >

              <HelpCircle
                size={16}
              />

              {getText(
                language,
                "Report a payment issue",
                "भुगतान समस्या की रिपोर्ट करें",
                "చెల్లింపు సమస్యను నివేదించండి"
              )}

            </button>

          </section>

        )}



        {/* =================================================
            MAIN
        ================================================= */}

        <section className="token-main-layout">


          <div className="token-main-column">


            {/* TOKEN */}

            <section className="token-hero-card">

              <div className="token-hero-top">

                <div>

                  <span className="token-card-label">

                    {getText(
                      language,
                      "YOUR TOKEN",
                      "आपका टोकन",
                      "మీ టోకెన్"
                    )}

                  </span>


                  <div className="token-number">

                    #{booking.token}

                  </div>


                  <div className="token-status-row">

                    <span
                      className={
                        `token-status-dot ${
                          getStatusColor(
                            currentStatus
                          )
                        }`
                      }
                    />


                    <strong>

                      {
                        statusLabel
                      }

                    </strong>


                    <span>

                      {
                        statusMessage
                      }

                    </span>

                  </div>


                  <div className="token-action-row">

                    <button
                      type="button"
                      className="token-inline-action"
                      onClick={
                        copyToken
                      }
                    >

                      {
                        copiedToken ? (
                          <Check
                            size={15}
                          />
                        ) : (
                          <Copy
                            size={15}
                          />
                        )
                      }

                      {
                        copiedToken
                          ? getText(
                              language,
                              "Copied",
                              "कॉपी हुआ",
                              "కాపీ అయింది"
                            )
                          : getText(
                              language,
                              "Copy token",
                              "टोकन कॉपी करें",
                              "టోకెన్ కాపీ చేయండి"
                            )
                      }

                    </button>


                    <button
                      type="button"
                      className="token-inline-action"
                      onClick={
                        shareBooking
                      }
                    >

                      <Share2
                        size={15}
                      />

                      {getText(
                        language,
                        "Share",
                        "शेयर करें",
                        "షేర్ చేయండి"
                      )}

                    </button>

                    {
                      bookingCanBeChanged && (
                        <>
                          <button
                            type="button"
                            className="token-inline-action"
                            onClick={openBookingEditor}
                            disabled={actionBusy}
                          >
                            <FileText size={15} />
                            {getText(
                              language,
                              "Edit booking",
                              "बुकिंग बदलें",
                              "బుకింగ్ మార్చండి"
                            )}
                          </button>

                          <button
                            type="button"
                            className="token-inline-action"
                            onClick={() => {
                              setActionError("");
                              setActionMessage("");
                              setShowCancelConfirmation(true);
                            }}
                            disabled={actionBusy}
                            style={{ color: "#b42318" }}
                          >
                            <X size={15} />
                            {getText(
                              language,
                              "Cancel booking",
                              "बुकिंग रद्द करें",
                              "బుకింగ్ రద్దు చేయండి"
                            )}
                          </button>
                        </>
                      )
                    }

                  </div>

                </div>


                <div className="token-big-check">

                  <CheckCircle2
                    size={31}
                  />

                </div>

              </div>


              {
                bookingIsCancelled && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "16px 18px",
                      borderRadius: "14px",
                      background: "#fff7f6",
                      border: "1px solid #f5c2bd",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#a61b11",
                        marginBottom: "5px",
                      }}
                    >
                      {getText(
                        language,
                        "This booking is cancelled",
                        "यह बुकिंग रद्द हो गई है",
                        "ఈ బుకింగ్ రద్దు చేయబడింది"
                      )}
                    </strong>
                    <span>
                      {getText(
                        language,
                        "The slot has been released. You can create a new booking when you are ready.",
                        "यह समय स्लॉट रिलीज़ हो गया है। जरूरत होने पर नई बुकिंग करें।",
                        "ఈ సమయ స్లాట్ విడుదలైంది. అవసరమైతే కొత్త బుకింగ్ చేయండి."
                      )}
                    </span>
                    <button
                      type="button"
                      className="token-inline-action"
                      onClick={() => navigate("/farmer/book")}
                      style={{
                        marginTop: "12px",
                        color: "#16724b",
                        fontWeight: 700,
                      }}
                    >
                      {getText(
                        language,
                        "Book a new slot",
                        "नई बुकिंग करें",
                        "కొత్త స్లాట్ బుక్ చేయండి"
                      )}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )
              }


              {/* =====================================================
                  TRANSPORT / LOGISTICS
              ===================================================== */}
              {!bookingIsCancelled && (
                <section
                  style={{
                    marginTop: "22px",
                    padding: "22px",
                    borderRadius: "20px",
                    border: "1px solid #dbe8df",
                    background:
                      "linear-gradient(135deg, #f4faf6 0%, #ffffff 72%)",
                    boxShadow:
                      "0 10px 28px rgba(24, 84, 53, 0.07)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "18px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", gap: "14px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          display: "grid",
                          placeItems: "center",
                          flex: "0 0 auto",
                          background: "#e3f2e8",
                          color: "#16724b",
                        }}
                      >
                        <Truck size={25} />
                      </div>

                      <div>
                        <span
                          className="page-eyebrow"
                          style={{ marginBottom: "4px", display: "inline-block" }}
                        >
                          {getText(
                            language,
                            "CROP TRANSPORT",
                            "फसल परिवहन",
                            "పంట రవాణా"
                          )}
                        </span>

                        <h2
                          style={{
                            margin: 0,
                            fontSize: "20px",
                            lineHeight: 1.25,
                          }}
                        >
                          {getText(
                            language,
                            "Need a vehicle for this booking?",
                            "इस बुकिंग के लिए वाहन चाहिए?",
                            "ఈ బుకింగ్ కోసం వాహనం కావాలా?"
                          )}
                        </h2>

                        <p
                          style={{
                            margin: "7px 0 0",
                            color: "#637368",
                            lineHeight: 1.55,
                            maxWidth: "700px",
                          }}
                        >
                          {getText(
                            language,
                            "Arrange pickup from your farm, get matched with a transporter, and track the journey to the procurement center.",
                            "अपने खेत से फसल उठाने की व्यवस्था करें, ट्रांसपोर्टर से मिलान पाएं और खरीद केंद्र तक यात्रा ट्रैक करें।",
                            "మీ పొలం నుంచి పంటను తీసుకెళ్లేందుకు వాహనాన్ని ఏర్పాటు చేసి, ట్రాన్స్‌పోర్టర్‌తో మ్యాచ్ అవుతూ కొనుగోలు కేంద్రం వరకు ప్రయాణాన్ని ట్రాక్ చేయండి."
                          )}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/farmer/logistics")
                        }
                        style={{
                          border: "none",
                          borderRadius: "12px",
                          padding: "12px 17px",
                          background: "#16724b",
                          color: "#fff",
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                        }}
                      >
                        <Truck size={17} />
                        {getText(
                          language,
                          "Manage Transport",
                          "परिवहन प्रबंधित करें",
                          "రవాణాను నిర్వహించండి"
                        )}
                        <ArrowRight size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/farmer/transport/request?booking=${encodeURIComponent(
                              booking?.id || bookingId || ""
                            )}`
                          )
                        }
                        style={{
                          border: "1px solid #cfe0d5",
                          borderRadius: "12px",
                          padding: "12px 15px",
                          background: "#fff",
                          color: "#24583e",
                          fontWeight: 750,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                        }}
                      >
                        {getText(
                          language,
                          "Request Vehicle",
                          "वाहन रिक्वेस्ट करें",
                          "వాహనం అభ్యర్థించండి"
                        )}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px solid #e4eee7",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#5e7568",
                      fontSize: "13px",
                      fontWeight: 650,
                    }}
                  >
                    <MapPin size={15} />
                    <span>
                      {getText(
                        language,
                        "From pickup to procurement center",
                        "खेत से खरीद केंद्र तक",
                        "పికప్ నుంచి కొనుగోలు కేంద్రం వరకు"
                      )}
                    </span>
                  </div>
                </section>
              )}


              <div className="token-arrival-grid">

                <TokenInfo
                  icon={
                    <CalendarDays
                      size={20}
                    />
                  }
                  tone="blue"
                  label={getText(
                    language,
                    "ARRIVAL DATE",
                    "आने की तारीख",
                    "రాక తేదీ"
                  )}
                  value={
                    formatDate(
                      booking.date,
                      language
                    )
                  }
                />


                <TokenInfo
                  icon={
                    <Clock3
                      size={20}
                    />
                  }
                  tone="orange"
                  label={getText(
                    language,
                    "ARRIVAL WINDOW",
                    "आने का समय",
                    "రాక సమయం"
                  )}
                  value={
                    formatTime(
                      booking.slot_start,
                      booking.slot_end
                    )
                  }
                />


                <TokenInfo
                  icon={
                    <MapPin
                      size={20}
                    />
                  }
                  tone="green"
                  label={getText(
                    language,
                    "PROCUREMENT CENTER",
                    "खरीद केंद्र",
                    "కొనుగోలు కేంద్రం"
                  )}
                  value={
                    center.name
                  }

                />

              </div>


              <div className="token-arrival-reminder">

                <div className="token-reminder-icon">

                  <Info
                    size={17}
                  />

                </div>


                <div>

                  <strong>

                    {
                      paymentSent
                        ? getText(
                            language,
                            "Your payment is complete",
                            "आपका भुगतान पूरा हो गया है",
                            "మీ చెల్లింపు పూర్తైంది"
                          )
                        : getText(
                            language,
                            "Arrive during your assigned window",
                            "अपने निर्धारित समय पर आएं",
                            "మీకు కేటాయించిన సమయానికి రండి"
                          )
                    }

                  </strong>


                  <span>

                    {
                      paymentSent
                        ? getText(
                            language,
                            "Keep your payment reference for your records.",
                            "अपने रिकॉर्ड के लिए भुगतान संदर्भ सुरक्षित रखें।",
                            "మీ రికార్డుల కోసం చెల్లింపు రిఫరెన్స్‌ను భద్రపరచండి."
                          )
                        : getText(
                            language,
                            "Bring your produce and arrive during the assigned window.",
                            "अपनी उपज लेकर निर्धारित समय के दौरान केंद्र पर आएं।",
                            "మీ పంటను తీసుకుని కేటాయించిన సమయానికి కేంద్రానికి రండి."
                          )
                    }

                  </span>

                </div>

              </div>


              <div className="token-next-action-card">

                <div className="token-next-action-icon">

                  <ArrowRight
                    size={17}
                  />

                </div>


                <div>

                  <span>

                    {getText(
                      language,
                      "WHAT HAPPENS NEXT",
                      "अब आगे क्या होगा",
                      "తర్వాత ఏమి జరుగుతుంది"
                    )}

                  </span>


                  <strong>
                    {nextAction.title}
                  </strong>


                  <p>
                    {nextAction.text}
                  </p>

                </div>

              </div>


              {/* =================================================
                  LIVE QUEUE POSITION
              ================================================= */}

              <div className="token-queue-position-card">

                <div className="token-queue-position-icon">

                  <Clock3
                    size={19}
                  />

                </div>


                <div className="token-queue-position-content">

                  <span>

                    {getText(
                      language,
                      "LIVE QUEUE POSITION",
                      "लाइव कतार स्थिति",
                      "లైవ్ క్యూ స్థానం"
                    )}

                  </span>


                  <strong>

                    {
                      queuePosition.isCompleted
                        ? getText(
                            language,
                            "Queue completed",
                            "कतार पूरी हो गई",
                            "క్యూ పూర్తైంది"
                          )
                        : queuePosition.position > 0
                          ? `#${queuePosition.position}`
                          : getText(
                              language,
                              "Calculating...",
                              "गणना हो रही है...",
                              "లెక్కిస్తోంది..."
                            )
                    }

                  </strong>


                  <p>

                    {
                      queuePosition.isCompleted
                        ? getText(
                            language,
                            "Your procurement processing is complete.",
                            "आपकी खरीद प्रक्रिया पूरी हो गई है।",
                            "మీ కొనుగోలు ప్రక్రియ పూర్తైంది."
                          )
                        : queuePosition.ahead > 0
                          ? getText(
                              language,
                              `${queuePosition.ahead} farmers are ahead of you.`,
                              `आपसे ${queuePosition.ahead} किसान आगे हैं।`,
                              `మీ ముందుగా ${queuePosition.ahead} మంది రైతులు ఉన్నారు.`
                            )
                          : getText(
                              language,
                              "You are next in line.",
                              "आप कतार में अगले हैं।",
                              "మీరు క్యూ‌లో తదుపరి ఉన్నారు."
                            )
                    }

                  </p>

                </div>


                {
                  !queuePosition.isCompleted &&
                  queuePosition.position > 0 && (

                    <div className="token-queue-wait">

                      <span>

                        {getText(
                          language,
                          "Estimated wait",
                          "अनुमानित प्रतीक्षा",
                          "అంచనా వేచి ఉండే సమయం"
                        )}

                      </span>


                      <strong>

                        {
                          formatWaitTime(
                            queuePosition.waitMinutes,
                            language
                          )
                        }

                      </strong>

                    </div>

                  )
                }

              </div>


              <div
                className={
                  `token-arrival-countdown ${
                    arrivalCountdown.tone
                  }`
                }
              >

                <Clock3
                  size={17}
                />


                <div>

                  <span>

                    {arrivalCountdown.label}

                  </span>


                  <strong>

                    {arrivalCountdown.value}

                  </strong>

                </div>

              </div>

            </section>



            {/* STATUS */}

            <section className="token-status-card">

              <div className="token-section-heading">

                <div>

                  <span className="page-eyebrow">

                    {getText(
                      language,
                      "LIVE STATUS",
                      "लाइव स्थिति",
                      "లైవ్ స్థితి"
                    )}

                  </span>


                  <h2>

                    {getText(
                      language,
                      "Current status",
                      "वर्तमान स्थिति",
                      "ప్రస్తుత స్థితి"
                    )}

                  </h2>


                  <p>

                    {getText(
                      language,
                      "Your procurement journey updates automatically as the center processes your booking.",
                      "केंद्र आपकी बुकिंग को आगे बढ़ाता है तो आपकी खरीद यात्रा अपने आप अपडेट होती रहती है।",
                      "కేంద్రం మీ బుకింగ్‌ను ప్రాసెస్ చేస్తున్నప్పుడు మీ కొనుగోలు ప్రయాణం ఆటోమేటిక్‌గా అప్‌డేట్ అవుతుంది."
                    )}

                  </p>

                </div>


                <button
                  type="button"
                  className="token-refresh-button"
                  onClick={() =>
                    loadBooking(
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
                        ? "token-spin"
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

              </div>


              <div className="token-progress-bar">

                <div
                  style={{
                    width:
                      `${timelineProgress}%`,
                  }}
                />

              </div>


              <div className="token-status-timeline">

                {STATUS_ORDER.map(
                  (
                    status,
                    index
                  ) => {

                    const Icon =
                      STATUS_ICONS[
                        status
                      ] ||
                      CheckCircle2;


                    const complete =
                      index <
                      currentIndex;


                    const active =
                      index ===
                      currentIndex;


                    return (

                      <div
                        key={
                          status
                        }
                        className={
                          `token-timeline-item ${
                            complete
                              ? "complete"
                              : ""
                          } ${
                            active
                              ? "active"
                              : ""
                          } ${
                            index >
                            currentIndex
                              ? "upcoming"
                              : ""
                          }`
                        }
                      >

                        <div className="token-timeline-marker">

                          {complete ? (

                            <Check
                              size={15}
                            />

                          ) : (

                            <Icon
                              size={15}
                            />

                          )}

                        </div>


                        <div className="token-timeline-content">

                          <div className="token-timeline-title-row">

                            <strong>

                              {
                                getStatusLabel(
                                  status,
                                  language,
                                  t
                                )
                              }

                            </strong>


                            {active && (

                              <span className="token-now-pill">

                                {getText(
                                  language,
                                  "Current",
                                  "वर्तमान",
                                  "ప్రస్తుత"
                                )}

                              </span>

                            )}

                          </div>


                          <p>

                            {
                              getStatusMessage(
                                status,
                                language
                              )
                            }

                          </p>

                        </div>


                        {
                          index <
                          STATUS_ORDER.length -
                          1 && (

                            <div className="token-timeline-line" />

                          )
                        }

                      </div>

                    );

                  }
                )}

              </div>


              <div className="token-current-message">

                <div className="token-current-message-icon">

                  <CheckCircle2
                    size={19}
                  />

                </div>


                <div>

                  <span>

                    {getText(
                      language,
                      "CURRENT STATUS",
                      "वर्तमान स्थिति",
                      "ప్రస్తుత స్థితి"
                    )}

                  </span>


                  <strong>
                    {statusLabel}
                  </strong>


                  <p>
                    {statusMessage}
                  </p>

                </div>

              </div>

            </section>



            {/* PAYMENT */}

            {
              (
                paymentSent ||
                paymentPending
              ) && (

                <section className="token-payment-card">

                  <div className="token-section-heading">

                    <div>

                      <span className="page-eyebrow">

                        {getText(
                          language,
                          "PAYMENT",
                          "भुगतान",
                          "చెల్లింపు"
                        )}

                      </span>


                      <h2>

                        {
                          paymentSent
                            ? getText(
                                language,
                                "Payment completed",
                                "भुगतान पूरा हुआ",
                                "చెల్లింపు పూర్తైంది"
                              )
                            : getText(
                                language,
                                "Payment processing",
                                "भुगतान प्रक्रिया में",
                                "చెల్లింపు ప్రాసెసింగ్‌లో ఉంది"
                              )
                        }

                      </h2>

                    </div>

                  </div>


                  <div className="token-payment-grid">

                    <TokenPaymentItem
                      label={getText(
                        language,
                        "Amount",
                        "राशि",
                        "మొత్తం"
                      )}
                      value={
                        paymentAmount !==
                          null
                          ? `₹${paymentAmount.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )}`
                          : "—"
                      }
                    />


                    <TokenPaymentItem
                      label={getText(
                        language,
                        "Method",
                        "तरीका",
                        "పద్ధతి"
                      )}
                      value={
                        paymentMethod
                      }
                    />


                    <TokenPaymentItem
                      label={getText(
                        language,
                        "Reference",
                        "संदर्भ",
                        "రిఫరెన్స్"
                      )}
                      value={
                        paymentReference
                      }
                    />

                  </div>


                  {
                    paymentSent && (

                      <div className="token-payment-receipt-inline">

                        <div className="token-payment-receipt-inline-icon">

                          <FileText
                            size={17}
                          />

                        </div>


                        <div>

                          <strong>

                            {getText(
                              language,
                              "Official procurement receipt",
                              "आधिकारिक खरीद रसीद",
                              "అధికారిక కొనుగోలు రసీదు"
                            )}

                          </strong>


                          <span>

                            {getText(
                              language,
                              "Download a permanent PDF record of this completed transaction.",
                              "इस पूरी हुई लेनदेन की स्थायी PDF रसीद डाउनलोड करें।",
                              "ఈ పూర్తయిన లావాదేవీకి శాశ్వత PDF రికార్డును డౌన్‌లోడ్ చేయండి."
                            )}

                          </span>

                        </div>


                        <button
                          type="button"
                          onClick={
                            downloadProcurementReceipt
                          }
                          className="token-receipt-inline-button"
                        >

                          <FileText
                            size={14}
                          />

                          {getText(
                            language,
                            "Receipt",
                            "रसीद",
                            "రసీదు"
                          )}

                        </button>

                      </div>

                    )
                  }


                  {
                    paymentPending && (

                      <div className="token-payment-pending-message">

                        <Coins
                          size={18}
                        />


                        <span>

                          {getText(
                            language,
                            "Your payment is being processed. Please check again later.",
                            "आपका भुगतान प्रक्रिया में है। कृपया बाद में फिर जांचें।",
                            "మీ చెల్లింపు ప్రాసెస్ అవుతోంది. కొంతసేపటి తర్వాత మళ్లీ చూడండి."
                          )}

                        </span>

                      </div>

                    )
                  }

                </section>

              )
            }



            {/* DETAILS */}

            <section className="token-details-card">

              <div className="token-section-heading">

                <div>

                  <span className="page-eyebrow">

                    {getText(
                      language,
                      "BOOKING DETAILS",
                      "बुकिंग विवरण",
                      "బుకింగ్ వివరాలు"
                    )}

                  </span>


                  <h2>

                    {getText(
                      language,
                      "Your booking information",
                      "आपकी बुकिंग जानकारी",
                      "మీ బుకింగ్ సమాచారం"
                    )}

                  </h2>

                </div>

              </div>


              <div className="token-details-grid">

                <TokenDetail
                  icon={
                    <Wheat
                      size={18}
                    />
                  }
                  label={getText(
                    language,
                    "Crop",
                    "फसल",
                    "పంట"
                  )}
                  value={
                    cropName
                  }
                />


                <TokenDetail
                  icon={
                    <Scale
                      size={18}
                    />
                  }
                  label={getText(
                    language,
                    "Estimated quantity",
                    "अनुमानित मात्रा",
                    "అంచనా పరిమాణం"
                  )}
                  value={
                    `${estimatedQuantity.toLocaleString()} kg`
                  }
                />


                <TokenDetail
                  icon={
                    <Scale
                      size={18}
                    />
                  }
                  label={getText(
                    language,
                    "Actual quantity",
                    "वास्तविक मात्रा",
                    "వాస్తవ పరిమాణం"
                  )}
                  value={
                    actualQuantity ===
                      null
                      ? getText(
                          language,
                          "Not recorded",
                          "दर्ज नहीं किया गया",
                          "నమోదు కాలేదు"
                        )
                      : `${actualQuantity.toLocaleString()} kg`
                  }
                />


                {
                  paymentSent && (

                    <TokenDetail
                      icon={
                        <Coins
                          size={18}
                        />
                      }
                      label={getText(
                        language,
                        "Rate per kg",
                        "प्रति किलो दर",
                        "కిలోకు ధర"
                      )}
                      value={
                        calculatedRatePerKg !== null
                          ? `₹${calculatedRatePerKg.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )}`
                          : "—"
                      }
                    />

                  )
                }


                <TokenDetail
                  icon={
                    <MapPin
                      size={18}
                    />
                  }
                  label={getText(
                    language,
                    "Village",
                    "गांव",
                    "గ్రామం"
                  )}
                  value={
                    village
                  }
                />


                <TokenDetail
                  icon={
                    <CheckCircle2
                      size={18}
                    />
                  }
                  label={getText(
                    language,
                    "Quality",
                    "गुणवत्ता",
                    "నాణ్యత"
                  )}
                  value={
                    booking.quality ||
                    getText(
                      language,
                      "Not recorded",
                      "दर्ज नहीं किया गया",
                      "నమోదు కాలేదు"
                    )
                  }
                />


                <TokenDetail
                  icon={
                    <CheckCircle2
                      size={18}
                    />
                  }
                  label={getText(
                    language,
                    "Booking reference",
                    "बुकिंग संदर्भ",
                    "బుకింగ్ సూచన"
                  )}
                  value={
                    booking.id
                  }
                />

              </div>

            </section>



            {/* PAYMENT HISTORY */}

            <section className="token-history-card">

              <div className="token-section-heading">

                <div>

                  <span className="page-eyebrow">

                    {getText(
                      language,
                      "PAYMENT HISTORY",
                      "भुगतान इतिहास",
                      "చెల్లింపు చరిత్ర"
                    )}

                  </span>


                  <h2>

                    {getText(
                      language,
                      "Your payment history",
                      "आपका भुगतान इतिहास",
                      "మీ చెల్లింపు చరిత్ర"
                    )}

                  </h2>


                  <p>

                    {getText(
                      language,
                      "See payments recorded across your procurement bookings.",
                      "अपनी खरीद बुकिंग के सभी दर्ज भुगतानों को देखें।",
                      "మీ కొనుగోలు బుకింగ్‌లలో నమోదు చేసిన చెల్లింపులను చూడండి."
                    )}

                  </p>

                </div>


                <div className="token-history-count">

                  {
                    paymentHistory.length
                  }

                  {" "}

                  {getText(
                    language,
                    "payments",
                    "भुगतान",
                    "చెల్లింపులు"
                  )}

                </div>

              </div>


              {
                historyLoading ? (

                  <div className="token-history-loading">

                    <RefreshCw
                      size={18}
                      className="token-spin"
                    />

                    {getText(
                      language,
                      "Loading history...",
                      "इतिहास लोड हो रहा है...",
                      "చరిత్ర లోడ్ అవుతోంది..."
                    )}

                  </div>

                ) : paymentHistory.length ===
                    0 ? (

                  <div className="token-history-empty">

                    <Coins
                      size={24}
                    />

                    <strong>

                      {getText(
                        language,
                        "No payments recorded yet",
                        "अभी कोई भुगतान दर्ज नहीं है",
                        "ఇంకా చెల్లింపులు నమోదు కాలేదు"
                      )}

                    </strong>

                    <span>

                      {getText(
                        language,
                        "Your completed procurement payments will appear here.",
                        "पूरी हुई खरीद के भुगतान यहां दिखाई देंगे।",
                        "పూర్తైన కొనుగోళ్ల చెల్లింపులు ఇక్కడ కనిపిస్తాయి."
                      )}

                    </span>

                  </div>

                ) : (

                  <div className="token-payment-history-list">

                    {
                      paymentHistory
                        .slice(
                          0,
                          8
                        )
                        .map(
                          (
                            item
                          ) => (

                            <div
                              key={
                                item.id
                              }
                              className="token-payment-history-row"
                            >

                              <div className="token-history-date">

                                <strong>

                                  {
                                    formatDate(
                                      item.date,
                                      language
                                    )
                                  }

                                </strong>


                                <span>

                                  #
                                  {
                                    item.token ||
                                    item.id
                                  }

                                </span>

                              </div>


                              <div className="token-history-crop">

                                <Wheat
                                  size={16}
                                />


                                <div>

                                  <strong>

                                    {
                                      getCropName(
                                        item.crop,
                                        t
                                      )
                                    }

                                  </strong>


                                  <span>

                                    {
                                      Number(
                                        item.actual_quantity ??
                                        item.estimated_quantity ??
                                        0
                                      ).toLocaleString()
                                    }

                                    {" kg"}

                                  </span>

                                </div>

                              </div>


                              <div className="token-history-amount">

                                <strong>

                                  ₹
                                  {
                                    Number(
                                      item.payment_amount ||
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


                                <span>

                                  {
                                    item.payment_reference ||
                                    "—"
                                  }

                                </span>

                              </div>


                              <CheckCircle2
                                size={18}
                                className="token-history-check"
                              />

                            </div>

                          )
                        )
                    }

                  </div>

                )
              }

            </section>



            {/* THIS MONTH */}

            <section className="token-month-card">

              <div className="token-section-heading">

                <div>

                  <span className="page-eyebrow">

                    {getText(
                      language,
                      "THIS MONTH",
                      "इस महीने",
                      "ఈ నెల"
                    )}

                  </span>


                  <h2>

                    {getText(
                      language,
                      "Your procurement summary",
                      "आपका खरीद सारांश",
                      "మీ కొనుగోలు సారాంశం"
                    )}

                  </h2>


                  <p>

                    {
                      formatCurrentMonth(
                        language
                      )
                    }

                  </p>

                </div>

              </div>


              <div className="token-month-summary">

                <TokenMonthlyStat
                  label={getText(
                    language,
                    "Bookings",
                    "बुकिंग",
                    "బుకింగ్‌లు"
                  )}
                  value={
                    monthlyData.totalBookings
                  }
                />


                <TokenMonthlyStat
                  label={getText(
                    language,
                    "Quantity",
                    "मात्रा",
                    "పరిమాణం"
                  )}
                  value={
                    `${monthlyData.totalQuantity.toLocaleString()} kg`
                  }
                />


                <TokenMonthlyStat
                  label={getText(
                    language,
                    "Earned",
                    "कमाई",
                    "ఆదాయం"
                  )}
                  value={
                    `₹${monthlyData.totalEarned.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}`
                  }
                />

              </div>


              <div className="token-crop-breakdown">

                {
                  monthlyData.crops.length ===
                    0 ? (

                    <div className="token-history-empty">

                      <Wheat
                        size={23}
                      />


                      <strong>

                        {getText(
                          language,
                          "No completed crop activity this month",
                          "इस महीने अभी कोई पूरी हुई फसल गतिविधि नहीं है",
                          "ఈ నెలలో ఇంకా పూర్తైన పంట కార్యకలాపాలు లేవు"
                        )}

                      </strong>

                    </div>

                  ) : (

                    monthlyData.crops.map(
                      (
                        item
                      ) => (

                        <div
                          key={
                            item.crop
                          }
                          className="token-crop-row"
                        >

                          <div className="token-crop-icon">

                            <Wheat
                              size={17}
                            />

                          </div>


                          <div className="token-crop-main">

                            <strong>

                              {
                                getCropName(
                                  item.crop,
                                  t
                                )
                              }

                            </strong>


                            <span>

                              {
                                item.count
                              }

                              {" "}

                              {
                                getText(
                                  language,
                                  "bookings",
                                  "बुकिंग",
                                  "బుకింగ్‌లు"
                                )
                              }

                            </span>

                          </div>


                          <div className="token-crop-quantity">

                            <strong>

                              {
                                item.quantity.toLocaleString()
                              }

                              {" kg"}

                            </strong>


                            <span>

                              ₹
                              {
                                item.amount.toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits:
                                      2,
                                  }
                                )
                              }

                            </span>

                          </div>


                          <ChevronRight
                            size={15}
                          />

                        </div>

                      )
                    )

                  )
                }

              </div>

            </section>

          </div>



          {/* =================================================
              SIDE COLUMN
          ================================================= */}

          <aside className="token-side-column">


            <div className="token-visual-card">

              <div className="token-visual-top">

                <span>

                  {getText(
                    language,
                    "KEEP THIS TOKEN",
                    "इस टोकन को रखें",
                    "ఈ టోకెన్‌ను ఉంచుకోండి"
                  )}

                </span>


                <ShieldCheck
                  size={18}
                />

              </div>


              <div className="token-visual-number">

                #{booking.token}

              </div>


              <div className="token-visual-label">

                {getText(
                  language,
                  "SHOW AT THE CENTER",
                  "केंद्र पर दिखाएं",
                  "కేంద్రంలో చూపించండి"
                )}

              </div>


              {qrCodeUrl && (

                <div className="token-quick-qr">

                  <div className="token-quick-qr-frame">

                    <img
                      src={
                        qrCodeUrl
                      }
                      alt={getText(
                        language,
                        "Booking QR code",
                        "बुकिंग QR कोड",
                        "బుకింగ్ QR కోడ్"
                      )}
                    />

                  </div>


                  <strong>

                    {getText(
                      language,
                      "Quick scan",
                      "जल्दी स्कैन करें",
                      "త్వరగా స్కాన్ చేయండి"
                    )}

                  </strong>


                  <span>

                    {getText(
                      language,
                      "Show this QR code at the procurement center.",
                      "खरीद केंद्र पर यह QR कोड दिखाएं।",
                      "కొనుగోలు కేంద్రంలో ఈ QR కోడ్‌ను చూపించండి."
                    )}

                  </span>

                </div>

              )}


              <div className="token-visual-decoration">

                <span />
                <span />
                <span />

              </div>


              <p>

                {getText(
                  language,
                  "Keep this token and payment reference for your records.",
                  "अपने रिकॉर्ड के लिए यह टोकन और भुगतान संदर्भ सुरक्षित रखें।",
                  "మీ రికార్డుల కోసం ఈ టోకెన్ మరియు చెల్లింపు రిఫరెన్స్‌ను ఉంచుకోండి."
                )}

              </p>


              <button
                type="button"
                className="token-download-pass-button"
                onClick={
                  downloadBookingPass
                }
              >

                <CheckCircle2
                  size={16}
                />

                {getText(
                  language,
                  "Download Offline Pass",
                  "ऑफलाइन पास डाउनलोड करें",
                  "ఆఫ్‌లైన్ పాస్ డౌన్‌లోడ్ చేయండి"
                )}

              </button>


              {paymentSent && (

                <button
                  type="button"
                  className="token-receipt-side-button"
                  onClick={
                    downloadProcurementReceipt
                  }
                >

                  <FileText
                    size={16}
                  />

                  {getText(
                    language,
                    "Download Receipt",
                    "रसीद डाउनलोड करें",
                    "రసీదు డౌన్‌లోడ్ చేయండి"
                  )}

                </button>

              )}

            </div>



            <div className="token-side-card">

              <div className="token-side-heading">

                <div className="token-side-icon green">

                  <Wheat
                    size={18}
                  />

                </div>


                <div>

                  <span>

                    {getText(
                      language,
                      "FARMER",
                      "किसान",
                      "రైతు"
                    )}

                  </span>


                  <strong>
                    {farmerName}
                  </strong>

                </div>

              </div>


              <div className="token-side-list">

                <div>

                  <span>

                    {getText(
                      language,
                      "Crop",
                      "फसल",
                      "పంట"
                    )}

                  </span>


                  <strong>
                    {cropName}
                  </strong>

                </div>


                <div>

                  <span>

                    {getText(
                      language,
                      "Quantity",
                      "मात्रा",
                      "పరిమాణం"
                    )}

                  </span>


                  <strong>

                    {
                      estimatedQuantity
                    }

                    {" kg"}

                  </strong>

                </div>


                <div>

                  <span>

                    {getText(
                      language,
                      "Village",
                      "गांव",
                      "గ్రామం"
                    )}

                  </span>


                  <strong>
                    {village}
                  </strong>

                </div>

              </div>

            </div>



            <div
              className={
                `token-side-card token-sms-card ${
                  smsSent
                    ? "sms-sent"
                    : smsFailed
                      ? "sms-failed"
                      : "sms-pending"
                }`
              }
            >

              <div
                className={
                  `token-side-icon ${
                    smsSent
                      ? "sms-sent"
                      : smsFailed
                        ? "sms-failed"
                        : "sms-pending"
                  }`
                }
              >

                {
                  smsSent ? (
                    <CheckCircle2
                      size={18}
                    />
                  ) : smsFailed ? (
                    <X
                      size={18}
                    />
                  ) : (
                    <Info
                      size={18}
                    />
                  )
                }

              </div>


              <span className="token-side-label">

                {
                  smsSent
                    ? getText(
                        language,
                        "SMS SENT",
                        "SMS भेजा गया",
                        "SMS పంపబడింది"
                      )
                    : smsFailed
                      ? getText(
                          language,
                          "SMS FAILED",
                          "SMS विफल",
                          "SMS విఫలమైంది"
                        )
                      : getText(
                          language,
                          "SMS STATUS",
                          "SMS स्थिति",
                          "SMS స్థితి"
                        )
                }

              </span>


              <h3>

                {
                  smsSent
                    ? getText(
                        language,
                        "Payment SMS sent",
                        "भुगतान SMS भेजा गया",
                        "చెల్లింపు SMS పంపబడింది"
                      )
                    : smsFailed
                      ? getText(
                          language,
                          "SMS delivery failed",
                          "SMS भेजना विफल रहा",
                          "SMS పంపడం విఫలమైంది"
                        )
                      : getText(
                          language,
                          "Payment update available",
                          "भुगतान अपडेट उपलब्ध है",
                          "చెల్లింపు అప్‌డేట్ అందుబాటులో ఉంది"
                        )
                }

              </h3>


              <p>

                {
                  smsSent
                    ? getText(
                        language,
                        "A confirmation was sent to your registered mobile number.",
                        "आपके पंजीकृत मोबाइल नंबर पर पुष्टि भेजी गई।",
                        "మీ రిజిస్టర్డ్ మొబైల్ నంబర్‌కు నిర్ధారణ పంపబడింది."
                      )
                    : smsFailed
                      ? getText(
                          language,
                          "Your payment is safely recorded in KrishiSetu even though the SMS was not delivered.",
                          "SMS नहीं पहुंचा, लेकिन आपका भुगतान KrishiSetu में सुरक्षित दर्ज है।",
                          "SMS పంపబడకపోయినా మీ చెల్లింపు KrishiSetuలో సురక్షితంగా నమోదు అయింది."
                        )
                      : getText(
                          language,
                          "Your payment information is available inside KrishiSetu.",
                          "आपके भुगतान की जानकारी KrishiSetu में उपलब्ध है।",
                          "మీ చెల్లింపు సమాచారం KrishiSetuలో అందుబాటులో ఉంది."
                        )
                }

              </p>

            </div>



            <div className="token-side-card token-help-card">

              <div className="token-side-icon gold">

                <HelpCircle
                  size={18}
                />

              </div>


              <span className="token-side-label">

                {getText(
                  language,
                  "NEED HELP?",
                  "सहायता चाहिए?",
                  "సహాయం కావాలా?"
                )}

              </span>


              <h3>

                {getText(
                  language,
                  "Something doesn't look right?",
                  "कुछ सही नहीं लग रहा?",
                  "ఏదైనా సరిగ్గా అనిపించడం లేదా?"
                )}

              </h3>


              <p>

                {getText(
                  language,
                  "Get help with your booking, payment or procurement center.",
                  "अपनी बुकिंग, भुगतान या खरीद केंद्र से संबंधित सहायता प्राप्त करें।",
                  "మీ బుకింగ్, చెల్లింపు లేదా కొనుగోలు కేంద్రానికి సంబంధించిన సహాయం పొందండి."
                )}

              </p>


              <Link
                to="/farmer/help"
                className="token-help-link"
              >

                {getText(
                  language,
                  "Help & FAQ",
                  "सहायता और FAQ",
                  "సహాయం & FAQ"
                )}


                <ArrowRight
                  size={14}
                />

              </Link>

            </div>

          </aside>

        </section>



        {/* =================================================
            BOTTOM ACTIONS
        ================================================= */}

        <section className="token-bottom-actions">

          <Link
            to="/farmer/home"
            className="token-secondary-action"
          >

            <ArrowLeft
              size={16}
            />

            {getText(
              language,
              "Back to Farmer Home",
              "किसान होम पर वापस जाएं",
              "రైతు హోమ్‌కు తిరిగి వెళ్లండి"
            )}

          </Link>


          <Link
            to="/farmer/book"
            className="token-primary-action"
          >

            {getText(
              language,
              "Book another crop slot",
              "दूसरी फसल का स्लॉट बुक करें",
              "మరో పంట స్లాట్ బుక్ చేయండి"
            )}

            <ArrowRight
              size={17}
            />

          </Link>

        </section>

      </main>



      {/* =================================================
          PAYMENT ISSUE MODAL
      ================================================= */}

      {showPaymentIssue && (

        <div className="token-payment-modal-backdrop">

          <div className="token-payment-modal">

            <div className="token-payment-modal-header">

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
                    "भुगतान समस्या की रिपोर्ट करें",
                    "చెల్లింపు సమస్యను నివేదించండి"
                  )}

                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowPaymentIssue(
                    false
                  )
                }
              >

                <X
                  size={17}
                />

              </button>

            </div>


            {
              issueSubmitted ? (

                <div className="token-payment-issue-success">

                  <CheckCircle2
                    size={22}
                  />


                  <strong>

                    {getText(
                      language,
                      "Issue recorded for support",
                      "सहायता के लिए समस्या दर्ज की गई",
                      "సహాయం కోసం సమస్య నమోదు చేయబడింది"
                    )}

                  </strong>


                  <span>

                    {getText(
                      language,
                      "Please keep your token and payment reference available when contacting the procurement center.",
                      "खरीद केंद्र से संपर्क करते समय अपना टोकन और भुगतान संदर्भ तैयार रखें।",
                      "కొనుగోలు కేంద్రాన్ని సంప్రదించినప్పుడు మీ టోకెన్ మరియు చెల్లింపు రిఫరెన్స్ సిద్ధంగా ఉంచుకోండి."
                    )}

                  </span>


                  <button
                    type="button"
                    className="token-payment-modal-close"
                    onClick={() =>
                      setShowPaymentIssue(
                        false
                      )
                    }
                  >

                    {getText(
                      language,
                      "Close",
                      "बंद करें",
                      "మూసివేయండి"
                    )}

                  </button>

                </div>

              ) : (

                <form
                  onSubmit={
                    handleIssueSubmit
                  }
                >

                  <p>

                    {getText(
                      language,
                      "Tell us what went wrong with your payment.",
                      "भुगतान के साथ क्या समस्या हुई, बताएं।",
                      "మీ చెల్లింపులో ఏ సమస్య వచ్చిందో చెప్పండి."
                    )}

                  </p>


                  <label className="token-payment-issue-label">

                    <span>

                      {getText(
                        language,
                        "Issue type",
                        "समस्या का प्रकार",
                        "సమస్య రకం"
                      )}

                    </span>


                    <select
                      value={
                        paymentIssueType
                      }
                      onChange={(event) =>
                        setPaymentIssueType(
                          event.target.value
                        )
                      }
                    >

                      <option value="PAYMENT_NOT_RECEIVED">

                        {getText(
                          language,
                          "Payment not received",
                          "भुगतान प्राप्त नहीं हुआ",
                          "చెల్లింపు అందలేదు"
                        )}

                      </option>


                      <option value="WRONG_AMOUNT">

                        {getText(
                          language,
                          "Wrong payment amount",
                          "गलत भुगतान राशि",
                          "తప్పు చెల్లింపు మొత్తం"
                        )}

                      </option>


                      <option value="REFERENCE_PROBLEM">

                        {getText(
                          language,
                          "Payment reference problem",
                          "भुगतान संदर्भ समस्या",
                          "చెల్లింపు రిఫరెన్స్ సమస్య"
                        )}

                      </option>


                      <option value="OTHER">

                        {getText(
                          language,
                          "Other",
                          "अन्य",
                          "ఇతర"
                        )}

                      </option>

                    </select>

                  </label>


                  <label className="token-payment-issue-label">

                    <span>

                      {getText(
                        language,
                        "Additional note",
                        "अतिरिक्त जानकारी",
                        "అదనపు సమాచారం"
                      )}

                    </span>


                    <textarea
                      value={
                        issueNote
                      }
                      onChange={(event) =>
                        setIssueNote(
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder={getText(
                        language,
                        "Describe the problem...",
                        "समस्या का विवरण लिखें...",
                        "సమస్యను వివరించండి..."
                      )}
                    />

                  </label>


                  <div className="token-payment-support-details">

                    <span>
                      Booking: {booking.id}
                    </span>


                    <span>
                      Token: #{booking.token}
                    </span>


                    <span>
                      Payment reference: {paymentReference}
                    </span>

                  </div>


                  <div className="token-payment-modal-actions">

                    <button
                      type="submit"
                      className="token-payment-help-link"
                    >

                      <Check
                        size={15}
                      />

                      {getText(
                        language,
                        "Submit issue",
                        "समस्या भेजें",
                        "సమస్యను పంపండి"
                      )}

                    </button>


                    <button
                      type="button"
                      className="token-payment-modal-close"
                      onClick={() =>
                        setShowPaymentIssue(
                          false
                        )
                      }
                    >

                      {getText(
                        language,
                        "Cancel",
                        "रद्द करें",
                        "రద్దు చేయండి"
                      )}

                    </button>

                  </div>

                </form>

              )
            }

          </div>

        </div>

      )}

    </div>

  );

}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function TokenInfo({
  icon,
  tone,
  label,
  value,
}) {

  return (

    <div className="token-arrival-card">

      <div
        className={
          `token-arrival-icon ${tone}`
        }
      >

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


function TokenDetail({
  icon,
  label,
  value,
}) {

  return (

    <div className="token-detail-item">

      <div className="token-detail-icon">

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


function TokenPaymentItem({
  label,
  value,
}) {

  return (

    <div className="token-payment-item">

      <span>
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>

  );

}


function TokenMonthlyStat({
  label,
  value,
}) {

  return (

    <div className="token-monthly-stat">

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
   QUEUE POSITION
========================================================= */

function getQueuePosition(
  booking,
  bookings,
  currentTime
) {

  if (
    !booking ||
    !Array.isArray(
      bookings
    )
  ) {

    return {

      position:
        0,

      ahead:
        0,

      waitMinutes:
        0,

      isCompleted:
        false,

    };

  }


  const completedStatuses = [
    "PROCURED",
    "PAYMENT_PENDING",
    "PAYMENT_SENT",
  ];


  if (
    completedStatuses.includes(
      booking.status
    )
  ) {

    return {

      position:
        0,

      ahead:
        0,

      waitMinutes:
        0,

      isCompleted:
        true,

    };

  }


  const relevantStatuses = [
    "CONFIRMED",
    "ARRIVED",
    "LATE",
    "WEIGHING",
  ];


  const bookingDate =
    String(
      booking?.date ||
      ""
    );


  const bookingCenterId =
    String(
      booking?.center_id ??
      booking?.centerId ??
      ""
    );


  if (
    !bookingDate ||
    !bookingCenterId
  ) {

    return {

      position:
        0,

      ahead:
        0,

      waitMinutes:
        0,

      isCompleted:
        false,

    };

  }


  const currentStart =
    parseQueueDateTime(
      booking.date,
      booking.slot_start ||
      booking.slotStart
    );


  if (
    !currentStart
  ) {

    return {

      position:
        0,

      ahead:
        0,

      waitMinutes:
        0,

      isCompleted:
        false,

    };

  }


  const currentStartTime =
    currentStart.getTime();


  const sameQueueBookings =
    bookings.filter(
      item => {

        if (
          String(
            item?.id
          ) ===
          String(
            booking.id
          )
        ) {

          return false;

        }


        if (
          String(
            item?.date ||
            ""
          ) !==
          bookingDate
        ) {

          return false;

        }


        const itemCenterId =
          String(
            item?.center_id ??
            item?.centerId ??
            ""
          );


        if (
          itemCenterId !==
          bookingCenterId
        ) {

          return false;

        }


        if (
          !relevantStatuses.includes(
            item?.status
          )
        ) {

          return false;

        }


        return true;

      }
    );


  const aheadRows =
    sameQueueBookings.filter(
      item => {

        const itemStatus =
          item?.status;


        /*
         * Farmers already at the center
         * or actively weighing should be
         * considered ahead.
         */

        if (
          itemStatus ===
            "ARRIVED" ||
          itemStatus ===
            "LATE" ||
          itemStatus ===
            "WEIGHING"
        ) {

          return true;

        }


        const itemDateTime =
          parseQueueDateTime(
            item.date,
            item.slot_start ||
            item.slotStart
          );


        if (
          !itemDateTime
        ) {

          return false;

        }


        return (
          itemDateTime.getTime() <=
          currentStartTime
        );

      }
    );


  const ahead =
    aheadRows.length;


  const position =
    ahead +
    1;


  /*
   * Demo/prototype estimate.
   * This is intentionally conservative.
   */

  const averageMinutesPerFarmer =
    15;


  let waitMinutes =
    ahead *
    averageMinutesPerFarmer;


  if (
    currentTime instanceof Date
  ) {

    const now =
      currentTime.getTime();


    if (
      now >
      currentStartTime
    ) {

      const elapsedMinutes =
        Math.floor(
          (
            now -
            currentStartTime
          ) /
          60000
        );


      waitMinutes =
        Math.max(
          5,
          waitMinutes -
          elapsedMinutes
        );

    }

  }


  return {

    position,

    ahead,

    waitMinutes,

    isCompleted:
      false,

  };

}


function parseQueueDateTime(
  date,
  time
) {

  if (
    !date ||
    !time
  ) {

    return null;

  }


  const value =
    String(
      time
    )
      .trim()
      .toUpperCase();


  const match =
    value.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
    );


  if (
    !match
  ) {

    return null;

  }


  let hour =
    Number(
      match[1]
    );


  const minute =
    Number(
      match[2]
    );


  const period =
    match[3];


  if (
    !Number.isFinite(
      hour
    ) ||
    !Number.isFinite(
      minute
    ) ||
    minute <
      0 ||
    minute >
      59
  ) {

    return null;

  }


  if (
    period ===
    "AM"
  ) {

    if (
      hour ===
      12
    ) {

      hour =
        0;

    }

  } else if (
    period ===
    "PM"
  ) {

    if (
      hour !==
      12
    ) {

      hour +=
        12;

    }

  }


  if (
    hour <
      0 ||
    hour >
      23
  ) {

    return null;

  }


  const result =
    new Date(
      `${date}T00:00:00`
    );


  if (
    Number.isNaN(
      result.getTime()
    )
  ) {

    return null;

  }


  result.setHours(
    hour,
    minute,
    0,
    0
  );


  return result;

}


function formatWaitTime(
  minutes,
  language
) {

  const safeMinutes =
    Math.max(
      0,
      Math.round(
        Number(
          minutes
        ) || 0
      )
    );


  const hours =
    Math.floor(
      safeMinutes /
      60
    );


  const remainingMinutes =
    safeMinutes %
    60;


  if (
    language ===
    "hi"
  ) {

    if (
      hours > 0
    ) {

      return `${hours} घंटे ${remainingMinutes} मिनट`;

    }


    return `${remainingMinutes} मिनट`;

  }


  if (
    language ===
    "te"
  ) {

    if (
      hours > 0
    ) {

      return `${hours} గంటలు ${remainingMinutes} నిమిషాలు`;

    }


    return `${remainingMinutes} నిమిషాలు`;

  }


  if (
    hours > 0
  ) {

    return `${hours}h ${remainingMinutes}m`;

  }


  return `${remainingMinutes} min`;

}


/* =========================================================
   VOICE
========================================================= */

function getPaymentVoiceMessage(
  language,
  amountText
) {

  if (
    language ===
    "hi"
  ) {

    return amountText
      ? `आपका ${amountText} रुपये का भुगतान सफलतापूर्वक भेज दिया गया है।`
      : "आपका भुगतान सफलतापूर्वक भेज दिया गया है।";

  }


  if (
    language ===
    "te"
  ) {

    return amountText
      ? `మీ ${amountText} రూపాయల చెల్లింపు విజయవంతంగా పంపబడింది.`
      : "మీ చెల్లింపు విజయవంతంగా పంపబడింది.";

  }


  return amountText
    ? `Your payment of ${amountText} rupees has been successfully sent.`
    : "Your payment has been successfully sent.";

}


function speakPaymentMessage(
  message,
  language
) {

  if (
    typeof window ===
      "undefined" ||
    !(
      "speechSynthesis" in
      window
    )
  ) {

    return;

  }


  try {

    window.speechSynthesis.cancel();


    const utterance =
      new SpeechSynthesisUtterance(
        message
      );


    const voiceLanguage =
      language ===
        "hi"
        ? "hi-IN"
        : language ===
            "te"
          ? "te-IN"
          : "en-IN";


    utterance.lang =
      voiceLanguage;


    utterance.rate =
      0.9;


    utterance.pitch =
      1;


    utterance.volume =
      1;


    const voices =
      window.speechSynthesis.getVoices();


    const matchingVoice =
      voices.find(
        voice =>
          String(
            voice.lang
          )
            .toLowerCase()
            .startsWith(
              language ===
                "hi"
                ? "hi"
                : language ===
                    "te"
                  ? "te"
                  : "en"
            )
      );


    if (
      matchingVoice
    ) {

      utterance.voice =
        matchingVoice;

    }


    window.speechSynthesis.speak(
      utterance
    );


  } catch (
    speechError
  ) {

    console.error(
      "Payment voice notification failed:",
      speechError
    );

  }

}


/* =========================================================
   NEXT ACTION
========================================================= */

function getNextAction(
  status,
  language
) {

  const actions = {

    CONFIRMED: {

      en: {
        title:
          "Prepare for your arrival",
        text:
          "Keep your token ready and reach the procurement center during your assigned window.",
      },

      hi: {
        title:
          "आने की तैयारी करें",
        text:
          "अपना टोकन तैयार रखें और निर्धारित समय पर खरीद केंद्र पहुंचें।",
      },

      te: {
        title:
          "రాకకు సిద్ధం అవ్వండి",
        text:
          "మీ టోకెన్ సిద్ధంగా ఉంచుకుని కేటాయించిన సమయంలో కేంద్రానికి చేరుకోండి.",
      },

    },

    ARRIVED: {

      en: {
        title:
          "Wait for the weighing stage",
        text:
          "Your arrival has been recorded. The center team will move your booking into weighing.",
      },

      hi: {
        title:
          "वजन प्रक्रिया की प्रतीक्षा करें",
        text:
          "आपकी पहुंच दर्ज हो गई है। केंद्र टीम आपकी बुकिंग को वजन प्रक्रिया में भेजेगी।",
      },

      te: {
        title:
          "తూకం దశ కోసం వేచి ఉండండి",
        text:
          "మీ రాక నమోదు అయింది. కేంద్ర బృందం మీ బుకింగ్‌ను తూకం దశకు పంపుతుంది.",
      },

    },

    LATE: {

      en: {
        title:
          "Speak with the center team",
        text:
          "Your booking is marked late. Contact the center team for guidance on the next available position.",
      },

      hi: {
        title:
          "केंद्र टीम से बात करें",
        text:
          "आपकी बुकिंग देर से दर्ज हुई है। अगली उपलब्ध प्रक्रिया के लिए केंद्र टीम से बात करें।",
      },

      te: {
        title:
          "కేంద్ర బృందంతో మాట్లాడండి",
        text:
          "మీ బుకింగ్ ఆలస్యంగా నమోదు అయింది. తదుపరి అందుబాటులో ఉన్న స్థానానికి కేంద్ర బృందాన్ని సంప్రదించండి.",
      },

    },

    WEIGHING: {

      en: {
        title:
          "Your produce is being weighed",
        text:
          "The operator is recording your actual quantity and checking the produce.",
      },

      hi: {
        title:
          "आपकी उपज का वजन हो रहा है",
        text:
          "ऑपरेटर आपकी वास्तविक मात्रा दर्ज कर रहा है और उपज की जांच कर रहा है।",
      },

      te: {
        title:
          "మీ పంట తూకం జరుగుతోంది",
        text:
          "ఆపరేటర్ మీ వాస్తవ పరిమాణాన్ని నమోదు చేసి పంటను తనిఖీ చేస్తున్నారు.",
      },

    },

    PROCURED: {

      en: {
        title:
          "Payment is the next stage",
        text:
          "Your produce has been procured. The booking can now move through payment processing.",
      },

      hi: {
        title:
          "अगला चरण भुगतान है",
        text:
          "आपकी उपज की खरीद पूरी हो गई है। अब बुकिंग भुगतान प्रक्रिया में जाएगी।",
      },

      te: {
        title:
          "తదుపరి దశ చెల్లింపు",
        text:
          "మీ పంట కొనుగోలు పూర్తైంది. ఇప్పుడు బుకింగ్ చెల్లింపు ప్రక్రియలోకి వెళుతుంది.",
      },

    },

    PAYMENT_PENDING: {

      en: {
        title:
          "Payment is being processed",
        text:
          "No action is required right now. Check your payment status again later.",
      },

      hi: {
        title:
          "भुगतान प्रक्रिया में है",
        text:
          "अभी किसी कार्रवाई की जरूरत नहीं है। बाद में भुगतान की स्थिति जांचें।",
      },

      te: {
        title:
          "చెల్లింపు ప్రాసెస్ అవుతోంది",
        text:
          "ప్రస్తుతం ఎలాంటి చర్య అవసరం లేదు. కొంతసేపటి తర్వాత చెల్లింపు స్థితిని చూడండి.",
      },

    },

    CANCELLED: {

      en: {
        title:
          "Booking cancelled",
        text:
          "This booking is no longer active. Create a new booking whenever you are ready.",
      },

      hi: {
        title:
          "बुकिंग रद्द हो गई",
        text:
          "यह बुकिंग अब सक्रिय नहीं है। जरूरत होने पर नई बुकिंग करें।",
      },

      te: {
        title:
          "బుకింగ్ రద్దు చేయబడింది",
        text:
          "ఈ బుకింగ్ ఇప్పుడు యాక్టివ్ కాదు. అవసరమైతే కొత్త బుకింగ్ చేయండి.",
      },

    },

    PAYMENT_SENT: {

      en: {
        title:
          "No further action required",
        text:
          "Your payment has been sent. Keep your payment reference for your records.",
      },

      hi: {
        title:
          "अब किसी कार्रवाई की जरूरत नहीं",
        text:
          "आपका भुगतान भेज दिया गया है। अपने रिकॉर्ड के लिए भुगतान संदर्भ सुरक्षित रखें।",
      },

      te: {
        title:
          "ఇక చర్య అవసరం లేదు",
        text:
          "మీ చెల్లింపు పంపబడింది. మీ రికార్డుల కోసం చెల్లింపు రిఫరెన్స్‌ను ఉంచుకోండి.",
      },

    },

  };


  const item =
    actions[
      status
    ] ||
    actions.CONFIRMED;


  return (
    item[
      language
    ] ||
    item.en
  );

}


/* =========================================================
   ARRIVAL COUNTDOWN
========================================================= */

function getArrivalCountdown(
  date,
  start,
  end,
  currentTime,
  language
) {

  if (
    !date ||
    !start
  ) {

    return {

      label:
        getText(
          language,
          "ARRIVAL WINDOW",
          "आने का समय",
          "రాక సమయం"
        ),

      value:
        "—",

      tone:
        "neutral",

    };

  }


  const startValue =
    parseBookingDateTime(
      date,
      start
    );


  const endValue =
    end
      ? parseBookingDateTime(
          date,
          end
        )
      : null;


  if (
    !startValue
  ) {

    return {

      label:
        getText(
          language,
          "ARRIVAL WINDOW",
          "आने का समय",
          "రాక సమయం"
        ),

      value:
        "—",

      tone:
        "neutral",

    };

  }


  const now =
    currentTime.getTime();


  const startTime =
    startValue.getTime();


  const endTime =
    endValue
      ? endValue.getTime()
      : startTime;


  if (
    now <
    startTime
  ) {

    return {

      label:
        getText(
          language,
          "ARRIVAL WINDOW",
          "आने का समय",
          "రాక సమయం"
        ),

      value:
        formatDuration(
          startTime -
          now,
          language
        ),

      tone:
        "upcoming",

    };

  }


  if (
    now >=
    startTime &&
    now <=
    endTime
  ) {

    return {

      label:
        getText(
          language,
          "WINDOW ACTIVE",
          "समय सक्रिय है",
          "సమయ విండో యాక్టివ్"
        ),

      value:
        endValue
          ? getText(
              language,
              `${formatDuration(
                endTime - now,
                language
              )} remaining`,
              `${formatDuration(
                endTime - now,
                language
              )} शेष`,
              `${formatDuration(
                endTime - now,
                language
              )} మిగిలి ఉంది`
            )
          : getText(
              language,
              "Active now",
              "अभी सक्रिय",
              "ప్రస్తుతం యాక్టివ్"
            ),

      tone:
        "active",

    };

  }


  return {

    label:
      getText(
        language,
        "ARRIVAL WINDOW",
        "आने का समय",
        "రాక సమయం"
      ),

    value:
      getText(
        language,
        "Window passed",
        "समय बीत गया",
        "సమయం ముగిసింది"
      ),

    tone:
      "passed",

  };

}


/* =========================================================
   DATE/TIME
========================================================= */

function parseBookingDateTime(
  date,
  time
) {

  const value =
    String(
      time
    )
      .trim()
      .toUpperCase();


  const match =
    value.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
    );


  if (
    !match
  ) {

    return null;

  }


  let hour =
    Number(
      match[1]
    );


  const minute =
    Number(
      match[2]
    );


  const period =
    match[3];


  if (
    period ===
    "AM"
  ) {

    if (
      hour ===
      12
    ) {

      hour =
        0;

    }

  } else if (
    period ===
    "PM"
  ) {

    if (
      hour !==
      12
    ) {

      hour +=
        12;

    }

  }


  const result =
    new Date(
      `${date}T00:00:00`
    );


  if (
    Number.isNaN(
      result.getTime()
    )
  ) {

    return null;

  }


  result.setHours(
    hour,
    minute,
    0,
    0
  );


  return result;

}


function formatDuration(
  milliseconds,
  language
) {

  const totalMinutes =
    Math.max(
      0,
      Math.ceil(
        milliseconds /
        60000
      )
    );


  const hours =
    Math.floor(
      totalMinutes /
      60
    );


  const minutes =
    totalMinutes %
    60;


  if (
    language ===
    "hi"
  ) {

    if (
      hours > 0
    ) {

      return `${hours} घंटे ${minutes} मिनट`;

    }


    return `${minutes} मिनट`;

  }


  if (
    language ===
    "te"
  ) {

    if (
      hours > 0
    ) {

      return `${hours} घंटలు ${minutes} నిమిషాలు`;

    }


    return `${minutes} నిమిషాలు`;

  }


  if (
    hours > 0
  ) {

    return `${hours}h ${minutes}m`;

  }


  return `${minutes} min`;

}


function formatUpdatedTime(
  value,
  language
) {

  if (
    !value
  ) {

    return "—";

  }


  const locale =
    language ===
      "hi"
      ? "hi-IN"
      : language ===
          "te"
        ? "te-IN"
        : "en-IN";


  return value.toLocaleTimeString(
    locale,
    {
      hour:
        "numeric",

      minute:
        "2-digit",

      second:
        "2-digit",

    }
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

      year:
        "numeric",

    }
  );

}


function formatCurrentMonth(
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


  return new Date().toLocaleDateString(
    locale,
    {
      month:
        "long",

      year:
        "numeric",

    }
  );

}


function formatNotificationDate(
  value,
  language
) {

  if (
    !value
  ) {

    return "";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const locale =
    language === "hi"
      ? "hi-IN"
      : language === "te"
        ? "te-IN"
        : "en-IN";


  return date.toLocaleString(
    locale,
    {
      day:
        "numeric",

      month:
        "short",

      hour:
        "numeric",

      minute:
        "2-digit",

    }
  );

}


function formatTime(
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

    const text =
      String(
        value
      )
        .trim()
        .toUpperCase();


    const match =
      text.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
      );


    if (
      !match
    ) {

      return value;

    }


    let hour =
      Number(
        match[1]
      );


    const minute =
      match[2];


    const period =
      match[3];


    if (
      period ===
      "AM"
    ) {

      if (
        hour ===
        12
      ) {

        hour = 0;

      }

    } else if (
      period ===
      "PM"
    ) {

      if (
        hour !==
        12
      ) {

        hour +=
          12;

      }

    }


    const suffix =
      hour >=
      12
        ? "PM"
        : "AM";


    const displayHour =
      hour %
        12 ||
      12;


    return (
      `${displayHour}:${minute} ${suffix}`
    );

  }


  return end
    ? `${convert(start)} – ${convert(end)}`
    : convert(start);

}


/* =========================================================
   STATUS
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
  t
) {

  if (
    !crop
  ) {

    return "Wheat";

  }


  const value =
    t(
      `crops.${crop}`,
      ""
    );


  if (
    value &&
    value !==
      `crops.${crop}`
  ) {

    return value;

  }


  const names = {

    wheat:
      "Wheat",

    paddy:
      "Paddy",

    maize:
      "Maize",

    cotton:
      "Cotton",

  };


  return (
    names[
      crop
    ] ||
    crop
  );

}


function getStatusLabel(
  status,
  language,
  t
) {

  const keys = {

    CONFIRMED:
      "status.confirmed",

    ARRIVED:
      "status.arrived",

    WEIGHING:
      "status.weighing",

    PROCURED:
      "status.procured",

    PAYMENT_PENDING:
      "status.paymentPending",

    PAYMENT_SENT:
      "status.paymentSent",

    LATE:
      "status.late",

    CANCELLED:
      "status.cancelled",

  };


  if (
    keys[status]
  ) {

    const translated =
      t(
        keys[status],
        ""
      );


    if (
      translated
    ) {

      return translated;

    }

  }


  const labels = {

    en: {

      CONFIRMED:
        "Confirmed",

      ARRIVED:
        "Arrived",

      WEIGHING:
        "Weighing",

      PROCURED:
        "Procured",

      PAYMENT_PENDING:
        "Payment Pending",

      PAYMENT_SENT:
        "Payment Sent",

      LATE:
        "Late",
      CANCELLED:
        "Cancelled",

    },


    hi: {

      CONFIRMED:
        "पुष्टि की गई",

      ARRIVED:
        "पहुंच गए",

      WEIGHING:
        "तौल हो रही है",

      PROCURED:
        "खरीद पूरी",

      PAYMENT_PENDING:
        "भुगतान लंबित",

      PAYMENT_SENT:
        "भुगतान भेजा गया",

      LATE:
        "देर से",
      CANCELLED:
        "रद्द",

    },


    te: {

      CONFIRMED:
        "నిర్ధారించబడింది",

      ARRIVED:
        "చేరుకున్నారు",

      WEIGHING:
        "తూకం జరుగుతోంది",

      PROCURED:
        "కొనుగోలు పూర్తైంది",

      PAYMENT_PENDING:
        "చెల్లింపు పెండింగ్‌లో ఉంది",

      PAYMENT_SENT:
        "చెల్లింపు పంపబడింది",

      LATE:
        "ఆలస్యం",
      CANCELLED:
        "రద్దు చేయబడింది",

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


function getStatusMessage(
  status,
  language
) {

  const messages = {

    en: {

      CONFIRMED:
        "Your procurement slot has been successfully booked.",

      ARRIVED:
        "Your arrival has been recorded at the procurement center.",

      WEIGHING:
        "Your produce is currently being weighed by the center operator.",

      PROCURED:
        "Your produce has been verified and procurement is complete.",

      PAYMENT_PENDING:
        "Your payable amount is ready and your payment is being processed.",

      PAYMENT_SENT:
        "Your payment has been successfully sent.",

      LATE:
        "Your booking has been marked late by the procurement center.",
      CANCELLED:
        "This booking has been cancelled. You can create a new booking whenever you are ready.",

    },


    hi: {

      CONFIRMED:
        "आपका खरीद स्लॉट सफलतापूर्वक बुक हो गया है।",

      ARRIVED:
        "केंद्र पर आपके पहुंचने की जानकारी दर्ज कर ली गई है।",

      WEIGHING:
        "केंद्र ऑपरेटर आपकी उपज का वजन कर रहा है।",

      PROCURED:
        "आपकी उपज सत्यापित हो गई है और खरीद पूरी हो गई है।",

      PAYMENT_PENDING:
        "आपकी भुगतान राशि तैयार है और भुगतान प्रक्रिया में है।",

      PAYMENT_SENT:
        "आपका भुगतान सफलतापूर्वक भेज दिया गया है।",

      LATE:
        "केंद्र ने आपकी बुकिंग को देर से आने के रूप में दर्ज किया है।",
      CANCELLED:
        "यह बुकिंग रद्द कर दी गई है। आप जरूरत होने पर नई बुकिंग कर सकते हैं।",

    },


    te: {

      CONFIRMED:
        "మీ కొనుగోలు స్లాట్ విజయవంతంగా బుక్ చేయబడింది.",

      ARRIVED:
        "కేంద్రంలో మీ రాక నమోదు చేయబడింది.",

      WEIGHING:
        "కేంద్ర ఆపరేటర్ ప్రస్తుతం మీ పంటను తూకం వేస్తున్నారు.",

      PROCURED:
        "మీ పంట ధృవీకరించబడింది మరియు కొనుగోలు పూర్తైంది.",

      PAYMENT_PENDING:
        "మీ చెల్లింపు మొత్తం సిద్ధంగా ఉంది మరియు చెల్లింపు ప్రాసెస్ అవుతోంది.",

      PAYMENT_SENT:
        "మీ చెల్లింపు విజయవంతంగా పంపబడింది.",

      LATE:
        "కేంద్రం మీ బుకింగ్‌ను ఆలస్యంగా వచ్చినట్లు నమోదు చేసింది.",
      CANCELLED:
        "ఈ బుకింగ్ రద్దు చేయబడింది. అవసరమైతే మీరు కొత్త బుకింగ్ చేయవచ్చు.",

    },

  };


  return (
    messages[
      language
    ]?.[
      status
    ] ||
    messages.en[
      status
    ] ||
    "Booking status is being updated."
  );

}


function getStatusColor(
  status
) {

  if (
    status ===
    "CANCELLED"
  ) {
    return "red";
  }

  if (
    status ===
    "WEIGHING"
  ) {

    return "orange";

  }


  if (
    status ===
    "PAYMENT_PENDING"
  ) {

    return "gold";

  }


  if (
    status ===
    "ARRIVED"
  ) {

    return "blue";

  }


  return "green";

}


function getTimelineIndex(
  status
) {

  if (
    status ===
    "CANCELLED"
  ) {
    return 0;
  }

  if (
    status ===
    "LATE"
  ) {

    return 1;

  }


  const index =
    STATUS_ORDER.indexOf(
      status
    );


  return Math.max(
    index,
    0
  );

}


function getCenterDisplay(
  centerId
) {

  const names = {

    main: {

      name:
        "Main Procurement Center",

      address:
        "Primary procurement center",

    },

    north: {

      name:
        "North Procurement Center",

      address:
        "North procurement center",

    },

    east: {

      name:
        "East Procurement Center",

      address:
        "East procurement center",

    },

  };


  return (
    names[
      centerId
    ] ||
    {

      name:
        centerId ||
        "Procurement Center",

      address:
        "Selected procurement center",

    }
  );

}


export default FarmerToken;