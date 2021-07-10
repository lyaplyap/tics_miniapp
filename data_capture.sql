
/* ИНСТРУКЦИЯ ПО СБОРУ ДАННЫХ ИЗ БД */

/*
	Алгоритм:
	
	1. В MySQL Workbench выполняется запрос следующего вида
	
		USE < database name >;
		CREATE TABLE temp_data_delete_after
		< один из запросов ниже >
	
	2. Новая (временная) таблица экспортируется с помощью "Table Data Export Wizard".
	
	3. Использованная (временная) таблица удаляется
	
		DROP TABLE temp_data_delete_after;	

*/


/* ВОЗМОЖНЫЕ SQL-ЗАПРОСЫ */

/* Для вопросов с режимом single */

-- 1. Получение всех данных
-- (результатов всех прохождений для всех пользователей по всем тестам)
SELECT * FROM Result;

/*
	В случае необходимости можно добавить
	WHERE с требуемыми условиями.
	Например, данные по всем тестированиям
	конкретного пользователя или данные по
	конкретному тесту.
*/

-- 2. Получение результатов последних прохождений для всех пользователей по всем тестам
SELECT N.Result_ID, N.VK_ID, N.Test_ID, N.Factor, N.Value, N.Reply_Date 
FROM (SELECT R.Result_ID, R.VK_ID, R.Test_ID, R.Factor, R.Value, R.Reply_Date, I.Exist 
	FROM Result AS R
		LEFT JOIN (SELECT 0 AS Exist, R.VK_ID, R.Test_ID, MAX(R.Reply_Date) AS Reply_Date 
			FROM Result AS R GROUP BY R.VK_ID, R.Test_ID) AS I ON
				R.VK_ID = I.VK_ID AND R.Test_ID = I.Test_ID AND R.Reply_Date = I.Reply_Date) AS N
	WHERE N.Exist IS NOT NULL;	

/*
	В случае необходимости можно добавить
	в WHERE дополнительно требуемые условия.
	Например, данные по всем последним тестированиям
	конкретного пользователя или последние результаты
	пользователей по конкретному тесту.
*/


/* Для вопросов с режимом multiple */

-- 1. Получение всех ответов
-- (ответов со статусом 1 по всем прохождениям всех тестов каждого пользователя)
SELECT * FROM Person_MultiAnswer
	WHERE Status = 1;
	
/*
	В случае необходимости можно добавить
	в WHERE дополнительно требуемые условия.
	Например, все ответы конкретного пользователя 
	по всем его прохождениям, или все ответы 
	пользователей по конкретному тесту.
*/

-- 2. Получение ответов последних прохождений для всех пользователей по всем тестам
SELECT N.Person_MultiAnswer_ID, N.VK_ID, N.Answer, N.Reply_Date, N.Status, N.Question_ID FROM
(SELECT PMA.Person_MultiAnswer_ID, PMA.VK_ID, PMA.Answer, PMA.Reply_Date, PMA.Status, PMA.Question_ID, I.Exist
FROM Person_MultiAnswer AS PMA
LEFT JOIN
	(SELECT 0 AS Exist, PMA.VK_ID, MAX(PMA.Reply_Date) AS Reply_Date, PMA.Question_ID 
	FROM Person_MultiAnswer AS PMA
		WHERE Status = 1
			GROUP BY PMA.VK_ID, PMA.Question_ID) AS I
	ON PMA.VK_ID = I.VK_ID AND PMA.Reply_Date = I.Reply_Date AND PMA.Question_ID = I.Question_ID
	WHERE PMA.Status = 1) AS N
		WHERE N.Exist IS NOT NULL;
		
/*
	В случае необходимости можно добавить
	в WHERE дополнительно требуемые условия.
	Например, все ответы конкретного пользователя 
	по всем его прохождениям, или все ответы 
	пользователей по конкретному тесту.
*/
