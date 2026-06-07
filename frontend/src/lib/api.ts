/**
 * DriveVerse API Client
 * Centralized API communication layer.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("driveverse_token");
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return { data, status: response.status, ok: response.ok };
    } catch (error) {
      console.error(`API ${method} ${path} failed:`, error);
      throw error;
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path);
  }

  // ─── Auth ────────────────────────────────────────────────

  async register(name: string, email: string, phone: string, password: string) {
    return this.post("/api/auth/register", { name, email, phone, password });
  }

  async login(identifier: string, password: string) {
    return this.post("/api/auth/login", { identifier, password });
  }

  async sendOtp(email?: string, phone?: string) {
    return this.post("/api/auth/send-otp", { email, phone });
  }

  async verifyOtp(otp: string, email?: string, phone?: string) {
    return this.post("/api/auth/verify-otp", { otp, email, phone });
  }

  async getMe() {
    return this.get("/api/auth/me");
  }

  async logout() {
    return this.post("/api/auth/logout");
  }

  // ─── Vehicles ────────────────────────────────────────────

  async getVehicles() {
    return this.get("/api/vehicles");
  }

  async addVehicle(registration_number: string, nickname?: string) {
    return this.post("/api/vehicles", { registration_number, nickname });
  }

  async lookupVehicle(registration_number: string) {
    return this.post("/api/vehicles/lookup", { registration_number });
  }

  async deleteVehicle(id: string) {
    return this.delete(`/api/vehicles/${id}`);
  }

  // ─── Challans ────────────────────────────────────────────

  async getChallans(vehicleId?: string, status?: string) {
    const params = new URLSearchParams();
    if (vehicleId) params.set("vehicle_id", vehicleId);
    if (status) params.set("status", status);
    return this.get(`/api/challans?${params}`);
  }

  async checkChallans() {
    return this.post("/api/challans/check");
  }

  async payChallan(challanId: string) {
    return this.post(`/api/challans/${challanId}/pay`);
  }

  // ─── Assistant ───────────────────────────────────────────

  async chatWithAstra(message: string, language: string = "en") {
    return this.post("/api/assistant/chat", { message, language });
  }

  async getChatHistory() {
    return this.get("/api/assistant/history");
  }

  async clearChatHistory() {
    return this.delete("/api/assistant/history");
  }

  // ─── Documents ───────────────────────────────────────────

  async getDocuments(docType?: string) {
    const params = docType ? `?doc_type=${docType}` : "";
    return this.get(`/api/documents${params}`);
  }

  async connectDigiLocker() {
    return this.post("/api/documents/digilocker/connect");
  }

  // ─── Notifications ──────────────────────────────────────

  async getNotifications(unreadOnly: boolean = false) {
    return this.get(`/api/notifications?unread_only=${unreadOnly}`);
  }

  async markNotificationRead(id: string) {
    return this.put(`/api/notifications/${id}/read`);
  }

  async markAllRead() {
    return this.put("/api/notifications/read-all");
  }

  // ─── Config ──────────────────────────────────────────────

  async updateProfilePhoto(photoUrl: string) {
    return this.post("/api/auth/profile-photo", { photo_url: photoUrl });
  }

  async getPublicConfig() {
    return this.get("/api/config/public");
  }

  async healthCheck() {
    return this.get("/api/health");
  }
}

export const api = new ApiClient(API_BASE);
export default api;
