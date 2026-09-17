import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const {
  Pool,
} = pg;


/* =========================================================
   DATABASE CONNECTION
========================================================= */

const DATABASE_URL =
  process.env.DATABASE_URL;


if (
  !DATABASE_URL
) {

  throw new Error(
    "DATABASE_URL is not configured."
  );

}


const pool =
  new Pool({

    connectionString:
      DATABASE_URL,

    ssl: {
  rejectUnauthorized: false,
},

    max:
      10,

    idleTimeoutMillis:
      30000,

    connectionTimeoutMillis:
      10000,

  });


pool.on(
  "error",
  (
    error
  ) => {

    console.error(
      "PostgreSQL pool error:",
      error
    );

  }
);


/* =========================================================
   QUERY HELPERS
========================================================= */

export async function query(
  text,
  params = []
) {

  return pool.query(
    text,
    params
  );

}


export async function get(
  text,
  params = []
) {

  const result =
    await pool.query(
      text,
      params
    );

  return (
    result.rows[0] ||
    null
  );

}


export async function all(
  text,
  params = []
) {

  const result =
    await pool.query(
      text,
      params
    );

  return result.rows;

}


/* =========================================================
   TRANSACTION
========================================================= */

export async function transaction(
  callback
) {

  const client =
    await pool.connect();

  try {

    await client.query(
      "BEGIN"
    );


    const result =
      await callback(
        client
      );


    await client.query(
      "COMMIT"
    );


    return result;

  } catch (
    error
  ) {

    try {

      await client.query(
        "ROLLBACK"
      );

    } catch (
      rollbackError
    ) {

      console.error(
        "Transaction rollback error:",
        rollbackError
      );

    }


    throw error;

  } finally {

    // safely alter table for email if not exists
    try {
      await client.query("ALTER TABLE farmers ADD COLUMN email TEXT;");
    } catch (err) {
      // ignore if exists
    }

    client.release();

  }

}


/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

