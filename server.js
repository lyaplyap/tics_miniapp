const fs = require('fs');
const express = require('express');
const path = require('path');
const port = process.env.PORT || 8080;
const mysql = require('mysql2');
const enforce = require('express-sslify');
 
const app = express();
app.use(enforce.HTTPS({ trustProtoHeader: true }));

const jsonParser = express.json();

//здесь наше приложение отдаёт статику
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build')));
 
//простой тест сервера
app.get('/ping', function (req, res) {
    return res.send('pong');
});


// Отправка списка вопросов на фронтенд
app.get("/question", function(request, response){
    
    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    const sql_zero = `SELECT * FROM Question;`;
       
    connection.query(sql_zero, function(error, results) {
        if (error)
            console.log(error);
        else {
            //console.log(results);
            
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({ results: results }));
        }
    });

    connection.end(function(error) {
        if (error) {
            return console.log("Ошибка: " + error.message);
        }
        console.log("Подключение закрыто");
    });

    //response.setHeader('Content-Type', 'application/json');
    //response.send(JSON.stringify(obj));
});

// Отправка списка вопросов на фронтенд
app.get("/answer", function(request, response){
    
    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    const sql_zero = `SELECT * FROM Answer;`;
       
    connection.query(sql_zero, function(error, results) {
        if (error)
            console.log(error);
        else {
            //console.log(results);
            
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({ results: results }));
        }
    });

    connection.end(function(error) {
        if (error) {
            return console.log("Ошибка: " + error.message);
        }
        console.log("Подключение закрыто");
    });

    //response.setHeader('Content-Type', 'application/json');
    //response.send(JSON.stringify(obj));
});


//обслуживание html
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

//получение данных теста на "Психологическую защиту"
app.post("/user", jsonParser, function (request, response) {
    console.log(request.body);
    if(!request.body) return response.sendStatus(400);

    var data = request.body["flagtest"];
    console.log(data);

    var id = request.body["id"];
    console.log(id);

    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    const sql_zero = `create table if not exists defensetest(
        id int primary key auto_increment,
        def1 int not null,
        def2 int not null,
        def3 int not null,
        def4 int not null,
        def5 int not null,
        def6 int not null,
        def7 int not null,
        def8 int not null,
        def9 int not null,
        vkid long not null
      )`;
       
    connection.query(sql_zero, function(err, results) {
        if(err) console.log(err);
        else console.log("Таблица создана");
    });

    const sql = `INSERT INTO defensetest(def1, def2, def3, def4, def5, def6, def7, def8, def9, vkid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const users = [request.body["flagtest"][0], request.body["flagtest"][1], request.body["flagtest"][2], request.body["flagtest"][3],
                   request.body["flagtest"][4], request.body["flagtest"][5], request.body["flagtest"][6], request.body["flagtest"][7],
                   request.body["flagtest"][8], request.body["id"]];
    
    connection.query(sql, users, function(err, results) {
        if(err) console.log(err);
        console.log(results);
    });

    // тестирование подключения
    connection.connect(function(err){
        if (err) {
            return console.error("Ошибка: " + err.message);
        }
        else {
            console.log("Подключение к серверу MySQL успешно установлено");
        }
    });
    // закрытие подключения
    connection.end(function(err) {
        if (err) {
            return console.log("Ошибка: " + err.message);
        }
        console.log("Подключение закрыто");
    });

});

app.listen(port);