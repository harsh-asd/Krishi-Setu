import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Database,
  Edit3,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  Users,
  Wheat,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

import { useLanguage } from "../../translations/LanguageContext";

const API_URL =
  String(
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
  ).replace(
    /\/+$/,
    ""
  );


function AdminCenters() {

  const [centers, setCenters] =
    useState([]);

  const [bookings, setBookings] =
    useState([]);

  const [selectedCenter, setSelectedCenter] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [editingCenter, setEditingCenter] =
    useState(null);

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

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [locationFilter, setLocationFilter] =
    useState("ALL");

  const [adminLocation, setAdminLocation] =
    useState(null);

  const [locating, setLocating] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [locationMessage, setLocationMessage] =
    useState("");

  const {
  language,
} = useLanguage();


  const text =
    getCentersCopy(
      language
    );


  const loadData =
    useCallback(
      async (
        manual = false
      ) => {

        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {

          const [
            centersResponse,
            bookingsResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_URL}/centers`
              ),

              fetch(
                `${API_URL}/bookings`
              ),
            ]);


          const centersData =
            await centersResponse.json();


          const bookingsData =
            await bookingsResponse.json();


          if (
            !centersResponse.ok
          ) {
            throw new Error(
              centersData?.message ||
              "Unable to load centers."
            );
          }


          if (
            !bookingsResponse.ok
          ) {
            throw new Error(
              bookingsData?.message ||
              "Unable to load bookings."
            );
          }


          setCenters(
            Array.isArray(
              centersData?.centers
            )
              ? centersData.centers
              : []
          );


          setBookings(
            Array.isArray(
              bookingsData?.bookings
            )
              ? bookingsData.bookings
              : []
          );


          setError("");

        } catch (
          loadError
        ) {

          console.error(
            "Admin centers error:",
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
        () =>
          loadData(),
        10000
      );


    return () =>
      clearInterval(
        timer
      );

  }, [
    loadData,
  ]);


  const centerRows =
    useMemo(
      () =>
        centers.map(
          (
            center
          ) => {

            const centerId =
              String(
                center.id ||
                ""
              );


            const centerBookings =
              bookings.filter(
                (
                  booking
                ) =>
                  String(
                    booking.center_id ||
                    ""
                  ) ===
                  centerId
              );


            const activeBookings =
              centerBookings.filter(
                (
                  booking
                ) =>
                  booking.status !==
                  "PAYMENT_SENT"
              );


            const capacity =
              Number(
                center.capacity ||
                20
              );


            const utilization =
              capacity > 0
                ? Math.min(
                    100,
                    Math.round(
                      (
                        activeBookings.length /
                        capacity
                      ) *
                      100
                    )
                  )
                : 0;


            const distanceKm =
              adminLocation
                ? calculateDistanceKm(
                    adminLocation.lat,
                    adminLocation.lng,
                    getCenterLatitude(center),
                    getCenterLongitude(center)
                  )
                : null;

            return {
              center,
              centerId,
              centerBookings,
              activeBookings,
              capacity,
              utilization,
              distanceKm,
            };

          }
        ),
      [
        centers,
        bookings,
        adminLocation,
      ]
    );


  async function findCentersByAdminGps() {

    if (!navigator.geolocation) {
      setLocationError(
        "Location services are not available in this browser."
      );
      return;
    }

    setLocating(true);
    setLocationError("");
    setLocationMessage(
      "Detecting your location and finding procurement centers..."
    );

    try {
      const position =
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0,
            }
          );
        });

      const lat = Number(position.coords.latitude);
      const lng = Number(position.coords.longitude);

      const response = await fetch(
        `${API_URL}/locations/resolve?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radiusKm=100`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
          "GPS was received, but the administrative region could not be resolved."
        );
      }

      const location = data?.location || {};

      setAdminLocation({
        lat,
        lng,
        stateId: String(location.stateId ?? ""),
        state: String(location.state ?? ""),
        districtId: String(location.districtId ?? ""),
        district: String(location.district ?? ""),
        mandalId: String(location.mandalId ?? ""),
        mandal: String(location.mandal ?? ""),
      });

      setLocationFilter("STATE");
      setLocationMessage(
        location.state
          ? `Showing procurement centers in ${location.state}.`
          : "Showing procurement centers in your current state."
      );

    } catch (error) {
      console.error(
        "Admin center region lookup error:",
        error
      );

      const message =
        error?.code === 1
          ? "Location permission was denied. Allow location access and try again."
          : error?.code === 3
            ? "Location request timed out. Try again."
            : error?.message ||
              "Unable to find centers from your current location.";

      setLocationError(message);
      setLocationMessage("");

    } finally {
      setLocating(false);
    }
  }


  const filteredRows =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        const rows = centerRows.filter(
          (
            row
          ) => {

            const active =
              Number(
                row.center.active ??
                1
              ) === 1;

            if (locationFilter === "STATE") {
              if (!adminLocation?.stateId && !adminLocation?.state) {
                return false;
              }

              const centerStateId = String(
                row.center.state_id ??
                row.center.stateId ??
                ""
              ).trim();

              const centerState = String(
                row.center.state ??
                row.center.state_name ??
                ""
              ).trim().toLowerCase();

              const wantedStateId = String(
                adminLocation.stateId ??
                ""
              ).trim();

              const wantedState = String(
                adminLocation.state ??
                ""
              ).trim().toLowerCase();

              if (
                (wantedStateId && centerStateId && centerStateId !== wantedStateId) &&
                (wantedState && centerState && centerState !== wantedState)
              ) {
                return false;
              }
            }

            if (locationFilter === "NEARBY") {
              if (!Number.isFinite(row.distanceKm) || row.distanceKm > 100) {
                return false;
              }
            }

            if (
              statusFilter ===
                "ACTIVE" &&
              !active
            ) {
              return false;
            }


            if (
              statusFilter ===
                "IDLE" &&
              active
            ) {
              return false;
            }


            if (
              !query
            ) {
              return true;
            }


            const center =
              row.center;


            const searchable =
              [
                row.centerId,
                center.name,
                center.state_id,
                center.district_id,
                center.mandal_id,
                center.village,
                center.address,
                center.manager_name,
                center.manager_phone,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchable.includes(
              query
            );

          }
        );

        if (locationFilter !== "ALL") {
          rows.sort((a, b) => {
            const aDistance = Number.isFinite(a.distanceKm)
              ? a.distanceKm
              : Number.POSITIVE_INFINITY;
            const bDistance = Number.isFinite(b.distanceKm)
              ? b.distanceKm
              : Number.POSITIVE_INFINITY;
            return aDistance - bDistance;
          });
        }

        return rows;

      },
      [
        centerRows,
        search,
        statusFilter,
        locationFilter,
        adminLocation,
      ]
    );


  const overview =
    useMemo(
      () => {

        const totalCenters =
          centerRows.length;


        const activeCenters =
          centerRows.filter(
            (
              row
            ) =>
              Number(
                row.center.active ??
                1
              ) === 1
          ).length;


        const activeBookings =
          centerRows.reduce(
            (
              total,
              row
            ) =>
              total +
              row.activeBookings.length,
            0
          );


        const totalCapacity =
          centerRows.reduce(
            (
              total,
              row
            ) =>
              total +
              row.capacity,
            0
          );


        const utilization =
          totalCapacity > 0
            ? Math.round(
                (
                  activeBookings /
                  totalCapacity
                ) *
                100
              )
            : 0;


        return {
          totalCenters,
          activeCenters,
          activeBookings,
          totalCapacity,
          utilization:
            Math.min(
              100,
              utilization
            ),
        };

      },
      [
        centerRows,
      ]
    );


  function openCreate() {

    setEditingCenter(
      null
    );

    setShowForm(
      true
    );

    setSelectedCenter(
      null
    );

    setError("");

    setSuccess("");

  }


  function openEdit(
    center
  ) {

    setEditingCenter(
      center
    );

    setShowForm(
      true
    );

    setSelectedCenter(
      null
    );

    setError("");

    setSuccess("");

  }


  async function saveCenter(
    form
  ) {

    setSaving(
      true
    );

    setError("");

    setSuccess("");


    try {

      const isEditing =
        Boolean(
          editingCenter
        );


      const url =
        isEditing
          ? `${API_URL}/centers/${encodeURIComponent(
              editingCenter.id
            )}`
          : `${API_URL}/centers`;


      const response =
        await fetch(
          url,
          {
            method:
              isEditing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                form
              ),
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
        isEditing
          ? text.updated
          : text.created
      );


      setShowForm(
        false
      );

      setEditingCenter(
        null
      );


      await loadData(
        true
      );


      if (
        data?.center
      ) {

        setSelectedCenter(
          centerRows.find(
            (
              row
            ) =>
              row.centerId ===
              data.center.id
          ) || null
        );

      }

    } catch (
      saveError
    ) {

      console.error(
        "Save center error:",
        saveError
      );


      setError(
        saveError?.message ||
        text.saveError
      );

    } finally {

      setSaving(
        false
      );

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

      <div className="admin-centers-page">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="admin-centers-hero">

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


          <div className="admin-centers-actions">


            <div className="admin-centers-live">

              <Database
                size={14}
              />

              {text.liveData}

            </div>


            <button
              type="button"
              className="admin-centers-refresh"
              onClick={() =>
                loadData(
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


            <button
              type="button"
              className="admin-center-add-button"
              onClick={
                openCreate
              }
            >

              <Plus
                size={15}
              />

              {text.addCenter}

            </button>

          </div>

        </section>



        {/* =====================================================
            FEEDBACK
        ====================================================== */}

        {error && (

          <div className="admin-centers-error">

            <AlertTriangle
              size={17}
            />

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


        {success && (

          <div className="admin-centers-success">

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
              <X size={14} />
            </button>

          </div>

        )}



        {/* =====================================================
            KPIs
        ====================================================== */}

        <section className="admin-center-kpi-grid">

          <CenterKpi
            tone="blue"
            icon={
              <MapPin
                size={18}
              />
            }
            value={
              overview.totalCenters
            }
            label={
              text.totalCenters
            }
          />


          <CenterKpi
            tone="green"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            value={
              overview.activeCenters
            }
            label={
              text.activeCenters
            }
          />


          <CenterKpi
            tone="purple"
            icon={
              <CalendarDays
                size={18}
              />
            }
            value={
              overview.activeBookings
            }
            label={
              text.activeBookings
            }
          />


          <CenterKpi
            tone="gold"
            icon={
              <Users
                size={18}
              />
            }
            value={
              overview.totalCapacity
            }
            label={
              text.totalCapacity
            }
          />


          <CenterKpi
            tone="teal"
            icon={
              <ArrowRight
                size={18}
              />
            }
            value={
              `${overview.utilization}%`
            }
            label={
              text.utilization
            }
          />

        </section>



        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="admin-centers-filter-panel">


          <div className="admin-centers-search">

            <Search
              size={16}
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
              placeholder={
                text.searchPlaceholder
              }
            />

          </div>


          <div className="admin-centers-filter">

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                {text.allCenters}
              </option>

              <option value="ACTIVE">
                {text.activeOnly}
              </option>

              <option value="IDLE">
                {text.idleOnly}
              </option>

            </select>

          </div>


          {(search ||
            statusFilter !==
              "ALL") && (

            <button
              type="button"
              className="admin-centers-clear"
              onClick={() => {

                setSearch("");

                setStatusFilter(
                  "ALL"
                );

              }}
            >

              <X
                size={13}
              />

              {text.clear}

            </button>

          )}

        </section>


        <section className="admin-centers-location-panel">

          <div className="admin-centers-location-copy">
            <div className="admin-centers-location-icon">
              <LocateFixed size={17} />
            </div>

            <div>
              <strong>Find verified centers by your location</strong>
              <span>
                Use GPS to load centers in your current state or only centers within 100 km.
              </span>
              {locationMessage && (
                <small>{locationMessage}</small>
              )}
              {locationError && (
                <small className="admin-centers-location-error-text">
                  {locationError}
                </small>
              )}
            </div>
          </div>

          <div className="admin-centers-location-actions">
            <button
              type="button"
              className="admin-centers-location-gps-button"
              onClick={findCentersByAdminGps}
              disabled={locating}
            >
              <LocateFixed size={15} />
              {locating ? "Finding..." : "Use my GPS"}
            </button>

            <select
              className="admin-centers-location-filter"
              value={locationFilter}
              onChange={event => setLocationFilter(event.target.value)}
              disabled={!adminLocation && locationFilter !== "ALL"}
            >
              <option value="ALL">All verified centers</option>
              <option value="STATE">Current state</option>
              <option value="NEARBY">Within 100 km</option>
            </select>

            {locationFilter !== "ALL" && (
              <button
                type="button"
                className="admin-centers-location-clear"
                onClick={() => {
                  setLocationFilter("ALL");
                  setLocationMessage("");
                }}
              >
                Clear location
              </button>
            )}
          </div>

        </section>



        {/* =====================================================
            CENTER GRID
        ====================================================== */}

        <section className="admin-centers-grid">


          {loading ? (

            <CenterLoading />

          ) : filteredRows.length ===
            0 ? (

            <div className="admin-centers-empty">

              <MapPin
                size={25}
              />

              <strong>
                {text.noCenters}
              </strong>

              <span>
                {text.noCentersText}
              </span>

            </div>

          ) : (

            filteredRows.map(
              (
                row
              ) => (

                <CenterCard
                  key={
                    row.centerId
                  }
                  row={
                    row
                  }
                  language={
                    language
                  }
                  text={
                    text
                  }
                  distanceKm={row.distanceKm}
                  onOpen={() =>
                    setSelectedCenter(
                      row
                    )
                  }
                  onEdit={() =>
                    openEdit(
                      row.center
                    )
                  }
                />

              )
            )

          )}

        </section>



        <div className="admin-centers-footer">

          <span>
            {text.footer}
          </span>

          <span>
            {
              filteredRows.length
            }
            {" "}
            {text.displayed}
          </span>

        </div>



        {/* =====================================================
            VIEW DRAWER
        ====================================================== */}

        {selectedCenter && (

          <CenterDrawer
            row={
              selectedCenter
            }
            language={
              language
            }
            text={
              text
            }
            onClose={() =>
              setSelectedCenter(
                null
              )
            }
            onEdit={() =>
              openEdit(
                selectedCenter.center
              )
            }
          />

        )}



        {/* =====================================================
            CREATE / EDIT FORM
        ====================================================== */}

        {showForm && (

          <CenterForm
            center={
              editingCenter
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

              setShowForm(
                false
              );

              setEditingCenter(
                null
              );

            }}
            onSave={
              saveCenter
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

function CenterKpi({
  icon,
  tone,
  value,
  label,
}) {

  return (

    <div
      className={
        `admin-center-kpi ${tone}`
      }
    >

      <div className="admin-center-kpi-icon">
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
   CENTER CARD
========================================================= */

function CenterCard({
  row,
  language,
  text,
  distanceKm,
  onOpen,
  onEdit,
}) {

  const center =
    row.center;


  const active =
    Number(
      center.active ??
      1
    ) === 1;


  const cropCounts =
    {};


  row.activeBookings.forEach(
    (
      booking
    ) => {

      const crop =
        booking.crop ||
        "unknown";


      cropCounts[crop] =
        (
          cropCounts[crop] ||
          0
        ) +
        1;

    }
  );


  const topCrop =
    Object.entries(
      cropCounts
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )[0];


  return (

    <article className="admin-center-card">


      <div className="admin-center-card-top">


        <div className="admin-center-card-icon" style={{ background: 'transparent' }}>
          {centerId && centerId.startsWith("TS") ? (
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Telangana_State_Emblem.svg" alt="TS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : centerId && centerId.startsWith("AP") ? (
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Emblem_of_Andhra_Pradesh.svg" alt="AP Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <MapPin size={20} />
          )}
        </div>


        <span
          className={
            `admin-center-state ${
              active
                ? "active"
                : "idle"
            }`
          }
        >

          <span />

          {
            active
              ? text.active
              : text.idle
          }

        </span>

      </div>



      <h3>

        {
          center.name ||
          text.unnamedCenter
        }

      </h3>


      <p className="admin-center-location">

        <MapPin
          size={13}
        />


        {
          [
            center.village,
            center.mandal || center.mandal_id,
            center.district || center.district_id,
            center.state || center.state_id,
          ]
            .filter(Boolean)
            .join(", ") ||
          center.address ||
          text.locationUnavailable
        }

      </p>

      {Number.isFinite(distanceKm) && (
        <div className="admin-center-distance-badge">
          <Navigation size={12} />
          {distanceKm < 10
            ? `${distanceKm.toFixed(1)} km away`
            : `${Math.round(distanceKm)} km away`}
        </div>
      )}



      <div className="admin-center-capacity">


        <div className="admin-center-capacity-heading">

          <span>
            {text.capacityUsage}
          </span>


          <strong>

            {
              row.activeBookings.length
            }

            {" / "}

            {
              row.capacity
            }

          </strong>

        </div>


        <div className="admin-center-progress">

          <div
            style={{
              width:
                `${row.utilization}%`,
            }}
          />

        </div>


        <span className="admin-center-utilization">

          {
            row.utilization
          }
          %
          {" "}
          {text.used}

        </span>

      </div>



      <div className="admin-center-card-stats">

        <div>

          <span>
            {text.activeBookings}
          </span>

          <strong>
            {
              row.activeBookings.length
            }
          </strong>

        </div>


        <div>

          <span>
            {text.totalBookings}
          </span>

          <strong>
            {
              row.centerBookings.length
            }
          </strong>

        </div>


        <div>

          <span>
            {text.topCrop}
          </span>

          <strong>

            {
              topCrop
                ? getCropName(
                    topCrop[0],
                    language
                  )
                : "—"
            }

          </strong>

        </div>

      </div>



      <div className="admin-center-card-actions">

        <button
          type="button"
          className="admin-center-view-button"
          onClick={
            onOpen
          }
        >

          {text.viewDetails}

          <ArrowRight
            size={14}
          />

        </button>


        <button
          type="button"
          className="admin-center-edit-button"
          onClick={
            onEdit
          }
        >

          <Edit3
            size={14}
          />

          {text.edit}

        </button>

      </div>


    </article>

  );
}


/* =========================================================
   FORM
========================================================= */

function normalizeLocationRow(row) {
  return {
    id: String(
      row?.id ??
      row?.stateId ??
      row?.state_id ??
      row?.districtId ??
      row?.district_id ??
      row?.mandalId ??
      row?.mandal_id ??
      row?.subDistrictId ??
      row?.sub_district_id ??
      row?.villageId ??
      row?.village_id ??
      ""
    ),
    name: String(
      row?.name ??
      row?.stateName ??
      row?.state_name ??
      row?.districtName ??
      row?.district_name ??
      row?.mandalName ??
      row?.mandal_name ??
      row?.subDistrictName ??
      row?.sub_district_name ??
      row?.villageName ??
      row?.village_name ??
      ""
    ),
    pincode: String(
      row?.pincode ??
      row?.pinCode ??
      ""
    ),
  };
}


function extractLocationRows(data, keys) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


async function fetchLocationRows(endpoint, params = {}) {
  const url = new URL(
    `${API_URL}${endpoint}`
  );

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        String(value) !== ""
      ) {
        url.searchParams.set(
          key,
          String(value)
        );
      }
    }
  );

  const response = await fetch(
    url.toString()
  );

  const data = await response
    .json()
    .catch(() => null);

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
      "Unable to load official location data."
    );
  }

  return data;
}


function CenterForm({
  center,
  text,
  saving,
  onClose,
  onSave,
}) {

  const [
    form,
    setForm,
  ] =
    useState(
      () =>
        createFormState(
          center
        )
    );

  const [
    states,
    setStates,
  ] = useState([]);

  const [
    districts,
    setDistricts,
  ] = useState([]);

  const [
    mandals,
    setMandals,
  ] = useState([]);

  const [
    villages,
    setVillages,
  ] = useState([]);

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    locationMessage,
    setLocationMessage,
  ] = useState("");

  const [
    locationError,
    setLocationError,
  ] = useState("");


  useEffect(() => {

    fetchLocationRows(
      "/locations/states"
    )
      .then(data => {
        const rows =
          extractLocationRows(
            data,
            [
              "states",
              "locations",
              "items",
            ]
          )
            .map(normalizeLocationRow)
            .filter(
              row =>
                row.id &&
                row.name
            );

        setStates(rows);
      })
      .catch(error => {
        console.error(
          "Admin center states error:",
          error
        );
        setLocationError(
          error?.message ||
          "Unable to load states."
        );
      });

  }, []);


  useEffect(() => {

    if (!form.stateId) {
      setDistricts([]);
      setMandals([]);
      setVillages([]);
      return;
    }

    fetchLocationRows(
      "/locations/districts",
      {
        stateId:
          form.stateId,
      }
    )
      .then(data => {
        setDistricts(
          extractLocationRows(
            data,
            [
              "districts",
              "locations",
              "items",
            ]
          )
            .map(normalizeLocationRow)
            .filter(
              row =>
                row.id &&
                row.name
            )
        );
      })
      .catch(error => {
        console.error(
          "Admin center districts error:",
          error
        );
        setLocationError(
          error?.message ||
          "Unable to load districts."
        );
      });

  }, [form.stateId]);


  useEffect(() => {

    if (!form.districtId) {
      setMandals([]);
      setVillages([]);
      return;
    }

    fetchLocationRows(
      "/locations/mandals",
      {
        districtId:
          form.districtId,
      }
    )
      .then(data => {
        setMandals(
          extractLocationRows(
            data,
            [
              "mandals",
              "subDistricts",
              "sub_districts",
              "locations",
              "items",
            ]
          )
            .map(normalizeLocationRow)
            .filter(
              row =>
                row.id &&
                row.name
            )
        );
      })
      .catch(error => {
        console.error(
          "Admin center mandals error:",
          error
        );
        setLocationError(
          error?.message ||
          "Unable to load mandals."
        );
      });

  }, [form.districtId]);


  useEffect(() => {

    if (!form.mandalId) {
      setVillages([]);
      return;
    }

    fetchLocationRows(
      "/locations/villages",
      {
        mandalId:
          form.mandalId,
      }
    )
      .then(data => {
        setVillages(
          extractLocationRows(
            data,
            [
              "villages",
              "locations",
              "items",
            ]
          )
            .map(normalizeLocationRow)
            .filter(
              row =>
                row.id &&
                row.name
            )
        );
      })
      .catch(error => {
        console.error(
          "Admin center villages error:",
          error
        );
        setLocationError(
          error?.message ||
          "Unable to load villages."
        );
      });

  }, [form.mandalId]);


  async function useCurrentLocation() {

    if (!navigator.geolocation) {
      setLocationError(
        "Location services are not available in this browser."
      );
      return;
    }

    setLocating(true);
    setLocationError("");
    setLocationMessage(
      "Scanning the center's GPS location..."
    );

    try {

      const position =
        await new Promise(
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

      const accuracy =
        Number(
          position.coords.accuracy
        );

      const response =
        await fetch(
          `${API_URL}/locations/resolve?lat=${encodeURIComponent(
            lat
          )}&lng=${encodeURIComponent(
            lng
          )}&radiusKm=50`
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        data?.success === false ||
        !data?.location
      ) {
        throw new Error(
          data?.message ||
          "GPS was received but the administrative location could not be resolved."
        );
      }

      const location =
        data.location;

      setForm(current => ({
        ...current,
        stateId:
          String(
            location.stateId ??
            ""
          ),
        districtId:
          String(
            location.districtId ??
            ""
          ),
        mandalId:
          String(
            location.mandalId ??
            ""
          ),
        villageId:
          String(
            location.villageId ??
            ""
          ),
        village:
          location.village ||
          current.village ||
          "",
        address:
          data.displayName ||
          current.address ||
          "",
        pincode:
          location.pincode ||
          current.pincode ||
          "",
        latitude:
          lat,
        longitude:
          lng,
        locationAccuracyM:
          accuracy,
        locationSource:
          "GPS",
        locationUpdatedAt:
          new Date().toISOString(),
      }));

      setLocationMessage(
        `GPS detected: ${
          location.village ||
          "location"
        }${
          location.mandal
            ? `, ${location.mandal}`
            : ""
        }${
          location.district
            ? `, ${location.district}`
            : ""
        }${
          location.state
            ? `, ${location.state}`
            : ""
        }`
      );

    } catch (error) {

      console.error(
        "Admin center GPS error:",
        error
      );

      const message =
        error?.code === 1
          ? "Location permission was denied. Allow location access and try again."
          : error?.code === 3
            ? "Location request timed out. Try again."
            : error?.message ||
              "Unable to detect the center location.";

      setLocationError(
        message
      );

      setLocationMessage("");

    } finally {

      setLocating(false);

    }

  }


  function openCenterMap() {

    const lat =
      Number(
        form.latitude
      );

    const lng =
      Number(
        form.longitude
      );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setLocationError(
        "Center GPS coordinates are not available."
      );
      return;
    }

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${lat},${lng}`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );

  }


  function update(
    field,
    value
  ) {

    setForm(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );

  }


  function submit(
    event
  ) {

    event.preventDefault();


    onSave(
      {
        ...form,

        capacity:
          Number(
            form.capacity
          ),

        active:
          Boolean(
            form.active
          ),

      }
    );

  }


  return createPortal(

    <div
      className="admin-center-form-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
      role="presentation"
    >


      <div
        className="admin-center-form-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >


        <div className="admin-center-form-header">

          <div>

            <span className="admin-page-eyebrow">

              {
                center
                  ? text.editCenter
                  : text.addCenter
              }

            </span>


            <h2>

              {
                center
                  ? text.editTitle
                  : text.addTitle
              }

            </h2>


            <p>

              {
                center
                  ? text.editDescription
                  : text.addDescription
              }

            </p>

          </div>


          <button
            type="button"
            className="admin-center-form-close"
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



        <form
          className="admin-center-form"
          onSubmit={
            submit
          }
        >


          <div className="admin-center-form-section">

            <div className="admin-center-form-section-title">

              <MapPin
                size={16}
              />

              <h3>
                {text.basicInformation}
              </h3>

            </div>


            <div className="admin-center-form-grid">


              <FormField
                label={
                  text.centerId
                }
                value={
                  form.id
                }
                disabled={
                  Boolean(
                    center
                  )
                }
                onChange={(value) =>
                  update(
                    "id",
                    value
                  )
                }
                required
              />


              <FormField
                label={
                  text.centerName
                }
                value={
                  form.name
                }
                onChange={(value) =>
                  update(
                    "name",
                    value
                  )
                }
                required
              />

            </div>

          </div>



          <div className="admin-center-form-section">

            <div className="admin-center-form-section-title">

              <MapPin
                size={16}
              />

              <h3>
                {text.locationInformation}
              </h3>

            </div>


            <div className="admin-center-location-tools">

              <div className="admin-center-location-tool-copy">

                <strong>
                  Center GPS location
                </strong>

                <span>
                  Use the actual center coordinates. GPS is kept separately from the administrative village hierarchy.
                </span>

              </div>


              <div className="admin-center-location-tool-actions">

                <button
                  type="button"
                  className="admin-center-location-gps"
                  onClick={useCurrentLocation}
                  disabled={locating}
                >
                  <LocateFixed size={16} />

                  {locating
                    ? "Scanning..."
                    : "Use current location"}
                </button>


                <button
                  type="button"
                  className="admin-center-location-map"
                  onClick={openCenterMap}
                  disabled={
                    !form.latitude ||
                    !form.longitude
                  }
                >
                  <Navigation size={16} />
                  View on map
                </button>

              </div>

            </div>


            {locationMessage && (
              <div className="admin-center-location-success">
                <CheckCircle2 size={16} />
                <span>
                  {locationMessage}
                </span>
              </div>
            )}


            {locationError && (
              <div className="admin-center-location-error">
                <AlertTriangle size={16} />
                <span>
                  {locationError}
                </span>
              </div>
            )}


            <div className="admin-center-form-grid three">


              <SelectFormField
                label={text.state}
                value={form.stateId}
                onChange={(value) => {

                  const selected =
                    states.find(
                      row =>
                        String(row.id) ===
                        String(value)
                    );

                  update(
                    "stateId",
                    value
                  );

                  update(
                    "districtId",
                    ""
                  );

                  update(
                    "mandalId",
                    ""
                  );

                  update(
                    "villageId",
                    ""
                  );

                  update(
                    "village",
                    ""
                  );

                  update(
                    "state",
                    selected?.name ||
                    ""
                  );

                }}
                options={states}
                placeholder="Select state"
              />


              <SelectFormField
                label={text.district}
                value={form.districtId}
                onChange={(value) => {

                  const selected =
                    districts.find(
                      row =>
                        String(row.id) ===
                        String(value)
                    );

                  update(
                    "districtId",
                    value
                  );

                  update(
                    "district",
                    selected?.name ||
                    ""
                  );

                  update(
                    "mandalId",
                    ""
                  );

                  update(
                    "villageId",
                    ""
                  );

                  update(
                    "village",
                    ""
                  );

                }}
                options={districts}
                disabled={!form.stateId}
                placeholder={
                  form.stateId
                    ? "Select district"
                    : "Select state first"
                }
              />


              <SelectFormField
                label={text.mandal}
                value={form.mandalId}
                onChange={(value) => {

                  const selected =
                    mandals.find(
                      row =>
                        String(row.id) ===
                        String(value)
                    );

                  update(
                    "mandalId",
                    value
                  );

                  update(
                    "mandal",
                    selected?.name ||
                    ""
                  );

                  update(
                    "villageId",
                    ""
                  );

                  update(
                    "village",
                    ""
                  );

                }}
                options={mandals}
                disabled={!form.districtId}
                placeholder={
                  form.districtId
                    ? "Select mandal"
                    : "Select district first"
                }
              />


              <SelectFormField
                label={text.village}
                value={form.villageId}
                onChange={(value) => {

                  const selected =
                    villages.find(
                      row =>
                        String(row.id) ===
                        String(value)
                    );

                  update(
                    "villageId",
                    value
                  );

                  update(
                    "village",
                    selected?.name ||
                    ""
                  );

                  if (
                    selected?.pincode
                  ) {
                    update(
                      "pincode",
                      selected.pincode
                    );
                  }

                }}
                options={villages}
                disabled={!form.mandalId}
                placeholder={
                  form.mandalId
                    ? "Select village"
                    : "Select mandal first"
                }
              />


              <FormField
                label={text.address}
                value={form.address}
                onChange={(value) =>
                  update(
                    "address",
                    value
                  )
                }
                className="wide"
              />

            </div>


            <div className="admin-center-form-grid three">

              <FormField
                label="Pincode"
                value={form.pincode}
                onChange={(value) =>
                  update(
                    "pincode",
                    String(value)
                      .replace(
                        /[^0-9]/g,
                        ""
                      )
                      .slice(
                        0,
                        6
                      )
                  )
                }
              />


              <FormField
                label="Latitude"
                value={form.latitude}
                type="number"
                onChange={(value) =>
                  update(
                    "latitude",
                    value
                  )
                }
              />


              <FormField
                label="Longitude"
                value={form.longitude}
                type="number"
                onChange={(value) =>
                  update(
                    "longitude",
                    value
                  )
                }
              />

            </div>


            <div className="admin-center-gps-meta">

              <span>
                Location source:{" "}
                {form.locationSource ||
                  "REGISTERED"}
              </span>

              {form.locationAccuracyM && (
                <span>
                  Accuracy: ±
                  {Math.round(
                    Number(
                      form.locationAccuracyM
                    )
                  )} m
                </span>
              )}

            </div>

          </div>



          <div className="admin-center-form-section">

            <div className="admin-center-form-section-title">

              <Users
                size={16}
              />

              <h3>
                {text.managerInformation}
              </h3>

            </div>


            <div className="admin-center-form-grid">


              <FormField
                label={
                  text.managerName
                }
                value={
                  form.managerName
                }
                onChange={(value) =>
                  update(
                    "managerName",
                    value
                  )
                }
              />


              <FormField
                label={
                  text.managerPhone
                }
                value={
                  form.managerPhone
                }
                onChange={(value) =>
                  update(
                    "managerPhone",
                    value
                  )
                }
              />

            </div>

          </div>



          <div className="admin-center-form-section">

            <div className="admin-center-form-section-title">

              <CalendarDays
                size={16}
              />

              <h3>
                {text.operations}
              </h3>

            </div>


            <div className="admin-center-form-grid three">


              <FormField
                label={
                  text.capacity
                }
                type="number"
                min="1"
                value={
                  form.capacity
                }
                onChange={(value) =>
                  update(
                    "capacity",
                    value
                  )
                }
                required
              />


              <FormField
                label={
                  text.openingTime
                }
                type="time"
                value={
                  form.openingTime
                }
                onChange={(value) =>
                  update(
                    "openingTime",
                    value
                  )
                }
              />


              <FormField
                label={
                  text.closingTime
                }
                type="time"
                value={
                  form.closingTime
                }
                onChange={(value) =>
                  update(
                    "closingTime",
                    value
                  )
                }
              />

            </div>



            <label className="admin-center-active-toggle">


              <input
                type="checkbox"
                checked={
                  form.active
                }
                onChange={(event) =>
                  update(
                    "active",
                    event.target.checked
                  )
                }
              />


              <span
                className="admin-center-toggle-track"
              >

                <span />

              </span>


              <div>

                <strong>
                  {
                    form.active
                      ? text.centerActive
                      : text.centerInactive
                  }
                </strong>


                <span>
                  {
                    form.active
                      ? text.centerActiveText
                      : text.centerInactiveText
                  }
                </span>

              </div>

            </label>

          </div>



          <div className="admin-center-form-actions">

            <button
              type="button"
              className="admin-center-form-cancel"
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
              className="admin-center-form-save"
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

                <CheckCircle2
                  size={15}
                />

              )}


              {
                saving
                  ? text.saving
                  : center
                    ? text.saveChanges
                    : text.createCenter
              }

            </button>

          </div>


        </form>

      </div>

    </div>,

    document.body

  );
}


