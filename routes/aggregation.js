var express = require('express');
var router = express.Router();
const fs = require("fs");
const XLSX = require("xlsx");
const path = require("node:path");

const InputDto = require("../dtos/input_dto")
const {insertAggregationSetting, selectAggregationSetting, deleteAggregationSetting, updateAggregationSetting} = require("../db/aggregation_db");

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

        const inputDict = {}
        for(const readExcelItem of excelToJson) {
            const productNumberLabel = readTypeDict["상품번호"];

            if(inputDict[readExcelItem[productNumberLabel]] == null)
                inputDict[readExcelItem[productNumberLabel]] = [];


            const subLabelDict = {}

            for (const label of labelListByType) {
                subLabelDict[label] = readExcelItem[readTypeDict[label]];
            }

            inputDict[readExcelItem[productNumberLabel]].push(subLabelDict);
        }

        for(const inputKey of Object.keys(inputDict)) {
            inputDict[inputKey].forEach((item) => {
                resultJson[type].push(item)
            })
        }
    }

    Object.keys(resultJson).forEach((type) => {
        writeExcel(folderPath, `${type} 취합.xlsx`, resultJson[type]);
        getQuantity(folderPath, `${type} 수량.xlsx`, resultJson[type]);
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

function writeExcel(folderPath, fileName, jsonData) {
    const worksheet = XLSX.utils.json_to_sheet(jsonData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const resultFilePath = path.join(folderPath, fileName);
    XLSX.writeFile(workbook, resultFilePath);
}

function getQuantity(folderPath, fileName, jsonData) {
    const sumDict = {};
    const resultData = [];

    for(const data of jsonData) {
        const productName = data["상품명1"];
        const productDetail = data["상품상세1"] == null ? "" : data["상품상세1"];
        const quantity = parseInt(data["수량(A타입)"]);

        if(sumDict[productName] == null)
            sumDict[productName] = {};

        if(sumDict[productName][productDetail] == null)
            sumDict[productName][productDetail] = 0

        sumDict[productName][productDetail] += quantity;
    }

    Object.keys(sumDict).forEach((pdName) => {
        Object.keys(sumDict[pdName]).forEach((pdDetail) => {

            const data = {
                "상품명" : pdName,
                "상품상세" : pdDetail,
                "수량": sumDict[pdName][pdDetail]
            }

            resultData.push(data);
        })
    })

    writeExcel(folderPath, fileName, resultData);


}
