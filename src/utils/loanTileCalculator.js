// utils/loanTileCalculator.js
import { calculateMonthlyPayment } from './calculators';

// Helper function to calculate credit card totals
const calculateCreditCardTotals = (loan, interestRate = null) => {
  const principal = loan.principal || 0;
  const rate = interestRate !== null ? interestRate : (loan.rate || 0);
  
  if (principal <= 0 || rate <= 0) return { totalPaid: 0, totalInterest: 0, months: 0 };
  
  let balance = principal;
  let months = 0;
  let totalPaid = 0;
  const monthlyRate = rate / 100 / 12;
  
  while (balance > 0.01 && months < 600) {
    const monthlyInterest = balance * monthlyRate;
    const percentageBasedMin = balance * 0.025; // 2.5% of balance
    const interestPlusMin = monthlyInterest + 10; // Interest + $10 minimum principal
    const currentMinPayment = Math.max(percentageBasedMin, interestPlusMin, 25);
    const actualPayment = Math.min(currentMinPayment, balance);
    const principalPortion = Math.max(0, actualPayment - monthlyInterest);
    
    if (principalPortion <= 0) break;
    
    balance -= principalPortion;
    totalPaid += actualPayment;
    months++;
  }
  
  return {
    totalPaid,
    totalInterest: Math.max(0, totalPaid - principal),
    months
  };
};

