/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Order, Agent, Seller, HubConfig, BuyerUser } from './types';

// Real-world, beautiful initial mock products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'Anker Soundcore Space Q45 Adaptive Active Noise Cancelling Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    amazonLink: 'https://www.amazon.com/dp/B0B1HL44P9',
    cashbackAmount: 15.00,
    sellerName: 'AnkerDirect US',
    status: 'Active',
    category: 'Electronics',
    deadline: '2026-07-31',
    createdAt: new Date('2026-05-01').toISOString(),
  },
  {
    id: 'P002',
    name: 'Logitech MX Master 3S Wireless Performance Mouse, Ergonomic Sensor',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
    amazonLink: 'https://www.amazon.com/dp/B09HM94VDS',
    cashbackAmount: 20.00,
    sellerName: 'Logitech Depot',
    status: 'Active',
    category: 'Electronics',
    deadline: '2026-06-30',
    createdAt: new Date('2026-05-05').toISOString(),
  },
  {
    id: 'P003',
    name: 'Hydro Flask Stainless Steel Wide Mouth Bottle with Flex Cap (32 oz)',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    amazonLink: 'https://www.amazon.com/dp/B083G9S3R8',
    cashbackAmount: 8.50,
    sellerName: 'Outdoorsy Gear Inc.',
    status: 'Active',
    category: 'Kitchen & Home',
    deadline: '2026-08-15',
    createdAt: new Date('2026-05-10').toISOString(),
  },
  {
    id: 'P004',
    name: 'Kindle Paperwhite (16 GB) - 6.8-inch display, Adjustable Warm Light',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    amazonLink: 'https://www.amazon.com/dp/B09TWDYSVP',
    cashbackAmount: 25.00,
    sellerName: 'E-Reader Emporium',
    status: 'Active',
    category: 'Book Readers',
    deadline: '2026-06-25',
    createdAt: new Date('2026-05-12').toISOString(),
  },
  {
    id: 'P005',
    name: 'Cosori Pro II Smart Air Fryer Oven, 12-in-1 Cooking Customizer',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
    amazonLink: 'https://www.amazon.com/dp/B08YD74F96',
    cashbackAmount: 30.00,
    sellerName: 'KitchenSupply Co',
    status: 'Out of Stock',
    category: 'Kitchen & Home',
    deadline: '2026-06-12',
    createdAt: new Date('2026-05-15').toISOString(),
  }
];

// Initial mock orders to simulate real transactions
const INITIAL_ORDERS: Order[] = [
  {
    id: '114-8736541-2910394',
    productId: 'P001',
    productName: 'Anker Soundcore Space Q45 Adaptive Active Noise Cancelling Headphones',
    buyerName: 'Alexander Wright',
    buyerWhatsApp: '+1 (555) 234-5678',
    agentName: 'Sarah Connor',
    agentReferralCode: 'agent01',
    screenshotLink: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
    orderStatus: 'Cashback Sent',
    sellerNotes: 'High quality screenshot, matched and paid via PayPal.',
    cashbackProof: 'TXN-984736517263',
    createdAt: new Date('2026-06-01T10:30:00Z').toISOString(),
    updatedAt: new Date('2026-06-02T14:15:00Z').toISOString(),
  },
  {
    id: '112-9847264-1029384',
    productId: 'P002',
    productName: 'Logitech MX Master 3S Wireless Performance Mouse, Ergonomic Sensor',
    buyerName: 'Michael Chang',
    buyerWhatsApp: '+1 (555) 765-4321',
    agentName: 'David Miller',
    agentReferralCode: 'agent02',
    screenshotLink: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800',
    orderStatus: 'Delivered',
    sellerNotes: 'Order received. Delivered. Ready for final cashback execution.',
    cashbackProof: '',
    createdAt: new Date('2026-06-03T11:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-05T09:20:00Z').toISOString(),
  },
  {
    id: '113-1029385-2938475',
    productId: 'P003',
    productName: 'Hydro Flask Stainless Steel Wide Mouth Bottle with Flex Cap (32 oz)',
    buyerName: 'Emily Soto',
    buyerWhatsApp: '+1 (555) 987-6543',
    agentName: 'Sarah Connor',
    agentReferralCode: 'agent01',
    screenshotLink: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800',
    orderStatus: 'Ordered',
    sellerNotes: 'Awaiting buyer confirmation of delivery.',
    cashbackProof: '',
    createdAt: new Date('2026-06-05T15:45:00Z').toISOString(),
    updatedAt: new Date('2026-06-05T16:00:00Z').toISOString(),
  },
  {
    id: '111-2093847-1928374',
    productId: 'P004',
    productName: 'Kindle Paperwhite (16 GB) - 6.8-inch display, Adjustable Warm Light',
    buyerName: 'Jessica Bell',
    buyerWhatsApp: '+1 (555) 443-8822',
    agentName: 'Sarah Connor',
    agentReferralCode: 'agent01',
    screenshotLink: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    orderStatus: 'Need More Info',
    sellerNotes: 'The screenshot does not show the Amazon Order ID. Please re-upload.',
    cashbackProof: '',
    createdAt: new Date('2026-06-06T08:12:00Z').toISOString(),
    updatedAt: new Date('2026-06-07T11:30:00Z').toISOString(),
  }
];

