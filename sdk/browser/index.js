import SDK from '../core/SDK';

const ErrorMonitor = new SDK();

// Uncaught JS errors
if (typeof window !== 'undefined') {
  window.onerror = function (
    message,
    source,
    lineno,
    colno,
    error
  ) {
    ErrorMonitor.captureError(
      error || new Error(message),
      { source, lineno, colno }
    );
    return false;
  };

  // 🔥 NEW: Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;

    let error;
    if (reason instanceof Error) {
      error = reason;
    } else {
      error = new Error(
        typeof reason === 'string'
          ? reason
          : JSON.stringify(reason)
      );
    }

    ErrorMonitor.captureError(error, {
      type: 'unhandledrejection'
    });
  });
}

export default ErrorMonitor;
