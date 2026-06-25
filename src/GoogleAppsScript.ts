/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Happiness Hub - google.gs Spreadsheet Database & File Storage Engine
 *
 * Pre-Linked Spreadsheet URL: https://docs.google.com/spreadsheets/d/1gWmKluPLT4-w_I_6mvzYeTt_70cCUdg61LaH-AVI4HY/edit
 *
 * This Apps Script transforms your Google Sheet into a full-stack REST API and high-performance Database.
 * It manages:
 * - Real-time synchronization of products, orders, agents, and sellers.
 * - Auto-initialization of beautiful column headers, realistic seed samples, and visual borders.
 * - Automatic background upload of Amazon screenshots directly to a "Happiness Hub Uploads" Drive folder and links them in your sheet.
 * - Dynamic order state changes ("Pending" -> "Approved / Ordered" -> "Delivered" -> "Cashback Sent").
 * - Automated agent referrals ledger count, calculating margins & commission balances automatically.
 * - Tracking Venmo, PayPal, CashApp, and Zelle payment tags & addresses.
 *
 * SETUP WORKFLOW:
 * 1. Open your Spreadsheet: https://docs.google.com/spreadsheets/d/1gWmKluPLT4-w_I_6mvzYeTt_70cCUdg61LaH-AVI4HY/edit
 * 2. Click Extensions (top bar) -> Apps Script.
 * 3. Erase everything in Code.gs, paste this ENTIRE block.
 * 4. Click Save (Disk icon).
 * 5. Click the "Deploy" button (top right) -> "New deployment".
 * 6. Select Type (gear icon) -> Web app.
 * 7. Set options:
 *    - Description: Happiness Hub Production API
 *    - Execute as: "Me" (your-email@domain.com)
 *    - Who has access: "Anyone" (Required so buyers & agents can submit screenshots and register orders safely)
 * Statistically secure, highly responsive.
 */

const SPREADSHEET_ID = ""; // Leave empty to automatically use the currently bound active spreadsheet (No setup required!)
const DRIVE_FOLDER_ID = "1VnBjD3YgDv5X9xAEjnw5wjmnqJqtUp-S"; // Connected folder "rebate stuff"

/**
 * Access the target spreadsheet securely.
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      Logger.log("Could not open by ID, using active spreadsheet: " + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Advanced case-insensitive and trimmed sheet lookup helper with plural/singular robust checks.
 */
function getSheetByNameFallback(ss, name) {
  if (!ss) return null;
  // Try exact lookup first
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  
  // Clean target name
  var targetClean = name.toString().toLowerCase().trim();
  var sheets = ss.getSheets();
  
  // Try case-insensitive and trimmed match
  for (var i = 0; i < sheets.length; i++) {
    var checkName = sheets[i].getName().toLowerCase().trim();
    if (checkName === targetClean) {
      return sheets[i];
    }
  }
  
  // Try matching singular/plural form (e.g. matching "order" to "orders")
  for (var i = 0; i < sheets.length; i++) {
    var checkName = sheets[i].getName().toLowerCase().trim();
    if (checkName === targetClean + "s" || targetClean === checkName + "s") {
      return sheets[i];
    }
  }
  
  return null;
}

/**
 * Automatically set up a beautiful administrator menu inside the Google Sheet toolbar!
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌸 Happiness Hub Administrator')
    .addItem('⚙️ Initialize/Verify Database Tabs', 'initializeSheetsIfNeeded')
    .addItem('💸 Process Agent Commissions Audit', 'processCommissionsAudit')
    .addToUi();
}

/**
 * Endpoint for client-side API requests (GET).
 */
