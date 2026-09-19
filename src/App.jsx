import { useEffect } from "react";

import {
  Routes,
  Route,
} from "react-router";

import Landing from "./pages/Landing";

import FarmerLogin from "./pages/farmer/FarmerLogin";
import FarmerRegister from "./pages/farmer/FarmerRegister";
import FarmerHome from "./pages/farmer/FarmerHome";
import FarmerBook from "./pages/farmer/FarmerBook";
import FarmerToken from "./pages/farmer/FarmerToken";
import FarmerTransport from "./pages/farmer/FarmerTransport";
import FarmerLogistics from "./pages/farmer/FarmerLogistics";
import TransportRequest from "./pages/farmer/TransportRequest";
import FarmerTransportTracking from "./pages/farmer/FarmerTransportTracking";
import FarmerHelp from "./pages/farmer/FarmerHelp";
import FarmerHistory from "./pages/farmer/FarmerHistory";
import FarmerPayments from "./pages/farmer/FarmerPayments";
import FarmerSettings from "./pages/farmer/FarmerSettings";

import TransporterRegister from "./pages/transporter/TransporterRegister";
import TransporterLogin from "./pages/transporter/TransporterLogin";
import TransporterDashboard from "./pages/transporter/TransporterDashboard";
import TransporterJobs from "./pages/transporter/TransporterJobs";
import TransporterTrip from "./pages/transporter/TransporterTrip";
import TransporterEarnings from "./pages/transporter/TransporterEarnings";
import TransporterProfile from "./pages/transporter/TransporterProfile";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminQueue from "./pages/admin/AdminQueue";
import AdminIoT from "./pages/admin/AdminIoT";
import AdminWeighing from "./pages/admin/AdminWeighing";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/AdminReports";
import AdminFarmers from "./pages/admin/AdminFarmers";
import AdminCenters from "./pages/admin/AdminCenters";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProcurement from "./pages/admin/AdminProcurement";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminPaymentIssues from "./pages/admin/AdminPaymentIssues";
import AdminTransportDashboard from "./pages/admin/AdminTransportDashboard";

import PageTransition from "./components/PageTransition";
import VoiceAssistant from "./components/VoiceAssistant";


/* =========================================================
   GLOBAL UI INTERACTION POLICY
   =========================================================
   This is intentionally centralized in App.jsx because every
   Farmer / Transporter / Admin route passes through this root.

   Responsibilities:
   1. Lock document scrolling when a modal/drawer is open.
   2. Keep wheel scrolling inside the active modal/drawer.
   3. Keep sidebar wheel scrolling inside sidebar navigation.
   4. Prevent wheel-scroll leakage into the background.
   5. Close modal/drawer when backdrop is clicked.
   6. Close modal/drawer with Escape.
   7. Force overlays to be viewport anchored.
   8. Keep modal opening near the top of the viewport.
   9. Apply full-screen backdrop blur.
========================================================= */


/* ---------------------------------------------------------
   OVERLAY DISCOVERY
--------------------------------------------------------- */

const KS_OVERLAY_SELECTORS = [
  ".sms-modal-backdrop",
  ".admin-sidebar-overlay",
  ".admin-booking-drawer-overlay",
  ".admin-farmer-drawer-overlay",
  ".admin-center-drawer-overlay",
  ".admin-center-form-overlay",
  ".admin-payment-form-overlay",
  ".token-payment-modal-backdrop",
  ".ft-modal-bg",
  ".at-modal-backdrop",
  ".modal-backdrop",
  ".modal-overlay",
  ".drawer-overlay",
];

const KS_NON_CLOSING_OVERLAYS = new Set([
  "booking-confirmed-overlay",
]);

const KS_IGNORE_OVERLAYS = new Set([
  "farmer-notification-overlay",
  "page-transition-overlay",
]);


/* ---------------------------------------------------------
   PANEL TYPES
--------------------------------------------------------- */

const KS_PANEL_SELECTORS = [
  ".admin-center-form-modal",
  ".admin-payment-form-modal",
  ".admin-booking-drawer",
  ".admin-farmer-drawer",
  ".admin-center-drawer",
  ".token-payment-modal",
  ".ft-modal",
  ".at-modal",
  ".sms-modal",
  ".modal",
  ".dialog",
];


