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
const signup = (req, res) => {
    session
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
        .then((response) => {
            res.status(200).json(response.records);
        })
        .catch((error) => {
            res.status(500).json(error);
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

    session
        .run(
            `MATCH (u:USER {username: $username}) SET ${setClause} RETURN u`,
            { username: req.body.username, ...params}
        )
        .then((response) => {
            res.status(200).json(response.records);
        })
        .catch((error) => {
            res.status(500).json(error);
        });
};


module.exports = {login,signup,updateUser}