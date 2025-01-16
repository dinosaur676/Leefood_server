const {getConnection} = require("./database")

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


module.exports = {
    insertAggregationSetting,
    selectAggregationSetting,
    deleteAggregationSetting,
    updateAggregationSetting
}