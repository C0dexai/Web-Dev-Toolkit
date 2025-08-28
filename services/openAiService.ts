
import OpenAI from 'openai';

// Use type aliases from the main OpenAI namespace for robustness against internal library structure changes.
type Assistant = OpenAI.Beta.Assistant;
type Thread = OpenAI.Beta.Thread;
// FIX: The VectorStore type is nested under VectorStores in this version of the library.
type VectorStore = OpenAI.Beta.VectorStores.VectorStore;
type FileObject = OpenAI.Files.FileObject;


const API_KEY = process.env.API_KEY;

const openai = new OpenAI({
  apiKey: API_KEY || '', // Use API_KEY and provide empty string fallback to prevent crash
  dangerouslyAllowBrowser: true,
});

export async function createAssistant(name: string, instructions: string): Promise<{assistant: Assistant, vectorStore: VectorStore}> {
  try {
    // FIX: Using 'vector_stores' property for compatibility with the installed version of the openai library.
    const vectorStore = await openai.beta.vector_stores.create({ name: `${name} Vector Store` });

    const assistant = await openai.beta.assistants.create({
      name,
      instructions,
      model: "gpt-4-turbo",
      tools: [{ type: "file_search" }, { type: "code_interpreter" }],
      tool_resources: { 
          file_search: { vector_store_ids: [vectorStore.id] }
      },
    });
    return { assistant, vectorStore };
  } catch (error) {
    console.error('Error creating OpenAI assistant and resources:', error);
    throw error;
  }
}

export async function deleteAssistant(assistantId: string, vectorStoreId?: string): Promise<void> {
    try {
        const deletePromises: Promise<any>[] = [openai.beta.assistants.delete(assistantId)];
        if(vectorStoreId) {
            // FIX: Using 'vector_stores' property for compatibility with the installed version of the openai library.
            deletePromises.push(openai.beta.vector_stores.del(vectorStoreId));
        }
        
        // While files attached to the assistant are not deleted when the assistant is,
        // we will leave them for now to keep changes minimal and focused on fixing the errors.
        // A more robust implementation could clean these up.

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error deleting OpenAI assistant and associated resources:', error);
        throw error;
    }
}

export async function updateAssistant(assistantId: string, data: Partial<{instructions: string}>): Promise<Assistant> {
    try {
        const assistant = await openai.beta.assistants.update(assistantId, data);
        return assistant;
    } catch (error) {
        console.error('Error updating OpenAI assistant:', error);
        throw error;
    }
}


export async function createThread(): Promise<Thread> {
    try {
        const thread = await openai.beta.threads.create();
        return thread;
    } catch (error) {
        console.error('Error creating OpenAI thread:', error);
        throw error;
    }
}

export type OpenAIStreamEvent =
  | { type: 'textDelta'; value: string }
  | { type: 'toolStart'; toolCallId: string; toolType: 'code_interpreter' }
  | { type: 'toolCodeDelta'; toolCallId: string; value: string }
  | { type: 'toolOutputDelta'; toolCallId: string; index: number; value: string; outputType: 'logs' }
  | { type: 'error'; value: string };


