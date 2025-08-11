import {z} from 'zod'
import Sandbox from '@e2b/code-interpreter'
import { createAgent, createTool } from '@inngest/agent-kit'

import { PROMPT } from '@/prompt'

import { inngest } from './client'
import { getSandbox } from './utils'
import { grok } from 'inngest'
import { stderr, stdout } from 'process'

export const helloWorld = inngest.createFunction(
    { id: "helloWorld" },
    { event: "test/hello.world" },
    async ({event, step} => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("lovable-clone-jay5")
            return sandbox.sandboxId
        })


        const codeAgent = createAgent({
            name: "code-agent",
            description: "An expert coding agent"
            system: PROMPT,
            model: grok({
                model: "grok-3-latest"
            }),
            tools: [
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands",
                    parameters: z.object({
                        command: z.string()
                    }),
                    handler: async ({command}, {step}) => {
                        return await step?.run("terminal", async () => {
                            const buffers = { stdout: "", stderr: ""};

                            try {
                                const sandbox = await getSandbox(sandboxId)
                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data: string) => {
                                        buffers.stdout += data
                                    },
                                    onStderr: (data: string) => {
                                        buffers.stderr += data
                                    }
                                })
                                return result.stdout
                            } catch (e) {
                                console.log(
                                    `Command failed: ${e} \nstdout: ${buffers.stdout} \nstderror: ${buffers.stderr}`
                                ),
                            }
                        })
                    } 
                })
            ]
        })
    })
)