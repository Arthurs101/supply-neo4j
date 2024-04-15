const session = require('../databaseDriver');
var parser = require('parse-neo4j');
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

        const parsedResult = parser.parse(result);
        console.log("Nuevo juego creado:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);

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
        const parsedResult = parser.parse(result);
        console.log("Campos del juego editados con éxito:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);

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
            console.error("No se proporcionaron campos para eliminar.");
            return res.status(400).json({error: "Falta uno o más campos obligatorios."});
        } 
        
        // Construir la parte de la consulta Cypher para eliminar los campos especificados
        const deleteClause = `REMOVE ${fields.map(field => `g.${field}`).join(', ')}`;

        // Construir y ejecutar la consulta Cypher para actualizar el juego
        const result = await session.run(
            `MATCH (g:GAME) WHERE ID(g) = $gameId
             ${deleteClause}
             RETURN g`,
            { gameId: parseInt(gameId) }
        );
        
        // Verificar si se encontró un juego para eliminar
        if (result.records.length === 0) {
            return res.status(404).json({ error: "No se encontró el juego para eliminar." });
        }

        // Extraer los datos del resultado
        const parsedResult = parser.parse(result);
        console.log("Campos del juego eliminados con éxito:", parsedResult);
        res.status(200).json(parsedResult);
    
    }
    catch (error) {
        // Manejar cualquier error que ocurra durante el proceso
        res.status(500).json({ error: "Error al eliminar campos del juego: " + error.message });
    }
};

const deleteGame = async (req, res) => {
    try {
        const { gameId } = req.params;

        if (!gameId) {
            return res.status(400).json({ error: "Falta el ID del juego." });
        }

        const result = await session.run(
            "MATCH (g:GAME) WHERE ID(g) = $gameId DELETE g",
            { gameId: parseInt(gameId) }
        );

        if (result.summary.counters._stats.nodesDeleted === 0) {
            return res.status(404).json({ error: "No se encontró el juego para eliminar." });
        }

        // Modifica el JSON de respuesta para incluir el mensaje
        const parsedResult = parser.parse(result);
        const response = { message: "Juego eliminado correctamente status 200", data: parsedResult };
        console.log("Juego eliminado con éxito:", response);
        res.status(200).json(response);

    } catch (error) {
        console.error("Error al eliminar el juego:", error.message);
        res.status(500).json({ error: "Error al eliminar el juego: " + error.message });
    }
};

//Get Games
const getGames = async (req, res) => {
    try {
        // Obtener los parámetros de paginación del query string
        const page = parseInt(req.query.page) || 1; // inicio página 1 
        const pageSize = parseInt(req.query.pageSize) || 20; // página inicial con 20 juegos

        // Calcular el índice de inicio y fin para la paginación
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        // Consulta Cypher para obtener los juegos de la página actual
        const result = await session.run(
            "MATCH (g:GAME) RETURN g SKIP toInteger($skip) LIMIT toInteger($limit)",
            { skip, limit }
        );

        // Parsear y devolver los resultados
        const parsedResult = parser.parse(result);
        console.log("Juegos encontrados en la página", page + ":", parsedResult);
        res.status(200).json(parsedResult);

    } catch (error) {
        console.error("Error al obtener los juegos:", error.message);
        res.status(500).json({ error: "Error al obtener los juegos: " + error.message });
    }
};

//get game by id
const getGameById = async (req, res) => {
    try {
        const { gameId } = req.params;

        if (!gameId) {
            return res.status(400).json({ error: "Falta el ID del juego." });
        }

        const result = await session.run(
            "MATCH (g:GAME) WHERE ID(g) = $gameId RETURN g",
            { gameId: parseInt(gameId) }
        );

        // Parsear y enviar el resultado al cliente
        const parsedResult = parser.parse(result);
        res.status(200).json(parsedResult);

    } catch (error) {
        console.error("Error al obtener el juego por ID:", error.message);
        res.status(500).json({ error: "Error al obtener el juego por ID: " + error.message });
    }
};


