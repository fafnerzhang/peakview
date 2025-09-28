import { mastra } from "../../../src/lib/mastra";
import { NextResponse } from "next/server";
import { convertMessages } from "@mastra/core/agent"
 
const myAgent = mastra.getAgent("runningCoach");
 
export async function GET() {
  const result = await myAgent.getMemory()?.query({
    threadId: "default",
  });
 
  const messages = convertMessages(result?.uiMessages || []).to('AIV5.UI');
  return NextResponse.json(messages);
}