const maria = require("mysql");
const dotenv = require('dotenv');

dotenv.config();

const mariaDB = maria.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 5
})

function getConnection(){
    return new Promise((resolve, reject) => {
        mariaDB.getConnection((err, connection) => {
            if (err) {
                return reject(err);
            }
            resolve(connection);
        });
    });
};

module.exports = {
    getConnection
};