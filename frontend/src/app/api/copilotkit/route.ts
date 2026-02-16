import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export const POST = async (req: Request) => {
  const agent = new HttpAgent({
    url: `${BACKEND_URL}/awp`,
  });

  const runtime = new CopilotRuntime({
    agents: {
      kraken: agent,
    },
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