//Add a genre to a game
const addGenreToGame = async (req, res) => {
    try {
        const { gameId, genreId } = req.body;

        // Verificar si se proporcionan tanto el ID del juego como el ID del género
        if (!gameId || !genreId) {
            return res.status(400).json({ error: "Falta el ID del juego o del género." });
        }

        // Verificar si el juego y el género existen en la base de datos
        const gameExistsResult = await session.run(
            "MATCH (g:GAME) WHERE ID(g) = $gameId RETURN g",
            { gameId: parseInt(gameId) }
        );
        const genreExistsResult = await session.run(
            "MATCH (g:GENRE) WHERE ID(g) = $genreId RETURN g",
            { genreId: parseInt(genreId) }
        );

        if (gameExistsResult.records.length === 0) {
            return res.status(404).json({ error: "El juego no existe." });
        }

        if (genreExistsResult.records.length === 0) {
            return res.status(404).json({ error: "El género no existe." });
        }

        // Crear la relación entre el juego y el género
        const result = await session.run(
            "MATCH (g:GAME), (genre:GENRE) WHERE ID(g) = $gameId AND ID(genre) = $genreId " +
            "MERGE (g)-[:CATEGORIZED_AS]->(genre) RETURN g, genre",
            { gameId: parseInt(gameId), genreId: parseInt(genreId) }
        );

        // Parsear y devolver el resultado
        const parsedResult = parser.parse(result);
        res.status(200).json(parsedResult);
    } catch (error) {
        console.error("Error al agregar el género al juego:", error.message);
        res.status(500).json({ error: "Error al agregar el género al juego: " + error.message });
    }
};



//delete relationship beetwen game and genre
const removeGenreFromGame = async (req, res) => {
    try {
        const { gameId, genreId } = req.body;

        // Verificar si se proporcionan tanto el ID del juego como el ID del género
        if (!gameId || !genreId) {
            return res.status(400).json({ error: "Falta el ID del juego o del género." });
        }

        // Verificar si la relación entre el juego y el género existe
        const relationExistsResult = await session.run(
            "MATCH (g:GAME)-[rel:CATEGORIZED_AS]->(genre:GENRE) WHERE ID(g) = $gameId AND ID(genre) = $genreId RETURN rel",
            { gameId: parseInt(gameId), genreId: parseInt(genreId) }
        );

        if (relationExistsResult.records.length === 0) {
            return res.status(404).json({ error: "La relación entre el juego y el género no existe." });
        }

        // Eliminar la relación entre el juego y el género
        await session.run(
            "MATCH (g:GAME)-[rel:CATEGORIZED_AS]->(genre:GENRE) WHERE ID(g) = $gameId AND ID(genre) = $genreId DELETE rel",
            { gameId: parseInt(gameId), genreId: parseInt(genreId) }
        );

        res.status(200).json({ message: "Relación entre el juego y el género eliminada correctamente." });
    } catch (error) {
        console.error("Error al eliminar la relación entre el juego y el género:", error.message);
        res.status(500).json({ error: "Error al eliminar la relación entre el juego y el género: " + error.message });
    }
};

//get relationship between game and genre
const getGenresOfGame = async (req, res) => {
    try {
        const { gameId } = req.params;

        // Verificar si se proporciona el ID del juego
        if (!gameId) {
            return res.status(400).json({ error: "Falta el ID del juego." });
        }

        // Consultar los géneros asociados al juego
        const result = await session.run(
            "MATCH (g:GAME)-[:CATEGORIZED_AS]->(genre:GENRE) WHERE ID(g) = $gameId RETURN genre",
            { gameId: parseInt(gameId) }
        );

        // Verificar si se encontraron géneros asociados al juego
        if (result.records.length === 0) {
            return res.status(404).json({ error: "No se encontraron géneros asociados al juego." });
        }

        // Parsear y devolver los géneros asociados al juego
        const parsedResult = parser.parse(result);
        res.status(200).json(parsedResult);
    } catch (error) {
        console.error("Error al obtener los géneros asociados al juego:", error.message);
        res.status(500).json({ error: "Error al obtener los géneros asociados al juego: " + error.message });
    }
};



module.exports = { newGame, editGamefields, deleteGamefields, deleteGame, getGames, addGenreToGame, removeGenreFromGame, getGenresOfGame, getGameById};
