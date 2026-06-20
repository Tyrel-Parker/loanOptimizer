import React, { useState, useMemo } from 'react';
import { formatCurrency, formatMonths } from '../utils/formatters';
import { X } from './icons/Icons';

const colorStyles = {
  extra: {
    headerBg: 'bg-green-50',
    cardBg: 'bg-green-50',
    text: 'text-green-600',
    textBold: 'text-green-700'
  },
  refinance: {
    headerBg: 'bg-purple-50',
    cardBg: 'bg-purple-50',
    text: 'text-purple-600',
    textBold: 'text-purple-700'
  },
  combined: {
    headerBg: 'bg-amber-50',
    cardBg: 'bg-amber-50',
    text: 'text-amber-600',
    textBold: 'text-amber-700'
  }
};

const SavingsBreakdownModal = ({ isOpen, onClose, loan, minimumTile, optimizedTile, tileType }) => {
  const [viewMode, setViewMode] = useState('yearly');

  if (!isOpen || !loan || !minimumTile || !optimizedTile) return null;

  const principal = loan.principal || 0;
  const rate = loan.rate || 0;
  const term = loan.term || 0;
  const isCreditCard = term === 0;

  const colors = colorStyles[tileType] || colorStyles.extra;

  const breakdown = useMemo(() => {
    const origMonths = minimumTile.payoffMonths || 0;
    const optMonths = optimizedTile.payoffMonths || 0;
    const origInterest = minimumTile.totalInterest || 0;
    const optInterest = optimizedTile.totalInterest || 0;
    const totalSaved = origInterest - optInterest;

    if (origMonths <= 0 || totalSaved <= 0) return [];

    const monthlyRate = rate / 100 / 12;
    let origBalance = principal;
    let optBalance = principal;
    const origPayment = minimumTile.monthlyPayment || 0;
    const optPayment = optimizedTile.monthlyPayment || origPayment;

    const months = [];
    const maxMonths = Math.max(origMonths, optMonths);

    let origCumInterest = 0;
    let optCumInterest = 0;

    for (let m = 1; m <= maxMonths; m++) {
      const origMonthInterest = origBalance > 0.01 ? origBalance * monthlyRate : 0;
      const optMonthInterest = optBalance > 0.01 ? optBalance * monthlyRate : 0;

      origCumInterest += origMonthInterest;
      optCumInterest += optMonthInterest;

      let origPrincipalPayment = 0;
      if (origBalance > 0.01) {
        let payment = origPayment;
        if (isCreditCard) {
          payment = Math.max(origBalance * 0.02, 25);
          payment = Math.min(payment, origBalance + origMonthInterest);
        }
        origPrincipalPayment = Math.min(payment - origMonthInterest, origBalance);
        origBalance = Math.max(0, origBalance - origPrincipalPayment);
      }

      let optPrincipalPayment = 0;
      if (optBalance > 0.01) {
        let payment = optPayment;
        if (isCreditCard) {
          payment = Math.max(optBalance * 0.02, 25);
          payment = Math.min(payment, optBalance + optMonthInterest);
        }
        optPrincipalPayment = Math.min(payment - optMonthInterest, optBalance);
        optBalance = Math.max(0, optBalance - optPrincipalPayment);
      }

      months.push({
        month: m,
        origInterest: origMonthInterest,
        optInterest: optMonthInterest,
        savedThisMonth: origMonthInterest - optMonthInterest,
        cumOrigInterest: origCumInterest,
        cumOptInterest: optCumInterest,
        cumSaved: origCumInterest - optCumInterest,
        origBalance,
        optBalance
      });
    }

    return months;
  }, [principal, rate, term, isCreditCard, minimumTile, optimizedTile]);

  const yearlyBreakdown = useMemo(() => {
    if (breakdown.length === 0) return [];
    const years = [];
    for (let i = 0; i < breakdown.length; i += 12) {
      const yearEnd = breakdown[Math.min(i + 11, breakdown.length - 1)];
      const yearStart = i > 0 ? breakdown[i - 1] : { cumOrigInterest: 0, cumOptInterest: 0, cumSaved: 0 };
      years.push({
        year: Math.floor(i / 12) + 1,
        interestThisYear: yearEnd.cumOrigInterest - yearStart.cumOrigInterest,
        optInterestThisYear: yearEnd.cumOptInterest - yearStart.cumOptInterest,
        savedThisYear: (yearEnd.cumOrigInterest - yearStart.cumOrigInterest) - (yearEnd.cumOptInterest - yearStart.cumOptInterest),
        cumSaved: yearEnd.cumSaved,
        origBalance: yearEnd.origBalance,
        optBalance: yearEnd.optBalance
      });
    }
    return years;
  }, [breakdown]);

  const totalSaved = (minimumTile.totalInterest || 0) - (optimizedTile.totalInterest || 0);
  const monthsSaved = (minimumTile.payoffMonths || 0) - (optimizedTile.payoffMonths || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`flex justify-between items-center p-4 border-b ${colors.headerBg}`}>
          <div>
            <h2 className="text-lg font-bold">{loan.name} - Savings Breakdown</h2>
            <p className="text-sm text-gray-600">
              How overpaying earlier saves more interest over time
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className={`${colors.cardBg} p-3 rounded-lg text-center`}>
              <div className="text-xs text-gray-600">Total Interest Saved</div>
              <div className={`text-lg font-bold ${colors.text}`}>{formatCurrency(totalSaved)}</div>
            </div>
            <div className={`${colors.cardBg} p-3 rounded-lg text-center`}>
              <div className="text-xs text-gray-600">Time Saved</div>
              <div className={`text-lg font-bold ${colors.text}`}>{formatMonths(monthsSaved)}</div>
            </div>
            <div className={`${colors.cardBg} p-3 rounded-lg text-center`}>
              <div className="text-xs text-gray-600">Optimized Payoff</div>
              <div className={`text-lg font-bold ${colors.text}`}>{formatMonths(optimizedTile.payoffMonths)}</div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
            Early overpayments save the most because they reduce the principal that accrues interest for the remaining life of the loan. Each dollar paid early prevents compounding interest on that dollar for every future month.
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1 rounded text-sm font-medium ${viewMode === 'yearly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Yearly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded text-sm font-medium ${viewMode === 'monthly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Monthly
            </button>
          </div>

          <div className="overflow-y-auto max-h-[40vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2">{viewMode === 'yearly' ? 'Year' : 'Month'}</th>
                  <th className="text-right py-2 px-2">Orig. Interest</th>
                  <th className="text-right py-2 px-2">Opt. Interest</th>
                  <th className="text-right py-2 px-2">Saved</th>
                  <th className="text-right py-2 px-2">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'yearly' ? (
                  yearlyBreakdown.map((row) => (
                    <tr key={row.year} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-1.5 px-2 font-medium">Y{row.year}</td>
                      <td className="text-right py-1.5 px-2 text-gray-600">{formatCurrency(row.interestThisYear)}</td>
                      <td className="text-right py-1.5 px-2 text-gray-600">{formatCurrency(row.optInterestThisYear)}</td>
                      <td className={`text-right py-1.5 px-2 font-medium ${colors.text}`}>
                        {formatCurrency(row.savedThisYear)}
                      </td>
                      <td className={`text-right py-1.5 px-2 font-bold ${colors.textBold}`}>
                        {formatCurrency(row.cumSaved)}
                      </td>
                    </tr>
                  ))
                ) : (
                  breakdown.map((row) => (
                    <tr key={row.month} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-1.5 px-2 font-medium">{row.month}</td>
                      <td className="text-right py-1.5 px-2 text-gray-600">{formatCurrency(row.origInterest)}</td>
                      <td className="text-right py-1.5 px-2 text-gray-600">{formatCurrency(row.optInterest)}</td>
                      <td className={`text-right py-1.5 px-2 font-medium ${colors.text}`}>
                        {formatCurrency(row.savedThisMonth)}
                      </td>
                      <td className={`text-right py-1.5 px-2 font-bold ${colors.textBold}`}>
                        {formatCurrency(row.cumSaved)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t p-3 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingsBreakdownModal;