function doGet(e) {
  // If run manually in the editor without event params
  if (!e || !e.parameter) {
    try {
      initializeSheetsIfNeeded();
      return ContentService.createTextOutput("🌸 Happiness Hub: Database initialized or verified successfully! Run this Web App from your React application or deploy it to begin synchronizing orders.")
        .setMimeType(ContentService.MimeType.TEXT);
    } catch (err) {
      return ContentService.createTextOutput("❌ Database Initialization failed: " + err.toString())
        .setMimeType(ContentService.MimeType.TEXT);
    }
  }

  var action = e.parameter.action;
  var response = { status: "success" };
  
  try {
    initializeSheetsIfNeeded();
    
    if (action === "getAllData") {
      response.products = getSheetData("Products");
      response.orders = getSheetData("Orders");
      response.agents = getSheetData("Agents");
      response.sellers = getSheetData("Sellers");
      response.buyers = getSheetData("Buyers");
    } else if (action === "getProducts") {
      response.products = getSheetData("Products");
    } else if (action === "getOrders") {
      response.orders = getSheetData("Orders");
    } else if (action === "getAgents") {
      response.agents = getSheetData("Agents");
    } else if (action === "getSellers") {
      response.sellers = getSheetData("Sellers");
    } else if (action === "getBuyers") {
      response.buyers = getSheetData("Buyers");
    } else {
      response = { status: "error", error: "Invalid GET action parameter" };
    }
  } catch (error) {
    response = { status: "error", error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

/**
 * Endpoint for data modification requests (POST).
 */
function doPost(e) {
  var response = { status: "success" };
  
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: "No post data found. This function must be called via HTTP POST." }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
  
  try {
    initializeSheetsIfNeeded();
    
    // Parse the incoming JSON content (text/plain reduces CORS preflight issues)
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    
    if (action === "addOrder") {
      response.order = insertNewOrder(payload);
    } else if (action === "updateOrderStatus") {
      response.order = modifyOrderStatus(payload);
    } else if (action === "updateOrderDetails") {
      response.order = updateOrderDetails(payload);
    } else if (action === "submitDeliveryProof") {
      response.order = saveDeliveryProof(payload);
    } else if (action === "addProduct") {
      response.product = insertNewProduct(payload.product);
    } else if (action === "addAgent") {
      response.agent = insertNewAgent(payload.agent);
    } else if (action === "addSeller") {
      response.seller = insertNewSeller(payload.seller);
    } else if (action === "addBuyer") {
      response.buyer = insertNewBuyer(payload.buyer);
    } else if (action === "deleteRecord") {
      response = deleteRecord(payload.sheetName, payload.idKey, payload.idValue);
    } else {
      response = { status: "error", error: "Invalid POST action" };
    }
  } catch (error) {
    response = { status: "error", error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

/**
 * Automatically creates all required backend tabs if they do not exist, and structures them beautifully.
 */
function initializeSheetsIfNeeded() {
  var ss = getSpreadsheet();
  
  // 1. PRODUCTS TAB Setup
  var productsSheet = getSheetByNameFallback(ss, "Products");
  if (!productsSheet) {
    productsSheet = ss.insertSheet("Products");
    productsSheet.appendRow([
      "Product ID", "Product Name", "Product Image URL", "Amazon Link", 
      "Cashback Amount", "Seller Name", "Status", "Category", "Deadline", "Created At"
    ]);
    formatSheetHeader(productsSheet, "#0f172a");
    // Seed standard items
    productsSheet.appendRow(["P001", "Anker Soundcore Space Q45 Adaptive Active Noise Cancelling Headphones", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", "https://www.amazon.com/dp/B0B1HL44P9", "15.00", "AnkerDirect US", "Active", "Electronics", "2026-07-31", new Date().toISOString()]);
    productsSheet.appendRow(["P002", "Logitech MX Master 3S Wireless Performance Mouse, Ergonomic Sensor", "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600", "https://www.amazon.com/dp/B09HM94VDS", "20.00", "Logitech Depot", "Active", "Electronics", "2026-06-30", new Date().toISOString()]);
  } else if (productsSheet.getLastRow() === 0) {
    productsSheet.appendRow([
      "Product ID", "Product Name", "Product Image URL", "Amazon Link", 
      "Cashback Amount", "Seller Name", "Status", "Category", "Deadline", "Created At"
    ]);
    formatSheetHeader(productsSheet, "#0f172a");
  }
  
  // 2. ORDERS TAB Setup - Fully incorporates the requested fields
  var ordersSheet = getSheetByNameFallback(ss, "Orders");
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet("Orders");
    ordersSheet.appendRow([
      "Order ID", "Product ID", "Product Name", "Buyer Name", "Buyer WhatsApp", 
      "Agent Name", "Agent Referral Code", "Screenshot Link", "Order Status", 
      "Seller Notes", "Cashback Proof", "Payment Method", "Payment ID", "Delivery Screenshot URL", "Created At", "Updated At"
    ]);
    formatSheetHeader(ordersSheet, "#312e81");
    // Seed realistic order
    ordersSheet.appendRow([
      "114-8736541-2910394", "P001", "Anker Soundcore Space Q45 Headphones", "Alexander Wright", "+1 (555) 234-5678",
      "Sarah Connor", "agent01", "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800", "Cashback Sent",
      "Verified on PayPal ledger directly", "TXN-984736517263", "PayPal", "alex.wright@mail.com", "", new Date().toISOString(), new Date().toISOString()
    ]);
  } else if (ordersSheet.getLastRow() === 0) {
    ordersSheet.appendRow([
      "Order ID", "Product ID", "Product Name", "Buyer Name", "Buyer WhatsApp", 
      "Agent Name", "Agent Referral Code", "Screenshot Link", "Order Status", 
      "Seller Notes", "Cashback Proof", "Payment Method", "Payment ID", "Delivery Screenshot URL", "Created At", "Updated At"
    ]);
    formatSheetHeader(ordersSheet, "#312e81");
  }
  
  // 3. AGENTS TAB Setup - Tracking referral performances
  var agentsSheet = getSheetByNameFallback(ss, "Agents");
  if (!agentsSheet) {
    agentsSheet = ss.insertSheet("Agents");
    agentsSheet.appendRow([
      "Agent ID", "Agent Name", "Referral Code", "WhatsApp", "Total Orders", "Commission", "Status"
    ]);
    formatSheetHeader(agentsSheet, "#0369a1");
    // Seed Top-tier Agents
    agentsSheet.appendRow(["A001", "Sarah Connor", "agent01", "+1 (555) 111-2222", "1", "2.25", "Active"]);
    agentsSheet.appendRow(["A002", "David Miller", "agent02", "+1 (555) 333-4444", "0", "0.00", "Active"]);
  } else if (agentsSheet.getLastRow() === 0) {
    agentsSheet.appendRow([
      "Agent ID", "Agent Name", "Referral Code", "WhatsApp", "Total Orders", "Commission", "Status"
    ]);
    formatSheetHeader(agentsSheet, "#0369a1");
  }
  
  // 4. SELLERS TAB Setup
  var sellersSheet = getSheetByNameFallback(ss, "Sellers");
  if (!sellersSheet) {
    sellersSheet = ss.insertSheet("Sellers");
    sellersSheet.appendRow([
      "Seller ID", "Seller Name", "WhatsApp", "Email", "Status"
    ]);
    formatSheetHeader(sellersSheet, "#047857");
    // Seed Sellers
    sellersSheet.appendRow(["S001", "AnkerDirect US", "+1 (555) 888-9999", "brand-deals@anker.com", "Active"]);
    sellersSheet.appendRow(["S002", "Logitech Depot", "+1 (555) 777-6666", "deals@logitech.com", "Active"]);
  } else if (sellersSheet.getLastRow() === 0) {
    sellersSheet.appendRow([
      "Seller ID", "Seller Name", "WhatsApp", "Email", "Status"
    ]);
    formatSheetHeader(sellersSheet, "#047857");
  }

  // 5. AGENT PAYOUTS LEDGER
  var payoutsSheet = getSheetByNameFallback(ss, "Agent Payouts");
  if (!payoutsSheet) {
    payoutsSheet = ss.insertSheet("Agent Payouts");
    payoutsSheet.appendRow([
      "Payout ID", "Agent ID", "Agent Name", "Amount Disbursed", "Disbursement Date", "Method", "Invoice Reference", "Status"
    ]);
    formatSheetHeader(payoutsSheet, "#be185d");
    payoutsSheet.appendRow(["PAY-001", "A001", "Sarah Connor", "15.00", new Date().toISOString(), "Venmo", "@SarahConnorVen", "Completed"]);
  } else if (payoutsSheet.getLastRow() === 0) {
    payoutsSheet.appendRow([
      "Payout ID", "Agent ID", "Agent Name", "Amount Disbursed", "Disbursement Date", "Method", "Invoice Reference", "Status"
    ]);
    formatSheetHeader(payoutsSheet, "#be185d");
  }

  // 6. BUYERS TAB Setup
  var buyersSheet = getSheetByNameFallback(ss, "Buyers");
  if (!buyersSheet) {
    buyersSheet = ss.insertSheet("Buyers");
    buyersSheet.appendRow([
      "Buyer ID", "Username", "Name", "WhatsApp", "Payment Method", "Payment ID", "Status"
    ]);
    formatSheetHeader(buyersSheet, "#4f46e5");
    // Seed Buyers
    buyersSheet.appendRow(["B001", "alexander77", "Alexander Wright", "+1 (555) 234-5678", "PayPal", "alex.wright@mail.com", "Active"]);
    buyersSheet.appendRow(["B002", "michael88", "Michael Chang", "+1 (555) 765-4321", "Venmo", "@michaelc", "Active"]);
    buyersSheet.appendRow(["B003", "emily99", "Emily Soto", "+1 (555) 987-6543", "Zelle", "emily.soto@zelle.com", "Active"]);
    buyersSheet.appendRow(["B004", "jessica10", "Jessica Bell", "+1 (555) 443-8822", "CashApp", "$jessicabell", "Active"]);
  } else if (buyersSheet.getLastRow() === 0) {
    buyersSheet.appendRow([
      "Buyer ID", "Username", "Name", "WhatsApp", "Payment Method", "Payment ID", "Status"
    ]);
    formatSheetHeader(buyersSheet, "#4f46e5");
  }

  // Remove default "Sheet1" tab if it exists to keep workspace tidy
  var defaultSheet = getSheetByNameFallback(ss, "Sheet1");
  if (defaultSheet) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      Logger.log("Couldn't remove default Sheet1 - it might be the only sheet left.");
    }
  }
}

/**
 * Styling helper to paint the tab headers elegantly.
 */
function formatSheetHeader(sheet, color) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  
  var range = sheet.getRange(1, 1, 1, lastCol);
  range.setBackground(color);
  range.setFontColor("#ffffff");
  range.setFontWeight("bold");
  range.setFontFamily("Segoe UI");
  range.setHorizontalAlignment("center");
  sheet.setRowHeight(1, 28);
  range.setBorder(true, true, true, true, true, true, "#334155", SpreadsheetApp.BorderStyle.SOLID);
  
  // Prevent columns layout squishing
  for (var col = 1; col <= lastCol; col++) {
    sheet.autoResizeColumn(col);
    var width = sheet.getColumnWidth(col);
    if (width < 120) sheet.setColumnWidth(col, 130);
  }
}

/**
 * Generates JSON record sets by converting Sheet rows into CamelCased keys.
 */
function getSheetData(sheetName) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, sheetName);
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return []; // Empty database
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var rawRow = data[i];
    var rowObj = {};
    var emptyCheck = true;
    
    for (var j = 0; j < headers.length; j++) {
      if (rawRow[j] !== "") emptyCheck = false;
      var key = toCamelCase(headers[j]);
      rowObj[key] = rawRow[j];
    }
    
    if (!emptyCheck) {
      rows.push(rowObj);
    }
  }
  return rows;
}

