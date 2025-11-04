import { 
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon
} from 'n8n-workflow';

export class HotjarApi implements ICredentialType {
	name = 'hotjarApi';
	displayName = 'Hotjar API';
	documentationUrl = 'https://help.hotjar.com/hc/en-us/articles/36820005914001-Hotjar-API-Reference';
  icon: Icon = 'file:icons/hotjar.svg';
	properties: INodeProperties[] = [
    {
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			typeOptions: {
				password: true
			},
			default: '',
			required: true,
			description: 'Client ID for the Hotjar API'
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true
			},
			default: '',
			required: true,
			description: 'Client Secret for the Hotjar API'
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
      method: 'POST',
			url: 'https://api.hotjar.io/v1/oauth/token',
			headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: {
				client_id: '={{$credentials.clientId}}',
				client_secret: '={{$credentials.clientSecret}}',
				grant_type: 'client_credentials',
			},
			json: true,
		},
	};
}
