//Global dependencies
require('dotenv').config();
require('express-async-errors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');


//Database
const connectDB = require('./db/connect');

//Routes
const bookRouter = require("./routes/book-route")



// middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');



//Express app 
const express = require('express');
const app = express();


//Top -level middlewares
app.set('trust proxy', 1);
app.use(
    rateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 60,
    })
);
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(morgan("tiny"))
app.use(mongoSanitize());

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(express.static('./public'));
app.use(fileUpload());

//Register routers
app.use("/api/v1", bookRouter)


//Low-level middlewares 

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;
const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();
