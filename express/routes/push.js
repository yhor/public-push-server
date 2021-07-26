const express = require('express');
const { badRequest } = require('@helper/customError');
const router = express.Router();
const { find_project } = require('@script/common');
require('dotenv').config();

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const { PROJECT_DDB } = process.env;

/**
 * @swagger
 * tags:
 *   name: push
 *   description: 푸시 발생
 */

 /**
 * @swagger
 * /push/:
 *   post:
 *     summary: 푸시 발생 or 예약 발생등록
 *     tags: [push]
 *     security:
 *       - Access_Token: []
 *     requestBody:
 *       description: 출연정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/notiPush'
 *     responses:
 *       allOf:
 *       - $ref: '#/components/responses/All'
 */

router.post('/', async (req, res) => {
	try {
		const { body, client_key: key } = req.body;
		const { SQS_URL } = process.env;

		if (!key) return badRequest(res, '프로젝트 Key 필요');    
		if (!body) return badRequest(res, '바디값');

		const project_check = await dynamodb.scan({ TableName: PROJECT_DDB }).promise();
		const project = find_project(project_check.Items, key);

		if (!project) return badRequest(res, '잘못된 key');

		if (body.time) {
			const TableName = `${project}-noti`;
			const Key = { 
				cid : String(body.cid), 
				time : parseInt(body.time)
			}
			const	insertData = { 
				title : body.title, 
				body : body.content 
			};

			//조회후 있으면 어레이 푸시
			await dynamodb.get({TableName, Key}).promise()
				.then(data => {
					if (Object.keys(data).length) {
						Key.datas = data.Item.datas;
						Key.datas.push(insertData);
					} else {
						Key.datas = [insertData];
					}
				})
				.catch(e => {
					throw new Error(`500|다이나모 DB 에러1 ${e}`);
				});

			Key.type = body.send_type;

			//db에 인서트
			await dynamodb.put({TableName, Item : Key}).promise().catch(e => {
				throw new Error(`500|다이나모 DB 에러2 ${e}`);
			});

			res.send({
				success: true,
				message: '푸시 예약 성공',
				data: { Key }
			});
		} else {
			const message = {
				project,
				cid: body.cid,
				title: body.title,
				body: body.content,
				type: body.send_type,
			}

			const params = {
				MessageBody: JSON.stringify(message),
				QueueUrl: SQS_URL
			};
			sqs.sendMessage(params, function (err, data) {
				if (err) {
					throw new Error(`500|다이나모 DB 에러 ${err}`);
				} else {
					res.send({
						success: true,
						message: '푸시 즉시 발송',
						// data: { message }
					});
				}
			});
		}
	} catch (e){
		return badRequest(res, '전송 실패', e);
	}
});



 /**
 * @swagger
 * /push/reservation_list/:
 *   get:
 *     summary: 예약전송 리스트 조회
 *     tags: [push]
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

router.get('/reservation_list', async (req, res) => {
	try {
		const { client_key } = req.query;

		if (!client_key) return badRequest(res, 'client_key를 입력해주세요');
		
		const project_check = await dynamodb.scan({ TableName: PROJECT_DDB }).promise();
		const project = find_project(project_check.Items, client_key);
		
		if (!project) return badRequest(res, '잘못된 client_key');

		const token_list = await dynamodb.scan({ TableName: `${project}-noti` }).promise();

		res.send({
			success: true,
			message: '예약전송 리스트 조회 성공',
			data: token_list.Items
		});
	} catch (e){
		return badRequest(res, '예약전송 리스트 조회 실패', e);
	}
});


module.exports = router;