import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '../services/db.mjs';

const roomTypes = [
	{ type: 'single', count: 5, maxGuests: 1, price: 500 },
	{ type: 'double', count: 10, maxGuests: 2, price: 1000 },
	{ type: 'suite', count: 5, maxGuests: 3, price: 1500 },
];

const roomsFile = new URL('./rooms.json', import.meta.url);
let rooms;

if (existsSync(roomsFile)) {
	rooms = JSON.parse(readFileSync(roomsFile, 'utf8'));
	console.log('Läser befintliga rum från rooms.json');
} else {
	rooms = [];

	for (const roomType of roomTypes) {
		for (let i = 0; i < roomType.count; i++) {
			rooms.push({
				PK: 'ROOM',
				SK: `ROOM#${randomUUID()}`,
				type: roomType.type,
				maxGuests: roomType.maxGuests,
				price: roomType.price,
			});
		}
	}

	writeFileSync(roomsFile, JSON.stringify(rooms, null, 2));
	console.log('Sparade rummen i rooms.json');
}

console.table(rooms);
console.log('Antal rum:', rooms.length);

for (const room of rooms) {
	try {
		await db.send(
			new PutCommand({
				TableName: 'bonz-ai',
				Item: room,
				ConditionExpression: 'attribute_not_exists(PK)',
			}),
		);

		console.log('Skapade:', room.SK);
	} catch (error) {
		if (error.name === 'ConditionalCheckFailedException') {
			console.log('Finns redan:', room.SK);
		} else {
			throw error;
		}
	}
}
