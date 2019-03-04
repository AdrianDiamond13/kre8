//** --------- NPM MODULES ---------------- 
require('dotenv').config();
const { electron, app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

//** --------- NODE APIS ---------------- 
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
//const mkdirp = require('mkdirp');
//const fsp = require('fs').promises;

//** --------- AWS SDK ELEMENTS --------- 
const IAM = require('aws-sdk/clients/iam');
const STS = require('aws-sdk/clients/sts');
//const EKS = require('aws-sdk/clients/eks');
//const CloudFormation = require('aws-sdk/clients/cloudformation');

//** --------- INSTANTIATE AWS CLASSES --- 
const sts = new STS();
//const eks = new EKS();
//const cloudformation = new CloudFormation();
//const awsConfig = new AWSConfig();
//const iam = new IAM();
//const eks = new EKS({ region: REGION });
//const cloudformation = new CloudFormation({ region: REGION });

//** --------- IMPORT MODULES -----------
const events = require('../eventTypes.js')
const awsEventCallbacks = require(__dirname + '/helperFunctions/awsEventCallbacks'); 
const kubectlConfigFunctions = require(__dirname + '/helperFunctions/kubectlConfigFunctions');
const kubernetesTemplates = require(__dirname + '/helperFunctions/kubernetesTemplates');
//const awsHelperFunctions = require(__dirname + '/helperFunctions/awsHelperFunctions'); 
//const awsParameters = require(__dirname + '/helperFunctions/awsParameters');

//** --------- IMPORT DOCUMENT TEMPLATES - 
// const iamRolePolicyDocument = require(__dirname + '/sdkAssets/samples/iamRoleTrustPolicy.json');
// const stackTemplate = require(__dirname + '/sdkAssets/samples/amazon-stack-template-eks-vpc-real.json');

//** --------- .ENV Variables -------------- 
//let REGION = process.env.REGION;
const PORT = process.env.PORT;
const REACT_DEV_TOOLS_PATH = process.env.REACT_DEV_TOOLS_PATH;

//Declare window object
let win;

//** --------- CREATE WINDOW OBJECT -------------------------------------------- **//
//Invoked with app.on('ready'): 
//Insures IAM Authenticator is installed and configured 
//sets necessary environment variables
//creates application window, serves either dev or production version of app and
function createWindowAndSetEnvironmentVariables () {

  awsEventCallbacks.installAndConfigureAWS_IAM_Authenticator();
  

  if (isDev) {
    BrowserWindow.addDevToolsExtension(REACT_DEV_TOOLS_PATH);
    process.env['APPLICATION_PATH'] = __dirname;
    awsEventCallbacks.setEnvVarsAndMkDirsInDev();

  } else {
    awsEventCallbacks.setEnvVarsAndMkDirsInProd();
    //TODO: Braden check if we need to create directories, or if we can do in the configuration of electron we do it then
  }

  //If awsCredentials file has already been created, use data to set additional required 
  //AWS Environment Variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION
  if (fs.existsSync(process.env['AWS_STORAGE'] + 'awsCredentials.json')) {
    const readCredentialsFile = fs.readFileSync(process.env['AWS_STORAGE'] + 'awsCredentials.json', 'utf-8');
    const parsedCredentialsFile = JSON.parse(readCredentialsFile);

    Object.entries(parsedCredentialsFile).forEach((arr) => {
      process.env[arr[0]] = arr[1];
      console.log("process.env[arr[0]]: ", [arr[0]], process.env[arr[0]]);
    });

    console.log("process.env['AWS_REGION']: ", process.env['AWS_REGION'])
  }

  win = new BrowserWindow({width: 1080, height: 810});
  win.loadURL(isDev ? `http://localhost:${PORT}` : `file://${path.join(__dirname, 'dist/index.html')}`)
  win.on('closed', () => win = null)
}


//** ------- EXECUTES ON EVERY OPENING OF APPLICATION -------------------------- **//
//** ------- Check credentials file to determine if user needs to configure the application **// 
//If credential's file hasn't been created yet (meaning user hasn't entered credentials previously), 
//serve HomeComponent page, else, serve HomeComponentPostCredentials
ipcMain.on(events.CHECK_CREDENTIAL_STATUS, async (event, data) => {

  try {
    const credentialStatusToReturn = await awsEventCallbacks.returnCredentialsStatus(data);
    console.log("credentialStatusToReturn: ", credentialStatusToReturn)
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, credentialStatusToReturn);

  } catch (err) {
    console.log(err)
    win.webContents.send(events.RETURN_CREDENTIAL_STATUS, "Credentials have not yet been set, or there is an error with the file");
  }
})

