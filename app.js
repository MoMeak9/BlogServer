const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const routers = require('./routes');

let port = 3000;

if (process.env.NODE_ENV === 'development') {
    console.log('当前环境是开发环境');
} else {
    port = 9000
    console.log('当前环境是生产环境');
}
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routers);

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
})

module.exports = app;