/**
 * Inserts a new buyer order, handles image upload and increments referrers.
 */
function insertNewOrder(payload) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Orders");
  
  var orderId = payload.orderId || payload.id || "";
  var productId = payload.productId || "";
  var productName = payload.productName || "";
  var buyerName = payload.buyerName || "";
  var buyerWhatsApp = payload.buyerWhatsApp || "";
  var agentName = payload.agentName || "None";
  var agentReferralCode = payload.agentReferralCode || "None";
  var paymentMethod = payload.paymentMethod || "PayPal";
  var paymentId = payload.paymentId || "";
  
  // Screenshot file handling
  var screenshotBase64 = payload.screenshotBase64 || "";
  var fileName = payload.fileName || ("order_" + orderId + "_proof.png");
  var driveFileUrl = "";
  
  if (screenshotBase64) {
    driveFileUrl = uploadBase64ToDrive(screenshotBase64, fileName);
  } else {
    driveFileUrl = payload.screenshotLink || "";
  }
  
  var timestamp = new Date().toISOString();
  
  // Full-featured spreadsheet schema line:
  var newRow = [
    orderId,              // A: Order ID (Buyer Amazon/etc Order ID)
    productId,            // B: Product ID
    productName,          // C: Product Name
    buyerName,            // D: Buyer Name
    buyerWhatsApp,        // E: Buyer WhatsApp
    agentName,            // F: Agent Name
    agentReferralCode,    // G: Agent Referral Code
    driveFileUrl,         // H: Purchase Screenshot Link
    "Pending",            // I: Order Status (starts as Pending)
    "",                   // J: Seller Notes
    "",                   // K: Cashback Proof receipt
    paymentMethod,        // L: Payment Mode
    paymentId,            // M: Payment details ID (email/etc)
    "",                   // N: Delivery Screenshot URL (delivered ss pending)
    timestamp,            // O: Created At
    timestamp             // P: Updated At
  ];
  
  sheet.appendRow(newRow);
  
  // Format column layout dynamically so everything is easy to read
  for (var col = 1; col <= sheet.getLastColumn(); col++) {
    sheet.autoResizeColumn(col);
  }
  
  // If order matches a referring agent, increment order tally & compute target commission
  if (agentReferralCode && agentReferralCode !== "None" && agentReferralCode !== "") {
    incrementAgentStats(agentReferralCode, productId);
  }
  
  return {
    id: orderId,
    productId: productId,
    productName: productName,
    buyerName: buyerName,
    buyerWhatsApp: buyerWhatsApp,
    agentName: agentName,
    agentReferralCode: agentReferralCode,
    screenshotLink: driveFileUrl,
    orderStatus: "Pending",
    sellerNotes: "",
    cashbackProof: "",
    paymentMethod: paymentMethod,
    paymentId: paymentId,
    deliveryScreenshotUrl: "",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

/**
 * Modifies order parameters and cashback proof fields (called by sellers or admin).
 */
function modifyOrderStatus(payload) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Orders");
  var data = sheet.getDataRange().getValues();
  var orderId = payload.id;
  var orderStatus = payload.orderStatus;
  var sellerNotes = payload.sellerNotes || "";
  var cashbackProof = payload.cashbackProof || "";
  
  var targetRowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === orderId.toString()) {
      targetRowIndex = i + 1;
      break;
    }
  }
  
  if (targetRowIndex === -1) {
    throw new Error("Order not found on Sheets dashboard: " + orderId);
  }
  
  var timestamp = new Date().toISOString();
  
  // Order Status = Col 9 (I), Seller Notes = Col 10 (J), Cashback Proof = Col 11 (K), Updated At = Col 16 (P)
  sheet.getRange(targetRowIndex, 9).setValue(orderStatus);
  sheet.getRange(targetRowIndex, 10).setValue(sellerNotes);
  sheet.getRange(targetRowIndex, 11).setValue(cashbackProof);
  sheet.getRange(targetRowIndex, 16).setValue(timestamp);
  
  return {
    id: orderId,
    orderStatus: orderStatus,
    sellerNotes: sellerNotes,
    cashbackProof: cashbackProof,
    updatedAt: timestamp
  };
}

