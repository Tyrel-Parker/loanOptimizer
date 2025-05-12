// Core calculation functions for the loan calculator

/**
 * Calculate monthly payment amount for a loan
 * @param {number} principal - Loan principal amount
 * @param {number} rate - Annual interest rate (percentage)
 * @param {number} term - Loan term in months
 * @returns {number} - Monthly payment amount
 */
export const calculateMonthlyPayment = (principal, rate, term) => {
  if (!principal || principal <= 0) return 0;
  if (!term || term <= 0) return 0;
  
  const monthlyRate = rate / 100 / 12;
  if (monthlyRate === 0) return principal / term;
  return principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1);
};

/**
 * Calculate total interest paid over the life of a loan
 * @param {number} principal - Loan principal amount
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} term - Loan term in months
 * @returns {number} - Total interest paid
 */
export const calculateTotalInterest = (principal, monthlyPayment, term) => {
  return (monthlyPayment * term) - principal;
};

/**
 * Calculate time to payoff at a given payment amount
 * @param {number} principal - Principal balance
 * @param {number} rate - Annual interest rate (percentage)
 * @param {number} payment - Monthly payment amount
 * @returns {number} - Number of months to payoff
 */
export const calculateTimeToPayoff = (principal, rate, payment) => {
  if (!principal || principal <= 0) return 0;
  if (!payment || payment <= 0) return Infinity;
  
  // Handle special case of 0% interest
  if (rate === 0) {
    return Math.ceil(principal / payment);
  }
  
  const monthlyRate = rate / 100 / 12;
  
  // If payment is less than interest, debt never gets paid off
  const interestOnly = principal * monthlyRate;
  if (payment <= interestOnly) return Infinity;
  
  // Formula: log(payment / (payment - principal * monthlyRate)) / log(1 + monthlyRate)
  const numerator = Math.log(payment / (payment - principal * monthlyRate));
  const denominator = Math.log(1 + monthlyRate);
  
  return Math.ceil(numerator / denominator);
};

/**
 * Calculate amortization schedule with optional extra payments
 * @param {Object} loan - Loan object with principal, rate and term properties
 * @param {number} extraPayment - Extra payment amount on top of required payment
 * @returns {Object} - Amortization schedule and payoff details
 */
export const calculateAmortizationSchedule = (loan, extraPayment = 0) => {
  const { principal, rate, term } = loan;
  
  if (!principal || principal <= 0) {
    return {
      schedule: [],
      payoffMonths: 0,
      totalInterest: 0,
      monthsSaved: 0,
      interestSaved: 0
    };
  }
  
  const monthlyRate = rate / 100 / 12;
  const requiredPayment = calculateMonthlyPayment(principal, rate, term);
  
  let balance = principal;
  let totalInterest = 0;
  let months = 0;
  const schedule = [];
  
  // Handle zero interest edge case
  if (rate === 0) {
    const actualPayment = requiredPayment + extraPayment;
    months = Math.ceil(principal / actualPayment);
    
    // Generate complete amortization schedule for 0% loan
    let remainingBalance = principal;
    for (let i = 1; i <= months; i++) {
      let paymentForMonth = actualPayment;
      
      // Adjust final payment if needed
      if (remainingBalance < paymentForMonth) {
        paymentForMonth = remainingBalance;
      }
      
      // All payment goes to principal when rate is 0
      schedule.push({
        month: i,
        payment: paymentForMonth,
        principal: paymentForMonth,
        interest: 0,
        balance: Math.max(0, remainingBalance - paymentForMonth),
        totalInterest: 0
      });
      
      remainingBalance = Math.max(0, remainingBalance - paymentForMonth);
      if (remainingBalance === 0) break;
    }
    
    return {
      schedule,
      payoffMonths: months,
      totalInterest: 0,
      monthsSaved: term - months,
      interestSaved: 0
    };
  }

  // Calculate amortization with interest
  while (balance > 0 && months < term * 2) { // Safety limit to prevent infinite loops
    months++;
    const interestPayment = balance * monthlyRate;
    let principalPayment = requiredPayment - interestPayment;
    let actualPayment = requiredPayment;
    
    // Handle negative amortization if payment is less than interest
    if (principalPayment < 0) {
      principalPayment = 0;
      actualPayment = interestPayment;
    }
    
    if (extraPayment > 0) {
      principalPayment += extraPayment;
      actualPayment += extraPayment;
    }
    
    // Adjust for final payment
    if (principalPayment > balance) {
      principalPayment = balance;
      actualPayment = balance + interestPayment;
    }
    
    balance -= principalPayment;
    totalInterest += interestPayment;
    
    schedule.push({
      month: months,
      payment: actualPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      totalInterest
    });
    
    if (balance <= 0) break;
  }
  
  // Calculate what the total interest would have been with just required payments
  const originalTotalInterest = calculateTotalInterest(principal, requiredPayment, term);
  const interestSaved = originalTotalInterest - totalInterest;
  const monthsSaved = term - months;
  
  return {
    schedule,
    payoffMonths: months,
    totalInterest,
    monthsSaved,
    interestSaved
  };
};

