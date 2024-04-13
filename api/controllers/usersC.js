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
        .then(parsed =>{
            res.status(200).json(parsed[0]);
        })
        .catch(function(parseError) {
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
        res.status(200).json(parsed[0]);
    })
    .catch(function(parseError) {
        console.log(parseError);
    });
    
};


module.exports = {login,signup,updateUser}