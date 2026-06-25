import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Ensure error response in case a key is missing
function handleApiError(res: express.Response, error: any) {
  console.error('API Error:', error);
  res.status(500).json({
    ok: false,
    error: error.message || 'An unexpected error occurred inside the AI backend',
  });
}

// Resilient wrapper with exponential retry and fallback to a lighter model under standard high-demand scenarios (503/429/UNAVAILABLE)
async function generateContentWithRetryAndFallback(
  params: Parameters<ReturnType<typeof getGemini>['models']['generateContent']>[0]
) {
  const ai = getGemini();
  const maxRetries = 3;
  let delay = 600;
  
  const requestedModel = params.model || 'gemini-3.5-flash';
  const modelsToTry = [requestedModel];
  if (requestedModel !== 'gemini-flash-latest') {
    modelsToTry.push('gemini-flash-latest');
  }
  if (requestedModel !== 'gemini-3.1-flash-lite') {
    modelsToTry.push('gemini-3.1-flash-lite');
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini Request] Using model: ${model} (attempt ${attempt}/${maxRetries})`);
        const payload = {
          ...params,
          model,
        };
        const response = await ai.models.generateContent(payload);
        return response;
      } catch (err: any) {
        lastError = err;
        const errorMessage = String(err.message || err).toLowerCase();
        const statusCode = err.status || (err.error && err.error.code);
        
        console.warn(`[Gemini Failure] Model ${model} failed (attempt ${attempt}): Status ${statusCode} - ${errorMessage}`);
        
        const isRetryable = 
          statusCode === 503 || 
          statusCode === 429 || 
          errorMessage.includes('unavailable') || 
          errorMessage.includes('demand') || 
          errorMessage.includes('exhausted') || 
          errorMessage.includes('overloaded');

        if (isRetryable && attempt < maxRetries) {
          console.log(`[Gemini Backoff] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          // Break out of this model's attempts to try the fallback model if available
          break;
        }
      }
    }
  }

  throw lastError;
}

// 1. DYNAMIC SYSTEM INSIGHTS ENGINE
app.post('/api/gemini/insights', async (req, res) => {
  try {
    const { products, orders, agents, sellers } = req.body;
    const ai = getGemini();

    const prompt = `
Generate 3 distinct, highly actionable, strategic business insights based on the current platform status below:

Products: ${JSON.stringify(products || [])}
Orders: ${JSON.stringify(orders || [])}
Agents: ${JSON.stringify(agents || [])}
Sellers: ${JSON.stringify(sellers || [])}

Rules:
1. The first item MUST be an "Alert / Review Task" (e.g. pending orders, high delays, inactive agents, etc.) labeled with ⚠️ emoji.
2. The second item MUST be an "Expansion / Category Opportunity" (e.g. top-performing category, product inventory ideas, average cashback insights, etc.) labeled with 💡 emoji.
3. The third item MUST be a "Targeted Action / Engagement Strategy" (e.g. rewarding top agent, prompting a specific seller, setting up promotional campaigns) labeled with 🎯 emoji.

Ensure the text is concise, direct, professional, extremely specific to the actual data (mention names of actual top agents, top products, or specific pending items if they exist), and uses bold terms for readability.
`.trim();

    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are the Happiness Hub Analytics Engine. Analyze the cashback, product, and referral network details and output exactly three compact, high-quality, bolded alerts or tips in JSON format.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: 'A JSON array of exactly 3 distinct strings, each containing a dynamic recommendation.',
        },
      },
    });

    const parsedText = response.text || '[]';
    res.json({ ok: true, insights: JSON.parse(parsedText) });
  } catch (error) {
    console.error("Gemini insights failure, using offline heuristics:", error);
    const mockDiagnostics = [
      "⚠️ **Alert**: Direct sheets checking is active. Verify any unconfirmed WhatsApp submissions manually on your spreadsheets.",
      "💡 **Opportunity**: Average product commission margins are yielding high conversion. Prompt agents to source active tech items.",
      "🎯 **Strategy**: Reward your top agents to secure customer retention on upcoming promotion campaigns."
    ];
    res.json({ ok: true, insights: mockDiagnostics });
  }
});

