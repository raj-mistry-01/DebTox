// Use 10.0.2.2 for Android emulator to reach host machine
// For physical devices or iOS simulator, update this in .env.local
const BACKEND_URL =  'https://861b-103-85-9-152.ngrok-free.app';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ) {
    const url = `${BACKEND_URL}/api/v1${endpoint}`;
    console.log(url)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signUp(name: string, email: string, password: string) {
    console.log("yes")
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async updateProfile(name?: string, phone?: string, upiId?: string) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, phone, upiId }),
    });
  }

  // Group endpoints
  async createGroup(name: string, description?: string, currency = 'INR', memberEmails: string[] = []) {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description, currency, memberEmails }),
    });
  }

  async listGroups() {
    return this.request('/groups');
  }

  async getGroup(groupId: string) {
    return this.request(`/groups/${groupId}`);
  }

  async getGroupExpenses(groupId: string) {
    return this.request(`/groups/${groupId}/expenses`);
  }

  async getGroupMembers(groupId: string) {
    return this.request(`/groups/${groupId}/members`);
  }

  // Expense endpoints
  async createExpense(
    groupId: string,
    title: string,
    amount: number,
    splits: { userId: string | number; shareAmount: number }[],
    currency = 'INR',
    category = 'OTHER',
    splitMethod = 'equal'
  ) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        groupId,
        title,
        amount,
        currency,
        category,
        splitMethod,
        splits,
      }),
    });
  }

  async getExpense(expenseId: string) {
    return this.request(`/expenses/${expenseId}`);
  }

  async deleteExpense(expenseId: string) {
    return this.request(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Friend System endpoints (new)
  async searchUsers(query: string) {
    return this.request(`/friends/search?query=${encodeURIComponent(query)}`);
  }

  async sendFriendRequest(toUserId: string, message?: string) {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ toUserId, message }),
    });
  }

  async getPendingFriendRequests() {
    return this.request('/friends/requests');
  }

  async acceptFriendRequest(requestId: string) {
    return this.request(`/friends/requests/${requestId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectFriendRequest(requestId: string) {
    return this.request(`/friends/requests/${requestId}/reject`, {
      method: 'PUT',
    });
  }

  async getFriendsList() {
    return this.request('/friends');
  }

  // Backward compatibility alias
  async getFriends() {
    return this.getFriendsList();
  }

  // Balance endpoints (settlement between friends)
  async getBalances() {
    return this.request('/balances');
  }

  async getBalance(friendId: string) {
    return this.request(`/balances/${friendId}`);
  }

  async settlePayment(
    friendId: string,
    amount: number,
    groupId: string,
    method = 'online'
  ) {
    return this.request(`/balances/${friendId}/settle`, {
      method: 'POST',
      body: JSON.stringify({ amount, groupId, method }),
    });
  }

  // Notification endpoints
  async getNotifications(limit = 20, offset = 0) {
    return this.request(`/notifications?limit=${limit}&offset=${offset}`);
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Activity endpoints
  async getActivity() {
    return this.request('/activity');
  }
}

export const apiClient = new ApiClient();