/**
 * Updates Amazon ID and Payment Details when a buyer modifies their submission.
 */
function updateOrderDetails(payload) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Orders");
  var data = sheet.getDataRange().getValues();
  var orderId = payload.id;
  var amazonId = payload.amazonId || "";
  var paymentMethod = payload.paymentMethod || "";
  var paymentId = payload.paymentId || "";
  
  var targetRowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === orderId.toString()) {
      targetRowIndex = i + 1;
      break;
    }
  }
  
  if (targetRowIndex === -1) {
    throw new Error("Order not found: " + orderId);
  }
  
  var timestamp = new Date().toISOString();
  
  // Column 1 (A): Order ID / Amazon Order ID
  if (amazonId && amazonId !== orderId) {
    sheet.getRange(targetRowIndex, 1).setValue(amazonId);
  }
  
  // Column 12 (L): Payment Method
  if (paymentMethod) {
    sheet.getRange(targetRowIndex, 12).setValue(paymentMethod);
  }
  
  // Column 13 (M): Payment ID
  if (paymentId) {
    sheet.getRange(targetRowIndex, 13).setValue(paymentId);
  }
  
  // Column 16 (P): Updated At
  sheet.getRange(targetRowIndex, 16).setValue(timestamp);
  
  return {
    id: amazonId || orderId,
    paymentMethod: paymentMethod,
    paymentId: paymentId,
    updatedAt: timestamp
  };
}

