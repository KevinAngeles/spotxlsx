import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input, Container, Row, Col, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import axios from 'axios';
//import './App.css';

function RadioOption(props) {
	return (
		<FormGroup check>
			<Label check htmlFor={props.radioID}>
				<Input checked={props.accountChecked === props.value} id={props.radioID} name="account" onChange={props.handleOptionChange} required="" type="radio" value={props.value}/>
				<img src={props.src} alt={props.alt}/>
				{props.text}
			</Label>
		</FormGroup>
	);
}

function UserInput(props) {
	return (
		<FormGroup row style={{display:props.accountChecked==="own"?'none':''}}>
			<Label sm={3} for={props.userID}>user ID</Label>
			<Col sm={9}>
				<Input id={props.userID} onChange={props.handleUserIDChange} placeholder="User ID" type="text" value={props.value} />
			</Col>
		</FormGroup>
	);
}

function DownloadButton(props) {
	return (
		<Button color="primary" size="md" id={props.buttonID} disabled={props.accountChecked !== "own" && !props.userID} onClick={props.handleClickButton} block>{props.downloadText}</Button>
	);
}

class App extends Component {
	constructor(props) {
		super(props);
		this.handleOptionChange = this.handleOptionChange.bind(this);
		this.handleUserIDChange = this.handleUserIDChange.bind(this);
		this.handleClickButton = this.handleClickButton.bind(this);

		this.toggle = this.toggle.bind(this);

		this.state = {
			accountChecked: 'own',
			userID: "",
			hiddenUserID: "",
			modal: false,
		};
	}

	handleOptionChange(ev) {
		this.setState({
			accountChecked: ev.target.value,
		});
	}

	handleUserIDChange(ev) {
		this.setState({
			userID: ev.target.value,
		});
	}

	toggle() {
	    this.setState({
			modal: !this.state.modal
		});
	}

	handleErrorMsg(msg) {
		this.setState({
			errorMsg: msg,
		});
	}

	handleClickButton(ev) {
		if(this.state.accountChecked === "other" ) {
			this.setState( prevState => {
				return { hiddenUserID: prevState.userID }
			}, () => {
				if(this.state.hiddenUserID) {
					const base_url = `${window.location.href}`;

					axios({
						method: 'POST',
						url: `${base_url}auth`, 
						data: {
							userid: `${this.state.hiddenUserID}`,
						}
					}).then( response => {
						if(response.status === 200) {
							document.getElementById("myForm").submit();
						}
						else {
							this.handleErrorMsg("There was a problem with the Spotify ID");
							this.toggle();
						}
					}).catch( error => {
						this.handleErrorMsg("Spotify ID does not exist");
						this.toggle();
					});
				}
			});
		}
		else {
			this.setState({ hiddenUserID: myspotuserid }, () => {
				document.getElementById("myForm").submit();
			});
		}
	}

	render() {
		return (
			<Container>
				<Modal isOpen={this.state.modal} toggle={this.toggle} className="modal-confirm">
					<ModalHeader toggle={this.toggle}>
						<div className="icon-box">
							<i className="material-icons">&#xE5CD;</i>
						</div>
					</ModalHeader>
					<ModalBody className="text-center">
						<h2>Ooops!</h2>	
						<p>{this.state.errorMsg}</p>
						<Button color="warning" onClick={this.toggle}>OK</Button>
					</ModalBody>
				</Modal>
				<div className="py-5 text-center">
					<h1>Playlists to XLSX</h1>
					<p className="lead">Retrieve a list of tracks from Spotify in a .xslx file</p>
					<img src="images/spotxlsx2.jpg" alt="application logo" style={{height:'100px'}}/>
				</div>
				<Row>
					<Col xs={{ size: '1'}} sm={{ size: '2'}} md={{ size: '3'}} lg={{ size: '4'}}></Col>
					<Col xs={{ size: '10'}} md={{ size: '6'}} lg={{ size: '4'}} className="bg-light p-4">
						<h2 className="mb-3">Select Source:</h2>
						<Form id="myForm" action="/playlist" method="post">
							<input type="hidden" id="huserid" name="userid" value={this.state.hiddenUserID}/>
							{RadioOption({accountChecked:this.state.accountChecked, alt:"own account", handleOptionChange:this.handleOptionChange, radioID:"radio1", src:"images/personicon.png", text:"From my account", value:"own"})}
							{RadioOption({accountChecked:this.state.accountChecked, alt:"other account", handleOptionChange:this.handleOptionChange, radioID:"radio2", src:"images/peopleicon.png",  text:"From other account", value:"other"})}
							<FormGroup className="my-3">
								{UserInput({accountChecked:this.state.accountChecked, handleUserIDChange:this.handleUserIDChange, text:"User ID", userID:"userID", value:this.state.userID})}
							</FormGroup>
							<FormGroup>
								{DownloadButton({accountChecked:this.state.accountChecked, buttonID:"btnDownload", downloadText:"Download playlists", userID:this.state.userID, handleClickButton:this.handleClickButton })}
							</FormGroup>
						</Form>
					</Col>
					<Col xs={{ size: '1'}} sm={{ size: '2'}} md={{ size: '3'}} lg={{ size: '4'}}></Col>
				</Row>
				<footer className="text-center"></footer>
			</Container>
		);
	}
}

export default App;
