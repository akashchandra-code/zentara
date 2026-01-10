
const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { ToolMessage, AIMessage } = require("@langchain/core/messages");
const tools = require("./tools");

// ✅ Correct model initialization
const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", // ✅ supported
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

const graph = new StateGraph(MessagesAnnotation)

// ---------------- TOOLS NODE ----------------
.addNode("tools", async (state, config) => {
  const lastMessage = state.messages[state.messages.length - 1];

  const toolCalls = lastMessage.tool_calls || [];

  const toolResults = await Promise.all(
    toolCalls.map(async (call) => {
      const tool = tools[call.name];

      if (!tool) {
        return new ToolMessage({
          content: `Tool ${call.name} not found`,
          name: call.name,
        });
      }

      console.log("Invoking tool:", call.name, call.args);

      const result = await tool.func({
        ...call.args,
        token: config.metadata?.token,
      });

      return new ToolMessage({
        content: result,
        name: call.name,
      });
    })
  );

  state.messages.push(...toolResults);
  return state;
})

// ---------------- CHAT NODE ----------------
.addNode("chat", async (state) => {
  const response = await model.invoke(state.messages, {
    tools: Object.values(tools),
  });

  state.messages.push(
    new AIMessage({
      content: response.content,
      tool_calls: response.tool_calls,
    })
  );

  return state;
})

// ---------------- EDGES ----------------
.addEdge("__start__", "chat")

.addConditionalEdges("chat", (state) => {
  const last = state.messages[state.messages.length - 1];
  return last.tool_calls?.length ? "tools" : "__end__";
})

.addEdge("tools", "chat");

const agent = graph.compile();

module.exports = agent;