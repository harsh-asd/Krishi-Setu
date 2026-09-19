import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminLayout from "../../components/admin/AdminLayout";

import { useLanguage } from "../../translations/LanguageContext";


const API_URL =
  import.meta.env.VITE_API_URL;


function AdminPaymentIssues() {

  const [
    issues,
    setIssues,
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
  const {
  language,
} = useLanguage();

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
    updatingId,
    setUpdatingId,
  ] =
    useState(null);


  const loadIssues =
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

        }


        try {

          const response =
            await fetch(
              `${API_URL}/payment-issues`
            );


          const data =
            await response.json();


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Unable to load payment issues."
            );

          }


          setIssues(
            Array.isArray(
              data?.issues
            )
              ? data.issues
              : []
          );


          setError("");


        } catch (
          issueError
        ) {

          console.error(
            "Admin payment issues:",
            issueError
          );


          setError(
            issueError?.message ||
            "Unable to load payment issues."
          );


        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      []
    );


  useEffect(
    () => {

      loadIssues();


      const timer =
        setInterval(
          () =>
            loadIssues(),
          5000
        );


      return () =>
        clearInterval(
          timer
        );

    },
    [
      loadIssues,
    ]
  );


  const filteredIssues =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return [
          ...issues,
        ]
          .filter(
            (
              issue
            ) => {

              if (
                filter !==
                  "ALL" &&
                String(
                  issue.status ||
                  ""
                ).toUpperCase() !==
                  filter
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
                  issue.id,
                  issue.booking_id,
                  issue.token,
                  issue.farmer_name,
                  issue.farmer_phone,
                  issue.message,
                  issue.status,
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
        issues,
        search,
        filter,
      ]
    );


  const openCount =
    issues.filter(
      (
        issue
      ) =>
        String(
          issue.status ||
          "OPEN"
        ).toUpperCase() ===
        "OPEN"
    ).length;


  const resolvedCount =
    issues.filter(
      (
        issue
      ) =>
        String(
          issue.status ||
          ""
        ).toUpperCase() ===
        "RESOLVED"
    ).length;


  async function updateIssue(
    issue,
    status
  ) {

    if (
      updatingId
    ) {

      return;

    }


    setUpdatingId(
      issue.id
    );


    try {

      const response =
        await fetch(
          `${API_URL}/payment-issues/${encodeURIComponent(
            issue.id
          )}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
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
          "Unable to update payment issue."
        );

      }


      await loadIssues(
        true
      );


    } catch (
      updateError
    ) {

      console.error(
        "Update payment issue:",
        updateError
      );


      setError(
        updateError?.message ||
        "Unable to update payment issue."
      );


    } finally {

      setUpdatingId(
        null
      );

    }

  }


  return (

    <AdminLayout
      title="Payment Issues"
      subtitle="Review and resolve payment problems reported by farmers."
    >

      <div className="admin-payment-issues-page">


        {/* HEADER */}

        <section className="admin-payment-issues-hero">

          <div>

            <Link
              to="/admin/queue"
              className="admin-payment-issues-back"
            >

              <ArrowLeft
                size={15}
              />

              Back to Queue

            </Link>


            <span className="admin-page-eyebrow">

              PAYMENT SUPPORT

            </span>


            <h2>

              Farmer payment issues

            </h2>


            <p>

              Review complaints, open the related booking,
              and resolve the issue after investigation.

            </p>

          </div>


          <button
            type="button"
            className="admin-payment-issues-refresh"
            onClick={() =>
              loadIssues(
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
                ? "Refreshing..."
                : "Refresh"
            }

          </button>

        </section>



        {/* ERROR */}

        {
          error && (

            <div className="admin-payment-issues-error">

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
                  size={15}
                />

              </button>

            </div>

          )
        }



        {/* STATS */}

        <section className="admin-payment-issues-stats">

          <IssueStat
            icon={
              <CircleHelp
                size={19}
              />
            }
            label="Open issues"
            value={
              openCount
            }
            tone="orange"
          />


          <IssueStat
            icon={
              <CheckCircle2
                size={19}
              />
            }
            label="Resolved"
            value={
              resolvedCount
            }
            tone="green"
          />


          <IssueStat
            icon={
              <AlertTriangle
                size={19}
              />
            }
            label="Total reports"
            value={
              issues.length
            }
            tone="blue"
          />

        </section>



        {/* FILTER */}

        <section className="admin-payment-issues-filter">

          <div className="admin-payment-issues-search">

            <Search
              size={17}
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
              placeholder="Search token, farmer or issue..."
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
              All issues
            </option>

            <option value="OPEN">
              Open
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

          </select>

        </section>



        {/* LIST */}

        <section className="admin-payment-issues-list-card">

          <div className="admin-payment-issues-list-header">

            <div>

              <span className="admin-page-eyebrow">

                REPORTS

              </span>


              <h3>

                {
                  filteredIssues.length
                }

                {" "}
                payment issues

              </h3>

            </div>

          </div>


          {
            loading ? (

              <div className="admin-payment-issues-state">

                <RefreshCw
                  size={24}
                  className="admin-refresh-spin"
                />


                <strong>
                  Loading payment issues...
                </strong>

              </div>

            ) : filteredIssues.length ===
                0 ? (

              <div className="admin-payment-issues-state">

                <CheckCircle2
                  size={27}
                />


                <strong>
                  No payment issues found
                </strong>


                <span>

                  New farmer payment complaints
                  will appear here.

                </span>

              </div>

            ) : (

              <div className="admin-payment-issues-list">

                {
                  filteredIssues.map(
                    (
                      issue
                    ) => {

                      const status =
                        String(
                          issue.status ||
                          "OPEN"
                        ).toUpperCase();


                      const isOpen =
                        status ===
                        "OPEN";


                      return (

                        <article
                          key={
                            issue.id
                          }
                          className="admin-payment-issue-row"
                        >

                          <div
                            className={
                              `admin-payment-issue-icon ${
                                isOpen
                                  ? "open"
                                  : "resolved"
                              }`
                            }
                          >

                            {
                              isOpen
                                ? (
                                  <AlertTriangle
                                    size={20}
                                  />
                                )
                                : (
                                  <CheckCircle2
                                    size={20}
                                  />
                                )
                            }

                          </div>


                          <div className="admin-payment-issue-main">

                            <div className="admin-payment-issue-title">

                              <strong>

                                Token #
                                {
                                  issue.token ||
                                  issue.booking_id ||
                                  "—"
                                }

                              </strong>


                              <IssueStatus
                                status={
                                  status
                                }
                              />

                            </div>


                            <div className="admin-payment-issue-farmer">

                              <UserRound
                                size={14}
                              />


                              <span>

                                {
                                  issue.farmer_name ||
                                  "Unknown farmer"
                                }

                              </span>


                              {
                                issue.farmer_phone && (

                                  <span>

                                    ·
                                    {" "}
                                    {
                                      issue.farmer_phone
                                    }

                                  </span>

                                )
                              }

                            </div>


                            <p>

                              {
                                issue.message
                              }

                            </p>


                            <small>

                              Reported{" "}

                              {
                                formatDateTime(
                                  issue.created_at
                                )
                              }

                            </small>

                          </div>


                          <div className="admin-payment-issue-actions">

                            <Link
                              to="/admin/payments"
                              className="admin-payment-issue-view"
                            >

                              View booking

                              <ChevronRight
                                size={15}
                              />

                            </Link>


                            {
                              isOpen ? (

                                <button
                                  type="button"
                                  className="admin-payment-issue-resolve"
                                  onClick={() =>
                                    updateIssue(
                                      issue,
                                      "RESOLVED"
                                    )
                                  }
                                  disabled={
                                    updatingId ===
                                    issue.id
                                  }
                                >

                                  {
                                    updatingId ===
                                    issue.id
                                      ? (
                                        <RefreshCw
                                          size={14}
                                          className="admin-refresh-spin"
                                        />
                                      )
                                      : (
                                        <CheckCircle2
                                          size={14}
                                        />
                                      )
                                  }


                                  Resolve

                                </button>

                              ) : (

                                <button
                                  type="button"
                                  className="admin-payment-issue-reopen"
                                  onClick={() =>
                                    updateIssue(
                                      issue,
                                      "OPEN"
                                    )
                                  }
                                  disabled={
                                    updatingId ===
                                    issue.id
                                  }
                                >

                                  Reopen

                                </button>

                              )
                            }

                          </div>

                        </article>

                      );

                    }
                  )
                }

              </div>

            )
          }

        </section>

      </div>

    </AdminLayout>

  );

}


/* =========================================================
   COMPONENTS
========================================================= */

function IssueStat({
  icon,
  label,
  value,
  tone,
}) {

  return (

    <div
      className={
        `admin-payment-issue-stat ${tone}`
      }
    >

      <div className="admin-payment-issue-stat-icon">

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


function IssueStatus({
  status,
}) {

  return (

    <span
      className={
        `admin-payment-issue-status ${
          status ===
          "RESOLVED"
            ? "resolved"
            : "open"
        }`
      }
    >

      {
        status ===
        "RESOLVED"
          ? "Resolved"
          : "Open"
      }

    </span>

  );

}


/* =========================================================
   HELPERS
========================================================= */

function formatDateTime(
  value
) {

  if (
    !value
  ) {

    return "—";

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

    return value;

  }


  return date.toLocaleString(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",

    }
  );

}


export default AdminPaymentIssues;