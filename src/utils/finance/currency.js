const formatterCache = new Map()

const getFormatter = (currency) => {
  if (!formatterCache.has(currency)) {
    formatterCache.set(
      currency,
      new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }),
    )
  }
  return formatterCache.get(currency)
}

export const formatCurrency = (amount, currency) => {
  const value = Number(amount)
  if (!currency || Number.isNaN(value)) return '—'
  return getFormatter(currency).format(value)
}