/* ---------------------------------------------------------
   VISIBILITY
--------------------------------------------------------- */

function ksIsVisible(element) {
  if (!element) {
    return false;
  }

  const style =
    window.getComputedStyle(
      element
    );

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(
      style.opacity || 1
    ) > 0 &&
    element.getBoundingClientRect()
      .width > 0 &&
    element.getBoundingClientRect()
      .height > 0
  );
}


/* ---------------------------------------------------------
   FIND ALL ACTIVE OVERLAYS
--------------------------------------------------------- */

function ksGetOpenOverlays() {
  const candidateSet =
    new Set();

  KS_OVERLAY_SELECTORS.forEach(
    (selector) => {
      document
        .querySelectorAll(
          selector
        )
        .forEach(
          (element) =>
            candidateSet.add(
              element
            )
        );
    }
  );

  /*
     Also detect future modal/overlay
     implementations without requiring
     another App.jsx change.
  */
  document
    .querySelectorAll(
      "[class*='overlay'],[class*='backdrop'],[class*='modal-bg']"
    )
    .forEach(
      (element) =>
        candidateSet.add(
          element
        )
    );

  return Array.from(
    candidateSet
  ).filter(
    (element) => {
      if (
        !ksIsVisible(
          element
        )
      ) {
        return false;
      }

      const classes =
        typeof element.className ===
        "string"
          ? element.className.split(
              /\s+/
            )
          : [];

      if (
        classes.some(
          (name) =>
            KS_IGNORE_OVERLAYS.has(
              name
            )
        )
      ) {
        return false;
      }

      const style =
        window.getComputedStyle(
          element
        );

      return (
        style.position ===
          "fixed" ||
        (
          style.position ===
            "absolute" &&
          classes.some(
            (name) =>
              /overlay|backdrop|modal-bg/i.test(
                name
              )
          )
        )
      );
    }
  );
}


/* ---------------------------------------------------------
   DETERMINE WHETHER BACKGROUND MUST BE LOCKED
--------------------------------------------------------- */

function ksHasClosingOverlay() {
  return ksGetOpenOverlays()
    .some(
      (overlay) => {
        const classes =
          typeof overlay.className ===
          "string"
            ? overlay.className.split(
                /\s+/
              )
            : [];

        return !classes.some(
          (name) =>
            KS_NON_CLOSING_OVERLAYS.has(
              name
            )
        );
      }
    );
}


/* ---------------------------------------------------------
   FIND NEAREST INNER SCROLLER
--------------------------------------------------------- */

function ksFindScrollableElement(
  startNode,
  boundary
) {
  let node =
    startNode instanceof Element
      ? startNode
      : startNode?.parentElement ||
        null;

  while (
    node &&
    node !== boundary
  ) {
    const style =
      window.getComputedStyle(
        node
      );

    const canScrollY =
      /(auto|scroll|overlay)/.test(
        style.overflowY
      ) &&
      node.scrollHeight >
        node.clientHeight + 1;

    const canScrollX =
      /(auto|scroll|overlay)/.test(
        style.overflowX
      ) &&
      node.scrollWidth >
        node.clientWidth + 1;

    if (
      canScrollY ||
      canScrollX
    ) {
      return node;
    }

    node =
      node.parentElement;
  }

  if (
    boundary instanceof HTMLElement
  ) {
    const style =
      window.getComputedStyle(
        boundary
      );

    if (
      /(auto|scroll|overlay)/.test(
        style.overflowY
      ) &&
      boundary.scrollHeight >
        boundary.clientHeight + 1
    ) {
      return boundary;
    }
  }

  return null;
}


/* ---------------------------------------------------------
   FIND CLOSE / CANCEL BUTTON
--------------------------------------------------------- */

