const {getConnection} = require("./database")

async function getHistory() {
    const sql = "select * from pd_num_history order by `created_on` desc";

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

async function insertHistory(pdNum) {
    const sql = "insert into pd_num_history(pd_number, created_on) values(?, ?)";

    const now = new Date(Date.now());
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9 적용
    const timestamp = koreanTime.toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:MM:SS' 형식으로 변환


    const connection = await getConnection();

    return await new Promise((resolve, reject) => {
        connection.query(sql, [pdNum, timestamp], (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
}

module.exports = {
    getHistory,
    insertHistory
}