var express = require('express');
var router = express.Router();
const aggregationRouter = require('./aggregation')
const qrRouter = require("./qr")

router.use("/aggregation", aggregationRouter);
router.use("/qr", qrRouter);

module.exports = router;




