var express = require('express');
var router = express.Router();
const fs = require("fs");
const XLSX = require("xlsx");
const path = require("node:path");


const InputDto = require("../dtos/input_dto")
const {insertAggregationSetting, selectAggregationSetting, deleteAggregationSetting, updateAggregationSetting} = require("../db/database");

router.post('/', async function (req, res, next) {
    const params = req.body;

    const folderPath = params.path;

    const files = fs.readdirSync(folderPath);

    const typeJson = {};

    const resultJson = {};

    for (const file of files) {
        if (path.extname(file) !== ".xlsx" && path.extname(file) !== ".xls")
            continue;

        const type = file[0];
        const fileName = file.slice(1, file.indexOf("."))
        const fullPath = path.join(folderPath, file);
        const excelToJson = await getExcelToJson(fullPath);

        if(typeJson[type] == null) {
            const selectResult = await selectAggregationSetting(type);

            const selectJson = {};
            selectResult.forEach((item) => {
                selectJson[item["파일 명"]] = item;
            })

            typeJson[type] = selectJson
        }

        const readTypeDict = typeJson[type][fileName];

        if(readTypeDict == null)
            continue;


        const labelListByType = InputDto.getLabelListByTypetoUseExcel(type);

        if(resultJson[type] == null)
            resultJson[type] = []


        for(const readExcelItem of excelToJson) {
            const inputDict = {}


            for (const label of labelListByType) {
                inputDict[label] = readExcelItem[readTypeDict[label]]
            }

            resultJson[type].push(inputDict)
        }
    }

    Object.keys(resultJson).forEach((type) => {
        const worksheet = XLSX.utils.json_to_sheet(resultJson[type]);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const resultfileName = `${type} 취합.xlsx`;
        const resultFilePath = path.join(folderPath, resultfileName);
        XLSX.writeFile(workbook, resultFilePath);
    })


    res.status(200).send("clear");
});

router.get("/setting", async (req, res, next) => {
    const params = req.query;

    const result = await selectAggregationSetting(params.type);

    if(result == null) {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send(result);
})

router.delete("/setting", async (req, res, next) => {
    const params = req.query;

    const result = await deleteAggregationSetting(params.id, params.type);

    if(result == null) {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send(result);
})

router.put('/setting', async function (req, res, next) {
    const params = req.body;

    const dto = new InputDto(params, params.type);

    const result = await insertAggregationSetting(dto);

    if(result == null) {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send("clear");
});

router.post('/setting', async function (req, res, next) {
    const params = req.body;

    const dto = new InputDto(params, params.type);

    const result = await updateAggregationSetting(dto);

    if(result == null) {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send("clear");
});


module.exports = router;

async function getExcelToJson(filePath) {
    try {
        const workbook = await XLSX.readFile(filePath);
        //const workbook = XLSX.read(fileBuffer, {type: "buffer"});

        // 첫 번째 시트 데이터 가져오기
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 시트를 JSON으로 변환
        return XLSX.utils.sheet_to_json(sheet);
    }
    catch (err) {
        console.error("Error reading Excel file:", err.message);
        throw err;
    }
}
