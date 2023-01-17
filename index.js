require('dotenv').config();
const sequelize = require('./DB');
const userModel = require('./models/userModel');
const cors = require('cors');
const UUID = require('uuid')

const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname))
app.use(express.urlencoded({ extended: false }));
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

const PORT = process.env.PORT || 7000;

let clients = []

const WebSocket = require('express-ws')(app);
const aWss = new WebSocket.getWss();
const router = require('./routes/index');

app.use('/api', router);

const grid = 15;
const paddleHeight = grid * 5;
let ScoreL, ScoreR, nickNameL, nickNameR;
let ball, rightPaddle,
    leftPaddle,
    maxPaddleY, paddleSpeed = 7, ballSpeed = 5;
let fieldWidth, fieldHeight;
const arr = [1, -1];

leftPaddle = {
    x: grid * 2,
    y: null,
    width: grid,
    height: paddleHeight,
    dy: 0
};

rightPaddle = {
    x: null,
    y: null,
    width: grid,
    height: paddleHeight,
    dy: 0
};

ball = {
    x: null,
    y: null,
    width: grid,
    height: grid,
    resetting: false,
    // Подаём мяч в правый верхний угол
    dx: ballSpeed,
    dy: -ballSpeed
};

app.ws('/', (ws, req) => {
    console.log('work');
    ws.on('message', (data) => {
        data = JSON.parse(data);
        ws.id = data.id;
        broadcastConnection(ws, data)
    });
    ws.on('close', (data) => {
        console.log('Закрыто', data);
    });
});

function collides(obj1, obj2) {
    /*console.log(obj1, obj2);*/
    return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
}

const broadcastConnection = (ws, data) => {
    for(let client of aWss.clients) {
        if(client.readyState === ws.OPEN && data.id === client.id) {
            console.log(client.highWaterMark);
            switch (data.method) {
                case 'connected':
                    console.log('connectionInfo:', data);
                    ScoreL = data.playerL.maxScore;
                    ScoreR = data.playerR.maxScore;
                    let playersScore = {};
                    playersScore['ScoreL'] = ScoreL;
                    playersScore['ScoreR'] = ScoreR;
                    playersScore['method'] = 'setConnectionEnd';
                    client.send(JSON.stringify(playersScore));
                    break
                case 'initField':
                    console.log('initialInfo:', data);
                    leftPaddle.y = data.fieldHeight / 2 - paddleHeight / 2;
                    rightPaddle.x = data.fieldWidth - grid * 3;
                    rightPaddle.y = data.fieldHeight / 2 - paddleHeight / 2;
                    maxPaddleY = data.fieldHeight - grid - paddleHeight;
                    ball.x = data.fieldWidth / 2;
                    ball.y = data.fieldHeight / 2;
                    fieldWidth = data.fieldWidth;
                    fieldHeight = data.fieldHeight;
                    let initData = {};
                    initData['leftPaddle'] = leftPaddle;
                    initData['rightPaddle'] = rightPaddle;
                    initData['ball'] = ball;
                    initData['maxPaddleY'] = maxPaddleY;
                    initData['method'] = 'initFieldEnd';
                    console.log('initData:', initData);
                    client.send(JSON.stringify(initData));
                    break
                case 'updateField':
                    console.log(data)

                    if(data.leftPaddle === -1) {
                        leftPaddle.dy = -paddleSpeed;
                    } else if(data.leftPaddle === 1) {
                        leftPaddle.dy = paddleSpeed;
                    }
                    if(data.rightPaddle === -1) {
                        rightPaddle.dy = -paddleSpeed;
                    } else if(data.rightPaddle === 1) {
                        rightPaddle.dy = paddleSpeed;
                    }

                    if(data.leftPaddle === 2) {
                        leftPaddle.dy = 0;
                    }
                    if(data.rightPaddle === 2) {
                        rightPaddle.dy = 0;
                    }

                    leftPaddle.y += leftPaddle.dy;
                    rightPaddle.y += rightPaddle.dy;
                    // Если левая платформа пытается вылезти за игровое поле вниз,
                    if (leftPaddle.y < grid) {
                        // то оставляем её на месте
                        leftPaddle.y = grid;
                    }
                    // Проверяем то же самое сверху
                    else if (leftPaddle.y > maxPaddleY) {
                        leftPaddle.y = maxPaddleY;
                    }
                    // Если правая платформа пытается вылезти за игровое поле вниз,
                    if (rightPaddle.y < grid) {
                        // то оставляем её на месте
                        rightPaddle.y = grid;
                    }
                    // Проверяем то же самое сверху
                    else if (rightPaddle.y > maxPaddleY) {
                        rightPaddle.y = maxPaddleY;
                    }

                    // Если мяч на предыдущем шаге куда-то двигался — пусть продолжает двигаться
                    ball.x += ball.dx;
                    ball.y += ball.dy;
                    // Если мяч касается стены сверху — меняем направление по оси У на противоположное
                    if (ball.y < grid) {
                        ball.y = grid;
                        ball.dy *= -1;
                    }
                    // Делаем то же самое, если мяч касается стены снизу
                    else if (ball.y + grid > fieldHeight - grid) {
                        ball.y = fieldHeight - grid * 2;
                        ball.dy *= -1;
                    }
                    /*sendPositionToServer(null, null, ball)*/
                    if ((ball.x < 0 || ball.x > fieldWidth) && !ball.resetting) {
                        // Помечаем, что мяч перезапущен, чтобы не зациклиться
                        ball.resetting = true;
                        // Даём 1.5 секунды на подготовку игрокам
                        setTimeout(() => {
                            // Всё, мяч в игре
                            ball.resetting = false;
                            // Снова запускаем его из центра
                            ball.dy *= arr[Math.floor(Math.random() * 1.5)];
                            if (ball.x < 0) {
                                ScoreR += 1;
                            } else {
                                ScoreL += 1;
                            }
                            ball.x = fieldWidth / 2;
                            ball.y = fieldHeight / 2;
                        }, 1500);
                    }
                    // Если мяч коснулся левой платформы
                    if (collides(ball, leftPaddle)) {
                        // то отправляем его в обратном направлении
                        ball.dx *= -1;
                        // Увеличиваем координаты мяча на ширину платформы, чтобы не засчитался новый отскок
                        ball.x = leftPaddle.x + leftPaddle.width;
                    }
                    // Проверяем и делаем то же самое для левой платформы
                    else if (collides(ball, rightPaddle)) {
                        ball.dx *= -1;
                        ball.x = rightPaddle.x - ball.width;
                    }

                    let updateData = {};
                    let leftP = {}, rightP = {};

                    /*for (let attr of ['x', 'y', 'dy']) {
                        leftP[attr] = leftPaddle[attr];
                        rightP[attr] = rightPaddle[attr];
                    }*/
                    updateData['leftPaddle'] = leftPaddle;
                    updateData['rightPaddle'] = rightPaddle;
                    updateData['ball'] = ball;
                    updateData['rightScore'] = ScoreR;
                    updateData['leftScore'] = ScoreL;
                    updateData['method'] = 'updateField';
                    /*console.log('updateInfo:', updateData);*/
                    client.send(JSON.stringify(updateData));
                    break
            }
        }
    }
}

const start = async() => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, function() {console.log(`Server start on Port: ${PORT}`);});
    } catch(error) {
        console.log(error);
    }
};

start();
