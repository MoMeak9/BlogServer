const express = require('express');
const router = express.Router();
const querySql = require('../db/index')

/* 新增博客接口 */
router.post('/add', async (req, res, next) => {
    console.log(req.body)
    let {title, content, synopsis, tag} = req.body
    let {username, role} = req.user
    if (role !== 1) {
        res.send({code: -1, msg: '无权限', data: null})
    } else {
        try {
            let result = await querySql('select role,uuid from user where username = ?', [username])
            let user_uuid = result[0].uuid
            if (result[0].role !== 1) {
                res.send({code: -1, msg: '无权限', data: null})
            } else {
                try {
                    await querySql('insert into article(title,content,user_uuid,synopsis,tag,create_time) values(?,?,?,?,?,NOW())', [title, content, user_uuid, synopsis, tag])
                    res.send({code: 1, msg: '新增成功', data: null})
                } catch (e) {
                    console.log(e)
                    next(e)
                }
            }
        } catch (e) {
            console.log(e)
            next(e)
        }
    }
});

// 获取全部博客列表接口 记得分页
router.post('/allList', async (req, res, next) => {
    let {role} = req.user
    if (role !== 1) {
        res.send({code: -1, msg: '无权限', data: null})
    } else {
        try {
            let sql = 'select *,DATE_FORMAT(create_time,"%Y-%m-%d %H:%i:%s") AS create_time from article'
            let result = await querySql(sql)
            res.send({code: 0, msg: '获取成功', data: result})
        } catch (e) {
            console.log(e)
            next(e)
        }
    }
});

// 获取全部博客列表接口 记得分页
router.post('/allArticle', async (req, res, next) => {
    try {
        let sql = 'select *,DATE_FORMAT(create_time,"%Y-%m-%d %H:%i:%s") AS create_time from article where state = 0'
        let result = await querySql(sql)
        res.send({code: 0, msg: '获取文章列表成功', data: result})
    } catch (e) {
        console.log(e)
        next(e)
    }
});

// 文章分类查询
router.get('/classify', async (req, res, next) => {
    try {
        let sql = 'select *,DATE_FORMAT(create_time,"%Y-%m-%d %H:%i:%s") AS create_time from article where state = 0'
        let result = await querySql(sql)
        res.send({code: 0, msg: '获取文章列表成功', data: result})
    } catch (e) {
        console.log(e)
        next(e)
    }
});


// 获取博客详情接口
router.get('/detail', async (req, res, next) => {
    let article_id = req.query.article_id
    try {
        let sql = 'select id,title,content,DATE_FORMAT(create_time,"%Y-%m-%d %H:%i:%s") AS create_time from article where id = ?'
        let result = await querySql(sql, [article_id])
        res.send({code: 0, msg: '获取成功', data: result[0]})
    } catch (e) {
        console.log(e)
        next(e)
    }
});

// 更新博客接口
router.post('/update', async (req, res, next) => {
    let {article_id, title, content} = req.body
    let {username} = req.user
    try {
        let userSql = 'select id from user where username = ?'
        let user = await querySql(userSql, [username])
        let user_id = user[0].id
        let sql = 'update article set title = ?,content = ? where id = ? and user_id = ?'
        let result = await querySql(sql, [title, content, article_id, user_id])
        res.send({code: 0, msg: '更新成功', data: null})
    } catch (e) {
        console.log(e)
        next(e)
    }
});

// 删除博客接口
router.post('/delete', async (req, res, next) => {
    let {article_id} = req.body
    let {username} = req.user
    try {
        let userSql = 'select id from user where username = ?'
        let user = await querySql(userSql, [username])
        let user_id = user[0].id
        let sql = 'delete from article where id = ? and user_id = ?'
        let result = await querySql(sql, [article_id, user_id])
        res.send({code: 0, msg: '删除成功', data: null})
    } catch (e) {
        console.log(e)
        next(e)
    }
});

module.exports = router;
