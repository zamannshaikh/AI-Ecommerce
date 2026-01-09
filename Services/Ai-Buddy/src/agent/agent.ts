import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { tools } from "./tool"; 

// 1. Initialize Gemini
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash", // Ensure this model name is correct for your access level
  temperature: 0.5,
});

// 2. Bind tools to the model
// This tells Gemini: "Here are the functions you can call."
const modelWithTools = model.bindTools(tools);

// --- NODE 1: The Tool Executer ---
// This runs when Gemini requests a tool call (e.g., "searchProduct")
const toolNode = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
) => {
  const lastMessage = state.messages[state.messages.length - 1];

  // Safety check: Ensure the last message actually has tool calls
  if (!("tool_calls" in lastMessage) || !Array.isArray(lastMessage.tool_calls)) {
    throw new Error("No tool calls found in the last message.");
  }

  const toolsCall = lastMessage.tool_calls;

  // Run all requested tools in parallel
  const toolCallResults = await Promise.all(
    toolsCall.map(async (call) => {
      // Find the tool definition by name (searchProduct, getCart, etc.)
      const tool = tools.find((t) => t.name === call.name);

      if (!tool) {
        console.error(`Tool ${call.name} not found`);
        return new ToolMessage({
          content: `Error: Tool ${call.name} not found`,
          tool_call_id: call.id!,
        });
      }

      const toolInput = call.args;

      // *** THE BRIDGE ***
      // We extract the user's token from the metadata passed by the Socket Server
      // config.metadata is strictly typed as Record<string, any>, so we check strictly
      const userToken = config.metadata?.token as string;

      if (!userToken) {
        return new ToolMessage({
            content: "Error: Authentication token is missing. Cannot execute tool.",
            tool_call_id: call.id!,
            name: call.name
        })
      }

      console.log(`Invoking tool: ${call.name} with input:`, toolInput);

      // Inject the token into the tool's input
      const finalInput = { ...toolInput, token: userToken };

      try {
        // Execute the tool logic (axios call)
        const toolResult = await (tool as any).invoke(finalInput);

        return new ToolMessage({
          content: toolResult, // The JSON string from your tool
          tool_call_id: call.id!, // REQUIRED: Connects this result back to the specific request
          name: call.name,
        });
      } catch (error: any) {
        return new ToolMessage({
          content: `Error executing tool: ${error.message}`,
          tool_call_id: call.id!,
          name: call.name,
        });
      }
    })
  );

  // Return the new messages to be added to history
  return { messages: toolCallResults };
};

// --- NODE 2: The Chat Brain ---
// This sends the conversation history to Gemini to get a response
const chatNode = async (state: typeof MessagesAnnotation.State) => {
  const response = await modelWithTools.invoke(state.messages);

  // Return the AI's response (which might be text OR a tool call request)
  return { messages: [response] };
};

// --- GRAPH CONSTRUCTION ---
const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", chatNode)
  .addNode("tools", toolNode)

  .addEdge("__start__", "agent") // Start by letting the AI think

  // Conditional Edge: Did the AI ask for a tool?
  .addConditionalEdges("agent", (state) => {
    const lastMessage = state.messages[state.messages.length - 1];

    // If the AI returned tool_calls, go to the 'tools' node
    if (
        "tool_calls" in lastMessage && 
        Array.isArray(lastMessage.tool_calls) && 
        lastMessage.tool_calls.length > 0
    ) {
      return "tools";
    }

    // Otherwise, stop (send reply to user)
    return "__end__";
  })

  // Loop back: After tools run, go back to AI to summarize the result
  .addEdge("tools", "agent");

// Compile the graph
const agent = graph.compile();

export default agent;