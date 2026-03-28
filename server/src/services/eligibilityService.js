function toLower(value) {
  return String(value || "").trim().toLowerCase();
}

function hasOverlap(source = [], target = []) {
  const sourceSet = new Set(source.map(toLower));
  return target.some((item) => sourceSet.has(toLower(item)));
}

function getPhoneUserCategory(farmer) {
  const phoneType = toLower(farmer.phoneType);
  const proficiency = toLower(farmer.smartphoneProficiency);
  if (phoneType === "keypad" || ["none", "low", "medium"].includes(proficiency)) {
    return "KEYPAD_OR_LOW_SMARTPHONE";
  }
  return "SMARTPHONE_USER";
}

function matchesLocation(farmer, allowedLocations = []) {
  if (!allowedLocations.length) {
    return true;
  }
  const allowed = allowedLocations.map(toLower);
  const district = toLower(farmer.location?.district);
  const state = toLower(farmer.location?.state);
  return allowed.includes(district) || allowed.includes(state);
}

function checkEligibility(farmer, scheme) {
  const reasons = [];
  let score = 0;

  if (scheme.minLandArea != null && farmer.landAreaHectare < scheme.minLandArea) {
    return { eligible: false, score: 0, reasons: [] };
  }
  if (scheme.maxLandArea != null && farmer.landAreaHectare > scheme.maxLandArea) {
    return { eligible: false, score: 0, reasons: [] };
  }
  if (scheme.minIncome != null && farmer.annualIncome < scheme.minIncome) {
    return { eligible: false, score: 0, reasons: [] };
  }
  if (scheme.maxIncome != null && farmer.annualIncome > scheme.maxIncome) {
    return { eligible: false, score: 0, reasons: [] };
  }
  if (!matchesLocation(farmer, scheme.allowedLocations || [])) {
    return { eligible: false, score: 0, reasons: [] };
  }

  if (
    (scheme.allowedCastes || []).length &&
    !scheme.allowedCastes.map(toLower).includes(toLower(farmer.caste))
  ) {
    return { eligible: false, score: 0, reasons: [] };
  }

  if ((scheme.allowedCastes || []).length) {
    reasons.push(`Caste criteria matched (${farmer.caste})`);
    score += 2;
  }

  if ((scheme.cropTags || []).length && hasOverlap(farmer.crops || [], scheme.cropTags || [])) {
    reasons.push("Crop profile aligned");
    score += 3;
  }

  const preferredPhoneType = (scheme.targetPhoneType || []).map(toLower);
  if (preferredPhoneType.length && preferredPhoneType.includes(toLower(farmer.phoneType))) {
    reasons.push(`Fit for ${toLower(farmer.phoneType)} users`);
    score += 2;
  }

  score += scheme.priorityWeight || 0;
  reasons.push(`Priority weight: ${scheme.priorityWeight || 0}`);

  return { eligible: true, score, reasons };
}

function getEligibleSchemesForFarmer(farmer, schemes) {
  return schemes
    .map((scheme) => {
      const { eligible, score, reasons } = checkEligibility(farmer, scheme);
      return {
        ...scheme,
        score,
        reasons,
        isEligible: eligible,
      };
    })
    .filter((item) => item.isEligible);
}

function scoreSchemesByPriority(farmer, schemes) {
  return schemes
    .map((scheme) => ({
      ...scheme,
      isGuidedByVoice: getPhoneUserCategory(farmer) === "KEYPAD_OR_LOW_SMARTPHONE",
    }))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  getPhoneUserCategory,
  getEligibleSchemesForFarmer,
  scoreSchemesByPriority,
};

