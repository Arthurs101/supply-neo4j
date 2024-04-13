const session = require('../databaseDriver');

//add a new game to the database
const newGame = async (req, res) => {
    try {
        const { titulo, publicacion, descripcion, portada, rating, precio, screenshots } = req.body;

        if (!titulo || !publicacion || !descripcion || !portada || !rating || !precio || !screenshots) {
            return res.status(400).json({ error: "Falta uno o más campos obligatorios." });
        }

        const result = await session.run(
            "CREATE (g:GAME {titulo: $titulo, publicacion: $publicacion, descripcion: $descripcion, portada: $portada, rating: $rating, precio: $precio, screenshots: $screenshots}) RETURN g",
            { titulo, publicacion, descripcion, portada, rating, precio, screenshots }
        );

        console.log("Nuevo juego creado:", result.records[0].get('g'));
        res.status(200).json(result.records[0].get('g'));
    } catch (error) {
        console.error("Error al agregar un nuevo juego:", error.message);
        res.status(500).json({ error: "Error al agregar un nuevo juego: " + error.message });
    }
};


//edit game fields
const editGamefields = async (req, res) => {
    try{
        const {gameId} = req.params;
        const { titulo, publicacion, descripcion, portada, rating, precio, screenshots } = req.body;

        let updateFields = {};
        if (titulo) updateFields.titulo = titulo;
        if (publicacion) updateFields.publicacion = publicacion;
        if (descripcion) updateFields.descripcion = descripcion;
        if (portada) updateFields.portada = portada;
        if (rating) updateFields.rating = rating;
        if (precio) updateFields.precio = precio;
        if (screenshots) updateFields.screenshots = screenshots;

        const query = `MATCH (g:GAME) WHERE ID(g) = $gameId
        SET ${Object.keys(updateFields).map(key => `g.${key} = $${key}`).join(', ')}
            RETURN g`;

            //Ejecutamos consulta
        const result = await session.run(query, {gameId, ...updateFields});
        res.status(200).json(result.records[0].get('g'));
    } catch (error) {
        // si hay error
        res.status(500).json({ error: "Error al editar campos del juego: " + error.message });
    }
};

//delete game fields
const deleteGamefields = async (req, res) =>{
    try{
        const {gameId} = req.params;
        const { fields } = req.body;

        if (!fields || fields.length === 0){
            return res.status(400).json({error: "Falta uno o más campos obligatorios."});
        } // Construir la parte de la consulta Cypher para eliminar los campos especificados
        const deleteClause = fields.map(field => `REMOVE g.${field}`).join(', ');

        // Construir y ejecutar la consulta Cypher para actualizar el juego
        const result = await session.run(
            `MATCH (g:GAME) WHERE ID(g) = $gameId
             ${deleteClause}
             RETURN g`,
            { gameId: parseInt(gameId) }
        );

        // Devolver el juego actualizado como respuesta
        res.status(200).json(result.records[0].get('g'));
    }
    catch (error) {
        // Manejar cualquier error que ocurra durante el proceso
        res.status(500).json({ error: "Error al eliminar campos del juego: " + error.message });
    }
};


module.exports = { newGame, editGamefields, deleteGamefields };

