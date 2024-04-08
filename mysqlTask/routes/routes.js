const express = require('express')
const router =  express.Router()

const getAllProducts = require("../controller/product.controller.js")


router.get( '/', getAllProducts)


module.exports = router