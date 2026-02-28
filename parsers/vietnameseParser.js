function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function extractSeats(text) {
  const match = text.match(/(\d+)\s*cho/)
  return match ? parseInt(match[1], 10) : null
}

function extractTonnage(text) {
  const match = text.match(/(\d+(\.\d+)?)\s*tan/)
  return match ? parseFloat(match[1]) : null
}

function extractDuration(text) {
  const match = text.match(/(\d+)\s*ngay/)
  return match ? parseInt(match[1], 10) : 365
}

function detectBusinessFlag(text) {
  if (text.includes("khong kinh doanh")) return false
  if (text.includes("kinh doanh")) return true
  return null
}

function detectVehicleBase(text) {
  if (text.includes("xe tai")) return "TRUCK"
  if (text.includes("taxi")) return "SPECIAL"
  if (text.includes("cuu thuong")) return "SPECIAL"
  if (text.includes("dau keo")) return "SPECIAL"
  if (text.includes("xe")) return "CAR"
  throw new Error("UNSUPPORTED_VEHICLE_TYPE")
}

function parseVietnameseInput(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("INVALID_INPUT")
  }

  const text = normalizeText(rawText)

  const baseType = detectVehicleBase(text)
  const businessFlag = detectBusinessFlag(text)

  const seats = extractSeats(text)
  const tonnage = extractTonnage(text)
  const durationDays = extractDuration(text)

  let possibleCategories = []

  if (baseType === "CAR") {
    if (businessFlag === true) {
      possibleCategories = ["CAR_BUSINESS"]
    } else if (businessFlag === false) {
      possibleCategories = ["CAR_NON_BUSINESS"]
    } else {
      // Không rõ → trả 2 phương án
      possibleCategories = ["CAR_NON_BUSINESS", "CAR_BUSINESS"]
    }
  }

  if (baseType === "TRUCK") {
    possibleCategories = ["TRUCK"]
  }

  if (baseType === "SPECIAL") {
    possibleCategories = ["SPECIAL"]
  }

  return {
    possibleCategories,
    seats,
    tonnage,
    cc: null,
    specialType: null,
    durationDays
  }
}

module.exports = { parseVietnameseInput }