const express = require('express');
const { badRequest } = require('@helper/customError');
const router = express.Router();
const { createGuid, encrypt } = require('@script/common');
require('dotenv').config();

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const Dynamodb = new AWS.DynamoDB();

const { PROJECT_DDB } = process.env;

/**
 * @swagger
 * tags:
 *   name: auth
 *   description: 인증
 */

/**
* @swagger
* /auth/sign/:
*   post:
*     tags: [auth]
*     summary: 프로젝트 등록
*     security:
*       - Access_Token: []
*     requestBody:
*       description: 프로젝트 정보
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/definitions/pushSign'
*     responses:
*       allOf:
*       - $ref: '#/components/responses/All'
*       200:
*         content:
*           application/json:
*             example:
*               message: 'notification 서버 프로젝트 등록 성공'
*               data: [{'client_key': 'ABCDEFGHIJK'}]
*/

router.post('/sign/', async (req, res) => {
	try {
		const { project, server_key } = req.body;
		const korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
		const specialString = /[`~!@#$%^&*|\\\'\';:\/?\s]/gi;

		if (!project) return badRequest(res, '프로젝트 필수.');
		if (korean.test(project)) return badRequest(res, '프로젝트명 한글 지원 안됨.');
		if (specialString.test(project)) return badRequest(res, '프로젝트명 특수문자, 공백 지원 안됨');
		if (!server_key) return badRequest(res, '서버키 필수.');

		// 서버 프로젝트 정보 저장
		const project_check = await dynamodb.get({ TableName: PROJECT_DDB, Key: { id: project } }).promise();

		if (Object.keys(project_check).length) return badRequest(res, '이미 등록된 프로젝트 입니다.');

		const Item = {
			id: project,
			server_key,
			push_id: createGuid(),
			salt_key: createGuid()
		}

		const client_key = encrypt(Item.push_id, Item.salt_key);
		const tableName = `${project}-noti`;
		const tableName2 = `${project}-token`;
		const ProvisionedThroughput = {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}

		//예약전송 테이블생성
		const create_noti = Dynamodb.createTable({
			TableName: tableName,
			KeySchema: [
				{ AttributeName: 'time', KeyType: 'HASH' },  //Partition key
				{ AttributeName: 'cid', KeyType: 'RANGE' }  //Sort key
			],
			AttributeDefinitions: [
				{ AttributeName: 'time', AttributeType: 'N' },
				{ AttributeName: 'cid', AttributeType: 'S' }
			],
			ProvisionedThroughput
		}).promise();

		//토큰관리테이블
		const create_token = Dynamodb.createTable({
			TableName: tableName2,
			KeySchema: [
				{ AttributeName: 'cid', KeyType: 'HASH' }  //Sort key
			],
			AttributeDefinitions: [
				{ AttributeName: 'cid', AttributeType: 'N' }
			],
			ProvisionedThroughput
		}).promise();

		await Promise.all([create_noti, create_token]);

		await dynamodb.put({ TableName: PROJECT_DDB, Item }).promise();

		res.send({
			success: true,
			message: 'notification 서버 프로젝트 등록 성공',
			data: { client_key }
		});

	} catch (e) {
		return badRequest(res, 'push 서버 프로젝트 등록 에러', e);
	}
});




/**
* @swagger
* /auth/sign/:
*   delete:
*     summary: 프로젝트 삭제
*     tags: [auth]
*     security:
*       - Access_Token: []
*     requestBody:
*       description: 프로젝트 정보
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/definitions/pushDelete'
*     responses:
*       allOf:
*       - $ref: '#/components/responses/All'
*/

router.delete('/sign/', async (req, res) => {
	try {

		const { project } = req.body;

		if (!project) return badRequest(res, '프로젝트 필수.');

		const project_check = await dynamodb.get({ TableName: PROJECT_DDB, Key: { id: project } }).promise();

		if (!Object.keys(project_check).length) return badRequest(res, '없는 프로젝트입니다.');


		await Promise.all([
			dynamodb.delete({ TableName: PROJECT_DDB, Key: { id: project } }).promise(),
			Dynamodb.deleteTable({ TableName: `${project}-noti` }).promise(),
			Dynamodb.deleteTable({ TableName: `${project}-token` }).promise(),
		])

		res.send({
			success: true,
			message: '프로젝트 삭제 완료',
		});

	} catch (e) {
		return badRequest(res, '프로젝트 삭제 에러', e);
	}
});

module.exports = router;