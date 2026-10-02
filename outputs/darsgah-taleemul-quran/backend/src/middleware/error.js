export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.statusCode || 500;
  const expose = status < 500 || process.env.NODE_ENV !== "production";
  res.status(status).json({ message: expose ? (err.message || "Request failed") : "The server could not complete this request." });
}
