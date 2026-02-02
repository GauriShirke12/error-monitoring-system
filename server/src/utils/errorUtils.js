const sanitizeErrorInput = (message, stackTrace) => ({
  message: sanitizeText(message),
  stackTrace: sanitizeText(stackTrace)
});
