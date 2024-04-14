const { response } = require('express');
const session = require('../databaseDriver')
var parser = require('parse-neo4j');

const newStore = (req,res) => {
    const {nombre,direccion,hasOnline} = req.body;
    let response = session
        .run(
            "CREATE (u:TIENDA{nombre: $name, direccion: $address, tiendaOnline: $isOnline}) RETURN u",
            {
                name: nombre,
                address: direccion,
                isOnline: hasOnline
            }
        )
        .catch((error) => {
            res.status(500).json(error);
        });

    response.then(parser.parse)
    .then(parsed =>{
        res.status(200).json(parsed[0]);
    })
    .catch(function(parseError) {
        console.log(parseError);
    });
}
const addEmployee = (req, res) => {
    const username = req.query.username
    const store_id = req.query.storeID
    console.log(store_id)
    console.log(username)
    result = session.run(
        "MATCH (t:TIENDA) WHERE ID(t) = $store_id MATCH (u:ADMIN{username:$username}) CREATE p=(u)-[:ADMINISTERS]->(t)  return p",
        {
            store_id : Number(store_id),
            username: username
        }
    ) .then(result => {
        console.log(result);
        const parsed = parser.parse(result);
        console.log(parsed);
        res.status(200).json(parsed)})
    .catch((error) => {
        res.status(500).json(error);
    });
    console.log(result)
}
module.exports =  {newStore,addEmployee}