import { procurementCenters } from "./locationData";
export const demoFarmer = {
  id: "F001",
  name: "Ravi Kumar",
  phone: "9876543210",

  stateId: "ts",
  districtId: "hyd",
  mandalId: "serilingampally",
  village: "Gachibowli",

  language: "en",

  preferredCenterId: "main",

  primaryCrop: "wheat",

  estimatedQuantity: 250,
};

export const demoCenters =
  procurementCenters;

export const demoCrops = [
  {
    id: "wheat",
    name: "Wheat",
    icon: "🌾",
    unit: "kg",
    rate: 25,
  },
  {
    id: "paddy",
    name: "Paddy",
    icon: "🌿",
    unit: "kg",
    rate: 22,
  },
  {
    id: "maize",
    name: "Maize",
    icon: "🌽",
    unit: "kg",
    rate: 20,
  },
  {
    id: "cotton",
    name: "Cotton",
    icon: "🌱",
    unit: "kg",
    rate: 60,
  },
];

export const demoBookings = [
  {
    id: "B001",
    farmerId: "F001",
    centerId: "main",
    token: "123",
    date: "2026-08-30",
    slotStart: "10:00",
    slotEnd: "10:30",
    crop: "wheat",
    estimatedQuantity: 250,
    actualQuantity: null,
    status: "CONFIRMED",
    payment: {
      amount: null,
      status: "NOT_CREATED",
      reference: null,
      sentAt: null,
    },
    createdAt: "2026-08-28T09:12:00",
    statusEvents: [
      {
        id: "E001",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T09:12:00",
        note: "Booking confirmed and token assigned.",
      },
    ],
  },

  {
    id: "B002",
    farmerId: "F002",
    centerId: "main",
    token: "124",
    date: "2026-08-30",
    slotStart: "10:30",
    slotEnd: "11:00",
    crop: "paddy",
    estimatedQuantity: 400,
    actualQuantity: 398,
    status: "WEIGHING",
    payment: {
      amount: null,
      status: "NOT_CREATED",
      reference: null,
      sentAt: null,
    },
    createdAt: "2026-08-28T08:55:00",
    statusEvents: [
      {
        id: "E002",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T08:55:00",
        note: "Booking confirmed.",
      },
      {
        id: "E003",
        status: "ARRIVED",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T10:34:00",
        note: "Farmer arrived and token verified.",
      },
      {
        id: "E004",
        status: "WEIGHING",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T10:39:00",
        note: "Weighing started.",
        changedFields: {
          actualQuantity: 398,
        },
      },
    ],
  },

  {
    id: "B003",
    farmerId: "F003",
    centerId: "main",
    token: "125",
    date: "2026-08-30",
    slotStart: "11:00",
    slotEnd: "11:30",
    crop: "maize",
    estimatedQuantity: 300,
    actualQuantity: 296,
    status: "PROCURED",
    payment: {
      amount: 5920,
      status: "PAYMENT_PENDING",
      reference: null,
      sentAt: null,
    },
    createdAt: "2026-08-28T08:40:00",
    statusEvents: [
      {
        id: "E005",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T08:40:00",
        note: "Booking confirmed.",
      },
      {
        id: "E006",
        status: "ARRIVED",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T10:50:00",
        note: "Farmer arrived.",
      },
      {
        id: "E007",
        status: "WEIGHING",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T10:55:00",
        note: "Produce weighing completed.",
        changedFields: {
          actualQuantity: 296,
        },
      },
      {
        id: "E008",
        status: "PROCURED",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T11:05:00",
        note: "Procurement completed.",
        changedFields: {
          payableAmount: 5920,
        },
      },
    ],
  },

  {
    id: "B004",
    farmerId: "F004",
    centerId: "main",
    token: "126",
    date: "2026-08-30",
    slotStart: "11:30",
    slotEnd: "12:00",
    crop: "cotton",
    estimatedQuantity: 180,
    actualQuantity: null,
    status: "LATE",
    payment: {
      amount: null,
      status: "NOT_CREATED",
      reference: null,
      sentAt: null,
    },
    createdAt: "2026-08-28T08:28:00",
    statusEvents: [
      {
        id: "E009",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T08:28:00",
        note: "Booking confirmed.",
      },
      {
        id: "E010",
        status: "LATE",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-30T12:04:00",
        note: "Arrival window missed; moved to visible late queue.",
      },
    ],
  },

  {
    id: "B005",
    farmerId: "F005",
    centerId: "main",
    token: "127",
    date: "2026-08-30",
    slotStart: "12:00",
    slotEnd: "12:30",
    crop: "wheat",
    estimatedQuantity: 220,
    actualQuantity: null,
    status: "ARRIVED",
    payment: {
      amount: null,
      status: "NOT_CREATED",
      reference: null,
      sentAt: null,
    },
    createdAt: "2026-08-28T08:12:00",
    statusEvents: [
      {
        id: "E011",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T08:12:00",
        note: "Booking confirmed.",
      },
      {
        id: "E012",
        status: "ARRIVED",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T12:03:00",
        note: "Farmer arrived and token verified.",
      },
    ],
  },

  {
    id: "B006",
    farmerId: "F006",
    centerId: "main",
    token: "128",
    date: "2026-08-30",
    slotStart: "12:30",
    slotEnd: "13:00",
    crop: "paddy",
    estimatedQuantity: 350,
    actualQuantity: null,
    status: "CONFIRMED",
    payment: {
      amount: null,
      status: "NOT_CREATED",
      reference: null,
      sentAt: null,
    },
    createdAt: "2026-08-28T08:01:00",
    statusEvents: [
      {
        id: "E013",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T08:01:00",
        note: "Booking confirmed.",
      },
    ],
  },

  {
    id: "B007",
    farmerId: "F007",
    centerId: "main",
    token: "129",
    date: "2026-08-30",
    slotStart: "13:00",
    slotEnd: "13:30",
    crop: "wheat",
    estimatedQuantity: 275,
    actualQuantity: null,
    status: "CONFIRMED",
    payment: {
      amount: null,
      status: "NOT_CREATED",
      reference: null,
      sentAt: null,
    },
    createdAt: "2026-08-28T07:55:00",
    statusEvents: [
      {
        id: "E014",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T07:55:00",
        note: "Booking confirmed.",
      },
    ],
  },

  {
    id: "B008",
    farmerId: "F008",
    centerId: "main",
    token: "130",
    date: "2026-08-30",
    slotStart: "13:30",
    slotEnd: "14:00",
    crop: "maize",
    estimatedQuantity: 200,
    actualQuantity: 198,
    status: "PROCURED",
    payment: {
      amount: 3960,
      status: "PAYMENT_SENT",
      reference: "PAY-20260830-008",
      sentAt: "2026-08-30T14:25:00",
    },
    createdAt: "2026-08-28T07:44:00",
    statusEvents: [
      {
        id: "E015",
        status: "CONFIRMED",
        actorType: "SYSTEM",
        actorId: "SYSTEM",
        timestamp: "2026-08-28T07:44:00",
        note: "Booking confirmed.",
      },
      {
        id: "E016",
        status: "ARRIVED",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T13:34:00",
        note: "Farmer arrived.",
      },
      {
        id: "E017",
        status: "WEIGHING",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T13:40:00",
        note: "Produce weighed.",
        changedFields: {
          actualQuantity: 198,
        },
      },
      {
        id: "E018",
        status: "PROCURED",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T13:52:00",
        note: "Procurement completed.",
        changedFields: {
          payableAmount: 3960,
        },
      },
      {
        id: "E019",
        status: "PAYMENT_SENT",
        actorType: "ADMIN",
        actorId: "A001",
        timestamp: "2026-08-30T14:25:00",
        note: "Payment marked sent.",
        changedFields: {
          paymentReference: "PAY-20260830-008",
        },
      },
    ],
  },
];

