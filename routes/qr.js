var express = require('express');
const {getHistory, insertHistory} = require("../db/qr_db");
var router = express.Router();

router.get("/", async (req, res, next) => {

    const result = await getHistory();

    if(result == null)
    {
        res.status(500).send("Failed");
        return;
    }

    res.status(200).send(result);
})

router.put("/", async (req, res, next) => {
    try {
        await insertHistory(req.body.pdNumber)
    }
    catch (e) {
        console.log(e);
    }

    res.status(200).send("success");
})

module.exports = router;