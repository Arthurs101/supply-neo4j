const session = require('../databaseDriver')
var parser = require('parse-neo4j');

const newStore = (req,res) => {
    const {nombre,direccion,hasOnline} = req.body;
    response = session
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
    response = session.run(
        "MATCH (t:TIENDA) WHERE ID(t) = $storeID MATCH (u:ADMIN{username:$username} ) CREATE (u) -[r:ADMINISTERS]->(t)  return u,r,t",
        {
            storeID : store_id,
            username: username
        }
    ) .catch((error) => {
        res.status(500).json(error);
    });
    response.then(parser.parse)
    .then(parsed =>{
        res.status(200).json(parsed);
    })
    .catch(function(parseError) {
        console.log(parseError);
    });
}
module.exports =  {newStore,addEmployee}