import { Panel, PanelHeader, Group, Cell, PanelHeaderBack, Button, FixedLayout, ActionSheet } from '@vkontakte/vkui';
import { ScreenSpinner, CellButton, Alert, Div, Separator } from '@vkontakte/vkui';
import { Banner, SimpleCell, Header, InfoRow, Progress, PanelHeaderContent } from '@vkontakte/vkui';
import { ModalRoot, ModalPage, ModalPageHeader, ModalRootContext, ModalCard, PanelHeaderClose, PanelHeaderSubmit } from '@vkontakte/vkui';
import { Checkbox } from '@vkontakte/vkui';

import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import View from '@vkontakte/vkui/dist/components/View/View';

import '@vkontakte/vkui/dist/vkui.css';


class App extends React.Component {
	constructor(props) {
	  super(props);
  
	  this.state = {
		
		// Пользовательские параметры
		user_id: 1, 		// VK ID пользователя
		user_token: '',		// VK Token пользователя

		// Информация о тесте/тестах
		testList: [],			// Список всех доступных тестов
		testInformation: [],	// Информация о выбранном тесте
		testResult: [],			// Результаты последнего прохождения выбранного теста
		testInstruction: [],	// Инструкция к выбранному тесту
		currentTestLable: '',	// Название текущего теста

		// Дополнительные параметры
		post_exists: '',	// Есть ли информация о постах пользователя в таблице Post ('yes'/'no')

		// Функциональные параметры 
		activePanel: 'panel0',	// Активная панель
		popout: null,			// Активный popout-элемент
		activeModal: null,		// Активная модальная страница
		countquest: 0,			// Номер текущего вопроса

		// Тестим чекбоксы
		selectedAnswers: [],	// Выбранные ответы (массив чекбоксов/друзей)

		// FIXES: Вероятно, удаляем
		userChoice: [],
		testQuestion: [],
		testAnswer: [],
		snackbar: null,
		selectedOption: '',
		actionsLog: [],
		countbar: 0
	}

	  // Функции, что-то получающие с помощью VK Bridge
	  this.getUserId = this.getUserId.bind(this); 			// Получение идентификатора текущего пользователя (user_id)
	  this.getUserToken = this.getUserToken.bind(this); 	// Запрос на получение токена пользователя (user_token)
	  
	  // Функции, что-то получающиe с помощью GET-запроса с сервера
	  this.getTestList = this.getTestList.bind(this); 				// Получение коллекции всех тестов
	  this.getDonePercent = this.getDonePercent.bind(this); 		// Получение процентов отвеченных вопросов
	  this.getInformation = this.getInformation.bind(this); 		// Получение коллекции с информацией о выбранном тесте
	  this.getMultiAnswers = this.getMultiAnswers.bind(this);		// Получение информации о предыдущих ответах в мульти-тесте
	  this.getTestResult = this.getTestResult.bind(this); 			// Получение итоговых результатов по выбранному тесту
	  this.getTestInstruction = this.getTestInstruction.bind(this); // Получение инструкции к выбранному тесту

	  // Функции, что-то отправляющие с помощью POST-запроса на сервер
	  this.postPersonAnswer = this.postPersonAnswer.bind(this); // Отправка ответа пользователя на текущий вопрос на сервер
	  this.postUserPost = this.postUserPost.bind(this); 		// Отправка на сервер всех постов со страницы пользователя или ошибки

	  // Функции-обработчики
	  this.sayServerDoResult = this.sayServerDoResult.bind(this);	// Отправка на сервер сигнала для формирования в БД результатов тестирования (Person_Answer -> Result)
	  this.sayServerUpdatePA = this.sayServerUpdatePA.bind(this); 	// Отправка на сервер сигнала о смене статуса ответов пользователя на "обработанные" в Person_Answer
	  this.sayServerUpdatePMA = this.sayServerUpdatePMA.bind(this);	// Отправка на сервер сигнала о смене статуса ответов пользователя на "итоговые" в Person_MultiAnswer 
	  this.checkPostExists = this.checkPostExists.bind(this); 	  	// Проверка на присутствие постов пользователя в таблице Post

	  // Функции клиента
	  // (логика теста) 
	  this.nextQuestion = this.nextQuestion.bind(this);			// Переход к следующему вопросу теста или к результатам
	  this.testActive = this.testActive.bind(this);				// Начало/продолжение тестирования из меню теста
	  this.toNecessaryPanel = this.toNecessaryPanel.bind(this); // Переход в меню выбранного теста
	  this.testAccess = this.testAccess.bind(this);				// Присвоение countquest номера первого неотвеченного вопроса
	  // (доп. элементы)
	  this.testExit = this.testExit.bind(this);								  // Вызов popout-элемента для выхода в меню теста
	  this.closePopout = this.closePopout.bind(this);						  // Закрытие popout-элемента
	  this.showFactorClarification = this.showFactorClarification.bind(this); // Вызов popout-элемента с описанием выбранного фактора
	  this.setActiveModal = this.setActiveModal.bind(this); 				  // Открытие/закрытие модального окна с инструкцией

	  // Тестируем чекбоксы
	  this.nextCheckbox = this.nextCheckbox.bind(this);
	  this.backCheckbox = this.backCheckbox.bind(this);
	  this.chooseBox = this.chooseBox.bind(this);
	}

