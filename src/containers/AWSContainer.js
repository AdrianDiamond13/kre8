import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route, withRouter } from 'react-router-dom';
import SimpleReactValidator from 'simple-react-validator';

import * as actions from '../store/actions/actions.js';
import * as events from '../../eventTypes';

import AWSComponent from '../components/AWSComponent'
import AWSLoadingComponent from '../components/AWSLoadingComponent'
import HelpInfoComponent from '../components/HelpInfoComponent';


//TODO: Create logic for form data sanitation, ie don't accept an empty field from a user when they click submit

const mapStateToProps = store => ({

});

const mapDispatchToProps = dispatch => ({
  setNewRole: (text) => {
    dispatch(actions.setRole(text))
  }
});

class AwsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      iamRoleName: '',
      vpcStackName: '',
      clusterName: '',
      awsComponentSubmitted: false,

      iamRoleStatus: 'CREATING',
      stackStatus:'—',
      clusterStatus:'—',
      workerNodeStatus: '—',
      kubectlConfigStatus: '—',
      errorMessage: '—',

      text_info: '',
      showInfo: false,
      mouseCoords: {}
    }

    this.validator = new SimpleReactValidator({
      element: (message, className) => <div className="errorClass">{message}</div>
    });

    this.handleChange = this.handleChange.bind(this);

    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.handleError = this.handleError.bind(this);


    // this.handleCreateRole = this.handleCreateRole.bind(this);
    // this.handleNewRole = this.handleNewRole.bind(this);

    // this.handleCreateTechStack = this.handleCreateTechStack.bind(this);
    // this.handleNewTechStack = this.handleNewTechStack.bind(this);

    // this.handleCreateCluster = this.handleCreateCluster.bind(this);
    // this.handleNewCluster = this.handleNewCluster.bind(this);

    // this.emitInstallAuthenticator = this.emitInstallAuthenticator.bind(this);
    // this.confirmInstallAuthenticator = this.confirmInstallAuthenticator.bind(this);

    this.handleConfigAndMakeNodes = this.handleConfigAndMakeNodes.bind(this);
    this.handleNewNodes = this.handleNewNodes.bind(this);

    this.testFormValidation = this.testFormValidation.bind(this);

    this.displayInfoHandler = this.displayInfoHandler.bind(this);
    this.hideInfoHandler = this.hideInfoHandler.bind(this);
  }



  //**--------------COMPONENT LIFECYCLE METHODS-----------------**//

  // On component mount we will create listeners, so that the main thread can communicate when needed
  componentDidMount() {
    // ipcRenderer.on(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator);
    // ipcRenderer.on(events.HANDLE_NEW_ROLE, this.handleNewRole);
    // ipcRenderer.on(events.HANDLE_NEW_TECH_STACK, this.handleNewTechStack);
    // ipcRenderer.on(events.HANDLE_NEW_CLUSTER, this.handleNewCluster);
    // ipcRenderer.on(events.HANDLE_NEW_NODES, this.handleNewNodes);

    //CREATE_CLUSTER

    ipcRenderer.on(events.HANDLE_STATUS_CHANGE, this.handleStatusChange);
    ipcRenderer.on(events.HANDLE_ERRORS, this.handleError);


  }

  // On component unmount, we will unsubscribe to listeners
  componentWillUnmount() {
    // ipcRenderer.removeListener(events.CONFIRM_IAM_AUTHENTICATOR_INSTALLED, this.confirmInstallAuthenticator);
    // ipcRenderer.removeListener(events.HANDLE_NEW_ROLE, this.handleNewRole);
    // ipcRenderer.removeListener(events.HANDLE_NEW_TECH_STACK, this.handleNewTechStack);
    // ipcRenderer.removeListener(events.HANDLE_NEW_CLUSTER, this.handleNewCluster);
    // ipcRenderer.removeListener(events.HANDLE_NEW_NODES, this.handleNewNodes);

    ipcRenderer.removeListener(events.HANDLE_STATUS_CHANGE, this.handleStatusChange);
    ipcRenderer.removeListener(events.HANDLE_ERRORS, this.handleError);
  }

  //**--------------EVENT HANDLERS-----------------**//
  handleChange(e) {
    e.preventDefault();
    this.setState({ [e.target.id]: e.target.value });
  }

  testFormValidation() {
    if (this.validator.allValid()) {
      //todo: convert alert
      // alert('Your AWS Kubernetes Cluster is being configured');
      return true;
    } else {
      this.validator.showMessages();
      this.forceUpdate();
      return false;
    }
  }

  // Handlers to trigger events that will take place in the main thread
  //TODO: delete this one 
  //** ------- INSTALL AWS IAM AUTHENTICATOR FOR EKS ---------- **//
  // emitInstallAuthenticator(e) {
  //   e.preventDefault();
  //   console.log('authenticator installed!!!');
  //   ipcRenderer.send(events.INSTALL_IAM_AUTHENTICATOR, 'hello');
  // }

  // confirmInstallAuthenticator(event, data) {
  //   console.log("Data from confirmInstallAuthenticator: ", data);
  // }

  //** --------- CREATE AWS IAM ROLE FOR EKS --------------------- **//
  // handleCreateRole(e) {
  //   e.preventDefault();
  //   console.log('handleCreateRole Clicked!!!');
  //   const awsIAMRoleData = {
  //     iamRoleName: this.state.iamRoleName,
  //     description: this.state.description,
  //   }

  //   if (this.testFormValidation()) {
  //     console.log("All form data passed validation");
  //     this.setState({ ...this.state, iamRoleName: '', description: ''})
  //     ipcRenderer.send(events.CREATE_CLUSTER, awsIAMRoleData);
  //     this.setState({ ...this.state, awsComponentSubmitted: true});
  //   } else {
  //     console.log("Invalid or missing data entry");
  //   }
  // }

  // handleNewRole(event, data) {
  //   // The following is going to be the logic that occurs once a new role was created via the main thread process
  //   console.log('incoming text:', data);
  //   //TODO: Convert alert;
  //   alert(data);
  //   // this.props.setNewRole(data);
  // }
  
  //** --------- CREATING CLUSTER --------------------------------- **//

  handleStatusChange(event, data) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!data", data)
    console.log("state before: ", this.state);

    console.log("setting state: ", data.type, data.status)
    this.setState({ ...this.state, [data.type]: data.status});
    console.log("state after: ", this.state);


  }

  handleError(event, data) {
    console.log("state from error: ", this.state);

    console.log("error message: ", data)
    this.setState({ ...this.state, errorMessage: data});
    console.log("state after error: ", this.state);

  }



  //** --------- CREATE TECH STACK --------------------------------- **//

  //TODO: DELETE Create tech stack logit and button
  // handleCreateTechStack(e) {
  //   e.preventDefault();
  //   console.log('createTechStack Clicked!!!');
  //   //TODO: Dynamically intake data from form
  //   const awsTechStackData = {
  //     vpcStackName: this.state.vpcStackName,
  //   }

  //   if (this.testFormValidation()) {
  //     console.log("All form data passed validation");
  //     this.setState({ ...this.state, vpcStackName: ''});
  //     ipcRenderer.send(events.CREATE_TECH_STACK, awsTechStackData);
  //   } else {
  //     console.log("Invalid or missing data entry");
  //   }
  // }


  
  // handleNewTechStack(event, data) {
  //   console.log('incoming text:', data);
  //   alert(data)
  //   //TODO: this.props.SOMETHING(data);
  // }
  
  //** --------- CREATE AWS CLUSTER ------------------------------------- **//
  // handleCreateCluster(e) {
  //   e.preventDefault();
  //   console.log('handleCreateCluster Clicked!!!');

  //   //TODO: Dynamically intake data from form
  //   const awsClusterData = {
  //     clusterName: this.state.clusterName,
  //   }

  //   if (this.testFormValidation()) {
  //     console.log("All form data passed validation");
  //     this.setState({ ...this.state, clusterName: ''});
  //     erer.send(events.CREATE_CLUSTER, awsClusterData);
  //   } else {
  //     console.log("Invalid or missing data entry");
  //   }  
  // }
  
  // handleNewCluster(event, data) {
  //   console.log('incoming data from cluster:', data);
  //   //TODO: convert alert;
  //   alert(data);
  // }
  
  //TODO: TRUEEEEEEEEE
  //** --------- Config Kubectl and Create Worker Nodes -------------- **//
  handleConfigAndMakeNodes(e) {
    e.preventDefault();
    console.log('data to send!!', this.state);
    ipcRenderer.send(events.CREATE_CLUSTER, this.state);
    this.setState({ ...this.state, awsComponentSubmitted: true});
  }

  handleNewNodes(event, data) {
    
    //TODO: convert alerts
    if (!data.includes('Not') && data.includes('Ready')) {
      this.props.history.push('/cluster');
      console.log('kubectl has been configured and worker nodes have been made from the main thread:', data);
      alert(`kubect configured successfully. Node status: ${data}`)
    } else {
      alert(`An error occurred while configuring kubectl: ${data}`);
    }
  }


  //** --------- More Info Component -------------- **//
  displayInfoHandler(e){
    const aws_info = 'Amazon Web Services Elastic Container Service for Kubernetes (EKS) Account Setup. Your Identity and Access Management (IAM) Role for EKS is the AWS identity that will have specific permissions to create and manage your Kubernetes Cluster. For the Role Name, select something that will easily identify the role’s purpose. Example: unique-EKS-Management-Role. Your AWS VPC Stack represents a collection of resources necessary to manage and run your Kubernetes cluster. For the Stack Name, select something that will easily identify the stack’s purpose. Example: unique-EKS-Stack. An EKS Cluster consists of two primary components: The Amazon EKS control plane and Amazon EKS worker nodes that run the Kubernetes etcd and the Kubernetes API server. For the Cluster Name, select something that will easily identify the stack’s purpose. Example: unique-EKS-Cluster. Once submitted, this phase takes 10-15 minutes to complete, depending on Amazon’s processing time. Kre8 cannot proceed until your EKS Account has been set up.'

    const x = e.screenX;
    const y = e.screenY;
    const newCoords = {top: y, left: x}
    if(e.target.id === "aws_info"){
      this.setState({...this.state, text_info: aws_info, mouseCoords: newCoords, showInfo: true})
    }
    // if(buttonId === aws_info_button){
    //   this.setState({...this.state, text_info: aws_info, showInfo: true})
    // }
  }

  //HIDE INFO BUTTON CLICK HANDLER
  hideInfoHandler(){
    this.setState({...this.state, showInfo: false})
  }




  render() {
    const { 
      iamRoleName,
      vpcStackName,
      clusterName,

      iamRoleStatus,
      stackStatus,
      clusterStatus,
      workerNodeStatus,
      kubectlConfigStatus,
      errorMessage
     } = this.state;

    return (
      <div className="aws_cluster_page_container">
        {this.state.showInfo === true && (
        <HelpInfoComponent 
          text_info={this.state.text_info}
          hideInfoHandler={this.hideInfoHandler}
          mouseCoords={this.state.mouseCoords}
        />
        )}

        {this.state.awsComponentSubmitted === false && (
          <AWSComponent 
            text_info={this.state.text_info}
            hideInfoHandler={this.hideInfoHandler}
            mouseCoords={this.state.mouseCoords}
            handleChange={this.handleChange}
            validator={this.validator}         

            iamRoleName={iamRoleName}
            vpcStackName={vpcStackName}
            clusterName={clusterName}
      
            handleConfigAndMakeNodes={this.handleConfigAndMakeNodes}
            displayInfoHandler={this.displayInfoHandler}
            grabCoords={this.grabCoords}
            /> 
          )}

        {this.state.awsComponentSubmitted === true && (
        <AWSLoadingComponent
          handleChange={this.handleChange}
          iamRoleName={iamRoleName}
          vpcStackName={vpcStackName}
          clusterName={clusterName}

          iamRoleStatus={iamRoleStatus}
          stackStatus={stackStatus}
          clusterStatus={clusterStatus}
          workerNodeStatus={workerNodeStatus}
          kubectlConfigStatus={kubectlConfigStatus}
          errorMessage={errorMessage}  
          /> 
        )}
      </div>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AwsContainer));

    {/* handleCreateRole={this.handleCreateRole} 
          emitInstallAuthenticator={this.emitInstallAuthenticator}
          handleCreateTechStack={this.handleCreateTechStack}
          handleCreateCluster={this.handleCreateCluster} */}