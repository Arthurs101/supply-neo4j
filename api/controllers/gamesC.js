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
    try {
        const { gameId } = req.params;
        const { titulo, publicacion, descripcion, portada, rating, precio, screenshots } = req.body;

        let updateFields = {};
        if (titulo) updateFields.titulo = titulo;
        if (publicacion) updateFields.publicacion = publicacion;
        if (descripcion) updateFields.descripcion = descripcion;
        if (portada) updateFields.portada = portada;
        if (rating) updateFields.rating = rating;
        if (precio) updateFields.precio = precio;
        if (screenshots) updateFields.screenshots = screenshots;

        // Verificar si no se proporciona ningún campo para editar
        if (Object.keys(updateFields).length === 0) {
            console.error("No se proporcionaron campos para editar.");
            return res.status(400).json({ error: "No se proporcionaron campos para editar." });
        }

        const query = `
            MATCH (g:GAME) WHERE ID(g) = $gameId
            SET ${Object.keys(updateFields).map(key => `g.${key} = $${key}`).join(', ')}
            RETURN g
        `;

        // Ejecutar consulta
        const result = await session.run(query, { gameId: parseInt(gameId), ...updateFields });

        // Verificar si se editó correctamente algún campo
        if (result.records.length === 0) {
            console.error("No se encontró el juego para editar.");
            return res.status(404).json({ error: "No se encontró el juego para editar." });
        }

        // Se editaron los campos correctamente
        console.log("Campos del juego editados con éxito:", result.records[0].get('g').properties);
        res.status(200).json(result.records[0].get('g').properties);
    } catch (error) {
        // Si hay un error
        console.error("Error al editar campos del juego:", error.message);
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
        const deleteClause = `REMOVE ${fields.map(field => `g.${field}`).join(', ')}`;

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


const deleteGame = async(req, res) => {
    try {
        const { gameId} = req.params;

        if(!gameId){
            return res.status(400).json({error: "Falta el ID del juego."});
        }

        const result = await session.run(
            "MATCH (g:GAME) WHERE ID(g) = $gameId DELETE g",
            {gameId: parseInt(gameId)}
        );

        res.status(200).json({msg: "Juego eliminado con éxito."});

     } catch(error){
        res.status(500).json({error: "Error al eliminar el juego: " + error.message});
     }
};


module.exports = { newGame, editGamefields, deleteGamefields, deleteGame };

