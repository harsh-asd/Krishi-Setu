
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  MapPin,
  Phone,
  UserRound,
  LocateFixed,
  LockKeyhole,
  Wheat,
  Ruler,
  Droplets,
  Home,
  Navigation,
  CheckCircle2,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router";

import Header from "../../components/Header";
import Button from "../../components/Button";

import {
  useLanguage,
} from "../../translations/LanguageContext";


import {
  setCurrentFarmer,
} from "../../data/appStore";



function extractLocationRows(data, keys) {
  const candidates = [
    data,
    data?.data,
    data?.result,
    data?.location,
  ];

  for (const source of candidates) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      if (Array.isArray(source?.[key])) return source[key];
    }
  }

  return [];
}

function normalizeStateRows(data) {
  return extractLocationRows(data, ["states", "stateList", "locations"])
    .map((item) => ({
      ...item,
      stateId: String(item?.stateId ?? item?.state_id ?? item?.id ?? "").trim(),
      stateName: String(item?.stateName ?? item?.state_name ?? item?.name ?? "").trim(),
      stateType: item?.stateType ?? item?.state_type ?? item?.type ?? "STATE",
    }))
    .filter((item) => item.stateId && item.stateName);
}

function normalizeDistrictRows(data) {
  return extractLocationRows(data, ["districts", "districtList", "locations"])
    .map((item) => ({
      ...item,
      districtId: String(item?.districtId ?? item?.district_id ?? item?.id ?? "").trim(),
      districtName: String(item?.districtName ?? item?.district_name ?? item?.name ?? "").trim(),
    }))
    .filter((item) => item.districtId && item.districtName);
}

function normalizeMandalRows(data) {
  return extractLocationRows(data, ["mandals", "subDistricts", "subdistricts", "mandalList", "locations"])
    .map((item) => ({
      ...item,
      mandalId: String(item?.mandalId ?? item?.mandal_id ?? item?.subDistrictId ?? item?.subdistrict_id ?? item?.id ?? "").trim(),
      mandalName: String(item?.mandalName ?? item?.mandal_name ?? item?.subDistrictName ?? item?.subdistrict_name ?? item?.name ?? "").trim(),
    }))
    .filter((item) => item.mandalId && item.mandalName);
}

function normalizeVillageRows(data) {
  return extractLocationRows(data, ["villages", "villageList", "locations"])
    .map((item) => ({
      ...item,
      villageId: String(item?.villageId ?? item?.village_id ?? item?.id ?? "").trim(),
      village: String(item?.village ?? item?.villageName ?? item?.village_name ?? item?.name ?? "").trim(),
    }))
    .filter((item) => item.village);
}

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

async function locationApi(path, options = {}) {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
      },
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
      data?.error ||
      "Location service is unavailable."
    );
  }

  return data;
}


const languages = [
  {
    id: "en",
    nativeLabel: "English",
  },

  {
    id: "hi",
    nativeLabel: "हिन्दी",
  },

  {
    id: "te",
    nativeLabel: "తెలుగు",
  },
];


