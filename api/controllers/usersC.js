const { parse } = require('dotenv');
const session = require('../databaseDriver')
var parser = require('parse-neo4j');
//perform a login , looking up for the username and password
const login = async (req, res) => {
    var match = session
        .run(
            "MATCH (u:USER {username: $username, password: $password}) RETURN u", 
            { username: req.body.username, password: req.body.password } 
        )
        .catch((err) => res.status(500).json(err)); 
    match
        .then(parser.parse)
        .then(async parsed =>{
            if (!parsed[0]){
                res.status(404).json({error:"this user does not exist"});
            }else{
                //get the labless of the usern
                var labels = await session.run(
                    "MATCH (n:USER{username:$username}) " +
                    "WHERE size(labels(n)) > 2 " +
                    "WITH n " +
                    "UNWIND labels(n) AS lab " +
                    "WITH lab " +
                    "WHERE lab <> 'USER' " +
                    "RETURN lab", {
                        username: req.body.username
                    }
                    
                )
                parsed_labels = parser.parse(labels)
                parsed[0]['type'] = parsed_labels[0]
                parsed[0]['sex'] = parsed_labels[1]
                if (parsed_labels[0] == 'ADMIN'){
                    var stores = await session.run(
                        "MATCH (n:USER{username:$username})-[:ADMINISTERS]->(s:TIENDA) return s",
                        {
                            username: req.body.username
                        }
                    )
                    stores = parser.parse(stores)
                    parsed[0]['storesAdmin'] = stores
                }
                res.status(200).json(parsed[0]);
            }
            
        })
        .catch(function(parseError) {
            res.status(500).json(parseError)
            console.log(parseError);
        });
};
const signup = (req, res) => {
    response = session
        .run(
            "CREATE (u:USER:" + req.body.type + ":" + req.body.sex + " {name: $name, lastname: $lname, username: $username, password: $password, age: $age}) RETURN u",
            {
                name: req.body.name,
                lname: req.body.lastname,
                username: req.body.username,
                password: req.body.password,
                age: req.body.age
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
};

const updateUser = (req, res) => {
    const updateFields = req.body.update_fields;

    let setClause = "";
    const params = {};

    // SET clause with parameters
    Object.keys(updateFields).forEach((key, index) => {
        setClause += `u.${key} = $${key}`;
        params[key] = updateFields[key];

        if (index < Object.keys(updateFields).length - 1) {
            setClause += ", ";
        }
    });

    response = session
        .run(
            `MATCH (u:USER {username: $username}) SET ${setClause} RETURN u`,
            { username: req.body.username, ...params}
        )
        .catch((error) => {
            res.status(500).json(error);
        });
    
    response.then(parser.parse)
    .then(parsed =>{
        if(!parsed[0]){
            res.status(404).json(parsed[0]);
        }
        res.status(404).json({error:"this user does not exist"});
    })
    .catch(function(parseError) {
        res.status(500).json(parseError)
    });
    
};

const getOrders = (req,res) =>  {

    session.run(
        "MATCH (:USER{username: $UNAME})-[:MADE]->(o:ORDEN)-[h:HAS]->(g:GAME)  return o as ORDER,h.amount as BOUGHT,g as GAME",
        {UNAME: req.query.username})
    .then(response => {
        parsed = parser.parse(response);
        if (parsed.length == 0) {
            res.status(404).json({error:"user has no orders"})
        }else{
        const groupedOrders = {};
        parsed.forEach(item => {
            const orderID = item.ORDER.id;
            if (!groupedOrders[orderID]) {
                // Initialize order details
                groupedOrders[orderID] = {
                    details: item.ORDER,
                    items: [],
                    total: 0
                };
            }
            // Add game to the items array
            groupedOrders[orderID].items.push(item.GAME);
            // Calculate and update total
            groupedOrders[orderID].total += (item.BOUGHT * item.GAME.precio);
        });

        // Convert groupedOrders object to array
        const groupedOrdersArray = Object.values(groupedOrders);

        res.status(200).json(groupedOrdersArray);
        }
    }).catch(error => {
        console.error(error);
        res.status(500).json(error);
    });
}

const makeOrder = async(req,res) =>{
    const UNAME = req.query.username;
    const { storeID, date, type, paymentType, games } = req.body;

    // Start a transaction
    const transaction = session.beginTransaction();

    // Initialize a flag to track if there is sufficient stock for all games
    let hasEnoughStockForAllGames = true;

    // Iterate through the games array to check stock for each game
    for (const game of games) {
        const gameID = game.gameID;
        const gameboughtAmount = game.boughtAmount;

        // Check if there is sufficient stock for the current game
        const result = await transaction.run(
            "MATCH (s:TIENDA)-[r:SALES]->(g:GAME) WHERE ID(s) = $storeID AND ID(g) = $gameID " +
            "RETURN r.stock >= $boughtAmount AS hasEnoughStock",
            {
                storeID: Number(storeID),
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
        "MATCH (u:USER {username: $username}) " +
        "MATCH (s:TIENDA) WHERE ID(s) = $storeID " +
        "CREATE (o:ORDEN {fecha: $date, tipoOrden: $type, tipoPago: $paymentType}) " +
        "CREATE (u)-[:MADE]->(o) " +
        "CREATE (o)-[:RESOLVED_BY]->(s) " +
        "RETURN o",
        {
            username: UNAME,
            storeID: Number(storeID),
            date: date,
            type: type,
            paymentType: paymentType
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
                "MATCH (o:ORDEN) WHERE ID(o) = $orderID " +
                "MATCH (g:GAME) WHERE ID(g) = $gameID " +
                "CREATE (o)-[:HAS {amount: $boughtAmount}]->(g) " +
                "WITH g "+
                "MATCH (s:TIENDA)-[r:SALES]->(g) " +
                "SET r.stock = r.stock - $boughtAmount",
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

module.exports = {login,signup,updateUser,makeOrder,getOrders}