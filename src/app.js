import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true, }));

// import routes
import userRouter from "./routes/user.routes.js";

// use routes
app.get("/", (req, res) => {
    res.send("<h1>Welcome to the API</h1>");
});
app.use("/api/v1/users", userRouter)



export default app;