	// Инициализация клиента

	componentDidMount () {
		//console.log("componentDidMount()");
		this.getUserId();
		this.getUserToken();
		this.getTestList();
		this.checkPostExists();
	}


	// Функции, что-то получающие с помощью VK Bridge

	getUserId () {
		bridge
  			.send("VKWebAppGetUserInfo")
  			.then(data => {
				this.setState({user_id: data.id});
  			})
  			.catch(error => {
    			// Обработка события в случае ошибки
  			});
	}

	getUserToken () {
		bridge
			.send("VKWebAppGetAuthToken", {"app_id": 0 /* FIXES: INPUT APP ID */, "scope": "wall"})
			.then(data => {
				//console.log(data);
				this.setState({ user_token: data.access_token });
			})
			.catch(error => {
				//console.log(error);
				return error;
			});
	}


	// Функции, что-то получающиe с помощью GET-запроса с сервера

	getTestList () {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'test-list', true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				//console.log(xhr.response.results); // response -- это ответ сервера
				
				let inf_length = 0;
			  	for (let i = 0; i < xhr.response.results.length; i++) {
					this.state.testList[inf_length] =  xhr.response.results[i];
					inf_length++;
					//this.setState({});
			  	}
			  	this.setState({});
				
				// Узнаём проценты отвеченных вопросов
				this.getDonePercent();
			}
		};

		//console.log(this.state.testList);
	}

	getDonePercent () {
		let xhr = new XMLHttpRequest();

		// Блокировка интерфейса до подгрузки данных с сервера
		/* 
		xhr.addEventListener('readystatechange', () => {
			
			if (xhr.readyState !== 4) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.setState({ popout: <ScreenSpinner /> });
    			//setTimeout(() => { this.setState({ popout: null }) }, 15000);
			}
			if ((xhr.readyState == 4) && (xhr.status == 200)) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.closePopout();
			}
		});
		*/

		xhr.open('GET', `test-percent?user_id=${this.state.user_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else {
				for (let i = 0; i < this.state.testList.length; i++) {
					for (let j = 0; j < xhr.response.results.length; j++) {
						if (this.state.testList[i].Test_ID === xhr.response.results[j].Test_ID) {
							this.state.testList[i].Question_Count = xhr.response.results[j].Question_Count;
							this.state.testList[i].Question_Done_Count = Number(xhr.response.results[j].Question_Done_Count);
							this.setState({});
						}
					}
					//this.setState({});
				}
			}
		};

		console.log(this.state.testList);
	}

	getInformation (test_id) {
		if (this.state.testInformation.length !== 0) {
			this.state.testInformation = [];
			this.setState({});
		}

		let xhr = new XMLHttpRequest();

		xhr.addEventListener('readystatechange', () => {
			
			if (xhr.readyState !== 4) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.setState({ popout: <ScreenSpinner /> });
    			//setTimeout(() => { this.setState({ popout: null }) }, 15000);
			}
			if ((xhr.readyState == 4) && (xhr.status == 200)) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.closePopout();
			}
		});

		xhr.open('GET', `test-information/${test_id}?user_id=${this.state.user_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				//console.log(xhr.response.results); // response -- это ответ сервера
				
				let inf_length = 0;
			  	for (let i = 0; i < xhr.response.results.length; i++) {
					this.state.testInformation[inf_length] =  xhr.response.results[i];
					inf_length++;
					//this.setState({});
			  	}
				this.setState({});
				
				if (this.state.testList[(test_id - 1)/10].Mode == 'multiple') {
					this.getMultiAnswers(test_id);
				}
			}
		};

		console.log(this.state.testInformation);
	}

	getMultiAnswers (test_id) {
		
		let xhr = new XMLHttpRequest();

		xhr.addEventListener('readystatechange', () => {
			
			if (xhr.readyState !== 4) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.setState({ popout: <ScreenSpinner /> });
    			//setTimeout(() => { this.setState({ popout: null }) }, 15000);
			}
			if ((xhr.readyState == 4) && (xhr.status == 200)) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.closePopout();
			}
		});

		xhr.open('GET', `multi-answers/${test_id}?user_id=${this.state.user_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				console.log(xhr.response.results); // response -- это ответ сервера
				let results = xhr.response.results;

				for (let i = 0; i < this.state.testInformation.length; i++) {
					let isIncludes = results.findIndex(item => item.Question_ID == this.state.testInformation[i].Question_ID);
					
					if (isIncludes == -1) {
						this.state.testInformation[i].Prev_Answers = [];
					}
					else {
						this.state.testInformation[i].isDone = 1;
						this.state.testInformation[i].Prev_Answers = results[isIncludes].Prev_Answers;
					}
				}
				this.setState({});

				console.log(this.state.testInformation);
			}
		};

	}

	getTestResult (test_id) {

		// Получение результатов тестирования (get-result/:test_id?user_id=...)
		if (this.state.testResult.length !== 0) {
			this.state.testResult = [];
			this.setState({});
		}

		let xhr = new XMLHttpRequest();

		xhr.addEventListener('readystatechange', () => {
			
			if (xhr.readyState !== 4) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.setState({ popout: <ScreenSpinner /> });
    			//setTimeout(() => { this.setState({ popout: null }) }, 15000);
			}
			if ((xhr.readyState == 4) && (xhr.status == 200)) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.closePopout();
			}
		});

		xhr.open('GET', `get-processed-result/${test_id}?user_id=${this.state.user_id}&mode=${this.state.testList[(test_id - 1)/10].Mode}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				//console.log(xhr.response.results); // response -- это ответ сервера
				
				let inf_length = 0;
			  	for (let i = 0; i < xhr.response.results.length; i++) {
					this.state.testResult[inf_length] =  xhr.response.results[i];
					inf_length++;
					this.setState({});
			  	}
			  	//this.setState({});
			}
		};

		console.log(this.state.testResult);
	}

	getTestInstruction (test_id) {

		// Получение результатов тестирования (get-instruction/:test_id)
		if (this.state.testInstruction.length !== 0) {
			this.state.testInstruction = [];
			this.setState({});
		}

		let xhr = new XMLHttpRequest();
		xhr.open('GET', `get-instruction/${test_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				//console.log(xhr.response.results); // response -- это ответ сервера
				
				let inf_length = 0;
			  	for (let i = 0; i < xhr.response.results.length; i++) {
					this.state.testInstruction[inf_length] =  xhr.response.results[i];
					inf_length++;
					this.setState({});
			  	}
			  	//this.setState({});
			}
		};

		console.log(this.state.testInstruction);
	}
	
	
	// Функции, что-то отправляющие с помощью POST-запроса на сервер

	postPersonAnswer (index) {
		let data = JSON.stringify({});
		if (this.state.testInformation[this.state.countquest].Type == 'button') {
			data = JSON.stringify({
										person_answer: this.state.testInformation[this.state.countquest].Answers[index].Answer_ID, 
										id: this.state.user_id,
										question_type: this.state.testInformation[this.state.countquest].Type
									});
		}
		else if (this.state.testInformation[this.state.countquest].Type == 'checkbox') {
			data = JSON.stringify({
										person_answers: this.state.selectedAnswers,
										id: this.state.user_id,
										question_type: this.state.testInformation[this.state.countquest].Type,
										question_id: this.state.testInformation[this.state.countquest].Question_ID
									});
		}

        let xhr = new XMLHttpRequest();

		xhr.addEventListener('readystatechange', () => {
			
			if (xhr.readyState !== 4) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.setState({ popout: <ScreenSpinner /> });
    			//setTimeout(() => { this.setState({ popout: null }) }, 15000);
			}
			if ((xhr.readyState == 4) && (xhr.status == 200)) {
				//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
				this.closePopout();
			}
		});

		// Посылаем запрос с данными на адрес "/person-answer"
        xhr.open("POST", "/person-answer", true);

        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data);
	}

	postUserPost () {
		
		if (this.state.post_exists == 'no') {
			
			//console.log(this.state.post_exists);
			
			bridge
				.send("VKWebAppCallAPIMethod", 
						{
							"method": "wall.get", 
							"request_id": "test-row", 
							"params": {
										"owner_id": this.state.user_id,
										"filter": "owner",
										"count": 100, 
										"v":"5.84", 
										"access_token": this.state.user_token != '' ? this.state.user_token : '' /* FIXME: INPUT APP SERVICE KEY */
									}
						})
				.then(data => {
					//console.log(data);
					console.log('data');
					console.log(data.response.items);
					
					// Отправка данных на сервер
					let temp = JSON.stringify({
						collection: data.response.items, 
						id: this.state.user_id });
					let xhr = new XMLHttpRequest();
			
					/*
					xhr.addEventListener('readystatechange', () => {

					if (xhr.readyState !== 4) {
						//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
						this.setState({ popout: <ScreenSpinner /> });
						//setTimeout(() => { this.setState({ popout: null }) }, 15000);
					}
					if ((xhr.readyState == 4) && (xhr.status == 200)) {
						//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
						this.closePopout();
					}
					});
					*/
			
					// Посылаем запрос с данными на адрес "/person-answer"
					xhr.open("POST", "/person-post", true);

					xhr.setRequestHeader("Content-Type", "application/json");
					xhr.send(temp);
				})
				.catch(error => {
					//console.log(error);
					console.log('error');
					console.log(error.error_data.error_reason);

					// Отправка ошибки на сервер
					let temp = JSON.stringify({
						collection: error.error_data.error_reason, 
						id: this.state.user_id });
					let xhr = new XMLHttpRequest();

					/*
					xhr.addEventListener('readystatechange', () => {

					if (xhr.readyState !== 4) {
						//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
						this.setState({ popout: <ScreenSpinner /> });
						//setTimeout(() => { this.setState({ popout: null }) }, 15000);
					}
					if ((xhr.readyState == 4) && (xhr.status == 200)) {
						//console.log(` Status = ${xhr.status}, State = ${xhr.readyState}`);
						this.closePopout();
					}
					});
					*/

					// Посылаем запрос с данными на адрес "/person-answer"
					xhr.open("POST", "/person-post", true);

					xhr.setRequestHeader("Content-Type", "application/json");
					xhr.send(temp);

				});
		}
		else {
			// Пропуск хода
			//console.log(this.state.post_exists);
			console.log('skip');
		}
	}


	// Функции-обработчики

	sayServerDoResult (test_id) {

		// GET-запрос на /do-result/:test_id?user_id=...
		let xhr = new XMLHttpRequest();
		xhr.open('GET', `do-result/${test_id}?user_id=${this.state.user_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				console.log(xhr.response.state); // response -- это ответ сервера
				
				if (this.state.testList[(test_id - 1)/10].Mode == 'single') {
					this.sayServerUpdatePA(test_id, 1);
				}
				else if (this.state.testList[(test_id - 1)/10].Mode == 'multiple') {
					this.sayServerUpdatePMA(test_id);
				}
			}
		};
	}

	sayServerUpdatePA (test_id, result_id) {

		// GET-запрос на /update-person-answer/:test_id?user_id=...&result_id=...
		let xhr = new XMLHttpRequest();
		xhr.open('GET', `update-person-answer/${test_id}?user_id=${this.state.user_id}&result_id=${result_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				console.log(xhr.response.state); // response -- это ответ сервера
					
				this.getTestResult(test_id);
			}
		};
	}

	sayServerUpdatePMA (test_id) {

		// GET-запрос на /update-person-multianswer/:test_id?user_id=...
		let xhr = new XMLHttpRequest();
		xhr.open('GET', `update-person-multianswer/${test_id}?user_id=${this.state.user_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				console.log(xhr.response.state); // response -- это ответ сервера
				
				this.getTestResult(test_id);
			}
		};
	}

	checkPostExists () {

		let xhr = new XMLHttpRequest();

		xhr.open('GET', `check-post-exists?user_id=${this.state.user_id}`, true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				console.log(`post exists: ${xhr.response.results}`); // response -- это ответ сервера
				this.setState({ post_exists: xhr.response.results });
			}
		};

	}


	// Функции клиента (логика теста)

	nextQuestion (index) {
		// Отправка на сервер ответа пользователя на вопрос
		this.postPersonAnswer(index);
		
		// Обновление количества отвеченных вопросов в текущем тесте
		const abbr = this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10];
		if (abbr.Question_Done_Count == abbr.Question_Count) {
			this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10].Question_Done_Count = 0;
		}
		else {
			this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10].Question_Done_Count++;
		}

		// Записываем в testInformation, что данный вопрос был отвечен
		this.state.testInformation[this.state.countquest].isDone = 1;
		this.setState({});
		
		// Переход к следующему вопросу
		this.state.countquest++;
		if (this.state.countquest >= this.state.testInformation.length) {
			
			this.sayServerDoResult(this.state.testInformation[0].Test_ID);
			
			this.setState({ countquest: 0, activePanel: 'results' });
			this.postUserPost();
			return;
		}
		this.setState({});
	}

	testActive () {
		this.testAccess();
		
		if (this.state.countquest == 0 && this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10].Instruction == '1') {
			this.setActiveModal('modal-instruction');
		}

		// FIXES: Данный блок, вероятно, является излишним
		if (this.state.countquest >= this.state.testInformation.length) {
			this.setState({ countquest: 0, activePanel: 'questions' });
		}
		else {
			this.setState({ activePanel: 'questions' });
		}
	}

	toNecessaryPanel (panel, test_id) {

		// Отображаем название текущего теста
		this.setState({ currentTestLable: this.state.testList[(test_id - 1) / 10].Name });

		// Получаем информацию текущего теста
		this.getInformation(test_id);

		// Получаем инструкцию
		if (this.state.testList[(test_id - 1) / 10].Instruction == '1') {
			this.getTestInstruction(test_id);
		}

		// Получаем предыдущие результаты
		this.getTestResult(test_id);

		// Переходим на требуемую панель
		this.setState({ activePanel: panel });
	}

	testAccess () {
		console.log(`Длина списка вопросов = ${this.state.testInformation.length}`);
		for (let i = 0; i < this.state.testInformation.length; i++) {
			if (this.state.testInformation[i].isDone == 0) {
				this.state.countquest = i;
				this.setState({});
				return;
			}
		}
	}


	// Функции клиента (доп. элементы)

	testExit () {
		this.setState({ popout:
		  <Alert
			actionsLayout="horizontal"
			actions={[{
			  title: 'Выйти',
			  autoclose: true,
			  mode: 'destructive',
			  action: () => this.setState({ activePanel: 'test-mainpage'}),
			}, {
			  title: 'Остаться',
			  autoclose: true,
			  mode: 'cancel'
			}]}
			onClose={this.closePopout}
		  >
			<h2>Подтвердите действие</h2>
			<p>Вы уверены, что хотите выйти? Ваши ответы могут не сохраниться.</p>
		  </Alert>
		});
	}

	closePopout () {
		this.setState({ popout: null });
	}

	showFactorClarification (clari_text) {
		if (clari_text == '') {
			return;
		}
		else {
			this.setState({ popout:
				<Alert
					actionsLayout="horizontal"
					actions={[{
					title: 'Ок',
					autoclose: true,
					mode: 'cancel'
					}]}
					onClose={this.closePopout}
				>
					<h2>Описание</h2>
					<p>{clari_text}</p>
				</Alert>
			});
		}
	}

	setActiveModal (modal_name) {
		if (this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10].Instruction == '1') {
			this.setState({ activeModal: modal_name });
		}
	}


	// Тестируем чекбоксы

	nextCheckbox () {
		// Пользователь отвечал ранее на текущий вопрос, но сейчас пропускает его
		if (this.state.testInformation[this.state.countquest].isDone == 1 && this.state.selectedAnswers.length == 0) {
			
			this.state.selectedAnswers = [];
			
			this.state.countquest++;
			this.setState({});	
		}
		// Пользователь отвечал ранее на текущий вопрос и сейчас отвечает заново
		else if (this.state.testInformation[this.state.countquest].isDone == 1 && this.state.selectedAnswers.length != 0) {
			
			// Отправка нового ответа
			this.postPersonAnswer(0);

			for (let i = 0; i < this.state.selectedAnswers.length; i++) {
				this.state.testInformation[this.state.countquest].Prev_Answers[i] = this.state.selectedAnswers[i];
			}

			this.state.selectedAnswers = [];
			this.state.countquest++;
			this.setState({});
		}
		// Пользователь не отвечал ранее на текущий вопрос
		else if (this.state.testInformation[this.state.countquest].isDone == 0 && this.state.selectedAnswers.length != 0) {
			
			// Отправка ответа (первого)
			this.postPersonAnswer(0); 
			
			const abbr = this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10];
			if (abbr.Question_Done_Count == abbr.Question_Count) {
				this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10].Question_Done_Count = 0;
			}
			else {
				this.state.testList[(this.state.testInformation[0].Test_ID - 1) / 10].Question_Done_Count++;
			}

			// Записываем в testInformation, что данный вопрос был отвечен
			this.state.testInformation[this.state.countquest].isDone = 1;

			for (let i = 0; i < this.state.selectedAnswers.length; i++) {
				this.state.testInformation[this.state.countquest].Prev_Answers[i] = this.state.selectedAnswers[i];
			}

			this.state.selectedAnswers = [];

			this.state.countquest++;
			this.setState({});
		}

		// Если тест закончился
		if (this.state.countquest >= this.state.testInformation.length) {
			
			this.sayServerDoResult(this.state.testInformation[0].Test_ID);
			
			this.setState({ countquest: 0, activePanel: 'results', selectedAnswers: [] });
			this.postUserPost();
			return;
		}
	}

	backCheckbox () {
		if (this.state.countquest != 0)
		{
			this.state.selectedAnswers = [];
			this.state.countquest--;
			this.setState({});
		}
	}

	chooseBox (description) {
		let flag = 0;
		for (let i = 0; i < this.state.selectedAnswers.length; i++) {
			if (this.state.selectedAnswers[i] === description) {
				flag = 1;
				this.state.selectedAnswers.splice(i, 1);
				this.setState({});
				break;
			}
		}
		if (flag === 0) {
			this.state.selectedAnswers.push(description);
			this.setState({});
		}

		console.log(this.state.selectedAnswers);
	}

  
	render() {
	
	const modal = (
		<ModalRoot activeModal={this.state.activeModal} onClose={() => this.setActiveModal(null)}>
			<ModalPage id='modal-instruction'
				onClose={() => this.setActiveModal(null)}
				header={
				<ModalPageHeader
					right={<PanelHeaderSubmit onClick={() => this.setActiveModal(null)}/>}
				>
					Инструкция
				</ModalPageHeader>
			}
			>
				<Div>
				{this.state.testInstruction.length != 0 &&
					<>
						{
							this.state.testInstruction.map((ex1, index1) => (
								<p key={index1}>
								{
									ex1.body.map((ex2, index2) => (
										<>
										{ex2.tag == 'nothing' &&
											<>{ex2.content}&nbsp;</>
										}
										{ex2.tag == 'list' &&
											<ul><li>{ex2.content}&nbsp;</li></ul>
										}
										{ex2.tag == 'example' &&
											<i>{ex2.content}&nbsp;</i>
										}
										{ex2.tag == 'attention' &&
											<b>{ex2.content}&nbsp;</b>
										}
										</>
									))
								}
								</p>
							))
						}
					</>
				}
				</Div>
			</ModalPage>
		</ModalRoot>
	);

	  return (
		<View activePanel={this.state.activePanel} popout={this.state.popout} modal={modal}>
		  <Panel id="panel0">
			<PanelHeader>Тесты</PanelHeader>
			<Div>
				{
					this.state.testList.map((ex, index) => (
						<Banner
							key={ex.Test_ID}
							header={ex.Name}
							subheader={`Вы прошли этот тест на ${isNaN((ex.Question_Done_Count * 100) / ex.Question_Count) ? '...' : ((ex.Question_Done_Count * 100) / ex.Question_Count).toFixed(2)}%.`}
							asideMode="expand"
							onClick={() => this.toNecessaryPanel('test-mainpage', ex.Test_ID)}
					  	/>
					))
				}
			</Div>
		  </Panel>

		  <Panel id="test-mainpage">
		  	<PanelHeader left={<PanelHeaderBack onClick={() => this.setState({ activePanel: 'panel0' })}/>}>
				{this.state.currentTestLable}
			</PanelHeader>
				<Div>
					<Banner
						header='Пройти тест'
						//subheader=''
						asideMode="expand"
						onClick={() => this.testActive()}
					/>
					<Banner
						header='Результаты'
						//subheader=''
						asideMode="expand"
						onClick={() => this.setState({ activePanel: 'results' })}
					/>
				</Div>
		  </Panel>
		  
		  <Panel id="questions">
		  	<PanelHeader left={<PanelHeaderBack onClick={this.testExit}/>}>
				<PanelHeaderContent onClick={() => this.setActiveModal('modal-instruction')}>
					Вопрос {this.state.countquest + 1}
				</PanelHeaderContent>
			</PanelHeader>
			<Group>
	  			{this.state.testInformation.length > 0 && this.state.countquest < this.state.testInformation.length &&
				  <Div>{this.state.testInformation[this.state.countquest].Question_Description}</Div>
				}
				<Separator/>
				{/*<FixedLayout vertical="bottom">*/}
				<Div>
					<Group>
            			<Progress value={this.state.countquest * (100/this.state.testInformation.length)}/>
      				</Group>
				</Div>
				{this.state.testInformation.length > 0 && this.state.countquest < this.state.testInformation.length &&
					<Div>
						{this.state.testInformation[this.state.countquest].Type == 'button' &&
						<>
						{
							this.state.testInformation[this.state.countquest].Answers.map((ex, index) => (
								<Group key={index}>
									<Button size="xl" stretched mode="secondary" onClick={() => this.nextQuestion(index)}>{ex.Description}</Button>
								</Group>
							))
						}
						</>
						}
						{this.state.testInformation[this.state.countquest].Type == 'checkbox' &&
						<>
						{
							this.state.testInformation[this.state.countquest].Answers.map((ex, index) => (
								<Group key={index}>
									<Checkbox onClick={() => this.chooseBox(ex.Description)} 
											  checked={this.state.selectedAnswers.includes(ex.Description)}>
										{ex.Description}
									</Checkbox>
								</Group>
							))
						}
						<Div/>
						<Button size="xl" stretched mode="primary" onClick={() => this.nextCheckbox()}>Вперёд</Button>
						<p/>
						<Button size="xl" stretched mode="primary" onClick={() => this.backCheckbox()}>Назад</Button>
						</>
						}
					</Div>
				}
				{/*</FixedLayout>*/}
	  		</Group>
		  </Panel>


		  <Panel id="results">
		  	<PanelHeader left={<PanelHeaderBack onClick={() => this.setState({ activePanel: 'test-mainpage' })}/>}>
				Результаты
			</PanelHeader>
			{this.state.testResult.length != 0 &&
				<>
					<Div>
						{this.state.testResult.map((ex, index) => (
							<Group>
								<Div><b>{ex.section_title}</b></Div>
								<Div>{ex.section_explanation}</Div>
								{ex.factors.length != 0 &&
								<>
								{ex.factors.map((ex_new, index_new) => (
									<SimpleCell onClick={() => this.showFactorClarification(ex_new.clarification)} multiline key={index_new}>
										<InfoRow header={ex_new.name}>
											{ex_new.description}
										</InfoRow>
									</SimpleCell>
								))
								}
								</>
								}
							</Group>
							))
						}
					</Div>
					<Div><Div><b>Дата последнего прохождения:</b> {(this.state.testResult[0].reply_date.substr(8,2) + '.' + this.state.testResult[0].reply_date.substr(5,2) + '.' + this.state.testResult[0].reply_date.substr(0,4) + ' ' + this.state.testResult[0].reply_date.substr(11,5) + ' UTC')}</Div></Div>
				</>
			}
		    {this.state.testResult.length == 0 &&
				<>
					<Div>
						Упс... Кажется, результатов пока нет. Давайте это исправим!😉
					</Div>
					<Div>
						<Button size="xl" align="center" stretched mode="primary" onClick={() => this.testActive()}>Пройти тест</Button>
					</Div>
				</>
			}
		  </Panel>
		</View>
	  )
	}
  }

export default App;
