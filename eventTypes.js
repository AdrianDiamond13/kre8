const eventTypes = {};

//** AWS SDK EVENT TYPES

eventTypes.SET_AWS_CREDENTIALS = 'SET_AWS_CREDENTIALS';
eventTypes.HANDLE_AWS_CREDENTIALS = 'HANDLE_AWS_CREDENTIALS';

//TODO: Delete or refactor this set
eventTypes.INSTALL_IAM_AUTHENTICATOR = 'INSTALL_IAM_AUTHENTICATOR';
eventTypes.CONFIRM_IAM_AUTHENTICATOR_INSTALLED = 'CONFIRM_IAM_AUTHENTICATOR_INSTALLED';

eventTypes.CREATE_IAM_ROLE = 'CREATE_IAM_ROLE';
eventTypes.HANDLE_NEW_ROLE = 'HANDLE_NEW_ROLE';

eventTypes.CREATE_TECH_STACK = 'CREATE_TECH_STACK';
eventTypes.HANDLE_NEW_TECH_STACK = 'HANDLE_NEW_TECH_STACK';

eventTypes.CREATE_CLUSTER = 'CREATE_CLUSTER';
eventTypes.HANDLE_CLUSTER = 'HANDLE_CLUSTER';

eventTypes.CONFIG_KUBECTL_AND_MAKE_NODES = 'CONFIG_KUBECTL_AND_MAKE_NODES';
eventTypes.HANDLE_NEW_NODES = 'HANDLE_NEW_NODES';


// KUBECTL EVENT TYPES
eventTypes.CREATE_POD = 'CREATE_POD';
eventTypes.HANDLE_NEW_POD = 'HANDLE_NEW_POD';

eventTypes.CREATE_DEPLOYMENT = 'CREATE_DEPLOYMENT';
eventTypes.HANDLE_NEW_DEPLOYMENT = 'HANDLE_NEW_DEPLOYMENT';

eventTypes.CREATE_SERVICE = 'CREATE_SERVICE';
eventTypes.HANDLE_NEW_SERVICE = 'HANDLE_NEW_SERVICE';

module.exports = eventTypes;