// Preconfigured initial agents
const INITIAL_AGENTS: Agent[] = [
  {
    id: 'A001',
    name: 'Sarah Connor',
    referralCode: 'agent01',
    whatsApp: '+1 (555) 111-2222',
    totalOrders: 3,
    commission: 15.00,
    status: 'Active',
  },
  {
    id: 'A002',
    name: 'David Miller',
    referralCode: 'agent02',
    whatsApp: '+1 (555) 333-4444',
    totalOrders: 1,
    commission: 5.00,
    status: 'Active',
  },
  {
    id: 'A003',
    name: 'Emma Watson',
    referralCode: 'agent03',
    whatsApp: '+1 (555) 555-6666',
    totalOrders: 0,
    commission: 0.00,
    status: 'Inactive',
  }
];

// Preconfigured initial sellers
const INITIAL_SELLERS: Seller[] = [
  {
    id: 'S001',
    name: 'AnkerDirect US',
    whatsApp: '+1 (555) 888-9999',
    email: 'brand-deals@anker.com',
    status: 'Active',
  },
  {
    id: 'S002',
    name: 'Logitech Depot',
    whatsApp: '+1 (555) 777-6666',
    email: 'deals@logitech.com',
    status: 'Active',
  },
  {
    id: 'S003',
    name: 'Outdoorsy Gear Inc.',
    whatsApp: '+1 (555) 444-3333',
    email: 'partner@outdoorsy.com',
    status: 'Active',
  },
  {
    id: 'S004',
    name: 'E-Reader Emporium',
    whatsApp: '+1 (555) 123-9876',
    email: 'hello@ereaderemp.com',
    status: 'Active',
  },
  {
    id: 'S005',
    name: 'KitchenSupply Co',
    whatsApp: '+1 (555) 909-8080',
    email: 'support@kitchensupply.co',
    status: 'Active',
  }
];

// Preconfigured initial buyer users with their corresponding Unique Sign In names
export const INITIAL_BUYERS: BuyerUser[] = [
  {
    id: 'B001',
    username: 'alexander77',
    name: 'Alexander Wright',
    whatsApp: '+1 (555) 234-5678',
    paymentMethod: 'PayPal',
    paymentId: 'alex.wright@mail.com',
    status: 'Active',
    createdAt: new Date('2026-05-01T10:00:00Z').toISOString()
  },
  {
    id: 'B002',
    username: 'michael88',
    name: 'Michael Chang',
    whatsApp: '+1 (555) 765-4321',
    paymentMethod: 'Venmo',
    paymentId: '@michaelc',
    status: 'Active',
    createdAt: new Date('2026-05-05T10:00:00Z').toISOString()
  },
  {
    id: 'B003',
    username: 'emily99',
    name: 'Emily Soto',
    whatsApp: '+1 (555) 987-6543',
    paymentMethod: 'Zelle',
    paymentId: 'emily.soto@zelle.com',
    status: 'Active',
    createdAt: new Date('2026-05-10T10:00:00Z').toISOString()
  },
  {
    id: 'B004',
    username: 'jessica10',
    name: 'Jessica Bell',
    whatsApp: '+1 (555) 443-8822',
    paymentMethod: 'CashApp',
    paymentId: '$jessicabell',
    status: 'Active',
    createdAt: new Date('2026-05-12T10:00:00Z').toISOString()
  }
];