function ksFindCloseButton(
  overlay
) {
  if (!overlay) {
    return null;
  }

  const selectors = [
    "[data-modal-close]",
    "[aria-label*='close' i]",
    "[aria-label*='cancel' i]",
    "button[class*='close']",
    "button[class*='cancel']",
    "button[class*='dismiss']",
  ];

  for (
    const selector of selectors
  ) {
    const button =
      overlay.querySelector(
        selector
      );

    if (
      button instanceof
        HTMLButtonElement &&
      !button.disabled
    ) {
      return button;
    }
  }

  const buttons =
    Array.from(
      overlay.querySelectorAll(
        "button"
      )
    );

  return (
    buttons.find(
      (button) =>
        /cancel|close|keep unchanged|keep request|dismiss/i.test(
          button.textContent ||
            ""
        )
    ) || null
  );
}


/* ---------------------------------------------------------
   IDENTIFY BACKDROP ROOT
--------------------------------------------------------- */

function ksGetBackdropRoot(
  target
) {
  if (
    !(target instanceof Element)
  ) {
    return null;
  }

  const overlays =
    ksGetOpenOverlays();

  for (
    const overlay of overlays
  ) {
    if (
      target === overlay ||
      overlay.contains(target)
    ) {
      const insidePanel =
        target.closest(
          KS_PANEL_SELECTORS.join(
            ","
          )
        );

      /*
         If the click is outside the
         panel but inside the overlay,
         this is a backdrop click.
      */
      if (
        !insidePanel ||
        insidePanel === overlay
      ) {
        return overlay;
      }
    }
  }

  return null;
}


/* ---------------------------------------------------------
   BODY SCROLL STATE
--------------------------------------------------------- */

let ksSavedBodyStyles =
  null;


/* ---------------------------------------------------------
   LOCK DOCUMENT
--------------------------------------------------------- */

function ksLockDocument() {
  const body =
    document.body;

  const html =
    document.documentElement;

  if (
    !body ||
    !html
  ) {
    return;
  }

  if (
    body.dataset
      .ksScrollLocked ===
    "true"
  ) {
    return;
  }

  const scrollY =
    window.scrollY ||
    window.pageYOffset ||
    0;

  const scrollX =
    window.scrollX ||
    window.pageXOffset ||
    0;

  const scrollbarWidth =
    window.innerWidth -
    html.clientWidth;

  ksSavedBodyStyles = {
    position:
      body.style.position,

    top:
      body.style.top,

    left:
      body.style.left,

    right:
      body.style.right,

    width:
      body.style.width,

    overflow:
      body.style.overflow,

    paddingRight:
      body.style.paddingRight,
  };

  body.dataset.ksScrollLocked =
    "true";

  body.dataset.ksScrollY =
    String(scrollY);

  body.dataset.ksScrollX =
    String(scrollX);

  body.style.setProperty(
    "padding-right",
    scrollbarWidth > 0
      ? `${scrollbarWidth}px`
      : "",
    "important"
  );

  body.style.setProperty(
    "position",
    "fixed",
    "important"
  );

  body.style.setProperty(
    "top",
    `-${scrollY}px`,
    "important"
  );

  body.style.setProperty(
    "left",
    `-${scrollX}px`,
    "important"
  );

  body.style.setProperty(
    "right",
    "0",
    "important"
  );

  body.style.setProperty(
    "width",
    "100%",
    "important"
  );

  body.style.setProperty(
    "overflow",
    "hidden",
    "important"
  );

  html.style.setProperty(
    "overflow",
    "hidden",
    "important"
  );

  html.style.setProperty(
    "height",
    "100%",
    "important"
  );
}


/* ---------------------------------------------------------
   UNLOCK DOCUMENT
--------------------------------------------------------- */

function ksUnlockDocument() {
  const body =
    document.body;

  const html =
    document.documentElement;

  if (
    !body ||
    !html
  ) {
    return;
  }

  if (
    body.dataset
      .ksScrollLocked !==
    "true"
  ) {
    return;
  }

  const scrollY =
    Number(
      body.dataset.ksScrollY ||
        0
    );

  const scrollX =
    Number(
      body.dataset.ksScrollX ||
        0
    );

  const previous =
    ksSavedBodyStyles ||
    {};

  [
    [
      "position",
      previous.position ||
        "",
    ],

    [
      "top",
      previous.top ||
        "",
    ],

    [
      "left",
      previous.left ||
        "",
    ],

    [
      "right",
      previous.right ||
        "",
    ],

    [
      "width",
      previous.width ||
        "",
    ],

    [
      "overflow",
      previous.overflow ||
        "",
    ],

    [
      "padding-right",
      previous.paddingRight ||
        "",
    ],
  ].forEach(
    ([property, value]) => {
      body.style.setProperty(
        property,
        value
      );
    }
  );

  html.style.removeProperty(
    "overflow"
  );

  html.style.removeProperty(
    "height"
  );

  delete body.dataset
    .ksScrollLocked;

  delete body.dataset
    .ksScrollY;

  delete body.dataset
    .ksScrollX;

  ksSavedBodyStyles =
    null;

  window.scrollTo(
    scrollX,
    scrollY
  );
}


