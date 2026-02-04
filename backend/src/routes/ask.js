const express = require("express");
const router = express.Router();

const { getAsk } = require("../controllers/askController");
const validate = require("../middlewares/validateRequest");
const askSchema = require("../schemas/askSchema");

router.get("/", validate(askSchema, "query"), getAsk);

module.exports = router;