export async function initializeDatabase() {

  console.log(
    "Initializing KrishiSetu PostgreSQL database..."
  );


  /* =======================================================
     FARMERS
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS farmers (

      id TEXT PRIMARY KEY,

      name TEXT NOT NULL,

      phone TEXT NOT NULL UNIQUE,

      email TEXT,

      state_id TEXT,

      district_id TEXT,

      mandal_id TEXT,

      village TEXT,

      language TEXT DEFAULT 'en',

      preferred_center_id TEXT,

      primary_crop TEXT,

      estimated_quantity DOUBLE PRECISION,

      aadhaar_number TEXT,

      kyc_verified BOOLEAN DEFAULT FALSE,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );

  `);


  /* =======================================================
     CENTERS
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS centers (

      id TEXT PRIMARY KEY,

      name TEXT NOT NULL,

      state_id TEXT,

      district_id TEXT,

      mandal_id TEXT,

      village TEXT,

      address TEXT,

      manager_name TEXT,

      manager_phone TEXT,

      capacity INTEGER DEFAULT 20,

      active INTEGER DEFAULT 1,

      opening_time TEXT DEFAULT '09:00',

      closing_time TEXT DEFAULT '17:00',

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );

  `);


  /* =======================================================
     BOOKINGS
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS bookings (

      id TEXT PRIMARY KEY,

      token TEXT NOT NULL UNIQUE,

      farmer_id TEXT NOT NULL,

      center_id TEXT,

      crop TEXT,

      estimated_quantity DOUBLE PRECISION,

      actual_quantity DOUBLE PRECISION,

      date TEXT,

      slot_start TEXT,

      slot_end TEXT,

      status TEXT DEFAULT 'CONFIRMED',

      quality TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_bookings_farmer

        FOREIGN KEY (farmer_id)

        REFERENCES farmers(id)

        ON UPDATE CASCADE

        ON DELETE RESTRICT,

      CONSTRAINT fk_bookings_center

        FOREIGN KEY (center_id)

        REFERENCES centers(id)

        ON UPDATE CASCADE

        ON DELETE SET NULL

    );

  `);


  /* =======================================================
     STATUS EVENTS
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS status_events (

      id BIGSERIAL PRIMARY KEY,

      booking_id TEXT NOT NULL,

      status TEXT NOT NULL,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_status_events_booking

        FOREIGN KEY (booking_id)

        REFERENCES bookings(id)

        ON UPDATE CASCADE

        ON DELETE CASCADE

    );

  `);


  /* =======================================================
     PAYMENTS
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS payments (

      id BIGSERIAL PRIMARY KEY,

      booking_id TEXT NOT NULL,

      amount DOUBLE PRECISION,

      method TEXT,

      reference TEXT,

      status TEXT DEFAULT 'NOT_STARTED',

      rate_per_kg DOUBLE PRECISION,

      notes TEXT,

      updated_at TIMESTAMP,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      sms_status TEXT,

      sms_sent_at TIMESTAMP,

      CONSTRAINT fk_payments_booking

        FOREIGN KEY (booking_id)

        REFERENCES bookings(id)

        ON UPDATE CASCADE

        ON DELETE CASCADE

    );

  `);


  /* =======================================================
     SETTINGS
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS settings (

      key TEXT PRIMARY KEY,

      value TEXT NOT NULL,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );

  `);


  /* =======================================================
     PAYMENT ISSUES
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS payment_issues (

      id BIGSERIAL PRIMARY KEY,

      farmer_id TEXT NOT NULL,

      booking_id TEXT NOT NULL,

      message TEXT NOT NULL,

      status TEXT NOT NULL DEFAULT 'OPEN',

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_payment_issues_farmer

        FOREIGN KEY (farmer_id)

        REFERENCES farmers(id)

        ON UPDATE CASCADE

        ON DELETE CASCADE,

      CONSTRAINT fk_payment_issues_booking

        FOREIGN KEY (booking_id)

        REFERENCES bookings(id)

        ON UPDATE CASCADE

        ON DELETE CASCADE

    );

  `);


  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  await query(`

    CREATE TABLE IF NOT EXISTS notifications (

      id BIGSERIAL PRIMARY KEY,

      farmer_id TEXT NOT NULL,

      booking_id TEXT,

      type TEXT NOT NULL,

      title TEXT NOT NULL,

      message TEXT NOT NULL,

      channel TEXT NOT NULL DEFAULT 'IN_APP',

      status TEXT NOT NULL DEFAULT 'DELIVERED',

      read_at TIMESTAMP,

      sent_at TIMESTAMP,

      provider_response TEXT,

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_notifications_farmer

        FOREIGN KEY (farmer_id)

        REFERENCES farmers(id)

        ON UPDATE CASCADE

        ON DELETE CASCADE,

      CONSTRAINT fk_notifications_booking

        FOREIGN KEY (booking_id)

        REFERENCES bookings(id)

        ON UPDATE CASCADE

        ON DELETE SET NULL

    );

  `);


  /* =======================================================
     INDEXES
  ======================================================= */

  await query(`

    CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id

    ON bookings(farmer_id);

  `);


  await query(`

    CREATE INDEX IF NOT EXISTS idx_bookings_center_date_slot

    ON bookings(
      center_id,
      date,
      slot_start,
      slot_end
    );

  `);


  await query(`

    CREATE INDEX IF NOT EXISTS idx_bookings_status

    ON bookings(status);

  `);


  await query(`

    CREATE INDEX IF NOT EXISTS idx_status_events_booking_id

    ON status_events(booking_id);

  `);


  await query(`

    CREATE INDEX IF NOT EXISTS idx_payments_booking_id

    ON payments(booking_id);

  `);


  await query(`

    CREATE INDEX IF NOT EXISTS idx_notifications_farmer_id

    ON notifications(farmer_id);

  `);


  await query(`

    CREATE INDEX IF NOT EXISTS idx_payment_issues_status

    ON payment_issues(status);

  `);


  /* =======================================================
     PROCUREMENT CENTERS
  ======================================================= */

  const centerSeed = [

    {
      id:
        "main",

      name:
        "Main Procurement Center",

      state_id:
        "ts",

      district_id:
        "hyd",

      mandal_id:
        "serilingampally",

      village:
        "Gachibowli",

      address:
        "Main Road, Serilingampally",

      manager_name:
        "Main Center Manager",

      manager_phone:
        "+91 98765 43210",

      capacity:
        20,

      active:
        1,

      opening_time:
        "08:00 AM",

      closing_time:
        "05:00 PM",

    },


    {
      id:
        "north",

      name:
        "North Procurement Center",

      state_id:
        "ts",

      district_id:
        "hyd",

      mandal_id:
        "rajendranagar",

      village:
        "Attapur",

      address:
        "North Market Yard, Rajendranagar",

      manager_name:
        "North Center Manager",

      manager_phone:
        "+91 98765 43310",

      capacity:
        15,

      active:
        1,

      opening_time:
        "08:00 AM",

      closing_time:
        "05:00 PM",

    },


    {
      id:
        "east",

      name:
        "East Procurement Center",

      state_id:
        "ap",

      district_id:
        "guntur",

      mandal_id:
        "mangalagiri",

      village:
        "Mangalagiri",

      address:
        "East Collection Point, Mangalagiri",

      manager_name:
        "East Center Manager",

      manager_phone:
        "+91 98765 43410",

      capacity:
        12,

      active:
        1,

      opening_time:
        "09:00 AM",

      closing_time:
        "04:00 PM",

    },

  ];


  for (
    const center
    of centerSeed
  ) {

    await query(

      `

      INSERT INTO centers (

        id,

        name,

        state_id,

        district_id,

        mandal_id,

        village,

        address,

        manager_name,

        manager_phone,

        capacity,

        active,

        opening_time,

        closing_time

      )

      VALUES (

        $1,

        $2,

        $3,

        $4,

        $5,

        $6,

        $7,

        $8,

        $9,

        $10,

        $11,

        $12,

        $13

      )

      ON CONFLICT (id)

      DO NOTHING

      `,

      [

        center.id,

        center.name,

        center.state_id,

        center.district_id,

        center.mandal_id,

        center.village,

        center.address,

        center.manager_name,

        center.manager_phone,

        center.capacity,

        center.active,

        center.opening_time,

        center.closing_time,

      ]

    );

  }


  /* =======================================================
     DEFAULT SETTINGS
  ======================================================= */

  const defaultSettings = {

    bookingEnabled:
      true,

    maxQuantity:
      5000,

    defaultCapacity:
      20,

    slotDuration:
      30,

    advanceBookingDays:
      7,

    requireActualWeight:
      true,

    smsEnabled:
      false,

    bookingConfirmationSms:
      true,

    lateArrivalSms:
      true,

    procurementSms:
      true,

    paymentSms:
      true,

    defaultLanguage:
      "en",

    maintenanceMode:
      false,

  };


  for (
    const [
      key,
      value,
    ]
      of Object.entries(
        defaultSettings
      )
  ) {

    await query(

      `

      INSERT INTO settings (

        key,

        value

      )

      VALUES (

        $1,

        $2

      )

      ON CONFLICT (key)

      DO NOTHING

      `,

      [

        key,

        JSON.stringify(
          value
        ),

      ]

    );

  }


  console.log(
    "KrishiSetu PostgreSQL database ready."
  );

}


/* =========================================================
   TEST CONNECTION
========================================================= */

export async function testDatabaseConnection() {

  const result =
    await query(
      "SELECT NOW() AS now"
    );


  console.log(
    "PostgreSQL connection successful:",
    result.rows[0]?.now
  );


  return true;

}


/* =========================================================
   AUTO INITIALIZATION
========================================================= */

await initializeDatabase();


/* =========================================================
   EXPORT
========================================================= */

export default pool;