/* ---------------------------------------------------------
   FORCE OVERLAYS TO VIEWPORT
--------------------------------------------------------- */

/*
   Ancestors such as PageTransition can create a containing block
   for `position: fixed` descendants through transform / will-change.
   That makes a modal look clipped or stuck to the page.

   We temporarily neutralize ONLY those containing-block properties
   while an overlay is open, then restore the exact original inline
   style when the overlay closes.
*/
const ksOverlayAncestorStyleSnapshots = new Map();

function ksNeutralizeOverlayAncestors(overlay) {
  if (
    !(overlay instanceof HTMLElement)
  ) {
    return;
  }

  let ancestor =
    overlay.parentElement;

  while (
    ancestor &&
    ancestor !== document.body &&
    ancestor !== document.documentElement
  ) {
    const computed =
      window.getComputedStyle(
        ancestor
      );

    const createsContainingBlock =
      computed.transform !== "none" ||
      computed.perspective !== "none" ||
      computed.filter !== "none" ||
      computed.backdropFilter !== "none" ||
      computed.webkitBackdropFilter !== "none" ||
      computed.contain !== "none" ||
      computed.contentVisibility === "auto" ||
      computed.willChange
        .split(",")
        .some((value) =>
          /transform|filter|perspective|contain/i.test(
            value
          )
        );

    if (createsContainingBlock) {
      if (
        !ksOverlayAncestorStyleSnapshots.has(
          ancestor
        )
      ) {
        ksOverlayAncestorStyleSnapshots.set(
          ancestor,
          ancestor.getAttribute("style")
        );
      }

      [
        ["transform", "none"],
        ["filter", "none"],
        ["backdrop-filter", "none"],
        ["-webkit-backdrop-filter", "none"],
        ["perspective", "none"],
        ["will-change", "auto"],
        ["contain", "none"],
        ["content-visibility", "visible"],
      ].forEach(
        ([property, value]) => {
          ancestor.style.setProperty(
            property,
            value,
            "important"
          );
        }
      );
    }

    ancestor =
      ancestor.parentElement;
  }
}

function ksRestoreOverlayAncestors() {
  ksOverlayAncestorStyleSnapshots.forEach(
    (originalStyle, element) => {
      if (
        !(element instanceof HTMLElement)
      ) {
        return;
      }

      if (
        originalStyle === null
      ) {
        element.removeAttribute("style");
      } else {
        element.setAttribute(
          "style",
          originalStyle
        );
      }
    }
  );

  ksOverlayAncestorStyleSnapshots.clear();
}


/* ---------------------------------------------------------
   FORCE OVERLAYS TO VIEWPORT
--------------------------------------------------------- */

