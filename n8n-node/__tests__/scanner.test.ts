import { scanWorkflow, scanWorkflows, isValidWorkflow, parseConnections, extractWorkflowInfo } from '../lib/scanner';
import { ComponentType, UsageType, Severity } from '../lib/models';
import sampleWorkflow from './fixtures/sampleWorkflow.json';

describe('isValidWorkflow', () => {
  it('should return true for valid workflow', () => {
    expect(isValidWorkflow(sampleWorkflow)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidWorkflow(null)).toBe(false);
  });

  it('should return false for missing nodes', () => {
    expect(isValidWorkflow({ connections: {} })).toBe(false);
  });

  it('should return false for missing connections', () => {
    expect(isValidWorkflow({ nodes: [] })).toBe(false);
  });

  it('should return false for non-array nodes', () => {
    expect(isValidWorkflow({ nodes: 'bad', connections: {} })).toBe(false);
  });
});

describe('parseConnections', () => {
  it('should parse n8n connection format', () => {
    const connections = {
      'Node A': {
        main: [[{ node: 'Node B', type: 'main', index: 0 }]],
      },
    };
    const result = parseConnections(connections);
    expect(result['Node A']).toContain('Node B');
  });

  it('should handle empty connections', () => {
    const result = parseConnections({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('extractWorkflowInfo', () => {
  it('should extract workflow metadata', () => {
    const info = extractWorkflowInfo(sampleWorkflow as any, 'test.json');
    expect(info.workflowName).toBe('AI Agent with Tools');
    expect(info.workflowId).toBe('test-workflow-001');
    expect(info.triggerType).toBe('webhook');
    expect(info.nodes.length).toBeGreaterThan(0);
  });
});

describe('scanWorkflow', () => {
  it('should detect AI components from sample workflow', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    expect(components.length).toBeGreaterThan(0);
  });

  it('should detect the OpenAI Chat Model node', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const openai = components.find((c) => c.name === 'OpenAI Chat Model');
    expect(openai).toBeDefined();
    expect(openai!.type).toBe(ComponentType.LlmProvider);
    expect(openai!.provider).toBe('OpenAI');
    expect(openai!.modelName).toBe('gpt-4');
    expect(openai!.usageType).toBe(UsageType.Completion);
  });

  it('should detect the Anthropic model with hardcoded credentials', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const anthropic = components.find((c) => c.name === 'Anthropic Model');
    expect(anthropic).toBeDefined();
    expect(anthropic!.provider).toBe('Anthropic');
    expect(anthropic!.flags).toContain('hardcoded_credentials');
  });

  it('should detect the AI Agent node', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const agent = components.find((c) => c.name === 'AI Agent');
    expect(agent).toBeDefined();
    expect(agent!.type).toBe(ComponentType.AgentFramework);
    expect(agent!.usageType).toBe(UsageType.Agent);
  });

  it('should detect MCP client with unknown server flag', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const mcp = components.find((c) => c.name === 'MCP Client');
    expect(mcp).toBeDefined();
    expect(mcp!.type).toBe(ComponentType.McpClient);
    expect(mcp!.flags).toContain('mcp_unknown_server');
  });

  it('should detect embedding and vector store components', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const embeddings = components.find((c) => c.name === 'OpenAI Embeddings');
    expect(embeddings).toBeDefined();
    expect(embeddings!.type).toBe(ComponentType.Model);
    expect(embeddings!.usageType).toBe(UsageType.Embedding);

    const pinecone = components.find((c) => c.name === 'Pinecone Store');
    expect(pinecone).toBeDefined();
    expect(pinecone!.provider).toBe('Pinecone');
  });

  it('should detect hardcoded API key in httpRequest base node', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const httpKeyComponent = components.find((c) =>
      c.name.includes('API Key in HTTP Request'),
    );
    expect(httpKeyComponent).toBeDefined();
    expect(httpKeyComponent!.flags).toContain('hardcoded_credentials');
  });

  it('should detect dangerous code in code base node', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const dangerCode = components.find((c) =>
      c.name.includes('Dangerous Code'),
    );
    expect(dangerCode).toBeDefined();
    expect(dangerCode!.flags).toContain('code_http_tools');
  });

  it('should flag webhook_no_auth on agent components', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    const agent = components.find((c) => c.name === 'AI Agent');
    expect(agent).toBeDefined();
    expect(agent!.flags).toContain('webhook_no_auth');
  });

  it('should return empty array for invalid workflow', () => {
    const components = scanWorkflow({ invalid: true }, 'test.json');
    expect(components).toHaveLength(0);
  });

  it('should score all components', () => {
    const components = scanWorkflow(sampleWorkflow, 'test.json');
    for (const comp of components) {
      expect(comp.risk).toBeDefined();
      expect(typeof comp.risk.score).toBe('number');
      expect(comp.risk.severity).toBeDefined();
    }
  });
});

describe('scanWorkflows', () => {
  it('should return a full ScanResult', () => {
    const result = scanWorkflows([
      { data: sampleWorkflow, filePath: 'test.json' },
    ]);

    expect(result.targetPath).toBe('test.json');
    expect(result.aiBomVersion).toBe('0.1.0');
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.n8nWorkflows).toHaveLength(1);
    expect(result.summary.totalComponents).toBe(result.components.length);
    expect(result.summary.totalFilesScanned).toBe(1);
    expect(typeof result.summary.scanDurationSeconds).toBe('number');
  });

  it('should skip invalid workflows in multi-scan', () => {
    const result = scanWorkflows([
      { data: sampleWorkflow, filePath: 'good.json' },
      { data: { invalid: true }, filePath: 'bad.json' },
    ]);

    expect(result.summary.totalFilesScanned).toBe(2);
    expect(result.n8nWorkflows).toHaveLength(1);
  });
});
