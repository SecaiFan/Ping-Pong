let button = document.getElementById('sendButton');
let rightScore = document.getElementById('right');
let leftScore = document.getElementById('left');
let leftScoreD = 0, rightScoreD = 0;
let canvas,
    ball = {}, rightPaddle = {},
    leftPaddle = {}, ctx,
    maxPaddleY, paddleSpeed = 7, ballSpeed = 5;
const grid = 15;
const paddleHeight = grid * 5;

/*---------------------SOCKET_SECTION---------------------*/
let sessionId = +window.location.href.split('/').at(-1);

console.log(`Now your session:${sessionId}`);
let socket = new WebSocket(`ws://localhost:5005/`);

userDataL = {
    id: 1,
    nickName: 'Kirill',
    maxScore: 0,
}

userDataR = {
    id: 2,
    nickName: 'Ilya',
    maxScore: 0,
}

socket.onopen = () => {
    console.log('Соединение открыто');
    let data = {};
    data['id'] = sessionId;
    data['playerL'] = userDataL;
    data['playerR'] = userDataR;
    data['method'] = 'connected';
    socket.send(JSON.stringify(data));
}

socket.onmessage = (frame) => {
    let getData = JSON.parse(frame.data);
    switch (getData.method) {
        case 'setConnectionEnd':
            userDataL.maxScore = getData.ScoreL;
            userDataR.maxScore = getData.ScoreR;
            /*console.log('Message from server: ', getData);*/
            break
        case 'initFieldEnd':
            /*console.log('Message field init: ', getData);*/
            leftPaddle['y'] = getData.leftPaddle.y;
            leftPaddle['x'] = getData.leftPaddle.x;
            leftPaddle['width'] =  getData.leftPaddle.width;
            leftPaddle['height'] =  getData.leftPaddle.height;
            leftPaddle['dy'] =  getData.leftPaddle.dy;


            rightPaddle['y'] = getData.rightPaddle.y;
            rightPaddle['x'] = getData.rightPaddle.x;
            rightPaddle['height'] =  getData.rightPaddle.height;
            rightPaddle['width'] =  getData.rightPaddle.width;
            rightPaddle['dy'] = getData.rightPaddle.dy;

            maxPaddleY = getData.maxPaddleY;

            ball['x'] = getData.ball.x;
            ball['y'] = getData.ball.y;
            ball['width'] = getData.ball.width;
            ball['height'] = getData.ball.height;
            ball['resetting'] = getData.ball.resetting;
            ball['dx'] = getData.ball.dx;
            ball['dy'] = getData.ball.dy;
            break
        case 'updateField':
            leftPaddle.x = getData.leftPaddle.x;
            leftPaddle.y = getData.leftPaddle.y;
            leftPaddle.dy = getData.leftPaddle.dy;

            rightPaddle.x = getData.rightPaddle.x;
            rightPaddle.y = getData.rightPaddle.y;
            rightPaddle.dy = getData.rightPaddle.dy;
            maxPaddleY = getData.maxPaddleY;

            ball.x = getData.ball.x;
            ball.y = getData.ball.y;
            ball.resetting = getData.ball.resetting;
            ball.dy = getData.ball.dy;
            ball.dx = getData.ball.dx;

            leftScoreD = getData.leftScore;
            rightScoreD = getData.rightScore;
            /*console.log(rightPaddle, leftPaddle);*/
            break
    }
}
socket.onclose = function(event) {
    if (event.wasClean) {
        console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
        console.log('[close] Соединение прервано', event.reason);
    }
};

socket.onerror = function(error) {
    console.log(`[error]`, error);
};

/*---------------------SOCKET_SECTION---------------------*/
function gameInit(fieldWidth, fieldHeight, gridInf) {
    let initData = {};
    initData['id'] = sessionId;
    initData['fieldWidth'] = fieldWidth;
    initData['fieldHeight'] = fieldHeight;
    initData['grid'] = gridInf;
    initData['method'] = 'initField';
    socket.send(JSON.stringify(initData))
}
function sendPositionToServer(lftPadData, rgtPadData, ballData, keyl, keyr) {
    let curPosition = {};
    curPosition['id'] = sessionId;
    curPosition['method'] = 'updateField';
    if(keyl || keyr) {
        curPosition['leftPaddle'] = keyl;
        curPosition['rightPaddle'] = keyr;
        socket.send(JSON.stringify(curPosition))
    } else {
        socket.send(JSON.stringify(curPosition))
    }

}

