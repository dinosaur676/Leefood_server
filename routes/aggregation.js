var express = require('express');
var router = express.Router();
const fs = require("fs");
const XLSX = require("xlsx");
const path = require("node:path");

const InputDto = require("../dtos/input_dto")
const {
    insertAggregationSetting,
    selectAggregationSetting,
    deleteAggregationSetting,
    updateAggregationSetting
} = require("../db/aggregation_db");
const findFrame = require("../find.json");

router.post('/', async function (req, res, next) {
    const params = req.body;

    const folderPath = params.path;
    let files = [];
    try {
        files = fs.readdirSync(folderPath);
    } catch (e) {
        console.log(e)
    }


    const typeJson = {};

    const resultJson = {};

    for (const file of files) {
        if (path.extname(file) !== ".xlsx" && path.extname(file) !== ".xls")
            continue;

        const type = file[0] !== "B" && file[0] !== "C" ? "A" : file[0];
        const fileName = file.slice(0, file.indexOf("."))
        const fullPath = path.join(folderPath, file);
        const excelToJson = await getExcelToJson(fullPath);

        if (typeJson[type] == null) {
            const selectResult = await selectAggregationSetting(type);

            const selectJson = {};
            selectResult.forEach((item) => {
                selectJson[item["플랫폼 명"]] = item;
            })

            typeJson[type] = selectJson
        }

        let findPlatform = null;
        for (const typeJsonItem of Object.values(typeJson[type])) {
            if (fileName.indexOf(typeJsonItem["파일 명"]) >= 0) {
                findPlatform = typeJsonItem["플랫폼 명"];
            }
        }

        const readTypeDict = findPlatform == null ? null : typeJson[type][findPlatform];

        if (readTypeDict == null)
            continue;


        const labelListByType = InputDto.getLabelListByTypetoUseExcel(type);

        if (resultJson[type] == null)
            resultJson[type] = []

        if (readTypeDict["플랫폼 명"].indexOf("ESM") >= 0) {
            writeESMFile(folderPath, `${type} ESM 운송장.xlsx`, excelToJson);
        }

        const inputDict = {}
        for (const readExcelItem of excelToJson) {
            const productNumberLabel = readTypeDict["상품번호"];

            if (inputDict[readExcelItem[productNumberLabel]] == null)
                inputDict[readExcelItem[productNumberLabel]] = [];


            const subLabelDict = {}

            for (const label of labelListByType) {
                const key = readTypeDict[label];

                if (key == null || readExcelItem[key] == null) {
                    subLabelDict[label] = "";
                    continue
                }

                subLabelDict[label] = readExcelItem[key].toString();
            }

            inputDict[readExcelItem[productNumberLabel]].push(subLabelDict);
        }

        for (const inputKey of Object.keys(inputDict)) {
            inputDict[inputKey].forEach((item) => {
                resultJson[type].push(item)
            })
        }
    }

    Object.keys(resultJson).forEach((type) => {
        try {
            writeAggregateFile(folderPath, `${type} 취합.xlsx`, resultJson[type]);
            writeWaybillFile(folderPath, `${type} 취합 운송장용.xlsx`, resultJson[type]);
            getQuantity(folderPath, `${type} 수량.xlsx`, resultJson[type]);
        } catch (e) {

        }
    })


    res.status(200).send("clear");
});