function ksNormaliseOverlayViewport() {
  const openOverlays =
    ksGetOpenOverlays();

  /*
     If an overlay is open, remove containing-block behaviour
     from its route/page-transition ancestors before applying
     viewport geometry.
  */
  openOverlays.forEach(
    (overlay) => {
      if (
        !(overlay instanceof
          HTMLElement)
      ) {
        return;
      }

      ksNeutralizeOverlayAncestors(
        overlay
      );

      const classNames =
        typeof overlay.className ===
        "string"
          ? overlay.className.split(
              /\s+/
            )
          : [];

      const isSidebarOverlay =
        classNames.includes(
          "admin-sidebar-overlay"
        );

      const isDrawer =
        classNames.some(
          (name) =>
            /drawer/i.test(
              name
            )
        );

      /*
         IMPORTANT:
         Do not force modal overlays to `align-items:flex-start`.
         That was causing tall dialogs to open against the top edge
         and appear clipped when their content exceeded the viewport.

         Regular dialogs are centered in the available viewport.
         Their own panel is responsible for scrolling.
      */
      const important = {
        position: "fixed",
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
        width: "100vw",
        height: "100dvh",
        "max-height": "100dvh",
        margin: "0",
        "box-sizing": "border-box",
        overflow: "hidden",
        "overscroll-behavior":
          "none",
        "pointer-events":
          "auto",
        "z-index":
          isSidebarOverlay
            ? "900"
            : "50000",
        background:
          isSidebarOverlay
            ? "rgba(18, 38, 46, 0.28)"
            : "rgba(18, 38, 46, 0.42)",
        "backdrop-filter":
          isSidebarOverlay
            ? "blur(3px)"
            : "blur(9px)",
        "-webkit-backdrop-filter":
          isSidebarOverlay
            ? "blur(3px)"
            : "blur(9px)",
        isolation: "isolate",
      };

      Object.entries(
        important
      ).forEach(
        ([property, value]) => {
          overlay.style.setProperty(
            property,
            value,
            "important"
          );
        }
      );

      /*
         Regular modal overlays:
         - full viewport
         - center the panel
         - leave safe space around it
         - never let the background page scroll
      */
      if (
        !isDrawer &&
        !isSidebarOverlay
      ) {
        [
          ["display", "flex"],
          [
            "align-items",
            "center",
          ],
          [
            "justify-content",
            "center",
          ],
          [
            "padding",
            "24px",
          ],
        ].forEach(
          ([property, value]) => {
            overlay.style.setProperty(
              property,
              value,
              "important"
            );
          }
        );
      }

      /*
         Drawer overlays remain drawer-style.
      */
      if (isDrawer) {
        overlay.style.setProperty(
          "display",
          "block",
          "important"
        );
      }

      /*
         Find the actual modal/drawer panel.

         Drawers may be siblings of their backdrop, so never rely
         only on overlay.querySelector(...).
      */
      const panelCandidates = [];

      KS_PANEL_SELECTORS.forEach(
        (selector) => {
          document
            .querySelectorAll(
              selector
            )
            .forEach(
              (panel) => {
                if (
                  panel instanceof
                    HTMLElement &&
                  ksIsVisible(panel)
                ) {
                  panelCandidates.push(
                    panel
                  );
                }
              }
            );
        }
      );

      panelCandidates.forEach(
        (panel) => {
          const isDrawerPanel =
            panel.matches(
              ".admin-booking-drawer, .admin-farmer-drawer, .admin-center-drawer"
            );

          const panelStyles =
            isDrawerPanel
              ? [
                  [
                    "position",
                    "fixed",
                  ],
                  [
                    "top",
                    "0",
                  ],
                  [
                    "right",
                    "0",
                  ],
                  [
                    "bottom",
                    "0",
                  ],
                  [
                    "left",
                    "auto",
                  ],
                  [
                    "height",
                    "100dvh",
                  ],
                  [
                    "max-height",
                    "100dvh",
                  ],
                  [
                    "margin-left",
                    "0",
                  ],
                  [
                    "margin-right",
                    "0",
                  ],
                  [
                    "overflow-x",
                    "hidden",
                  ],
                  [
                    "overflow-y",
                    "auto",
                  ],
                  [
                    "overscroll-behavior",
                    "contain",
                  ],
                  [
                    "-webkit-overflow-scrolling",
                    "touch",
                  ],
                  [
                    "touch-action",
                    "pan-y",
                  ],
                  [
                    "z-index",
                    "50001",
                  ],
                ]
              : [
                  [
                    "position",
                    "relative",
                  ],
                  [
                    "margin-left",
                    "auto",
                  ],
                  [
                    "margin-right",
                    "auto",
                  ],
                  [
                    "max-height",
                    "calc(100dvh - 48px)",
                  ],
                  [
                    "min-height",
                    "0",
                  ],
                  [
                    "overflow-y",
                    "auto",
                  ],
                  [
                    "overflow-x",
                    "hidden",
                  ],
                  [
                    "overscroll-behavior",
                    "contain",
                  ],
                  [
                    "-webkit-overflow-scrolling",
                    "touch",
                  ],
                  [
                    "touch-action",
                    "pan-y",
                  ],
                ];

          panelStyles.forEach(
            ([property, value]) => {
              panel.style.setProperty(
                property,
                value,
                "important"
              );
            }
          );
        }
      );
    }
  );

  /*
     If React removed the overlay during this sync, restore any
     containing-block styles we temporarily changed.
  */
  if (
    openOverlays.length === 0 &&
    ksOverlayAncestorStyleSnapshots.size > 0
  ) {
    ksRestoreOverlayAncestors();
  }
}