// Main function to calculate all tile values for a loan
export const calculateLoanTileValues = (
  loan, 
  totalBudget = 0, 
  refinanceRate = 0,
  payoffInfo = null,
  refinanceInfo = null,
  combinedInfo = null
) => {
  const principal = loan.principal || 0;
  const rate = loan.rate || 0;
  const term = loan.term || 0;
  const isCreditCard = term === 0;
  
  // Determine which refinance rate to use
  // Priority: loan.sourceRefinanceRate (for ALL scenario) > passed refinanceRate
  const effectiveRefinanceRate = loan.sourceRefinanceRate !== undefined 
    ? loan.sourceRefinanceRate 
    : refinanceRate;
  
  console.log(`calculateLoanTileValues for ${loan.name}:`, {
    loanSourceRefinanceRate: loan.sourceRefinanceRate,
    passedRefinanceRate: refinanceRate,
    effectiveRefinanceRate: effectiveRefinanceRate,
    loanRate: rate,
    principal: principal
  });
  
  // Determine tile visibility
  const hasExtraPaymentBudget = totalBudget > 0;
  const hasRefinanceRateSet = effectiveRefinanceRate > 0;
  const refinanceRateIsLower = effectiveRefinanceRate < rate;
  
  const showExtraPaymentsTile = hasExtraPaymentBudget && !!payoffInfo;
  const showRefinanceTile = hasRefinanceRateSet && refinanceRateIsLower && !!refinanceInfo && refinanceInfo.shouldRefinance;
  const showCombinedTile = !!combinedInfo && showExtraPaymentsTile && showRefinanceTile;
  
  console.log(`Tile visibility for ${loan.name}:`, {
    hasExtraPaymentBudget,
    hasRefinanceRateSet,
    refinanceRateIsLower,
    showExtraPaymentsTile,
    showRefinanceTile,
    showCombinedTile,
    refinanceInfoExists: !!refinanceInfo,
    refinanceInfoShouldRefinance: refinanceInfo?.shouldRefinance
  });
  
  // MINIMUM PAYMENT CALCULATION
  let minimumTile = {
    totalPaid: 0,
    totalInterest: 0,
    payoffMonths: 0,
    monthlyPayment: 0
  };
  
  if (principal > 0 && rate > 0) {
    if (isCreditCard) {
      const ccResults = calculateCreditCardTotals(loan);
      minimumTile = {
        totalPaid: ccResults.totalPaid,
        totalInterest: ccResults.totalInterest,
        payoffMonths: ccResults.months,
        monthlyPayment: Math.max(principal * 0.025, 25) // Approximate minimum payment
      };
    } else if (term > 0) {
      const monthlyPayment = calculateMonthlyPayment(principal, rate, term);
      minimumTile = {
        totalPaid: monthlyPayment * term,
        totalInterest: Math.max(0, (monthlyPayment * term) - principal),
        payoffMonths: term,
        monthlyPayment
      };
    }
  }
  
  // EXTRA PAYMENTS TILE
  let extraPaymentsTile = null;
  if (showExtraPaymentsTile && payoffInfo && payoffInfo.schedule) {
    extraPaymentsTile = {
      totalPaid: principal + (payoffInfo.schedule.totalInterest || 0),
      totalInterest: payoffInfo.schedule.totalInterest || 0,
      payoffMonths: payoffInfo.schedule.payoffMonths || 0,
      monthlyPayment: (payoffInfo.requiredPayment || 0) + (payoffInfo.extraPayment || 0),
      extraPayment: payoffInfo.extraPayment || 0,
      interestSaved: (minimumTile.totalInterest || 0) - (payoffInfo.schedule.totalInterest || 0),
      monthsSaved: (minimumTile.payoffMonths || 0) - (payoffInfo.schedule.payoffMonths || 0)
    };
  }
  
  // REFINANCE TILE
  let refinanceTile = null;
  if (showRefinanceTile) {
    if (isCreditCard) {
      // Credit card balance transfer
      const transferFee = Math.max(principal * 0.03, 5);
      const newBalance = principal + transferFee;
      const ccResults = calculateCreditCardTotals({ ...loan, principal: newBalance }, effectiveRefinanceRate);
      refinanceTile = {
        totalPaid: ccResults.totalPaid,
        totalInterest: ccResults.totalInterest,
        payoffMonths: ccResults.months,
        newRate: effectiveRefinanceRate,
        transferFee,
        interestSaved: minimumTile.totalInterest - ccResults.totalInterest,
        monthsSaved: minimumTile.payoffMonths - ccResults.months
      };
    } else {
      // Regular loan refinancing with realistic closing costs
      // Use 2% for loans under $100k, 1.5% for loans over $100k (more realistic for large mortgages)
      const closingCostPercentage = principal < 100000 ? 0.02 : 0.015;
      const closingCosts = principal * closingCostPercentage;
      const newLoanAmount = principal + closingCosts;
      const newMonthlyPayment = calculateMonthlyPayment(newLoanAmount, effectiveRefinanceRate, term);
      const totalPaid = newMonthlyPayment * term;
      const totalInterest = Math.max(0, totalPaid - newLoanAmount);
      
      refinanceTile = {
        totalPaid,
        totalInterest,
        payoffMonths: term,
        newRate: effectiveRefinanceRate,
        closingCosts,
        monthlyPayment: newMonthlyPayment,
        interestSaved: minimumTile.totalInterest - totalInterest,
        monthsSaved: 0 // Regular loans keep same term
      };
    }
  }
  
  // COMBINED TILE
  let combinedTile = null;
  if (showCombinedTile && combinedInfo && combinedInfo.schedule) {
    // For combined tile, we need to account for the refinanced principal
    const isCreditCard = loan.term === 0;
    let refinancedPrincipal = principal;
    
    if (effectiveRefinanceRate < rate && effectiveRefinanceRate > 0) {
      if (isCreditCard) {
        const transferFee = Math.max(principal * 0.03, 5);
        refinancedPrincipal = principal + transferFee;
      } else {
        const closingCostPercentage = principal < 100000 ? 0.02 : 0.015;
        const closingCosts = principal * closingCostPercentage;
        refinancedPrincipal = principal + closingCosts;
      }
    }
    
    combinedTile = {
      totalPaid: refinancedPrincipal + (combinedInfo.schedule.totalInterest || 0),
      totalInterest: combinedInfo.schedule.totalInterest || 0,
      payoffMonths: combinedInfo.schedule.payoffMonths || 0,
      monthlyPayment: (combinedInfo.requiredPayment || 0) + (combinedInfo.extraPayment || 0),
      extraPayment: combinedInfo.extraPayment || 0,
      interestSaved: minimumTile.totalInterest - (combinedInfo.schedule.totalInterest || 0),
      monthsSaved: minimumTile.payoffMonths - (combinedInfo.schedule.payoffMonths || 0),
      totalSaved: combinedInfo.totalSaved || 0
    };
  }
  
  return {
    loan,
    showTiles: {
      minimum: true, // Always show minimum
      extraPayments: showExtraPaymentsTile,
      refinance: showRefinanceTile,
      combined: showCombinedTile
    },
    tiles: {
      minimum: minimumTile,
      extraPayments: extraPaymentsTile,
      refinance: refinanceTile,
      combined: combinedTile
    }
  };
};

