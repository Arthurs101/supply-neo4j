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

        res.status(200).json(result.records[0].get('g'));
    } catch (error) {
        res.status(500).json({ error: "Error al agregar un nuevo juego: " + error.message });
    }
};

//edit game
const editGame = async (req, res) => {
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

            //Ejecutar consulta
        const result = await session.run(query, {gameId, ...updateFields});
        res.status(200).json(result.records[0].get('g'));
    } catch (error) {
        // Maneja cualquier error que ocurra durante el proceso
        res.status(500).json({ error: "Error al editar el juego: " + error.message });
    }
};

module.exports = { newGame, editGame };