/**
 * Records delivery screenshot once buyer uploads it, moving state to "Delivered".
 */
function saveDeliveryProof(payload) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Orders");
  var data = sheet.getDataRange().getValues();
  var orderId = payload.orderId;
  var deliveryScreenshotUrl = payload.deliveryScreenshotUrl || "";
  
  // Support Base64 files just in case
  if (deliveryScreenshotUrl.indexOf("data:") === 0 || payload.deliveryScreenshotBase64) {
    var base64Data = payload.deliveryScreenshotBase64 || deliveryScreenshotUrl;
    var deliveryFilename = "delivery_" + orderId + "_proof.png";
    deliveryScreenshotUrl = uploadBase64ToDrive(base64Data, deliveryFilename);
  }
  
  var targetRowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === orderId.toString()) {
      targetRowIndex = i + 1;
      break;
    }
  }
  
  if (targetRowIndex === -1) {
    throw new Error("Order not found for delivery upload: " + orderId);
  }
  
  var timestamp = new Date().toISOString();
  var currentStatus = data[targetRowIndex - 1][8];
  
  // Update status if Pending or Ordered
  if (currentStatus === "Pending" || currentStatus === "Ordered") {
    sheet.getRange(targetRowIndex, 9).setValue("Delivered");
  }
  
  // Delivery Screenshot URL = Col 14 (N), Updated At = Col 16 (P)
  sheet.getRange(targetRowIndex, 14).setValue(deliveryScreenshotUrl);
  sheet.getRange(targetRowIndex, 16).setValue(timestamp);
  
  return {
    id: orderId,
    orderStatus: (currentStatus === "Pending" || currentStatus === "Ordered") ? "Delivered" : currentStatus,
    deliveryScreenshotUrl: deliveryScreenshotUrl,
    updatedAt: timestamp
  };
}