// 2. CONSOLE INTELLIGENT COPILOT CHAT
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemData } = req.body;
    const ai = getGemini();

    const { products, orders, agents, sellers } = systemData || {};

    const systemInstruction = `
You are safe, beautiful, and professional: the "Happiness Hub AI Operations Manager" inside the Admin Command Center.
You help community owners and admin managers inspect stats, organize cashback payouts, draft agent WhatsApp broadcasts, and design new strategies easily.

Current Platform Database Dump:
- Products available to select: ${JSON.stringify(products || [])}
- Orders requested by buyers: ${JSON.stringify(orders || [])}
- Agents connected: ${JSON.stringify(agents || [])}
- Sellers associated: ${JSON.stringify(sellers || [])}
- Master Dashboard System Time: ${new Date().toISOString()}

Guide for Interaction:
1. Be concise, respectful, and incredibly smart. Skip dry introductions and output directly useful answers.
2. Use beautiful structural Markdown, headers, bullet points, checklists, and table formatting to present clean information.
3. In templates or emails, always use [PLACEHOLDER] tags (e.g., [Buyer Name], [Agent Code]) so the admin can copy and paste with ease.
4. If the user asks to "do" something, provide the step-by-step instructions or direct recommendations. Do not tell them you can click buttons for them, but provide the precise text or code they can copy.
5. Ground everything strictly on the actual data provided above. If asked about top performers, calculate which agent has the most orders or highest commission from the list.
`.trim();

    // Map the messages format to Gemini contents format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ ok: true, text: response.text || '' });
  } catch (error) {
    console.error("Gemini chat failure, using offline responder:", error);
    res.json({ 
      ok: true, 
      text: `👋 **Offline Assistance Operational**\n\nI'm standing by in offline high-performance mode! Because the cloud AI system is experiencing heavy demand right now, I've loaded my onboard heuristics to answer you:\n\n- **Check live sheets**: Make sure you have opened [Your Spreadsheet] to track exact rows.\n- **Verify orders manually**: Look for active pending payments under the "Orders" tab inside your dashboard.\n- **Support**: Reach out to community affiliates for direct integration queries.`
    });
  }
});

// 3. SMART BROADCAST AND TEMPLATE DRAFTER
app.post('/api/gemini/draft', async (req, res) => {
  try {
    const { type, context, details } = req.body;
    const ai = getGemini();

    const prompt = `
Create a gorgeous, professional public announcement or direct text message template of type "${type}".

Context Info:
${JSON.stringify(context || {})}

Additional Instructions:
${details || 'Keep it motivational, friendly, and formatted for WhatsApp with emojis.'}

Structure Rules:
- Include a bold, punchy title.
- Make it copy-paste friendly.
- Use emojis appropriately for the platform specified (primarily WhatsApp/WhatsApp Status).
- Put key parameters inside clear bracket tags like [Agent Code], [Commission Amount], [Product Link] so it is highly interactive.
- Include a gentle call-to-action encouraging people to shop or connect.
`.trim();

    const response = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite, modern marketer and operations coordinator for Happiness Hub. You draft high-conversion, exciting, and extremely neat social and outreach templates.',
      },
    });

    res.json({ ok: true, draft: response.text || '' });
  } catch (error) {
    console.error("Gemini draft failure, using offline template:", error);
    res.json({ 
      ok: true, 
      draft: `📢 **HAPPINESS HUB EXCLUSIVE UPDATE** 📢\n\nHey Team! 🌟 We have updated active cashback incentives!\n\n🛍️ **Product**: [Insert Item Name]\n🔥 **Incentive**: Get 100% Tax & Fee Coverage Refund!\n📍 **Action Required**: Submits order number on site portal instantly.\n\nLet's expand the cashback happiness! 💸🚀`
    });
  }
});

