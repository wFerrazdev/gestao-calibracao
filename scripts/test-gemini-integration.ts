
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Load env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : "";


async function testIntegration() {
    let logOutput = "";
    const log = (msg: string) => {
        console.log(msg);
        logOutput += msg + "\n";
    };

    log(`Using API Key: ${apiKey ? "Found" : "Not Found"}`);
    const genAI = new GoogleGenerativeAI(apiKey);

    // Models to test based on listModels output
    const modelsToTest = ["gemini-2.0-flash", "gemini-2.5-flash"];

    for (const modelName of modelsToTest) {
        log(`\n-----------------------------------`);
        log(`Testing model: ${modelName}`);

        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            // Test 1: Text
            log(`[${modelName}] Testing Text generation...`);
            const textResult = await model.generateContent("Hello!");
            log(`✅ [${modelName}] Text response: ${textResult.response.text()}`);

            // Test 2: Image (Dummy Base64 GIF)
            log(`[${modelName}] Testing Generic Image (Base64)...`);
            const base64Image = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            const imgResult = await model.generateContent([
                "What is this?",
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/gif",
                    },
                },
            ]);
            log(`✅ [${modelName}] Image response: ${imgResult.response.text()}`);

        } catch (e: any) {
            log(`❌ [${modelName}] Failed: ${e.message}`);
            if (e.response) {
                log(`   Details: ${JSON.stringify(e.response)}`);
            }
        }
    }

    fs.writeFileSync('gemini-integration.log', logOutput);
}

testIntegration();
