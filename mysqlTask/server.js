require('dotenv').config(); 
const express = require("express");
const pool = require("./db/db.js");
const productRouter = require("./routes/routes.js");
const morgan = require('morgan'); 
const helmet = require('helmet'); 

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(helmet());
app.use(morgan('tiny')); 
app.use(express.json());

app.use('/products', productRouter);

// Start server only if database connection is successful
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the process with an error code
    } else {
        console.log("Connected to the database");

        // Start the Express server
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // Release the connection
        connection.release();

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
            });
        });
    }
});
