import { useMemo, useState } from 'react';
import { ExpenseList } from '../expenses/components/management/ExpenseList';
import { useExpenseHistory } from '../expenses/hooks/useExpenseHistory';
import { ThemeToggle } from '../ui/components/layout/ThemeToggle';
import { ExpenseForm, type FormError } from '../expenses/components/capture/ExpenseForm';
import { ExpenseReviewCard } from '../expenses/components/capture/ExpenseReviewCard';
import { ToastContainer } from '../ui/components/feedback/Toast';
import { useToast } from '../ui/hooks/useToast';
import { expenseService } from '../expenses/services/expenseService';
import type { NewExpenseForm, ExpenseWithConversions } from '../expenses/types/expense.types';
import type { ClassificationResult } from '../expenses/services/classificationService';
import { useAuth } from '../auth/hooks/useAuth';
import { VoiceOverlay } from '../voice/components/VoiceOverlay';
import { useAnalytics } from '../analytics/hooks/useAnalytics';
import { SpendingPieChart } from '../analytics/components/charts/SpendingPieChart';
import { SpendingSummaryComponent } from '../analytics/components/insights/SpendingSummary';

type ExpenseFlowStep = 'form' | 'review' | 'none';

export function Dashboard() {
  const [expenseFlowStep, setExpenseFlowStep] = useState<ExpenseFlowStep>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [, setFormError] = useState<FormError | null>(null);
  const [pendingExpenseData, setPendingExpenseData] = useState<NewExpenseForm | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  
  const { user, signOut } = useAuth();
  const toast = useToast();

  // Analytics for last 7 days
  const analyticsFilters = useMemo(() => ({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      to: new Date(),
    },
    includeArchived: false,
  }), []);

  const { 
    summary: analyticsSummary, 
    categoryStats, 
    loading: analyticsLoading 
  } = useAnalytics(analyticsFilters);

  // Get today's date range for filtering
  const todayFilters = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      dateRange: {
        from: startOfDay,
        to: endOfDay,
      },
    };
  }, []);

  const { 
    expenses: todayExpenses, 
    loading: todayLoading, 
    error: todayError,
    refresh: refreshToday,
    addOptimisticExpense,
    removeOptimisticExpense,
    updateExpense,
    deleteExpense
  } = useExpenseHistory({
    filters: todayFilters,
    limit: 50, // Show all expenses for today
  });

  // Calculate today's total
  const todayTotal = useMemo(() => {
    return todayExpenses.reduce((sum, expense) => sum + expense.amount_thb, 0);
  }, [todayExpenses]);

  const formatTotal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExpenseFormSubmit = async (expense: NewExpenseForm) => {
    console.log('🎯 [Dashboard] Received expense form submission');
    console.log('📝 [Dashboard] Expense data:', expense);
    
    setIsClassifying(true);
    setFormError(null);
    setPendingExpenseData(expense);
    
    try {
      console.log('🤖 [Dashboard] Starting AI classification...');
      // Try AI classification first
      const { classificationService } = await import('../expenses/services/classificationService');
      const classificationText = `${expense.item}${expense.merchant ? ` at ${expense.merchant}` : ''} ${expense.amount} ${expense.currency}`;
      console.log('📤 [Dashboard] Classification text:', classificationText);
      
      const classification = await classificationService.classifyExpense(classificationText);
      console.log('✅ [Dashboard] AI classification successful:', classification);
      
      setClassificationResult(classification);
      setExpenseFlowStep('review');
      console.log('🔄 [Dashboard] Switched to review step');
      
    } catch (error: any) {
      console.warn('⚠️ [Dashboard] AI classification failed, proceeding without review:', error);
      console.warn('⚠️ [Dashboard] Error details:', {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      });
      
      // If classification fails, proceed directly to saving
      console.log('⏭️ [Dashboard] Proceeding directly to expense creation...');
      await handleFinalExpenseSubmit(expense);
    } finally {
      setIsClassifying(false);
      console.log('🔄 [Dashboard] Classification state reset');
    }
  };

  const handleFinalExpenseSubmit = async (finalExpenseData: NewExpenseForm) => {
    console.log('💾 [Dashboard] Starting final expense submission');
    console.log('📊 [Dashboard] Final expense data:', finalExpenseData);
    
    setIsSubmitting(true);
    
    // Create a temporary expense object for optimistic update
    const tempId = `temp-${Date.now()}`;
    const amount = parseFloat(finalExpenseData.amount) * 100; // Convert to cents
    console.log('🔢 [Dashboard] Amount conversion:', { 
      original: finalExpenseData.amount, 
      converted: amount 
    });
    
    const optimisticExpense: ExpenseWithConversions = {
      id: tempId,
      user_id: user?.id || '',
      item: finalExpenseData.item,
      amount,
      currency: finalExpenseData.currency,
      merchant: finalExpenseData.merchant || null,
      group_id: finalExpenseData.group_id || null,
      tag_id: finalExpenseData.tag_id || null,
      created_at: new Date().toISOString(),
      user_local_datetime: new Date().toISOString(),
      fx_rate_date: new Date().toISOString().split('T')[0],
      archived: false,
      archived_at: null,
      amount_thb: finalExpenseData.currency === 'THB' ? amount : amount * 35, // Rough conversion for display
      amount_usd: finalExpenseData.currency === 'USD' ? amount : amount / 35, // Rough conversion for display
      group_name: null,
      group_icon: null,
      group_color: null,
      tag_name: null,
      thb_per_usd: 35,
      usd_per_thb: 1/35,
    };
    
    console.log('⚡ [Dashboard] Created optimistic expense:', optimisticExpense);
    
    // Add expense optimistically for immediate UI update
    addOptimisticExpense(optimisticExpense);
    console.log('✅ [Dashboard] Added optimistic expense to UI');
    
    try {
      console.log('🚀 [Dashboard] Calling expense service...');
      // Submit expense using the basic service (AI already applied)
      const newExpense = await expenseService.createExpense(finalExpenseData);
      console.log('✅ [Dashboard] Expense created successfully:', newExpense);
      
      console.log('🧹 [Dashboard] Cleaning up optimistic expense...');
      // Remove the optimistic expense and refresh to get the real one
      removeOptimisticExpense(tempId);
      refreshToday();
      console.log('🔄 [Dashboard] Refreshed expense list');
      
      // Reset flow
      setExpenseFlowStep('none');
      setPendingExpenseData(null);
      setClassificationResult(null);
      console.log('🔄 [Dashboard] Reset expense flow state');
      
      // Show success toast with AI classification info
      let successMessage = `${newExpense.item} - ${newExpense.currency} ${(newExpense.amount / 100).toFixed(2)}`;
      
      if (classificationResult && classificationResult.group) {
        successMessage += ` (${classificationResult.group.name})`;
      }
      
      console.log('🎉 [Dashboard] Showing success toast:', successMessage);
      
      toast.success(
        classificationResult ? 'Expense Added with AI!' : 'Expense Added!',
        successMessage
      );
      
    } catch (error: any) {
      console.error('❌ [Dashboard] Failed to submit expense:', error);
      console.error('❌ [Dashboard] Error details:', {
        message: error.message,
        code: error.code,
        type: error.constructor.name,
        stack: error.stack
      });
      
      // Remove the failed optimistic expense
      removeOptimisticExpense(tempId);
      
      // Handle different error types with appropriate messaging
      let errorTitle = 'Failed to Add Expense';
      let errorMessage = 'Please try again';
      let duration = 7000;
      
      if (error?.code === 'AUTH_ERROR') {
        errorTitle = 'Authentication Error';
        errorMessage = 'Please sign in and try again';
        duration = 8000;
      } else if (error?.code === 'VALIDATION_ERROR') {
        errorTitle = 'Invalid Data';
        errorMessage = error.message || 'Please check your input';
        duration = 6000;
      } else if (error?.code === 'NETWORK_ERROR') {
        errorTitle = 'Network Error';
        errorMessage = 'Check your connection and try again';
        duration = 8000;
      } else if (error?.code === 'DATABASE_ERROR') {
        errorTitle = 'Database Error';
        errorMessage = 'Service temporarily unavailable';
        duration = 8000;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error toast with appropriate duration
      toast.error(errorTitle, errorMessage, duration);
      
      // Re-throw the error so the form can handle it
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewAccept = (finalData: NewExpenseForm) => {
    handleFinalExpenseSubmit(finalData);
  };

  const handleReviewReject = () => {
    if (pendingExpenseData) {
      handleFinalExpenseSubmit(pendingExpenseData);
    }
  };

  const handleReviewModify = (modifiedData: NewExpenseForm) => {
    setPendingExpenseData(modifiedData);
  };

  const handleVoiceTranscript = async (transcript: string) => {
    console.log('Voice transcript received:', transcript);
    
    // Create expense form data from transcript
    const voiceExpenseData: NewExpenseForm = {
      item: transcript,
      amount: '',
      currency: 'THB',
      merchant: '',
      group_id: undefined,
      tag_id: undefined,
    };

    // Process through AI classification
    try {
      setIsClassifying(true);
      await handleExpenseFormSubmit(voiceExpenseData);
    } catch (error) {
      console.error('Error processing voice expense:', error);
      toast.error('Failed to process voice expense');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleVoiceButtonClick = () => {
    // Close any open expense forms
    setExpenseFlowStep('none');
    // Open voice overlay
    setIsVoiceOverlayOpen(true);
  };



  const handleFormError = (error: FormError) => {
    console.log('Form error:', error);
    setFormError(error);
    
    // Show appropriate toast notification based on error type
    if (error.type === 'validation') {
      // Don't show toast for validation errors - they're shown inline
      return;
    }
    
    if (error.type === 'network') {
      toast.warning(
        'Network Issue',
        'Check your connection and try again',
        7000
      );
    } else if (error.type === 'submission') {
      toast.error(
        'Submission Failed',
        error.message,
        6000
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-balance">
                spends.ai
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Voice-powered expense tracking
              </p>
              {user && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Signed in as {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/settings');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={signOut}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Today's Summary */}
        <div className="card-dashboard p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Today's Expenses
            </h2>
            <button
              onClick={refreshToday}
              disabled={todayLoading}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 transition-colors duration-200 font-medium"
            >
              {todayLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                'Refresh'
              )}
            </button>
          </div>

          {/* Total for today */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text">
              {formatTotal(todayTotal)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {todayExpenses.length} {todayExpenses.length === 1 ? 'expense' : 'expenses'} today
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mb-6">
            <button 
              onClick={() => setExpenseFlowStep(expenseFlowStep === 'form' ? 'none' : 'form')}
              disabled={isClassifying || isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {expenseFlowStep === 'form' ? 'Cancel' : 'Add Expense'}
            </button>
            <button 
              onClick={handleVoiceButtonClick}
              disabled={isClassifying || isSubmitting}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Add
            </button>
          </div>
        </div>

        {/* Expense Flow - Form Step */}
        {expenseFlowStep === 'form' && (
          <div className="animate-slide-up mb-6">
            <ExpenseForm 
              onSubmit={handleExpenseFormSubmit}
              loading={isClassifying}
              onError={handleFormError}
            />
          </div>
        )}

        {/* Expense Flow - Review Step */}
        {expenseFlowStep === 'review' && pendingExpenseData && classificationResult && (
          <div className="animate-slide-up mb-6">
            <ExpenseReviewCard
              originalData={pendingExpenseData}
              classification={classificationResult}
              onAccept={handleReviewAccept}
              onReject={handleReviewReject}
              onModify={handleReviewModify}
              loading={isSubmitting}
            />
          </div>
        )}

        {/* Processing Indicator */}
        {isClassifying && (
          <div className="animate-slide-up mb-6">
            <div className="card p-6 border-2 border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing with AI...</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Categorizing your expense and extracting details</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {analyticsSummary && categoryStats.length > 0 && (
          <div className="card p-6 animate-slide-up mb-6" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Spending by Category
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last 7 days
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="flex justify-center">
                <SpendingPieChart
                  data={categoryStats}
                  preferredCurrency="THB"
                  size="md"
                  showLegend={false}
                  showValues={false}
                />
              </div>

              {/* Category List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Category Breakdown
                </h4>
                {categoryStats.slice(0, 6).map((category, index) => {
                  const colors = [
                    'bg-blue-500', 'bg-green-500', 'bg-orange-500', 
                    'bg-red-500', 'bg-purple-500', 'bg-cyan-500'
                  ];
                  
                  return (
                    <div key={category.group_id || `category-${index}`} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {category.group_name}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ฿{category.total_amount_thb.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {category.expense_count} expenses
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {category.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {categoryStats.length > 6 && (
                  <div className="text-center mt-4">
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium transition-colors duration-200">
                      View all categories
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Summary (when data available) */}
        {analyticsSummary && !analyticsLoading && (
          <div className="animate-slide-up mb-6" style={{ animationDelay: '250ms' }}>
            <SpendingSummaryComponent 
              summary={analyticsSummary}
              preferredCurrency="THB"
              loading={analyticsLoading}
            />
          </div>
        )}

        {/* Today's Expense List */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Expenses
          </h3>
          
          <ExpenseList
            expenses={todayExpenses}
            loading={todayLoading}
            error={todayError}
            preferredCurrency="THB"
            showDividers={false}
            emptyMessage="No expenses today. Start tracking your spending!"
            onExpenseUpdated={updateExpense}
            onExpenseDeleted={deleteExpense}
          />

          {/* View All Link */}
          {todayExpenses.length > 0 && (
            <div className="mt-6 text-center">
              <button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium transition-colors duration-200 flex items-center gap-1 mx-auto group">
                View All Expenses
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse-subtle"></span>
            Development environment ready
          </p>
        </footer>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Voice Overlay */}
      <VoiceOverlay
        isOpen={isVoiceOverlayOpen}
        onClose={() => setIsVoiceOverlayOpen(false)}
        onTranscriptComplete={handleVoiceTranscript}
        language="en-US"
      />
      
      {/* Debug panel in development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 z-40 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg opacity-90 max-w-sm cursor-pointer select-all">
          <div className="font-semibold mb-1">Debug Info 📋</div>
          <div>User: {user?.email || 'Not authenticated'}</div>
          <div>User ID: {user?.id?.substring(0, 8) || 'N/A'}...</div>
          <div>Expenses: {todayExpenses.length}</div>
          <div>Flow Step: {expenseFlowStep}</div>
          <div>Loading: {todayLoading ? '🔄' : '✅'}</div>
          <div>Classifying: {isClassifying ? '🧠' : '✅'}</div>
          <div>Submitting: {isSubmitting ? '⏳' : '✅'}</div>
          <div>Has Classification: {classificationResult ? '🤖' : '❌'}</div>
          <div>Analytics Loading: {analyticsLoading ? '🔄' : '✅'}</div>
          
          {/* Comprehensive Error Information */}
          {todayError && (
            <div className="border-t border-gray-700 mt-2 pt-2">
              <div className="text-red-400 font-semibold">🚨 TODAY EXPENSES ERROR:</div>
              <div className="text-red-300 mt-1 break-all">{String(todayError)}</div>
            </div>
          )}
          
          {/* Classification Result Details */}
          {classificationResult && (
            <div className="border-t border-gray-700 mt-2 pt-2">
              <div className="text-green-400 font-semibold">🤖 CLASSIFICATION:</div>
              <div className="text-green-300">Group: {classificationResult.group?.name || 'None'}</div>
              <div className="text-green-300">Confidence: {Math.round((classificationResult.confidence || 0) * 100)}%</div>
            </div>
          )}
          
          {/* Pending Data */}
          {pendingExpenseData && (
            <div className="border-t border-gray-700 mt-2 pt-2">
              <div className="text-yellow-400 font-semibold">⏳ PENDING DATA:</div>
              <div className="text-yellow-300">{pendingExpenseData.item}</div>
              <div className="text-yellow-300">{pendingExpenseData.amount} {pendingExpenseData.currency}</div>
            </div>
          )}
          
          {/* Analytics Error */}
          {analyticsSummary === null && !analyticsLoading && (
            <div className="border-t border-gray-700 mt-2 pt-2">
              <div className="text-orange-400 font-semibold">⚠️ ANALYTICS:</div>
              <div className="text-orange-300">No data available</div>
            </div>
          )}
          
          <div className="border-t border-gray-700 mt-2 pt-2 text-gray-400 text-center">
            Click to select all for copying
          </div>
        </div>
      )}
    </div>
  );
}
