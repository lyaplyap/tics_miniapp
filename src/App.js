import { Panel, PanelHeader, Group, Cell, PanelHeaderBack, Button, FixedLayout } from '@vkontakte/vkui';
import { ScreenSpinner, CellButton, Alert, Div, Separator } from '@vkontakte/vkui';
import { Banner, InfoRow, Progress } from '@vkontakte/vkui';

import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import View from '@vkontakte/vkui/dist/components/View/View';
import Snackbar from '@vkontakte/vkui/dist/components/Snackbar/Snackbar';

import '@vkontakte/vkui/dist/vkui.css';


class App extends React.Component {
	constructor(props) {
	  super(props);
  
	  this.state = {
		user_id: 0,

		activePanel: 'panel0',
		popout: null,
		actionsLog: [],
		countbar: 0,
		snackbar: null,

		// Прототип теста
		selectedOption: '',

		countquest: 0,
		flagtest: [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
		old_flagtest: [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],

		currentTestLable: '',
		testList: [],
		testInformation: [],
		testQuestion: [],
		testAnswer: [],
		userChoice: []

	}

	  this.closePopout = this.closePopout.bind(this);
	  this.addActionLogItem = this.addActionLogItem.bind(this);
	  this.handleOptionChange = this.handleOptionChange.bind(this);
	  
	  // Психологическая защита (функции)
	  this.nextQuestion = this.nextQuestion.bind(this);
	  this.testExit = this.testExit.bind(this);
	  this.testActive = this.testActive.bind(this);


	  this.getUserId = this.getUserId.bind(this); // получение идентификатора текущего пользователя (user_id)
	  this.toNecessaryPanel = this.toNecessaryPanel.bind(this); // получение user_id и переход на панель главного меню выбранного теста

	  this.getTestList = this.getTestList.bind(this); // получение коллекции всех тестов
	  this.getDonePercent = this.getDonePercent.bind(this); // получение процента отвеченных вопросов
	  this.getInformation = this.getInformation.bind(this); // получении коллекции с информацией о тесте
	  this.postPersonAnswer = this.postPersonAnswer.bind(this); // отправка ответа пользователя на сервер

	  this.getUserPost = this.getUserPost.bind(this);
	  this.testAccess = this.testAccess.bind(this);
	}

	componentDidMount () {
		//console.log("componentDidMount()");
		this.getTestList();
		this.getDonePercent();
	}

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
			}
		};

		//console.log(this.state.testList);
	}

	getDonePercent () {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'test-percent/1', true);
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
							//this.setState({});
						}
					}
					this.setState({});
				}
			}
		};

		console.log(this.state.testList);
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

	getInformation (test_id) {
		if (this.state.testInformation.length !== 0) {
			this.state.testInformation = [];
			this.setState({});
		}

		let xhr = new XMLHttpRequest();
		xhr.open('GET', `test-information/${test_id}/1`, true);
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
			}
		};

		console.log(this.state.testInformation);
	}

	toNecessaryPanel (panel, test_id) {
		this.getUserId();

		this.setState({ currentTestLable: this.state.testList[(test_id - 1) / 10].Name });

		this.getInformation(test_id);

		this.setState({ popout: <ScreenSpinner /> });
    	setTimeout(() => { this.setState({ popout: null }) }, 1000);

		this.setState({ activePanel: panel });
	}
	
	postPersonAnswer (index) {
		let data = JSON.stringify({
									person_answer: this.state.testInformation[this.state.countquest].Answers[index].Answer_ID, 
									id: 1 });//this.state.user_id });
        let xhr = new XMLHttpRequest();

        // Посылаем запрос с данными на адрес "/person-answer"
        xhr.open("POST", "/person-answer", true);   
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data);
	}

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

	testActive () {
		this.testAccess();
		if (this.state.countquest >= this.state.testInformation.length) {
			this.setState({ countquest: 0, activePanel: 'questions' });
		}
		else {
			this.setState({ activePanel: 'questions' });
		}
	}

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

	nextQuestion (index) {
		// Отправка на сервер ответа пользователя на вопрос
		this.postPersonAnswer(index);

		// Записываем в testInformation, что данный вопрос был отвечен
		this.state.testInformation[this.state.countquest].isDone = 1;
		this.setState({});
		
		// Переход к следующему вопросу
		this.state.countquest++;
		if (this.state.countquest >= this.state.testInformation.length) {
			this.setState({ activePanel: 'results' });
			
			// обработка результатов тестирования

			return;
		}
		this.setState({});
	}

	getUserPost () {
		bridge
			.send("VKWebAppCallAPIMethod", 
				 	{
						"method": "wall.get", 
						"request_id": "test123", 
						"params": {
									"owner_id": this.state.user_id, 
									"count": 100,
									"v":"5.84", 
									"access_token":"" // здесь необходимо вставить access_token приложения/пользователя
								}
					})
			.then(data => {
				console.log(data);
			})
			.catch(error => {
				console.log(error);
			});
	}

	
	// Что-то левое
	handleOptionChange(changeEvent) {
		this.setState({
		  selectedOption: changeEvent.target.value
		});
	}

	addActionLogItem(value) {
		this.setState({
		  actionsLog: [...this.state.actionsLog, value],
		});
	}

	closePopout () {
		this.setState({ popout: null });
	}

  
	render() {
	  return (
		<View activePanel={this.state.activePanel} popout={this.state.popout}>
		  <Panel id="panel0">
			<PanelHeader>Тесты</PanelHeader>
			<Div>
				{
					this.state.testList.map((ex, index) => (
						<Banner
							key={ex.Test_ID}
							header={ex.Name}
							subheader={`Вы прошли этот тест на ${((ex.Question_Done_Count * 100) / ex.Question_Count).toFixed(2)}%.`}
							asideMode="expand"
							onClick={() => this.toNecessaryPanel('test-mainpage', ex.Test_ID)}
					  	/>
					))
				}
			</Div>
			{/*<Div><Button onClick={() => this.getUserPost()}>Do Magic!</Button></Div>*/}
		  </Panel>

		  <Panel id="test-mainpage">
		  	<PanelHeader left={<PanelHeaderBack onClick={() => this.setState({ activePanel: 'panel0' })}/>}>
				{this.state.currentTestLable}
			</PanelHeader>
				<Div>
	  				<Button size="xl" align="center" stretched mode="secondary" onClick={() => this.testActive()}>Пройти тест</Button>
					<Separator style={{ margin: '12px 0' }}/>
					<Button size="xl" align="center" stretched mode="secondary" onClick={() => this.setState({ activePanel: 'results' })}>Результаты тестирования</Button>
				</Div>
		  </Panel>
		  
		  <Panel id="questions">
		  	<PanelHeader left={<PanelHeaderBack onClick={this.testExit}/>}>
				Вопрос {this.state.countquest + 1}
			</PanelHeader>
			<Group>
	  			{this.state.testInformation.length > 0 && this.state.countquest < this.state.testInformation.length &&
				  <Div>{this.state.testInformation[this.state.countquest].Question_Description}</Div>
				}
				<Separator/>
				<FixedLayout vertical="bottom">
				<Div>
					<Group>
            			<Progress value={this.state.countquest * (100/this.state.testInformation.length)}/>
      				</Group>
				</Div>
				{this.state.testInformation.length > 0 && this.state.countquest < this.state.testInformation.length &&
					<Div>
						{
							this.state.testInformation[this.state.countquest].Answers.map((ex, index) => (
								<Group key={index}>
									<Button size="xl" stretched mode="secondary" onClick={() => this.nextQuestion(index)}>{ex.Description}</Button>
								</Group>
							))
						}
					</Div>
				}
				</FixedLayout>
	  		</Group>
		  </Panel>


		  <Panel id="results">
		  	<PanelHeader left={<PanelHeaderBack onClick={() => this.setState({ activePanel: 'test-mainpage' })}/>}>
				Результаты
			</PanelHeader>
			
			{/* Отображение результатов тестирования */}
		  
		  </Panel>
		</View>
	  )
	}
  }

export default App;