/* ---------------------------------------------------------
   CLOSE FROM BACKDROP
--------------------------------------------------------- */

function ksCloseFromBackdrop(
  overlay
) {
  if (!overlay) {
    return false;
  }

  const closeButton =
    ksFindCloseButton(
      overlay
    );

  if (closeButton) {
    closeButton.click();
    return true;
  }

  /*
     Many components already attach
     their own click handler directly
     to the backdrop.
  */
  overlay.dispatchEvent(
    new MouseEvent(
      "click",
      {
        bubbles: true,
        cancelable: true,
        view: window,
      }
    )
  );

  return true;
}


/* =========================================================
   GLOBAL POLICY HOOK
========================================================= */

function useKrishiSetuGlobalInteractionPolicy() {
  useEffect(() => {
    let locked = false;

    const sync = () => {
      ksNormaliseOverlayViewport();

      const shouldLock =
        ksHasClosingOverlay();

      if (
        shouldLock &&
        !locked
      ) {
        ksLockDocument();
        locked = true;
      }

      if (
        !shouldLock &&
        locked
      ) {
        ksUnlockDocument();
        locked = false;
      }
    };


    /* -----------------------------------------------------
       WATCH REACT DOM CHANGES
    ----------------------------------------------------- */

    const observer =
      new MutationObserver(
        () => {
          window.requestAnimationFrame(
            sync
          );
        }
      );

    observer.observe(
      document.body,
      {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "aria-hidden",
          "open",
        ],
      }
    );


    /* -----------------------------------------------------
       BACKDROP CLICK
    ----------------------------------------------------- */

    const handlePointerDown =
      (event) => {
        const target =
          event.target;

        if (
          !(
            target instanceof
            Element
          )
        ) {
          return;
        }

        const overlay =
          ksGetBackdropRoot(
            target
          );

        if (!overlay) {
          return;
        }

        const classes =
          typeof overlay.className ===
          "string"
            ? overlay.className.split(
                /\s+/
              )
            : [];

        if (
          classes.some(
            (name) =>
              KS_NON_CLOSING_OVERLAYS.has(
                name
              )
          )
        ) {
          return;
        }

        /*
           Only a true backdrop click
           closes the component.

           Clicking inside the actual
           modal content does nothing.
        */
        if (
          target === overlay
        ) {
          event.preventDefault();
          event.stopPropagation();

          ksCloseFromBackdrop(
            overlay
          );
        }
      };


    /* -----------------------------------------------------
       WHEEL CONTROL
    ----------------------------------------------------- */

    const handleWheel =
      (event) => {
        const target =
          event.target;

        if (
          !(
            target instanceof
            Element
          )
        ) {
          return;
        }


        /* ================================================
           SIDEBAR
        ================================================ */

        const sidebar =
          target.closest(
            ".admin-sidebar"
          );

        if (sidebar) {
          const nav =
            sidebar.querySelector(
              ".admin-sidebar-nav"
            );

          /*
             The page NEVER receives the
             sidebar wheel event.
          */
          event.preventDefault();
          event.stopPropagation();

          if (
            nav instanceof
              HTMLElement &&
            nav.scrollHeight >
              nav.clientHeight +
                1
          ) {
            nav.scrollTop +=
              event.deltaY;

            if (
              event.deltaX !== 0 &&
              nav.scrollWidth >
                nav.clientWidth
            ) {
              nav.scrollLeft +=
                event.deltaX;
            }
          }

          return;
        }


        /* ================================================
           MODALS / DRAWERS
        ================================================ */

        const overlays =
          ksGetOpenOverlays();

        if (
          !overlays.length
        ) {
          return;
        }

        /*
           IMPORTANT:
           Booking drawers are siblings of the backdrop.
           Therefore checking only `overlay.contains(target)`
           incorrectly treated wheel events inside the drawer
           as background events and called preventDefault().

           First resolve an actual visible panel under the pointer.
        */
        const panel =
          KS_PANEL_SELECTORS
            .map((selector) =>
              Array.from(
                document.querySelectorAll(
                  selector
                )
              )
            )
            .flat()
            .find(
              (candidate) =>
                candidate instanceof
                  HTMLElement &&
                ksIsVisible(candidate) &&
                candidate.contains(target)
            );

        if (panel instanceof HTMLElement) {
          const scroller =
            ksFindScrollableElement(
              target,
              panel
            ) || panel;

          event.preventDefault();
          event.stopPropagation();

          if (scroller instanceof HTMLElement) {
            scroller.scrollTop +=
              event.deltaY;

            if (
              event.deltaX !== 0 &&
              scroller.scrollWidth >
                scroller.clientWidth
            ) {
              scroller.scrollLeft +=
                event.deltaX;
            }
          }

          return;
        }

        const overlay =
          overlays.find(
            (candidate) =>
              candidate.contains(
                target
              )
          );

        if (!overlay) {
          /*
             Overlay exists and the pointer is not inside a
             scrollable modal/drawer. Keep the background locked.
          */
          event.preventDefault();
          event.stopPropagation();

          return;
        }

        /*
           Wheel movement on the backdrop itself must never
           reach the page behind the overlay.
        */
        event.preventDefault();
        event.stopPropagation();
      };


    /* -----------------------------------------------------
       ESCAPE = CLOSE TOPMOST MODAL
    ----------------------------------------------------- */

    const handleKeyDown =
      (event) => {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }

        const overlays =
          ksGetOpenOverlays();

        for (
          let i =
            overlays.length -
            1;
          i >= 0;
          i -= 1
        ) {
          const overlay =
            overlays[i];

          const classes =
            typeof overlay.className ===
            "string"
              ? overlay.className.split(
                  /\s+/
                )
              : [];

          if (
            classes.some(
              (name) =>
                KS_NON_CLOSING_OVERLAYS.has(
                  name
                )
            )
          ) {
            continue;
          }

          if (
            ksCloseFromBackdrop(
              overlay
            )
          ) {
            event.preventDefault();
            event.stopPropagation();

            return;
          }
        }
      };


    /* -----------------------------------------------------
       CAPTURE PHASE
       This is important: wheel is intercepted BEFORE it
       can continue up to the document scroll container.
    ----------------------------------------------------- */

    document.addEventListener(
      "wheel",
      handleWheel,
      {
        capture: true,
        passive: false,
      }
    );

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
      true
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
      true
    );


    /* Initial state */
    sync();


    /* -----------------------------------------------------
       CLEANUP
    ----------------------------------------------------- */

    return () => {
      observer.disconnect();

      document.removeEventListener(
        "wheel",
        handleWheel,
        true
      );

      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
        true
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true
      );

      ksRestoreOverlayAncestors();

      if (locked) {
        ksUnlockDocument();
      }
    };
  }, []);
}