const arr = [1, -1];
let req;
window.onload = () => {
    rightScore.innerText = String(leftScoreD);
    leftScore.innerText = String(rightScoreD);
    canvas = document.createElement('canvas');
    canvas.width = (document.documentElement.clientWidth*3)/4;
    canvas.height = (document.documentElement.clientHeight*3)/4;
    canvas.id = 'gameField';
    if(canvas.getContext) ctx = canvas.getContext('2d');

    gameInit(canvas.width, canvas.height, grid)

    ctx.fillStyle = `rgb(57, 98, 29)`;
    ctx.fillRect (0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgb(154,154,154)';
    ctx.strokeRect (0, 0, canvas.width, canvas.height);
    document.body.appendChild(canvas);
    requestAnimationFrame(loop);
}
let end, begin;
function loop(canvas, ctx) {
    // Очищаем игровое поле
    canvas = document.getElementById('gameField');
    ctx = ctx || canvas.getContext('2d');

    if ((rightScoreD < 10 && leftScoreD < 10) || (!rightScoreD && !leftScoreD)) {
        req = requestAnimationFrame(loop);
    } else {
        console.log('End of Game');
        let message = document.getElementById('EndMessage');
        let h1 = document.createElement('h1')
        message.style.color = 'red';
        if (rightScoreD === 10) h1.innerText = 'Right Win!'
        if (leftScoreD === 10) h1.innerText = 'Left Win!'
        message.appendChild(h1);
    }
    /*if(socket.bufferedAmount === 0) {*/
    let keyr = 0, keyl = 0, opt;
    document.addEventListener('keydown', function (e) {
        // Если нажата клавиша вверх,
        if (e.which === 38) {
            // то двигаем правую платформу вверх
            keyr = -1;

        }
        // Если нажата клавиша вниз,
        else if (e.which === 40) {
            // то двигаем правую платформу вниз
            keyr = 1;

        }
        // Если нажата клавиша W,
        if (e.which === 87) {
            // то двигаем левую платформу вверх
            keyl = -1;

        }
        // Если нажата клавиша S,
        else if (e.which === 83) {
            // то двигаем левую платформу вниз
            keyl = 1;

        }
        if(socket.bufferedAmount < 50) sendPositionToServer(leftPaddle, rightPaddle, ball, keyl, keyr, opt);
    });
    // А теперь следим за тем, когда кто-то отпустит клавишу, чтобы остановить движение платформы
    document.addEventListener('keyup', function (e) {
        // Если это стрелка вверх или вниз,
        if (e.which === 38 || e.which === 40) {
            // останавливаем правую платформу
            keyr  = 2;
        }
        // А если это W или S,
        if (e.which === 83 || e.which === 87) {
            // останавливаем левую платформу
            keyl = 2;
        }
        if(socket.bufferedAmount < 100) sendPositionToServer(leftPaddle, rightPaddle, ball, keyl, keyr, opt);
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let t;

    sendPositionToServer(leftPaddle, rightPaddle, ball);

    ctx.fillStyle = `rgb(57, 98, 29)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Рисуем платформы белым цветом
    ctx.fillStyle = 'rgb(154,154,154)';
    // Каждая платформа — прямоугольник
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);

    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
    console.log(leftPaddle,rightPaddle);
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);

    // Рисуем стены
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, canvas.width, grid);
    ctx.fillRect(0, canvas.height - grid, canvas.width, canvas.height);

    // Рисуем сетку посередине
    for (let i = grid; i < canvas.height - grid; i += grid * 2) {
        ctx.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
    }
    rightScore.innerText = String(rightScoreD);
    leftScore.innerText = String(leftScoreD);
}

window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

cancelAnimationFrame(req);

