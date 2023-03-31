"use strict";
//Global dependencies
require('dotenv').config();
require('express-async-errors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
// const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUI = require("swagger-ui-express")
const { limitHandler } = require("../utils/generic-utils")
const { ALLOWED_HOST } = require("./app-data")


//Database
const connectDB = require('../db/connect');

//Routes
const bookRouter = require("../routes/book-route")
const userRouter = require("../routes/user-route")
const authRouter = require("../routes/auth")
const sellerRouter = require("../routes/seller-route")
const swaggerSpec = require("../utils/swagger-docs")
const homeRouter = require("../routes/index-route")
const cartRouter = require("../routes/cart-route")
const orderRouter = require("../routes/order-route")
const addressRouter = require("../routes/address-route")
const webhookRouter = require("../routes/webhook-route")
const reviewRouter = require("../routes/review-route")



// middleware
const notFoundMiddleware = require('../middleware/not-found');
const errorHandlerMiddleware = require('../middleware/error-handler');
const { assignSessionID } = require("../middleware/auth middleware")




//Express app

const express = require('express');
const app = express();


//Top -level middlewares
app.set('trust proxy', 1);
// app.use(
//     rateLimiter({
//         windowMs: 15 * 60 * 1000,
//         max: 60,
//     })
// );

app.use(helmet());
app.use(cors({
    origin: ALLOWED_HOST,
    credentials: true,
    methods: "GET,PATCH,POST,DELETE",
    exposedHeaders: ["set-cookie"],
}));
app.use(xss());
app.use(morgan("tiny"))
app.use(mongoSanitize());
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(fileUpload({ limits: { fileSize: Number(process.env.MAX_FILE_SIZE_IN_KB) * 1024 }, limitHandler }));
//ENDPOINTS that do not need sessions. e.g. webhooks, AWS health checker.
app.use("/", homeRouter)
app.use(webhookRouter)


app.use(assignSessionID)


//Register routers
app.use("/api/v1/products/books", bookRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/sellers", sellerRouter)
app.use("/api/v1/carts", cartRouter)
app.use("/api/v1/orders", orderRouter)
app.use("/api/v1/address", addressRouter)
app.use("/api/v1/reviews", reviewRouter)


//Low-level middlewares

if (process.env.SHOW_DOCS) {
    app.use("/api/v1/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec, { customSiteTitle: "Catalogue Smart", "deepLinking": true }))
}
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// const createDummyUser = require("../faker/user")
// const createDummySeller = require("../faker/seller")
// const createDummyBook = require("../faker/book")



const port = process.env.PORT || 5000;
const MONGO_URL = process.env.NODE_ENV === "development" ? process.env.DEV_MONGO_URL : process.env.MONGO_URL
console.log("MONGO_URL: ", MONGO_URL)
const start = async () => {
    try {
        await connectDB(MONGO_URL);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}..........................................................`)
        );
    } catch (error) {
        console.log(error);
    }
};

module.exports = { start }