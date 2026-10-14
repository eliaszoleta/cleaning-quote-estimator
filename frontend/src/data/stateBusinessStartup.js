// ─── State cleaning-business startup data ──────────────────────────────────
// Powers /start-a-cleaning-business/:state -- LLC filing cost, business
// license layer, and state tax notes for someone starting a cleaning
// business in a specific state. Keyed by the same `code` used in
// statePricing.js so a page can pull both this data AND the existing
// average-cleaning-price data for that state in one place.
//
// LLC filing fees are standard, publicly published figures, but states do
// change them -- they're presented as approximate and every state page
// should tell the reader to confirm the current fee on the Secretary of
// State's site before filing, not treat this as the final word. Sales-tax
// treatment of cleaning services varies by state and sometimes by exact
// service type within a state, and is deliberately NOT asserted here with
// precision -- readers are pointed to their state department of revenue
// rather than given a flat yes/no that could be wrong for their specific
// situation. This file is informational content, not legal or tax advice.

export const STATE_BUSINESS_STARTUP = [
  { code: 'AL', llcFee: 200, agency: 'Alabama Secretary of State', noIncomeTax: false, note: 'Alabama also requires an initial Business Privilege Tax return within the first few months of formation.' },
  { code: 'AK', llcFee: 250, agency: 'Alaska Division of Corporations', noIncomeTax: false, note: 'Alaska has no state sales tax, though some municipalities levy their own local sales tax.' },
  { code: 'AZ', llcFee: 50, agency: 'Arizona Corporation Commission', noIncomeTax: false, note: 'Arizona requires newspaper publication of your LLC formation in most counties, a small added cost beyond the filing fee.' },
  { code: 'AR', llcFee: 45, agency: 'Arkansas Secretary of State', noIncomeTax: false, note: 'The $45 fee applies to online filing; paper filing runs slightly higher.' },
  { code: 'CA', llcFee: 70, agency: 'California Secretary of State', noIncomeTax: false, note: 'California also charges an $800/year minimum franchise tax on LLCs regardless of income -- factor this into your ongoing budget, not just the one-time filing fee.' },
  { code: 'CO', llcFee: 50, agency: 'Colorado Secretary of State', noIncomeTax: false, note: 'Colorado’s filing process is entirely online and typically processes same-day.' },
  { code: 'CT', llcFee: 120, agency: 'Connecticut Secretary of the State', noIncomeTax: false, note: 'Connecticut requires an annual report with its own separate fee to keep the LLC in good standing.' },
  { code: 'DE', llcFee: 110, agency: 'Delaware Division of Corporations', noIncomeTax: false, note: 'Delaware LLCs owe a flat $300/year franchise tax regardless of where the business actually operates.' },
  { code: 'DC', llcFee: 99, agency: 'DC Department of Licensing and Consumer Protection', noIncomeTax: false, note: 'Washington DC requires a biennial report to keep the LLC active.' },
  { code: 'FL', llcFee: 125, agency: 'Florida Division of Corporations', noIncomeTax: true, note: 'Florida has no state personal income tax, which simplifies planning for a sole-member LLC taxed as a pass-through.' },
  { code: 'GA', llcFee: 100, agency: 'Georgia Secretary of State', noIncomeTax: false, note: 'Georgia requires an annual registration fee to keep the LLC active, separate from the initial filing.' },
  { code: 'HI', llcFee: 50, agency: 'Hawaii Business Registration Division', noIncomeTax: false, note: 'Hawaii’s General Excise Tax applies broadly to services (not a typical sales tax) -- confirm how it applies to cleaning specifically with the Hawaii Department of Taxation.' },
  { code: 'ID', llcFee: 100, agency: 'Idaho Secretary of State', noIncomeTax: false, note: 'Online filing is the cheaper option in Idaho versus filing by mail.' },
  { code: 'IL', llcFee: 150, agency: 'Illinois Secretary of State', noIncomeTax: false, note: 'Illinois requires an annual report with its own fee to stay in good standing.' },
  { code: 'IN', llcFee: 95, agency: 'Indiana Secretary of State', noIncomeTax: false, note: 'Indiana requires a biennial business entity report, separate from the initial filing.' },
  { code: 'IA', llcFee: 50, agency: 'Iowa Secretary of State', noIncomeTax: false, note: 'Iowa’s formation process is straightforward and entirely online.' },
  { code: 'KS', llcFee: 160, agency: 'Kansas Secretary of State', noIncomeTax: false, note: 'Online filing is less expensive than paper filing in Kansas.' },
  { code: 'KY', llcFee: 40, agency: 'Kentucky Secretary of State', noIncomeTax: false, note: 'Kentucky has one of the lowest LLC filing fees in the country.' },
  { code: 'LA', llcFee: 100, agency: 'Louisiana Secretary of State', noIncomeTax: false, note: 'Louisiana requires an annual report filing to keep the LLC active.' },
  { code: 'ME', llcFee: 175, agency: 'Maine Secretary of State', noIncomeTax: false, note: 'Maine requires an annual report with its own fee.' },
  { code: 'MD', llcFee: 100, agency: 'Maryland Department of Assessments and Taxation', noIncomeTax: false, note: 'Maryland requires an annual Personal Property Return filing for LLCs.' },
  { code: 'MA', llcFee: 500, agency: 'Massachusetts Secretary of the Commonwealth', noIncomeTax: false, note: 'Massachusetts has one of the higher LLC filing fees in the country, plus an annual report fee of similar size.' },
  { code: 'MI', llcFee: 50, agency: 'Michigan Department of Licensing and Regulatory Affairs', noIncomeTax: false, note: 'Michigan requires an annual statement filing to keep the LLC active.' },
  { code: 'MN', llcFee: 155, agency: 'Minnesota Secretary of State', noIncomeTax: false, note: 'Mail filing is less expensive than online filing in Minnesota, the reverse of most states.' },
  { code: 'MS', llcFee: 50, agency: 'Mississippi Secretary of State', noIncomeTax: false, note: 'Mississippi’s filing process is entirely online.' },
  { code: 'MO', llcFee: 50, agency: 'Missouri Secretary of State', noIncomeTax: false, note: 'Missouri does not require an annual report for LLCs, which keeps ongoing compliance simple.' },
  { code: 'MT', llcFee: 35, agency: 'Montana Secretary of State', noIncomeTax: false, note: 'Montana has no state sales tax, though this doesn’t exempt you from income tax on business earnings.' },
  { code: 'NE', llcFee: 100, agency: 'Nebraska Secretary of State', noIncomeTax: false, note: 'Nebraska requires newspaper publication of your LLC formation, an added cost beyond the filing fee.' },
  { code: 'NV', llcFee: 425, agency: 'Nevada Secretary of State', noIncomeTax: true, note: 'Nevada’s total startup cost is higher than most states because it bundles Articles of Organization, an initial list of managers/members, and a state business license into the total. In exchange, Nevada has no state personal income tax.' },
  { code: 'NH', llcFee: 100, agency: 'New Hampshire Secretary of State', noIncomeTax: true, note: 'New Hampshire has no broad state sales tax and no tax on earned wages, though it does tax interest and dividend income.' },
  { code: 'NJ', llcFee: 125, agency: 'New Jersey Division of Revenue', noIncomeTax: false, note: 'New Jersey requires an annual report with its own fee to stay in good standing.' },
  { code: 'NM', llcFee: 50, agency: 'New Mexico Secretary of State', noIncomeTax: false, note: 'New Mexico is one of the few states with no annual report requirement for LLCs.' },
  { code: 'NY', llcFee: 200, agency: 'New York Department of State', noIncomeTax: false, note: 'New York requires a publication step after formation (announcing the LLC in two local newspapers) that can add anywhere from roughly $50 to well over $1,000 depending on the county -- New York City counties are notably the most expensive.' },
  { code: 'NC', llcFee: 125, agency: 'North Carolina Secretary of State', noIncomeTax: false, note: 'North Carolina requires an annual report with its own fee.' },
  { code: 'ND', llcFee: 135, agency: 'North Dakota Secretary of State', noIncomeTax: false, note: 'North Dakota requires an annual report to keep the LLC active.' },
  { code: 'OH', llcFee: 99, agency: 'Ohio Secretary of State', noIncomeTax: false, note: 'Ohio does not require an annual report for LLCs, which simplifies ongoing compliance.' },
  { code: 'OK', llcFee: 100, agency: 'Oklahoma Secretary of State', noIncomeTax: false, note: 'Oklahoma requires an annual certificate filing with a modest fee.' },
  { code: 'OR', llcFee: 100, agency: 'Oregon Secretary of State', noIncomeTax: false, note: 'Oregon has no state sales tax, which simplifies pricing (no need to calculate sales tax on services even if your service type would otherwise be taxable elsewhere).' },
  { code: 'PA', llcFee: 125, agency: 'Pennsylvania Department of State', noIncomeTax: false, note: 'Pennsylvania does not require a traditional annual report for most LLCs, though a periodic filing requirement has been phased in -- confirm current requirements before assuming none apply.' },
  { code: 'RI', llcFee: 150, agency: 'Rhode Island Secretary of State', noIncomeTax: false, note: 'Rhode Island requires an annual report with its own fee.' },
  { code: 'SC', llcFee: 110, agency: 'South Carolina Secretary of State', noIncomeTax: false, note: 'South Carolina does not require an annual report for most LLCs.' },
  { code: 'SD', llcFee: 150, agency: 'South Dakota Secretary of State', noIncomeTax: true, note: 'South Dakota has no state personal income tax, and its sales tax is broad enough to cover many services -- confirm cleaning-service taxability with the South Dakota Department of Revenue.' },
  { code: 'TN', llcFee: 300, agency: 'Tennessee Secretary of State', noIncomeTax: true, note: 'Tennessee’s LLC fee scales with the number of members ($50 per member, $300 minimum) and the state has no tax on wage income.' },
  { code: 'TX', llcFee: 300, agency: 'Texas Secretary of State', noIncomeTax: true, note: 'Texas has no state personal income tax. Texas does tax many "real property services," which has historically included janitorial/cleaning services -- confirm current treatment with the Texas Comptroller.' },
  { code: 'UT', llcFee: 54, agency: 'Utah Division of Corporations', noIncomeTax: false, note: 'Utah requires an annual renewal filing with its own modest fee.' },
  { code: 'VT', llcFee: 125, agency: 'Vermont Secretary of State', noIncomeTax: false, note: 'Vermont requires an annual report with its own fee.' },
  { code: 'VA', llcFee: 100, agency: 'Virginia State Corporation Commission', noIncomeTax: false, note: 'Virginia requires an annual registration fee to keep the LLC active.' },
  { code: 'WA', llcFee: 200, agency: 'Washington Secretary of State', noIncomeTax: true, note: 'Washington has no state personal income tax, but applies a Business & Occupation (B&O) tax on gross receipts that applies broadly to service businesses, including cleaning -- confirm current treatment with the Washington Department of Revenue.' },
  { code: 'WV', llcFee: 100, agency: 'West Virginia Secretary of State', noIncomeTax: false, note: 'West Virginia requires an annual report with its own fee.' },
  { code: 'WI', llcFee: 130, agency: 'Wisconsin Department of Financial Institutions', noIncomeTax: false, note: 'Online filing is less expensive than paper filing in Wisconsin.' },
  { code: 'WY', llcFee: 100, agency: 'Wyoming Secretary of State', noIncomeTax: true, note: 'Wyoming has no state personal income tax and is widely considered one of the most business-friendly states for LLC formation, with low ongoing compliance requirements.' },
];

export function getStateBusinessStartupByCode(code) {
  return STATE_BUSINESS_STARTUP.find(s => s.code === code) || null;
}
