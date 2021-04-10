const fs = require('fs');
const express = require('express');
const path = require('path');
const port = process.env.PORT || 8080;
const mysql = require('mysql2');
const enforce = require('express-sslify');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
 
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


// Отправка списка тестов на фронтенд
app.get("/test-list", function(request, response){
    
    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    const sql_zero = `SELECT * FROM Test;`;
       
    connection.query(sql_zero, function(error, results) {
        if (error)
            console.log(error);
        else {
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
});

// Отправка количества вопросов (общее и отвеченных) на фронтенд
app.get("/test-percent/:user_id", function(request, response){
    
    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    const sql_zero = `SELECT COUNT(Question_ID) as Question_Count, Test_ID, SUM(CountNotNull) as Question_Done_Count 
                        FROM (SELECT a.Question_ID, q.Test_ID, COUNT(pa.VK_ID) as CountNotNull
                                FROM answer as a 
                                INNER JOIN question as q ON a.question_id = q.question_id
                                LEFT JOIN (SELECT * FROM person_answer WHERE vk_id = ${request.params.user_id}) as pa ON pa.answer_id = a.answer_id
                                GROUP BY q.Question_ID) as NewT
                                    GROUP BY Test_ID;`;
       
    connection.query(sql_zero, function(error, results) {
        if (error)
            console.log(error);
        else {
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
});

// Отправка коллекции вопросов и ответов на фронтенд
app.get("/test-information/:test_id/:user_id", function(request, response){
    
    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    const sql_zero = `SELECT a.Answer_ID, a.Question_ID, a.description as Answer_Description, 
                             a.Value, q.Test_ID, q.Description as Question_Description, 
                             q.Category, pa.VK_ID as isDone
                            FROM answer as a 
                                INNER JOIN question as q ON a.question_id = q.question_id
                                LEFT JOIN (SELECT * FROM person_answer WHERE vk_id = ${request.params.user_id}) as pa ON pa.answer_id = a.answer_id
                                    WHERE q.test_id = ${request.params.test_id};`;
       
    connection.query(sql_zero, function(error, results) {
        if (error)
            console.log(error);
        else {
            
            // Обработка полученной коллекции объектов из таблицы Answer JOIN Question JOIN Person_Answer
            let data = [];
            for (let i = 0; i < results.length; i++) {
                let is_exist = 0;
                for (let j = 0; j < data.length; j++) {
                    if (results[i].Question_ID === data[j].Question_ID) {
                        data[j].Answers.push({
                            Answer_ID: results[i].Answer_ID,
                            Description: results[i].Answer_Description,
                            Value: results[i].Value
                        });
                        data[j].isDone = (results[i].isDone !== null) ? 1 : data[j].isDone;
                        is_exist = 1;
                    }
                }
                if (is_exist === 0) {
                    data.push({
                        Question_ID: results[i].Question_ID,
                        Test_ID: results[i].Test_ID,
                        Question_Description: results[i].Question_Description,
                        Category: results[i].Category,
                        Answers: [{
                            Answer_ID: results[i].Answer_ID,
                            Description: results[i].Answer_Description,
                            Value: results[i].Value
                        }],
                        isDone : (results[i].isDone !== null) ? 1 : 0
                    });
                }
            }
            
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({ results: data }));
        }
    });

    connection.end(function(error) {
        if (error) {
            return console.log("Ошибка: " + error.message);
        }
        console.log("Подключение закрыто");
    });
});


//обслуживание html
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


// Получение пользовательского ответа на вопрос из теста
app.post("/person-answer", jsonParser, function (request, response) {
    console.log(request.body);
    if (!request.body) { 
        return response.sendStatus(400);
    }

    var person_answer = request.body["person_answer"];
    var vk_id = request.body["id"]; 

    var date = new Date();
    var datetime = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    // Добавляем ответ пользователя в БД
    const sql_add = "INSERT INTO person_answer(VK_ID, Answer_ID, Reply_Date) VALUES (?, ?, ?);";
    const person_data = [vk_id, person_answer, datetime]
    console.log(person_data)
    connection.query(sql_add, person_data, function(error, results) {
        if (error) {
            console.log(error);
        }
        //console.log(results);
    });

    // Закрытие подключения
    connection.end(function(error) {
        if (error) {
            return console.log("Ошибка: " + error.message);
        }
        console.log("Подключение закрыто");
    });

    response.end('It worked!');
});

// Получение постов пользователя
app.post("/person-post", jsonParser, function (request, response) {
    console.log(request.body);
    if (!request.body) { 
        return response.sendStatus(400);
    }

    const connection = mysql.createConnection({
        host: "",
        user: "",
        database: "",
        password: ""
    });

    // Добавляем посты пользователя в БД
    if (request.body.collection.error_data != undefined){
        const sql_add = "INSERT INTO Post(Error, VK_ID) VALUES (?, ?);";
        const post_data = [request.body.collection.error_data.error_reason.error_msg, request.body.id] // ?
        connection.query(sql_add, post_data, function(error, results) {
            if (error) {
                console.log(error);
            }
            //console.log(results);
        });
    }
    else {
        for (let i = 0; i < request.body.collection.items.length; i++) {
            let date = request.body.collection.items[i].date;
            let datetime = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            
            let sql_add = "INSERT INTO Post(Post_VK_ID, VK_ID, Description, Likes, Reposts, Comments, Reply_Date";
            let post_data = [request.body.collection.items[i].id, request.body.id, 
                             request.body.collection.items[i].text,
                             request.body.collection.items[i].likes.count,
                             request.body.collection.items[i].reposts.count,
                             request.body.collection.items[i].comments.count,
                             datetime];
            if (request.body.collection.items[i].views != undefined) {
                sql_add = sql_add + ", Views";
                post_data.push(request.body.collection.items[i].views.count);
            }
            if (request.body.collection.items[i].attachments != undefined) {
                sql_add = sql_add + ", Attachments_Type";
                post_data.push(request.body.collection.items[i].attachments[0].type);
            }
            sql_add = sql_add + ") VALUES (?"
            for (let i = 1; i < post_data.length; i++) {
                sql_add = sql_add + ", ?";
            }
            sql_add = sql_add + ");";

            connection.query(sql_add, post_data, function(error, results) {
                if (error) {
                    console.log(error);
                }
                //console.log(results);
            });
        }
    }

    // Закрытие подключения
    connection.end(function(error) {
        if (error) {
            return console.log("Ошибка: " + error.message);
        }
        console.log("Подключение закрыто");
    });

    response.end('It worked!');
});

app.listen(port);