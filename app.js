const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const fs = require('fs');
const cors = require('cors')
const expressJWT = require('express-jwt')
const {PRIVATE_KEY, whitelist} = require('./utils/constant')

const artRouter = require('./routes/article');
const usersRouter = require('./routes/users');
const commentRouter = require('./routes/comment')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// 接口日志
morgan.format('Blog', '[Blog] :method :url :status');
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
    console.log('当前环境是开发环境')
} else {
    app.use(morgan('Blog', {stream: accessLogStream}));
    console.log('当前环境是生产环境')
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressJWT({
    secret: PRIVATE_KEY,
    // algorithms: ['RS256'],
    algorithms: ['HS256']
}).unless({
    path: whitelist //⽩名单,除了这⾥写的地址，其他的URL都需要验证
}));

app.use('/api/article', artRouter);
app.use('/api/user', usersRouter);
app.use('/api/comment', commentRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    console.log(err)
    if (err.name === 'UnauthorizedError') {
        // 这个需要根据⾃⼰的业务逻辑来处理
        res.status(401).send({code: -1, msg: 'token验证失败'});
    } else {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    }
});

module.exports = app;
