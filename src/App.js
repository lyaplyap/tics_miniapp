import { Panel, PanelHeader, Group, Cell, PanelHeaderBack, Button, FixedLayout } from '@vkontakte/vkui';
import { CellButton, Alert, Div, Separator } from '@vkontakte/vkui';
import { InfoRow, Progress } from '@vkontakte/vkui';

import Icon28PrivacyOutline from '@vkontakte/icons/dist/28/privacy_outline';
import Icon28CheckCircleDeviceOutline from '@vkontakte/icons/dist/28/check_circle_device_outline';
import Icon28ListLikeOutline from '@vkontakte/icons/dist/28/list_like_outline';
import Icon28GestureOutline from '@vkontakte/icons/dist/28/gesture_outline';

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

		testInformation: [],
		testAnswer: []

	}

	  this.closePopout = this.closePopout.bind(this);
	  this.addActionLogItem = this.addActionLogItem.bind(this);
	  
	  // Психологическая защита (функции)
	  this.defaultQuest = this.defaultQuest.bind(this);
	  this.nextQuest = this.nextQuest.bind(this);
	  this.handleOptionChange = this.handleOptionChange.bind(this);
	  this.testExit = this.testExit.bind(this);
	  this.testActive = this.testActive.bind(this);
	  this.sendToServer = this.sendToServer.bind(this);


	  this.getUserId = this.getUserId.bind(this); // получение идентификатора текущего пользователя (user_id)
	  this.toNecessaryPanel = this.toNecessaryPanel.bind(this); // получение user_id и переход на панель главного меню выбранного теста

	  this.getQuestion = this.getQuestion.bind(this);
	  this.getAnswer = this.getAnswer.bind(this);
	}


	getAnswer () {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'answer', true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				//console.log(xhr.response.results); // response -- это ответ сервера

			  	for (let i = 0; i < xhr.response.results.length; i++) {
					this.state.testAnswer.push(xhr.response.results[i]);
			  	}
			  	this.setState({});
			}
		  };

		console.log(this.state.testAnswer);
	}

	getQuestion () {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'question', true);
		xhr.responseType = 'json';
		xhr.send();
		xhr.onload = () => {
			if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
				console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
			} 
			else { // если всё прошло гладко, выводим результат
				//console.log(xhr.response.results); // response -- это ответ сервера

			  	for (let i = 0; i < xhr.response.results.length; i++) {
					this.state.testInformation.push(xhr.response.results[i]);
			  	}
			  	this.setState({});
			}
		  };

		console.log(this.state.testInformation);
	}

	toNecessaryPanel (panel) {
		this.getUserId();
		this.getQuestion();
		this.getAnswer();
		this.setState({ activePanel:  panel })
	}
	
	sendToServer() {

		let data = JSON.stringify({flagtest: this.state.old_flagtest, id: this.state.user_id });
        let request = new XMLHttpRequest();
        // посылаем запрос на адрес "/user"
        request.open("POST", "/user", true);   
        request.setRequestHeader("Content-Type", "application/json");
        request.send(data);
		
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
		if (this.state.countquest >= 97) {
			this.setState({ flagtest: [0, 0, 0, 0, 0, 0, 0, 0, 0], countquest: 0, activePanel: 'questions' });
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
			  action: () => this.setState({ activePanel: 'defense-test'}),
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

	handleOptionChange(changeEvent) {
		this.setState({
		  selectedOption: changeEvent.target.value
		});
	}

	nextQuest () {
		this.state.countquest++;
		if (this.state.countquest >= 97) {
			this.setState({ activePanel: 'results' });
			//for (var i = 0; i < 9; i++)
			//{
			//	this.state.old_flagtest[i] = this.state.flagtest[i];
			//}
			//this.sendToServer();
			return;
		}
		this.setState({});
	}

	defaultQuest () {
		if (this.state.snackbar) return;
    	this.setState({snackbar:
    	  	<Snackbar
				duration={30000}
    			onClose={() => this.setState({ snackbar: null })}
  	  		>
    			<Button size="xl" stretched mode="secondary" onClick={this.nextQuest}>Продолжить</Button>
  	  		</Snackbar>
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
			<Group>
				<Cell expandable before={<Icon28PrivacyOutline/>} onClick={() => this.toNecessaryPanel('defense-test')}>
					Тест на "Психологическую Защиту"
				</Cell>
			</Group>
		  </Panel>

		  <Panel id="defense-test">
		  	<PanelHeader left={<PanelHeaderBack onClick={() => this.setState({ activePanel: 'panel0' })}/>}>
				Психологическая Защита
			</PanelHeader>
				<Div>
	  				<Button size="xl" align="center" stretched mode="secondary" onClick={() => this.testActive()}>Пройти тест</Button>
					<Separator style={{ margin: '12px 0' }}/>
					<Button size="xl" align="center" stretched mode="secondary" onClick={() => this.setState({ activePanel: 'results' })}>Результаты тестирования</Button>
				</Div>
		  </Panel>
		  
		  <Panel id="questions">
		  	<PanelHeader left={<PanelHeaderBack onClick={this.testExit}/>}>
				Вопрос {this.state.countquest+1}
			</PanelHeader>
			<Group>
	  			{this.state.testInformation.length > 0 && this.state.countquest < this.state.testInformation.length &&
				  <Div>{this.state.testInformation[this.state.countquest].Description}</Div>
				}
				<Separator/>
				<FixedLayout vertical="bottom">
				<Div>
					<Group>
            			<Progress value={this.state.countquest * (100/this.state.testInformation.length)}/>
      				</Group>
				</Div>
				{this.state.testAnswer.length > 0 &&
					<Div>
						{
							this.state.testAnswer.map((ex, index) => (
								<Group key={index}>
									<Button size="xl" stretched mode="secondary" onClick={() => this.nextQuest()}>{ex.Description}</Button>
								</Group>
							))
						}
					</Div>
				}
				</FixedLayout>
	  		</Group>
		  </Panel>


		  <Panel id="results">
		  	<PanelHeader left={<PanelHeaderBack onClick={() => this.setState({ activePanel: 'defense-test' })}/>}>
				Результаты
			</PanelHeader>
			{/*<Group>
				<Cell multiline>
          			<InfoRow header="Вытеснение">
            			{Math.round(this.state.old_flagtest[0] / 12 * 100)} %
          			</InfoRow>
        		</Cell>
        		<Cell>
          			<InfoRow header="Отрицание">
						{Math.round(this.state.old_flagtest[1] / 13 * 100)} %
          			</InfoRow>
        		</Cell>
        		<Cell>
          			<InfoRow header="Регрессия">
					  	{Math.round(this.state.old_flagtest[2] / 14 * 100)} %
          			</InfoRow>
        		</Cell>
				<Cell>
          			<InfoRow header="Замещение">
					  	{Math.round(this.state.old_flagtest[3] / 12 * 100)} %
          			</InfoRow>
        		</Cell>
				<Cell>
          			<InfoRow header="Компенсация">
					  	{Math.round(this.state.old_flagtest[4] / 10 * 100)} %
          			</InfoRow>
        		</Cell>
				<Cell>
          			<InfoRow header="Гиперкомпенсация">
					  	{Math.round(this.state.old_flagtest[5] / 10 * 100)} %
          			</InfoRow>
        		</Cell>
				<Cell>
          			<InfoRow header="Проекция">
					  	{Math.round(this.state.old_flagtest[6] / 13 * 100)} %
          			</InfoRow>
        		</Cell>
				<Cell>
          			<InfoRow header="Рационализация">
					  	{Math.round(this.state.old_flagtest[7] / 13 * 100)} %
          			</InfoRow>
        		</Cell>
				<Cell>
					<InfoRow header="Общая выраженность">
					{Math.round(this.state.old_flagtest[8] / 97 * 100)} %
					</InfoRow>
				</Cell>
			</Group>*/}
		  </Panel>
		</View>
	  )
	}
  }

export default App;