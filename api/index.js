/* =========================================================
   SERVER LAYER – DYNAMIC PRICING ENGINE V6
   Enterprise Ready – Multi Scenario + Chat Adapter
========================================================= */

const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

const { calculatePremium } = require("../pricingEngineV6")
const { Categories } = require("../types/vehicleInput")
const { parseVietnameseInput } = require("../parsers/vietnameseParser")

const app = express()
const PORT = process.env.PORT || 5000


/* =========================================================
   SECURITY & MIDDLEWARE
========================================================= */

app.use(cors({
  origin: "https://insurance-frontend-beta.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  })
);


/* =========================================================
   UTILITIES
========================================================= */

function money(v) {
  return Math.round(v).toLocaleString("vi-VN")
}

function buildSingleResultBlock(result, label) {
  if (!result || result.error) return ""

  return `
━━━━━━━━━━━━━━━━━━
🚗 ${label}

Phí gốc: ${money(result.premiumBeforeVAT)} đ
VAT 10%: ${money(result.vat)} đ
👉 Tổng thanh toán: ${money(result.total)} đ
`
}

function buildChatResponse(results, durationDays) {
  if (!results || results.length === 0) {
    return `Trường hợp này, vui lòng để lại SĐT để CSKH hỗ trợ chi tiết.`
  }

  let body = `
🤖 BOT FUBON – BÁO PHÍ THEO PHỤ LỤC I (NĐ 67/2023/NĐ-CP)

📅 Thời hạn: ${durationDays} ngày
`

  results.forEach(r => {
    const label =
      r.category === "CAR_BUSINESS"
        ? "Xe kinh doanh"
        : r.category === "CAR_NON_BUSINESS"
        ? "Xe không kinh doanh"
        : r.category

    body += buildSingleResultBlock(r, label)
  })

  body += `
📌 Phí tính đúng theo quy định pháp luật hiện hành.
`

  return body
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    service: "Dynamic Pricing Engine V6",
    legal: "Nghị định 67/2023/NĐ-CP",
    version: "ND67_2023_V6",
    status: "RUNNING"
  })
})

/* =========================================================
   ENTERPRISE STRUCTURED API
   POST /calculate
========================================================= */

app.post("/calculate", (req, res) => {
  try {
    const input = req.body

    if (!input.category || !Categories.includes(input.category)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_CATEGORY"
      })
    }

    if (!input.durationDays || input.durationDays <= 0) {
      return res.status(400).json({
        success: false,
        error: "INVALID_DURATION"
      })
    }

    const result = calculatePremium(input)

    return res.json({
      success: true,
      data: result
    })

  } catch (err) {
    console.error("STRUCTURED ENGINE ERROR:", err.message)

    return res.status(400).json({
      success: false,
      error: err.message
    })
  }
})

/* =========================================================
   CHAT ADAPTER – MULTI SCENARIO
   POST /chat
========================================================= */

app.post("/chat", (req, res) => {
  try {
    const { message } = req.body

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "INVALID_INPUT_TEXT"
      })
    }

    const structured = parseVietnameseInput(message)

    let possibleCategories = structured.possibleCategories

    // 🔥 Fallback nếu parser cũ chưa trả possibleCategories
    if (!possibleCategories && structured.category) {
      possibleCategories = [structured.category]
    }

    if (!possibleCategories || possibleCategories.length === 0) {
      return res.json({
        reply: "❌ Không xác định được loại xe. Vui lòng nhập rõ hơn."
      })
    }

    const results = []

    for (const category of possibleCategories) {
      const input = {
        category,
        seats: structured.seats,
        tonnage: structured.tonnage,
        cc: structured.cc,
        specialType: structured.specialType,
        durationDays: structured.durationDays || 365
      }

      try {
        const calc = calculatePremium(input)
        results.push({ ...calc, category })
      } catch (e) {
        console.error("CALC ERROR:", e.message)
      }
    }

    if (results.length === 0) {
      return res.json({
        reply: "❌ Không thể tính phí. Vui lòng kiểm tra lại định dạng."
      })
    }

    const reply = buildChatResponse(results, structured.durationDays || 365)

    return res.json({ reply })

  } catch (err) {
    console.error("CHAT ENGINE ERROR:", err.message)

    return res.json({
      reply: "❌ Không thể tính phí. Vui lòng kiểm tra lại định dạng."
    })
  }
})

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err)
  res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR"
  })
})

/* =========================================================
   START SERVER
========================================================= */

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(
      `🚀 Dynamic Pricing Engine V6 running at http://localhost:${PORT}`
    )
  })
}

module.exports = app;