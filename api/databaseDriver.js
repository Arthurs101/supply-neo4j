const neo4j = require('neo4j-driver');
require('dotenv').config();
let driver
try {
    driver = new neo4j.driver(process.env.NEO4J_URI,neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
} catch(err) {
    console.log(`Connection error\n${err}\nCause: ${err.cause}`)
}
const session = driver.session()
module.exports = session