// Function to calculate summary totals from loan tile values
export const calculateSummaryTotals = (loanTileValues) => {
  const totals = {
    minimum: { totalPaid: 0, totalInterest: 0, maxMonths: 0 },
    extraPayments: { totalPaid: 0, totalInterest: 0, maxMonths: 0 },
    refinance: { totalPaid: 0, totalInterest: 0, maxMonths: 0 },
    combined: { totalPaid: 0, totalInterest: 0, maxMonths: 0 }
  };
  
  console.log('Loan Tile Values Debug:', loanTileValues.map(lv => ({
    loanName: lv.loan.name,
    sourceRefinanceRate: lv.loan.sourceRefinanceRate,
    showTiles: lv.showTiles,
    minimumTotalPaid: lv.tiles.minimum?.totalPaid || 0,
    extraPaymentsTotalPaid: lv.tiles.extraPayments?.totalPaid || 0,
    refinanceTotalPaid: lv.tiles.refinance?.totalPaid || 0,
    combinedTotalPaid: lv.tiles.combined?.totalPaid || 0
  })));
  
  loanTileValues.forEach(loanData => {
    const { tiles } = loanData;
    
    // Minimum (always present)
    if (tiles.minimum) {
      totals.minimum.totalPaid += tiles.minimum.totalPaid || 0;
      totals.minimum.totalInterest += tiles.minimum.totalInterest || 0;
      totals.minimum.maxMonths = Math.max(totals.minimum.maxMonths, tiles.minimum.payoffMonths || 0);
    }
    
    // Extra payments (use extra payment value if tile exists, otherwise minimum)
    const extraTile = tiles.extraPayments || tiles.minimum;
    if (extraTile) {
      totals.extraPayments.totalPaid += extraTile.totalPaid || 0;
      totals.extraPayments.totalInterest += extraTile.totalInterest || 0;
      totals.extraPayments.maxMonths = Math.max(totals.extraPayments.maxMonths, extraTile.payoffMonths || 0);
    }
    
    // Refinance (use refinance value if tile exists, otherwise minimum)
    const refinanceTile = tiles.refinance || tiles.minimum;
    if (refinanceTile) {
      totals.refinance.totalPaid += refinanceTile.totalPaid || 0;
      totals.refinance.totalInterest += refinanceTile.totalInterest || 0;
      totals.refinance.maxMonths = Math.max(totals.refinance.maxMonths, refinanceTile.payoffMonths || 0);
    }
    
    // Combined (use combined value if tile exists, otherwise use extra payments value, otherwise minimum)
    let combinedValue;
    if (tiles.combined) {
      combinedValue = tiles.combined;
    } else if (tiles.extraPayments) {
      // If no combined tile but has extra payments, use extra payments as the best available strategy
      combinedValue = tiles.extraPayments;
    } else {
      // Fallback to minimum
      combinedValue = tiles.minimum;
    }
    
    if (combinedValue) {
      totals.combined.totalPaid += combinedValue.totalPaid || 0;
      totals.combined.totalInterest += combinedValue.totalInterest || 0;
      totals.combined.maxMonths = Math.max(totals.combined.maxMonths, combinedValue.payoffMonths || 0);
    }
  });
  
  console.log('Summary Totals Breakdown:', totals);
  
  return totals;
};