// INITIAL CONFIGURATION
const DEFAULT_CONFIG: HubConfig = {
  backendUrl: 'https://script.google.com/macros/s/AKfycbwCO0xMbrxKQ6x2K2kSe4LBOL7UYv-wnawgCxhXK5_uTjwUz08asac-PXj8uAJMwD0u/exec',
  mode: 'live'
};

// STORAGE ACTIONS
export const getHubConfig = (): HubConfig => {
  const config = localStorage.getItem('hh_config');
  if (config) {
    try {
      const parsed = JSON.parse(config);
      // Automatically update/apply the new Apps Script URL if they don't have one, or upgrade from simulated, or migrate from old URL
      if (!parsed.backendUrl || parsed.mode === 'simulated' || parsed.backendUrl.includes('AKfycbxQxS9wcsGoD_UY_e3tHRTEHTEMzdAn7Lxpd7onoMaksEOjjesrpDC__DqJOVnWLDS2') || parsed.backendUrl.includes('AKfycbz7IXc8yxfv5xaxSD_KL0EqNRNr_dZZx_aqMfcPnwXkAdbmK5SBbPrxqpsK0JcIzVEP')) {
        parsed.backendUrl = 'https://script.google.com/macros/s/AKfycbwCO0xMbrxKQ6x2K2kSe4LBOL7UYv-wnawgCxhXK5_uTjwUz08asac-PXj8uAJMwD0u/exec';
        parsed.mode = 'live';
        setHubConfig(parsed);
      }
      return parsed;
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  // Initialize with DEFAULT_CONFIG in storage as well
  setHubConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
};

export const setHubConfig = (config: HubConfig) => {
  localStorage.setItem('hh_config', JSON.stringify(config));
};

export const loadRawData = (key: string, fallback: any) => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
};

export const saveRawData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Simulated Local Database Class
export class SimulatedDB {
  static getProducts(): Product[] {
    return loadRawData('hh_products', INITIAL_PRODUCTS);
  }

  static saveProducts(products: Product[]) {
    saveRawData('hh_products', products);
  }

  static getOrders(): Order[] {
    return loadRawData('hh_orders', INITIAL_ORDERS);
  }

  static saveOrders(orders: Order[]) {
    saveRawData('hh_orders', orders);
  }

  static getAgents(): Agent[] {
    return loadRawData('hh_agents', INITIAL_AGENTS);
  }

  static saveAgents(agents: Agent[]) {
    saveRawData('hh_agents', agents);
  }

  static getSellers(): Seller[] {
    return loadRawData('hh_sellers', INITIAL_SELLERS);
  }

  static saveSellers(sellers: Seller[]) {
    saveRawData('hh_sellers', sellers);
  }

  // Operations
  static addOrder(order: Partial<Order>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      id: order.id || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      productId: order.productId || '',
      productName: order.productName || 'Unknown Product',
      buyerName: order.buyerName || '',
      buyerWhatsApp: order.buyerWhatsApp || '',
      agentName: order.agentName || 'None',
      agentReferralCode: order.agentReferralCode || 'None',
      screenshotLink: order.screenshotLink || '',
      orderStatus: 'Pending',
      sellerNotes: order.sellerNotes || '',
      cashbackProof: '',
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      deliveryScreenshotUrl: order.deliveryScreenshotUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(newOrder); // Add to beginning
    this.saveOrders(orders);

    // Update agent referral stats if matched
    if (newOrder.agentReferralCode) {
      const agents = this.getAgents();
      const updatedAgents = agents.map(agent => {
        if (agent.referralCode === newOrder.agentReferralCode) {
          const updatedOrders = agent.totalOrders + 1;
          // Calculate commission (let's assume agent gets $2 or something, or it's a hard rate or we track the accumulated product commission)
          // For simplicity we add a base rate of 10% of cash back or a flat $2.50
          const products = this.getProducts();
          const targetProduct = products.find(p => p.id === newOrder.productId);
          const productCashback = targetProduct ? targetProduct.cashbackAmount : 10;
          const commissionEarned = Number((productCashback * 0.15).toFixed(2)); // 15% helper margin commission
          return {
            ...agent,
            totalOrders: updatedOrders,
            commission: Number((agent.commission + commissionEarned).toFixed(2))
          };
        }
        return agent;
      });
      this.saveAgents(updatedAgents);
    }

    return newOrder;
  }

  static updateOrderStatus(orderId: string, status: Order['orderStatus'], notes?: string, proof?: string): Order | null {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;
    const updated = orders.map(o => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          orderStatus: status,
          sellerNotes: notes !== undefined ? notes : o.sellerNotes,
          cashbackProof: proof !== undefined ? proof : o.cashbackProof,
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });
    if (updatedOrder) {
      this.saveOrders(updated);
    }
    return updatedOrder;
  }

  static submitDeliveryProof(orderId: string, deliveryScreenshotUrl: string): Order | null {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;
    const updated = orders.map(o => {
      if (o.id === orderId) {
        // Auto-advance to "Delivered" if currently Pending/Ordered
        const nextStatus = (o.orderStatus === 'Pending' || o.orderStatus === 'Ordered') ? 'Delivered' : o.orderStatus;
        updatedOrder = {
          ...o,
          deliveryScreenshotUrl,
          orderStatus: nextStatus as any,
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });
    if (updatedOrder) {
      this.saveOrders(updated);
    }
    return updatedOrder;
  }

  static updateOrderDetails(orderId: string, amazonId: string, paymentMethod: 'PayPal' | 'Venmo' | 'Zelle' | 'CashApp', paymentId: string): Order | null {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;
    const updated = orders.map(o => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          id: amazonId, // Update raw Order ID
          paymentMethod,
          paymentId,
          updatedAt: new Date().toISOString()
        };
        return updatedOrder;
      }
      return o;
    });
    if (updatedOrder) {
      this.saveOrders(updated);
    }
    return updatedOrder;
  }

  static deleteOrder(orderId: string) {
    const orders = this.getOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    this.saveOrders(filtered);
  }

  static addProduct(product: Partial<Product>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      id: `P${String(products.length + 1).padStart(3, '0')}`,
      name: product.name || '',
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600',
      amazonLink: product.amazonLink || 'https://www.amazon.com',
      cashbackAmount: Number(product.cashbackAmount) || 0,
      sellerName: product.sellerName || '',
      status: product.status || 'Active',
      category: product.category || 'General',
      deadline: product.deadline || '',
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  static updateProduct(product: Product): Product {
    const products = this.getProducts();
    const updated = products.map(p => (p.id === product.id ? product : p));
    this.saveProducts(updated);
    return product;
  }

  static deleteProduct(productId: string) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    this.saveProducts(filtered);
  }

  static addAgent(agent: Partial<Agent>): Agent {
    const agents = this.getAgents();
    const newAgent: Agent = {
      id: `A${String(agents.length + 1).padStart(3, '0')}`,
      name: agent.name || '',
      referralCode: agent.referralCode || '',
      whatsApp: agent.whatsApp || '',
      totalOrders: 0,
      commission: 0,
      status: agent.status || 'Active',
    };
    agents.push(newAgent);
    this.saveAgents(agents);
    return newAgent;
  }

  static updateAgent(agent: Agent): Agent {
    const agents = this.getAgents();
    const updated = agents.map(a => (a.id === agent.id ? agent : a));
    this.saveAgents(updated);
    return agent;
  }

  static deleteAgent(agentId: string) {
    const agents = this.getAgents();
    const filtered = agents.filter(a => a.id !== agentId);
    this.saveAgents(filtered);
  }

  static addSeller(seller: Partial<Seller>): Seller {
    const sellers = this.getSellers();
    const newSeller: Seller = {
      id: `S${String(sellers.length + 1).padStart(3, '0')}`,
      name: seller.name || '',
      whatsApp: seller.whatsApp || '',
      email: seller.email || '',
      status: seller.status || 'Active',
    };
    sellers.push(newSeller);
    this.saveSellers(sellers);
    return newSeller;
  }

  static updateSeller(seller: Seller): Seller {
    const sellers = this.getSellers();
    const updated = sellers.map(s => (s.id === seller.id ? seller : s));
    this.saveSellers(updated);
    return seller;
  }

  static deleteSeller(sellerId: string) {
    const sellers = this.getSellers();
    const filtered = sellers.filter(s => s.id !== sellerId);
    this.saveSellers(filtered);
  }

  // --- Buyer Operations ---
  static getBuyers(): BuyerUser[] {
    return loadRawData('hh_buyers', INITIAL_BUYERS);
  }

  static saveBuyers(buyers: BuyerUser[]) {
    saveRawData('hh_buyers', buyers);
  }

  static addBuyer(buyer: Partial<BuyerUser>): BuyerUser {
    const buyers = this.getBuyers();
    const newBuyer: BuyerUser = {
      id: `B${String(buyers.length + 1).padStart(3, '0')}`,
      username: (buyer.username || '').trim().toLowerCase(),
      name: buyer.name || '',
      whatsApp: buyer.whatsApp || '',
      paymentMethod: buyer.paymentMethod || 'PayPal',
      paymentId: buyer.paymentId || '',
      status: buyer.status || 'Active',
      createdAt: new Date().toISOString(),
    };
    buyers.push(newBuyer);
    this.saveBuyers(buyers);
    return newBuyer;
  }

  static updateBuyer(buyer: BuyerUser): BuyerUser {
    const buyers = this.getBuyers();
    const updated = buyers.map(b => (b.id === buyer.id ? buyer : b));
    this.saveBuyers(updated);
    return buyer;
  }

  static deleteBuyer(buyerId: string) {
    const buyers = this.getBuyers();
    const filtered = buyers.filter(b => b.id !== buyerId);
    this.saveBuyers(filtered);
  }
}

