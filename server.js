const dotenv = require('dotenv').config();

const mongoclient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const sha = require('sha256');

app.set('view engine', 'ejs');
let session = require('express-session');
app.use(session({
    secret : 'dkufe8938493j4e08349u',
    resave : false,
    saveUninitialized : true
}))

const url = process.env.DB_URL;

let SC;

mongoclient.connect(url)
    .then(client => {
        SC = client.db('SurveyCorps');

        // 라우터에 SC라는 MongoDB 데이터베이스 연결을 전달
        const router = require('./routes/router')(SC);

        // 미들웨어를 사용
        app.use(express.static('public'));
        app.use(bodyParser.urlencoded({ extended: true }));

        app.set('view engine', 'ejs');

        // 라우터를 불러와 사용
        app.use('/', router);

        app.listen(process.env.PORT, function () {
            console.log('포트 8080으로 서버 대기중 ... ');
        });
    })
    .catch((err) => {
        console.log(err);
    });