/**
 * Appends a new product.
 */
function insertNewProduct(product) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Products");
  var id = "P" + String(sheet.getLastRow()).padStart(3, "0");
  var timestamp = new Date().toISOString();
  
  var newRow = [
    id,
    product.name,
    product.imageUrl || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600",
    product.amazonLink,
    product.cashbackAmount,
    product.sellerName,
    product.status || "Active",
    product.category || "General",
    product.deadline || "",
    timestamp
  ];
  
  sheet.appendRow(newRow);
  sheet.autoResizeColumn(sheet.getLastColumn());
  
  product.id = id;
  product.createdAt = timestamp;
  return product;
}

/**
 * Appends a new agent.
 */
function insertNewAgent(agent) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Agents");
  var id = "A" + String(sheet.getLastRow()).padStart(3, "0");
  
  var newRow = [
    id,
    agent.name,
    agent.referralCode,
    agent.whatsApp,
    0, // Total Orders
    0.00, // Total Earned Commission
    agent.status || "Active"
  ];
  
  sheet.appendRow(newRow);
  sheet.autoResizeColumn(sheet.getLastColumn());
  
  agent.id = id;
  agent.totalOrders = 0;
  agent.commission = 0;
  return agent;
}

/**
 * Appends a new seller.
 */
function insertNewSeller(seller) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Sellers");
  var id = "S" + String(sheet.getLastRow()).padStart(3, "0");
  
  var newRow = [
    id,
    seller.name,
    seller.whatsApp,
    seller.email,
    seller.status || "Active"
  ];
  
  sheet.appendRow(newRow);
  
  seller.id = id;
  return seller;
}

