const neo4j = require('neo4j');
const URI = "" ;
const USER = "user";
const PASSWORD = "password";
let driver
try {
    driver = new neo4j.driver(URI,neo4j.auth.basic(USER, PASSWORD));
} catch(err) {
    console.log(`Connection error\n${err}\nCause: ${err.cause}`)
}
module.exports = driver