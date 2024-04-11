const session = require('../databaseDriver')

//perform a login , looking up for the username and password
const login = async (req, res) => {
    session
        .run(
            "MATCH (u:USER {username: $username, password: $password}) RETURN u", 
            { username: req.body.username, password: req.body.password } 
        )
        .then((response) => {
            res.status(200).json(response.records);
        })
        .catch((err) => res.status(500).json(err)); 
};

module.exports = {login}