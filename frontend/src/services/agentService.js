export const APP_NAME = "app";
export const USER_ID = "default_user";

/**
 * Creates a new session for the agent.
 */
export async function createSession() {
  const response = await fetch(`/apps/${APP_NAME}/users/${USER_ID}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: {} })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create session');
  }
  
  const data = await response.json();
  return data.id;
}

/**
 * Starts the agent workflow with the given cargo data and listens to SSE.
 * 
 * @param {string} sessionId 
 * @param {object} cargoData 
 * @param {function} onPause Callback when the agent pauses for human review. Passes the LLM plan.
 * @param {function} onComplete Callback when the agent completes the workflow.
 * @param {function} onError Callback for errors.
 */
export async function runAgentWorkflow(sessionId, cargoData, onPause, onComplete, onError) {
  const payload = {
    app_name: APP_NAME,
    user_id: USER_ID,
    session_id: sessionId,
    new_message: {
      role: "user",
      parts: [{ text: JSON.stringify(cargoData) }]
    },
    streaming: true
  };

  try {
    const url = `/run_sse`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`SSE Request failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // Track the latest LLM plan we see in the events
    let latestLlmPlan = null;
    let latestContext = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the last incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          if (dataStr === "[DONE]") {
            continue;
          }
          
          try {
            const event = JSON.parse(dataStr);
            // In ADK, intermediate node outputs might be wrapped in specific events.
            // We will look for our specific node outputs based on how we wrote agent.py.
            
            // Look for mcp context in output
            if (event.output && event.output.mcp_context) {
                latestContext = event.output.mcp_context;
            }

            // Look for LLM review output
            if (event.author === "llm_review" && event.content && event.content.parts && event.content.parts.length > 0) {
               try {
                   const text = event.content.parts[0].text;
                   if (text) {
                       latestLlmPlan = JSON.parse(text);
                   }
               } catch (err) {
                   console.log("LLM parsing error:", err);
               }
            }

            // In some ADK 2.0 versions, the data is inside event.output
            if (event.output && (event.output.fastest_route || event.output.action)) {
                latestLlmPlan = event.output;
            }
            
            // Look for RequestInput (Pause)
            let isPause = false;
            if (event.interrupt_id === "manager_approval" || (event.type === "RequestInput" && event.interrupt_id === "manager_approval")) {
                isPause = true;
            }
            if (event.longRunningToolIds && event.longRunningToolIds.includes("manager_approval")) {
                isPause = true;
            }
            
            if (isPause) {
                // The workflow paused. Notify the UI to show the approval screen.
                onPause({
                    plan: latestLlmPlan,
                    context: latestContext,
                    cargo: cargoData
                });
            }

            // Check if workflow completed (from final completion handler)
            if (event.output && event.output.status === "completed") {
                onComplete(event.output);
            }
            if (event.output && event.output.status === "auto_approved") {
                onComplete(event.output);
            }

            // Look for Errors
            if (event.errorCode || event.error) {
                onError(new Error(event.errorMessage || event.error || "Agent Workflow Error"));
                return;
            }

          } catch (e) {
            console.warn("Could not parse SSE event JSON:", dataStr, e);
          }
        }
      }
    }
  } catch (err) {
    onError(err);
  }
}

/**
 * Resumes the workflow by sending the manager's decision back to the session.
 */
export async function resumeWorkflow(sessionId, decision) {
  const payload = {
    app_name: APP_NAME,
    user_id: USER_ID,
    session_id: sessionId,
    new_message: {
      role: "user",
      parts: [{ text: JSON.stringify({ manager_approval: decision }) }]
    },
    streaming: true
  };

  const url = `/run_sse`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to resume workflow: ${response.statusText}`);
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep the last incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6).trim();
        if (dataStr === "[DONE]") {
          continue;
        }
        
        let event;
        try {
          event = JSON.parse(dataStr);
        } catch (e) {
          continue;
        }

        if (event.output && event.output.status === "completed") {
            return true;
        }
        
        // Look for Errors
        if (event.errorCode || event.error) {
            throw new Error(event.errorMessage || event.error || "Agent Workflow Error");
        }
      }
    }
  }
  
  return true;
}
