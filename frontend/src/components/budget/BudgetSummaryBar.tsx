import { Card, CardContent } from '../ui/card';

interface BudgetSummaryBarProps {
  totalBudget: number | null;
  committedAmount: number;
  bookedCount: number;
  totalCategories: number;
}

export function BudgetSummaryBar({
  totalBudget,
  committedAmount,
  bookedCount,
  totalCategories,
}: BudgetSummaryBarProps) {
  const remaining = totalBudget ? Math.max(0, totalBudget - committedAmount) : null;
  const percentage = totalBudget ? Math.min(100, (committedAmount / totalBudget) * 100) : 0;
  const isOverBudget = totalBudget !== null && committedAmount > totalBudget;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base">Budget Overview</h3>
          <span className="text-sm text-muted-foreground">
            {bookedCount} of {totalCategories} categories booked
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Budget</p>
            <p className="text-2xl font-bold">
              {totalBudget !== null ? `$${totalBudget.toLocaleString()}` : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Committed</p>
            <p className="text-2xl font-bold text-blue-600">
              ${committedAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
            {isOverBudget ? (
              <div>
                <p className="text-2xl font-bold text-red-600">$0</p>
                <span className="text-xs text-red-600 font-medium">Over budget</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {remaining !== null ? `$${remaining.toLocaleString()}` : '—'}
              </p>
            )}
          </div>
        </div>

        {totalBudget !== null && (
          <div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverBudget ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {percentage.toFixed(1)}% allocated
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