export const demoFarmers = [
  demoFarmer,

  {
    id: "F002",
    name: "Sita Devi",
    phone: "9876543211",
    village: "Rampur",
    language: "hi",
    preferredCenterId: "main",
    primaryCrop: "paddy",
    estimatedQuantity: 400,
  },

  {
    id: "F003",
    name: "Mohan Singh",
    phone: "9876543212",
    village: "Lakshmipur",
    language: "hi",
    preferredCenterId: "main",
    primaryCrop: "maize",
    estimatedQuantity: 300,
  },

  {
    id: "F004",
    name: "Anita Patil",
    phone: "9876543213",
    village: "Shivgaon",
    language: "mr",
    preferredCenterId: "main",
    primaryCrop: "cotton",
    estimatedQuantity: 180,
  },

  {
    id: "F005",
    name: "Ramesh Yadav",
    phone: "9876543214",
    village: "Basantpur",
    language: "hi",
    preferredCenterId: "main",
    primaryCrop: "wheat",
    estimatedQuantity: 220,
  },

  {
    id: "F006",
    name: "Meena Kumari",
    phone: "9876543215",
    village: "Devnagar",
    language: "hi",
    preferredCenterId: "main",
    primaryCrop: "paddy",
    estimatedQuantity: 350,
  },

  {
    id: "F007",
    name: "Arjun Patel",
    phone: "9876543216",
    village: "Haripur",
    language: "en",
    preferredCenterId: "main",
    primaryCrop: "wheat",
    estimatedQuantity: 275,
  },

  {
    id: "F008",
    name: "Sunita Rao",
    phone: "9876543217",
    village: "Ganeshwadi",
    language: "mr",
    preferredCenterId: "main",
    primaryCrop: "maize",
    estimatedQuantity: 200,
  },
];