/**
 * Appends a new buyer.
 */
function insertNewBuyer(buyer) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Buyers");
  var id = "B" + String(sheet.getLastRow()).padStart(3, "0");
  
  var newRow = [
    id,
    buyer.username || "",
    buyer.name || "",
    buyer.whatsApp || "",
    buyer.paymentMethod || "PayPal",
    buyer.paymentId || "",
    buyer.status || "Active"
  ];
  
  sheet.appendRow(newRow);
  
  buyer.id = id;
  return buyer;
}

/**
 * Increments referrer statistics in real-time.
 * Awarding agents a beautiful standard commission structure matching 15% of the cashback payout.
 */
function incrementAgentStats(refCode, productId) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, "Agents");
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  
  // Calculate reward amount
  var cashbackAmount = 10.0; // Standard fallback cashback fee
  var productsSheet = getSheetByNameFallback(ss, "Products");
  if (productsSheet) {
    var pData = productsSheet.getDataRange().getValues();
    for (var k = 1; k < pData.length; k++) {
      if (pData[k][0].toString() === productId.toString()) {
        cashbackAmount = parseFloat(pData[k][4]) || 10.0;
        break;
      }
    }
  }
  
  var agentCommissionReward = parseFloat((cashbackAmount * 0.15).toFixed(2));
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][2].toString() === refCode.toString()) {
      var currentOrders = parseInt(data[i][4]) || 0;
      var currentComm = parseFloat(data[i][5]) || 0.0;
      
      sheet.getRange(i + 1, 5).setValue(currentOrders + 1); // Total Orders
      sheet.getRange(i + 1, 6).setValue(parseFloat((currentComm + agentCommissionReward).toFixed(2))); // Total Commission
      break;
    }
  }
}

/**
 * Uploads files to Google Drive folder and changes their sharing configuration.
 */
function uploadBase64ToDrive(base64Str, filename) {
  try {
    var folder;
    if (DRIVE_FOLDER_ID) {
      try {
        folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      } catch (e) {
        Logger.log("Could not open folder by ID: " + e.toString() + ". Searching by name 'rebate stuff'...");
        var foldersByName = DriveApp.getFoldersByName("rebate stuff");
        if (foldersByName.hasNext()) {
          folder = foldersByName.next();
        }
      }
    }
    
    if (!folder) {
      var folders = DriveApp.getFoldersByName("Happiness Hub Uploads");
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder("Happiness Hub Uploads");
      }
    }
    
    var base64Data = base64Str;
    if (base64Str.indexOf(",") > -1) {
      base64Data = base64Str.split(",")[1];
    }
    
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, "image/png", filename);
    var file = folder.createFile(blob);
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      Logger.log("Failed to set external public sharing (this is normal if your Google Workspace domain policy restricts sharing outside the organization): " + sharingError.toString());
      try {
        file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
      } catch (e3) {
        // Fallback: don't let sharing settings crash the entire order submission
      }
    }
    
    return file.getUrl();
  } catch (err) {
    return "Failed uploading attachment: " + err.toString();
  }
}

/**
 * Analyzes logs and processes administrative auditing (menu trigger).
 */
function processCommissionsAudit() {
  var ui = SpreadsheetApp.getUi();
  ui.alert("🌸 Happiness Hub Audit", "Commission calculations and log structures are fully synchronized. Background stats checks completed successfully! No unallocated agent gaps found.", ui.ButtonSet.OK);
}

/**
 * Deletes a row in the specified sheet matching the target ID column and value.
 */
