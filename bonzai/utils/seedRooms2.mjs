import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "bonz-ai";
const REGION = process.env.AWS_REGION || "eu-north-1";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Define room configurations: 5 single, 10 double, 5 suites
const roomConfigs = [
    ...Array.from({ length: 5 }, (_, i) => ({
        id: 101 + i,
        type: "single",
        maxGuests: 1,
        price: 500,
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
        id: 201 + i,
        type: "double",
        maxGuests: 2,
        price: 800,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
        id: 301 + i,
        type: "suite",
        maxGuests: 3,
        price: 1500,
    })),
];

// Map configs to your DynamoDB single-table schema
const putRequests = roomConfigs.map((room) => ({
    PutRequest: {
        Item: {
            PK: "ROOM",
            SK: `ROOM#${room.id}`,
            type: room.type,
            maxGuests: room.maxGuests,
            price: room.price,
        },
    },
}));

async function seed() {
    try {
        const command = new BatchWriteCommand({
            RequestItems: {
                [TABLE_NAME]: putRequests,
            },
        });

        const response = await docClient.send(command);
        console.log(`Successfully inserted ${putRequests.length} rooms.`);

        if (
            response.UnprocessedItems &&
            Object.keys(response.UnprocessedItems).length > 0
        ) {
            console.warn(
                "Unprocessed items:",
                JSON.stringify(response.UnprocessedItems, null, 2),
            );
        }
    } catch (error) {
        console.error("Failed to seed rooms:", error);
    }
}

seed();