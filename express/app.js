'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const app = express();
require('module-alias/register');

const { swaggerSpec } = require('./swagger/config');
const swaggerUi = require("swagger-ui-express");

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const filelist = fs.readdirSync('./routes');
filelist.forEach(file => {
	let key = file.split('.')[0];
	app.use(`/${key}`, require(`./routes/${key}`));
})

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;