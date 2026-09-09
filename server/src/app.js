import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { authRateLimiter } from "./config/rateLimiter.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import providerRoutes from "./routes/provider.routes.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { sendSuccess } from "./utils/response.js";

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  sendSuccess(res, { message: "OK", data: { service: "fixit-local-api" } });
});

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/providers", providerRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
