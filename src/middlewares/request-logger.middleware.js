// @ts-check

/**
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 */
const requestLogger = (request, response, next) => {
  const startTime = Date.now();

  // ---- REQUEST (CLIENT) INFO ----
  console.log("[INCOMING REQUEST]");
  console.log({
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.originalUrl,
    ip: request.ip,
    protocol: request.protocol,
    userAgent: request.get("user-agent"),
    contentType: request.get("content-type"),
  });

  // ---- RESPONSE (SERVER) INFO ----
  response.on("finish", () => {
    const duration = Date.now() - startTime;

    console.log("[OUTGOING RESPONSE]");
    console.log({
      timestamp: new Date().toISOString(),
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      duration: `${duration}ms`,
      contentType: response.get("content-type"),
    });
  });

  next();
};

export default requestLogger;