// REST Client for Google Apps Script Web App
// Supports complete dynamic proxying to Apps Script Web App when in 'live' mode
export class LiveGASClient {
  static async request(config: HubConfig, action: string, data?: any): Promise<any> {
    if (!config.backendUrl) {
      throw new Error('Google Apps Script URL is not configured.');
    }

    try {
      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backendUrl: config.backendUrl,
          action,
          data,
        }),
      });

      if (!response.ok) {
        let errMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errRes = await response.json();
          if (errRes && errRes.error) {
            errMsg = errRes.error;
          }
        } catch {
          // Ignore
        }
        throw new Error(errMsg);
      }

      const result = await response.json();
      if (result && result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (err: any) {
      console.warn('GAS Client Request Failed via Proxy:', err);
      throw new Error(err.message || 'CORS or spreadsheet proxy communication error. Please ensure your Google Apps Script is deployed.');
    }
  }

  static async getAllData(config: HubConfig) {
    return this.request(config, 'getAllData');
  }

  static async addOrder(config: HubConfig, orderData: any) {
    return this.request(config, 'addOrder', orderData);
  }

  static async updateOrderStatus(config: HubConfig, orderId: string, orderStatus: Order['orderStatus'], sellerNotes: string, cashbackProof: string) {
    return this.request(config, 'updateOrderStatus', { id: orderId, orderStatus, sellerNotes, cashbackProof });
  }

  static async submitDeliveryProof(config: HubConfig, orderId: string, deliveryScreenshotUrl: string) {
    return this.request(config, 'submitDeliveryProof', { orderId, deliveryScreenshotUrl });
  }

  static async updateOrderDetails(config: HubConfig, orderId: string, amazonId: string, paymentMethod: 'PayPal' | 'Venmo' | 'Zelle' | 'CashApp', paymentId: string) {
    return this.request(config, 'updateOrderDetails', { id: orderId, amazonId, paymentMethod, paymentId });
  }

  static async addProduct(config: HubConfig, product: Partial<Product>) {
    return this.request(config, 'addProduct', { product });
  }

  static async addAgent(config: HubConfig, agent: Partial<Agent>) {
    return this.request(config, 'addAgent', { agent });
  }

  static async addSeller(config: HubConfig, seller: Partial<Seller>) {
    return this.request(config, 'addSeller', { seller });
  }

  static async addBuyer(config: HubConfig, buyer: Partial<BuyerUser>) {
    return this.request(config, 'addBuyer', { buyer });
  }

  static async deleteRecord(config: HubConfig, sheetName: string, idKey: string, idValue: string | string[]) {
    return this.request(config, 'deleteRecord', { sheetName, idKey, idValue });
  }
}
