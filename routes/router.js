const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
let multer = require('multer');
const sha = require('sha256');

let storage = multer.diskStorage({
    destination :function(req, file, done){
        done(null, './public/image')
    },
    filename : function(req, file, done){
        done(null, file.originalname)
    }
});

module.exports = function (SC) {

    router.get("/", function (req, res) {
        res.render('first_index.ejs',{user:null});
    });

    router.get("/list/:id", function(req, res){
        console.log(req.params.id);
        SC.collection('post').find().toArray()
        .then(result => {
            res.render('list.ejs', {user: req.params.id, preuser : req.session.user.userid, data : result});
        }).catch(err =>{
            console.log(err);
            res.status(500).send();
        });
    });

    router.get("/enter_intro", function (req, res) {
        res.render('enter_intro.ejs', { user: req.session.user.userid, preuser : req.session.user.userid });
    });

    router.get("/enter", function (req, res) {
        res.render('enter.ejs',  { user: req.session.user.userid, preuser : req.session.user.userid });
    });

    router.get("/content/:id", function(req, res){ // content에 id가 있을 때
        console.log(req.params.id);
        let new_id = new ObjectId(req.params.id); // id를 인코딩
        SC.collection('post').findOne({_id : new_id}) // 인코딩 된 id를 몽고 DB를 찾음
        .then(result => {
            res.render('content.ejs', {user: req.session.user.userid, preuser : req.session.user.userid, data : result});
        }).catch(err =>{
            console.log(err);
            res.status(500).send();
        });
    });

    router.get("/edit/:id", function(req, res){ // content에 id가 있을 때
        console.log(req.params.id);
        let new_id = new ObjectId(req.params.id); // id를 인코딩
        SC.collection('post').findOne({_id : new_id}) // 인코딩 된 id를 몽고 DB를 찾음
        .then(result => {
            res.render('edit.ejs', {user: req.session.user.userid, preuser : req.session.user.userid, data : result});
        }).catch(err =>{
            console.log(err);
            res.status(500).send();
        });
    });

    router.get("/login", function(req, res){ 
        console.log(req.session);
        if(req.session.user){
            const accountPromise = SC.collection('account').find().toArray();
            const postPromise = SC.collection('post').find().toArray();
            Promise.all([accountPromise, postPromise]).then(([accountData, postData]) => {
                res.render('index.ejs', { user: req.session.user.userid, preuser : req.session.user.userid, accountdata: accountData, data: postData });
                console.log('세션 유지');
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
        } else {
            res.render('login.ejs');
        }
    });

    router.get("/logout", function(req, res){
        console.log("로그아웃");
        req.session.destroy();
        res.render('first_index.ejs', {user : null});
    });

    router.get("/signup", function (req,res) {
        res.render("signup.ejs");
    });

    router.get("/group", function (req,res) {
        SC.collection('account').find().toArray()
        .then(result => {
            res.render('group.ejs', {user: req.session.user.userid, preuser : req.session.user.userid, data : result});
        }).catch(err =>{
            console.log(err);
            res.status(500).send();
        });
    });

    router.get("/blog/:id", function(req, res){         
        console.log(req.params.id);
        const accountPromise = SC.collection('account').find().toArray();
        const postPromise = SC.collection('post').find().toArray();
        Promise.all([accountPromise, postPromise]).then(([accountData, postData]) => {
            res.render('index.ejs', { user: req.params.id, preuser : req.session.user.userid, accountdata: accountData, data: postData });
        }).catch(err =>{
            console.log(err);
            res.status(500).send();
        });
    });

    router.get("/list_friend", function (req,res) {
        SC.collection('account').find().toArray()
        .then(result => {
            res.render('list_friend.ejs', {user: req.session.user.userid, preuser : req.session.user.userid, accountdata : result});
        }).catch(err =>{
            console.log(err);
            res.status(500).send();
        }); 
    });

    router.post("/login", function (req, res) {
        SC.collection('account').findOne({ userid: req.body.userid})
        .then(result => {
          if(result.userpw==sha(req.body.userpw)){
            req.session.user=req.body;
            console.log('1', req.body.userid);
            console.log('2', req.session.user.userid);
            console.log('새로운 로그인');
            const accountPromise = SC.collection('account').find().toArray();
            const postPromise = SC.collection('post').find().toArray();
            Promise.all([postPromise, accountPromise])
            .then(([postData, accountData]) => {
                res.render('index.ejs', {user: req.session.user.userid, preuser: req.session.user.userid, accountdata: accountData, data: postData });
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
        } else {
            res.render('login.ejs');
        }
        })
        .catch(err => {
        console.log(err);
        res.status(500).send();
        });
    });

    router.post('/save', function(req, res){
        let now = new Date();
        console.log(req.body.title);
        console.log(req.body.content);
        console.log(req.body.someDate);

        SC.collection('post').insertOne( // 이부분 각 계정에 따라 어떻게 처리해야할듯 싶음
            {userid : req.session.user.userid, title : req.body.title, content : req.body.content, date : now.getTime('KR'), content_id : req.body.content_id, path : imagepath})
            .then(result => {
                console.log(result);
                console.log('데이터 추가 성공');
                res.redirect('/list/' + req.session.user.userid);
            });
    });

    router.post('/save_intro', function(req, res){
        let now = new Date();
        console.log(req.body.title);
        console.log(req.body.content);
        console.log(req.body.someDate);

        SC.collection('post').insertOne( 
            {userid : req.session.user.userid, title : req.body.title, content : req.body.content, date : now.getTime('KR'), content_id : req.body.content_id, path : imagepath})
            .then(result => {
                console.log(result);
                console.log('데이터 추가 성공');
                res.redirect('/login');
            });
    });

    router.post('/delete', function(req, res){
        console.log(req.body);
        console.log(req.session.user.userid);
        console.log(req.body._id);
        console.log(req.body.userid);
        if(req.session.user.userid == req.body.userid){
            req.body._id = new ObjectId(req.body._id);
            SC.collection('post').deleteOne(req.body) // 이부분 각 계정에 따라 어떻게 처리해야할듯 싶음
            .then(result =>{
                console.log('삭제완료');
                res.status(200).send();
            })
            .catch(err =>{
                console.log(err);
                res.status(500).send();
            });
        }else{
            console.log("작성자만이 글을 삭제할 수 있습니다");
        }
    });

    router.post('/edit', function(req, res){
        console.log(req.body.title);
        console.log(req.body.content);
        let new_id = new ObjectId(req.body.id);
        SC.collection('post').updateOne({_id:new_id},
            {$set: {title : req.body.title, content : req.body.content, date : req.body.someDate}})
            .then(result => {
                console.log('데이터 수정 성공');
                res.redirect('/login');
            });

    });

    let upload = multer({ storage: storage });

    let imagepath = '';
    router.post('/photo', upload.single('picture'), function(req, res){
        console.log(req.file.path);
        imagepath = '\\' + req.file.path;
        console.log(imagepath);
    });

    router.post('/signup', function(req, res){
        console.log("아이디 : " + req.body.userid);
        console.log("이름 : " + req.body.username);
        console.log("비밀번호 : " + sha(req.body.userpw));
        console.log("소속 : " + req.body.usergroup);
        console.log("이메일 : " + req.body.useremail);
    
        SC
            .collection("account")
            .insertOne({
                userid : req.body.userid,
                username : req.body.username,
                userpw : sha(req.body.userpw),
                usergroup : req.body.usergroup,
                useremail : req.body.useremail,
                account_id : "account",
            })
            .then((result) => {
                console.log("회원가입 성공");
            });
        res.redirect("/");
    });

    router.post('/friend', function(req, res){
        console.log(req.body.user);
        SC.collection('account').insertOne(
            {userid : req.session.user.userid, frienduser : req.body.user, account_id : "friend"})
            .then(result => {
                console.log(result);
                console.log('친구목록 추가 성공');
                res.status(200).send('친구목록 추가 성공');
            }).catch(err => {
                console.error('친구목록 추가 실패:', err);
                res.status(500).send('친구목록 추가 실패');
            });
    });

    return router;
};