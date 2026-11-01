/**
 * Map Firebase Auth error codes to user-friendly messages for demo UX.
 */
export function getAuthErrorMessage(error, context = 'login') {
  const code = error?.code || '';

  const messages = {
    'auth/invalid-credential':
      "Incorrect email or password. If you're new, use Register below.",
    'auth/user-not-found':
      "No account found with this email. Please Register first.",
    'auth/wrong-password':
      'Incorrect password. Try again or reset it in Firebase Console.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests':
      'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed':
      'Network error. Check your connection and try again.',
    'auth/email-already-in-use':
      'An account with this email already exists. Try Sign In instead.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/operation-not-allowed':
      'Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/missing-password': 'Please enter your password.',
  };

  if (messages[code]) {
    return messages[code];
  }

  if (context === 'register') {
    return error?.message
      ? `Could not create account: ${error.message}`
      : 'Failed to create an account. Please try again.';
  }

  return error?.message && !String(error.message).includes('Firebase:')
    ? error.message
    : 'Failed to sign in. Please try again.';
}
