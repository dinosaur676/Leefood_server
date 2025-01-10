var express = require('express');
var router = express.Router();
const aggregationRouter = require('./aggregation')

router.use("/aggregation", aggregationRouter);

module.exports = router;




