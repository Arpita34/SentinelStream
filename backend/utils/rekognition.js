import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import fs from 'fs';

const client = new RekognitionClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Detect moderation labels in a local image file
 * @param {string} imagePath Path to the local image
 * @returns {Promise<Array>} List of detected moderation labels
 */
export const detectUnsafeContent = async (imagePath) => {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS Credentials missing');
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const command = new DetectModerationLabelsCommand({
            Image: {
                Bytes: imageBuffer
            },
            MinConfidence: 60 // Lower threshold to be safe
        });

        const response = await client.send(command);
        return response.ModerationLabels || [];
    } catch (error) {
        console.error('[AWS Rekognition Error]:', error.message);
        throw error; // Propagate error so worker can handle it safely
    }
};
