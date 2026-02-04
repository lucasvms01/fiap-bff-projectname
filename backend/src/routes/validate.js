const express = require("express");
const router = express.Router();

const { postValidate } = require("../controllers/validateController");
const validate = require("../middlewares/validateRequest");
const validateSchema = require("../schemas/validateSchema");

router.post("/", validate(validateSchema), postValidate);

module.exports = router;
