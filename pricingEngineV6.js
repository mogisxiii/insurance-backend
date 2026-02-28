// pricingEngineV6.js
// Dynamic Pricing Engine V6 – ND 67/2023/NĐ-CP
// Enterprise Structured Version

const VAT_RATE = 0.1

// =============================
// BASE PREMIUM RESOLVERS
// =============================

function resolveMotorbike2W(cc) {
  if (cc == null) throw new Error("MOTORBIKE_2W requires cc")

  return cc < 50 ? 55000 : 60000
}

function resolveMotorbike3W() {
  return 290000
}

function resolveElectricBike() {
  return 55000
}

function resolveOtherMotorbike() {
  return 290000
}

// IV – Car Non Business
function resolveCarNonBusiness(seats) {
  if (!seats) throw new Error("CAR_NON_BUSINESS requires seats")

  if (seats < 6) return 437000
  if (seats >= 6 && seats <= 11) return 794000
  if (seats >= 12 && seats <= 24) return 1270000
  if (seats > 24) return 1825000

  throw new Error("Invalid seats for CAR_NON_BUSINESS")
}

// V – Car Business
function resolveCarBusiness(seats) {
  if (!seats) throw new Error("CAR_BUSINESS requires seats")

  const table = {
    5: 756000,
    6: 929000,
    7: 1080000,
    8: 1253000,
    9: 1404000,
    10: 1512000,
    11: 1656000,
    12: 1822000,
    13: 2049000,
    14: 2221000,
    15: 2394000,
    16: 3054000,
    17: 2718000,
    18: 2869000,
    19: 3041000,
    20: 3191000,
    21: 3364000,
    22: 3515000,
    23: 3688000,
    24: 4632000,
    25: 4813000
  }

  if (seats <= 5) return 756000
  if (seats > 25) {
    return 4813000 + 30000 * (seats - 25)
  }

  return table[seats] || 756000
}

// VI – Truck
function resolveTruck(tonnage) {
  if (tonnage == null) throw new Error("TRUCK requires tonnage")

  if (tonnage < 3) return 853000
  if (tonnage >= 3 && tonnage <= 8) return 1660000
  if (tonnage > 8 && tonnage <= 15) return 2746000
  if (tonnage > 15) return 3200000

  throw new Error("Invalid tonnage")
}

// =============================
// SPECIAL (VII)
// =============================

function resolveSpecial(input) {
  const { specialType, seats, tonnage } = input

  if (!specialType) throw new Error("SPECIAL requires specialType")

  switch (specialType) {

    case "LEARNER": {
      if (tonnage != null) {
        return resolveTruck(tonnage) * 1.2
      }
      return resolveCarNonBusiness(seats) * 1.2
    }

    case "TAXI": {
      return resolveCarBusiness(seats) * 1.7
    }

    case "AMBULANCE": {
      return 933000 * 1.2 // pickup business
    }

    case "CASH_TRANSPORT": {
      return 437000 * 1.2
    }

    case "SPECIAL_TRUCK_BASED": {
      if (tonnage != null) {
        return resolveTruck(tonnage) * 1.2
      }
      return 853000 * 1.2
    }

    case "TRACTOR_HEAD": {
      return 3200000 * 1.5
    }

    case "TRACTOR": {
      return 853000 * 1.2
    }

    case "BUS": {
      return resolveCarNonBusiness(seats)
    }

    default:
      throw new Error("Invalid specialType")
  }
}

// =============================
// DURATION (Phụ lục I B)
// =============================

function calculateByDuration(annualPremium, days) {
  if (!days || days <= 0) throw new Error("Invalid durationDays")

  if (days <= 30) {
    return annualPremium / 12
  }

  return (annualPremium * days) / 365
}

// =============================
// MAIN ENGINE
// =============================

function calculatePremium(input) {
  const {
    category,
    seats,
    tonnage,
    cc,
    durationDays
  } = input

  if (!category) throw new Error("category is required")

  let annualPremium = 0

  switch (category) {

    case "MOTORBIKE_2W":
      annualPremium = resolveMotorbike2W(cc)
      break

    case "MOTORBIKE_3W":
      annualPremium = resolveMotorbike3W()
      break

    case "ELECTRIC_BIKE":
      annualPremium = resolveElectricBike()
      break

    case "OTHER_MOTORBIKE":
      annualPremium = resolveOtherMotorbike()
      break

    case "CAR_NON_BUSINESS":
      annualPremium = resolveCarNonBusiness(seats)
      break

    case "CAR_BUSINESS":
      annualPremium = resolveCarBusiness(seats)
      break

    case "TRUCK":
      annualPremium = resolveTruck(tonnage)
      break

    case "SPECIAL":
      annualPremium = resolveSpecial(input)
      break

    default:
      throw new Error("Invalid category")
  }

  const premiumByDuration = calculateByDuration(
    annualPremium,
    durationDays
  )

  const vat = premiumByDuration * VAT_RATE
  const total = premiumByDuration + vat

  return {
    version: "ND67_2023_V6",
    annualPremium,
    durationDays,
    premiumBeforeVAT: Math.round(premiumByDuration),
    vat: Math.round(vat),
    total: Math.round(total)
  }
}

module.exports = {
  calculatePremium
}