export async function* streamAssistantResponse(
  threadId: string,
  assistantId: string,
  newMessage: string,
): AsyncGenerator<OpenAIStreamEvent, void, unknown> {
  try {
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: newMessage,
    });

    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
    });

    for await (const event of stream) {
      switch(event.event) {
        case 'thread.message.delta':
            const delta = event.data.delta;
            if (delta.content?.[0]?.type === 'text' && delta.content[0].text?.value) {
                yield { type: 'textDelta', value: delta.content[0].text.value };
            }
            break;
        case 'thread.run.step.created':
            const stepDetails = event.data.step_details;
            if (stepDetails.type === 'tool_calls') {
                for (const toolCall of stepDetails.tool_calls) {
                    if (toolCall.type === 'code_interpreter') {
                        yield { type: 'toolStart', toolCallId: toolCall.id, toolType: 'code_interpreter' };
                    }
                }
            }
            break;
        case 'thread.run.step.delta':
            const stepDelta = event.data.delta.step_details;
            if (stepDelta?.type === 'tool_calls') {
                for (const toolCallDelta of stepDelta.tool_calls) {
                    if (toolCallDelta.type === 'code_interpreter' && toolCallDelta.id) {
                        if (toolCallDelta.code_interpreter?.input) {
                            yield { type: 'toolCodeDelta', toolCallId: toolCallDelta.id, value: toolCallDelta.code_interpreter.input };
                        }
                        if (toolCallDelta.code_interpreter?.outputs) {
                            for (const output of toolCallDelta.code_interpreter.outputs) {
                                if (output.type === 'logs' && output.logs) {
                                    yield { type: 'toolOutputDelta', toolCallId: toolCallDelta.id, index: output.index, value: output.logs, outputType: 'logs' };
                                }
                            }
                        }
                    }
                }
            }
            break;
        case 'thread.run.failed':
            const errorMessage = event.data.last_error?.message ?? 'Unknown error';
            console.error('Run failed:', errorMessage);
            yield { type: 'error', value: `\n\n**An error occurred:** ${errorMessage}`};
            break;
      }
    }
  } catch (error) {
    console.error("Error streaming response from OpenAI:", error);
    yield { type: 'error', value: `\n\nAn error occurred while getting a response. Details: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// --- Vector Store and RAG File Management ---

export async function listFiles(vectorStoreId: string) {
    try {
        // FIX: Using 'vector_stores' property for compatibility with the installed version of the openai library.
        const files = await openai.beta.vector_stores.files.list(vectorStoreId);
        return files.data;
    } catch (error) {
        console.error('Error listing files in vector store:', error);
        throw error;
    }
}

export async function uploadFile(vectorStoreId: string, file: File) {
    try {
        const uploadedFile = await openai.files.create({
            file: file,
            purpose: 'assistants',
        });
        
        // FIX: Using 'vector_stores' property for compatibility with the installed version of the openai library.
        await openai.beta.vector_stores.files.create(vectorStoreId, {
            file_id: uploadedFile.id,
        });

        return uploadedFile;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

export async function deleteFile(vectorStoreId: string, fileId: string) {
    try {
        // FIX: Using 'vector_stores' property for compatibility with the installed version of the openai library.
        await openai.beta.vector_stores.files.del(vectorStoreId, fileId);
        await openai.files.delete(fileId);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

export async function getFile(fileId: string): Promise<FileObject> {
    try {
        return await openai.files.retrieve(fileId);
    } catch (error) {
        console.error('Error retrieving file:', error);
        throw error;
    }
}

// --- Sandbox and Code Interpreter File Management ---

export async function listSandboxFiles(assistantId: string): Promise<FileObject[]> {
    try {
        const assistant = await openai.beta.assistants.retrieve(assistantId);
        const fileIds = assistant.tool_resources?.code_interpreter?.file_ids || [];
        if (fileIds.length === 0) {
            return [];
        }
        
        const filePromises = fileIds.map(id => openai.files.retrieve(id));
        return await Promise.all(filePromises);
    } catch (error) {
        console.error('Error listing sandbox files:', error);
        throw error;
    }
}

export async function uploadFileToSandbox(assistantId: string, file: File): Promise<FileObject> {
    try {
        const uploadedFile = await openai.files.create({ file, purpose: 'assistants' });
        
        const assistant = await openai.beta.assistants.retrieve(assistantId);
        const existingFileIds = assistant.tool_resources?.code_interpreter?.file_ids || [];
        
        await openai.beta.assistants.update(assistantId, {
            tool_resources: {
                code_interpreter: {
                    file_ids: [...existingFileIds, uploadedFile.id]
                }
            }
        });

        return uploadedFile;
    } catch (error) {
        console.error('Error uploading file to sandbox:', error);
        throw error;
    }
}

export async function deleteFileFromSandbox(assistantId: string, fileId: string): Promise<any> {
    try {
        const assistant = await openai.beta.assistants.retrieve(assistantId);
        const existingFileIds = assistant.tool_resources?.code_interpreter?.file_ids || [];
        const newFileIds = existingFileIds.filter(id => id !== fileId);

        await openai.beta.assistants.update(assistantId, {
            tool_resources: {
                code_interpreter: {
                    file_ids: newFileIds
                }
            }
        });

        return await openai.files.delete(fileId);
    } catch (error) {
        console.error('Error deleting file from sandbox:', error);
        throw error;
    }
}