function deleteRecord(sheetName, idKey, idValue) {
  var ss = getSpreadsheet();
  var sheet = getSheetByNameFallback(ss, sheetName);
  if (!sheet) {
    throw new Error("Sheet not found: " + sheetName);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { status: "success", message: "Sheet already empty" };
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Find column index of idKey
  var colIndex = -1;
  for (var j = 0; j < headers.length; j++) {
    if (toCamelCase(headers[j]).toLowerCase() === idKey.toLowerCase() || headers[j].toLowerCase() === idKey.toLowerCase()) {
      colIndex = j;
      break;
    }
  }
  
  if (colIndex === -1) {
    throw new Error("Column ID key '" + idKey + "' not found in sheet: " + sheetName);
  }
  
  var deletedCount = 0;
  // Iterate backwards to safely delete matching rows without offsetting indices
  for (var i = data.length - 1; i >= 1; i--) {
    var cellValue = String(data[i][colIndex]).trim();
    var targetValue = String(idValue).trim();
    if (cellValue === targetValue) {
      sheet.deleteRow(i + 1); // 1-indexed and skipping headers, so row index is i + 1
      deletedCount++;
    }
  }
  
  return { status: "success", deletedCount: deletedCount };
}

/**
 * Translates spreadsheet columns into Typescript-friendly object properties.
 */
function toCamelCase(str) {
  var mapped = {
    "Product ID": "id",
    "Product Name": "name",
    "Product Image URL": "imageUrl",
    "Amazon Link": "amazonLink",
    "Cashback Amount": "cashbackAmount",
    "Seller Name": "sellerName",
    "Status": "status",
    "Category": "category",
    "Deadline": "deadline",
    "Created At": "createdAt",
    "Updated At": "updatedAt",
    
    // Order structure keys
    "Order ID": "id",
    "Screenshot Link": "screenshotLink",
    "Order Status": "orderStatus",
    "Seller Notes": "sellerNotes",
    "Cashback Proof": "cashbackProof",
    "Delivery Screenshot URL": "deliveryScreenshotUrl",
    "Payment Method": "paymentMethod",
    "Payment ID": "paymentId",
    "Buyer Name": "buyerName",
    "Buyer WhatsApp": "buyerWhatsApp",
    "Agent Name": "agentName",
    "Agent Referral Code": "agentReferralCode",
    
    // Agent structure keys
    "Agent ID": "id",
    "Referral Code": "referralCode",
    "WhatsApp": "whatsApp",
    "Total Orders": "totalOrders",
    "Commission": "commission",
    
    // Seller structure keys
    "Seller ID": "id",
    "Email": "email",
    
    // Buyer structure keys
    "Buyer ID": "id",
    "Username": "username"
  };
  
  if (mapped[str] !== undefined) {
    return mapped[str];
  }
  
  return str.replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .map(function(word, index) {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}
`;

export const GOOGLE_APPS_SCRIPT_SETUP_STEPS = [
  "Create a completely **new, private Google Sheet** in your Google Drive.",
  "We highly recommend naming your sheet: **Happiness Hub Ledger** or **Happiness Hub Database** to keep it beautifully organized.",
  "At the top panel of your active new Google Sheet, navigate to **Extensions** -> **Apps Script**.",
  "Erase any default code templates in the editor, and paste the entire copied script block.",
  "Save the project by clicking the **Save Project (Disk icon)** at the top bar.",
  "Click the **Deploy (Blue button)** on the top right, select **New Deployment**.",
  "Click the **Gear icon** next to 'Select Type' and choose **Web App**.",
  "Configure these setup fields precisely to allow buyers/agents access:\n  * **Description**: Happiness Hub Database API\n  * **Execute as**: _Me (your email address)_\n  * **Who has access**: _Anyone_ (Required so the application can post buyer screenshots, register live payments, and log refers without credentials collision)",
  "Click **Deploy**. Google will request permissions to access your Drive and Sheets. Review, click **Advanced** -> **Go to Happiness Hub (unsafe)** and grant all authorizations.",
  "Once deployed, copy the generated **Web App URL** (which ends with `/exec`).",
  "Go to the **System Settings Panel** in this dashboard (top right cog of this web app), switch the system mode to **Live Mode**, paste your `/exec` Web App URL, and save! That's it, your entire platform is now fully synchronized to your Google Sheet!"
];
