import React from 'react';
import { formatCurrency, formatMonths } from '../utils/formatters';

const CascadeTimeline = ({ loanTileValues, paymentStrategy, totalBudget }) => {
  if (!loanTileValues || loanTileValues.length === 0 || !totalBudget) return null;

  const loansWithPayoff = loanTileValues
    .filter(lv => lv.tiles.extraPayments && lv.tiles.extraPayments.payoffMonths > 0)
    .map(lv => ({
      name: lv.loan.name,
      payoffMonths: lv.tiles.extraPayments.payoffMonths,
      monthlyPayment: lv.tiles.minimum.monthlyPayment || 0,
      interestSaved: lv.tiles.extraPayments.interestSaved || 0,
      rate: lv.loan.rate || 0,
      principal: lv.loan.principal || 0
    }))
    .sort((a, b) => a.payoffMonths - b.payoffMonths);

  if (loansWithPayoff.length === 0) return null;

  const maxMonth = Math.max(...loansWithPayoff.map(l => l.payoffMonths));

  const formatPayoffDate = (months) => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setMonth(now.getMonth() + months);
    return futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  let runningFreedBudget = 0;

  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-800 mb-1 text-sm">
        Payoff Cascade ({paymentStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'})
      </h3>
      <p className="text-xs text-blue-600 mb-3">
        As each loan pays off, its payment cascades to the next priority loan.
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-300" />

        {loansWithPayoff.map((loan, index) => {
          const freedAmount = loan.monthlyPayment;
          runningFreedBudget += freedAmount;
          const pctComplete = maxMonth > 0 ? (loan.payoffMonths / maxMonth) * 100 : 0;
          const isLast = index === loansWithPayoff.length - 1;

          return (
            <div key={index} className="relative pl-10 pb-4 last:pb-0">
              {/* Timeline dot */}
              <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                isLast ? 'bg-green-500 border-green-600' : 'bg-blue-500 border-blue-600'
              }`} />

              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-sm">{loan.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {loan.rate}% &middot; {formatCurrency(loan.principal)}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {formatPayoffDate(loan.payoffMonths)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>Paid off in <strong>{formatMonths(loan.payoffMonths)}</strong></span>
                  <span>Saves <strong className="text-green-600">{formatCurrency(loan.interestSaved)}</strong> interest</span>
                  {!isLast && (
                    <span>Frees <strong className="text-blue-600">{formatCurrency(freedAmount)}</strong>/mo</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isLast ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pctComplete}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Final milestone */}
        <div className="relative pl-10 pt-1">
          <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-green-500 border-2 border-green-600 flex items-center justify-center">
            <span className="text-white text-xs">&#10003;</span>
          </div>
          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
            <span className="text-sm font-semibold text-green-700">
              Debt Free: {formatPayoffDate(maxMonth)}
            </span>
            <span className="text-xs text-green-600 ml-2">
              ({formatMonths(maxMonth)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CascadeTimeline;
