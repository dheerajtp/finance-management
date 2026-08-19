import { TRANSACTION_TYPES } from '../../constants/transactionTypes'

export const recurringTransactionTypeOptions = TRANSACTION_TYPES

// Account/category/subscription options are dynamic, so the form isn't a
// generic field loop — this file just centralizes labels.
export const recurringTransactionFieldLabels = {
  type: 'Type',
  relatedSubscription: 'Related subscription',
  account: 'Account',
  fromAccount: 'From account',
  toAccount: 'To account',
  category: 'Category',
  amount: 'Amount',
  currency: 'Currency',
  description: 'Description',
  frequency: 'Frequency',
  startDate: 'Start date',
  nextOccurrenceDate: 'Next occurrence date',
  endDate: 'End date',
}
