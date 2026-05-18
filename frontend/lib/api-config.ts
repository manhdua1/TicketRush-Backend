const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:8080/ws";

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: `${BASE_URL}/api/auth/login`,
    logout: `${BASE_URL}/api/auth/logout`,
    register: `${BASE_URL}/api/auth/register`,
    me: `${BASE_URL}/api/auth/me`,
    sendRegisterOtp: `${BASE_URL}/api/auth/send-register-otp`,
    sendResetPasswordOtp: `${BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${BASE_URL}/api/auth/reset-password`,
    changePassword: `${BASE_URL}/api/auth/change-password`,
  },

  // User
  user: {
    profile: `${BASE_URL}/api/my-info`,
    tickets: `${BASE_URL}/api/my-tickets`,
    avatar: `${BASE_URL}/api/my-info/avatar`,
  },

  // Events
  events: {
    list: `${BASE_URL}/api/events`,
    trending: `${BASE_URL}/api/events/trending`,
    spotlight: `${BASE_URL}/api/events/spotlight`,
    byType: `${BASE_URL}/api/events/by-type`,
    detail: (id: number) => `${BASE_URL}/api/events/${id}/detail`,
  },

  // Booking
  booking: {
    base: `${BASE_URL}/api/bookings`,
  },

  // Queue
  queue: {
    join: `${BASE_URL}/api/queue/join`,
    leave: `${BASE_URL}/api/queue/leave`,
    status: `${BASE_URL}/api/queue/status`,
    check: `${BASE_URL}/api/queue/check`,
    heartbeat: `${BASE_URL}/api/queue/heartbeat`,
  },

  // WebSocket
  websocket: {
    url: WS_URL,
  },

  // Admin
  admin: {
    totalRevenue: `${BASE_URL}/api/admin/events/total-revenue`,
    totalEventsOnSale: `${BASE_URL}/api/admin/events/on-sale-count`,
    onSaleSeatSummary: `${BASE_URL}/api/admin/events/on-sale-seat-summary`,
    revenueTrend: `${BASE_URL}/api/admin/events/revenue-trend`,
    onSaleLowTickets: `${BASE_URL}/api/admin/events/on-sale-low-tickets`,
    events: `${BASE_URL}/api/admin/events`,
  },
};
