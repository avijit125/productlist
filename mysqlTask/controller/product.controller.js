const pool = require("../db/db.js")


const getAllProducts = async (req, res) => {
    const {page = 1, limit = 10, orderBy = "createdAt", orderDir = "desc", searchBy = ""} = req.query;
    let {searchFields = []} = req.query;
    searchFields = typeof searchFields === 'string' ? searchFields.split(',') : searchFields;

    const offset = (page - 1) * limit;

    // Start with an empty search clause
    let searchClause = "";

    if (searchBy) {
        if (searchFields.length === 0) {
            // If searchFields is empty, prepare to search in all columns
            pool.query(`SHOW COLUMNS FROM ProductV2`, (err, columns) => {
                if (err) {
                    res.status(500).json({ message: "Error fetching column names: " + err.message });
                    return;
                }

                // Map column names for the search clause
                searchFields = columns.map(column => column.Field);
                searchClause = buildSearchClause(searchFields, searchBy);

                // Proceed with querying the database after building the search clause
                executeQueries(searchClause, page, limit, orderBy, orderDir, offset, res);
            });
        } else {
            // If specific searchFields are provided, use them for the search clause
            searchClause = buildSearchClause(searchFields, searchBy);
            executeQueries(searchClause, page, limit, orderBy, orderDir, offset, res);
        }
    } else {
        // No searchBy provided, proceed without a search clause
        executeQueries(searchClause, page, limit, orderBy, orderDir, offset, res);
    }
};

function buildSearchClause(searchFields, searchBy) {
    return "WHERE " + searchFields
        .map(field => `${field} LIKE '%${searchBy}%'`)
        .join(' OR ');
}

function executeQueries(searchClause, page, limit, orderBy, orderDir, offset, res) {
    const countQuery = `
        SELECT COUNT(*) AS total
        FROM ProductV2
        ${searchClause}
    `;

    const query = `
        SELECT *
        FROM ProductV2
        ${searchClause}
        ORDER BY ${orderBy} ${orderDir}
        LIMIT ${limit}
        OFFSET ${offset}
    `;

    pool.query(countQuery, (err, resultCount) => {
        if (err) {
            res.status(400).json({ message: err.message });
            return;
        }

        const totalCount = resultCount[0].total;
        const totalPages = Math.ceil(totalCount / limit);

        pool.query(query, (err, results) => {
            if (err) {
                res.status(400).json({ message: err.message });
                return;
            }

            res.status(200).json({
                currentPage: parseInt(page),
                pageSize: parseInt(limit),
                totalPages: totalPages,
                totalCount: totalCount,
                data: results
            });
        });
    });
}



module.exports = getAllProducts