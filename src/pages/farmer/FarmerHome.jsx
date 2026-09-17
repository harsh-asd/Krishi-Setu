import {
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  LogOut,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Settings,
  ShieldCheck,
  Truck,
  Wheat,
  X,
} from "lucide-react";

import {
  createPortal,
} from "react-dom";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "../../components/Header";
import WeatherAdvisoryCard from "../../components/WeatherAdvisoryCard";
import MandiPricesTicker from "../../components/MandiPricesTicker";
import StatusBadge from "../../components/StatusBadge";

import {
  useLanguage,
} from "../../translations/LanguageContext";

import {
  getState,
  logoutUser,
  updateFarmer,
} from "../../data/appStore";


const API_URL =
  import.meta.env.VITE_API_URL;


const ACTIVE_STATUSES = [
  "CONFIRMED",
  "ARRIVED",
  "LATE",
  "WEIGHING",
  "PROCURED",
  "PAYMENT_PENDING",
];


function FarmerHome() {

  const navigate =
    useNavigate();


  const {
    t,
    language,
  } =
    useLanguage();


  const initialState =
    getState();


  const currentFarmerId =
    initialState?.currentUser?.farmerId ||
    null;


  const localFarmer =
    currentFarmerId
      ? (
          initialState?.farmers?.find(
            farmer =>
              String(
                farmer?.id
              ) ===
              String(
                currentFarmerId
              )
          ) ||
          null
        )
      : null;


  const [
    farmer,
    setFarmer,
  ] =
    useState(
      localFarmer
    );


  const [
    farmerLoading,
    setFarmerLoading,
  ] =
    useState(
      Boolean(
        currentFarmerId
      )
    );


  const [
    farmerError,
    setFarmerError,
  ] =
    useState("");


  const [
    bookings,
    setBookings,
  ] =
    useState([]);


  const [
    centers,
    setCenters,
  ] =
    useState([]);


  const [
    notifications,
    setNotifications,
  ] =
    useState([]);


  const [
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(false);


  const [
    notificationsLoading,
    setNotificationsLoading,
  ] =
    useState(false);


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


  const farmerId =
    farmer?.id ||
    null;


  /*
   * ========================================================
   * LOAD FARMER FROM DATABASE
   * ========================================================
   */

  const loadFarmer =
    useCallback(
      async () => {

        if (
          !currentFarmerId
        ) {

          setFarmer(
            null
          );

          setFarmerLoading(
            false
          );

          setLoading(
            false
          );

          return;

        }


        setFarmerLoading(
          true
        );


        setFarmerError(
          ""
        );


        try {

          const response =
            await fetch(
              `${API_URL}/farmers/${encodeURIComponent(
                currentFarmerId
              )}`
            );


          let data =
            null;


          try {

            data =
              await response.json();

          } catch {

            data =
              null;

          }


          if (
            !response.ok ||
            !data?.farmer
          ) {

            throw new Error(
              data?.message ||
              "Your farmer account could not be found."
            );

          }


          const serverFarmer =
            normalizeFarmer(
              data.farmer
            );


          if (
            !serverFarmer?.id
          ) {

            throw new Error(
              "Invalid farmer account returned by the server."
            );

          }


          if (
            String(
              serverFarmer.id
            ) !==
            String(
              currentFarmerId
            )
          ) {

            throw new Error(
              "The logged-in farmer account could not be verified."
            );

          }


          setFarmer(
            serverFarmer
          );


          try {

            updateFarmer(
              serverFarmer.id,
              serverFarmer
            );

          } catch (
            syncError
          ) {

            console.warn(
              "Farmer local sync warning:",
              syncError
            );

          }

        } catch (
          farmerLoadError
        ) {

          console.error(
            "Farmer account loading error:",
            farmerLoadError
          );


          setFarmerError(
            farmerLoadError?.message ||
            "Unable to load your farmer account."
          );

        } finally {

          setFarmerLoading(
            false
          );

          setLoading(
            false
          );

        }

      },
      [
        currentFarmerId,
      ]
    );


  useEffect(() => {

    loadFarmer();

  }, [
    loadFarmer,
  ]);


  /*
   * ========================================================
   * LOAD PROCUREMENT CENTERS
   * ========================================================
   */

  const loadCenters =
    useCallback(
      async () => {

        try {

          const response =
            await fetch(
              `${API_URL}/centers`
            );


          let data =
            null;


          try {

            data =
              await response.json();

          } catch {

            data =
              null;

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Unable to load procurement centers."
            );

          }


          const serverCenters =
            Array.isArray(
              data?.centers
            )
              ? data.centers
                  .map(
                    center => {

                      const capacity =
                        Number(
                          center?.capacityPerSlot ??
                          center?.capacity_per_slot ??
                          center?.capacity ??
                          0
                        );


                      return {

                        ...center,

                        id:
                          String(
                            center?.id ||
                            ""
                          ),

                        name:
                          center?.name ||
                          "Procurement Center",

                        address:
                          center?.address ||
                          "",

                        landmark:
                          center?.landmark ||
                          "",

                        openingTime:
                          center?.openingTime ||
                          center?.opening_time ||
                          "—",

                        closingTime:
                          center?.closingTime ||
                          center?.closing_time ||
                          "—",

                        workingDays:
                          center?.workingDays ||
                          center?.working_days ||
                          "—",

                        capacity,

                        capacityPerSlot:
                          capacity,

                        phone:
                          center?.phone ||
                          "",

                        mapUrl:
                          center?.mapUrl ||
                          center?.map_url ||
                          "",

                        active:
                          center?.active,

                      };

                    }
                  )
                  .filter(
                    center =>
                      center.id
                  )
              : [];


          setCenters(
            serverCenters
          );

        } catch (
          centerError
        ) {

          console.error(
            "FarmerHome center loading error:",
            centerError
          );

        }

      },
      []
    );


  useEffect(() => {

    loadCenters();

  }, [
    loadCenters,
  ]);


  /*
   * ========================================================
   * LOAD BOOKINGS
   * ========================================================
   */

  const loadBookings =
    useCallback(
      async (
        showRefresh = false
      ) => {

        if (
          !farmerId
        ) {

          setBookings(
            []
          );

          if (
            !farmerLoading
          ) {

            setError(
              getText(
                language,
                "Farmer account could not be loaded.",
                "किसान खाता लोड नहीं हो सका।",
                "రైతు ఖాతాను లోడ్ చేయలేకపోయాము."
              )
            );

          }

          return;

        }


        if (
          showRefresh
        ) {

          setRefreshing(
            true
          );

        }


        try {

          const response =
            await fetch(
              `${API_URL}/bookings`
            );


          let data =
            null;


          try {

            data =
              await response.json();

          } catch {

            data =
              null;

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Unable to load your bookings."
            );

          }


          const allBookings =
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : [];


          const farmerBookings =
            allBookings.filter(
              booking =>
                String(
                  booking?.farmer_id ??
                  ""
                ) ===
                String(
                  farmerId
                )
            );


          setBookings(
            farmerBookings
          );


          setError("");

        } catch (
          loadError
        ) {

          console.error(
            "FarmerHome booking loading error:",
            loadError
          );


          setError(
            loadError?.message ||
            getText(
              language,
              "Unable to load your bookings.",
              "आपकी बुकिंग लोड नहीं हो सकी।",
              "మీ బుకింగ్‌లను లోడ్ చేయలేకపోయాము."
            )
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
      [
        farmerId,
        farmerLoading,
        language,
      ]
    );


  /*
   * ========================================================
   * LOAD NOTIFICATIONS
   * ========================================================
   */

  const loadNotifications =
    useCallback(
      async (
        silent = false
      ) => {

        if (
          !farmerId
        ) {

          setNotifications(
            []
          );

          return;

        }


        if (
          !silent
        ) {

          setNotificationsLoading(
            true
          );

        }


        try {

          const response =
            await fetch(
              `${API_URL}/farmers/${encodeURIComponent(
                farmerId
              )}/notifications`
            );


          let data =
            null;


          try {

            data =
              await response.json();

          } catch {

            data =
              null;

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Unable to load notifications."
            );

          }


          setNotifications(
            Array.isArray(
              data?.notifications
            )
              ? data.notifications
              : []
          );

        } catch (
          notificationError
        ) {

          console.error(
            "FarmerHome notifications error:",
            notificationError
          );

        } finally {

          if (
            !silent
          ) {

            setNotificationsLoading(
              false
            );

          }

        }

      },
      [
        farmerId,
      ]
    );


  /*
   * ========================================================
   * DASHBOARD REFRESH
   * ========================================================
   */

  useEffect(() => {

    if (
      !farmerId ||
      farmerLoading
    ) {

      return;

    }


    loadBookings();

    loadNotifications(
      true
    );

    loadCenters();


    const timer =
      setInterval(
        () => {

          loadBookings();

          loadNotifications(
            true
          );

          loadCenters();

        },
        5000
      );


    return () => {

      clearInterval(
        timer
      );

    };

  }, [
    farmerId,
    farmerLoading,
    loadBookings,
    loadNotifications,
    loadCenters,
  ]);


  /*
   * ========================================================
   * NOTIFICATIONS
   * ========================================================
   */

  async function markNotificationRead(
    id
  ) {

    try {

      const response =
        await fetch(
          `${API_URL}/notifications/${encodeURIComponent(
            id
          )}/read`,
          {
            method:
              "PATCH",
          }
        );


      let data =
        null;


      try {

        data =
          await response.json();

      } catch {

        data =
          null;

      }


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          "Unable to mark notification as read."
        );

      }


      setNotifications(
        current =>
          current.map(
            notification =>
              String(
                notification.id
              ) ===
              String(
                id
              )
                ? {
                    ...notification,

                    read_at:
                      new Date().toISOString(),

                  }
                : notification
          )
      );

    } catch (
      notificationError
    ) {

      console.error(
        "Mark notification read error:",
        notificationError
      );

    }

  }


  async function markAllNotificationsRead() {

    const unread =
      notifications.filter(
        notification =>
          !notification.read_at
      );


    if (
      unread.length ===
      0
    ) {

      return;

    }


    try {

      await Promise.all(
        unread.map(
          notification =>
            fetch(
              `${API_URL}/notifications/${encodeURIComponent(
                notification.id
              )}/read`,
              {
                method:
                  "PATCH",
              }
            )
        )
      );


      const timestamp =
        new Date().toISOString();


      setNotifications(
        current =>
          current.map(
            notification => ({
              ...notification,

              read_at:
                notification.read_at ||
                timestamp,

            })
          )
      );

    } catch (
      notificationError
    ) {

      console.error(
        "Mark all notifications read error:",
        notificationError
      );

    }

  }


  function handleLogout() {

    setNotificationsOpen(
      false
    );


    logoutUser();


    navigate(
      "/farmer/login",
      {
        replace:
          true,
      }
    );

  }


  /*
   * ========================================================
   * COMPUTED DATA
   * ========================================================
   */

  const unreadNotificationCount =
    notifications.filter(
      notification =>
        !notification.read_at
    ).length;


  const farmerName =
    farmer?.name ||
    getText(
      language,
      "Farmer",
      "किसान",
      "రైతు"
    );


  const firstName =
    farmerName
      .trim()
      .split(
        /\s+/
      )[0] ||
    farmerName;


  const initials =
    farmerName
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      )
      .map(
        word =>
          word[0]
      )
      .join("")
      .slice(
        0,
        2
      )
      .toUpperCase();


  const activeBooking =
    useMemo(
      () => {

        const rows =
          bookings.filter(
            booking =>
              ACTIVE_STATUSES.includes(
                booking.status
              )
          );


        if (
          rows.length ===
          0
        ) {

          return null;

        }


        return [
          ...rows,
        ].sort(
          (
            a,
            b
          ) => {

            const dateCompare =
              String(
                a.date ||
                ""
              ).localeCompare(
                String(
                  b.date ||
                  ""
                )
              );


            if (
              dateCompare !==
              0
            ) {

              return dateCompare;

            }


            return String(
              a.slot_start ||
              ""
            ).localeCompare(
              String(
                b.slot_start ||
                ""
              )
            );

          }
        )[0];

      },
      [
        bookings,
      ]
    );


  const upcomingBookings =
    useMemo(
      () =>
        [
          ...bookings,
        ]
          .filter(
            booking =>
              ACTIVE_STATUSES.includes(
                booking.status
              ) &&
              booking.id !==
                activeBooking?.id
          )
          .sort(
            (
              a,
              b
            ) => {

              const dateCompare =
                String(
                  a.date ||
                  ""
                ).localeCompare(
                  String(
                    b.date ||
                    ""
                  )
                );


              if (
                dateCompare !==
                0
              ) {

                return dateCompare;

              }


              return String(
                a.slot_start ||
                ""
              ).localeCompare(
                String(
                  b.slot_start ||
                  ""
                )
              );

            }
          )
          .slice(
            0,
            4
          ),
      [
        bookings,
        activeBooking,
      ]
    );


  const recentPayments =
    useMemo(
      () =>
        [
          ...bookings,
        ]
          .filter(
            booking =>
              Number(
                booking.payment_amount ||
                0
              ) >
              0
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
          )
          .slice(
            0,
            5
          ),
      [
        bookings,
      ]
    );


  const recentBookings =
    useMemo(
      () =>
        [
          ...bookings,
        ]
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.created_at ||
                b.date ||
                ""
              ).localeCompare(
                String(
                  a.created_at ||
                  a.date ||
                  ""
                )
              )
          )
          .slice(
            0,
            5
          ),
      [
        bookings,
      ]
    );


  const monthSummary =
    useMemo(
      () => {

        const today =
          new Date();


        const year =
          today.getFullYear();


        const month =
          today.getMonth();


        const rows =
          bookings.filter(
            booking => {

              if (
                !booking.date
              ) {

                return false;

              }


              const date =
                new Date(
                  `${booking.date}T00:00:00`
                );


              return (
                date.getFullYear() ===
                  year &&
                date.getMonth() ===
                  month
              );

            }
          );


        const completed =
          rows.filter(
            booking =>
              [
                "PROCURED",
                "PAYMENT_PENDING",
                "PAYMENT_SENT",
              ].includes(
                booking.status
              )
          );


        const quantity =
          completed.reduce(
            (
              total,
              booking
            ) =>
              total +
              Number(
                booking.actual_quantity ??
                booking.estimated_quantity ??
                0
              ),
            0
          );


        const earned =
          completed.reduce(
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


        const cropMap =
          {};


        completed.forEach(
          booking => {

            const crop =
              booking.crop ||
              "other";


            if (
              !cropMap[crop]
            ) {

              cropMap[crop] = {

                crop,

                quantity:
                  0,

                amount:
                  0,

                count:
                  0,

              };

            }


            cropMap[
              crop
            ].quantity +=
              Number(
                booking.actual_quantity ??
                booking.estimated_quantity ??
                0
              );


            cropMap[
              crop
            ].amount +=
              Number(
                booking.payment_amount ||
                0
              );


            cropMap[
              crop
            ].count +=
              1;

          }
        );


        return {

          bookings:
            rows.length,

          completed:
            completed.length,

          quantity,

          earned,

          crops:
            Object.values(
              cropMap
            ),

        };

      },
      [
        bookings,
      ]
    );


  /*
   * ========================================================
   * LIVE CENTER
   * ========================================================
   *
   * Active booking center is preferred.
   * Otherwise farmer's preferred center is used.
   * No hardcoded center data is used anymore.
   */

  const selectedCenterId =
    activeBooking?.center_id ||
    farmer?.preferred_center_id ||
    farmer?.preferredCenterId ||
    null;


  const center =
    centers.find(
      item =>
        String(
          item?.id
        ) ===
        String(
          selectedCenterId
        )
    ) ||
    centers[0] ||
    {
      id:
        null,

      name:
        getText(
          language,
          "Procurement Center",
          "खरीद केंद्र",
          "కొనుగోలు కేంద్రం"
        ),

      address:
        getText(
          language,
          "Center information unavailable.",
          "केंद्र की जानकारी उपलब्ध नहीं है।",
          "కేంద్ర సమాచారం అందుబాటులో లేదు."
        ),

      openingTime:
        "—",

      closingTime:
        "—",

      workingDays:
        "—",

      capacity:
        0,

      phone:
        "",

      mapUrl:
        "",

    };


  /*
   * ========================================================
   * ACCOUNT / LOADING STATES
   * ========================================================
   */

  if (
    farmerLoading
  ) {

    return (

      <div className="farmer-home-page">

        <Header />
        <MandiPricesTicker />


        <main className="farmer-home-container">

          <section className="empty-state-card">

            <div className="empty-state-icon">

              <RefreshCw
                size={27}
                className="loading-spin"
              />

            </div>


            <span className="page-eyebrow">

              FARMER PORTAL

            </span>


            <h1>

              {
                getText(
                  language,
                  "Loading your account",
                  "आपका खाता लोड हो रहा है",
                  "మీ ఖాతా లోడ్ అవుతోంది"
                )
              }

            </h1>


            <p>

              {
                getText(
                  language,
                  "Verifying your farmer account and latest procurement information.",
                  "आपके किसान खाते और नवीनतम खरीद जानकारी की पुष्टि की जा रही है।",
                  "మీ రైతు ఖాతా మరియు తాజా కొనుగోలు సమాచారాన్ని నిర్ధారిస్తున్నాము."
                )
              }

            </p>

          </section>

        </main>

      </div>

    );

  }


  if (
    !farmer
  ) {

    return (

      <div className="farmer-home-page">

        <Header />
        <MandiPricesTicker />


        <main className="farmer-home-container">

          <section className="empty-state-card">

            <div className="empty-state-icon">

              <CircleHelp
                size={30}
              />

            </div>


            <span className="page-eyebrow">

              FARMER PORTAL

            </span>


            <h1>

              {
                farmerError ||
                getText(
                  language,
                  "Farmer account not found",
                  "किसान खाता नहीं मिला",
                  "రైతు ఖాతా కనుగొనబడలేదు"
                )
              }

            </h1>


            <p>

              {
                getText(
                  language,
                  "Please login again with your registered mobile number.",
                  "कृपया अपने पंजीकृत मोबाइल नंबर से फिर लॉगिन करें।",
                  "దయచేసి మీ రిజిస్టర్డ్ మొబైల్ నంబర్‌తో మళ్లీ లాగిన్ చేయండి."
                )
              }

            </p>


            <Link
              to="/farmer/login"
              className="home-primary-action"
            >

              {
                getText(
                  language,
                  "Go to Login",
                  "लॉगिन पर जाएं",
                  "లాగిన్‌కు వెళ్లండి"
                )
              }


              <ArrowRight
                size={18}
              />

            </Link>

          </section>

        </main>

      </div>

    );

  }


  if (
    loading
  ) {

    return (

      <div className="farmer-home-page">

        <Header />
        <MandiPricesTicker />


        <main className="farmer-home-container">

          <section className="empty-state-card">

            <div className="empty-state-icon">

              <RefreshCw
                size={27}
                className="loading-spin"
              />

            </div>


            <span className="page-eyebrow">

              FARMER PORTAL

            </span>


            <h1>

              {
                getText(
                  language,
                  "Loading your dashboard",
                  "आपका डैशबोर्ड लोड हो रहा है",
                  "మీ డాష్‌బోర్డ్ లోడ్ అవుతోంది"
                )
              }

            </h1>


            <p>

              {
                getText(
                  language,
                  "Fetching your latest procurement information.",
                  "आपकी नवीनतम खरीद जानकारी लाई जा रही है।",
                  "మీ తాజా కొనుగోలు సమాచారాన్ని తీసుకువస్తున్నాము."
                )
              }

            </p>

          </section>

        </main>

      </div>

    );

  }


  if (
    error &&
    bookings.length ===
      0
  ) {

    return (

      <div className="farmer-home-page">

        <Header />
        <MandiPricesTicker />


        <main className="farmer-home-container">

          <section className="empty-state-card">

            <div className="empty-state-icon">

              <RefreshCw
                size={27}
              />

            </div>


            <span className="page-eyebrow">

              CONNECTION

            </span>


            <h1>

              {
                getText(
                  language,
                  "Could not load your bookings",
                  "आपकी बुकिंग लोड नहीं हो सकी",
                  "మీ బుకింగ్‌లను లోడ్ చేయలేకపోయాము"
                )
              }

            </h1>


            <p>

              {
                error
              }

            </p>


            <button
              type="button"
              className="home-primary-action"
              onClick={() =>
                loadBookings(
                  true
                )
              }
            >

              {
                getText(
                  language,
                  "Try Again",
                  "फिर कोशिश करें",
                  "మళ్లీ ప్రయత్నించండి"
                )
              }


              <ArrowRight
                size={18}
              />

            </button>

          </section>

        </main>

      </div>

    );

  }


  return (

    <div className="farmer-home-page">

      <Header />
        <MandiPricesTicker />


      <main className="farmer-home-container">
        
        <WeatherAdvisoryCard lat={farmer?.current_lat || farmer?.currentLat} lng={farmer?.current_lng || farmer?.currentLng} />

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="farmer-welcome">

          <div>

            <span className="page-eyebrow">

              {
                t(
                  "home.farmerPortal"
                )
              }

            </span>


            <h1>

              {
                t(
                  "home.greeting"
                )
              }

              {" "}

              {
                firstName
              }.

            </h1>


            <p>

              {
                activeBooking
                  ? getText(
                      language,
                      "Here is your latest procurement update.",
                      "यह आपकी नवीनतम खरीद जानकारी है।",
                      "ఇది మీ తాజా కొనుగోలు అప్‌డేట్."
                    )
                  : getText(
                      language,
                      "Manage your bookings, payments and procurement from one place.",
                      "अपनी बुकिंग, भुगतान और खरीद को एक ही जगह से प्रबंधित करें।",
                      "మీ బుకింగ్‌లు, చెల్లింపులు మరియు కొనుగోలును ఒకే చోట నిర్వహించండి."
                    )
              }

            </p>

          </div>


          <div className="farmer-profile">

            <div className="farmer-avatar">

              {
                initials
              }

            </div>


            <div>

              <strong>

                {
                  farmerName
                }

              </strong>


              <span>

                {
                  t(
                    "home.registeredFarmer"
                  )
                }

              </span>

            </div>


            <div className="farmer-home-header-actions">

              <Link
                to="/farmer/settings"
                className="farmer-settings-button"
                aria-label="Farmer settings"
                title="Settings"
              >

                <Settings
                  size={19}
                />

              </Link>


              <div className="farmer-notification-wrap">

                <button
                  type="button"
                  className={
                    `farmer-notification-button ${
                      notificationsOpen
                        ? "open"
                        : ""
                    } ${
                      unreadNotificationCount >
                      0
                        ? "has-unread"
                        : ""
                    }`
                  }
                  onClick={() => {

                    setNotificationsOpen(
                      current =>
                        !current
                    );

                    loadNotifications();

                  }}
                  aria-label="Notifications"
                  aria-expanded={
                    notificationsOpen
                  }
                >

                  <Bell
                    size={18}
                  />


                  {
                    unreadNotificationCount >
                      0 && (

                      <span className="farmer-notification-count">

                        {
                          unreadNotificationCount >
                            9
                            ? "9+"
                            : unreadNotificationCount
                        }

                      </span>

                    )
                  }

                </button>


                {
                  notificationsOpen &&
                  createPortal(

                    <div className="farmer-notification-overlay">

                      <div className="farmer-notification-panel">

                        <div className="farmer-notification-header">

                          <div>

                            <span className="page-eyebrow">

                              NOTIFICATIONS

                            </span>


                            <strong>

                              {
                                getText(
                                  language,
                                  "Procurement updates",
                                  "खरीद अपडेट",
                                  "కొనుగోలు అప్‌డేట్‌లు"
                                )
                              }

                            </strong>


                            <button
                              type="button"
                              className="farmer-notification-mark-all"
                              onClick={
                                markAllNotificationsRead
                              }
                              disabled={
                                unreadNotificationCount ===
                                0
                              }
                            >

                              <Check
                                size={14}
                              />


                              {
                                getText(
                                  language,
                                  "Mark all as read",
                                  "सभी को पढ़ा हुआ करें",
                                  "అన్నింటినీ చదివినట్లు గుర్తించండి"
                                )
                              }

                            </button>

                          </div>


                          <button
                            type="button"
                            className="farmer-notification-close"
                            onClick={() =>
                              setNotificationsOpen(
                                false
                              )
                            }
                            aria-label="Close notifications"
                          >

                            <X
                              size={18}
                            />

                          </button>

                        </div>


                        <div className="farmer-notification-list">

                          {

                            
                            notificationsLoading ? (

                              <div className="farmer-notification-empty">

                                <RefreshCw
                                  size={22}
                                  className="loading-spin"
                                />

                                <span>

                                  {
                                    getText(
                                      language,
                                      "Loading notifications...",
                                      "सूचनाएं लोड हो रही हैं...",
                                      "నోటిఫికేషన్‌లను లోడ్ చేస్తోంది..."
                                    )
                                  }

                                </span>

                              </div>

                            ) : notifications.length ===
                              0 ? (

                              <div className="farmer-notification-empty">

                                <Bell
                                  size={24}
                                />

                                <span>

                                  {
                                    getText(
                                      language,
                                      "No notifications yet.",
                                      "अभी कोई सूचना नहीं है।",
                                      "ఇంకా నోటిఫికేషన్‌లు లేవు."
                                    )
                                  }

                                </span>

                              </div>

                            ) : (

                              notifications
                                .slice(
                                  0,
                                  8
                                )
                                .map(
                                  notification => (

                                    <button
                                      type="button"
                                      key={
                                        notification.id
                                      }
                                      className={
                                        `farmer-notification-item ${
                                          notification.read_at
                                            ? "read"
                                            : "unread"
                                        }`
                                      }
                                      onClick={() => {

                                        if (
                                          !notification.read_at
                                        ) {

                                          markNotificationRead(
                                            notification.id
                                          );

                                        }

                                      }}
                                    >

                                      <div className="farmer-notification-dot" />


                                      <div className="farmer-notification-content">

                                        <strong>

                                          {
                                            notification.title
                                          }

                                        </strong>


                                        <span>

                                          {
                                            notification.message
                                          }

                                        </span>


                                        <small
                                          className={
                                            notification.channel ===
                                              "SMS"
                                              ? notification.status ===
                                                "SENT"
                                                ? "sms-sent"
                                                : notification.status ===
                                                  "FAILED"
                                                  ? "sms-failed"
                                                  : "sms-pending"
                                              : ""
                                          }
                                        >

                                          {
                                            formatNotificationDate(
                                              notification.created_at,
                                              language
                                            )
                                          }


                                          {" · "}


                                          {
                                            notification.channel ===
                                            "SMS"
                                              ? (
                                                notification.status ===
                                                "SENT"
                                                  ? getText(
                                                      language,
                                                      "SMS sent",
                                                      "SMS भेजा गया",
                                                      "SMS పంపబడింది"
                                                    )
                                                  : notification.status ===
                                                    "FAILED"
                                                    ? getText(
                                                        language,
                                                        "SMS failed",
                                                        "SMS विफल",
                                                        "SMS విఫలమైంది"
                                                      )
                                                    : getText(
                                                        language,
                                                        "SMS pending",
                                                        "SMS लंबित",
                                                        "SMS పెండింగ్‌లో ఉంది"
                                                      )
                                              )
                                              : getText(
                                                  language,
                                                  "In-app update",
                                                  "ऐप सूचना",
                                                  "యాప్ అప్‌డేట్"
                                                )
                                          }

                                        </small>

                                      </div>

                                    </button>

                                  )
                                )

                            )
                          }

                        </div>

                      </div>

                    </div>,

                    document.body

                  )
                }

              </div>


              <button
                type="button"
                className="farmer-refresh-button"
                onClick={() => {

                  loadBookings(
                    true
                  );

                  loadNotifications();

                  loadCenters();

                }}
                disabled={
                  refreshing
                }
                title="Refresh"
              >

                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "loading-spin"
                      : ""
                  }
                />

              </button>


              <button
                type="button"
                className="farmer-logout-button"
                onClick={
                  handleLogout
                }
                title="Logout"
                aria-label="Logout"
              >

                <LogOut
                  size={19}
                />

              </button>

            </div>

          </div>

        </section>



        {/* =================================================
            MAIN BOOKING
        ================================================= */}

        {
          activeBooking ? (

            <section
              className={
                `next-booking-card ${
                  activeBooking.status ===
                  "PAYMENT_SENT"
                    ? "payment-complete"
                    : ""
                }`
              }
            >

              <div className="booking-card-top">

                <div>

                  <span className="card-eyebrow">

                    {
                      activeBooking.status ===
                      "PAYMENT_SENT"
                        ? getText(
                            language,
                            "LATEST PROCUREMENT",
                            "नवीनतम खरीद",
                            "తాజా కొనుగోలు"
                          )
                        : getText(
                            language,
                            "NEXT PROCUREMENT",
                            "अगली खरीद",
                            "తదుపరి కొనుగోలు"
                          )
                    }

                  </span>


                  <div className="booking-token-row">

                    <div className="home-token">

                      #
                      {
                        activeBooking.token ||
                        activeBooking.id
                      }

                    </div>


                    <StatusBadge
                      status={
                        activeBooking.status
                      }
                    />

                  </div>

                </div>


                <div className="booking-confirmed-icon">

                  {
                    activeBooking.status ===
                      "PAYMENT_SENT"
                      ? (
                        <CheckCircle2
                          size={24}
                        />
                      )
                      : (
                        <CalendarClock
                          size={24}
                        />
                      )
                  }

                </div>

              </div>


              <div className="booking-status-message">

                <div className="status-message-icon">

                  <CheckCircle2
                    size={19}
                  />

                </div>


                <div>

                  <strong>

                    {
                      activeBooking.status ===
                      "PAYMENT_SENT"
                        ? getText(
                            language,
                            "Procurement completed",
                            "खरीद पूरी हो गई",
                            "కొనుగోలు పూర్తైంది"
                          )
                        : formatStatus(
                            activeBooking.status
                          )
                    }

                  </strong>


                  <span>

                    {
                      getStatusMessage(
                        activeBooking.status,
                        language
                      )
                    }

                  </span>

                </div>

              </div>


              <div className="booking-main-details">

                <div className="home-detail">

                  <div className="home-detail-icon">

                    <Clock3
                      size={18}
                    />

                  </div>


                  <div>

                    <span>

                      {
                        getText(
                          language,
                          "Arrival window",
                          "आने का समय",
                          "రాక సమయం"
                        )
                      }

                    </span>


                    <strong>

                      {
                        formatDate(
                          activeBooking.date,
                          language
                        )
                      }

                    </strong>


                    <small>

                      {
                        formatTime(
                          activeBooking.slot_start,
                          activeBooking.slot_end
                        )
                      }

                    </small>

                  </div>

                </div>


                <div className="home-detail">

                  <div className="home-detail-icon">

                    <MapPin
                      size={18}
                    />

                  </div>


                  <div>

                    <span>

                      {
                        getText(
                          language,
                          "Procurement center",
                          "खरीद केंद्र",
                          "కొనుగోలు కేంద్రం"
                        )
                      }

                    </span>


                    <strong>

                      {
                        center.name
                      }

                    </strong>


                    <small>

                      {
                        getCropName(
                          activeBooking.crop,
                          language,
                          t
                        )
                      }


                      {" · "}


                      {
                        Number(
                          activeBooking.actual_quantity ??
                          activeBooking.estimated_quantity ??
                          0
                        ).toLocaleString()
                      }


                      {" kg"}

                    </small>

                  </div>

                </div>

              </div>


              {
                activeBooking.status ===
                "PAYMENT_SENT" && (

                  <div className="home-payment-complete-strip">

                    <div>

                      <span>

                        {
                          getText(
                            language,
                            "PAYMENT SENT",
                            "भुगतान भेजा गया",
                            "చెల్లింపు పంపబడింది"
                          )
                        }

                      </span>


                      <strong>

                        {
                          activeBooking.payment_amount
                            ? `₹${Number(
                                activeBooking.payment_amount
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

                    </div>


                    <div>

                      <span>

                        {
                          getText(
                            language,
                            "REFERENCE",
                            "संदर्भ",
                            "రిఫరెన్స్"
                          )
                        }

                      </span>


                      <strong>

                        {
                          activeBooking.payment_reference ||
                          "—"
                        }

                      </strong>

                    </div>

                  </div>

                )
              }


              <div className="booking-action-row">

                <Link
                  to={
                    `/farmer/token?booking=${encodeURIComponent(
                      activeBooking.id
                    )}`
                  }
                  className="home-primary-action"
                >

                  {
                    activeBooking.status ===
                    "PAYMENT_SENT"
                      ? getText(
                          language,
                          "View completed record",
                          "पूरा रिकॉर्ड देखें",
                          "పూర్తి రికార్డును చూడండి"
                        )
                      : getText(
                          language,
                          "Track procurement",
                          "खरीद ट्रैक करें",
                          "కొనుగోలును ట్రాక్ చేయండి"
                        )
                  }

                  <ArrowRight
                    size={18}
                  />

                </Link>

                <Link
                  to={`/farmer/transport/request?booking=${encodeURIComponent(
                    activeBooking.id
                  )}`}
                  className="home-secondary-action home-transport-action"
                >

                  <Truck
                    size={17}
                  />

                  {
                    getText(
                      language,
                      "Arrange transport",
                      "परिवहन की व्यवस्था करें",
                      "రవాణా ఏర్పాటు చేయండి"
                    )
                  }

                </Link>

                <Link
                  to="/farmer/book"
                  className="home-secondary-action"
                >

                  {
                    getText(
                      language,
                      "Book another slot",
                      "दूसरा स्लॉट बुक करें",
                      "మరో స్లాట్ బుక్ చేయండి"
                    )
                  }

                </Link>

              </div>

            </section>

          ) : (

            <section className="empty-state-card farmer-first-booking-card">

              <div className="empty-state-icon">

                <CalendarClock
                  size={28}
                />

              </div>


              <span className="page-eyebrow">

                {
                  getText(
                    language,
                    "READY TO START?",
                    "शुरू करने के लिए तैयार?",
                    "ప్రారంభించడానికి సిద్ధంగా ఉన్నారా?"
                  )
                }

              </span>


              <h1>

                {
                  getText(
                    language,
                    "Book your next procurement slot",
                    "अपना अगला खरीद स्लॉट बुक करें",
                    "మీ తదుపరి కొనుగోలు స్లాట్ బుక్ చేయండి"
                  )
                }

              </h1>


              <p>

                {
                  getText(
                    language,
                    "Choose your crop, quantity, center and arrival window.",
                    "फसल, मात्रा, केंद्र और आने का समय चुनें।",
                    "పంట, పరిమాణం, కేంద్రం మరియు రాక సమయాన్ని ఎంచుకోండి."
                  )
                }

              </p>


              <Link
                to="/farmer/book"
                className="home-primary-action"
              >

                {
                  getText(
                    language,
                    "Book a procurement slot",
                    "खरीद स्लॉट बुक करें",
                    "కొనుగోలు స్లాట్ బుక్ చేయండి"
                  )
                }


                <ArrowRight
                  size={18}
                />

              </Link>

            </section>

          )
        }



        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="farmer-home-grid">

          <Link
            to="/farmer/book"
            className="home-feature-card booking-feature"
          >

            <div className="feature-card-top">

              <div className="feature-icon">

                <Wheat
                  size={21}
                />

              </div>


              <ArrowRight
                size={18}
              />

            </div>


            <h2>

              {
                getText(
                  language,
                  "Book a procurement slot",
                  "खरीद स्लॉट बुक करें",
                  "కొనుగోలు స్లాట్ బుక్ చేయండి"
                )
              }

            </h2>


            <p>

              {
                getText(
                  language,
                  "Select your crop, quantity and convenient arrival window.",
                  "अपनी फसल, मात्रा और सुविधाजनक समय चुनें।",
                  "మీ పంట, పరిమాణం మరియు అనుకూలమైన రాక సమయాన్ని ఎంచుకోండి."
                )
              }

            </p>

          </Link>


          <Link
            to="/farmer/logistics"
            className="home-feature-card transport-feature"
          >

            <div className="feature-card-top">

              <div className="feature-icon">

                <Truck
                  size={21}
                />

              </div>

              <ArrowRight
                size={18}
              />

            </div>


            <h2>

              {
                getText(
                  language,
                  "Transport & logistics",
                  "परिवहन और लॉजिस्टिक्स",
                  "రవాణా & లాజిస్టిక్స్"
                )
              }

            </h2>


            <p>

              {
                getText(
                  language,
                  "Find a suitable vehicle, arrange pickup and follow your crop journey to the center.",
                  "उपयुक्त वाहन खोजें, पिकअप की व्यवस्था करें और अपनी फसल की केंद्र तक यात्रा देखें।",
                  "తగిన వాహనం కనుగొని, పికప్ ఏర్పాటు చేసి, మీ పంట కేంద్రానికి చేరే వరకు ప్రయాణాన్ని చూడండి."
                )
              }

            </p>

          </Link>


          <Link
            to="/farmer/history"
            className="home-feature-card status-feature"
          >

            <div className="feature-card-top">

              <div className="feature-icon">

                <CalendarDays
                  size={21}
                />

              </div>


              <ArrowRight
                size={18}
              />

            </div>


            <h2>

              {
                getText(
                  language,
                  "Procurement history",
                  "खरीद इतिहास",
                  "కొనుగోలు చరిత్ర"
                )
              }

            </h2>


            <p>

              {
                getText(
                  language,
                  "See your previous crops, quantities and procurement records.",
                  "अपनी पिछली फसलें, मात्रा और खरीद रिकॉर्ड देखें।",
                  "మీ గత పంటలు, పరిమాణాలు మరియు కొనుగోలు రికార్డులను చూడండి."
                )
              }

            </p>

          </Link>


          <Link
            to="/farmer/payments"
            className="home-feature-card help-feature"
          >

            <div className="feature-card-top">

              <div className="feature-icon">

                <Coins
                  size={21}
                />

              </div>


              <ArrowRight
                size={18}
              />

            </div>


            <h2>

              {
                getText(
                  language,
                  "Payment history",
                  "भुगतान इतिहास",
                  "చెల్లింపు చరిత్ర"
                )
              }

            </h2>


            <p>

              {
                getText(
                  language,
                  "View payment amounts, references and completed payments.",
                  "भुगतान राशि, संदर्भ और पूरे हुए भुगतान देखें।",
                  "చెల్లింపు మొత్తాలు, రిఫరెన్స్‌లు మరియు పూర్తైన చెల్లింపులను చూడండి."
                )
              }

            </p>

          </Link>

        </section>



        {/* =================================================
            MONTHLY SUMMARY
        ================================================= */}

        <section className="home-month-summary-card">

          <div className="home-section-heading">

            <div>

              <span className="card-eyebrow">

                {
                  getText(
                    language,
                    "THIS MONTH",
                    "इस महीने",
                    "ఈ నెల"
                  )
                }

              </span>


              <h2>

                {
                  getText(
                    language,
                    "Your procurement summary",
                    "आपकी खरीद का सारांश",
                    "మీ కొనుగోలు సారాంశం"
                  )
                }

              </h2>


              <p>

                {
                  formatCurrentMonth(
                    language
                  )
                }

              </p>

            </div>


            <Coins
              size={21}
            />

          </div>


          <div className="home-month-stats">

            <MonthlyStat
              label={
                getText(
                  language,
                  "Received",
                  "प्राप्त राशि",
                  "అందుకున్న మొత్తం"
                )
              }
              value={
                `₹${monthSummary.earned.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}`
              }
              tone="green"
            />


            <MonthlyStat
              label={
                getText(
                  language,
                  "Produce supplied",
                  "दी गई उपज",
                  "సరఫరా చేసిన పంట"
                )
              }
              value={
                `${monthSummary.quantity.toLocaleString()} kg`
              }
              tone="blue"
            />


            <MonthlyStat
              label={
                getText(
                  language,
                  "Completed",
                  "पूरी हुई खरीद",
                  "పూర్తైన కొనుగోళ్లు"
                )
              }
              value={
                monthSummary.completed
              }
              tone="orange"
            />

          </div>


          <div className="home-crop-summary-list">

            {
              monthSummary.crops.length ===
                0 ? (

                <div className="home-summary-empty">

                  <Wheat
                    size={19}
                  />


                  <span>

                    {
                      getText(
                        language,
                        "Your completed crop activity will appear here.",
                        "पूरी हुई फसल गतिविधि यहां दिखाई देगी।",
                        "మీ పూర్తైన పంట కార్యకలాపాలు ఇక్కడ కనిపిస్తాయి."
                      )
                    }

                  </span>

                </div>

              ) : (

                monthSummary.crops.map(
                  item => (

                    <div
                      key={
                        item.crop
                      }
                      className="home-crop-summary-row"
                    >

                      <div className="home-crop-summary-icon">

                        <Wheat
                          size={16}
                        />

                      </div>


                      <div>

                        <strong>

                          {
                            getCropName(
                              item.crop,
                              language,
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
                              "procurements",
                              "खरीद",
                              "కొనుగోళ్లు"
                            )
                          }

                        </span>

                      </div>


                      <div>

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

                    </div>

                  )
                )

              )
            }

          </div>


          <Link
            to="/farmer/history"
            className="home-inline-link"
          >

            {
              getText(
                language,
                "View full procurement history",
                "पूरी खरीद हिस्ट्री देखें",
                "పూర్తి కొనుగోలు చరిత్రను చూడండి"
              )
            }


            <ArrowRight
              size={14}
            />

          </Link>

        </section>



        {/* =================================================
            UPCOMING BOOKINGS
        ================================================= */}

        <section className="home-dashboard-section">

          <div className="home-section-heading">

            <div>

              <span className="card-eyebrow">

                {
                  getText(
                    language,
                    "UPCOMING",
                    "आगामी",
                    "రాబోయేవి"
                  )
                }

              </span>


              <h2>

                {
                  getText(
                    language,
                    "Upcoming procurements",
                    "आने वाली खरीद",
                    "రాబోయే కొనుగోళ్లు"
                  )
                }

              </h2>

            </div>


            <Link
              to="/farmer/book"
              className="home-inline-link"
            >

              {
                getText(
                  language,
                  "Book more",
                  "और बुक करें",
                  "మరిన్ని బుక్ చేయండి"
                )
              }


              <ArrowRight
                size={14}
              />

            </Link>

          </div>


          {
            upcomingBookings.length ===
              0 ? (

              <div className="home-summary-empty large">

                <CalendarDays
                  size={22}
                />


                <strong>

                  {
                    getText(
                      language,
                      "No other upcoming bookings",
                      "कोई अन्य आगामी बुकिंग नहीं",
                      "ఇతర రాబోయే బుకింగ్‌లు లేవు"
                    )
                  }

                </strong>


                <span>

                  {
                    getText(
                      language,
                      "Book another slot whenever you need to bring produce to the center.",
                      "जब भी जरूरत हो, केंद्र पर उपज लाने के लिए दूसरा स्लॉट बुक करें।",
                      "కేంద్రానికి పంట తీసుకురావాల్సినప్పుడు మరొక స్లాట్ బుక్ చేయండి."
                    )
                  }

                </span>

              </div>

            ) : (

              <div className="home-upcoming-list">

                {
                  upcomingBookings.map(
                    item => (

                      <Link
                        key={
                          item.id
                        }
                        to={
                          `/farmer/token?booking=${encodeURIComponent(
                            item.id
                          )}`
                        }
                        className="home-upcoming-row"
                      >

                        <div className="home-upcoming-token">

                          #
                          {
                            item.token ||
                            item.id
                          }

                        </div>


                        <div className="home-upcoming-main">

                          <strong>

                            {
                              getCropName(
                                item.crop,
                                language,
                                t
                              )
                            }

                          </strong>


                          <span>

                            {
                              Number(
                                item.estimated_quantity ||
                                0
                              ).toLocaleString()
                            }

                            {" kg · "}


                            {
                              formatDate(
                                item.date,
                                language
                              )
                            }

                          </span>

                        </div>


                        <div className="home-upcoming-time">

                          {
                            formatTime(
                              item.slot_start,
                              item.slot_end
                            )
                          }

                        </div>


                        <ChevronRight
                          size={15}
                        />

                      </Link>

                    )
                  )
                }

              </div>

            )
          }

        </section>



        {/* =================================================
            RECENT PAYMENTS
        ================================================= */}

        <section className="home-dashboard-section">

          <div className="home-section-heading">

            <div>

              <span className="card-eyebrow">

                {
                  getText(
                    language,
                    "PAYMENTS",
                    "भुगतान",
                    "చెల్లింపులు"
                  )
                }

              </span>


              <h2>

                {
                  getText(
                    language,
                    "Recent payments",
                    "हाल के भुगतान",
                    "ఇటీవలి చెల్లింపులు"
                  )
                }

              </h2>

            </div>

          </div>


          {
            recentPayments.length ===
              0 ? (

              <div className="home-summary-empty">

                <Coins
                  size={20}
                />


                <span>

                  {
                    getText(
                      language,
                      "Your completed payments will appear here.",
                      "आपके पूरे हुए भुगतान यहां दिखाई देंगे।",
                      "మీ పూర్తైన చెల్లింపులు ఇక్కడ కనిపిస్తాయి."
                    )
                  }

                </span>

              </div>

            ) : (

              <div className="home-payment-list">

                {
                  recentPayments.map(
                    item => (

                      <Link
                        key={
                          item.id
                        }
                        to="/farmer/payments"
                        className="home-payment-row"
                      >

                        <div className="home-payment-icon">

                          <Check
                            size={15}
                          />

                        </div>


                        <div className="home-payment-main">

                          <strong>

                            {
                              getCropName(
                                item.crop,
                                language,
                                t
                              )
                            }

                          </strong>


                          <span>

                            #
                            {
                              item.token ||
                              item.id
                            }

                            {" · "}

                            {
                              formatDate(
                                item.date,
                                language
                              )
                            }

                          </span>

                        </div>


                        <div className="home-payment-amount">

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
                              getText(
                                language,
                                "Payment sent",
                                "भुगतान भेजा गया",
                                "చెల్లింపు పంపబడింది"
                              )
                            }

                          </span>

                        </div>


                        <ChevronRight
                          size={15}
                        />

                      </Link>

                    )
                  )
                }

              </div>

            )
          }


          <Link
            to="/farmer/payments"
            className="home-inline-link"
          >

            {
              getText(
                language,
                "View all payments",
                "सभी भुगतान देखें",
                "అన్ని చెల్లింపులను చూడండి"
              )
            }


            <ArrowRight
              size={14}
            />

          </Link>

        </section>



        {/* =================================================
            CENTER
        ================================================= */}

        <section className="home-center-card">

          <div className="home-center-main">

            <div className="home-center-icon">

              <MapPin
                size={22}
              />

            </div>


            <div>

              <span className="card-eyebrow">

                {
                  getText(
                    language,
                    "YOUR PROCUREMENT CENTER",
                    "आपका खरीद केंद्र",
                    "మీ కొనుగోలు కేంద్రం"
                  )
                }

              </span>


              <h2>

                {
                  center.name
                }

              </h2>


              <p>

                {
                  center.address
                }

              </p>

            </div>

          </div>


          <div className="home-center-details">

            <div>

              <span>

                {
                  getText(
                    language,
                    "Working hours",
                    "कार्य समय",
                    "పని సమయం"
                  )
                }

              </span>


              <strong>

                {
                  center.openingTime
                }

                {" – "}

                {
                  center.closingTime
                }

              </strong>

            </div>


            <div>

              <span>

                {
                  getText(
                    language,
                    "Capacity",
                    "क्षमता",
                    "సామర్థ్యం"
                  )
                }

              </span>


              <strong>

                {
                  center.capacity ||
                  "—"
                }

                {" / slot"}

              </strong>

            </div>


            <div>

              <span>

                {
                  getText(
                    language,
                    "Working days",
                    "कार्य दिवस",
                    "పని రోజులు"
                  )
                }

              </span>


              <strong>

                {
                  center.workingDays
                }

              </strong>

            </div>

          </div>


          <div className="home-center-actions">

            <a
              href={
                center.mapUrl ||
                "#"
              }
              className="home-secondary-action"
              onClick={
                event => {

                  if (
                    !center.mapUrl
                  ) {

                    event.preventDefault();

                  }

                }
              }
            >

              <MapPin
                size={15}
              />


              {
                getText(
                  language,
                  "Directions",
                  "दिशाएं",
                  "దిశలు"
                )
              }

            </a>


            <a
              href={
                center.phone
                  ? `tel:${center.phone}`
                  : "#"
              }
              className="home-primary-action"
              onClick={
                event => {

                  if (
                    !center.phone
                  ) {

                    event.preventDefault();

                  }

                }
              }
            >

              {
                getText(
                  language,
                  "Call center",
                  "केंद्र को कॉल करें",
                  "కేంద్రానికి కాల్ చేయండి"
                )
              }

            </a>

          </div>

        </section>



        {/* =================================================
            CHECKLIST
        ================================================= */}

        <section className="home-arrival-check-card">

          <div className="home-section-heading">

            <div>

              <span className="card-eyebrow">

                {
                  getText(
                    language,
                    "BEFORE YOU ARRIVE",
                    "पहुंचने से पहले",
                    "మీరు చేరుకునే ముందు"
                  )
                }

              </span>


              <h2>

                {
                  getText(
                    language,
                    "Keep these things ready",
                    "इन चीजों को तैयार रखें",
                    "ఈ విషయాలను సిద్ధంగా ఉంచుకోండి"
                  )
                }

              </h2>

            </div>


            <ShieldCheck
              size={21}
            />

          </div>


          <div className="home-arrival-check-grid">

            <ArrivalCheck
              text={
                getText(
                  language,
                  "Booking token",
                  "बुकिंग टोकन",
                  "బుకింగ్ టోకెన్"
                )
              }
            />


            <ArrivalCheck
              text={
                getText(
                  language,
                  "Your produce",
                  "आपकी उपज",
                  "మీ పంట"
                )
              }
            />


            <ArrivalCheck
              text={
                getText(
                  language,
                  "Registered mobile",
                  "पंजीकृत मोबाइल",
                  "రిజిస్టర్డ్ మొబైల్"
                )
              }
            />


            <ArrivalCheck
              text={
                getText(
                  language,
                  "Assigned time window",
                  "निर्धारित समय",
                  "కేటాయించిన సమయం"
                )
              }
            />

          </div>

        </section>



        {/* =================================================
            SMS
        ================================================= */}

        <section className="home-sms-card">

          <div className="home-sms-icon">

            <MessageSquareText
              size={23}
            />

          </div>


          <div>

            <span>

              {
                getText(
                  language,
                  "STATUS NOTIFICATIONS",
                  "स्थिति सूचनाएं",
                  "స్థితి నోటిఫికేషన్‌లు"
                )
              }

            </span>


            <h3>

              {
                activeBooking?.status ===
                  "PAYMENT_SENT"
                  ? getText(
                      language,
                      "Your payment confirmation is available.",
                      "आपके भुगतान की पुष्टि उपलब्ध है।",
                      "మీ చెల్లింపు నిర్ధారణ అందుబాటులో ఉంది."
                    )
                  : getText(
                      language,
                      "Stay informed about your procurement progress.",
                      "अपनी खरीद की प्रगति के बारे में अपडेट रहें।",
                      "మీ కొనుగోలు పురోగతిని గురించి తెలుసుకోండి."
                    )
              }

            </h3>


            <p>

              {
                getText(
                  language,
                  "Booking, procurement and payment updates can be sent to your registered mobile number.",
                  "बुकिंग, खरीद और भुगतान अपडेट आपके पंजीकृत मोबाइल नंबर पर भेजे जा सकते हैं।",
                  "బుకింగ్, కొనుగోలు మరియు చెల్లింపు అప్‌డేట్‌లు మీ రిజిస్టర్డ్ మొబైల్ నంబర్‌కు పంపవచ్చు."
                )
              }

            </p>

          </div>

        </section>



        {/* =================================================
            RECENT BOOKINGS
        ================================================= */}

        <section className="home-dashboard-section">

          <div className="home-section-heading">

            <div>

              <span className="card-eyebrow">

                {
                  getText(
                    language,
                    "RECENT ACTIVITY",
                    "हाल की गतिविधि",
                    "ఇటీవలి కార్యకలాపాలు"
                  )
                }

              </span>


              <h2>

                {
                  getText(
                    language,
                    "Recent bookings",
                    "हाल की बुकिंग",
                    "ఇటీవలి బుకింగ్‌లు"
                  )
                }

              </h2>

            </div>


            <Link
              to="/farmer/history"
              className="home-inline-link"
            >

              {
                getText(
                  language,
                  "View all",
                  "सभी देखें",
                  "అన్నీ చూడండి"
                )
              }


              <ArrowRight
                size={14}
              />

            </Link>

          </div>


          <div className="home-recent-list">

            {
              recentBookings.length ===
                0 ? (

                <div className="home-summary-empty">

                  <CalendarDays
                    size={20}
                  />


                  <span>

                    {
                      getText(
                        language,
                        "Your bookings will appear here.",
                        "आपकी बुकिंग यहां दिखाई देगी।",
                        "మీ బుకింగ్‌లు ఇక్కడ కనిపిస్తాయి."
                      )
                    }

                  </span>

                </div>

              ) : (

                recentBookings.map(
                  booking => (

                    <Link
                      key={
                        booking.id
                      }
                      to={
                        `/farmer/token?booking=${encodeURIComponent(
                          booking.id
                        )}`
                      }
                      className="home-recent-row"
                    >

                      <div className="home-recent-token">

                        #
                        {
                          booking.token ||
                          booking.id
                        }

                      </div>


                      <div className="home-recent-main">

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

                          {
                            Number(
                              booking.actual_quantity ??
                              booking.estimated_quantity ??
                              0
                            ).toLocaleString()
                          }

                          {" kg · "}


                          {
                            formatDate(
                              booking.date,
                              language
                            )
                          }

                        </span>

                      </div>


                      <StatusBadge
                        status={
                          booking.status
                        }
                      />


                      <ChevronRight
                        size={15}
                      />

                    </Link>

                  )
                )

              )
            }

          </div>

        </section>



        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="home-support-row">

          <span>

            {
              getText(
                language,
                "Live data from KrishiSetu",
                "KrishiSetu का लाइव डेटा",
                "KrishiSetu లైవ్ డేటా"
              )
            }

          </span>


          <div>

            <Link
              to="/farmer/history"
            >

              {
                getText(
                  language,
                  "History",
                  "इतिहास",
                  "చరిత్ర"
                )
              }

            </Link>


            <Link
              to="/farmer/payments"
            >

              {
                getText(
                  language,
                  "Payments",
                  "भुगतान",
                  "చెల్లింపులు"
                )
              }

            </Link>


            <Link
              to="/farmer/help"
            >

              {
                getText(
                  language,
                  "Help & FAQ",
                  "सहायता और FAQ",
                  "సహాయం & FAQ"
                )
              }


              <ArrowRight
                size={15}
              />

            </Link>

          </div>

        </div>

      </main>

    </div>

  );

}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function MonthlyStat({
  label,
  value,
  tone,
}) {

  return (

    <div
      className={
        `home-month-stat ${tone}`
      }
    >

      <span>

        {
          label
        }

      </span>


      <strong>

        {
          value
        }

      </strong>

    </div>

  );

}


function ArrivalCheck({
  text,
}) {

  return (

    <div className="home-arrival-check">

      <div>

        <Check
          size={13}
        />

      </div>


      <span>

        {
          text
        }

      </span>

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


function formatStatus(
  status
) {

  return String(
    status ||
    "CONFIRMED"
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );

}


function getStatusMessage(
  status,
  language
) {

  const messages = {

    CONFIRMED:
      getText(
        language,
        "Your booking is confirmed. Please arrive during your assigned window.",
        "आपकी बुकिंग की पुष्टि हो गई है। निर्धारित समय पर पहुंचें।",
        "మీ బుకింగ్ నిర్ధారించబడింది. కేటాయించిన సమయంలో రండి."
      ),

    ARRIVED:
      getText(
        language,
        "Your arrival has been recorded at the procurement center.",
        "केंद्र पर आपके पहुंचने की जानकारी दर्ज कर ली गई है।",
        "కేంద్రంలో మీ రాక నమోదు చేయబడింది."
      ),

    LATE:
      getText(
        language,
        "Your booking has been marked late. Please contact the center if needed.",
        "आपकी बुकिंग को देर से आने के रूप में दर्ज किया गया है।",
        "మీ బుకింగ్ ఆలస్యంగా వచ్చినట్లు నమోదు చేయబడింది."
      ),

    WEIGHING:
      getText(
        language,
        "Your produce is currently being weighed.",
        "आपकी उपज का अभी वजन किया जा रहा है।",
        "మీ పంట ప్రస్తుతం తూకం వేయబడుతోంది."
      ),

    PROCURED:
      getText(
        language,
        "Your produce has been accepted and procurement is complete.",
        "आपकी उपज स्वीकार कर ली गई है और खरीद पूरी हो गई है।",
        "మీ పంట స్వీకరించబడింది మరియు కొనుగోలు పూర్తైంది."
      ),

    PAYMENT_PENDING:
      getText(
        language,
        "Your procurement is complete and payment is being processed.",
        "आपकी खरीद पूरी हो गई है और भुगतान प्रक्रिया में है।",
        "మీ కొనుగోలు పూర్తైంది మరియు చెల్లింపు ప్రాసెస్ అవుతోంది."
      ),

    PAYMENT_SENT:
      getText(
        language,
        "Your procurement is complete and payment has been sent successfully.",
        "आपकी खरीद पूरी हो गई है और भुगतान सफलतापूर्वक भेज दिया गया है।",
        "మీ కొనుగోలు పూర్తైంది మరియు చెల్లింపు విజయవంతంగా పంపబడింది."
      ),

  };


  return (
    messages[
      status
    ] ||
    messages.CONFIRMED
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

    const raw =
      String(
        value
      )
        .trim()
        .toUpperCase();


    const match =
      raw.match(
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
      "AM" &&
      hour ===
      12
    ) {

      hour =
        0;

    }


    if (
      period ===
      "PM" &&
      hour !==
      12
    ) {

      hour +=
        12;

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


function formatNotificationDate(
  value,
  language
) {

  if (
    !value
  ) {

    return "—";

  }


  const raw =
    String(
      value
    );


  const normalized =
    raw.includes("T")
      ? raw
      : raw.replace(
          " ",
          "T"
        ) +
        "Z";


  const date =
    new Date(
      normalized
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


function normalizeFarmer(
  farmer
) {

  if (
    !farmer
  ) {

    return null;

  }


  return {

    ...farmer,

    id:
      String(
        farmer.id ||
        ""
      ),

    name:
      farmer.name ||
      "",

    phone:
      normalisePhone(
        farmer.phone
      ),

    stateId:
      farmer.state_id ??
      farmer.stateId ??
      null,

    districtId:
      farmer.district_id ??
      farmer.districtId ??
      null,

    mandalId:
      farmer.mandal_id ??
      farmer.mandalId ??
      null,

    village:
      farmer.village ||
      "",

    language:
      farmer.language ||
      "en",

    preferredCenterId:
      farmer.preferred_center_id ??
      farmer.preferredCenterId ??
      null,

    primaryCrop:
      farmer.primary_crop ??
      farmer.primaryCrop ??
      null,

    estimatedQuantity:
      Number(
        farmer.estimated_quantity ??
        farmer.estimatedQuantity ??
        0
      ),

  };

}


function normalisePhone(
  value
) {

  return String(
    value ||
    ""
  ).replace(
    /\D/g,
    ""
  );

}


export default FarmerHome;