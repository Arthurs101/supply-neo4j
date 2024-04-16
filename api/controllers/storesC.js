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
    const page = parseInt(req.query.page) || 1; // inicio página 1 
    const pageSize = parseInt(req.query.pageSize) || 20; // página inicial con 20 juegos

    // Calcular el índice de inicio y fin para la paginación
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    const store_id = req.query.storeID
    stock = await session.run(
        "MATCH (t:TIENDA)-[s:SALES]->(g) WHERE ID(t)=$storeID return g as Game,s.stock as inStock SKIP toInteger($skip) LIMIT toInteger($limit)",{
            storeID:Number(store_id),
            skip,
            limit
        }).then(response =>{
            parsed = parser.parse(response)
            res.status(200).json(parsed)
        }).catch((error) => {res.status(500).json(error)})
}
const getStores = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // inicio página 1 
    const pageSize = parseInt(req.query.pageSize) || 20; // página inicial con 20 juegos

    // Calcular el índice de inicio y fin para la paginación
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    await session.run("MATCH (t:TIENDA) RETURN t SKIP toInteger($skip) LIMIT toInteger($limit)",{skip,limit})
    .then(response => {
        parsed = parser.parse(response);
        res.status(200).json(parsed);
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

const getStoreSearch = async (req, res) => {
    try {
        const {storeName} = req.params
        // Obtener los parámetros de paginación del query string
        const page = parseInt(req.query.page) || 1; // inicio página 1 
        const pageSize = parseInt(req.query.pageSize) || 20; // página inicial con 20 juegos

        // Calcular el índice de inicio y fin para la paginación
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        // Consulta Cypher para obtener los juegos de la página actual
        const result = await session.run(
            "MATCH (g:TIENDA) WHERE g.nombre =~ $storeName RETURN g SKIP toInteger($skip) LIMIT toInteger($limit)",
            { storeName:`(?i).*${storeName}.*` ,skip, limit }
        );

        // Parsear y devolver los resultados
        const parsedResult = parser.parse(result);
        res.status(200).json(parsedResult);

    } catch (error) {
        console.error("Error al obtener los juegos:", error.message);
        res.status(500).json({ error: "Error al obtener los juegos: " + error.message });
    }
}

const askSupplies = async(req, res) => {
    const { storeID,dipatchID, date, games } = req.body;

    // Start a transaction
    const transaction = session.beginTransaction();

    // Initialize a flag to track if there is sufficient stock for all games
    let hasEnoughStockForAllGames = true;
    console.log(dipatchID)
    // Iterate through the games array to check stock for each game
    for (const game of games) {
        const gameID = game.gameID;
        const gameboughtAmount = game.boughtAmount;
        // Check if there is sufficient stock for the current game
        const result = await transaction.run(
            "MATCH (d:SUPPLIER)-[r:SUPPLIES]->(g:GAME) WHERE ID(d) = $dipatchID AND ID(g) = $gameID " +
            "RETURN r.has_available >= $boughtAmount AS hasEnoughStock",
            {
                dipatchID: Number(dipatchID),
                gameID: Number(gameID),
                boughtAmount: Number(gameboughtAmount)
            }
        );
        if (result.records.length === 0) {
            // No records returned, which means no match found for the game and store
            hasEnoughStockForAllGames = false;
            break; // Exit loop early as we already know there isn't enough stock
        }
        const hasEnoughStock = result.records[0].get("hasEnoughStock");
        if (!hasEnoughStock) {
            // If there is not enough stock for any game, set the flag to false
            hasEnoughStockForAllGames = false;
            break; // No need to check further, as we already know there isn't enough stock
        }
    }

    if (!hasEnoughStockForAllGames) {
        // If there is not enough stock for any game, rollback the transaction and send an error response
        transaction.rollback();
        return res.status(400).json({ error: "Insufficient stock for one or more games." });
    }

    // If there is enough stock for all games, proceed to create the order node
    order = transaction.run(
        "MATCH (u:SUPPLIER) WHERE ID(u) = $dipatchID  " +
        "MATCH (s:TIENDA) WHERE ID(s) = $storeID " +
        "CREATE (o:DISPATCH {fecha: $date}) " +
        "CREATE (u)-[:MAKES]->(o) " +
        "CREATE (o)-[:DELIVERED_IN]->(s) " +
        "RETURN o",
        {
            dipatchID : Number(dipatchID),
            storeID: Number(storeID),
            date: date
        }
    ).catch((error) => {
        res.status(500).json(error);
    })
    order.then(parser.parse).then((parsed) => {
        // Proceed to create relationships between order node and games
        for (const game of games) {
            const gameID = game.gameID;
            const gameboughtAmount = game.boughtAmount;
            transaction.run(
                "MATCH (o:DISPATCH) WHERE ID(o) = $orderID " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "CREATE (o)-[:HAS {amount: $boughtAmount}]->(g) " +
                "WITH g "+
                "MATCH (s:TIENDA)-[r:SUPPLIES]->(g) " +
                "SET r.has_available = r.has_available - $boughtAmount",
                {
                    orderID: Number(parsed[0]['id']), 
                    gameID: Number(gameID),
                    boughtAmount: Number(gameboughtAmount)
                }
            );
        }
    }).then(() => {
        // If all operations were successful, commit the transaction
        transaction.commit();
        res.status(200).json({ message: "Order created successfully." });
    }).catch((error) => {
        console.error(error);
        transaction.rollback();
        res.status(500).json({ error: "An error occurred while creating the order." });
    });
}

module.exports =  {newStore,addEmployee,addToStock,getStock,deleteFromStock,getStores,getStoreSearch,askSupplies}