/* =========================================================
   PORTAL WRAPPERS
========================================================= */

function FarmerPortalPage({
  children,
}) {
  return (
    <>
      <VoiceAssistant />

      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}


function TransporterPortalPage({
  children,
}) {
  return (
    <>
      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}


function AdminPortalPage({
  children,
}) {
  return (
    <>
      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  useKrishiSetuGlobalInteractionPolicy();

  return (
    <Routes>

      {/* =========================
          LANDING
      ========================== */}

      <Route
        path="/"
        element={
          <Landing />
        }
      />


      {/* =========================
          FARMER PORTAL
      ========================== */}

      <Route
        path="/farmer/login"
        element={
          <PageTransition>
            <FarmerLogin />
          </PageTransition>
        }
      />

      <Route
        path="/farmer/register"
        element={
          <PageTransition>
            <FarmerRegister />
          </PageTransition>
        }
      />

      <Route
        path="/farmer/home"
        element={
          <FarmerPortalPage>
            <FarmerHome />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/book"
        element={
          <FarmerPortalPage>
            <FarmerBook />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/token"
        element={
          <FarmerPortalPage>
            <FarmerToken />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/transport"
        element={
          <FarmerPortalPage>
            <FarmerTransport />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/logistics"
        element={
          <FarmerPortalPage>
            <FarmerLogistics />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/transport/request"
        element={
          <FarmerPortalPage>
            <TransportRequest />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/transport/tracking/:id"
        element={
          <FarmerPortalPage>
            <FarmerTransportTracking />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/transport/tracking"
        element={
          <FarmerPortalPage>
            <FarmerLogistics />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/history"
        element={
          <FarmerPortalPage>
            <FarmerHistory />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/payments"
        element={
          <FarmerPortalPage>
            <FarmerPayments />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/settings"
        element={
          <FarmerPortalPage>
            <FarmerSettings />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/help"
        element={
          <FarmerPortalPage>
            <FarmerHelp />
          </FarmerPortalPage>
        }
      />


      {/* =========================
          TRANSPORTER PORTAL
      ========================== */}

      <Route
        path="/transporter/register"
        element={
          <PageTransition>
            <TransporterRegister />
          </PageTransition>
        }
      />

      <Route
        path="/transporter/login"
        element={
          <PageTransition>
            <TransporterLogin />
          </PageTransition>
        }
      />

      <Route
        path="/transporter/dashboard"
        element={
          <TransporterPortalPage>
            <TransporterDashboard />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/jobs"
        element={
          <TransporterPortalPage>
            <TransporterJobs />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/trip"
        element={
          <TransporterPortalPage>
            <TransporterTrip />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/trip/:id"
        element={
          <TransporterPortalPage>
            <TransporterTrip />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/earnings"
        element={
          <TransporterPortalPage>
            <TransporterEarnings />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/profile"
        element={
          <TransporterPortalPage>
            <TransporterProfile />
          </TransporterPortalPage>
        }
      />


      {/* =========================
          ADMIN PORTAL
      ========================== */}

      <Route
        path="/admin/login"
        element={
          <PageTransition>
            <AdminLogin />
          </PageTransition>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <PageTransition>
            <AdminDashboard />
          </PageTransition>
        }
      />

      <Route
        path="/admin/queue"
        element={
          <PageTransition>
            <AdminQueue />
          </PageTransition>
        }
      />

      <Route
        path="/admin/weighing"
        element={
          <PageTransition>
            <AdminWeighing />
          </PageTransition>
        }
      />

      <Route
        path="/admin/procurement"
        element={
          <PageTransition>
            <AdminProcurement />
          </PageTransition>
        }
      />

      <Route
        path="/admin/transport"
        element={
          <AdminPortalPage>
            <AdminTransportDashboard />
          </AdminPortalPage>
        }
      />

      <Route
        path="/admin/activity"
        element={
          <PageTransition>
            <AdminActivityLog />
          </PageTransition>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <PageTransition>
            <AdminPayments />
          </PageTransition>
        }
      />

      <Route
        path="/admin/payment-issues"
        element={
          <PageTransition>
            <AdminPaymentIssues />
          </PageTransition>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <PageTransition>
            <AdminReports />
          </PageTransition>
        }
      />

      <Route
        path="/admin/farmers"
        element={
          <PageTransition>
            <AdminFarmers />
          </PageTransition>
        }
      />

      <Route
        path="/admin/centers"
        element={
          <PageTransition>
            <AdminCenters />
          </PageTransition>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <PageTransition>
            <AdminSettings />
          </PageTransition>
        }
      />


      {/* =========================
          FALLBACK
      ========================== */}

      <Route
        path="*"
        element={
          <div
            style={{
              minHeight:
                "100vh",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              flexDirection:
                "column",

              gap:
                "10px",

              padding:
                "40px",

              textAlign:
                "center",
            }}
          >
            <h1>
              Page Not Found
            </h1>

            <p>
              The page you are looking
              for does not exist.
            </p>
          </div>
        }
      />

    </Routes>
  );
}


export default App;