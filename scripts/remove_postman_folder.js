const fs = require('fs');
const file = './backend/docs/Fitness_App_API.postman_collection.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.item = data.item.filter(i => i.name !== 'Activity Plans');

fs.writeFileSync(file, JSON.stringify(data, null, 2));
