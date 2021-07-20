const AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-2';
const docClient = new AWS.DynamoDB.DocumentClient();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const { SQS_URL, PROJECT_DDB } = process.env;

exports.handler = async (event) => {
	try {
		const timestamp = dayjs().tz('Asia/Seoul').format('YYYYMMDDHHmm');
		console.log('크론시작', timestamp);

		const project_check = await docClient.scan({ TableName: PROJECT_DDB }).promise();

		if (!Object.keys(project_check).length) return '크론종료';

		await Promise.all(project_check.Items.map(async x => {
			let TableName = `${x.id}-noti`,
				params = {
					TableName,
					KeyConditionExpression: "#type = :type", // 어떤 키로 조회할지 정합니다.
					ExpressionAttributeNames: { // 조회할 때 쓸 키의 이름, 별명을 정합니다.
						"#type": "time"
					},
					ExpressionAttributeValues: { // 조회할 키의 값을 정합니다.
						":type": parseInt(timestamp)
					}
				};

			let data = await docClient.query(params).promise().catch(e => {
				throw new Error(`500|다이나모 DB 에러 ${e}`);
			});

			let notiList = data.Items;

			let cidMap = notiList.map((v) => pushSend(v, x.id));
			let delPromise = notiList.map(x => delDB(x, TableName));

			return Promise.all([Promise.all(cidMap), Promise.all(delPromise)]);
		}));

		console.log('cron 끝', timestamp);
		return;

	} catch (e) {
		console.log('전송실패', e);
	}
};


let pushSend = ({ cid, type, datas }, project) => {
	const typeInfo = { cid, type };
	const msgBox = datas.map(data => sendMsg({ ...data, ...typeInfo, project }));
	return Promise.all(msgBox);
};

let sendMsg = (jsonObj) => {
	return new Promise((resolve, reject) => {
		const mesasage = {
			MessageBody: JSON.stringify(jsonObj),
			QueueUrl: SQS_URL
		};
		sqs.sendMessage(mesasage, function (err, data) {
			if (err) {
				// console.log(`500|다이나모 DB 에러 ${err}`);
				sendMsg(jsonObj);
				// throw new Error(`500|다이나모 DB 에러 ${err}`);
			} else {
				console.log("Success", data.MessageId);
				resolve();
			}
		});
	});
};


let delDB = ({ cid, time }, TableName) => {
	return new Promise((resolve, reject) => {
		const Key = { cid, time };
		docClient.delete({ TableName, Key }).promise()
			.then(() => {
				resolve();
			})
			.catch(e => {
				reject(e);
			});

	});
};