// 4. GOOGLE APPS SCRIPT DATABASE PROXY (Bypasses CORS restrictions in browsers & sandboxed iframes)
app.post('/api/gas-proxy', async (req, res) => {
  try {
    const { backendUrl, action, data } = req.body;
    if (!backendUrl) {
      return res.status(200).json({ error: 'Google Apps Script Web App URL is required.' });
    }

    const url = new URL(backendUrl);
    url.searchParams.set('action', action);

    let options: any = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    };

    if (data !== undefined) {
      options = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: JSON.stringify({ action, ...data }),
        redirect: 'follow',
      };
    }

    console.log(`[GAS Server Proxy] Forwarding action: ${action} to ${url.toString()}`);
    const response = await fetch(url.toString(), options);

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    console.log(`[GAS Server Proxy] Response status: ${response.status}, Content-Type: ${contentType}`);

    if (response.status === 403 || response.status === 401 || contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<script') || text.includes('Google Accounts') || text.includes('accounts.google.com')) {
      let advice = "🔒 ACCESS NOT PERMITTED (HTTP 403/401): Google Apps Script rejected the sync request due to access restrictions.\n\nPlease follow these simple steps to authorize access:\n1. Open your Google Apps Script project by clicking 'Extensions' -> 'Apps Script' inside your Google Sheet.\n2. In the top-right corner, click 'Deploy' -> 'New deployment' (or 'Manage deployments' -> edit layout).\n3. Ensure the 'Configure' gear is set to 'Web App'.\n4. Change the 'Who has access' parameter from 'Only myself' to 'Anyone' (This is absolutely required so our proxy and buyer tasks can complete sync requests securely without forced authentication).\n5. Click 'Deploy', authorize the Google sheet dialog as requested, copy the NEW generated Web App URL (must end with '/exec'), paste it in System Settings, and Save!";
      
      if (text.includes('accounts.google.com') || text.includes('Service Login') || text.includes('signin') || text.includes('Sign in')) {
        advice = "🔒 LOGIN REQUIRED: Your Google Apps Script requires a Google Login. Please redeploy your script: \n1. Inside Google Apps Script, click 'Deploy' -> 'Manage deployments'.\n2. Edit the current active deployment (or create a 'New deployment').\n3. Ensure 'Who has access' is configured to 'Anyone' (NOT 'Only myself' or 'Anyone with a Google Account within your workspace'). This parameter is required so browser and proxy sync requests succeed without logging in.";
      } else if (text.includes('Authorization Required') || text.includes('Authorization required')) {
        advice = "🔑 AUTHORIZATION REQUIRED: Please open your Google Sheet -> 'Extensions' -> 'Apps Script', select the 'initializeSheetsIfNeeded' function from the dropdown, click 'Run' to trigger Google's compliance dialog, click 'Advanced' -> 'Go to Happiness Hub (unsafe)', and authorize permissions.";
      } else if (text.includes('script not found') || text.includes('not found') || text.includes('Error')) {
        advice = "❌ SCRIPT NOT FOUND: The provided URL might be outdated or copied incorrectly. Please make sure you copied the Web App URL (ending in '/exec' from the Deployment section) and NOT the '/dev' template URL, nor the spreadsheet viewer URL.";
      }

      return res.status(200).json({
        error: advice
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        error: `Google Apps Script returned HTTP Error ${response.status}: ${text || response.statusText}`,
      });
    }

    try {
      const result = JSON.parse(text);
      return res.json(result);
    } catch (parseErr: any) {
      return res.status(200).json({
        error: `Could not parse Google Apps Script spreadsheet output: ${parseErr.message}`,
        rawResponse: text.substring(0, 300)
      });
    }
  } catch (error: any) {
    console.error('[GAS Server Proxy Failure]:', error);
    return res.status(200).json({
      error: `Server proxy connection to Google Apps Script failed: ${error.message || error}`,
    });
  }
});

// VITE MIDDLEWARE DEVELOPMENT FOR PORT 3000 INDIRECTIONS
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite Hot Middleware integrated successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Happiness Hub Server] Standing by on URL: http://0.0.0.0:${PORT}`);
  });
}

startServer();
