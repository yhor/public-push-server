const app = require('./app');
const port = 8888;
/*
required [
  PROJECT_DDB, SQS_URL
]

*/
require('dotenv').config();

app.listen(port);
console.log(`listening on http://localhost:${port}`);
