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
    const username = req.query.username;
    const store_id = req.query.storeID;
   
    session.run(
        "MATCH (t:TIENDA) WHERE ID(t) = $store_id " +
        "MATCH (u:ADMIN {username: $username}) " +
        "OPTIONAL MATCH (u)-[r:ADMINISTERS]->(t) " +
        "RETURN CASE WHEN r IS NULL THEN 'NOT_EXISTS' ELSE 'EXISTS' END AS relationStatus",
        {
            store_id: Number(store_id),
            username: username
        }
    ).then(result => {
        const relationStatus = result.records[0].get("relationStatus");
        if (relationStatus === 'EXISTS') {
            res.status(409).json({ error: "Relation already exists" });
        } else {
            session.run(
                "MATCH (t:TIENDA) WHERE ID(t) = $store_id " +
                "MATCH (u:ADMIN{username:$username}) " +
                "CREATE (u)-[:ADMINISTERS]->(t) RETURN 'SUCCESS' AS status",
                {
                    store_id: Number(store_id),
                    username: username
                }
            ).then(() => {
                res.status(200).json({ status: "SUCCESS", message: "Relation created successfully" });
            }).catch((error) => {
                res.status(500).json(error);
            });
        }
    }).catch((error) => {
        res.status(500).json(error);
    });
};
const addToStock = async (req, res) => {
    const store_id = req.query.storeID;
    const games = req.body;

    try {
        const results = [];
        for (const game of games) {
            const gameID = game.gameID;
            const stockAmount = game.stock_amount;
            const relationStatus = await session.run(
                "MATCH (t:TIENDA) WHERE ID(t) = $store_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "OPTIONAL MATCH (t)-[r:SALES]->(g) " +
                "RETURN CASE WHEN r IS NULL THEN 'NOT_EXISTS' ELSE 'EXISTS' END AS relationStatus",
                {
                    store_id: Number(store_id),
                    gameID: Number(gameID)
                }
            ).then(result => result.records[0].get("relationStatus"));

            if (relationStatus === 'EXISTS') {
                results.push({ gameID: gameID, status: "Relation already exists" });
            } else {
                await session.run(
                    "MATCH (t:TIENDA) WHERE ID(t) = $store_id " +
                    "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                    "CREATE (t)-[:SALES { stock: $stockAmount }]->(g) RETURN 'SUCCESS' AS status",
                    {
                        store_id: Number(store_id),
                        gameID: Number(gameID),
                        stockAmount: Number(stockAmount)
                    }
                );
                results.push({ gameID: gameID, status: "SUCCESS", message: "Relation created successfully" });
            }
        }
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json(error);
    }
};
const getStock = async (req, res) => {
    const store_id = req.query.storeID
    console.log(store_id);
    stock = await session.run(
        "MATCH (t:TIENDA)-[s:SALES]->(g) WHERE ID(t)=$storeID return g as Game,s.stock as inStock",{
            storeID:Number(store_id)
        }).then(response =>{
            parsed = parser.parse(response)
            console.log(parsed)
            res.status(200).json(parsed)
        }).catch((error) => {res.status(500).json(error)})
} 
const deleteFromStock = async (req, res) => {
    const store_id = req.query.storeID;
    const games = req.body;

    try {
        const results = [];
        for (const game of games) {
            const gameID = game.gameID;
            const relationStatus = await session.run(
                "MATCH (t:TIENDA) WHERE ID(t) = $store_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "OPTIONAL MATCH (t)-[r:SALES]->(g) " +
                "RETURN CASE WHEN r IS NULL THEN 'NOT_EXISTS' ELSE 'EXISTS' END AS relationStatus",
                {
                    store_id: Number(store_id),
                    gameID: Number(gameID)
                }
            ).then(result => result.records[0].get("relationStatus"));
            if (relationStatus === 'EXISTS') {
                await session.run(
                "MATCH (t:TIENDA) WHERE ID(t) = $store_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "MATCH (t)-[r:SALES]->(g) DELETE r",
                {
                    store_id: Number(store_id),
                    gameID: Number(gameID)
                })
                results.push({ gameID: gameID, status: "SUCCESS", message: "Relation deleted successfully" });
            } else {
                results.push({ gameID: gameID, status: "WARNING", message: "Relation never existed" });
            }
        }
        res.status(200).json(results);
    }catch (error) {
        res.status(500).json(error);
    }
}

module.exports =  {newStore,addEmployee,addToStock,getStock,deleteFromStock}