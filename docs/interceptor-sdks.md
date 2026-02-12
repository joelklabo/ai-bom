# Universal Interceptor SDKs

Monitor every AI agent, enforce Cedar policies at runtime, and gain full observability --
regardless of language or framework. Trusera ships three open-source SDKs that share a
single design philosophy: **intercept, evaluate, report**.

| | Python | TypeScript | Go |
|---|--------|------------|-----|
| **Repository** | [trusera-agent-sdk](https://github.com/Trusera/trusera-agent-sdk) | [trusera-sdk-js](https://github.com/Trusera/trusera-sdk-js) | [trusera-sdk-go](https://github.com/Trusera/ai-bom/trusera-sdk-go) |
| **Package** | `trusera-sdk` (PyPI) | `trusera-sdk` (npm) | `github.com/Trusera/ai-bom/trusera-sdk-go` |
| **License** | Apache 2.0 | Apache 2.0 | Apache 2.0 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Feature Comparison](#2-feature-comparison)
3. [Architecture](#3-architecture)
4. [Quick Start](#4-quick-start)
5. [Integration Guides for Top 10 Agent Frameworks](#5-integration-guides-for-top-10-agent-frameworks)
6. [Enforcement Modes](#6-enforcement-modes)
7. [Event Types Reference](#7-event-types-reference)
8. [Configuration Reference](#8-configuration-reference)
9. [Performance](#9-performance)
10. [Migration Guide](#10-migration-guide)

---

## 1. Overview

AI agents make autonomous decisions -- calling LLMs, invoking tools, reading databases,
and hitting third-party APIs. Without observability, you are flying blind. Without
enforcement, you have no guardrails.

The **Trusera Interceptor SDK family** solves both problems:

- **Intercept** every outbound call your agent makes (HTTP requests, LLM invocations,
  tool calls, file writes, data access, and decision points).
- **Evaluate** each action against Cedar policies -- the same policy language used by
  AWS Verified Permissions -- in real time.
- **Report** a structured event stream to the Trusera platform for dashboards, alerts,
  compliance audits, and forensic analysis.

All three SDKs are designed around the same core concepts:

| Concept | Description |
|---------|-------------|
| **Client** | Authenticated connection to the Trusera API. Handles batching and flushing. |
| **Interceptor** | Language-specific hook that transparently captures outbound calls. |
| **Event** | A structured record of a single agent action (tool call, LLM invoke, etc.). |
| **Enforcement Mode** | How policy violations are handled: `log`, `warn`, or `block`. |
| **Agent Registration** | One-time registration that ties events to a named agent identity. |

Choose the SDK that matches your agent's language:

- **Python SDK** -- Best for LangChain, CrewAI, AutoGen, LlamaIndex, Semantic Kernel,
  and any Python-based agent.
- **TypeScript SDK** -- Best for LangChain.js, Vercel AI SDK, OpenAI Node.js SDK,
  and any Node.js/Bun agent.
- **Go SDK** -- Best for custom Go agents, microservices, and high-performance
  infrastructure agents.

---

## 2. Feature Comparison

| Feature | Python | TypeScript | Go |
|---------|--------|------------|-----|
| **Package name** | `trusera-sdk` | `trusera-sdk` | `trusera-sdk-go` |
| **Install command** | `pip install trusera-sdk` | `npm install trusera-sdk` | `go get github.com/Trusera/ai-bom/trusera-sdk-go` |
| **HTTP Interception** | `@monitor` decorator | `fetch` monkey-patch | `http.RoundTripper` wrapper |
| **LangChain Integration** | `TruseraCallbackHandler` | `TruseraLangChainHandler` | -- |
| **CrewAI Integration** | `TruseraCrewCallback` (StepCallback) | -- | -- |
| **AutoGen Integration** | `TruseraAutoGenHook` (MessageHook) | -- | -- |
| **Enforcement Modes** | `log` / `warn` / `block` | `log` / `warn` / `block` | `log` / `warn` / `block` |
| **Event Batching** | Thread-based queue | Timer-based queue | Goroutine-based queue |
| **Async Support** | `asyncio` native | Native `Promise` / `async-await` | Goroutines |
| **External Dependencies** | `httpx` | None (native `fetch`) | None (stdlib only) |
| **Min Runtime** | Python 3.9+ | Node.js 18+ | Go 1.21+ |
| **Type Safety** | Type hints (mypy) | Full TypeScript generics | Static typing |
| **Context Manager** | `with` statement | -- | `defer client.Close()` |
| **Global Intercept** | `set_default_client()` | `interceptor.install()` | `trusera.InterceptDefault()` |
| **Exclude Patterns** | -- | Regex patterns | String patterns |
| **Block Patterns** | -- | -- | String patterns |
| **Agent Registration** | `client.register_agent()` | `client.registerAgent()` | `client.RegisterAgent()` |
| **Manual Flush** | `client.flush()` | `await client.flush()` | `client.Flush()` |
| **Graceful Shutdown** | `client.close()` | `await client.close()` | `client.Close()` |
| **Thread/Concurrency Safe** | Yes (threading lock) | Yes (single-threaded + async) | Yes (mutex + goroutines) |

---

## 3. Architecture

All three SDKs follow the same layered architecture. The interceptor sits between
your agent code and the outside world, capturing events and optionally enforcing
Cedar policies before requests leave the process.

```
                        Your Application
                 ┌─────────────────────────────┐
                 │                             │
                 │   ┌───────────────────┐     │
                 │   │   AI Agent Code   │     │
                 │   │  (LangChain,      │     │
                 │   │   CrewAI, custom)  │     │
                 │   └────────┬──────────┘     │
                 │            │                │
                 │            │  function call │
                 │            ▼                │
                 │   ┌───────────────────┐     │
                 │   │  Trusera SDK      │     │
                 │   │  Interceptor      │     │
                 │   │                   │     │
                 │   │  1. Capture args  │     │
                 │   │  2. Evaluate      │     │
                 │   │     Cedar policy  │     │
                 │   │  3. Enforce       │     │
                 │   │     (log/warn/    │     │
                 │   │      block)       │     │
                 │   │  4. Queue event   │     │
                 │   └───┬─────────┬─────┘     │
                 │       │         │            │
                 │       │ pass    │ events     │
                 │       │ through │ (batched)  │
                 │       ▼         ▼            │
                 └───────┼─────────┼────────────┘
                         │         │
              ┌──────────┘         └──────────┐
              ▼                               ▼
     ┌─────────────────┐            ┌─────────────────┐
     │  External APIs  │            │  Trusera API    │
     │  & Tools        │            │                 │
     │                 │            │  ┌───────────┐  │
     │  - OpenAI       │            │  │  Cedar    │  │
     │  - Anthropic    │            │  │  Policy   │  │
     │  - Databases    │            │  │  Engine   │  │
     │  - File systems │            │  └───────────┘  │
     │  - Webhooks     │            │                 │
     └─────────────────┘            │  ┌───────────┐  │
                                    │  │ Dashboard │  │
                                    │  │ & Alerts  │  │
                                    │  └───────────┘  │
                                    └─────────────────┘
```

### Interception Mechanisms by Language

**Python** -- The `@monitor` decorator wraps functions at definition time. When a
decorated function is called, the SDK captures input arguments, measures execution
time, records the return value (or exception), and queues an event. A background
thread flushes events to the Trusera API at configurable intervals.

**TypeScript** -- The `TruseraInterceptor` replaces the global `fetch` function with
a wrapper that captures request URL, method, headers, and body. After the real
request completes, the SDK records the response status and queues an event. A
`setInterval` timer drives periodic flushes.

**Go** -- The SDK provides a custom `http.RoundTripper` that wraps the standard
`http.Transport`. Every request passing through the wrapped `http.Client` is
intercepted, measured, and recorded. A background goroutine flushes the event
buffer on a ticker.

---

## 4. Quick Start

### Python

```python
from trusera_sdk import TruseraClient, Event, EventType

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("my-agent", "custom")

client.track(Event(
    type=EventType.TOOL_CALL,
    name="web_search",
    payload={"query": "latest AI news"}
))

client.close()
```

### TypeScript

```typescript
import { TruseraClient, TruseraInterceptor } from "trusera-sdk";

const client = new TruseraClient({
  apiKey: "tsk_your_api_key",
  agentId: "my-agent",
});

const interceptor = new TruseraInterceptor();
interceptor.install(client, { enforcement: "log" });

// All fetch() calls are now tracked automatically
await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  body: JSON.stringify({ model: "gpt-4", messages: [] }),
});

await client.close();
interceptor.uninstall();
```

### Go

```go
package main

import (
    "net/http"
    "github.com/Trusera/ai-bom/trusera-sdk-go"
)

func main() {
    client := trusera.NewClient("tsk_your_api_key")
    defer client.Close()

    client.RegisterAgent("my-agent", "custom")

    httpClient := trusera.WrapHTTPClient(&http.Client{}, client, trusera.InterceptorOptions{
        Enforcement: trusera.ModeLog,
    })

    // All requests through httpClient are tracked automatically
    resp, _ := httpClient.Get("https://api.openai.com/v1/models")
    defer resp.Body.Close()
}
```

---

## 5. Integration Guides for Top 10 Agent Frameworks

### 5.1 LangChain (Python)

**SDK**: Python (`trusera-sdk[langchain]`)

LangChain's callback system provides hooks for every LLM call, tool execution, and
chain step. The `TruseraCallbackHandler` plugs directly into these hooks.

```python
from langchain.llms import OpenAI
from langchain.agents import initialize_agent, Tool
from trusera_sdk import TruseraClient
from trusera_sdk.integrations.langchain import TruseraCallbackHandler

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("langchain-agent", "langchain")
handler = TruseraCallbackHandler(client)

llm = OpenAI(callbacks=[handler])
agent = initialize_agent(
    tools=[
        Tool(name="search", func=search_fn, description="Search the web"),
    ],
    llm=llm,
    callbacks=[handler],
)

# Every LLM call, tool execution, and chain step is tracked
agent.run("What are the top AI security risks?")
client.close()
```

**What gets tracked**: `LLM_INVOKE` for each model call, `TOOL_CALL` for each tool
execution, `DECISION` for chain-of-thought steps.

---

### 5.2 LangChain.js (Node.js)

**SDK**: TypeScript (`trusera-sdk`)

The TypeScript SDK provides a `TruseraLangChainHandler` that implements the
LangChain.js `BaseCallbackHandler` interface.

```typescript
import { ChatOpenAI } from "langchain/chat_models/openai";
import { TruseraClient, TruseraLangChainHandler } from "trusera-sdk";

const client = new TruseraClient({ apiKey: "tsk_your_api_key" });
const handler = new TruseraLangChainHandler(client);

const model = new ChatOpenAI({
  callbacks: [handler],
});

await model.invoke("What are the top AI security risks?");
await client.close();
```

**What gets tracked**: Same event types as the Python LangChain integration --
`LLM_INVOKE`, `TOOL_CALL`, and `DECISION` events.

---

### 5.3 CrewAI

**SDK**: Python (`trusera-sdk[crewai]`)

CrewAI uses a step callback pattern. The `TruseraCrewCallback` wraps this to capture
crew execution, agent delegation, and task completion.

```python
from crewai import Crew, Agent, Task
from trusera_sdk import TruseraClient
from trusera_sdk.integrations.crewai import TruseraCrewCallback

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("crew-agent", "crewai")
callback = TruseraCrewCallback(client)

researcher = Agent(role="Researcher", goal="Research AI trends")
writer = Agent(role="Writer", goal="Write reports")

task = Task(description="Research and write about AI trends", agent=researcher)

crew = Crew(
    agents=[researcher, writer],
    tasks=[task],
    step_callback=callback.step_callback,
)

result = crew.kickoff()
client.close()
```

**What gets tracked**: `DECISION` for each crew step, `TOOL_CALL` for agent tool
use, `LLM_INVOKE` for underlying model calls.

---

### 5.4 AutoGen

**SDK**: Python (`trusera-sdk[autogen]`)

AutoGen's hook system lets you intercept messages between agents. The
`TruseraAutoGenHook` captures all inter-agent communication and tool use.

```python
import autogen
from trusera_sdk import TruseraClient
from trusera_sdk.integrations.autogen import TruseraAutoGenHook

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("autogen-agent", "autogen")
hook = TruseraAutoGenHook(client)

assistant = autogen.AssistantAgent(
    name="assistant",
    llm_config={"model": "gpt-4"},
)
user_proxy = autogen.UserProxyAgent(name="user")

# Register hook for message tracking
hook.setup_agent(assistant)

user_proxy.initiate_chat(assistant, message="Analyze this data")
client.close()
```

**What gets tracked**: `LLM_INVOKE` for each model call, `DECISION` for agent
message routing, `TOOL_CALL` for code execution and function calls.

---

### 5.5 LlamaIndex

**SDK**: Python (`trusera-sdk`)

LlamaIndex does not have a dedicated integration module, but the `@monitor`
decorator works perfectly with LlamaIndex query engines and retrievers.

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from trusera_sdk import TruseraClient, monitor, set_default_client, EventType

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("llamaindex-agent", "llamaindex")
set_default_client(client)

documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)

@monitor(event_type=EventType.DATA_ACCESS)
def query_index(question: str) -> str:
    query_engine = index.as_query_engine()
    response = query_engine.query(question)
    return str(response)

@monitor(event_type=EventType.LLM_INVOKE, name="llamaindex_query")
def ask(question: str) -> str:
    return query_index(question)

result = ask("What are the key findings?")
client.close()
```

**What gets tracked**: `DATA_ACCESS` for index queries, `LLM_INVOKE` for the
top-level question-answering call.

---

### 5.6 Semantic Kernel (Python)

**SDK**: Python (`trusera-sdk`)

Microsoft Semantic Kernel exposes functions as plugins. Wrap plugin functions with
`@monitor` to capture every kernel invocation.

```python
import semantic_kernel as sk
from trusera_sdk import TruseraClient, monitor, set_default_client, EventType

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("sk-agent", "semantic-kernel")
set_default_client(client)

kernel = sk.Kernel()

@monitor(event_type=EventType.TOOL_CALL)
def search_web(query: str) -> str:
    # Your search implementation
    return "Search results for: " + query

@monitor(event_type=EventType.LLM_INVOKE)
async def invoke_kernel(prompt: str) -> str:
    result = await kernel.invoke_prompt(prompt)
    return str(result)

result = await invoke_kernel("Summarize recent AI security papers")
client.close()
```

**What gets tracked**: `TOOL_CALL` for plugin function invocations, `LLM_INVOKE`
for kernel prompt calls.

---

### 5.7 OpenAI Agents SDK

**SDK**: Python (`trusera-sdk`) or TypeScript (`trusera-sdk`)

The OpenAI Agents SDK can be instrumented from either language. Use the `@monitor`
decorator in Python or the `fetch` interceptor in TypeScript.

#### Python

```python
from agents import Agent, Runner
from trusera_sdk import TruseraClient, monitor, set_default_client, EventType

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("openai-agent", "openai-agents-sdk")
set_default_client(client)

@monitor(event_type=EventType.TOOL_CALL)
def get_weather(city: str) -> str:
    return f"72F in {city}"

agent = Agent(
    name="weather-assistant",
    instructions="You help with weather queries.",
    tools=[get_weather],
)

result = Runner.run_sync(agent, "What is the weather in SF?")
client.close()
```

#### TypeScript

```typescript
import { TruseraClient, TruseraInterceptor } from "trusera-sdk";

const client = new TruseraClient({
  apiKey: "tsk_your_api_key",
  agentId: "openai-agent",
});

const interceptor = new TruseraInterceptor();
interceptor.install(client, { enforcement: "log" });

// The OpenAI Agents SDK uses fetch internally --
// all API calls are captured automatically
import { Agent } from "@openai/agents";

const agent = new Agent({ name: "assistant" });
const result = await agent.run("What is the weather in SF?");

await client.close();
interceptor.uninstall();
```

---

### 5.8 Vercel AI SDK

**SDK**: TypeScript (`trusera-sdk`)

The Vercel AI SDK uses `fetch` internally for all model calls. The Trusera
interceptor captures these transparently.

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { TruseraClient, TruseraInterceptor } from "trusera-sdk";

const client = new TruseraClient({
  apiKey: "tsk_your_api_key",
  agentId: "vercel-ai-agent",
});

const interceptor = new TruseraInterceptor();
interceptor.install(client, {
  enforcement: "warn",
  excludePatterns: ["^http://localhost.*"],
});

// All model calls through the Vercel AI SDK are captured
const { text } = await generateText({
  model: openai("gpt-4"),
  prompt: "Explain AI agent security in one paragraph.",
});

console.log(text);

await client.close();
interceptor.uninstall();
```

**What gets tracked**: `API_CALL` events for every outbound HTTP request to the
model provider, with URL, method, status code, and latency.

---

### 5.9 Custom Go Agents

**SDK**: Go (`trusera-sdk-go`)

For Go agents built from scratch, wrap your `http.Client` and use manual event
tracking for non-HTTP actions.

```go
package main

import (
    "fmt"
    "net/http"
    "github.com/Trusera/ai-bom/trusera-sdk-go"
)

func main() {
    truseraClient := trusera.NewClient("tsk_your_api_key",
        trusera.WithAgentID("go-agent"),
    )
    defer truseraClient.Close()

    truseraClient.RegisterAgent("go-agent", "custom")

    // Wrap HTTP client -- all outbound requests are tracked
    httpClient := trusera.WrapHTTPClient(&http.Client{}, truseraClient, trusera.InterceptorOptions{
        Enforcement:    trusera.ModeBlock,
        BlockPatterns:  []string{"malicious.com"},
        ExcludePatterns: []string{"api.trusera.io", "localhost"},
    })

    // HTTP calls are auto-tracked
    resp, err := httpClient.Get("https://api.openai.com/v1/models")
    if err != nil {
        fmt.Println("Blocked or failed:", err)
        return
    }
    defer resp.Body.Close()

    // Track non-HTTP actions manually
    event := trusera.NewEvent(trusera.EventDecision, "route_selection").
        WithPayload("selected_route", "api_v2").
        WithPayload("confidence", 0.92)
    truseraClient.Track(event)
}
```

---

### 5.10 Custom Python Agents

**SDK**: Python (`trusera-sdk`)

For custom Python agents that do not use a framework, the `@monitor` decorator is
the recommended approach.

```python
from trusera_sdk import TruseraClient, monitor, set_default_client, EventType
import httpx

client = TruseraClient(api_key="tsk_your_api_key")
client.register_agent("custom-agent", "custom")
set_default_client(client)

@monitor(event_type=EventType.LLM_INVOKE, name="call_openai")
def call_openai(prompt: str) -> str:
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        json={"model": "gpt-4", "messages": [{"role": "user", "content": prompt}]},
        headers={"Authorization": "Bearer sk-..."},
    )
    return response.json()["choices"][0]["message"]["content"]

@monitor(event_type=EventType.TOOL_CALL, name="search_db")
def search_database(query: str) -> list[dict]:
    # Your database logic
    return [{"id": 1, "title": "Result"}]

@monitor(event_type=EventType.DECISION, name="agent_loop")
def agent_step(user_input: str) -> str:
    context = search_database(user_input)
    prompt = f"Context: {context}\nQuestion: {user_input}"
    return call_openai(prompt)

answer = agent_step("What are our top vulnerabilities?")
print(answer)
client.close()
```

**What gets tracked**: `LLM_INVOKE` for every OpenAI call, `TOOL_CALL` for every
database search, `DECISION` for each agent loop iteration -- all with timing,
input arguments, and return values.

---

## 6. Enforcement Modes

All three SDKs support three enforcement modes that control what happens when a
policy violation is detected.

### 6.1 Log Mode (Default)

Events are recorded silently. No output to the console, no exceptions thrown, no
requests blocked. This is the safest mode for initial rollout.

**When to use**: Development, staging, initial production deployment, audit-only
compliance.

#### Python

```python
# Log mode is the default -- no configuration needed
client = TruseraClient(api_key="tsk_your_api_key")
```

#### TypeScript

```typescript
interceptor.install(client, { enforcement: "log" });
// fetch("https://restricted-api.com") -> request proceeds, event recorded silently
```

#### Go

```go
opts := trusera.InterceptorOptions{
    Enforcement: trusera.ModeLog,
}
// httpClient.Get("https://restricted-api.com") -> request proceeds, event recorded
```

---

### 6.2 Warn Mode

Events are recorded and a warning is emitted. In Python this logs a warning, in
TypeScript it prints to `console.warn`, in Go it writes to `log.Printf`. Requests
are NOT blocked.

**When to use**: Pre-production hardening, gradual policy rollout, alerting teams
to violations without breaking workflows.

#### Python

```python
# Warning appears in logs:
# [Trusera] WARN: Policy violation detected for tool_call "restricted_api"
```

#### TypeScript

```typescript
interceptor.install(client, { enforcement: "warn" });
// Console output: [Trusera] Policy violation (allowed): Unauthorized API access
```

#### Go

```go
opts := trusera.InterceptorOptions{
    Enforcement: trusera.ModeWarn,
    BlockPatterns: []string{"suspicious.com"},
}
// Log output: [Trusera] WARN: request to suspicious.com matched block pattern
// Request proceeds normally
```

---

### 6.3 Block Mode

Violations cause the request to fail. In Python an exception is raised, in
TypeScript an `Error` is thrown, in Go the HTTP response is replaced with a
synthetic 403. This is the strongest enforcement mode.

**When to use**: Production enforcement, compliance-critical workloads, when you
are confident your policies are correct.

#### Python

```python
# Raises: trusera_sdk.PolicyViolationError: Blocked by policy: unauthorized_data_access
```

#### TypeScript

```typescript
interceptor.install(client, { enforcement: "block" });
try {
  await fetch("https://restricted-api.com/data");
} catch (err) {
  // Error: [Trusera] Policy violation: Unauthorized API access
  console.error("Blocked:", err.message);
}
```

#### Go

```go
opts := trusera.InterceptorOptions{
    Enforcement: trusera.ModeBlock,
    BlockPatterns: []string{"malicious.com"},
}
httpClient := trusera.WrapHTTPClient(&http.Client{}, truseraClient, opts)

resp, err := httpClient.Get("https://malicious.com/exfiltrate")
// err != nil: request blocked by Trusera policy
```

---

### Enforcement Mode Summary

| Mode | Logs Event | Console Output | Blocks Request | Use Case |
|------|-----------|----------------|----------------|----------|
| `log` | Yes | No | No | Audit, development |
| `warn` | Yes | Yes (warning) | No | Staging, gradual rollout |
| `block` | Yes | Yes (error) | Yes | Production enforcement |

---

## 7. Event Types Reference

All three SDKs share the same six event types. These provide a consistent schema
across languages, making it possible to query and visualize events from Python,
TypeScript, and Go agents in a single Trusera dashboard.

### 7.1 TOOL_CALL

Records a tool or function invocation by the agent.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"tool_call"` |
| `name` | `string` | Tool identifier (e.g., `"web_search"`, `"calculator"`) |
| `payload` | `object` | Input arguments and parameters |
| `metadata` | `object` | Duration, status, framework-specific data |

**Example Payload**:
```json
{
  "type": "tool_call",
  "name": "web_search",
  "payload": {
    "query": "AI security best practices",
    "results_count": 10
  },
  "metadata": {
    "duration_ms": 250,
    "status": "success"
  }
}
```

---

### 7.2 LLM_INVOKE

Records an LLM inference call.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"llm_invoke"` |
| `name` | `string` | Model identifier (e.g., `"gpt-4"`, `"claude-3"`) |
| `payload` | `object` | Model, tokens, temperature, prompt summary |
| `metadata` | `object` | Latency, provider, cost estimate |

**Example Payload**:
```json
{
  "type": "llm_invoke",
  "name": "openai.gpt4",
  "payload": {
    "model": "gpt-4",
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "temperature": 0.7
  },
  "metadata": {
    "duration_ms": 1200,
    "provider": "openai"
  }
}
```

---

### 7.3 DATA_ACCESS

Records a data read or write operation.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"data_access"` |
| `name` | `string` | Data source identifier (e.g., `"database.users.read"`) |
| `payload` | `object` | Query, table, operation type, row count |
| `metadata` | `object` | Duration, data classification |

**Example Payload**:
```json
{
  "type": "data_access",
  "name": "database.users.read",
  "payload": {
    "table": "users",
    "query": "SELECT * FROM users WHERE role = 'admin'",
    "rows_returned": 42
  },
  "metadata": {
    "duration_ms": 15,
    "classification": "pii"
  }
}
```

---

### 7.4 API_CALL

Records an outbound HTTP API request. This event type is typically generated
automatically by the HTTP interceptor.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"api_call"` |
| `name` | `string` | HTTP method and URL (e.g., `"POST https://api.stripe.com/v1/charges"`) |
| `payload` | `object` | URL, method, status code, request/response size |
| `metadata` | `object` | Latency, headers (redacted), TLS info |

**Example Payload**:
```json
{
  "type": "api_call",
  "name": "POST https://api.stripe.com/v1/charges",
  "payload": {
    "url": "https://api.stripe.com/v1/charges",
    "method": "POST",
    "status_code": 200,
    "response_size_bytes": 1524
  },
  "metadata": {
    "duration_ms": 340,
    "tls_version": "1.3"
  }
}
```

---

### 7.5 FILE_WRITE

Records a file system write operation.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"file_write"` |
| `name` | `string` | Operation identifier (e.g., `"save_report"`) |
| `payload` | `object` | File path, size, content type |
| `metadata` | `object` | Duration, permissions |

**Example Payload**:
```json
{
  "type": "file_write",
  "name": "save_report",
  "payload": {
    "path": "/tmp/report.pdf",
    "size_bytes": 1024,
    "content_type": "application/pdf"
  },
  "metadata": {
    "duration_ms": 5
  }
}
```

---

### 7.6 DECISION

Records an agent decision point or reasoning step.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"decision"` |
| `name` | `string` | Decision identifier (e.g., `"approve_transaction"`) |
| `payload` | `object` | Confidence score, reasoning, selected action |
| `metadata` | `object` | Context, alternatives considered |

**Example Payload**:
```json
{
  "type": "decision",
  "name": "approve_transaction",
  "payload": {
    "confidence": 0.95,
    "reasoning": "All fraud checks passed",
    "selected_action": "approve"
  },
  "metadata": {
    "alternatives": ["flag_for_review", "reject"],
    "context": "transaction_id=txn_abc123"
  }
}
```

---

## 8. Configuration Reference

### 8.1 Environment Variables

All three SDKs respect the same environment variables, providing a consistent
configuration experience across languages.

| Variable | Description | Default |
|----------|-------------|---------|
| `TRUSERA_API_KEY` | API key for authentication | (required) |
| `TRUSERA_API_URL` | Base URL for the Trusera API | `https://api.trusera.io` |

```bash
export TRUSERA_API_KEY=tsk_your_api_key
export TRUSERA_API_URL=https://api.trusera.io
```

---

### 8.2 Programmatic Configuration

#### Python

```python
client = TruseraClient(
    api_key="tsk_your_api_key",         # Required. Also reads TRUSERA_API_KEY
    base_url="https://api.trusera.io",  # API endpoint
    flush_interval=5.0,                  # Seconds between auto-flushes
    batch_size=100,                      # Max events per batch
    timeout=10.0,                        # HTTP request timeout (seconds)
)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | `str` | env `TRUSERA_API_KEY` | Authentication key |
| `base_url` | `str` | `https://api.trusera.dev` | API base URL |
| `flush_interval` | `float` | `5.0` | Seconds between auto-flushes |
| `batch_size` | `int` | `100` | Maximum events per batch |
| `timeout` | `float` | `10.0` | HTTP timeout in seconds |

---

#### TypeScript

```typescript
const client = new TruseraClient({
  apiKey: "tsk_your_api_key",       // Required. Also reads TRUSERA_API_KEY
  baseUrl: "https://api.trusera.io", // API endpoint
  agentId: "my-agent",              // Pre-registered agent ID
  flushInterval: 5000,              // Milliseconds between auto-flushes
  batchSize: 100,                   // Max events per batch
  debug: false,                     // Enable debug logging
});
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `apiKey` | `string` | env `TRUSERA_API_KEY` | Authentication key |
| `baseUrl` | `string` | `https://api.trusera.io` | API base URL |
| `agentId` | `string` | `undefined` | Pre-registered agent ID |
| `flushInterval` | `number` | `5000` | Milliseconds between flushes |
| `batchSize` | `number` | `100` | Maximum events per batch |
| `debug` | `boolean` | `false` | Enable debug logging |

**Interceptor Options**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enforcement` | `"log" \| "warn" \| "block"` | `"log"` | Violation handling mode |
| `policyUrl` | `string` | `undefined` | Cedar policy service URL |
| `excludePatterns` | `string[]` | `[]` | URL regex patterns to skip |
| `debug` | `boolean` | `false` | Enable debug logging |

---

#### Go

```go
client := trusera.NewClient("tsk_your_api_key",
    trusera.WithBaseURL("https://api.trusera.io"),
    trusera.WithAgentID("my-agent"),
    trusera.WithFlushInterval(60 * time.Second),
    trusera.WithBatchSize(200),
)
```

| Option Function | Type | Default | Description |
|----------------|------|---------|-------------|
| `WithBaseURL(url)` | `string` | `https://api.trusera.io` | API base URL |
| `WithAgentID(id)` | `string` | `""` | Pre-registered agent ID |
| `WithFlushInterval(d)` | `time.Duration` | `5s` | Duration between flushes |
| `WithBatchSize(n)` | `int` | `100` | Maximum events per batch |

**Interceptor Options**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `Enforcement` | `Mode` | `ModeLog` | `ModeLog`, `ModeWarn`, or `ModeBlock` |
| `ExcludePatterns` | `[]string` | `nil` | URL patterns to skip |
| `BlockPatterns` | `[]string` | `nil` | URL patterns that trigger enforcement |

---

## 9. Performance

The SDKs are designed to add negligible overhead to your agent's execution. Here
are the key design principles and benchmarks.

### 9.1 Non-Blocking by Default

Event tracking (`track()` / `Track()`) is always non-blocking. Events are placed
in an in-memory buffer and flushed asynchronously:

| SDK | Buffer Mechanism | Flush Trigger |
|-----|-----------------|---------------|
| Python | `queue.Queue` + background `threading.Thread` | Timer (default 5s) or batch size (default 100) |
| TypeScript | `Array` + `setInterval` | Timer (default 5000ms) or batch size (default 100) |
| Go | `[]Event` + `sync.Mutex` + background goroutine | `time.Ticker` (default 5s) or batch size (default 100) |

### 9.2 Overhead

| Operation | Typical Overhead |
|-----------|-----------------|
| `track()` call | < 1 microsecond (buffer append) |
| HTTP interception (per request) | < 0.5 ms (timestamp + event creation) |
| Batch flush (100 events) | 10-50 ms (single HTTP POST to Trusera API) |

### 9.3 Batching Strategy

Events are accumulated in memory and sent in batches to minimize network round
trips. A flush occurs when **either** condition is met:

1. The batch buffer reaches `batch_size` events (default: 100).
2. The flush timer fires (default: every 5 seconds).

On shutdown (`close()` / `Close()`), a final flush sends any remaining events.

### 9.4 Failure Handling

If a flush fails (network error, API timeout), the SDKs handle it gracefully:

- **Python**: Logs the error via `logging.warning()`, discards the batch, continues.
- **TypeScript**: Logs via `console.warn()`, retries once, then discards.
- **Go**: Logs via `log.Printf()`, discards the batch, continues.

The SDK will never crash your application due to a telemetry failure. Agent
execution always takes priority.

### 9.5 Memory Footprint

Each event consumes approximately 200-500 bytes in memory. With the default batch
size of 100, the maximum buffer size before flush is roughly 50 KB -- negligible
for any production workload.

---

## 10. Migration Guide

Switching between SDKs is straightforward because all three share the same event
schema, API key format, and agent registration model. Events from any SDK appear
identically in the Trusera dashboard.

### 10.1 Python to TypeScript

| Python | TypeScript Equivalent |
|--------|----------------------|
| `TruseraClient(api_key=...)` | `new TruseraClient({ apiKey: ... })` |
| `client.register_agent(name, framework)` | `await client.registerAgent(name, framework)` |
| `client.track(Event(...))` | `client.track(createEvent(...))` |
| `client.flush()` | `await client.flush()` |
| `client.close()` | `await client.close()` |
| `@monitor(event_type=...)` | `interceptor.install(client, ...)` |
| `EventType.TOOL_CALL` | `EventType.TOOL_CALL` |
| `TruseraCallbackHandler` | `TruseraLangChainHandler` |

**Key differences**:
- TypeScript `flush()` and `close()` return Promises; always `await` them.
- The TypeScript SDK uses `fetch` interception instead of a decorator pattern.
  Wrap tool functions manually with `createEvent()` if you need per-function tracking.
- CrewAI and AutoGen integrations are Python-only.

---

### 10.2 Python to Go

| Python | Go Equivalent |
|--------|---------------|
| `TruseraClient(api_key=...)` | `trusera.NewClient("api-key", ...)` |
| `client.register_agent(name, fw)` | `client.RegisterAgent(name, fw)` |
| `client.track(Event(...))` | `client.Track(trusera.NewEvent(...))` |
| `client.flush()` | `client.Flush()` |
| `client.close()` | `client.Close()` |
| `@monitor(...)` | `trusera.WrapHTTPClient(...)` |
| `EventType.TOOL_CALL` | `trusera.EventToolCall` |
| `with TruseraClient(...) as c:` | `defer client.Close()` |

**Key differences**:
- Go uses functional options (`WithBaseURL`, `WithBatchSize`) instead of keyword arguments.
- Go has `BlockPatterns` for URL-based policy enforcement; Python relies on Cedar policies.
- No framework-specific callback handlers in Go. Use `WrapHTTPClient` for HTTP
  interception and `Track()` for manual event recording.
- Go events use a builder pattern: `NewEvent(...).WithPayload(k, v)`.

---

### 10.3 TypeScript to Go

| TypeScript | Go Equivalent |
|-----------|---------------|
| `new TruseraClient({ apiKey })` | `trusera.NewClient(apiKey)` |
| `client.registerAgent(name, fw)` | `client.RegisterAgent(name, fw)` |
| `client.track(createEvent(...))` | `client.Track(trusera.NewEvent(...))` |
| `await client.flush()` | `client.Flush()` |
| `await client.close()` | `client.Close()` |
| `interceptor.install(client, opts)` | `trusera.WrapHTTPClient(httpClient, client, opts)` |
| `interceptor.uninstall()` | (use a different `http.Client` or stop using the wrapper) |
| `EventType.TOOL_CALL` | `trusera.EventToolCall` |

**Key differences**:
- Go wraps `http.Client` explicitly; TypeScript monkey-patches `globalThis.fetch`.
- Go's `WrapHTTPClient` returns a new `*http.Client`; the original is untouched.
- TypeScript's `excludePatterns` uses regex strings; Go's `ExcludePatterns` uses
  simple substring matching.
- Go does not support `policyUrl` in interceptor options; use `BlockPatterns` instead.

---

### 10.4 Shared Agent Identity

The same agent ID works across all SDKs. If you register an agent in Python and
later switch to Go, use the same agent ID to maintain continuity:

```python
# Python: register agent
client.register_agent("my-agent", "custom")
```

```go
// Go: reuse the same identity
client := trusera.NewClient("tsk_same_api_key",
    trusera.WithAgentID("my-agent"),
)
```

All historical events remain associated with `my-agent` in the Trusera dashboard,
regardless of which SDK generated them.

---

## Further Reading

- [Trusera Platform Documentation](https://docs.trusera.io)
- [Cedar Policy Language](https://www.cedarpolicy.com)
- [Python SDK Reference](https://docs.trusera.io/sdk/python)
- [TypeScript SDK Reference](https://docs.trusera.io/sdk/typescript)
- [Go SDK Reference](https://pkg.go.dev/github.com/Trusera/ai-bom/trusera-sdk-go)
- [AI-BOM Scanner](https://github.com/Trusera/ai-bom)

---

*Apache 2.0 Licensed. Built by the Trusera team.*
