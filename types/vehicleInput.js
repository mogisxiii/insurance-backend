const { Categories, SpecialTypes } = require("../vehicle")

function validateVehicleInput(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_VEHICLE_INPUT")
  }

  const {
    category,
    seats,
    tonnage,
    cc,
    specialType,
    durationDays
  } = input

  if (!Categories.includes(category)) {
    throw new Error("INVALID_CATEGORY")
  }

  if (specialType && !SpecialTypes.includes(specialType)) {
    throw new Error("INVALID_SPECIAL_TYPE")
  }

  if (!durationDays || durationDays <= 0) {
    throw new Error("INVALID_DURATION")
  }

  switch (category) {

    case "CAR_NON_BUSINESS":
    case "CAR_BUSINESS":
      if (!seats || seats <= 0) {
        throw new Error("SEATS_REQUIRED")
      }
      break

    case "TRUCK":
      if (!tonnage || tonnage <= 0) {
        throw new Error("TONNAGE_REQUIRED")
      }
      break

    case "MOTORBIKE_2W":
    case "MOTORBIKE_3W":
    case "ELECTRIC_BIKE":
    case "OTHER_MOTORBIKE":
      if (!cc || cc <= 0) {
        throw new Error("CC_REQUIRED")
      }
      break

    case "SPECIAL":
      if (!specialType) {
        throw new Error("SPECIAL_TYPE_REQUIRED")
      }
      break
  }

  return {
    category,
    seats: seats ?? null,
    tonnage: tonnage ?? null,
    cc: cc ?? null,
    specialType: specialType ?? null,
    durationDays
  }
}

module.exports = { validateVehicleInput }