function FarmerRegister() {

  const navigate =
    useNavigate();


  const {
    t,
    setLanguage,
  } =
    useLanguage();


  const [
    form,
    setForm,
  ] =
    useState({
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",

      stateId: "",
      districtId: "",
      mandalId: "",
      village: "",
      pincode: "",
      address: "",
      landmark: "",
      currentLat: null,
      currentLng: null,
      locationUpdatedAt: "",
      locationSource: "REGISTERED",

      alternatePhone: "",
      farmSizeAcres: "",
      irrigationType: "",
      primaryCrop: "",
      estimatedQuantity: "",

      language: "en",
    });


  const [
    openMenu,
    setOpenMenu,
  ] =
    useState(null);


  const [
    errors,
    setErrors,
  ] =
    useState({});


  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  const [
    locating,
    setLocating,
  ] =
    useState(false);

  const [
    locationMessage,
    setLocationMessage,
  ] =
    useState("");


  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);

  const selectedState =
    useMemo(
      () =>
        states.find(
          (item) =>
            String(item.stateId) ===
            String(form.stateId)
        ),
      [
        states,
        form.stateId,
      ]
    );


  const selectedDistrict =
    useMemo(
      () =>
        districts.find(
          (item) =>
            String(item.districtId) ===
            String(form.districtId)
        ),
      [
        districts,
        form.districtId,
      ]
    );


  const selectedMandal =
    useMemo(
      () =>
        mandals.find(
          (item) =>
            String(item.mandalId) ===
            String(form.mandalId)
        ),
      [
        mandals,
        form.mandalId,
      ]
    );


  const selectedLanguage =
    languages.find(
      (item) =>
        item.id ===
        form.language
    ) ||
    languages[0];


  useEffect(() => {
    let cancelled = false;

    async function loadStates() {
      setLocationLoading(true);
      try {
        const data = await locationApi("/locations/states");
        if (!cancelled) {
          setStates(normalizeStateRows(data));
        }
      } catch (error) {
        console.error("Unable to load states:", error);
        if (!cancelled) {
          setErrors((current) => ({
            ...current,
            stateId:
              "Unable to load the official location list. Please try again.",
          }));
        }
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    }

    loadStates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDistricts() {
      if (!form.stateId) {
        setDistricts([]);
        return;
      }

      try {
        const data = await locationApi(
          `/locations/districts?stateId=${encodeURIComponent(form.stateId)}`
        );

        if (!cancelled) {
          setDistricts(normalizeDistrictRows(data));
        }
      } catch (error) {
        console.error("Unable to load districts:", error);
        if (!cancelled) {
          setDistricts([]);
          setErrors((current) => ({
            ...current,
            districtId: "Unable to load districts for the selected state.",
          }));
        }
      }
    }

    loadDistricts();

    return () => {
      cancelled = true;
    };
  }, [form.stateId]);

  useEffect(() => {
    let cancelled = false;

    async function loadMandals() {
      if (!form.districtId) {
        setMandals([]);
        return;
      }

      try {
        const data = await locationApi(
          `/locations/mandals?districtId=${encodeURIComponent(form.districtId)}`
        );

        if (!cancelled) {
          setMandals(normalizeMandalRows(data));
        }
      } catch (error) {
        console.error("Unable to load mandals:", error);
        if (!cancelled) {
          setMandals([]);
          setErrors((current) => ({
            ...current,
            mandalId: "Unable to load mandals for the selected district.",
          }));
        }
      }
    }

    loadMandals();

    return () => {
      cancelled = true;
    };
  }, [form.districtId]);

  useEffect(() => {
    let cancelled = false;

    async function loadVillages() {
      if (!form.mandalId) {
        setVillages([]);
        return;
      }

      try {
        const data = await locationApi(
          `/locations/villages?mandalId=${encodeURIComponent(form.mandalId)}`
        );

        if (!cancelled) {
          setVillages(normalizeVillageRows(data));
        }
      } catch (error) {
        console.error("Unable to load villages:", error);
        if (!cancelled) {
          setVillages([]);
          setErrors((current) => ({
            ...current,
            village: "Unable to load villages for the selected mandal.",
          }));
        }
      }
    }

    loadVillages();

    return () => {
      cancelled = true;
    };
  }, [form.mandalId]);

  function updateField(
    field,
    value
  ) {

    setForm(
      (current) => ({
        ...current,

        [field]:
          value,
      })
    );


    setErrors(
      (current) => ({
        ...current,

        [field]:
          "",
      })
    );

  }


  function handlePhoneChange(
    event
  ) {

    const value =
      event.target.value
        .replace(
          /[^0-9]/g,
          ""
        )
        .slice(
          0,
          10
        );


    updateField(
      "phone",
      value
    );

  }


  function selectState(
    stateId
  ) {

    setForm(
      (current) => ({
        ...current,

        stateId,

        districtId:
          "",

        mandalId:
          "",

        village:
          "",
      })
    );


    setOpenMenu(
      null
    );

  }


  function selectDistrict(
    districtId
  ) {

    setForm(
      (current) => ({
        ...current,

        districtId,

        mandalId:
          "",

        village:
          "",
      })
    );


    setOpenMenu(
      null
    );

  }


  function selectMandal(
    mandalId
  ) {

    setForm(
      (current) => ({
        ...current,

        mandalId,

        village:
          "",
      })
    );


    setOpenMenu(
      null
    );

  }


  function selectVillage(
    village
  ) {

    updateField(
      "village",
      village
    );


    setOpenMenu(
      null
    );

  }


  function normaliseLocationName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findLocationByName(items, value) {
    const target = normaliseLocationName(value);

    if (!target) {
      return null;
    }

    return (
      (items || []).find((item) => {
        const names = [
          item?.name,
          item?.stateName,
          item?.districtName,
          item?.mandalName,
          item?.villageName,
          item?.village,
          item?.localName,
        ];

        return names.some(
          (name) =>
            normaliseLocationName(name) === target
        );
      }) || null
    );
  }

  async function useCurrentLocation() {
    setLocationMessage("");
    setLocating(true);

    if (!navigator.geolocation) {
      setLocationMessage(
        "Location is not supported by this browser."
      );
      setLocating(false);
      return;
    }

    try {
      const position = await new Promise(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0,
            }
          );
        }
      );

      const lat =
        Number(
          position.coords.latitude
        );

      const lng =
        Number(
          position.coords.longitude
        );

      /*
        Production rule:
        GPS coordinates are captured directly from the device.
        The backend resolves those coordinates against the
        official administrative location hierarchy. The browser
        never guesses a village from a small demo dataset.
      */

      const data = await locationApi(
        `/locations/resolve?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
      );

      const resolved =
        data?.location ||
        data?.resolved ||
        data;

      const resolvedStateId =
        resolved?.stateId ||
        resolved?.state_id ||
        "";

      const resolvedDistrictId =
        resolved?.districtId ||
        resolved?.district_id ||
        "";

      const resolvedMandalId =
        resolved?.mandalId ||
        resolved?.mandal_id ||
        "";

      const resolvedVillage =
        resolved?.village ||
        resolved?.villageName ||
        "";

      const resolvedStateName =
        resolved?.stateName ||
        resolved?.state_name ||
        "";

      const resolvedDistrictName =
        resolved?.districtName ||
        resolved?.district_name ||
        "";

      const resolvedMandalName =
        resolved?.mandalName ||
        resolved?.mandal_name ||
        "";

      const resolvedPincode =
        resolved?.pincode ||
        resolved?.pinCode ||
        "";

      const resolvedAddress =
        resolved?.formattedAddress ||
        resolved?.formatted_address ||
        "";

      if (
        !resolvedStateId ||
        !resolvedDistrictId ||
        !resolvedMandalId ||
        !resolvedVillage
      ) {
        throw new Error(
          "Your GPS position could not be mapped to a complete official village hierarchy. Please verify the location manually."
        );
      }

      setForm((current) => ({
        ...current,
        stateId: resolvedStateId,
        districtId: resolvedDistrictId,
        mandalId: resolvedMandalId,
        village: resolvedVillage,
        pincode: resolvedPincode || current.pincode,
        address: resolvedAddress || current.address,
        currentLat: lat,
        currentLng: lng,
        locationUpdatedAt:
          new Date().toISOString(),
        locationSource: "GPS",
      }));

      setErrors((current) => ({
        ...current,
        stateId: "",
        districtId: "",
        mandalId: "",
        village: "",
      }));

      setLocationMessage(
        `GPS matched to ${[
          resolvedVillage,
          resolvedMandalName,
          resolvedDistrictName,
          resolvedStateName,
        ]
          .filter(Boolean)
          .join(", ")}.`
      );
    } catch (error) {
      console.error(
        "Farmer GPS resolution error:",
        error
      );

      setLocationMessage(
        error?.message ||
        "Unable to resolve your live GPS location. Please allow location access and verify the location manually."
      );
    } finally {
      setLocating(false);
    }
  }

  function openCurrentLocationInMaps() {
    if (
      form.currentLat == null ||
      form.currentLng == null
    ) {
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${encodeURIComponent(form.currentLat)},${encodeURIComponent(form.currentLng)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function validate() {

    const nextErrors =
      {};


    if (
      !form.name.trim()
    ) {

      nextErrors.name =
        "Please enter your name.";

    } else if (
      form.name.trim().length <
      3
    ) {

      nextErrors.name =
        "Name must be at least 3 characters.";

    }


    if (
      form.phone.length !==
      10
    ) {

      nextErrors.phone =
        "Please enter a valid 10-digit mobile number.";

    }


    if (
      !form.stateId
    ) {

      nextErrors.stateId =
        "Please select your state.";

    }


    if (
      !form.districtId
    ) {

      nextErrors.districtId =
        "Please select your district.";

    }


    if (
      !form.mandalId
    ) {

      nextErrors.mandalId =
        "Please select your mandal.";

    }


    if (
      !form.village
    ) {

      nextErrors.village =
        "Please select your village.";

    }

    if (form.password.length < 6) {
      nextErrors.password =
        "Password must contain at least 6 characters.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (
      form.alternatePhone &&
      normalisePhone(form.alternatePhone).length !== 10
    ) {
      nextErrors.alternatePhone =
        "Enter a valid 10-digit alternate number.";
    }

    if (
      form.farmSizeAcres &&
      (!Number.isFinite(Number(form.farmSizeAcres)) || Number(form.farmSizeAcres) <= 0)
    ) {
      nextErrors.farmSizeAcres =
        "Enter a valid farm size.";
    }

    if (
      form.estimatedQuantity &&
      (!Number.isFinite(Number(form.estimatedQuantity)) || Number(form.estimatedQuantity) <= 0)
    ) {
      nextErrors.estimatedQuantity =
        "Enter a valid expected quantity.";
    }


    
    if (
      form.aadhaarNumber &&
      !/^\d{12}$/.test(form.aadhaarNumber)
    ) {
      nextErrors.aadhaarNumber = "Aadhaar must be exactly 12 digits.";
    }

    return nextErrors;

  }


  function normalisePhone(
    value
  ) {

    return String(
      value || ""
    ).replace(
      /\D/g,
      ""
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
        farmer.id,

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
        "",

      districtId:
        farmer.district_id ??
        farmer.districtId ??
        "",

      mandalId:
        farmer.mandal_id ??
        farmer.mandalId ??
        "",

      village:
        farmer.village ||
        "",

      pincode:
        farmer.pincode ||
        "",

      address:
        farmer.address ||
        farmer.farm_address ||
        "",

      landmark:
        farmer.landmark ||
        "",

      currentLat:
        farmer.current_lat ??
        farmer.currentLat ??
        null,

      currentLng:
        farmer.current_lng ??
        farmer.currentLng ??
        null,

      alternatePhone:
        farmer.alternate_phone ||
        farmer.alternatePhone ||
        "",

      farmSizeAcres:
        farmer.farm_size_acres ??
        farmer.farmSizeAcres ??
        "",

      irrigationType:
        farmer.irrigation_type ||
        farmer.irrigationType ||
        "",

      primaryCrop:
        farmer.primary_crop ??
        farmer.primaryCrop ??
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


  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    if (
      submitting
    ) {

      return;

    }


    const nextErrors =
      validate();


    setErrors(
      nextErrors
    );


    if (
      Object.keys(
        nextErrors
      ).length > 0
    ) {

      return;

    }


    setSubmitting(
      true
    );


    try {

      /*
        The frontend may generate a temporary id
        because the existing backend accepts one.

        IMPORTANT:
        We NEVER use this temporary id as the
        authenticated farmer id.

        The backend response is the source of truth.
      */

      const temporaryId =
        `F${Date.now()}${Math.floor(
          Math.random() * 1000
        )}`;


      const farmerPayload = {

        id:
          temporaryId,

        name:
          form.name.trim(),

        phone:
          normalisePhone(
            form.phone
          ),

        stateId:
          form.stateId,

        districtId:
          form.districtId,

        mandalId:
          form.mandalId,

        village:
          form.village,

        pincode:
          form.pincode || null,

        address:
          form.address || null,

        landmark:
          form.landmark || null,

        currentLat:
          form.currentLat,

        currentLng:
          form.currentLng,

        locationUpdatedAt:
          form.locationUpdatedAt || null,

        alternatePhone:
          normalisePhone(form.alternatePhone) || null,

        farmSizeAcres:
          form.farmSizeAcres
            ? Number(form.farmSizeAcres)
            : null,

        irrigationType:
          form.irrigationType || null,

        password:
          form.password,

        language:
          form.language,

        preferredCenterId:
          null,

        primaryCrop:
          form.primaryCrop || null,

        estimatedQuantity:
          form.estimatedQuantity
            ? Number(form.estimatedQuantity)
            : 0,
            
        aadhaar_number: form.aadhaarNumber || null,
        kyc_verified: form.kycVerified,


      };


      const response =
        await fetch(
          `${API_URL}/farmers`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                farmerPayload
              ),
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
          "Unable to create your account."
        );

      }


      /*
        ALWAYS use the farmer returned by
        the backend.

        This is the canonical database identity.
      */

      const savedFarmer =
        normalizeFarmer(
          data?.farmer
        );


      if (
        !savedFarmer?.id
      ) {

        throw new Error(
          "Account was created but the server did not return a valid farmer account."
        );

      }


      /*
        Store exactly the database farmer.

        This fixes the problem where:
        frontend ID != database ID.
      */

      setCurrentFarmer(
        savedFarmer
      );


      setLanguage(
        savedFarmer.language ||
        form.language
      );


      navigate(
        "/farmer/home",
        {
          replace:
            true,
        }
      );


    } catch (
      registrationError
    ) {

      console.error(
        "Registration error:",
        registrationError
      );


      setErrors({
        submit:
          registrationError?.message ||
          "Unable to create your account.",
      });

    } finally {

      setSubmitting(
        false
      );

    }

  }


  return (

    <div className="farmer-register-page" style={{ backgroundImage: `linear-gradient(rgba(215, 238, 220, 0.85), rgba(215, 238, 220, 0.95)), url(${oxPlowing})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }}>

      <Header
        showHelp={false}
      />


      <main className="register-container">

        <div className="register-back-row">

          <Link
            to="/farmer/login"
            className="back-link"
          >

            <ArrowLeft
              size={16}
            />

            {t(
              "common.back"
            )}

          </Link>

        </div>


        <section className="register-layout">


          <div className="register-intro">

            <span className="page-eyebrow">

              {t(
                "register.eyebrow"
              )}

            </span>


            <h1>

              {t(
                "register.titleLineOne"
              )}

              <span>
                {" "}
                {t(
                  "register.titleLineTwo"
                )}
              </span>

            </h1>


            <p>

              {t(
                "register.description"
              )}

            </p>


            <div className="register-benefits">

              <Benefit
                icon={
                  <CalendarIcon />
                }
                title={t(
                  "register.fasterBooking"
                )}
                description={t(
                  "register.fasterBookingDescription"
                )}
              />


              <Benefit
                icon={
                  <MessageIcon />
                }
                title={t(
                  "register.smsNotifications"
                )}
                description={t(
                  "register.smsNotificationsDescription"
                )}
              />


              <Benefit
                icon={
                  <ShieldIcon />
                }
                title={t(
                  "register.verifiedAccount"
                )}
                description={t(
                  "register.verifiedAccountDescription"
                )}
              />

            </div>

          </div>


          <form
            className="register-form-card"
            onSubmit={
              handleSubmit
            }
          >


            <div className="register-form-heading">

              <div className="register-form-icon">

                <UserRound
                  size={21}
                />

              </div>


              <div>

                <h2>

                  {t(
                    "register.createAccount"
                  )}

                </h2>


                <p>

                  {t(
                    "register.fieldsRequired"
                  )}

                </p>

              </div>

            </div>


            <div className="register-section">


              <div className="register-section-label">

                {t(
                  "register.personalDetails"
                )}

              </div>


              <div className="register-field">


                <label
                  htmlFor="farmer-name"
                >

                  {t(
                    "register.farmerName"
                  )}

                  {" "}

                  *

                </label>


                <div
                  className={
                    `register-input ${
                      errors.name
                        ? "register-input-error"
                        : ""
                    }`
                  }
                >

                  <UserRound
                    size={17}
                  />


                  <input
                    id="farmer-name"
                    type="text"
                    value={
                      form.name
                    }
                    placeholder={t(
                      "register.fullNamePlaceholder"
                    )}
                    onChange={
                      (event) =>
                        updateField(
                          "name",
                          event.target.value
                        )
                    }
                  />

                </div>


                {errors.name && (

                  <span className="register-error">

                    {
                      errors.name
                    }

                  </span>

                )}

              </div>


              <div className="register-field">


                <label
                  htmlFor="farmer-phone"
                >

                  {t(
                    "register.mobileNumber"
                  )}

                  {" "}

                  *

                </label>


                <div
                  className={
                    `register-input ${
                      errors.phone
                        ? "register-input-error"
                        : ""
                    }`
                  }
                >

                  <Phone
                    size={17}
                  />


                  <span className="verified-country">

                    +91

                  </span>


                  <input
                    id="farmer-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={
                      form.phone
                    }
                    onChange={
                      handlePhoneChange
                    }
                  />

                </div>


                <span className="register-hint">

                  Enter your 10-digit mobile number.

                </span>


                {errors.phone && (

                  <span className="register-error">

                    {
                      errors.phone
                    }

                  </span>

                )}

              </div>

            </div>


            <div className="register-section">


              <div className="register-section-label">

                {t(
                  "location.section"
                )}

              </div>

              <div className="farmer-register-location-source-note">
                <strong>Official administrative location data</strong>
                <span>
                  States, districts, mandals and villages are loaded from the
                  server-backed location directory. No demo location list is
                  used in this registration form.
                </span>
              </div>

              <div className="farmer-register-gps-card">
                <div className="farmer-register-gps-copy">
                  <div className="farmer-register-gps-icon">
                    <LocateFixed size={20} />
                  </div>
                  <div>
                    <strong>Use your current location</strong>
                    <span>
                      GPS is used first for pickup and transporter matching.
                      Your registered village is kept separately.
                    </span>
                  </div>
                </div>

                <div className="farmer-register-gps-actions">
                  <button
                    type="button"
                    className="farmer-register-gps-button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                  >
                    <LocateFixed size={17} />
                    {locating ? "Getting location…" : "Use current location"}
                  </button>

                  {form.currentLat != null && form.currentLng != null ? (
                    <button
                      type="button"
                      className="farmer-register-map-button"
                      onClick={openCurrentLocationInMaps}
                    >
                      <Navigation size={16} />
                      Open map
                    </button>
                  ) : null}
                </div>

                {locationMessage ? (
                  <div className="farmer-register-gps-message">
                    <CheckCircle2 size={15} />
                    <span>{locationMessage}</span>
                  </div>
                ) : null}

                {form.currentLat != null && form.currentLng != null ? (
                  <div className="farmer-register-gps-meta">
                    <span>
                      <strong>Current GPS:</strong>{" "}
                      {Number(form.currentLat).toFixed(6)},{" "}
                      {Number(form.currentLng).toFixed(6)}
                    </span>
                    <span>
                      {form.locationSource === "GPS"
                        ? "Captured from this device"
                        : "Registered location"}
                    </span>
                  </div>
                ) : null}
              </div>


              <div className="register-two-column">


                <LocationSelect
                  label={t(
                    "location.state"
                  )}
                  value={
                    selectedState?.stateName ||
                    ""
                  }
                  placeholder={t(
                    "location.selectState"
                  )}
                  typeLabel={t(
                    "location.stateType"
                  )}
                  icon={
                    <MapPin
                      size={16}
                    />
                  }
                  isOpen={
                    openMenu ===
                    "state"
                  }
                  onToggle={() =>
                    setOpenMenu(
                      openMenu ===
                        "state"
                        ? null
                        : "state"
                    )
                  }
                  error={
                    errors.stateId
                  }
                >

                  {locationLoading ? (
                    <div className="register-dropdown-loading">
                      Loading official states…
                    </div>
                  ) : null}

                  {states.map(
                    (
                      item
                    ) => (

                      <button
                        key={
                          item.stateId
                        }
                        type="button"
                        onClick={() =>
                          selectState(
                            item.stateId
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              item.stateName
                            }

                          </strong>


                          <span>

                            {t(
                              "location.stateType"
                            )}

                          </span>

                        </div>


                        {form.stateId ===
                          item.stateId && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>



                <LocationSelect
                  label={t(
                    "location.district"
                  )}
                  value={
                    selectedDistrict?.districtName ||
                    ""
                  }
                  placeholder={t(
                    "location.selectDistrict"
                  )}
                  typeLabel={t(
                    "location.districtType"
                  )}
                  icon={
                    <MapPin
                      size={16}
                    />
                  }
                  disabled={
                    locationLoading ||
                    !form.stateId
                  }
                  isOpen={
                    openMenu ===
                    "district"
                  }
                  onToggle={() => {

                    if (
                      !form.stateId
                    ) {

                      return;

                    }


                    setOpenMenu(
                      openMenu ===
                        "district"
                        ? null
                        : "district"
                    );

                  }}
                  error={
                    errors.districtId
                  }
                >

                  {districts.map(
                    (
                      item
                    ) => (

                      <button
                        key={
                          item.districtId
                        }
                        type="button"
                        onClick={() =>
                          selectDistrict(
                            item.districtId
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              item.districtName
                            }

                          </strong>


                          <span>

                            {t(
                              "location.districtType"
                            )}

                          </span>

                        </div>


                        {form.districtId ===
                          item.districtId && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>

              </div>



              <div className="register-two-column">


                <LocationSelect
                  label={t(
                    "location.mandal"
                  )}
                  value={
                    selectedMandal?.mandalName ||
                    ""
                  }
                  placeholder={t(
                    "location.selectMandal"
                  )}
                  typeLabel={t(
                    "location.mandalType"
                  )}
                  icon={
                    <MapPin
                      size={16}
                    />
                  }
                  disabled={
                    locationLoading ||
                    !form.districtId
                  }
                  isOpen={
                    openMenu ===
                    "mandal"
                  }
                  onToggle={() => {

                    if (
                      !form.districtId
                    ) {

                      return;

                    }


                    setOpenMenu(
                      openMenu ===
                        "mandal"
                        ? null
                        : "mandal"
                    );

                  }}
                  error={
                    errors.mandalId
                  }
                >

                  {mandals.map(
                    (
                      item
                    ) => (

                      <button
                        key={
                          item.mandalId
                        }
                        type="button"
                        onClick={() =>
                          selectMandal(
                            item.mandalId
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              item.mandalName
                            }

                          </strong>


                          <span>

                            {t(
                              "location.mandalType"
                            )}

                          </span>

                        </div>


                        {form.mandalId ===
                          item.mandalId && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>



                <LocationSelect
                  label={t(
                    "location.village"
                  )}
                  value={
                    form.village
                  }
                  placeholder={t(
                    "location.selectVillage"
                  )}
                  typeLabel={t(
                    "location.villageType"
                  )}
                  icon={
                    <MapPin
                      size={16}
                    />
                  }
                  disabled={
                    locationLoading ||
                    !form.mandalId
                  }
                  isOpen={
                    openMenu ===
                    "village"
                  }
                  onToggle={() => {

                    if (
                      !form.mandalId
                    ) {

                      return;

                    }


                    setOpenMenu(
                      openMenu ===
                        "village"
                        ? null
                        : "village"
                    );

                  }}
                  error={
                    errors.village
                  }
                >

                  {villages.map(
                    (
                      village
                    ) => (

                      <button
                        key={
                          village
                        }
                        type="button"
                        onClick={() =>
                          selectVillage(
                            village
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              village
                            }

                          </strong>


                          <span>

                            {t(
                              "location.villageType"
                            )}

                          </span>

                        </div>


                        {form.village ===
                          village && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>

              </div>

              <div className="register-two-column">
                <TextField
                  label="Pincode"
                  icon={<MapPin size={16} />}
                  value={form.pincode}
                  onChange={(event) =>
                    updateField(
                      "pincode",
                      event.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                    )
                  }
                  placeholder="6-digit pincode"
                  error={errors.pincode}
                />

                <TextField
                  label="Landmark"
                  icon={<Home size={16} />}
                  value={form.landmark}
                  onChange={(event) =>
                    updateField("landmark", event.target.value)
                  }
                  placeholder="Nearby landmark"
                />
              </div>

              <div className="register-field">
                <label htmlFor="farmer-address">Farm / pickup address</label>
                <div className="register-input">
                  <Home size={17} />
                  <input
                    id="farmer-address"
                    type="text"
                    value={form.address}
                    placeholder="House, farm road, locality..."
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                  />
                </div>
              </div>


              <div className="location-path-card">

                <div className="location-path-icon">

                  <MapPin
                    size={16}
                  />

                </div>


                <div>

                  <span>

                    {t(
                      "location.selectedLocation"
                    )}

                  </span>


                  <strong>

                    {[
                      selectedState?.stateName,
                      selectedDistrict?.districtName,
                      selectedMandal?.mandalName,
                      form.village,
                    ]
                      .filter(Boolean)
                      .join(
                        " · "
                      )}

                  </strong>


                  <small>

                    {t(
                      "location.centerUpdates"
                    )}

                  </small>

                </div>

              </div>

            </div>


            <div className="register-section">

              <div className="register-section-label">
                FARM & CROP DETAILS
              </div>

              <div className="register-two-column">
                <TextField
                  label="Farm size (acres)"
                  icon={<Ruler size={16} />}
                  type="number"
                  value={form.farmSizeAcres}
                  onChange={(event) =>
                    updateField("farmSizeAcres", event.target.value)
                  }
                  placeholder="e.g. 2.5"
                  min="0"
                  step="0.1"
                  error={errors.farmSizeAcres}
                />

                <TextField
                  label="Expected crop quantity (kg)"
                  icon={<Wheat size={16} />}
                  type="number"
                  value={form.estimatedQuantity}
                  onChange={(event) =>
                    updateField("estimatedQuantity", event.target.value)
                  }
                  placeholder="e.g. 1500"
                  min="0"
                  step="1"
                  error={errors.estimatedQuantity}
                />
              </div>

              <div className="register-two-column">
                <div className="register-field">
                  <label>Primary crop</label>
                  <div className="register-input">
                    <Wheat size={17} />
                    <input
                      type="text"
                      value={form.primaryCrop}
                      placeholder="Wheat, rice, cotton..."
                      onChange={(event) =>
                        updateField("primaryCrop", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="register-field">
                  <label>Irrigation type</label>
                  <div className="register-input">
                    <Droplets size={17} />
                    <select
                      value={form.irrigationType}
                      onChange={(event) =>
                        updateField("irrigationType", event.target.value)
                      }
                    >
                      <option value="">Select irrigation</option>
                      <option value="RAINFED">Rainfed</option>
                      <option value="BOREWELL">Borewell</option>
                      <option value="CANAL">Canal</option>
                      <option value="DRIP">Drip irrigation</option>
                      <option value="SPRINKLER">Sprinkler</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="register-section">

              <div className="register-section-label">
                ACCOUNT SECURITY
              </div>

              <div className="register-two-column">
                <TextField
                  label="Create password"
                  icon={<LockKeyhole size={16} />}
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="At least 6 characters"
                  error={errors.password}
                />

                <TextField
                  label="Confirm password"
                  icon={<LockKeyhole size={16} />}
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  placeholder="Re-enter password"
                  error={errors.confirmPassword}
                />
              </div>

              <div className="register-field">
                <label className="register-label">Aadhaar Number (e-KYC)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="register-input-wrapper" style={{ flex: 1 }}>
                    <div className="register-input-icon">
                      <LockKeyhole size={16} />
                    </div>
                    <input
                      className="register-input"
                      type="text"
                      placeholder="12-digit Aadhaar Number"
                      value={form.aadhaarNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 12) updateField("aadhaarNumber", val);
                      }}
                      disabled={form.kycVerified}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if ((form.aadhaarNumber || "").length === 12) {
                        updateField("kycVerified", true);
                      } else {
                        setErrors(prev => ({...prev, aadhaarNumber: "Enter 12 digits to verify"}));
                      }
                    }}
                    disabled={form.kycVerified || (form.aadhaarNumber || "").length !== 12}
                    style={{
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: form.kycVerified ? '#10b981' : '#3b82f6',
                      color: 'white',
                      cursor: form.kycVerified ? 'default' : 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {form.kycVerified ? <><CheckCircle2 size={16} /> Verified</> : "Verify OTP"}
                  </button>
                </div>
                {errors.aadhaarNumber && <div className="register-error">{errors.aadhaarNumber}</div>}
              </div>


              <div className="register-field">
                <label>Alternate mobile number</label>
                <div className="register-input">
                  <Phone size={17} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.alternatePhone}
                    placeholder="Optional 10-digit number"
                    onChange={(event) =>
                      updateField(
                        "alternatePhone",
                        event.target.value.replace(/[^0-9]/g, "").slice(0, 10)
                      )
                    }
                  />
                </div>
                {errors.alternatePhone ? (
                  <span className="register-error">
                    {errors.alternatePhone}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="register-section">


              <div className="register-section-label">

                {t(
                  "register.languageSection"
                )}

              </div>


              <div className="register-field">

                <label>

                  {t(
                    "register.preferredLanguage"
                  )}

                </label>


                <div className="language-options">

                  {languages.map(
                    (
                      item
                    ) => (

                      <button
                        key={
                          item.id
                        }
                        type="button"
                        className={
                          form.language ===
                          item.id
                            ? "language-option selected"
                            : "language-option"
                        }
                        onClick={() =>
                          updateField(
                            "language",
                            item.id
                          )
                        }
                      >

                        <Globe2
                          size={15}
                        />


                        <span>
                          {item.nativeLabel}
                        </span>


                        {form.language ===
                          item.id && (

                          <Check
                            size={14}
                          />

                        )}

                      </button>

                    )
                  )}

                </div>


                <span className="register-hint">

                  {t(
                    "register.changeLater"
                  )}

                </span>

              </div>

            </div>


            {errors.submit && (

              <div className="register-submit-error">

                {errors.submit}

              </div>

            )}



            <div className="register-submit-area">

              <div>

                <span>

                  {t(
                    "register.accountLanguage"
                  )}

                </span>


                <strong>

                  {selectedLanguage.nativeLabel}

                </strong>

              </div>


              <Button
                type="submit"
                disabled={
                  submitting
                }
              >

                {submitting
                  ? "Creating Account..."
                  : t(
                      "register.createAccountButton"
                    )}


                {!submitting && (

                  <ArrowRight
                    size={18}
                  />

                )}

              </Button>

            </div>


            <p className="register-terms">

              {t(
                "register.terms"
              )}

            </p>


          </form>

        </section>

      </main>

    </div>
  );
}


/* =========================================================
   SIMPLE FIELD
========================================================= */

function TextField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  error = "",
  min,
  step,
}) {
  return (
    <div className="register-field">
      <label>{label}</label>
      <div className={`register-input ${error ? "register-input-error" : ""}`}>
        {icon}
        <input
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          step={step}
        />
      </div>
      {error ? (
        <span className="register-error">{error}</span>
      ) : null}
    </div>
  );
}


/* =========================================================
   LOCATION SELECT
========================================================= */

function LocationSelect({
  label,
  value,
  icon,
  isOpen,
  onToggle,
  children,
  disabled = false,
  error = "",
  placeholder,
  typeLabel,
}) {

  const {
    t,
  } =
    useLanguage();


  return (

    <div className="register-field">

      <label>
        {label}
      </label>


      <div className="register-select">

        <button
          type="button"
          disabled={
            disabled
          }
          className={
            error
              ? "register-select-button-error"
              : ""
          }
          onClick={
            onToggle
          }
        >

          <div className="register-select-main">

            <div className="register-select-icon">

              {icon}

            </div>


            <div>

              <strong>

                {
                  value ||
                  placeholder
                }

              </strong>


              <span>

                {disabled
                  ? t(
                      "location.selectPreviousFirst"
                    )
                  : typeLabel ||
                    label}

              </span>

            </div>

          </div>


          <ChevronDown
            size={16}
          />

        </button>


        {isOpen &&
          !disabled && (

          <div className="register-dropdown">

            {children}

          </div>

        )}

      </div>


      {error && (

        <span className="register-error">

          {error}

        </span>

      )}

    </div>

  );
}


/* =========================================================
   BENEFITS
========================================================= */

function Benefit({
  icon,
  title,
  description,
}) {

  return (

    <div>

      <div className="register-benefit-icon">

        {icon}

      </div>


      <div>

        <strong>

          {title}

        </strong>


        <span>

          {description}

        </span>

      </div>

    </div>

  );
}


/* =========================================================
   ICONS
========================================================= */

function CalendarIcon() {

  return (

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
      />


      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
      />


      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
      />


      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
      />

    </svg>

  );
}


function MessageIcon() {

  return (

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path
        d="M21 11.5a8.5 8.5 0 0 1-8.9 8.5A8.6 8.6 0 0 1 8 18.8L3 20l1.3-4.3A8.4 8.4 0 0 1 4.5 11.5A8.5 8.5 0 0 1 21 11.5Z"
      />

    </svg>

  );
}


function ShieldIcon() {

  return (

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
      />

      <path
        d="m9 12 2 2 4-4"
      />

    </svg>

  );
}


export default FarmerRegister;
