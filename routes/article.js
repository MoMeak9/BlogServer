const express = require('express');
const router = express.Router();
const querySql = require('../db/index')

// 新增博客接口
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

// 获取全部博客列表接口 记得分页 管理可见
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

// 文章状态管理

// 获取全部博客列表接口 记得分页 游客可见
router.post('/allArticle', async (req, res, next) => {
    try {
        let allArticle = await querySql('select *,DATE_FORMAT(create_time,"%Y-%m-%d %H:%i:%s") AS create_time from article where state = 0 order by create_time desc')
        let classify = await querySql('select * from classify')
        for (let i = 0; i < classify.length; i++) {
            classify[i].sub_items = classify[i].sub_items.split(',')
            let sub_items = classify[i].sub_items
            for (let j = 0; j < sub_items.length; j++) {
                let num = await querySql(`SELECT COUNT(*) AS num FROM article WHERE tag REGEXP '${sub_items[j]}'`)
                sub_items[j] = {
                    title: sub_items[j],
                    num: num[0].num
                }
            }
        }
        let result = {
            allArticle,
            classify
        }
        res.send({code: 0, msg: '获取文章列表成功', data: result})
    } catch (e) {
        console.log(e)
        next(e)
    }
});

// 文章归档查询接口
router.get('/classify', async (req, res, next) => {
    let classifyByTag = [], classifyByDate = []
    try {
        let tags = await querySql('select class from classify')
        for (let i = 0; i < tags.length; i++) {
            let num = await querySql(`SELECT COUNT(*) AS num FROM article WHERE classify='${tags[i].class}'`)
            classifyByTag.push({
                className: tags[i].class,
                num: num[0].num
            })
        }
        // 自动查询近一年文章
        const date = new Date();
        for (let i = 0; i < 12; i++) {
            let month = ''
            let getMonth = date.getMonth()
            let getFullYear = date.getFullYear()
            if (getMonth - i < 0) {
                let nowMonth = (12 + (getMonth + 1 - i))
                month = getFullYear - 1 + '-' + ((nowMonth < 10) ? "0" + nowMonth : nowMonth)
            } else {
                let nowMonth = (getMonth + 1 - i)
                month = getFullYear + '-' + ((nowMonth < 10) ? "0" + nowMonth : nowMonth)
            }
            let articleList = await querySql(`SELECT title,id,user_uuid,tag,reading_times,praise_times,DATE_FORMAT(create_time,"%Y-%m-%d %H:%i") AS create_time FROM article WHERE create_time REGEXP '${month}' AND state='0'`)
            classifyByDate.push({
                month: month,
                articleList: articleList
            })
        }
        date.getMonth(); //获取当前月份(0-11,0代表1月)
        res.send({
            code: 0, msg: '获取文章列表成功', data: {
                classifyByTag,
                classifyByDate
            }
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
});


// 获取博客详情接口
router.post('/detail', async (req, res, next) => {
    let {article_id} = req.body
    console.log(article_id)
    try {
        let sql = 'select *,DATE_FORMAT(create_time,"%Y-%m-%d %H:%i:%s") AS create_time,DATE_FORMAT(update_time,"%Y-%m-%d %H:%i:%s") AS update_time from article where id = ?'
        let result = await querySql(sql, [article_id])
        let user = await querySql('select nickname from user where uuid = ? ', [result[0].user_uuid])
        res.send({code: 0, msg: '获取成功', data: {...result[0], userName: user[0].nickname}})
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
        await querySql(sql, [title, content, article_id, user_id])
        res.send({code: 0, msg: '更新成功', data: null})
    } catch (e) {
        console.log(e)
        next(e)
    }
});

// 更新博客状态
router.post('/editState', async (req, res, next) => {
    // 0 正常 -1 下架 1 草稿 -2 删除
    let {article_id, user_uuid, state} = req.body
    if (state === -2) {
        try {
            await querySql('delete from article where id = ? and user_uuid = ?', [article_id, user_uuid])
            res.send({code: 0, msg: '删除成功', data: null})
        } catch (e) {
            console.log(e)
            next(e)
        }
    } else {
        try {
            await querySql('update article set state = ? where id = ? and user_uuid = ?', [state, article_id, user_uuid])
            res.send({code: 1, msg: '修改成功', data: null})
        } catch (e) {
            console.log(e)
            next(e)
        }
    }
});

// 文章所有分类及其标签
router.get('/allClassAndTags', async (req, res, next) => {
    try {
        let result = await querySql('select * from classify')
        res.send({code: 1, msg: '请求成功', data: result})
    } catch (e) {
        console.log(e)
        next(e)
    }
});

module.exports = router;
