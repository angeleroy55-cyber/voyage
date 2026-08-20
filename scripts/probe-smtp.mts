import { config as loadEnv } from "dotenv";
import { getMailerSummary, verifyMailer } from "../src/server/mail";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const summary = getMailerSummary();
console.log(summary);

const result = await verifyMailer();
console.log(result);
