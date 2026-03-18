// @ts-check

/** @type {readonly string[]} */
const ACTION_TYPES = Object.freeze([
  // AUTH
  "View Profile",
  "Sign Up",
  "Sign In",
  "Reset Password",
  "Logout",

  // USERS
  "Create User",
  "View Users",
  "View User Details",
  "Update User",
  "Delete User",
  "User Statistics Overview",

  // ORGANIZATIONS
  "Register Organization",
  "Create Organization",
  "View Organizations",
  "View Organization Details",
  "Update Organization",
  "Delete Organization",
  "Organization Statistics Overview",

  // EVENTS (SCHOOL EVENTS)
  "Create Event",
  "View Events",
  "Filter Events by Date Range",
  "Event Statistics Overview",
  "Monthly Event Statistics",
  "Event Statistics by Venue",
  "View Recent Events",
  "View Event Details",
  "Update Event",
  "Delete Event",

  // EVENT NOTIFICATIONS
  "Create Notification",
  "Create Notifications (Bulk)",
  "View Notifications",
  "View Notification Details",
  "Update Notification",
  "Delete Notification",
  "Notification Statistics",
  "Overall Notification Statistics",

  // REPORTS
  "Create Report",
  "View Reports",
  "View Report Details",
  "Download Reports",
  "Update Report Status",
  "Delete Report",

  // OTP
  "Cleanup OTP Records",
  "OTP Statistics",

  // CALENDAR ENTRIES
  "Create Calendar Entry",
  "View Calendar Entries",
  "Update Calendar Entry",
  "Delete Calendar Entry",
  "Calendar Statistics Overview",
  "View Calendar Entry Details",

  // OFFICERS
  "Create Officer",
  "View Officers",
  "View Officer Details",
  "Update Officer",
  "Delete Officer",
  "Officer Statistics Overview",
  "Detailed Officer Statistics",
  "Officer Statistics by Organization",
  "Officer Statistics by Period",
  "Officers Near Term End",
]);

export { ACTION_TYPES };
