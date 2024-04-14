const session = require('../databaseDriver');
var parser = require('parse-neo4j');

//add a new tag to the database
const newTag = async (req, res) => {
    try {
        const { titulo, alias, img } = req.body;

        if (!titulo || !alias || !img) {
            return res.status(400).json({ error: "Falta uno o más campos obligatorios." });
        }

        const result = await session.run(
            "CREATE (t:TAG {titulo: $titulo, alias: $alias, img: $img}) RETURN t",
            { titulo, alias, img }
        );

        const parsedResult = parser.parse(result);
        console.log("Nuevo tag creado:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);
    }
    catch (error) {
        console.error("Error al agregar un nuevo tag:", error.message);
        res.status(500).json({ error: "Error al agregar un nuevo tag: " + error.message });
    }
};



//edit tag fields
const editTagfields = async (req, res) => {
    try{
        const { tagId } = req.params;
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
            MATCH (t:TAG) WHERE ID(t) = $tagId
            SET ${Object.keys(updateFields).map(key => `t.${key} = $${key}`).join(', ')}
            RETURN t
        `;

        const result = await session.run(query, { tagId: parseInt(tagId), ...updateFields });

        if(result.records.length === 0){
            console.error("No se encontró el tag para editar sus campos.");
            return res.status(404).json({ error: "No se encontró el tag para editar sus campos." });
        }

        const parsedResult = parser.parse(result);
        console.log("Campos del tag editados con exito:", parsedResult[0]);
        res.status(200).json(parsedResult[0]);
    } catch (error) {
        console.error("Error al editar un tag:", error.message);
        res.status(500).json({ error: "Error al editar un tag: " + error.message });
    }
};

//delete tag fields
const deleteTagfields = async (req, res) => {
    try{
        const { tagId } = req.params;
        const { fields } = req.body;

        if(!fields || fields.length === 0){
            console.error("No se proporcionaron campos para eliminar.");
            return res.status(400).json({ error: "No se proporcionaron campos para eliminar." });
        }

        const deleteClause = `REMOVE ${fields.map(field => `t.${field}`).join(', ')}`;

        const result = await session.run(
            `MATCH (t:TAG) WHERE ID(t) = $tagId
            ${deleteClause}
            RETURN t`,
            { tagId: parseInt(tagId) }
        );

        if (result.records.length === 0){
            console.error("No se encontró el tag para eliminar campos.");
            return res.status(404).json({ error: "No se encontró el tag para eliminar campos." });
        }

        const parsedResult = parser.parse(result);
        console.log("Campos del tag eliminados con éxito:", parsedResult[0]);
        res.status(200).json(parsedResult);
    }
    catch (error) {
        console.error("Error al eliminar campos del tag:", error.message);
        res.status(500).json({ error: "Error al eliminar campos del tag: " + error.message });
    }
};

const deleteTag = async (req, res) => {
    try {
        const { tagId } = req.params;

        if (!tagId) {
            console.error("No se proporcionó el ID del tag a eliminar.");
            return res.status(400).json({ error: "No se proporcionó el ID del tag a eliminar." });
        }

        const result = await session.run(
            `MATCH (t:TAG) WHERE ID(t) = $tagId
            DETACH DELETE t`,
            { tagId: parseInt(tagId) }
        );

        // Verificar si se eliminó correctamente al menos un nodo
        if (result.summary.counters.nodesDeleted === 0) {
            console.error("No se encontró el tag para eliminar.");
            return res.status(404).json({ error: "No se encontró el tag para eliminar." });
        }

        const parsedResult = parser.parse(result);
        const response = { message: "Tag eliminado con éxito status 200", data: parsedResult };
        console.log("Tag eliminado con éxito.", response);
        res.status(200).json(response);
    } catch (error) {
        console.error("Error al eliminar el tag:", error.message);
        res.status(500).json({ error: "Error al eliminar el tag: " + error.message });
    }
}

//GET TAGS
const getTags = async (req, res) => {
    try {
        const result = await session.run(
            "MATCH (t:TAG) RETURN t"
        );

        const parsedResult = parser.parse(result);
        console.log("Tags encontrados:", parsedResult);
        res.status(200).json(parsedResult);
    } catch (error) {
        console.error("Error al obtener los tags:", error.message);
        res.status(500).json({ error: "Error al obtener los tags: " + error.message });
    }
};

module.exports = { newTag, editTagfields, deleteTagfields, deleteTag, getTags }