const express = require('express');
const router = express.Router();
const querySql = require('../db/index')
const {PWD_SALT, PRIVATE_KEY, EXPIRES, serverAddress} = require('../utils/constant')
const {md5, upload} = require('../utils')
const {v4: uuidv4} = require('uuid');
const jwt = require('jsonwebtoken')


// 账户注册
router.post('/register', async (req, res, next) => {
    let {username, password, nickname} = req.body
    try {
        let user = await querySql('select * from user where username = ?', [username])
        if (username == null || password == null || nickname == null) {
            res.status(404).send({code: -1, msg: "关键信息为空"})
        } else if (!user || user.length === 0) {
            let uuid = uuidv4()
            password = md5(password + PWD_SALT)
            await querySql('insert into user(uuid,username,password,nickname) value(?,?,?,?)', [uuid, username, password, nickname])
            res.send({code: 1, msg: "注册成功"})
        } else {
            res.send({code: -1, msg: "该账户已存在"})
        }
    } catch (err) {
        res.status(404).send({code: -1, msg: "系统异常"})
        console.log(err)
        next(err)
    }
});
// 登入
router.post('/login', async (req, res, next) => {
    let {username, password} = req.body
    try {
        let user = await querySql('select * from user where username = ?', [username])
        if (!user || user.length === 0) {
            res.send({code: -1, msg: "该账户不存在"})
        } else {
            password = md5(password + PWD_SALT)
            let result = await querySql('select * from user where username = ? and password = ?', [username, password])
            if (!result || result.length === 0) {
                res.send({code: -1, msg: "密码不正确"})
            } else {
                let token = jwt.sign({username}, PRIVATE_KEY, {expiresIn: EXPIRES})
                res.send({code: 1, msg: "登入成功", token: token})
            }
        }
    } catch (err) {
        res.status(404).send({code: -1, msg: "系统异常"})
        console.log(err)
        next(err)
    }
});
// 获取个人信息
router.get('/getUserInfo', async (req, res, next) => {
    let {username} = req.user
    try {
        let userinfo = await querySql('select nickname,head_img from user where username = ?', [username])
        res.send({code: 1, msg: "成功", data: userinfo})
    } catch (err) {
        console.log(err)
        next(err)
    }
});

// 修改个人信息(密码)
router.post('/editInfo', function (req, res, next) {

    }
);
//上传头像
router.post('/uploadImage', upload.single('head_img'), async (req, res, next) => {
    let {username} = req.user
    console.log(req.file)
    let imgPath = req.file.path.split('public')[1]
    let imgUrl = serverAddress + imgPath
    try {
        await querySql('update user set head_img = ? where username = ?', [imgUrl, username])
        res.send({code: 1, msg: '更新成功', data: {imgUrl: imgUrl}})
    } catch (err) {
        console.log(err)
        next(err)
    }
    res.send({code: 1, msg: '上传成功', data: imgUrl})
});

//用户信息更新接口
router.post('/updateUser', async (req, res, next) => {
    let {nickname, head_img} = req.body
    let {username} = req.user
    try {
        let result = await querySql('update user set nickname = ?,head_img = ? where username = ?', [nickname, head_img, username])
        res.send({code: 1, msg: '更新成功', data: null})
    } catch (err) {
        console.log(err)
        next(err)
    }
})

module.exports = router;