router.get("/setting", async (req, res, next) => {
    const params = req.query;

    const result = await selectAggregationSetting(params.type);

    if (result == null) {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send(result);
})

router.delete("/setting", async (req, res, next) => {
    const params = req.query;

    const result = await deleteAggregationSetting(params.id, params.type);

    if (result == null) {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send(result);
})

router.put('/setting', async function (req, res, next) {
    const params = req.body;

    const dto = new InputDto(params, params.type);

    const result = await insertAggregationSetting(dto);

    if (result == null) {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send("clear");
});

router.post('/setting', async function (req, res, next) {
    const params = req.body;

    const dto = new InputDto(params, params.type);

    const result = await updateAggregationSetting(dto);

    if (result == null) {
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
    } catch (err) {
        console.error("Error reading Excel file:", err.message);
        throw err;
    }
}

function writeExcel(folderPath, fileName, jsonData) {
    try {
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const resultFilePath = path.join(folderPath, fileName);
        XLSX.writeFile(workbook, resultFilePath);
    } catch (e) {
        console.log(e)
    }
}

function writeESMFile(folderPath, fileName, jsonData) {
    const resultJson = [];

    for (const row of jsonData) {
        const item = {
            "계정": row["구매자아이디"],
            "주문번호": row["주문번호"],
            "택배사": "롯데택배",
            "운송장": ""
        }

        resultJson.push(item)
    }

    writeExcel(folderPath, fileName, resultJson)
}

function writeAggregateFile(folderPath, fileName, jsonData) {
    const findFrame = JSON.parse(fs.readFileSync("aggregation.json", "utf-8"));
    const newJsonData = jsonData.map(data => {

        const newData = structuredClone(data);

        const pdName = data["상품명1"];
        const pdDetail = data["상품상세1"];
        const quantity = data["수량(A타입)"];

        const findName = findItemInLabel(pdName, pdDetail, findFrame);

        if (findName !== null) {
            newData["상품상세1"] = pdDetail + quantity.toString()
            newData["수량(A타입)"] = "";
        }

        return newData;
    });

    writeExcel(folderPath, fileName, newJsonData)
}

function writeWaybillFile(folderPath, fileName, jsonData) {
    const findFrame = JSON.parse(fs.readFileSync("aggregation.json", "utf-8"));

    const newJsonData = jsonData.map(data => {

        const newData = structuredClone(data);

        const pdName = data["상품명1"];
        const pdDetail = data["상품상세1"];
        const quantity = data["수량(A타입)"];

        const findName = findItemInLabel(pdName, pdDetail, findFrame);

        if (findName !== null) {
            newData["상품상세1"] = pdDetail + quantity.toString()
            newData["수량(A타입)"] = "";
        }

        for (const label of InputDto.labelEmpty_A) {
            newData[label] = "";
        }

        return newData;
    });

    writeExcel(folderPath, fileName, newJsonData)
}

function getQuantity(folderPath, fileName, jsonData) {
    const findFrame = JSON.parse(fs.readFileSync("find.json", "utf-8"));
    const excelSumDict = {};
    const sumDict = {};
    const resultData = [];

    for (const data of jsonData) {
        const productName = data["상품명1"];
        const productDetail = data["상품상세1"] == null ? "" : data["상품상세1"];
        const quantity = parseInt(data["수량(A타입)"]);

        if (excelSumDict[productName] == null)
            excelSumDict[productName] = {};

        if (excelSumDict[productName][productDetail] == null)
            excelSumDict[productName][productDetail] = 0

        excelSumDict[productName][productDetail] += quantity;
    }

    Object.keys(excelSumDict).forEach((pdName) => {
        Object.keys(excelSumDict[pdName]).forEach((pdDetail) => {

            const findName = findItemInLabel(pdName, pdDetail, findFrame);

            if (findName != null) {
                if (sumDict[findName] == null)
                    sumDict[findName] = 0;


                sumDict[findName] += excelSumDict[pdName][pdDetail]
            }

        })
    })

    Object.keys(sumDict).forEach(value => {

        const data = {
            "상품명": value,
            "수량": sumDict[value]
        }

        resultData.push(data);
    })

    writeExcel(folderPath, fileName, resultData);
}

function findSplit(splitList, strOrigin) {
    let isFind = true;
    for (const subSplit of splitList) {
        if (strOrigin.indexOf(subSplit) < 0) {
            isFind = false;
            break;
        }
    }

    return isFind;
}

function findWordInLabel(pdName, pdDetail, main, subItem) {
    let isFind = false;

    if (pdDetail !== "") {
        if (pdDetail.indexOf(main) > 0) {
            isFind = findSplit(subItem.split(","), pdDetail);
        }
    } else if (pdName.indexOf(main) > 0) {
        isFind = findSplit(subItem.split(","), pdName);
    }

    return isFind;
}

function findItemInLabel(pdName, pdDetail, findFrame) {
    for (const findItem of Object.keys(findFrame)) {
        const findName = findItem;
        const main = findFrame[findItem]["main"];
        const sub = findFrame[findItem]["sub"];

        if (pdName.indexOf(main) < 0 && pdDetail.indexOf(main) < 0) {
            continue;
        }

        for (const subItem of sub) {
            let isFind = findWordInLabel(pdName, pdDetail, main, subItem);

            if (isFind) {
                return findName;
            }
        }
    }

    return null;
}