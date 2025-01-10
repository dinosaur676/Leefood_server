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

async function updateAggregationSetting(dto) {

    const placeholder = dto.labelList.map((item) => {
        return `\`${item}\` = ?`
    }).join(", ");

    const sql = `update ${getTableName(dto.type)} set ${placeholder} where id = ${dto.id}`;

    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(sql, dto.dtoData.slice(1), (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function insertAggregationSetting(dto) {
    const labelListArray = dto.labelList.map((item) => {
        return `\`${item}\``
    })
    const labelList = labelListArray.join(", ");
    const insertData = dto.dtoData.slice(1);
    const placeholder = insertData.map(()=> "?").join(", ");
    const sql = `insert into ${getTableName(dto.type)}(${labelList}) values(${placeholder})`;

    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(sql, insertData, (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function selectAggregationSetting(type) {
    const sql = `select * from ${getTableName(type)}`

    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(sql, [], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function deleteAggregationSetting(id, type) {
    const sql = `delete from ${getTableName(type)} where id = ?`

    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(sql, [id], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
}

function getTableName(type) {
    let table = "aggregation_set_a";

    switch (type) {
        case "B":
            table = "aggregation_set_b";
            break;
        case "C":
            table = "aggregation_set_c";
            break;
    }

    return table;
}


async function deleteNetwork(network, category) {
    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(deleteNetworkSQL, [network, category], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function deleteWallet(id) {
    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(deleteWalletSQL, id, (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function selectNetwork() {
    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(selectNetworkSQL, [], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function selectNetworkGroupBy() {
    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(selectNetworkGroupBySQL, [], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function selectAPI() {
    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(selectAPISQL, [], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function selectWallet() {
    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(selectWalletSQL, [], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err);
            }

            resolve(results);
        });
    });
}


async function selectCoinPrice() {
    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(selectCoinPriceSQL, [], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err);
            }

            resolve(results);
        });
    });
}

async function insertCoinPrice (network, api_id, price) {
    const dto = [network, api_id, price]

    const conn = await getConnection();

    return await new Promise((resolve, reject) => {
        conn.query(insertCoinPriceSQL, dto, (err, results) => {
            conn.release();

            if (err) {
                logger.error(err);
                reject(err);
            }

            resolve(results)
        });
    })
}

async function insertNetwork (network, category, url, form, api_id) {
    const dto = [network, category, url, form, api_id]

    const conn = await getConnection();

    return await new Promise((resolve, reject) => {
        conn.query(insertNetworkSQL, dto, (err, results) => {
            conn.release();

            if (err) {
                logger.error(err);
                reject(err);
            }

            resolve(results)


        });
    })
}


async function insertWallet (network, category, name, address) {
    const dto = [network, category, name, address]

    const conn = await getConnection();

    return await new Promise((resolve, reject) => {
        conn.query(insertWalletSQL, dto, (err, results) => {
            conn.release();

            if (err) {
                logger.error(err);
                reject(err)
            }

            resolve({id: results.insertId})


        });
    });
}

const getConnection = () => {
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
    insertAggregationSetting,
    selectAggregationSetting,
    deleteAggregationSetting,
    updateAggregationSetting
}