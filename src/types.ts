/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Data models representing Google Sheets database structure

export interface Product {
  id: string; // Product ID
  name: string; // Product Name
  imageUrl: string; // Product Image URL
  amazonLink: string; // Amazon Link
  cashbackAmount: number; // Cashback Amount
  sellerName: string; // Seller Name
  status: 'Active' | 'Paused' | 'Out of Stock'; // Status
  category: string; // Category
  deadline: string; // Deadline if available (YYYY-MM-DD or empty)
  createdAt: string; // Created At
}

export interface Order {
  id: string; // Order ID (Buyer Amazon Order ID or custom order ID)
  productId: string; // Product ID
  productName: string; // Product Name
  buyerName: string; // Buyer Name
  buyerWhatsApp: string; // Buyer WhatsApp
  agentName: string; // Agent Name
  agentReferralCode: string; // Agent Referral Code
  screenshotLink: string; // Screenshot Link (Google Drive / upload link)
  orderStatus: 'Pending' | 'Ordered' | 'Delivered' | 'Cashback Sent' | 'Rejected' | 'PayPal Issue' | 'Need More Info' | 'Refunded'; // Order Status
  sellerNotes: string; // Seller Notes/Issues
  cashbackProof: string; // Refund/Cashback Proof image or reference
  paymentMethod?: 'Zelle' | 'CashApp' | 'Venmo' | 'PayPal';
  paymentId?: string;
  deliveryScreenshotUrl?: string;
  createdAt: string; // Created At
  updatedAt: string; // Updated At
}

export interface Agent {
  id: string; // Agent ID
  name: string; // Agent Name
  referralCode: string; // Referral Code (used as ?ref=code)
  whatsApp: string; // WhatsApp
  totalOrders: number; // Total Orders
  commission: number; // Total earned commission or rate
  status: 'Active' | 'Inactive'; // Status
}

export interface Seller {
  id: string; // Seller ID
  name: string; // Seller Name
  whatsApp: string; // WhatsApp
  email: string; // Email
  status: 'Active' | 'Inactive'; // Status
}

export interface BuyerUser {
  id: string; // Buyer ID
  username: string; // Unique Sign In Name
  name: string; // Real Name
  whatsApp: string; // WhatsApp
  paymentMethod: 'PayPal' | 'Venmo' | 'Zelle' | 'CashApp';
  paymentId: string; // payment account details (email, tag, phone, etc.)
  status: 'Active' | 'Inactive'; // Status
  createdAt?: string; // Created At
}

// System settings / integrations
export interface HubConfig {
  backendUrl: string; // Google Apps Script URL
  mode: 'simulated' | 'live'; // Simulated or real GAS API
}

export type UserRole = 'buyer' | 'agent' | 'seller' | 'admin';
export interface SessionState {
  role: UserRole;
  agentRef?: string; // Checked from URL query parameter
  selectedAgentId?: string; // For agent dashboard login bypass/login
  selectedSellerId?: string; // For seller dashboard login bypass/login
}
