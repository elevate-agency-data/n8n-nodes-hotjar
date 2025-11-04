import { 
	ApplicationError,
	INodeType, 
	INodeTypeDescription, 
	IExecuteFunctions, 
	NodeApiError,
  NodeConnectionTypes,
	NodeOperationError
} from 'n8n-workflow';

export class Hotjar implements INodeType {
	description: INodeTypeDescription = {
		name: 'hotjar',
		displayName: 'Hotjar',
		group: ['transform'],
		version: 1,
		description: 'Use the Hotjar API',
    defaults:{ name: 'Hotjar' },
		icon: 'file:hotjar.svg',
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],        
		usableAsTool: true,
		credentials: [{	name: 'hotjarApi', required: true}],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Survey Response', value: 'surveyResponse', description: 'Manage survey responses' },
					{ name: 'User Lookup', value: 'userLookup', description: 'Manager user lookup' }
			  ],
				default: 'surveyResponse',
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['surveyResponse'] } },
				options: [					
					{ name: 'Get Survey', value: 'surveyResponseSurveyGet', action: 'Gets survey', description: 'Gets survey' },
					{ name: 'List Survey Responses', value: 'surveyResponseList', action: 'Lists survey responses', description: 'Lists survey responses' },
					{ name: 'List Surveys', value: 'surveyResponseSurveyList', action: 'Lists surveys', description: 'Lists surveys' }
				],
				default: 'surveyResponseSurveyGet',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['userLookup'] } },
				options: [					
					{ name: 'Perform User Lookup', value: 'userLookupPerformPost', action: 'Performs user lookup', description: 'Performs user lookup' },
				],
				default: 'userLookupPerformPost',
			},
			{
				displayName: 'Site ID',
				name: 'siteId',            
				type: 'number',
				default: '',
        displayOptions:{ hide:{ operation:['surveyResponseSurveyGet', 'surveyResponseList', 'surveyResponseSurveyList'] } }
			},	 
			{
				displayName: 'Organization ID',
				name: 'organizationId',            
				type: 'number',
				default: '',
        displayOptions:{ hide:{ operation:['userLookupPerformPost'] } }
			},	 
			{
				displayName: 'Survey ID',
				name: 'surveyId',            
				type: 'number',
				default: '',
        displayOptions:{ hide:{ operation:['surveyResponseList', 'surveyResponseSurveyList'] } }
			},	
      {
        displayName: 'Query Parameters',
        name: 'queryParameters',
        type: 'collection',
        placeholder: 'Add Query Parameters',
        default:{},
        displayOptions:{ show:{ operation:['surveyResponseSurveyGet', 'surveyResponseList', 'surveyResponseSurveyList', 'userLookupPerformPost'] } },
        options:[
          {
            displayName: 'Cursor',
            name: 'cursor',
            description: 'The cursor to be used for fetching a specific page',
            type: 'string',
            default: ''
          },
          {
            displayName: 'Limit',
            name: 'limit',
            description: 'Max number of results to return',
            type: 'number',
            typeOptions: { minValue: 1, maxValue:100 },
            default: 50
          },
          {
            displayName: 'With Questions',
            name: 'with_questions',
            description: 'Whether the question information should be included in the response',
            type: 'boolean',
            default: false
          }
        ]
      },
      {
        displayName: 'Request Body',
        name: 'requestBody',
        type: 'json',
	      default: '{}',
        displayOptions:{ show:{ operation:['userLookupPerformPost'] } }
      }
		]
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData = [];

		const credentials = await this.getCredentials('hotjarApi');    
    const { clientId, clientSecret } = credentials as { clientId: string, clientSecret: string };
    if (!clientId || !clientSecret) { throw new ApplicationError('Missing Client ID or Client Secret.'); }

    const authResponse = await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://api.hotjar.io/v1/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      },
      json: true,
    });

    const accessToken = authResponse?.access_token;
    if (!accessToken) { throw new ApplicationError('Failed to retrieve access token.'); }
		
		// Traitement des opérations
		for (let i = 0; i < items.length; i++) {
			try {		        		
        		
       	const operation = this.getNodeParameter('operation', i, '') as string;		
        const resource = this.getNodeParameter('resource', i, '') as string;	
        const siteId = this.getNodeParameter('siteId', i, '') as string;
        const organizationId = this.getNodeParameter('organizationId', i, '') as string;
        const surveyId = this.getNodeParameter('surveyId', i, '') as string;
        const queryParameters = this.getNodeParameter('queryParameters', i, {}) as Record<string, string | number | boolean>;
        const requestBody = this.getNodeParameter('requestBody', i, '') as string;
        
        let url = 'https://api.hotjar.io';
      
        const queryParams = new URLSearchParams();
        Object.entries(queryParameters).forEach(([key, value]) => {
          if (value !== '') queryParams.append(decodeURIComponent(key), String(value));
        });
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
				
				switch (resource) {
          case 'surveyResponse':			          
            switch (operation) {
              case 'surveyResponseSurveyGet':      
                if (!siteId) { throw new ApplicationError('Site ID is required'); }	
                if (!surveyId) { throw new ApplicationError('Survey ID is required'); }	
                url += `/v1/sites/${siteId}/surveys/${surveyId}${queryString}`;
                break;
              case 'surveyResponseList':      
                if (!siteId) { throw new ApplicationError('Site ID is required'); }	
                if (!surveyId) { throw new ApplicationError('Survey ID is required'); }	
                url += `/v1/sites/${siteId}/surveys/${surveyId}/responses${queryString}`;
                break;
              case 'surveyResponseSurveyList':      
                if (!siteId) { throw new ApplicationError('Site ID is required'); }	
                url += `/v1/sites/${siteId}/surveys${queryString}`;
                break;
            }
						break;	
					case 'userLookup':			          
            switch (operation) {
              case 'userLookupPerformPost':      
                if (!organizationId) { throw new ApplicationError('Organization ID is required'); }	
                url += `/v1/organizations/${organizationId}/user-lookup${queryString}`;
                break;
            }
						break;		
					default:
            throw new NodeOperationError(this.getNode(),`Unknown resource:${resource}`);
				}

        const httpMethod: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT' =  operation.endsWith('Delete') ? 'DELETE' :
                                                                         operation.endsWith('Patch') ? 'PATCH' :
																																				 operation.endsWith('Put') ? 'PUT' :
																																				 operation.endsWith('Post') ? 'POST' : 'GET';

        let body;
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        };

        if (!operation.includes('Delete') && ['DELETE', 'PATCH', 'POST', 'PUT'].includes(httpMethod)) {
          body = JSON.parse(requestBody);
        }

        const requestConf = {
          method: httpMethod,
          url,
          headers,
          ...(body ? { body } : {}),
        };

        console.log('url : ' + url);
        console.log('requestConf : ' + JSON.stringify(requestConf));

        const responseData = await this.helpers.httpRequest(requestConf);

        console.log('responseData : ' + responseData);

				if (typeof responseData === 'string') {
          const trimmed = responseData.trim();
          if (trimmed !== '') {
            try {
              returnData.push({ json: JSON.parse(trimmed) });
            } catch {
              returnData.push({ text: trimmed });
            }
          } else {
            returnData.push({ 'Status Code': '204 No Content' });
          }
        } else if (responseData) {
          returnData.push(responseData);
        } else {
          returnData.push({ 'Status Code': '204 No Content' });
        }        

			} catch (error) {
        throw new NodeApiError(this.getNode(), {
          message: `Error calling Hotjar API: ${error.message}`,
          description: error.stack || 'No stack trace available'
        });
      }
    }
    return [this.helpers.returnJsonArray(returnData)];
  }
}