/**
 * Simulate cascading payments for the entire loan payoff period
 * @param {Array} loans - Array of loan objects
 * @param {number} totalBudget - Total monthly budget for all loans
 * @param {string} strategy - Payment strategy ('avalanche' or 'snowball')
 * @returns {Array} - Complete payoff schedule for each loan with cascading payments
 */
export const simulateCascadingPayoffs = (loans, totalBudget, strategy) => {
  // Skip if no loans or insufficient budget
  if (!loans.length) return [];
  
  // Deep copy loans for simulation
  const simulatedLoans = loans.map(loan => ({
    ...loan,
    balance: loan.principal,
    requiredPayment: calculateMonthlyPayment(loan.principal, loan.rate, loan.term),
    payoffMonth: 0,
    totalInterest: 0,
    monthlyPayments: [] // Will store payment details for each month
  }));
  
  // Calculate minimum required payment
  const minPayment = simulatedLoans.reduce((sum, loan) => sum + loan.requiredPayment, 0);
  
  // Check if budget is sufficient
  if (totalBudget < minPayment) {
    console.error('Budget is insufficient for minimum payments');
    return simulatedLoans.map(loan => ({
      id: loan.id,
      name: loan.name,
      originalSchedule: calculateAmortizationSchedule(loan),
      payoffSchedule: calculateAmortizationSchedule(loan),
      extraPayment: 0
    }));
  }
  
  // Calculate initial available extra payment
  let extraAvailable = totalBudget - minPayment;
  let month = 0;
  const maxMonths = 1200; // Safety limit - 100 years
  
  // Continue simulation until all loans are paid off
  while (simulatedLoans.some(loan => loan.balance > 0) && month < maxMonths) {
    month++;
    
    // Recalculate active loans - only those with balance remaining
    const activeLoans = simulatedLoans.filter(loan => loan.balance > 0);
    
    // Nothing to do if all loans are paid off
    if (activeLoans.length === 0) break;
    
    // Sort active loans according to strategy
    if (strategy === 'avalanche') {
      // Interest rate, highest first
      activeLoans.sort((a, b) => b.rate - a.rate);
    } else {
      // Balance, smallest first
      activeLoans.sort((a, b) => a.balance - b.balance);
    }
    
    // Recalculate required payments for remaining loans
    const requiredPaymentThisMonth = activeLoans.reduce((sum, loan) => sum + loan.requiredPayment, 0);
    
    // Recalculate extra available for this month
    let extraForMonth = Math.max(0, totalBudget - requiredPaymentThisMonth);
    
    // Apply payments to each loan
    for (const loan of simulatedLoans) {
      // Skip paid off loans
      if (loan.balance <= 0) {
        loan.monthlyPayments.push({
          month,
          payment: 0,
          principal: 0,
          interest: 0,
          extraPayment: 0,
          balance: 0
        });
        continue;
      }
      
      // Calculate interest and minimum payment components
      const interest = loan.balance * (loan.rate / 100 / 12);
      let principal = Math.min(loan.requiredPayment - interest, loan.balance);
      
      // Ensure we don't have negative principal payment
      if (principal < 0) principal = 0;
      
      // Initialize payment values for this month
      let extraPayment = 0;
      let totalPayment = interest + principal;
      
      // Check if this loan should get extra payment based on priority
      if (extraForMonth > 0 && activeLoans[0].id === loan.id) {
        // This is the highest priority loan, apply extra payment
        extraPayment = Math.min(extraForMonth, loan.balance - principal);
        extraForMonth -= extraPayment;
        principal += extraPayment;
        totalPayment += extraPayment;
      }
      
      // Update loan balance
      loan.balance = Math.max(0, loan.balance - principal);
      loan.totalInterest += interest;
      
      // Record payment details for this month
      loan.monthlyPayments.push({
        month,
        payment: totalPayment,
        principal: principal,
        interest: interest,
        extraPayment: extraPayment,
        balance: loan.balance
      });
      
      // Record payoff month if loan is paid off this month
      if (loan.balance === 0 && loan.payoffMonth === 0) {
        loan.payoffMonth = month;
      }
    }
    
    // Re-sort active loans for next month if needed
    // This should now happen at the top of the loop
  }
  
  // Prepare the final payoff schedule results
  return simulatedLoans.map(simulatedLoan => {
    const originalLoan = loans.find(l => l.id === simulatedLoan.id);
    
    // Calculate the original schedule (minimum payments only)
    const originalSchedule = calculateAmortizationSchedule(originalLoan);
    
    // Extract the extra payment for the first month
    const firstMonthPayment = simulatedLoan.monthlyPayments.length > 0 ?
      simulatedLoan.monthlyPayments[0] : { extraPayment: 0 };
    
    return {
      id: simulatedLoan.id,
      name: simulatedLoan.name,
      requiredPayment: simulatedLoan.requiredPayment,
      extraPayment: firstMonthPayment.extraPayment,
      schedule: {
        payoffMonths: simulatedLoan.payoffMonth,
        totalInterest: simulatedLoan.totalInterest,
        monthsSaved: originalSchedule.payoffMonths - simulatedLoan.payoffMonth,
        interestSaved: originalSchedule.totalInterest - simulatedLoan.totalInterest,
        // Include the full payment schedule if needed
        schedule: simulatedLoan.monthlyPayments
      }
    };
  });
};

