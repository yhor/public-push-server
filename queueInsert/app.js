const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const FCM = require('fcm-node');

const { PROJECT_DDB } = process.env;

exports.handler = async (event) => {
	try {

		const data = JSON.parse(event.Records[0].body);
		const TableName = `${data.project}-token`;
		const push_data = {
			notification: {
				title: data.title,
				body: data.body,
				icon: "firebase-logo.png",
				click_action: "http://localhost:8081",
			},
			to = await tokenCheck(TableName, data)
		};

		const FCM_URL = await dynamodb.get({ TableName: PROJECT_DDB, Key: { id: data.project } }).promise()
			.then(data => data.Item.server_key)
			.catch(e => new Error(`500|다이나모 DB 에러1 ${e}`));

		const fcm = new FCM(FCM_URL);

		await pushSend(fcm, push_data);

		return `Successfully processed ${event.Records.length} messages.`;
	} catch (e) {
		console.log('에러발생', e);
		return;
	}


};
function pushSend(fcm, pushJson) {
	return new Promise(async (resolve, reject) => {
		fcm.send(pushJson, function (err, response) {
			if (err) return reject(err);
			return resolve(response);
		});
	});
}

function tokenCheck(TableName, obj) {
	return new Promise(async (resolve, reject) => {
		if (obj.type === "topic") return resolve(`/topics/${obj.cid}`);

		await dynamodb.get({ TableName, Key: { cid: parseInt(obj.cid) } }).promise()
			.then(response => {
				resolve(response.Item.token);
			})
			.catch(e => {
				reject(`500|다이나모 DB 에러1 ${e}`);
			});

	});
}