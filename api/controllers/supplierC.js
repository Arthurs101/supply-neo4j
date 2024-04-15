const { response } = require('express');
const session = require('../databaseDriver')
var parser = require('parse-neo4j');

const newSupplier = (req,res) => {
    const {nombre,direccion} = req.body;
    let response = session
        .run(
            "CREATE (u:SUPPLIER{nombre: $name, direccion: $address}) RETURN u",
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
    const supplier_id = sreq.query.supplierID;
   
    session.run(
        "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
        "MATCH (u:ADMIN {username: $username}) " +
        "OPTIONAL MATCH (u)-[r:ADMINISTERS]->(t) " +
        "RETURN CASE WHEN r IS NULL THEN 'NOT_EXISTS' ELSE 'EXISTS' END AS relationStatus",
        {
            supplier_id: Number(supplier_id),
            username: username
        }
    ).then(result => {
        const relationStatus = result.records[0].get("relationStatus");
        if (relationStatus === 'EXISTS') {
            res.status(409).json({ error: "Relation already exists" });
        } else {
            session.run(
                "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
                "MATCH (u:ADMIN{username:$username}) " +
                "CREATE (u)-[:ADMINISTERS]->(t) RETURN 'SUCCESS' AS status",
                {
                    supplier_id: Number(supplier_id),
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
    const supplier_id = sreq.query.supplierID;
    const games = req.body;

    try {
        const results = [];
        for (const game of games) {
            const gameID = game.gameID;
            const stockAmount = game.stock_amount;
            const relationStatus = await session.run(
                "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "OPTIONAL MATCH (t)-[r:SUPPLIES]->(g) " +
                "RETURN CASE WHEN r IS NULL THEN 'NOT_EXISTS' ELSE 'EXISTS' END AS relationStatus",
                {
                    supplier_id: Number(supplier_id),
                    gameID: Number(gameID)
                }
            ).then(result => result.records[0].get("relationStatus"));

            if (relationStatus === 'EXISTS') {
                results.push({ gameID: gameID, status: "Relation already exists" });
            } else {
                await session.run(
                    "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
                    "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                    "CREATE (t)-[:SUPPLIES { has_available: $stockAmount , can_deliver:true}]->(g) RETURN 'SUCCESS' AS status",
                    {
                        supplier_id: Number(supplier_id),
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
    const supplier_id = sreq.query.supplierID
    stock = await session.run(
        "MATCH (t:SUPPLIER)-[s:SUPPLIES]->(g) WHERE ID(t)=$storeID return g as Game,s.stock as inStock SKIP toInteger($skip) LIMIT toInteger($limit)",{
            storeID:Number(supplier_id),
            skip,
            limit
        }).then(response =>{
            parsed = parser.parse(response)
            res.status(200).json(parsed)
        }).catch((error) => {res.status(500).json(error)})
} 
const updateStock = async(req, res) => {
    const supplier_id = sreq.query.supplierID;
    const games = req.body;

    try {
        const results = [];
        for (const game of games) {
            const gameID = game.gameID;
            const stockAmount = game.stock_amount;
            const canDeliver = game.can_deliver;
            const relationStatus = await session.run(
                "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "OPTIONAL MATCH (t)-[r:SUPPLIES]->(g) " +
                "RETURN CASE WHEN r IS NULL THEN 'NOT_EXISTS' ELSE 'EXISTS' END AS relationStatus",
                {
                    supplier_id: Number(supplier_id),
                    gameID: Number(gameID)
                }
            ).then(result => result.records[0].get("relationStatus"));
            if (relationStatus === 'EXISTS') {
                await session.run(
                "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "MATCH (t)-[r:SUPPLIES]->(g) " + 
                "SET r.has_available= $stockAmount , r.can_deliver = $can_deliver",
                {
                    supplier_id: Number(supplier_id),
                    stockAmount: Number(stockAmount),
                    can_deliver: canDeliver,
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
const deleteFromStock = async (req, res) => {
    const supplier_id = sreq.query.supplierID;
    const games = req.body;

    try {
        const results = [];
        for (const game of games) {
            const gameID = game.gameID;
            const relationStatus = await session.run(
                "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "OPTIONAL MATCH (t)-[r:SUPPLIES]->(g) " +
                "RETURN CASE WHEN r IS NULL THEN 'NOT_EXISTS' ELSE 'EXISTS' END AS relationStatus",
                {
                    supplier_id: Number(supplier_id),
                    gameID: Number(gameID)
                }
            ).then(result => result.records[0].get("relationStatus"));
            if (relationStatus === 'EXISTS') {
                await session.run(
                "MATCH (t:SUPPLIER) WHERE ID(t) = $supplier_id " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "MATCH (t)-[r:SUPPLIES]->(g) DELETE r",
                {
                    supplier_id: Number(supplier_id),
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

module.exports =  {newSupplier,addEmployee,addToStock,getStock,deleteFromStock,updateStock}