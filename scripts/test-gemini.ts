
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Load env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : "";

async function listModels() {
    console.log("Using API Key:", apiKey ? "Found (starts with " + apiKey.substring(0, 4) + ")" : "Not Found");
    let logOutput = "";
    const log = (msg: string) => {
        console.log(msg);
        logOutput += msg + "\n";
    };

    try {
        log("Fetching available models via REST API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        log("\nAvailable Models:");

        if (data.models) {
            data.models.forEach((m: any) => {
                log(`- ${m.name} (${m.displayName}) | Methods: ${m.supportedGenerationMethods?.join(', ')}`);
            });
        } else {
            log("No models found in response.");
        }

    } catch (error: any) {
        log(`Error fetching models: ${error.message}`);
    }

    fs.writeFileSync('gemini-test.log', logOutput);
}

listModels();