function SelectFormField({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = "Select",
}) {

  return (
    <label className="admin-center-form-field">
      <span>
        {label}
      </span>

      <select
        value={
          value ??
          ""
        }
        disabled={
          disabled
        }
        onChange={event =>
          onChange(
            event.target.value
          )
        }
      >

        <option value="">
          {placeholder}
        </option>

        {options.map(
          option => (
            <option
              key={option.id}
              value={option.id}
            >
              {option.name}
            </option>
          )
        )}

      </select>
    </label>
  );
}


function FormField({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
  min,
  className = "",
}) {

  return (

    <label
      className={
        `admin-center-form-field ${className}`
      }
    >

      <span>

        {label}

        {required && (
          <b>
            *
          </b>
        )}

      </span>


      <input
        type={type}
        value={
          value ?? ""
        }
        disabled={
          disabled
        }
        required={
          required
        }
        min={
          min
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </label>

  );
}


/* =========================================================
   DRAWER
========================================================= */

function CenterDrawer({
  row,
  language,
  text,
  onClose,
  onEdit,
}) {

  const center =
    row.center;


  const active =
    Number(
      center.active ??
      1
    ) === 1;


  return (

    <>

      <div
        className="admin-center-drawer-overlay"
        onClick={
          onClose
        }
      />


      <aside className="admin-center-drawer">


        <div className="admin-center-drawer-header">

          <div>

            <span className="admin-page-eyebrow">
              {text.centerProfile}
            </span>


            <h2>

              {
                center.name ||
                text.unnamedCenter
              }

            </h2>


            <span>
              {
                row.centerId
              }
            </span>

          </div>


          <button
            type="button"
            className="admin-center-drawer-close"
            onClick={
              onClose
            }
          >

            <X
              size={18}
            />

          </button>

        </div>



        <div className="admin-center-drawer-summary">


          <div className="admin-center-drawer-icon">

            <MapPin
              size={23}
            />

          </div>


          <div>

            <strong>

              {
                center.name ||
                text.unnamedCenter
              }

            </strong>


            <span>

              {
                [
                  center.village,
                  center.mandal_id,
                  center.district_id,
                  center.state_id,
                ]
                  .filter(Boolean)
                  .join(", ") ||
                center.address ||
                text.locationUnavailable
              }

            </span>

          </div>

        </div>



        <div className="admin-center-detail-grid">


          <CenterDetail
            label={
              text.status
            }
            value={
              active
                ? text.active
                : text.idle
            }
          />


          <CenterDetail
            label={
              text.capacity
            }
            value={
              row.capacity
            }
          />


          <CenterDetail
            label={
              text.activeBookings
            }
            value={
              row.activeBookings.length
            }
          />


          <CenterDetail
            label={
              text.totalBookings
            }
            value={
              row.centerBookings.length
            }
          />


          <CenterDetail
            label={
              text.utilization
            }
            value={
              `${row.utilization}%`
            }
          />


          <CenterDetail
            label={
              text.manager
            }
            value={
              center.manager_name ||
              "—"
            }
          />


        </div>



        <section className="admin-center-drawer-section">


          <div className="admin-center-drawer-section-title">

            <MapPin
              size={16}
            />


            <h3>
              {text.locationInformation}
            </h3>

          </div>


          <div className="admin-center-detail-extra">

            <strong>
              {text.address}
            </strong>

            <span>
              {
                center.address ||
                text.locationUnavailable
              }
            </span>

          </div>


          <div className="admin-center-detail-extra">

            <strong>
              {text.managerPhone}
            </strong>

            <span>
              {
                center.manager_phone ||
                "—"
              }
            </span>

          </div>


          <div className="admin-center-detail-extra">

            <strong>
              {text.operatingHours}
            </strong>

            <span>

              {
                formatTime(
                  center.opening_time
                )
              }

              {" – "}

              {
                formatTime(
                  center.closing_time
                )
              }

            </span>

          </div>


        </section>



        <section className="admin-center-drawer-section">


          <div className="admin-center-drawer-section-title">

            <Wheat
              size={16}
            />


            <h3>
              {text.cropActivity}
            </h3>

          </div>


          {getCropCounts(
            row.centerBookings
          ).length === 0 ? (

            <div className="admin-center-no-data">
              {text.noCropData}
            </div>

          ) : (

            getCropCounts(
              row.centerBookings
            ).map(
              (
                item
              ) => (

                <div
                  key={
                    item.crop
                  }
                  className="admin-center-crop-row"
                >

                  <span>
                    {
                      getCropName(
                        item.crop,
                        language
                      )
                    }
                  </span>


                  <strong>
                    {item.count}
                  </strong>

                </div>

              )
            )

          )}

        </section>



        <section className="admin-center-drawer-section">


          <div className="admin-center-drawer-section-title">

            <CalendarDays
              size={16}
            />


            <h3>
              {text.recentActivity}
            </h3>

          </div>


          {row.centerBookings.length ===
            0 ? (

            <div className="admin-center-no-data">

              {text.noRecentActivity}

            </div>

          ) : (

            row.centerBookings
              .slice(
                0,
                8
              )
              .map(
                (
                  booking
                ) => (

                  <div
                    key={
                      booking.id
                    }
                    className="admin-center-booking-row"
                  >

                    <div>

                      <strong>

                        #
                        {
                          booking.token ||
                          booking.id
                        }

                      </strong>


                      <span>

                        {
                          booking.farmer_name ||
                          text.unknownFarmer
                        }

                      </span>

                    </div>


                    <div>

                      <strong>

                        {
                          getStatusLabel(
                            booking.status,
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

                  </div>

                )
              )

          )}

        </section>



        <div className="admin-center-drawer-footer">


          <button
            type="button"
            className="admin-center-drawer-edit"
            onClick={
              onEdit
            }
          >

            <Edit3
              size={14}
            />

            {text.edit}

          </button>


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

    </>

  );
}


function CenterDetail({
  label,
  value,
}) {

  return (

    <div>

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

function getCenterLatitude(center) {
  const value =
    center?.latitude ??
    center?.lat ??
    center?.current_lat;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}


function getCenterLongitude(center) {
  const value =
    center?.longitude ??
    center?.lng ??
    center?.current_lng;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}


function calculateDistanceKm(
  lat1,
  lng1,
  lat2,
  lng2
) {
  if (
    !Number.isFinite(Number(lat1)) ||
    !Number.isFinite(Number(lng1)) ||
    !Number.isFinite(Number(lat2)) ||
    !Number.isFinite(Number(lng2))
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const toRadians = value =>
    (Number(value) * Math.PI) / 180;

  const dLat =
    toRadians(lat2 - lat1);
  const dLng =
    toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return Number(
    (earthRadiusKm * 2 * Math.asin(Math.sqrt(a))).toFixed(3)
  );
}


function createFormState(
  center
) {

  return {

    id:
      center?.id ||
      "",

    name:
      center?.name ||
      "",

    stateId:
      center?.state_id ||
      center?.stateId ||
      "",

    state:
      center?.state ||
      "",

    districtId:
      center?.district_id ||
      center?.districtId ||
      "",

    district:
      center?.district ||
      "",

    mandalId:
      center?.mandal_id ||
      center?.mandalId ||
      "",

    mandal:
      center?.mandal ||
      "",

    villageId:
      center?.village_id ||
      center?.villageId ||
      "",

    village:
      center?.village ||
      "",

    pincode:
      center?.pincode ||
      "",

    address:
      center?.address ||
      "",

    latitude:
      center?.latitude ??
      center?.lat ??
      center?.current_lat ??
      "",

    longitude:
      center?.longitude ??
      center?.lng ??
      center?.current_lng ??
      "",

    locationAccuracyM:
      center?.location_accuracy_m ??
      center?.locationAccuracyM ??
      "",

    locationSource:
      center?.location_source ??
      center?.locationSource ??
      center?.location_source_type ??
      "REGISTERED",

    locationUpdatedAt:
      center?.location_updated_at ??
      center?.locationUpdatedAt ??
      "",

    managerName:
      center?.manager_name ||
      "",

    managerPhone:
      center?.manager_phone ||
      "",

    capacity:
      center?.capacity ||
      20,

    active:
      Number(
        center?.active ??
        1
      ) === 1,

    openingTime:
      center?.opening_time ||
      "09:00",

    closingTime:
      center?.closing_time ||
      "17:00",

  };

}


function getCropCounts(
  bookings
) {

  const map =
    {};


  bookings.forEach(
    (
      booking
    ) => {

      const crop =
        booking.crop ||
        "unknown";


      map[crop] =
        (
          map[crop] ||
          0
        ) +
        1;

    }
  );


  return Object.entries(
    map
  )
    .map(
      (
        [
          crop,
          count,
        ]
      ) => ({
        crop,
        count,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.count -
        a.count
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
    labels[
      language
    ]?.[
      status
    ] ||
    labels.en[
      status
    ] ||
    status ||
    "Unknown"
  );

}


function formatTime(
  value
) {

  if (
    !value
  ) {
    return "—";
  }


  const [
    hourPart,
    minutePart = "00",
  ] =
    String(
      value
    ).split(":");


  const hour =
    Number(
      hourPart
    );


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


  return `${displayHour}:${minutePart} ${suffix}`;

}


function CenterLoading() {

  return (

    <div className="admin-center-loading-grid">

      {[
        1,
        2,
        3,
        4,
        5,
        6,
      ].map(
        (
          item
        ) => (

          <div
            key={
              item
            }
            className="admin-center-loading-card"
          >

            <span />

            <div>

              <span />
              <span />
              <span />

            </div>

            <span />
            <span />

          </div>

        )
      )}

    </div>

  );

}


/* =========================================================
   COPY
========================================================= */

function getCentersCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Procurement Centers",

      subtitle:
        "Monitor and manage procurement center capacity, staff and activity.",

      eyebrow:
        "CENTER MANAGEMENT",

      heading:
        "Control every procurement center.",

      description:
        "Create centers, update operating details, monitor capacity and review live booking activity from one administrative workspace.",

      liveData:
        "LIVE DATA",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      addCenter:
        "Add Center",

      edit:
        "Edit",

      editCenter:
        "EDIT CENTER",

      addTitle:
        "Create a procurement center",

      editTitle:
        "Edit procurement center",

      addDescription:
        "Add a center that farmers can use for future bookings.",

      editDescription:
        "Update this center's information and operating controls.",

      basicInformation:
        "Basic information",

      centerId:
        "Center ID",

      centerName:
        "Center name",

      locationInformation:
        "Location information",

      state:
        "State",

      district:
        "District",

      mandal:
        "Mandal",

      village:
        "Village",

      address:
        "Address",

      managerInformation:
        "Manager information",

      managerName:
        "Manager name",

      managerPhone:
        "Manager phone",

      operations:
        "Operations",

      capacity:
        "Daily slot capacity",

      openingTime:
        "Opening time",

      closingTime:
        "Closing time",

      centerActive:
        "Center is active",

      centerInactive:
        "Center is inactive",

      centerActiveText:
        "Farmers can use this center for new bookings.",

      centerInactiveText:
        "Do not use this center for new bookings.",

      saveChanges:
        "Save Changes",

      createCenter:
        "Create Center",

      saving:
        "Saving...",

      cancel:
        "Cancel",

      updated:
        "Center updated successfully.",

      created:
        "Center created successfully.",

      saveError:
        "Unable to save the center.",

      connectionIssue:
        "Center data connection issue",

      retry:
        "Retry",

      totalCenters:
        "Total centers",

      activeCenters:
        "Active centers",

      activeBookings:
        "Active bookings",

      totalCapacity:
        "Total capacity",

      utilization:
        "Utilization",

      searchPlaceholder:
        "Search center, village, district, manager or ID...",

      allCenters:
        "All centers",

      activeOnly:
        "Active only",

      idleOnly:
        "Inactive only",

      clear:
        "Clear",

      active:
        "Active",

      idle:
        "Inactive",

      capacityUsage:
        "Capacity usage",

      used:
        "used",

      totalBookings:
        "Total bookings",

      topCrop:
        "Top crop",

      viewDetails:
        "View details",

      noCenters:
        "No centers found",

      noCentersText:
        "Create a procurement center or change your current filters.",

      footer:
        "Center capacity is calculated against current active bookings.",

      displayed:
        "displayed",

      centerProfile:
        "CENTER PROFILE",

      unnamedCenter:
        "Procurement Center",

      locationUnavailable:
        "Location not available",

      status:
        "Status",

      manager:
        "Manager",

      cropActivity:
        "Crop activity",

      noCropData:
        "No crop activity recorded yet.",

      recentActivity:
        "Recent booking activity",

      noRecentActivity:
        "No booking activity recorded yet.",

      operatingHours:
        "Operating hours",

      unknownFarmer:
        "Unknown farmer",

      close:
        "Close",

    },


    hi: {

      title:
        "खरीद केंद्र",

      subtitle:
        "खरीद केंद्र की क्षमता, स्टाफ और गतिविधि की निगरानी और प्रबंधन करें।",

      eyebrow:
        "केंद्र प्रबंधन",

      heading:
        "हर खरीद केंद्र को नियंत्रित करें।",

      description:
        "केंद्र बनाएं, संचालन विवरण अपडेट करें, क्षमता देखें और लाइव बुकिंग गतिविधि की समीक्षा करें।",

      liveData:
        "लाइव डेटा",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      addCenter:
        "केंद्र जोड़ें",

      edit:
        "संपादित करें",

      editCenter:
        "केंद्र संपादित करें",

      addTitle:
        "खरीद केंद्र बनाएं",

      editTitle:
        "खरीद केंद्र संपादित करें",

      addDescription:
        "भविष्य की बुकिंग के लिए नया केंद्र जोड़ें।",

      editDescription:
        "इस केंद्र की जानकारी और संचालन नियंत्रण अपडेट करें।",

      basicInformation:
        "मूल जानकारी",

      centerId:
        "केंद्र ID",

      centerName:
        "केंद्र का नाम",

      locationInformation:
        "स्थान की जानकारी",

      state:
        "राज्य",

      district:
        "जिला",

      mandal:
        "मंडल",

      village:
        "गांव",

      address:
        "पता",

      managerInformation:
        "प्रबंधक की जानकारी",

      managerName:
        "प्रबंधक का नाम",

      managerPhone:
        "प्रबंधक फोन",

      operations:
        "संचालन",

      capacity:
        "दैनिक स्लॉट क्षमता",

      openingTime:
        "खुलने का समय",

      closingTime:
        "बंद होने का समय",

      centerActive:
        "केंद्र सक्रिय है",

      centerInactive:
        "केंद्र निष्क्रिय है",

      centerActiveText:
        "किसान इस केंद्र का उपयोग नई बुकिंग के लिए कर सकते हैं।",

      centerInactiveText:
        "नई बुकिंग के लिए इस केंद्र का उपयोग न करें।",

      saveChanges:
        "बदलाव सहेजें",

      createCenter:
        "केंद्र बनाएं",

      saving:
        "सहेजा जा रहा है...",

      cancel:
        "रद्द करें",

      updated:
        "केंद्र सफलतापूर्वक अपडेट किया गया।",

      created:
        "केंद्र सफलतापूर्वक बनाया गया।",

      saveError:
        "केंद्र सहेजा नहीं जा सका।",

      connectionIssue:
        "केंद्र डेटा कनेक्शन समस्या",

      retry:
        "फिर कोशिश करें",

      totalCenters:
        "कुल केंद्र",

      activeCenters:
        "सक्रिय केंद्र",

      activeBookings:
        "सक्रिय बुकिंग",

      totalCapacity:
        "कुल क्षमता",

      utilization:
        "उपयोग",

      searchPlaceholder:
        "केंद्र, गांव, जिला, प्रबंधक या ID खोजें...",

      allCenters:
        "सभी केंद्र",

      activeOnly:
        "केवल सक्रिय",

      idleOnly:
        "केवल निष्क्रिय",

      clear:
        "साफ करें",

      active:
        "सक्रिय",

      idle:
        "निष्क्रिय",

      capacityUsage:
        "क्षमता उपयोग",

      used:
        "उपयोग",

      totalBookings:
        "कुल बुकिंग",

      topCrop:
        "मुख्य फसल",

      viewDetails:
        "विवरण देखें",

      noCenters:
        "कोई केंद्र नहीं मिला",

      noCentersText:
        "केंद्र बनाएं या वर्तमान फ़िल्टर बदलें।",

      footer:
        "केंद्र क्षमता की तुलना सक्रिय बुकिंग से की जाती है।",

      displayed:
        "दिखाए गए",

      centerProfile:
        "केंद्र प्रोफ़ाइल",

      unnamedCenter:
        "खरीद केंद्र",

      locationUnavailable:
        "स्थान उपलब्ध नहीं",

      status:
        "स्थिति",

      manager:
        "प्रबंधक",

      cropActivity:
        "फसल गतिविधि",

      noCropData:
        "अभी कोई फसल गतिविधि दर्ज नहीं है।",

      recentActivity:
        "हाल की बुकिंग गतिविधि",

      noRecentActivity:
        "अभी कोई बुकिंग गतिविधि दर्ज नहीं है।",

      operatingHours:
        "संचालन समय",

      unknownFarmer:
        "अज्ञात किसान",

      close:
        "बंद करें",

    },


    te: {

      title:
        "కొనుగోలు కేంద్రాలు",

      subtitle:
        "కొనుగోలు కేంద్రాల సామర్థ్యం, సిబ్బంది మరియు కార్యకలాపాలను పర్యవేక్షించి నిర్వహించండి.",

      eyebrow:
        "కేంద్ర నిర్వహణ",

      heading:
        "ప్రతి కొనుగోలు కేంద్రాన్ని నియంత్రించండి.",

      description:
        "కేంద్రాలను సృష్టించి, నిర్వహణ వివరాలను మార్చి, సామర్థ్యాన్ని పర్యవేక్షించి, లైవ్ బుకింగ్ కార్యకలాపాలను సమీక్షించండి.",

      liveData:
        "లైవ్ డేటా",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      addCenter:
        "కేంద్రాన్ని జోడించండి",

      edit:
        "ఎడిట్",

      editCenter:
        "కేంద్రాన్ని ఎడిట్ చేయండి",

      addTitle:
        "కొనుగోలు కేంద్రాన్ని సృష్టించండి",

      editTitle:
        "కొనుగోలు కేంద్రాన్ని ఎడిట్ చేయండి",

      addDescription:
        "భవిష్యత్ బుకింగ్‌ల కోసం కొత్త కేంద్రాన్ని జోడించండి.",

      editDescription:
        "ఈ కేంద్రం సమాచారం మరియు నిర్వహణ నియంత్రణలను మార్చండి.",

      basicInformation:
        "ప్రాథమిక సమాచారం",

      centerId:
        "కేంద్ర ID",

      centerName:
        "కేంద్రం పేరు",

      locationInformation:
        "స్థాన సమాచారం",

      state:
        "రాష్ట్రం",

      district:
        "జిల్లా",

      mandal:
        "మండలం",

      village:
        "గ్రామం",

      address:
        "చిరునామా",

      managerInformation:
        "మేనేజర్ సమాచారం",

      managerName:
        "మేనేజర్ పేరు",

      managerPhone:
        "మేనేజర్ ఫోన్",

      operations:
        "కార్యకలాపాలు",

      capacity:
        "రోజువారీ స్లాట్ సామర్థ్యం",

      openingTime:
        "తెరిచే సమయం",

      closingTime:
        "మూసే సమయం",

      centerActive:
        "కేంద్రం యాక్టివ్‌గా ఉంది",

      centerInactive:
        "కేంద్రం నిష్క్రియంగా ఉంది",

      centerActiveText:
        "రైతులు ఈ కేంద్రాన్ని కొత్త బుకింగ్‌ల కోసం ఉపయోగించవచ్చు.",

      centerInactiveText:
        "కొత్త బుకింగ్‌ల కోసం ఈ కేంద్రాన్ని ఉపయోగించవద్దు.",

      saveChanges:
        "మార్పులను సేవ్ చేయండి",

      createCenter:
        "కేంద్రాన్ని సృష్టించండి",

      saving:
        "సేవ్ చేస్తోంది...",

      cancel:
        "రద్దు చేయండి",

      updated:
        "కేంద్రం విజయవంతంగా అప్‌డేట్ చేయబడింది.",

      created:
        "కేంద్రం విజయవంతంగా సృష్టించబడింది.",

      saveError:
        "కేంద్రాన్ని సేవ్ చేయలేకపోయాము.",

      connectionIssue:
        "కేంద్ర డేటా కనెక్షన్ సమస్య",

      retry:
        "మళ్లీ ప్రయత్నించండి",

      totalCenters:
        "మొత్తం కేంద్రాలు",

      activeCenters:
        "యాక్టివ్ కేంద్రాలు",

      activeBookings:
        "యాక్టివ్ బుకింగ్‌లు",

      totalCapacity:
        "మొత్తం సామర్థ్యం",

      utilization:
        "వినియోగం",

      searchPlaceholder:
        "కేంద్రం, గ్రామం, జిల్లా, మేనేజర్ లేదా ID వెతకండి...",

      allCenters:
        "అన్ని కేంద్రాలు",

      activeOnly:
        "యాక్టివ్ మాత్రమే",

      idleOnly:
        "నిష్క్రియ మాత్రమే",

      clear:
        "క్లియర్",

      active:
        "యాక్టివ్",

      idle:
        "నిష్క్రియ",

      capacityUsage:
        "సామర్థ్య వినియోగం",

      used:
        "ఉపయోగం",

      totalBookings:
        "మొత్తం బుకింగ్‌లు",

      topCrop:
        "ప్రధాన పంట",

      viewDetails:
        "వివరాలు చూడండి",

      noCenters:
        "కేంద్రాలు కనుగొనబడలేదు",

      noCentersText:
        "కేంద్రాన్ని సృష్టించండి లేదా ప్రస్తుత ఫిల్టర్‌లను మార్చండి.",

      footer:
        "కేంద్ర సామర్థ్యాన్ని ప్రస్తుత యాక్టివ్ బుకింగ్‌లతో పోల్చి లెక్కిస్తుంది.",

      displayed:
        "చూపబడుతున్నవి",

      centerProfile:
        "కేంద్ర ప్రొఫైల్",

      unnamedCenter:
        "కొనుగోలు కేంద్రం",

      locationUnavailable:
        "స్థానం అందుబాటులో లేదు",

      status:
        "స్థితి",

      manager:
        "మేనేజర్",

      cropActivity:
        "పంట కార్యకలాపం",

      noCropData:
        "ఇంకా పంట కార్యకలాపం నమోదు కాలేదు.",

      recentActivity:
        "ఇటీవలి బుకింగ్ కార్యకలాపం",

      noRecentActivity:
        "ఇంకా బుకింగ్ కార్యకలాపం నమోదు కాలేదు.",

      operatingHours:
        "పని వేళలు",

      unknownFarmer:
        "తెలియని రైతు",

      close:
        "మూసివేయండి",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default AdminCenters;