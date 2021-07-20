const swaggerJSDoc = require('swagger-jsdoc');

process.env.SCHEMES = process.env.SCHEMES || 'http';
process.env.BASE_PATH = process.env.BASE_PATH || '/';

// Swagger definition
// You can set every attribute except paths and swagger
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: 'notification 서버',
    version: "1.0.0", // Version (required
    description: `noti 푸시 서버

    최초 사용시 auth 프로젝트 등록에 FCM 에서 발생된 server_key 를 입력하여 notification 서버의 client_key 를 생성 (재발급x, 찾기 불가능, 무조건 새로생성)
    
    메시지 발송은 push 에 전송하면 notification 이 발생됨.

    * 선택사항
        토큰으로 메시지 발생시 각 어플리케이션에서 token 으로 요청을 하도록해 토큰 자동등록
    `
  },
  components: {
    securitySchemes: {
      Access_Token: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
      },
    },
    schemas: {
      success: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
      totalCount: {
        properties: {
          totalCount: { type: "integer" },
        },
      },
    },
    responses: {
      All: {
        200: {
          $ref: "#/components/responses/OK",
        },
        400: {
          $ref: "#/components/responses/BadRequest",
        },
        401: {
          $ref: "#/components/responses/Unauthorized",
        },
        500: {
          $ref: "#/components/responses/InternalServerErrors",
        },
      },
      OK: {
        description: "OK",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "object" },
              },
            },
            example: {
              success: true,
              message: "",
            },
          },
        },
      },
      BadRequest: {
        description: "BadRequest",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "메세지 내용" },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "메세지 내용" },
              },
            },
          },
        },
      },
      InternalServerErrors: {
        description: "InternalServerErrors",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: false },
                message: { type: "string", example: "메세지 내용" },
              },
            },
          },
        },
      },
    },
  },
  definitions: {
    success: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: '등록성공'},
        data: { type: "string", example: null },
      }
    },
    pushDelete:{
      type: "object",
      properties: {
        project: { type: "string", example: '프로젝트이름'}
      }
    },
    pushSign: {
      type: "object",
      properties: {
        project: { type: "string", example: 'only English'},
        server_key: { type: "string", example: '푸시서버키'}
      }
    },
    tokenInsert: {
      type: "object",
      properties: {
        client_key: { type: "string", example: '키'},
        cid: { type: "string", example: '유저 cid'},
        token: { type: "string", example: '토큰'}
      }
    },
    notiPush: {
      type: "object",
      properties: {
        client_key: { type: "string", example: '키'},
        body: { type: "object", example: '그대로 리턴'}
      }        
    }
  },
  servers: [
    {
      url: '/',
      description: "Production server",
    }
  ]
};

const options = {
    swaggerDefinition,
    apis: ['./routes/*.js'] 
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
}