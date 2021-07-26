const express = require('express');
const { badRequest } = require('@helper/customError');
const router = express.Router();
const { find_project } = require('@script/common');
require('dotenv').config();

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const { PROJECT_DDB } = process.env;

/**
 * @swagger
 * tags:
 *   name: token
 *   description: 토큰
 */

/**
* @swagger
* /token/:
*   post:
*     summary: 토큰 등록
*     tags: [token]
*     security:
*       - Access_Token: []
 *     requestBody:
 *       description: 출연정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/tokenInsert'
*     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
*/

router.post('/', async (req, res) => {
	try {
		const { token, cid, client_key: key } = req.body;

		if (!token) return badRequest(res, '토큰을 입력해주세요');

		const project_check = await dynamodb.scan({ TableName: PROJECT_DDB }).promise();
		const project = find_project(project_check.Items, key);

		if (!project) return badRequest(res, '잘못된 client_key');

		const params = {
			Item: {
				cid,
				token,
			},
			TableName: `${project}-token`
		}

		await dynamodb.put(params).promise().catch(e => {
			throw new Error(`다이나모 DB 에러 ${e}`);
		});

		res.send({
			success: true,
			message: '토큰등록 성공'
		});

	} catch (e) {
		return badRequest(res, `토큰등록 실패 ${e.message}`, e);
	}
});


/**
* @swagger
* /token/list/:
*   get:
*     summary: 토큰 리스트
*     tags: [token]
*     security:
*       - Access_Token: []
*     parameters:
*       - in: query
*         name: client_key
*         required: false
*         type: 'interger'
*     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
*/

router.get('/list', async (req, res) => {
	try {

		const { client_key } = req.query;

		if (!client_key) return badRequest(res, 'client_key를 입력해주세요');

		const project_check = await dynamodb.scan({ TableName: PROJECT_DDB }).promise();
		const project = find_project(project_check.Items, client_key);

		if (!project) return badRequest(res, '잘못된 client_key');

		const token_list = await dynamodb.scan({ TableName: `${project}-token` }).promise();

		res.send({
			success: true,
			message: '토큰 리스트',
			data: token_list.Items
		});

	} catch (e) {
		return badRequest(res, `토큰 리스트 실패 ${e.message}`, e);
	}
});



module.exports = router;