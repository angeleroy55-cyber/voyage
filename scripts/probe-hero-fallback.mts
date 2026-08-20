import assert from "node:assert/strict";
import { listHeroSlides } from "../src/server/hero-slides";

const slides = await listHeroSlides({});

assert.deepEqual(slides, []);
console.log("fallback hero ok");
