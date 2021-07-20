# WEB, APP PUSH 서버




사용법

1. lambda에서 사용될 layer 생성
  ``` 
    cd nodejs && npm install && cd..
    zip -r nodejs.zip nodejs/*.* 
    //이미 생성 되어있다면 레이어가 Update 된다.
    aws lambda publish-layer-version --layer-name notiLayer --zip-file fileb://nodejs.zip --compatible-runtimes nodejs14.x nodejs12.x --description 초기세팅
  ```
  생성된 레이어의 arn을 template.yaml - Globals - Function - Layers 에 입력한다


## 빌드 배포,
```
  //cloudformation Stack 이름을 정하고 생성
  sam build && sam deploy --guided
```

