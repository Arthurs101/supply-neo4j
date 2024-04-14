const session = require('../databaseDriver');
var parser = require('parse-neo4j');

//add a new platfor to database - fields required: nombre, alias
const newPlatform = async (req, res) => {
    try {
        const { nombre, alias } = req.body;

        if (!nombre || !alias) {
            return res.status(400).json({ error: "Falta uno o más campos obligatorios." });
        }

        const result = await session.run(
            "CREATE (p:PLATFORM {nombre: $nombre, alias: $alias}) RETURN p",
            { nombre, alias }
        );

        const parsedResult = parser.parse(result);
        console.log("Nueva plataforma creada:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);
    }
    catch (error) {
        console.error("Error al agregar una nueva plataforma:", error.message);
        res.status(500).json({ error: "Error al agregar una nueva plataforma: " + error.message });
    }
};

//edit platform fields
const editPlatformfields = async (req, res) => {
    try{
        const { platformId } = req.params;
        const { nombre, alias } = req.body;

        let updateFields = {};
        if (nombre) updateFields.nombre = nombre;
        if (alias) updateFields.alias = alias;

        if(Object.keys(updateFields).length === 0){
            console.error("No se proporcionaron campos para editar.");
            return res.status(400).json({ error: "No se proporcionaron campos para editar." });
        }

        const query = `
            MATCH (p:PLATFORM) WHERE ID(p) = $platformId
            SET ${Object.keys(updateFields).map(key => `p.${key} = $${key}`).join(', ')}
            RETURN p
        `;

        const result = await session.run(query, { platformId: parseInt(platformId), ...updateFields });

        if(result.records.length === 0){
            console.error("No se encontró la plataforma para editar sus campos.");
            return res.status(404).json({ error: "No se encontró la plataforma para editar sus campos." });
        }

        const parsedResult = parser.parse(result);
        console.log("Campos de la plataforma editados con exito:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);
    } catch (error) {
        console.error("Error al editar campos de la plataforma:", error.message);
        res.status(500).json({ error: "Error al editar campos de la plataforma: " + error.message });
    }
};

//delete a platformfields from database
const deletePlatformfields = async (req, res) => {
    try{
        const { platformId } = req.params;
        const {fields } = req.body;

        if (!fields || fields.length === 0) {
            return res.status(400).json({ error: "Falta uno o más campos obligatorios." });
        }

        const deleteClause = `REMOVE ${fields.map(field => `p.${field}`).join(', ')}`;

        const result = await session.run(
            `MATCH (p:PLATFORM) WHERE ID(p) = $platformId
            ${deleteClause}
            RETURN p`,
            { platformId: parseInt(platformId) }
        );

        if(result.records.length === 0){
            console.error("No se encontró la plataforma para eliminar sus campos.");
            return res.status(404).json({ error: "No se encontró la plataforma para eliminar sus campos." });
        }

        const parsedResult = parser.parse(result);
        console.log("Campos de la plataforma eliminados con exito:", parsedResult[0]);
        res.status(200).json(parsedResult);
    }
    catch (error) {
        console.error("Error al eliminar campos de la plataforma:", error.message);
        res.status(500).json({ error: "Error al eliminar campos de la plataforma: " + error.message });
    }
};

//delete a platform from database
const deletePlatform = async (req, res) => {
    try {
        const { platformId } = req.params;

        const result = await session.run(
            `MATCH (p:PLATFORM) WHERE ID(p) = $platformId
            DETACH DELETE p`,
            { platformId: parseInt(platformId) }
        );

        // Verificar si se eliminó correctamente al menos un nodo
        if (result.summary.counters.nodesDeleted === 0) {
            console.error("No se encontró la plataforma para eliminar.");
            return res.status(404).json({ error: "No se encontró la plataforma para eliminar." });
        }

        console.log("Plataforma eliminada con éxito.");
        res.status(200).json({ message: "Plataforma eliminada con éxito." });
    } catch (error) {
        console.error("Error al eliminar la plataforma:", error.message);
        res.status(500).json({ error: "Error al eliminar la plataforma: " + error.message });
    }
};


//get platforms
const getPlatforms = async (req, res) => {
    try {
        const result = await session.run(
            `MATCH (p:PLATFORM)
            RETURN p`
        );

        const parsedResult = parser.parse(result);
        res.status(200).json(parsedResult);
    } catch (error) {
        console.error("Error al obtener las plataformas:", error.message);
        res.status(500).json({ error: "Error al obtener las plataformas: " + error.message });
    }
};

module.exports = { newPlatform, editPlatformfields, deletePlatformfields, deletePlatform, getPlatforms };