const session = require('../databaseDriver');
var parser = require('parse-neo4j');

//add a new genre to the database
const newGenre = async (req, res) => {
    try {
        const { titulo, alias, img } = req.body;

        if (!titulo || !alias || !img) {
            return res.status(400).json({ error: "Falta uno o más campos obligatorios." });
        }

        const result = await session.run(
            "CREATE (g:GENRE {titulo: $titulo, alias: $alias, img: $img}) RETURN g",
            { titulo, alias, img }
        );

        const parsedResult = parser.parse(result);
        console.log("Nuevo genero creado:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);
    }
    catch (error) {
        console.error("Error al agregar un nuevo genero:", error.message);
        res.status(500).json({ error: "Error al agregar un nuevo genero: " + error.message });
    }
};

//edit genre fields
const editGenrefields = async (req, res) => {
    try{
        const { genreId } = req.params;
        const { titulo, alias, img } = req.body;

        let updateFields = {};
        if (titulo) updateFields.titulo = titulo;
        if (alias) updateFields.alias = alias;
        if (img) updateFields.img = img;

        if(Object.keys(updateFields).length === 0){
            console.error("No se proporcionaron campos para editar.");
            return res.status(400).json({ error: "No se proporcionaron campos para editar." });
        }

        const query = `
            MATCH (g:GENRE) WHERE ID(g) = $genreId
            SET ${Object.keys(updateFields).map(key => `g.${key} = $${key}`).join(', ')}
            RETURN g
        `;

        const result = await session.run(query, { genreId: parseInt(genreId), ...updateFields });

        if(result.records.length === 0){
            console.error("No se encontró el genero para editar sus campos.");
            return res.status(404).json({ error: "No se encontró el genero para editar sus campos." });
        }

        const parsedResult = parser.parse(result);
        console.log("Campos del genero editados con exito:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);
    } catch (error) {
        console.error("Error al editar campos del genero:", error.message);
        res.status(500).json({ error: "Error al editar campos del genero: " + error.message });
    }
};

//delete genre fields
const deleteGenrefields = async (req, res) => {
    try{
        const { genreId } = req.params;
        const { fields } = req.body;

        if(!fields || fields.length === 0){
            console.error("No se proporcionaron campos para eliminar.");
            return res.status(400).json({ error: "No se proporcionaron campos para eliminar." });
        }

        const deleteClause = `REMOVE ${fields.map(field => `g.${field}`).join(', ')}`;

        const result = await session.run(
            `MATCH (g:GENRE) WHERE ID(g) = $genreId
            ${deleteClause}
            RETURN g`,
            { genreId: parseInt(genreId) }
        );

        if(result.records.length === 0){
            console.error("No se encontró el genero para eliminar sus campos.");
            return res.status(404).json({ error: "No se encontró el genero para eliminar sus campos." });
        }

        const parsedResult = parser.parse(result);
        console.log("Campos del genero eliminados con exito:", parsedResult[0]);
        res.status(200).json(parsedResult);
    }
    catch (error) {
        console.error("Error al eliminar campos del genero:", error.message);
        res.status(500).json({ error: "Error al eliminar campos del genero: " + error.message });
    }
};

const deleteGenre = async (req, res) => {
    try {
        const { genreId } = req.params;

        if(!genreId){
            console.error("No se proporcionó un id de genero.");
            return res.status(400).json({ error: "No se proporcionó un id de genero." });
        }

        const result = await session.run(
            `MATCH (g:GENRE) WHERE ID(g) = $genreId
            DETACH DELETE g`,
            { genreId: parseInt(genreId) }
        );

        if(result.summary.counters._stats.nodesDeleted === 0){
            console.error("No se encontró el genero para eliminar.");
            return res.status(404).json({ error: "No se encontró el genero para eliminar." });
        }

        const parsedResult = parser.parse(result);
        const response = {message: "Genero eliminado con exito", genero: parsedResult[0]};
        console.log("Genero eliminado con exito:", parsedResult);
        res.status(200).json(response);
    } catch (error) {
        console.error("Error al eliminar genero:", error.message);
        res.status(500).json({ error: "Error al eliminar genero: " + error.message });
    }
};

//Get all genres
const getGenres = async (req, res) => {
    try {
        const result = await session.run(
            "MATCH (g:GENRE) RETURN g"
        );

        const parsedResult = parser.parse(result);
        console.log("Generos encontrados:", parsedResult);
        res.status(200).json(parsedResult);
    } catch (error) {
        console.error("Error al obtener generos:", error.message);
        res.status(500).json({ error: "Error al obtener generos: " + error.message });
    }
};

module.exports = { newGenre, editGenrefields, deleteGenrefields, deleteGenre, getGenres }
    