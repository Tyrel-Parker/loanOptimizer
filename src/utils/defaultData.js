// utils/defaultData.js
import { calculateEndDate } from './dateUtils';

export const ALL_SCENARIO_ID = 'ALL_SCENARIO';
export const ALL_SCENARIO_NAME = 'ALL Scenarios';

export const createDefaultCarLoan = () => ({
  id: 1,
  name: "Car Loan",
  principal: 25000,
  rate: 4.5,
  term: 60,
  endDate: calculateEndDate(60).toISOString().split('T')[0],
  extraPayment: 0
});

export const createDefaultScenario = () => ({
  id: 1,
  name: "Current Situation", 
  loans: [
    {
      id: 1,
      name: "Car Loan",
      principal: 25000,
      rate: 4.5,
      term: 60,
      endDate: calculateEndDate(60).toISOString().split('T')[0],
      extraPayment: 0
    },
    {
      id: 2,
      name: "Credit Card",
      principal: 5000,
      rate: 18.99,
      term: 0,
      endDate: "",
      extraPayment: 0
    }
  ],
  totalBudget: 800,
  refinanceRate: 3.5
});

export const createSecondSampleScenario = () => ({
  id: 2,
  name: "Future Plan",
  loans: [
    {
      id: 3,
      name: "Student Loan",
      principal: 35000,
      rate: 6.8,
      term: 120,
      endDate: calculateEndDate(120).toISOString().split('T')[0],
      extraPayment: 0
    },
    {
      id: 4,
      name: "Personal Loan",
      principal: 8000,
      rate: 9.5,
      term: 36,
      endDate: calculateEndDate(36).toISOString().split('T')[0],
      extraPayment: 0
    }
  ],
  totalBudget: 1000,
  refinanceRate: 5.0
});

export const createDefaultScenarios = () => [
  createDefaultScenario(),
  createSecondSampleScenario()
];

// Create the ALL scenario by combining loans from all regular scenarios
export const createAllScenario = (regularScenarios) => {
  if (!regularScenarios || !Array.isArray(regularScenarios)) {
    return {
      id: ALL_SCENARIO_ID,
      name: ALL_SCENARIO_NAME,
      loans: [],
      totalBudget: 0,
      refinanceRate: 0, // Always 0 for ALL scenario
      isReadOnly: true
    };
  }

  // Combine all loans from all scenarios with prefixed IDs and source refinance rates
  const combinedLoans = [];
  
  regularScenarios.forEach(scenario => {
    if (scenario.loans && Array.isArray(scenario.loans)) {
      scenario.loans.forEach(loan => {
        // Ensure we're carrying over the refinance rate properly
        const sourceRefinanceRate = scenario.refinanceRate || 0;
        
        combinedLoans.push({
          ...loan,
          id: `${scenario.id}_${loan.id}`, // Prefix with scenario ID
          sourceScenarioId: scenario.id,
          sourceScenarioName: scenario.name,
          sourceRefinanceRate: sourceRefinanceRate // Carry over the scenario's refinance rate
        });
      });
    }
  });

  // Calculate total budget from all scenarios
  const totalBudget = regularScenarios.reduce((sum, scenario) => {
    return sum + (scenario.totalBudget || 0);
  }, 0);

  console.log('createAllScenario - Combined Loans Debug:', combinedLoans.map(loan => ({
    id: loan.id,
    name: loan.name,
    sourceScenarioName: loan.sourceScenarioName,
    sourceRefinanceRate: loan.sourceRefinanceRate,
    rate: loan.rate
  })));

  return {
    id: ALL_SCENARIO_ID,
    name: ALL_SCENARIO_NAME,
    loans: combinedLoans,
    totalBudget,
    refinanceRate: 0, // Always 0 for ALL scenario - individual rates are in loan.sourceRefinanceRate
    isReadOnly: true
  };
};