//** --------- EXECUTES ON USER'S FIRST INTERACTION WITH APP ---------------- **//
//** --------- Verifies and Configures User's AWS Credentials --------------- **//
//Function fires when user submits AWS credential information on homepage
//Writes credentials to file, sets environment variables with data from user,
//verifies with AWS API that credentials were correct, if so user is advanced to
//next setup page; otherwise, user is asked to retry entering credentials
ipcMain.on(events.SET_AWS_CREDENTIALS, async (event, data) => {

  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
  console.log('=============  SET_AWS_CREDENTIALS Fucntion fired ================')
  console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

  console.log('SET_AWS_CREDENTIALS FUNCTION FIRED data', data);

  try {

    awsEventCallbacks.configureAWSCredentials(data);

    let credentialStatus = await sts.getCallerIdentity().promise();
    console.log("credentialStatus: ", credentialStatus);

    if (credentialStatus.Arn) {
      console.log("credentialStatus.Arn in yes: ", credentialStatus.Arn);

      await awsEventCallbacks.updateCredentialsFileWithCredentialStatus();
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);

    } else {
      console.log("credentialStatus.Arn in else: ", credentialStatus.Arn)

      credentialStatus = false;
      win.webContents.send(events.HANDLE_AWS_CREDENTIALS, credentialStatus);
    }

  } catch (err) {
    console.log(err);
  }
})

//** --------------------------------------------------------------------------- **//
//** ----------------------- AWS SDK EVENTS ------------------------------------ **//
//** --------------------------------------------------------------------------- **//


//** --------- EXECUTES ON FIRST INTERACTION WITH APP WHEN USER SUBMITS DATA FROM PAGE 2, AWS CONTAINER ----- **//
//** --------- Takes 10 - 15 minutes to complete ------------------------------------------------------------ **//
//** --------- Creates AWS account components: IAM Role, Stack, Cluster, Worker Node Stack ------------------ **//


ipcMain.on(events.CREATE_IAM_ROLE, async (event, data) => {


  try {

    //** --------- CREATE AWS IAM ROLE + ATTACH POLICY DOCS ---------------------------
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_IAM_ROLE)... =================')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

    process.env['IAM_ROLE_NAME'] = data.iamRoleName;

    iamRoleStatusData = await awsEventCallbacks.createIAMRole(data.iamRoleName);

    console.log("iamRoleCreated data to send: ", iamRoleStatusData);

    //TODO: Do someting with the IAM Role Created Data on the front end
    win.webContents.send(events.HANDLE_NEW_ROLE, iamRoleStatusData);

  } catch (err) {
    console.log('Error from CREATE_IAM_ROLE in main.js:', err);
  }

  //** ------ CREATE AWS STACK + SAVE RETURNED DATA IN FILE ---- **//
  //Takes approx 1 - 1.5 mins to create stack and get data back from AWS


  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_TECH_STACK),... ==============')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    // FIXME: should the stack template be stringified inside of the awsParameters just like
    // the iamCreateRole process like above?
    const vpcStackName = data.vpcStackName;

    const createdStack = await awsEventCallbacks.createVPCStack(vpcStackName, data.iamRoleName);
    win.webContents.send(events.HANDLE_NEW_TECH_STACK, createdStack);


  } catch (err) {
    console.log('Error from CREATE_TECH_STACK: in main.js: ', err);
    win.webContents.send(events.HANDLE_NEW_TECH_STACK, err);

  }

  //** --------- CREATE AWS CLUSTER ---------------------------------- **//

  try {
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    console.log('============  ipcMain.on(events.CREATE_CLUSTER),... ==============')
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    createdCluster = await awsEventCallbacks.createCluster(data.clusterName, data.iamRoleName);
    win.webContents.send(events.HANDLE_NEW_CLUSTER, createdCluster);

  } catch (err) {
    console.log('Error from CREATE_CLUSTER in main.js:', err);
    win.webContents.send(events.HANDLE_NEW_CLUSTER, err);
  }

  try {

    console.log("starting kube config");
    await kubectlConfigFunctions.createConfigFile(data.clusterName);
    await kubectlConfigFunctions.configureKubectl(data.clusterName);
    win.webContents.send(events.HANDLE_NEW_CLUSTER, `kubectl Configured`);

    await kubectlConfigFunctions.createStackForWorkerNode(data.iamRoleName, data.clusterName);
    
    win.webContents.send(events.HANDLE_NEW_CLUSTER, `Worker Node VPC Stack Created`);

    await kubectlConfigFunctions.inputNodeInstance(data.iamRoleName, data.clusterName);

    //TODO: add listener to give updates on these statuses
    win.webContents.send(events.HANDLE_NEW_NODES, 'Done')

  } catch (err) {
    console.log('Error from awsEventCallbacks.createCluster: ', err);
  }
})


//** --------------------------------------------------------------------------- **//
//** ----------------------- KUBECTL EVENTS ------------------------------------ **//
//** --------------------------------------------------------------------------- **//

//**----------- CREATE A KUBERNETES POD ------------------------------ **//
//Pass user input into createPodYamlTemplate method to generate template
//Create a pod based on that template, launch pod via kubectl

