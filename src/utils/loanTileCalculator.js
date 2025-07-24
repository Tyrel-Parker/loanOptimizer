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
  combinedInfo = null,
  allLoans = [],
  fullPayoffSchedule = [] // Add the full payoff schedule
) => {
  const principal = loan.principal || 0;
  const rate = loan.rate || 0;
  const term = loan.term || 0;
  const isCreditCard = term === 0;
  
  // Determine which refinance rate to use
  const effectiveRefinanceRate = loan.sourceRefinanceRate !== undefined 
    ? loan.sourceRefinanceRate 
    : refinanceRate;
  
  // Determine tile visibility
  const hasExtraPaymentBudget = totalBudget > 0;
  const hasRefinanceRateSet = effectiveRefinanceRate > 0;
  const refinanceRateIsLower = effectiveRefinanceRate < rate;
  
  const showExtraPaymentsTile = hasExtraPaymentBudget && !!payoffInfo;
  const showRefinanceTile = hasRefinanceRateSet && refinanceRateIsLower && !!refinanceInfo && refinanceInfo.shouldRefinance;
  const showCombinedTile = !!combinedInfo && showExtraPaymentsTile && showRefinanceTile;
  
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
        monthlyPayment: Math.max(principal * 0.025, 25)
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
    const actualExtraPayment = payoffInfo.extraPayment || 0;
    const thisLoanMinimum = minimumTile.monthlyPayment || 0;
    
    // Calculate display values
    let displayExtraPayment = actualExtraPayment;
    let displayTotalPayment = thisLoanMinimum + actualExtraPayment;
    
    if (fullPayoffSchedule && fullPayoffSchedule.length > 0) {
      // Use consistent calculation for all loans based on payoff order
      
      // Sort loans by actual payoff order from the schedule
      const loansByPayoffOrder = [...fullPayoffSchedule].sort((a, b) => {
        const aPayoffMonths = a.schedule?.payoffMonths || Infinity;
        const bPayoffMonths = b.schedule?.payoffMonths || Infinity;
        return aPayoffMonths - bPayoffMonths;
      });
      
      // Find this loan's position in the payoff order
      const thisLoanIndex = loansByPayoffOrder.findIndex(l => l.id === loan.id);
      
      if (thisLoanIndex >= 0) {
        // Calculate minimums for loans that will still be active when this loan becomes focus
        let remainingLoansMinimums = 0;
        for (let i = thisLoanIndex; i < loansByPayoffOrder.length; i++) {
          const remainingLoan = loansByPayoffOrder[i];
          const originalLoanData = allLoans.find(l => {
            const loanId = String(l.id);
            const remainingLoanId = String(remainingLoan.id);
            
            return loanId === remainingLoanId || 
                   loanId === remainingLoanId.split('_')[1] ||
                   remainingLoanId === loanId ||
                   (remainingLoanId.includes('_') && loanId === remainingLoanId.split('_')[1]);
          });
          
          if (originalLoanData) {
            let loanMinimum = 0;
            if (originalLoanData.term === 0) {
              loanMinimum = Math.max(originalLoanData.principal * 0.025, 25);
            } else if (originalLoanData.term > 0) {
              loanMinimum = calculateMonthlyPayment(originalLoanData.principal, originalLoanData.rate, originalLoanData.term);
            }
            remainingLoansMinimums += loanMinimum;
          }
        }
        
        // Available extra for this loan = total budget - remaining loans' minimums
        const calculatedExtraPayment = Math.max(0, totalBudget - remainingLoansMinimums);
        const calculatedTotalPayment = thisLoanMinimum + calculatedExtraPayment;
        
        // Debug logging for the first loan issue
        console.log(`Calculation for ${loan.name} (index ${thisLoanIndex}):`, {
          totalBudget,
          thisLoanMinimum,
          remainingLoansMinimums,
          calculatedExtraPayment,
          calculatedTotalPayment,
          actualExtraPayment,
          hasActualExtra: actualExtraPayment > 0
        });
        
        // Use calculated values for ALL loans to ensure consistency
        displayExtraPayment = calculatedExtraPayment;
        displayTotalPayment = calculatedTotalPayment;
        
        console.log(`After setting displayExtraPayment for ${loan.name}:`, {
          calculatedExtraPayment,
          displayExtraPayment,
          actualExtraPayment,
          shouldBeCalculated: calculatedExtraPayment
        });
        
        // Sanity check: total payment should never exceed budget
        if (displayTotalPayment > totalBudget) {
          displayTotalPayment = totalBudget;
          displayExtraPayment = Math.max(0, totalBudget - thisLoanMinimum);
        }
      }
    } else {
      // Fallback if we don't have full schedule data
      if (actualExtraPayment > 0) {
        displayExtraPayment = actualExtraPayment;
        displayTotalPayment = thisLoanMinimum + actualExtraPayment;
      } else {
        displayExtraPayment = 0;
        displayTotalPayment = thisLoanMinimum;
      }
    }
    
    extraPaymentsTile = {
      totalPaid: principal + (payoffInfo.schedule.totalInterest || 0),
      totalInterest: payoffInfo.schedule.totalInterest || 0,
      payoffMonths: payoffInfo.schedule.payoffMonths || 0,
      monthlyPayment: displayTotalPayment,
      extraPayment: 0, // Set to 0 to force display of estimatedExtraPayment
      estimatedExtraPayment: displayExtraPayment, // This is what should be displayed
      interestSaved: (minimumTile.totalInterest || 0) - (payoffInfo.schedule.totalInterest || 0),
      monthsSaved: (minimumTile.payoffMonths || 0) - (payoffInfo.schedule.payoffMonths || 0)
    };
    
    console.log(`Final tile values for ${loan.name}:`, {
      actualExtraPayment,
      displayExtraPayment, 
      estimatedExtraPayment: displayExtraPayment,
      extraPaymentSetTo: 0,
      monthlyPayment: displayTotalPayment
    });
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
      // Regular loan refinancing
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
        monthsSaved: 0
      };
    }
  }
  
  // COMBINED TILE
  let combinedTile = null;
  if (showCombinedTile && combinedInfo && combinedInfo.schedule) {
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
      minimum: true,
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
  
  loanTileValues.forEach(loanData => {
    const { tiles } = loanData;
    
    // Minimum (always present)
    if (tiles.minimum) {
      totals.minimum.totalPaid += tiles.minimum.totalPaid || 0;
      totals.minimum.totalInterest += tiles.minimum.totalInterest || 0;
      totals.minimum.maxMonths = Math.max(totals.minimum.maxMonths, tiles.minimum.payoffMonths || 0);
    }
    
    // Extra payments
    const extraTile = tiles.extraPayments || tiles.minimum;
    if (extraTile) {
      totals.extraPayments.totalPaid += extraTile.totalPaid || 0;
      totals.extraPayments.totalInterest += extraTile.totalInterest || 0;
      totals.extraPayments.maxMonths = Math.max(totals.extraPayments.maxMonths, extraTile.payoffMonths || 0);
    }
    
    // Refinance
    const refinanceTile = tiles.refinance || tiles.minimum;
    if (refinanceTile) {
      totals.refinance.totalPaid += refinanceTile.totalPaid || 0;
      totals.refinance.totalInterest += refinanceTile.totalInterest || 0;
      totals.refinance.maxMonths = Math.max(totals.refinance.maxMonths, refinanceTile.payoffMonths || 0);
    }
    
    // Combined
    let combinedValue;
    if (tiles.combined) {
      combinedValue = tiles.combined;
    } else if (tiles.extraPayments) {
      combinedValue = tiles.extraPayments;
    } else {
      combinedValue = tiles.minimum;
    }
    
    if (combinedValue) {
      totals.combined.totalPaid += combinedValue.totalPaid || 0;
      totals.combined.totalInterest += combinedValue.totalInterest || 0;
      totals.combined.maxMonths = Math.max(totals.combined.maxMonths, combinedValue.payoffMonths || 0);
    }
  });
  
  return totals;
};