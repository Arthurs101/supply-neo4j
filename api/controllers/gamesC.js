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
//Get the stores where the game can be bought
const getGamseStores = async(req,res) => {
    const { gameId } = req.params;
    try {
        // Obtener los parámetros de paginación del query string
        const page = parseInt(req.query.page) || 1; // inicio página 1 
        const pageSize = parseInt(req.query.pageSize) || 20; // página inicial con 20 juegos

        // Calcular el índice de inicio y fin para la paginación
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        // Consulta Cypher para obtener los juegos de la página actual
        const result = await session.run(
            "MATCH (s:TIENDA)-[:SALES]->(g:GAME) WHERE ID(g) = $gameId RETURN s SKIP toInteger($skip) LIMIT toInteger($limit)",
            { gameId: parseInt(gameId) ,skip, limit }
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

//Get the stores where the game can be bought
const getGamseSuppliers = async(req,res) => {
    const { gameId } = req.params;
    try {
        // Obtener los parámetros de paginación del query string
        const page = parseInt(req.query.page) || 1; // inicio página 1 
        const pageSize = parseInt(req.query.pageSize) || 20; // página inicial con 20 juegos

        // Calcular el índice de inicio y fin para la paginación
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        // Consulta Cypher para obtener los juegos de la página actual
        const result = await session.run(
            "MATCH (s:SUPPLIER)-[:SUPPLIES]->(g:GAME) WHERE ID(g) = $gameId RETURN s SKIP toInteger($skip) LIMIT toInteger($limit)",
            { gameId: parseInt(gameId) ,skip, limit }
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

const getGameSearch = async (req, res) => {
    const { gameName } = req.params;
    try {
        // Obtener los parámetros de paginación del query string
        const page = parseInt(req.query.page) || 1; // inicio página 1 
        const pageSize = parseInt(req.query.pageSize) || 20; // página inicial con 20 juegos

        // Calcular el índice de inicio y fin para la paginación
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        // Consulta Cypher para obtener los juegos de la página actual
        const result = await session.run(
            "MATCH (g:GAME) WHERE g.titulo CONTAINS $gameName RETURN g SKIP toInteger($skip) LIMIT toInteger($limit)",
            { gameName ,skip, limit }
        );

        // Parsear y devolver los resultados
        const parsedResult = parser.parse(result);
        console.log("Juegos encontrados en la página", page + ":", parsedResult);
        res.status(200).json(parsedResult);

    } catch (error) {
        console.error("Error al obtener los juegos:", error.message);
        res.status(500).json({ error: "Error al obtener los juegos: " + error.message });
    }
}

module.exports = { newGame, editGamefields, deleteGamefields, deleteGame, getGames , getGamseStores , getGamseSuppliers , getGameSearch};
