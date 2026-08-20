import { config as loadEnv } from "dotenv";
import { deleteImage, uploadRemoteImage } from "../src/server/media";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const stored = await uploadRemoteImage({
  sourceUrl: "https://picsum.photos/seed/gosejour-probe/800/600",
  folder: "gosejour/probe",
  publicId: "probe-image",
});

console.log(stored.url);
await deleteImage(stored.publicId);