ipcMain.on(events.CREATE_POD, (event, data) => {
  
  console.log('data.podName: ', data.podName);
  const podYamlTemplate = kubernetesTemplates.createPodYamlTemplate(data);

  let stringifiedPodYamlTemplate = JSON.stringify(podYamlTemplate);
  
  fs.writeFile(process.env['KUBECTL_STORAGE'] + `/pods/${data.podName}.json`,
  stringifiedPodYamlTemplate, (err) => {
      if (err) {
        return console.log(err);
      } else {
      console.log("You made a pod Yaml!!!!");
    }
  });

  
  const child = spawn('kubectl', ['apply', '-f', process.env['KUBECTL_STORAGE'] + `/pods/${data.podName}.json`]);
  
  //TODO: Braden clean up
    console.log("podCreator");
    child.stdout.on("data", info => {
      console.log(`stdout: ${info}`);
      win.webContents.send(events.HANDLE_NEW_POD, `${info}`);
    });
    child.stderr.on("data", info => {
      console.log(`stderr: ${info}`);
    });
    child.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
});



//**-----------------------SERVICE--------------------------------**//

//BUILD A SERVICE YAML
ipcMain.on(events.CREATE_SERVICE, (event, data) => {
  console.log("data:", data);

  const serviceYamlTemplate = kubernetesTemplates.createServiceYamlTemplate(data);

  //SERVICE YAML TEMPLATE
  // const serviceYamlTemplate = {
  //   apiVersion: "v1",
  //   kind: "Service",
  //   metadata: {
  //     name: `${data.name}`
  //   },
  //   spec: {
  //     selector: {
  //       app: `${data.appName}`
  //     },
  //     ports: [
  //       {
  //         protocol: "TCP",
  //         port: `${data.port}`,
  //         targetPort: `${data.targetPort}`
  //       }
  //     ]
  //   }
  // }
    
  let stringifiedServiceYamlTemplate = JSON.stringify(serviceYamlTemplate);

  //WRITE A NEW SERVICE YAML FILE
  fs.writeFile(process.env['KUBECTL_STORAGE'] + `/services/${data.serviceName}.json`, stringifiedServiceYamlTemplate, (err) => {
      if (err) {
        console.log(err);
      }
      console.log("You made a service Yaml!!!!");
    }
  );


  //CREATE SERVICE AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", ["create", "-f", process.env['KUBECTL_STORAGE'] + `/services/${data.serviceName}.json`]);
    console.log("serviceCreator");
    child.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
      win.webContents.send(events.HANDLE_NEW_SERVICE, `${data}`);
    });
    child.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });
    child.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
});





//**--------------DEPLOYMENT-----------------**//

//CREATE DEPLOYMENT 
ipcMain.on(events.CREATE_DEPLOYMENT, (event, data) => {
  
  console.log("data.deploymentName: ", data.deploymentName);

  const deploymentYamlTemplate = kubernetesTemplates.createDeploymentYamlTemplate(data);

  //DEPLOYMENT YAML TEMPLATE
  // const deploymentYaml = {
  //   apiVersion: "apps/v1",
  //   kind: "Deployment",
  //   metadata: {
  //     name: `${data.deploymentName}`,
  //     labels: {
  //       app: `${data.appName}`
  //     }
  //   },
  //   spec: {
  //     replicas: `${data.replicas}`,
  //     selector: {
  //       matchLabels: {
  //         app: `${data.appName}`
  //       }
  //     },
  //     template: {
  //       metadata: {
  //         labels: {
  //           app: `${data.appName}`
  //         }
  //       },
  //       spec: {
  //         containers: [
  //           {
  //             name: `${data.containerName}`,
  //             image: `${data.image}`,
  //             ports: [
  //               {
  //                 containerPort: `${data.containerPort}`
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     }
  //   }
  // };

  let stringifiedDeploymentYamlTemplate = JSON.stringify(deploymentYamlTemplate);

  //WRITE A NEW DEPLOYENT YAML FILE
  fs.writeFile(
    process.env['KUBECTL_STORAGE'] + `/deployments/${data.deploymentName}.json`,
    stringifiedDeploymentYamlTemplate,
    function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("You made a deployment Yaml!!!!");
    }
  );


  //CREATE DEPLOYMENT AND INSERT INTO MINIKUBE
  const child = spawn("kubectl", ["create", "-f", process.env['KUBECTL_STORAGE'] + `/deployments/${data.deploymentName}.json`]);
    console.log("deploymentCreator");
    child.stdout.on("data", info => {
      console.log(`stdout: ${info}`);
      win.webContents.send(events.HANDLE_NEW_DEPLOYMENT, `${info}`);
    });
    child.stderr.on("data", info => {
      console.log(`stderr: ${info}`);
    });
    child.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
});


//** --------- APPLICATION OBJECT EVENT EMITTERS ---------- **//
// HANDLE app ready
app.on('ready', createWindowAndSetEnvironmentVariables);

// HANDLE app shutdown
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindowAndSetEnvironmentVariables();
  }
});
