import { handleAgentRequest, type AgentRouteContext } from "../../lib/handler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request, context: AgentRouteContext) {
    return handleAgentRequest(request, context);
}

export async function POST(request: Request, context: AgentRouteContext) {
    return handleAgentRequest(request, context);
}

export async function PATCH(request: Request, context: AgentRouteContext) {
    return handleAgentRequest(request, context);
}

export async function DELETE(request: Request, context: AgentRouteContext) {
    return handleAgentRequest(request, context);
}
