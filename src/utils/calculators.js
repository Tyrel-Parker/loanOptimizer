// Core calculation functions for the loan calculator

/**
 * Calculate monthly payment amount for a loan
 * @param {number} principal - Loan principal amount
 * @param {number} rate - Annual interest rate (percentage)
 * @param {number} term - Loan term in months
 * @returns {number} - Monthly payment amount
 */
export const calculateMonthlyPayment = (principal, rate, term, isCreditCard = false, ccSettings = {}) => {
  if (principal <= 0 || rate < 0) return 0;
  
  // If term is 0 or explicitly marked as credit card, calculate minimum payment
  if (term === 0 || isCreditCard) {
    const defaultSettings = {
      method: 'percentage',
      percentageRate: 2,
      fixedAmount: 25,
      minimumFloor: 25
    };
    
    const settings = { ...defaultSettings, ...ccSettings };
    return calculateCreditCardMinimum(principal, rate, settings.method, settings.percentageRate, settings.fixedAmount, settings.minimumFloor);
  }
  
  // Regular loan calculation
  if (rate === 0) return principal / term;
  
  const monthlyRate = rate / 100 / 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                  (Math.pow(1 + monthlyRate, term) - 1);
  
  return payment;
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

/** used to handle credit cards */
export const isCreditCardLoan = (loan) => {
  return loan.term === 0 || loan.term === null || loan.term === undefined;
};

// Credit card minimum payment calculation
export const calculateCreditCardMinimum = (balance, apr, method = 'percentage', percentageRate = 2, fixedAmount = 25, minimumFloor = 25) => {
  if (balance <= 0) return 0;
  
  const monthlyInterestRate = apr / 100 / 12;
  const monthlyInterest = balance * monthlyInterestRate;
  
  let minimumPayment = 0;
  
  switch (method) {
    case 'percentage':
      // Most common: percentage of balance (usually 2%)
      minimumPayment = balance * (percentageRate / 100);
      break;
      
    case 'fixed_plus_interest':
      // Fixed amount plus interest
      minimumPayment = fixedAmount + monthlyInterest;
      break;
      
    case 'interest_plus_principal':
      // Interest plus 1% of principal (common method)
      minimumPayment = monthlyInterest + (balance * 0.01);
      break;
      
    default:
      minimumPayment = balance * 0.02; // Default to 2%
  }
  
  // Apply minimum floor (usually $25-35)
  minimumPayment = Math.max(minimumPayment, minimumFloor);
  
  // Don't exceed the balance
  minimumPayment = Math.min(minimumPayment, balance);
  
  return minimumPayment;
};

// Function to estimate payoff time for credit card with minimum payments
export const estimateCreditCardPayoffTime = (balance, apr, minimumPaymentRate = 2, minimumFloor = 25) => {
  if (balance <= 0) return 0;
  
  let currentBalance = balance;
  let months = 0;
  const maxMonths = 600; // 50 years max to prevent infinite loops
  
  while (currentBalance > 0.01 && months < maxMonths) {
    months++;
    
    const monthlyInterestRate = apr / 100 / 12;
    const interestPayment = currentBalance * monthlyInterestRate;
    
    const minimumPayment = Math.max(currentBalance * (minimumPaymentRate / 100), minimumFloor);
    const principalPayment = minimumPayment - interestPayment;
    
    // If minimum payment doesn't cover interest, the debt will never be paid off
    if (principalPayment <= 0) {
      return Infinity;
    }
    
    currentBalance -= principalPayment;
    
    if (currentBalance < 0.01) {
      currentBalance = 0;
    }
  }
  
  return months === maxMonths ? Infinity : months;
};

/**
 * Calculate amortization schedule with optional extra payments
 * @param {Object} loan - Loan object with principal, rate and term properties
 * @param {number} extraPayment - Extra payment amount on top of required payment
 * @returns {Object} - Amortization schedule and payoff details
 */
export const calculateAmortizationSchedule = (loan, extraPayment = 0, ccSettings = {}) => {
  const { principal, rate, term } = loan;
  
  if (principal <= 0 || rate < 0) {
    return { payoffMonths: 0, totalInterest: 0, totalPayments: 0 };
  }
  
  const isCreditCard = term === 0;
  let currentBalance = principal;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = isCreditCard ? 600 : term * 2; // Prevent infinite loops for CC
  
  while (currentBalance > 0.01 && months < maxMonths) {
    months++;
    
    // Calculate interest for this month
    const monthlyInterestRate = rate / 100 / 12;
    const interestPayment = currentBalance * monthlyInterestRate;
    totalInterest += interestPayment;
    
    // Calculate payment
    let payment;
    if (isCreditCard) {
      payment = calculateCreditCardMinimum(currentBalance, rate, ccSettings.method, ccSettings.percentageRate, ccSettings.fixedAmount, ccSettings.minimumFloor);
    } else {
      payment = calculateMonthlyPayment(principal, rate, term);
    }
    
    // Add extra payment
    payment += extraPayment;
    
    // Ensure we don't pay more than the balance
    payment = Math.min(payment, currentBalance + interestPayment);
    
    // Calculate principal payment
    const principalPayment = payment - interestPayment;
    
    // Update balance
    currentBalance -= principalPayment;
    
    // Safety check for very small balances
    if (currentBalance < 0.01) {
      currentBalance = 0;
    }
  }
  
  const totalPayments = totalInterest + principal;
  
  // Calculate savings compared to minimum payments only
  let interestSaved = 0;
  let monthsSaved = 0;
  
  if (extraPayment > 0) {
    const baseSchedule = calculateAmortizationSchedule({ ...loan }, 0, ccSettings);
    interestSaved = baseSchedule.totalInterest - totalInterest;
    monthsSaved = baseSchedule.payoffMonths - months;
  }
  
  return {
    payoffMonths: months,
    totalInterest,
    totalPayments,
    interestSaved,
    monthsSaved
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