export const demoSmsNotifications = [
  {
    id: "SMS001",
    bookingId: "B001",
    farmerId: "F001",
    phone: "9876543210",
    templateType: "BOOKING_CONFIRMED",
    status: "SENT",
    message:
      "KrishiSetu: Token #123 confirmed. Arrive 30 Aug, 10:00-10:30 AM at Main Procurement Center.",
    providerMessageId: "DEMO-MSG-001",
    attemptCount: 1,
    lastAttemptAt: "2026-08-28T09:12:03",
    createdAt: "2026-08-28T09:12:03",
  },

  {
    id: "SMS002",
    bookingId: "B004",
    farmerId: "F004",
    phone: "9876543213",
    templateType: "LATE",
    status: "SENT",
    message:
      "KrishiSetu: Token #126 is marked late. Please contact the procurement center for guidance.",
    providerMessageId: "DEMO-MSG-002",
    attemptCount: 1,
    lastAttemptAt: "2026-08-30T12:04:04",
    createdAt: "2026-08-30T12:04:04",
  },

  {
    id: "SMS003",
    bookingId: "B008",
    farmerId: "F008",
    phone: "9876543217",
    templateType: "PAYMENT_SENT",
    status: "SENT",
    message:
      "KrishiSetu: Payment of Rs. 3960 for Token #130 has been sent. Ref: PAY-20260830-008.",
    providerMessageId: "DEMO-MSG-003",
    attemptCount: 1,
    lastAttemptAt: "2026-08-30T14:25:03",
    createdAt: "2026-08-30T14:25:03",
  },
];

export const demoAdmin = {
  id: "A001",
  name: "Center Operator",
  email: "admin@krishisetu.demo",
  phone: "9999999999",
  centerId: "main",
};

export const demoDashboard = {
  todayBookings: 42,
  waiting: 11,
  late: 3,
  weighing: 4,
  procured: 24,
  paymentPending: 8,
  utilization: 82,
  averageWait: 31,
  remainingCapacity: 18,
  oldestWaitingToken: 114,
};