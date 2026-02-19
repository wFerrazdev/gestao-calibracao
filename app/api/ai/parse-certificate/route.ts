
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing in environment");
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        // Tested and working: gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Analise este certificado de calibração e extraia as seguintes informações em formato JSON estrito:
            - certificateNumber: O número/código do certificado.
            - calibrationDate: A data da calibração (formato ISO YYYY-MM-DD).
            - validityDate: A data de validade/próxima calibração (formato ISO YYYY-MM-DD), se houver.
            - status: O resultado da calibração, deve ser exatamente "APROVADO" ou "REPROVADO". Se não estiver explícito, use "APROVADO" se não houver indicações de falha.
            
            Retorne APENAS o JSON, sem markdown ou explicações adicionais.
        `;

        try {
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: file.type || "application/pdf", // Default to PDF if empty, though file.type should be present
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();

            // Limpar markdown se houver (ex: ```json ... ```)
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const data = JSON.parse(cleanText);
                return NextResponse.json(data);
            } catch (e) {
                console.error("Failed to parse Gemini response JSON:", text);
                return NextResponse.json(
                    { error: "Failed to parse AI response", raw: text },
                    { status: 500 }
                );
            }
        } catch (genError: any) {
            console.error("Gemini generation error:", genError);
            return NextResponse.json(
                { error: "AI Generation Failed", details: genError.message || JSON.stringify(genError) },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Error parsing certificate:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error", details: JSON.stringify(error) },
            { status: 500 }
        );
    }
}