/**
 * Calculate optimal payment distribution across multiple loans
 * @param {Array} loans - Array of loan objects
 * @param {number} totalBudget - Total monthly budget for all loans
 * @param {string} strategy - Payment strategy ('avalanche' or 'snowball')
 * @returns {Array} - Payment distribution for each loan
 */
export const distributeExtraPayment = (loans, totalBudget, strategy) => {
  // Make sure we have a valid strategy
  const validStrategy = strategy === 'avalanche' || strategy === 'snowball' ? 
    strategy : 'avalanche';
  
  // Get full simulation results
  const simulationResults = simulateCascadingPayoffs(loans, totalBudget, validStrategy);
  
  // Extract just the payment distribution for the first month
  return simulationResults.map(result => ({
    id: result.id,
    requiredPayment: result.requiredPayment,
    extraPayment: result.extraPayment
  }));
};

/**
 * Analyze refinance opportunities
 * @param {Array} loans - Array of loan objects
 * @param {number} newRate - New refinance interest rate
 * @returns {Array} - Refinance analysis for each loan
 */
export const analyzeRefinance = (loans, newRate) => {
  return loans.map(loan => {
    // Skip if loan already has lower rate
    if (loan.rate <= newRate) {
      return {
        id: loan.id,
        shouldRefinance: false,
        savings: 0,
        newPayment: calculateMonthlyPayment(loan.principal, loan.rate, loan.term),
        currentPayment: calculateMonthlyPayment(loan.principal, loan.rate, loan.term)
      };
    }
    
    const currentPayment = calculateMonthlyPayment(loan.principal, loan.rate, loan.term);
    const newPayment = calculateMonthlyPayment(loan.principal, newRate, loan.term);
    const currentTotalCost = currentPayment * loan.term;
    const newTotalCost = newPayment * loan.term;
    const savings = currentTotalCost - newTotalCost;
    
    return {
      id: loan.id,
      shouldRefinance: true,
      savings,
      newPayment,
      currentPayment
    };
  });
};