
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("test-api-key");
console.log("Klasse type:", typeof GoogleGenerativeAI);
console.log("Klasse værdi:", GoogleGenerativeAI);
console.log("Instans type:", typeof genAI);
console.log("Instans metoder:", Object.getOwnPropertyNames(Object.getPrototypeOf(genAI)));
console.log("Instans properties:", Object.keys(genAI));
