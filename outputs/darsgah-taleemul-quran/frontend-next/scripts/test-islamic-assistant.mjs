import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const route = readFileSync(resolve(root, "app/api/islamic-chat/route.ts"), "utf8");
const serverModule = readFileSync(resolve(root, "lib/islamic-assistant.ts"), "utf8");
const clientComponent = readFileSync(resolve(root, "components/IslamicAssistantChat.tsx"), "utf8");

const refusal = "I don’t have that information. Please ask an Islamic-related question.";

function assert(condition, message) {
  if (!condition) {
    console.error(`Islamic assistant test failed: ${message}`);
    process.exit(1);
  }
}

assert(route.includes("groq-sdk"), "API route must use the official Groq SDK.");
assert(route.includes("zod"), "API route must validate requests with Zod.");
assert(route.includes("GROQ_API_KEY"), "API route must read GROQ_API_KEY server-side.");
assert(route.includes("GROQ_MODEL"), "API route must support configurable GROQ_MODEL.");
assert(route.includes("/public/home"), "API route must load public Darsgah database context.");
assert(route.includes("max(1000)") || route.includes("max(1000,"), "API route must limit message length to 1000.");
assert(serverModule.includes("server-only"), "System prompt module must be server-only.");
assert(serverModule.includes(refusal), "Exact refusal sentence must be present.");
assert(serverModule.includes("Sunni") && serverModule.includes("Shia"), "Recognised Muslim communities must be in scope.");
assert(serverModule.includes("schoolTerms") && serverModule.includes("darsgah"), "Darsgah public questions must be classified in scope.");
assert(serverModule.includes("This information is not currently available. Please contact the Darsgah administration."), "Unavailable Darsgah response must be defined.");
assert(!clientComponent.includes("ISLAMIC_ASSISTANT_SYSTEM_PROMPT"), "Client must not reference the hidden system prompt.");
assert(!clientComponent.includes("@/lib/islamic-assistant\""), "Client must not import the server-only assistant module.");

console.log("Islamic assistant static security tests passed.");
