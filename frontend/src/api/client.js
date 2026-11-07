const API_BASE = '/api';

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('punarva_token');
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Authentication & User Profile
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async register(userData) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async switchPersona(userId) {
    const response = await fetch(`${API_BASE}/auth/switch-persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    return handleResponse(response);
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getUser(userId) {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateUserProfile(userId, updateData) {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Analyze material image with LangGraph pipeline
  async analyzeListing(imageFile, language = 'en') {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('language', language);

    const response = await fetch(`${API_BASE}/listings/analyze`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  // Publish listing
  async publishListing(listingData) {
    const response = await fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData),
    });
    return handleResponse(response);
  },

  // Get listings
  async getListings(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/listings?${query}`);
    return handleResponse(response);
  },

  // Search listings with filters
  async searchListings(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}/listings/search?${query}`);
    return handleResponse(response);
  },

  // Get listing details
  async getListing(id) {
    const response = await fetch(`${API_BASE}/listings/${id}`);
    return handleResponse(response);
  },

  // Get matching buyers or fallbacks
  async getMatches(listingId, language = 'en') {
    const response = await fetch(`${API_BASE}/matches/${listingId}?language=${language}`);
    return handleResponse(response);
  },

  // Offers
  async submitOffer(offerData) {
    const response = await fetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData),
    });
    return handleResponse(response);
  },

  async getOffers(listingId, language = 'en') {
    const response = await fetch(`${API_BASE}/offers/${listingId}?language=${language}`);
    return handleResponse(response);
  },

  async withdrawOffer(offerId) {
    const response = await fetch(`${API_BASE}/offers/${offerId}/withdraw`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  async acceptOffer(offerId) {
    const response = await fetch(`${API_BASE}/offers/${offerId}/accept`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  async rejectOffer(offerId) {
    const response = await fetch(`${API_BASE}/offers/${offerId}/reject`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Pickup arrangement and negotiation
  async arrangePickup(listingId, pickupData) {
    const response = await fetch(`${API_BASE}/listings/${listingId}/pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pickupData),
    });
    return handleResponse(response);
  },

  async counterPickup(listingId, counterData) {
    const response = await fetch(`${API_BASE}/listings/${listingId}/pickup/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(counterData),
    });
    return handleResponse(response);
  },

  async acceptPickup(listingId, acceptData = {}) {
    const response = await fetch(`${API_BASE}/listings/${listingId}/pickup/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acceptData),
    });
    return handleResponse(response);
  },

  // Confirm completion
  async confirmExchange(listingId, role) {
    const response = await fetch(`${API_BASE}/listings/${listingId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  // Report problem / dispute
  async reportProblem(listingId, disputeData) {
    const response = await fetch(`${API_BASE}/listings/${listingId}/report-problem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(disputeData),
    });
    return handleResponse(response);
  },

  // Admin Dispute Mediation
  async getAdminDisputes() {
    const response = await fetch(`${API_BASE}/admin/disputes`);
    return handleResponse(response);
  },

  async resolveDispute(listingId, resolveData) {
    const response = await fetch(`${API_BASE}/admin/disputes/${listingId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolveData),
    });
    return handleResponse(response);
  },

  async simulateTimeout(listingId) {
    const response = await fetch(`${API_BASE}/admin/simulate-timeout/${listingId}`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Users & Preferences
  async getUsers() {
    const response = await fetch(`${API_BASE}/users`);
    return handleResponse(response);
  },

  async updateUserLanguage(userId, language) {
    const response = await fetch(`${API_BASE}/users/${userId}/language`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_language: language }),
    });
    return handleResponse(response);
  },

  // Buyer Wanted Requests
  async getUserRequests(userId) {
    const response = await fetch(`${API_BASE}/requests/${userId}`);
    return handleResponse(response);
  },

  async createRequest(requestData) {
    const response = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  // Notifications
  async getUserNotifications(userId) {
    const response = await fetch(`${API_BASE}/notifications/${userId}`);
    return handleResponse(response);
  },

  async markNotificationRead(notifId) {
    const response = await fetch(`${API_BASE}/notifications/${notifId}/read`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Impact & Dashboard
  async getUserImpact(userId) {
    const response = await fetch(`${API_BASE}/impact/${userId}`);
    return handleResponse(response);
  },

  async getUserDashboard(userId) {
    const response = await fetch(`${API_BASE}/dashboard/${userId}`);
    return handleResponse(response);
  },
};
