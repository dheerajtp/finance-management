const MESSAGES_BY_CODE = {
  user_already_exists: 'An account with this email already exists.',
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Please confirm your email before logging in.',
  weak_password: 'Password must be at least 8 characters.',
  session_not_found: 'Your session has expired. Please log in again.',
  over_email_send_rate_limit: 'Too many attempts. Please try again in a few minutes.',
  over_request_rate_limit: 'Too many attempts. Please try again in a few minutes.',
}

// Self-hosted GoTrue versions may not send `error.code` yet, so also match on message text.
const MESSAGE_PATTERNS = [
  [/already registered|already exists/i, 'An account with this email already exists.'],
  [/invalid login credentials|invalid credentials/i, 'Incorrect email or password.'],
  [/email not confirmed/i, 'Please confirm your email before logging in.'],
  [/password.*(least|character|weak)/i, 'Password must be at least 8 characters.'],
  [/session.*(missing|not found|expired)|jwt expired/i, 'Your session has expired. Please log in again.'],
]

export const getAuthErrorMessage = (error) => {
  if (MESSAGES_BY_CODE[error?.code]) {
    return MESSAGES_BY_CODE[error.code]
  }

  const match = MESSAGE_PATTERNS.find(([pattern]) => pattern.test(error?.message ?? ''))
  if (match) {
    return match[1]
  }

  if (!error?.status) {
    return 'Network error. Please check your connection and try again.'
  }

  return 'Something went wrong. Please try again.'
}
